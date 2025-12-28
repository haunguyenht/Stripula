/**
 * Proxy Controller
 * Handles proxy testing operations
 * 
 * Note: This controller tests individual proxies without requiring a global ProxyManagerService.
 * Per-gateway proxy configuration is managed through GatewayController.
 */
import { Proxy } from '../domain/Proxy.js';
import { ProxyAgentFactory } from '../infrastructure/http/ProxyAgentFactory.js';
import axios from 'axios';

export class ProxyController {
    constructor(options = {}) {
        this.proxyFactory = new ProxyAgentFactory();
    }

    /**
     * POST /api/proxy/check
     * Test if a proxy is working by making an actual request through it
     * Also detects if proxy is static by making 2 requests and comparing IPs
     */
    async checkProxy(req, res) {
        try {
            const { proxy } = req.body;

            if (!proxy) {
                return res.status(400).json({ success: false, message: 'Proxy is required' });
            }

            // Create Proxy entity from the parsed proxy object
            const proxyEntity = new Proxy({
                type: proxy.type || 'http',
                host: proxy.host,
                port: proxy.port,
                username: proxy.username,
                password: proxy.password
            });

            // Test the proxy
            const result = await this._testProxy(proxyEntity);

            if (result.success) {
                // Get IP twice to detect if rotating
                const { ip, isStatic } = await this._detectStaticProxy(proxyEntity);

                res.json({ 
                    success: true, 
                    message: isStatic 
                        ? `Static proxy detected (${result.responseTime})` 
                        : `Proxy working (${result.responseTime})`,
                    responseTime: result.responseTime,
                    ip,
                    isStatic
                });
            } else {
                res.json({ 
                    success: false, 
                    message: result.error || 'Proxy connection failed'
                });
            }

        } catch (error) {

            res.json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/proxy/check-stripe
     * Test if a proxy can reach Stripe's API
     * Some proxies block financial/payment APIs like Stripe
     */
    async checkStripeAccess(req, res) {
        try {
            const { proxy } = req.body;

            if (!proxy) {
                return res.status(400).json({ success: false, message: 'Proxy is required' });
            }

            // Create Proxy entity from the parsed proxy object
            const proxyEntity = new Proxy({
                type: proxy.type || 'http',
                host: proxy.host,
                port: proxy.port,
                username: proxy.username,
                password: proxy.password
            });

            const result = await this._testStripeAccess(proxyEntity);

            if (result.success) {
                res.json({ 
                    success: true, 
                    message: `Stripe accessible (${result.responseTime})`,
                    responseTime: result.responseTime
                });
            } else {
                res.json({ 
                    success: false, 
                    message: result.error || 'Cannot reach Stripe API',
                    blocked: result.blocked || false
                });
            }

        } catch (error) {

            res.json({ success: false, message: error.message });
        }
    }

    /**
     * Test a proxy by making a request through it
     * @param {Proxy} proxy - Proxy entity to test
     * @returns {Promise<{success: boolean, responseTime?: string, error?: string}>}
     */
    async _testProxy(proxy) {
        const agent = this.proxyFactory.create(proxy);
        if (!agent) {
            return { success: false, error: 'Failed to create proxy agent' };
        }

        const startTime = Date.now();
        try {
            const response = await axios.get('https://api.ipify.org?format=json', {
                httpAgent: agent,
                httpsAgent: agent,
                proxy: false,
                timeout: 10000
            });

            const responseTime = `${Date.now() - startTime}ms`;
            
            if (response.data?.ip) {
                return { success: true, responseTime, ip: response.data.ip };
            }
            
            return { success: false, error: 'No IP returned' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Test if proxy can reach Stripe's API
     * Makes a simple request to Stripe's API endpoint
     * @param {Proxy} proxy - Proxy entity to test
     * @returns {Promise<{success: boolean, responseTime?: string, error?: string, blocked?: boolean}>}
     */
    async _testStripeAccess(proxy) {
        const agent = this.proxyFactory.create(proxy);
        if (!agent) {
            return { success: false, error: 'Failed to create proxy agent' };
        }

        const startTime = Date.now();
        try {
            // Use Stripe's JS SDK endpoint - always accessible and returns quickly
            // This is what Stripe.js uses to load, so if this works, Stripe API will work
            const response = await axios.get('https://js.stripe.com/v3/', {
                httpAgent: agent,
                httpsAgent: agent,
                proxy: false,
                timeout: 15000,
                validateStatus: (status) => status < 500 // Accept any non-5xx as success
            });

            const responseTime = `${Date.now() - startTime}ms`;
            
            // 200 means we can reach Stripe
            if (response.status === 200) {
                return { success: true, responseTime };
            }

            // Any other 4xx might indicate issues
            return { 
                success: false, 
                error: `Stripe returned status ${response.status}`,
                blocked: response.status === 403 
            };
        } catch (error) {
            // Check for common blocking patterns
            const errorMsg = error.message?.toLowerCase() || '';
            const isBlocked = 
                errorMsg.includes('blocked') ||
                errorMsg.includes('forbidden') ||
                errorMsg.includes('access denied') ||
                errorMsg.includes('connection refused') ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ENOTFOUND';

            if (isBlocked) {
                return { 
                    success: false, 
                    error: 'Proxy cannot reach Stripe - connection blocked or refused',
                    blocked: true 
                };
            }

            // Timeout or other network error
            if (error.code === 'ETIMEDOUT' || errorMsg.includes('timeout')) {
                return { 
                    success: false, 
                    error: 'Stripe connection timed out - proxy may be slow or blocked',
                    blocked: false 
                };
            }

            return { success: false, error: `Cannot reach Stripe: ${error.message}` };
        }
    }

    /**
     * Normalize IP address for comparison
     * Handles IPv6-mapped IPv4 (::ffff:x.x.x.x) and whitespace
     */
    _normalizeIP(ip) {
        if (!ip) return null;
        let normalized = ip.trim().toLowerCase();
        // Strip IPv6 prefix for mapped IPv4 addresses
        if (normalized.startsWith('::ffff:')) {
            normalized = normalized.slice(7);
        }
        return normalized;
    }

    /**
     * Fetch IP from a service with fallback
     */
    async _fetchIP(agent, timeout = 5000) {
        // Try ipify first
        try {
            const response = await axios.get('https://api.ipify.org?format=json', {
                httpAgent: agent,
                httpsAgent: agent,
                proxy: false,
                timeout
            });
            if (response.data?.ip) {
                return this._normalizeIP(response.data.ip);
            }
        } catch {
            // Fall through to backup
        }

        // Fallback to httpbin
        try {
            const response = await axios.get('https://httpbin.org/ip', {
                httpAgent: agent,
                httpsAgent: agent,
                proxy: false,
                timeout
            });
            if (response.data?.origin) {
                // httpbin may return comma-separated IPs, take first
                const origin = response.data.origin.split(',')[0];
                return this._normalizeIP(origin);
            }
        } catch {
            // Both failed
        }

        return null;
    }

    /**
     * Detect if proxy is static by making 2 requests and comparing IPs
     * If both IPs are the same, it's a static proxy
     */
    async _detectStaticProxy(proxy) {
        const agent = this.proxyFactory.create(proxy);
        if (!agent) return { ip: null, isStatic: false };

        try {
            // Make first request
            const ip1 = await this._fetchIP(agent);
            if (!ip1) return { ip: null, isStatic: false };

            // Slightly longer delay to catch more rotating proxies
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Make second request
            const ip2 = await this._fetchIP(agent);

            // Compare normalized IPs
            const isStatic = ip1 === ip2;

            return { ip: ip1, isStatic };
        } catch {
            return { ip: null, isStatic: false };
        }
    }

    /**
     * Get Express router handlers
     */
    getRoutes() {
        return {
            checkProxy: this.checkProxy.bind(this),
            checkStripeAccess: this.checkStripeAccess.bind(this)
        };
    }
}
