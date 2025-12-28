import got from 'got';
import { CookieJar } from 'tough-cookie';
import { fingerprintGenerator } from '../../utils/FingerprintGenerator.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';

/**
 * WooCommerce Login Client
 * Handles login-based auth validation for WooCommerce sites with existing accounts
 * Flow: Login -> Get session cookies -> Navigate to add-payment-method -> Extract nonces -> Submit SetupIntent
 */
export class WooCommerceLoginClient {
    constructor(siteConfig, options = {}) {
        this.site = siteConfig;
        this.timeout = 30000;
        this.proxyManager = options.proxyManager || null;
    }

    async getProxyAgent() {
        if (this.proxyManager && this.proxyManager.isEnabled()) {
            const proxy = await this.proxyManager.getNextProxy();
            if (proxy) {
                return proxyAgentFactory.create(proxy);
            }
        }
        return null;
    }

    generateFingerprint() {
        return fingerprintGenerator.generateFingerprint();
    }

    createSession(fingerprint, proxyAgent = null) {
        const cookieJar = new CookieJar();
        const headers = fingerprintGenerator.generateHeaders(fingerprint, { includeSecHeaders: true });
        
        const instance = got.extend({
            timeout: { request: this.timeout },
            headers,
            followRedirect: true,
            maxRedirects: 5,
            cookieJar,
            throwHttpErrors: false,
            ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
        });

        instance.fingerprint = fingerprint;
        instance.cookieJar = cookieJar;
        return instance;
    }

    async getCookieNames(cookieJar, url) {
        const cookies = await cookieJar.getCookies(url);
        return cookies.map(c => c.key);
    }

    async loginAndGetNonces() {
        const fingerprint = this.generateFingerprint();
        const proxyAgent = await this.getProxyAgent();
        const session = this.createSession(fingerprint, proxyAgent);
        
        const credentials = this.site.credentials;
        if (!credentials?.email || !credentials?.password) {
            return { success: false, error: 'MISSING_CREDENTIALS' };
        }

        try {
            // Step 1: Get login page and nonce
            const loginPageResponse = await session(this.site.loginUrl, {
                headers: { 
                    'User-Agent': fingerprint.userAgent, 
                    'Referer': this.site.baseUrl + '/',
                    'Accept-Language': fingerprint.language.acceptLanguage
                }
            });

            if (loginPageResponse.statusCode !== 200) {
                return { success: false, error: 'Failed to load login page' };
            }

            const nonceMatch = loginPageResponse.body.match(this.site.patterns.loginNonce);
            if (!nonceMatch) {
                return { success: false, error: 'Login nonce not found' };
            }
            const loginNonce = nonceMatch[1];

            // Step 2: Submit login
            const loginData = new URLSearchParams({
                'username': credentials.email,
                'password': credentials.password,
                'woocommerce-login-nonce': loginNonce,
                '_wp_http_referer': '/my-account/',
                'rememberme': 'forever',
                'login': 'Log in'
            });

            const loginResponse = await session.post(this.site.loginUrl, {
                body: loginData.toString(),
                headers: {
                    'User-Agent': fingerprint.userAgent,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': this.site.baseUrl,
                    'Referer': this.site.loginUrl,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': fingerprint.language.acceptLanguage
                }
            });

            const responseHtml = loginResponse.body || '';

            // Check for Cloudflare challenge
            if (responseHtml.includes('cf-browser-verification') || responseHtml.includes('challenge-platform') || responseHtml.includes('Just a moment')) {
                return { success: false, error: 'CLOUDFLARE_BLOCKED' };
            }

            // Check for WooCommerce error messages
            const errorMatch = responseHtml.match(/<ul class="woocommerce-error"[^>]*>([\s\S]*?)<\/ul>/);
            if (errorMatch) {
                const errorText = errorMatch[1].replace(/<[^>]+>/g, '').trim();
                return { success: false, error: `LOGIN_ERROR: ${errorText}` };
            }

            // Check cookies in jar after login
            const cookieNames = await this.getCookieNames(session.cookieJar, this.site.baseUrl);
            const hasLoginCookie = cookieNames.some(name => name.startsWith('wordpress_logged_in'));
            
            if (!hasLoginCookie) {
                return { success: false, error: 'Login failed - no login cookie' };
            }

            // Step 3: Get payment method page for setup intent nonces
            const paymentPageResponse = await session(this.site.paymentMethodUrl, {
                headers: {
                    'User-Agent': fingerprint.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': fingerprint.language.acceptLanguage,
                    'Referer': this.site.loginUrl
                }
            });

            if (paymentPageResponse.statusCode !== 200) {
                return { success: false, error: 'Failed to load payment method page' };
            }
            
            const setupIntentMatch = paymentPageResponse.body.match(this.site.patterns.setupIntentNonce);
            
            // Extract PK key from page if not configured
            let pkKey = this.site.pkKey;
            if (!pkKey) {
                const pkPattern = this.site.patterns?.pkKey || /"key":"(pk_live_[^"]+)"/;
                const pkMatch = paymentPageResponse.body.match(pkPattern);
                if (pkMatch) {
                    pkKey = pkMatch[1];
                }
            }

