import got from 'got';
import { CookieJar } from 'tough-cookie';
import { fingerprintGenerator } from '../../utils/FingerprintGenerator.js';
import { fakeDataService } from '../../utils/FakeDataService.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';

/**
 * WooCommerce Client
 * Handles registration and nonce extraction from WooCommerce sites
 * Uses got library for native cookie jar + proxy support
 */
export class WooCommerceClient {
    constructor(siteConfig, options = {}) {
        this.site = siteConfig;
        this.timeout = 30000;
        this.proxyManager = options.proxyManager || null;
    }

    async getProxyAgent() {
        if (this.proxyManager && this.proxyManager.isEnabled()) {
            const proxy = await this.proxyManager.getNextProxy();
            if (proxy) {
                // Create FRESH agent each time - rotating proxies give new IP per connection
                const agent = proxyAgentFactory.create(proxy);
                console.log(`[WooCommerceClient] Created fresh proxy agent: ${proxy.host}:${proxy.port}`);
                return agent;
            }
        }
        return null;
    }

    generateFingerprint() {
        return fingerprintGenerator.generateFingerprint();
    }

    generateCredentials() {
        return fakeDataService.generateCredentials();
    }

    generateFakeName() {
        const user = fakeDataService.generateFakeUser();
        return { first: user.firstName, last: user.lastName };
    }

    generateBirthDate() {
        return fakeDataService.generateBirthDate();
    }