            const nonces = {
                setupIntent: setupIntentMatch ? setupIntentMatch[1] : null
            };

            if (!nonces.setupIntent) {
                return { success: false, error: 'SetupIntent nonce not found on payment page' };
            }

            const deleteNonceMatch = paymentPageResponse.body.match(/delete-payment-method\/(\d+)\/\?_wpnonce=([a-f0-9]+)/);
            const deleteNonce = deleteNonceMatch ? deleteNonceMatch[2] : null;
            const existingTokenId = deleteNonceMatch ? deleteNonceMatch[1] : null;

            return {
                success: true,
                nonces,
                deleteNonce,
                existingTokenId,
                session,
                fingerprint,
                ajaxUrl: this.site.ajaxUrl,
                pkKey
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async submitSetupIntent(pmId, sessionData) {
        const { nonces, session, fingerprint } = sessionData;

        try {
            const nonce = nonces.setupIntent;
            if (!nonce) {
                return { success: false, error: 'NO_NONCE' };
            }

            const data = new URLSearchParams({
                'action': this.site.actions.setupIntent,
                'wc-stripe-payment-method': pmId,
                'wc-stripe-payment-type': 'card',
                '_ajax_nonce': nonce
            });

            const response = await session.post(this.site.ajaxUrl, {
                body: data.toString(),
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Origin': this.site.baseUrl,
                    'Referer': this.site.paymentMethodUrl,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept-Language': fingerprint.language.acceptLanguage,
                    'User-Agent': fingerprint.userAgent
                },
                timeout: { request: this.timeout }
            });

            if (response.body) {
                let data;
                try {
                    data = JSON.parse(response.body);
                } catch {
                    data = response.body;
                }
                
                const wcSuccess = data?.success === true;
                const errorMessage = data?.data?.error?.message;
                
                return {
                    success: wcSuccess,
                    approved: wcSuccess,
                    message: wcSuccess ? 'APPROVED' : (errorMessage || 'DECLINED'),
                    data,
                    raw: response.body
                };
            }

            return { success: false, error: `HTTP_${response.statusCode}_NO_DATA` };
        } catch (error) {
            if (error.code === 'ETIMEDOUT') {
                return { success: false, error: 'TIMEOUT' };
            }
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return { success: false, error: 'CONNECTION_ERROR' };
            }
            return { success: false, error: `EXCEPTION_${error.message}` };
        }
    }

    async deletePaymentMethod(tokenId, sessionData) {
        const { deleteNonce, session, fingerprint } = sessionData;

        if (!deleteNonce) {
            return { success: false, error: 'NO_DELETE_NONCE' };
        }

        try {
            const deleteUrl = `${this.site.baseUrl}/my-account/delete-payment-method/${tokenId}/?_wpnonce=${deleteNonce}`;
            
            const response = await session(deleteUrl, {
                headers: {
                    'User-Agent': fingerprint.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': fingerprint.language.acceptLanguage,
                    'Referer': this.site.paymentMethodUrl
                },
                followRedirect: true,
                maxRedirects: 5
            });

            if (response.statusCode === 200 || response.url?.includes('payment-methods')) {
                return { success: true };
            }

            return { success: false, error: `DELETE_HTTP_${response.statusCode}` };
        } catch (error) {
            return { success: false, error: `DELETE_ERROR: ${error.message}` };
        }
    }

    async refreshDeleteNonce(sessionData) {
        const { session, fingerprint } = sessionData;

        try {
            const response = await session(this.site.paymentMethodUrl, {
                headers: {
                    'User-Agent': fingerprint.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': fingerprint.language.acceptLanguage,
                    'Referer': this.site.loginUrl
                }
            });
            
            if (response.statusCode === 200) {
                const deleteNonceMatch = response.body.match(/delete-payment-method\/(\d+)\/\?_wpnonce=([a-f0-9]+)/);
                return {
                    deleteNonce: deleteNonceMatch ? deleteNonceMatch[2] : null,
                    existingTokenId: deleteNonceMatch ? deleteNonceMatch[1] : null
                };
            }
            return { deleteNonce: null, existingTokenId: null };
        } catch (error) {
            return { deleteNonce: null, existingTokenId: null };
        }
    }
}