    formatCurrentTime() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace('T', '+');
    }

    /**
     * Create got instance with fingerprint-based headers
     * Uses native cookie jar + proxy agent support
     * 
     * IMPORTANT: For rotating proxies, we disable keep-alive to ensure
     * each request creates a fresh TCP connection and gets a new IP
     */
    createSession(fingerprint, proxyAgent = null) {
        const cookieJar = new CookieJar();
        const headers = fingerprintGenerator.generateHeaders(fingerprint, { includeSecHeaders: true });

        const instance = got.extend({
            timeout: { request: this.timeout },
            headers: {
                ...headers,
                // Disable keep-alive to force new connection per request (new IP from rotating proxy)
                'Connection': 'close'
            },
            followRedirect: true,
            maxRedirects: 5,
            cookieJar,
            throwHttpErrors: false,
            // Disable HTTP/2 to ensure connection is not multiplexed
            http2: false,
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

    async getCookiesFromJar(cookieJar, url) {
        const cookies = await cookieJar.getCookies(url);
        return cookies.map(c => c.toString());
    }

    /**
     * Register and get session with nonces
     */
    async registerAndGetNonces() {
        const fingerprint = this.generateFingerprint();
        const proxyAgent = await this.getProxyAgent();
        const session = this.createSession(fingerprint, proxyAgent);
        const { email, password } = this.generateCredentials();

        console.log(`[WooCommerceClient] registerAndGetNonces START - site: ${this.site.label}`);
        console.log(`[WooCommerceClient] Using proxy: ${proxyAgent ? 'YES' : 'NO'}`);

        try {
            // Step 1: Get registration page and nonce
            console.log(`[WooCommerceClient] Step 1: Fetching account page: ${this.site.accountUrl}`);
            const initialResponse = await session(this.site.accountUrl, {
                headers: {
                    'User-Agent': fingerprint.userAgent,
                    'Referer': this.site.baseUrl + '/',
                    'Accept-Language': fingerprint.language.acceptLanguage
                }
            });

            console.log(`[WooCommerceClient] Account page status: ${initialResponse.statusCode}`);

            if (initialResponse.statusCode !== 200) {
                console.log(`[WooCommerceClient] FAILED - Account page returned ${initialResponse.statusCode}`);
                return { success: false, error: 'Failed to load account page' };
            }

            const nonceMatch = initialResponse.body.match(this.site.patterns.registerNonce);
            if (!nonceMatch) {
                console.log('[WooCommerceClient] FAILED - Registration nonce not found in page');
                return { success: false, error: 'Registration nonce not found' };
            }
            const regNonce = nonceMatch[1];
            console.log(`[WooCommerceClient] Found registration nonce: ${regNonce.substring(0, 10)}...`);

            // Step 2: Submit registration
            const registrationData = new URLSearchParams({
                'email': email,
                'password': password,
                'wc_order_attribution_source_type': 'typein',
                'wc_order_attribution_referrer': this.site.accountUrl,
                'wc_order_attribution_utm_campaign': '(none)',
                'wc_order_attribution_utm_source': '(direct)',
                'wc_order_attribution_utm_medium': '(none)',
                'wc_order_attribution_utm_content': '(none)',
                'wc_order_attribution_utm_id': '(none)',
                'wc_order_attribution_utm_term': '(none)',
                'wc_order_attribution_utm_source_platform': '(none)',
                'wc_order_attribution_utm_creative_format': '(none)',
                'wc_order_attribution_utm_marketing_tactic': '(none)',
                'wc_order_attribution_session_entry': this.site.accountUrl,
                'wc_order_attribution_session_start_time': this.formatCurrentTime(),
                'wc_order_attribution_session_pages': '1',
                'wc_order_attribution_session_count': '1',
                'wc_order_attribution_user_agent': fingerprint.userAgent,
                'woocommerce-register-nonce': regNonce,
                '_wp_http_referer': '/my-account/',
                'register': 'Register'
            });

            // Add site-specific optional fields
            if (this.site.id === 'auth-1') {
                // TrueGarden specific fields - match exact curl format
                const { first, last } = this.generateFakeName();
                registrationData.append('first_name', first);
                registrationData.append('last_name', last);
                registrationData.append('tg_logic', '5');
                registrationData.append('tg_hp', ''); // Honeypot field - must be empty
                registrationData.append('billing_birth_date', ''); // Empty per successful curl
            }

            const registerResponse = await session.post(this.site.accountUrl, {
                body: registrationData.toString(),
                headers: {
                    'User-Agent': fingerprint.userAgent,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': this.site.baseUrl,
                    'Referer': this.site.accountUrl,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': fingerprint.language.acceptLanguage
                }
            });

            const responseHtml = registerResponse.body || '';

            // Check for Cloudflare challenge
            if (responseHtml.includes('cf-browser-verification') || responseHtml.includes('challenge-platform') || responseHtml.includes('Just a moment')) {
                console.log('[WooCommerceClient] FAILED - Cloudflare challenge detected');
                return { success: false, error: 'CLOUDFLARE_BLOCKED' };
            }

            // Check for WooCommerce error messages
            const errorMatch = responseHtml.match(/<ul class="woocommerce-error"[^>]*>([\s\S]*?)<\/ul>/);
            if (errorMatch) {
                const errorText = errorMatch[1].replace(/<[^>]+>/g, '').trim();
                console.log(`[WooCommerceClient] FAILED - WooCommerce error: ${errorText}`);
                return { success: false, error: `REG_ERROR: ${errorText}` };
            }

            // Check cookies in jar after registration
            const cookieNames = await this.getCookieNames(session.cookieJar, this.site.baseUrl);
            const hasLoginCookie = cookieNames.some(name => name.startsWith('wordpress_logged_in'));
            console.log(`[WooCommerceClient] Cookies found: ${cookieNames.join(', ')}`);
            console.log(`[WooCommerceClient] Has login cookie: ${hasLoginCookie}`);

            if (!hasLoginCookie) {
                console.log('[WooCommerceClient] FAILED - No login cookie after registration');
                return { success: false, error: 'Registration failed - no login cookie' };
            }

            // Step 3: Get payment method page for setup intent nonces
            console.log(`[WooCommerceClient] Step 3: Fetching payment method page: ${this.site.paymentMethodUrl}`);
            const paymentPageResponse = await session(this.site.paymentMethodUrl, {
                headers: {
                    'User-Agent': fingerprint.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': fingerprint.language.acceptLanguage,
                    'Referer': this.site.accountUrl
                }
            });

            console.log(`[WooCommerceClient] Payment page status: ${paymentPageResponse.statusCode}`);

            if (paymentPageResponse.statusCode !== 200) {
                console.log('[WooCommerceClient] FAILED - Payment method page load failed');
                return { success: false, error: 'Failed to load payment method page' };
            }

            const setupIntentMatch = paymentPageResponse.body.match(this.site.patterns.setupIntentNonce);
            const ajaxMatch = this.site.patterns.ajaxNonce ? paymentPageResponse.body.match(this.site.patterns.ajaxNonce) : null;
            const ajaxUrlMatch = this.site.patterns.ajaxUrl ? paymentPageResponse.body.match(this.site.patterns.ajaxUrl) : null;

            // Extract PK key from page if pattern provided
            let pkKey = this.site.pkKey;
            if (!pkKey && this.site.patterns?.pkKey) {
                const pkMatch = paymentPageResponse.body.match(this.site.patterns.pkKey);
                if (pkMatch) {
                    pkKey = pkMatch[1];
                }
            }

            const nonces = {
                setupIntent: setupIntentMatch ? setupIntentMatch[1] : null,
                ajax: ajaxMatch ? ajaxMatch[1] : null
            };

            let ajaxUrl = ajaxUrlMatch ? ajaxUrlMatch[1].replace(/\\\//g, '/') : null;
            if (ajaxUrl && ajaxUrl.startsWith('/')) {
                ajaxUrl = this.site.baseUrl + ajaxUrl;
            }

            const finalCookieNames = await this.getCookieNames(session.cookieJar, this.site.baseUrl);

            if (!nonces.setupIntent && !nonces.ajax) {
                console.log('[WooCommerceClient] FAILED - No nonces found on payment page');
                return { success: false, error: 'No nonces found on payment page' };
            }

            console.log(`[WooCommerceClient] Nonces found - setupIntent: ${nonces.setupIntent ? 'YES' : 'NO'}, ajax: ${nonces.ajax ? 'YES' : 'NO'}`);
            console.log(`[WooCommerceClient] PK Key: ${pkKey ? pkKey.substring(0, 20) + '...' : 'NOT FOUND'}`);

            const deleteNonceMatch = paymentPageResponse.body.match(/delete-payment-method\/\d+\/\?_wpnonce=([a-f0-9]+)/);
            const deleteNonce = deleteNonceMatch ? deleteNonceMatch[1] : null;

            console.log('[WooCommerceClient] registerAndGetNonces SUCCESS');
            return {
                success: true,
                nonces,
                deleteNonce,
                session,
                fingerprint,
                ajaxUrl,
                pkKey
            };
        } catch (error) {
            console.log(`[WooCommerceClient] registerAndGetNonces ERROR: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Submit setup intent to add payment method
     */
    async submitSetupIntent(pmId, sessionData) {
        const { nonces, session, fingerprint } = sessionData;

        console.log(`[WooCommerceClient] submitSetupIntent START - pmId: ${pmId}`);

        try {
            const nonce = nonces.setupIntent || nonces.ajax;
            if (!nonce) {
                console.log('[WooCommerceClient] submitSetupIntent FAILED - NO_NONCE');
                return { success: false, error: 'NO_NONCE' };
            }

            const data = new URLSearchParams({
                'action': this.site.actions.setupIntent,
                'wc-stripe-payment-method': pmId,
                'wc-stripe-payment-type': 'card',
                '_ajax_nonce': nonces.setupIntent || nonces.ajax
            });

            const endpoint = this.site.ajaxUrl;
            console.log(`[WooCommerceClient] Posting to: ${endpoint}`);

            const response = await session.post(endpoint, {
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

            console.log(`[WooCommerceClient] SetupIntent response status: ${response.statusCode}`);

            if (response.body) {
                let data;
                try {
                    data = JSON.parse(response.body);
                } catch {
                    data = response.body;
                }

                // Check WooCommerce response success field
                const wcSuccess = data?.success === true;
                const errorMessage = data?.data?.error?.message;

                console.log(`[WooCommerceClient] SetupIntent result: success=${wcSuccess}, message=${wcSuccess ? 'APPROVED' : (errorMessage || 'DECLINED')}`);

                return {
                    success: wcSuccess,
                    approved: wcSuccess,
                    message: wcSuccess ? 'APPROVED' : (errorMessage || 'DECLINED'),
                    data,
                    raw: response.body
                };
            }

            console.log(`[WooCommerceClient] submitSetupIntent FAILED - HTTP_${response.statusCode}_NO_DATA`);
            return { success: false, error: `HTTP_${response.statusCode}_NO_DATA` };
        } catch (error) {
            console.log(`[WooCommerceClient] submitSetupIntent ERROR: ${error.message} (code: ${error.code})`);
            if (error.code === 'ETIMEDOUT') {
                return { success: false, error: 'TIMEOUT' };
            }
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return { success: false, error: 'CONNECTION_ERROR' };
            }
            return { success: false, error: `EXCEPTION_${error.message}` };
        }
    }

    /**
     * Delete a payment method to allow adding another on same session
     */
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

    /**
     * Refresh delete nonce by visiting payment methods page
     */
    async refreshDeleteNonce(sessionData) {
        const { session, fingerprint } = sessionData;

        try {
            const response = await session(this.site.paymentMethodUrl, {
                headers: {
                    'User-Agent': fingerprint.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': fingerprint.language.acceptLanguage,
                    'Referer': this.site.accountUrl
                }
            });

            if (response.statusCode === 200) {
                const deleteNonceMatch = response.body.match(/delete-payment-method\/\d+\/\?_wpnonce=([a-f0-9]+)/);
                return deleteNonceMatch ? deleteNonceMatch[1] : null;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}
