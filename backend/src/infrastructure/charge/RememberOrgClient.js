import got from 'got';
import { CookieJar } from 'tough-cookie';
import { fakeDataService } from '../../utils/FakeDataService.js';
import { fingerprintGenerator } from '../../utils/FingerprintGenerator.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';

/**
 * Remember.org Client
 * Handles donation via WordPress Charitable plugin + Stripe PaymentMethod
 * Flow: Create PM via Stripe API → Submit to WP AJAX → Get charge result
 * Uses got library for native cookie jar + proxy support
 */
export class RememberOrgClient {
    constructor(siteConfig = {}, options = {}) {
        this.site = {
            id: 'remember-org',
            label: 'Remember.org',
            baseUrl: 'https://remember.org.au',
            donateUrl: 'https://remember.org.au/donate/',
            ajaxUrl: 'https://remember.org.au/wp-admin/admin-ajax.php',
            pkKey: siteConfig.pkKey || '',
            campaignId: siteConfig.campaignId || '13890',
            ...siteConfig
        };
        this.timeout = 30000;
        this.proxyManager = options.proxyManager || null;
        this.debug = options.debug !== false; // Enable debug by default
    }

    _log(step, message, data = null) {
        if (!this.debug) return;
        const timestamp = new Date().toISOString();
        const prefix = `[RememberOrgClient][${step}]`;
        if (data) {

        } else {

        }
    }

    generateFakeUser() {
        return fakeDataService.generateFakeUser();
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

    createSession(proxyAgent = null, browserContext = null) {
        const cookieJar = new CookieJar();
        const userAgent = browserContext?.userAgent || fingerprintGenerator.generateUserAgent();

        const instance = got.extend({
            timeout: { request: this.timeout },
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': browserContext?.acceptLanguage || 'en-US,en;q=0.5',
            },
            followRedirect: true,
            maxRedirects: 5,
            cookieJar,
            throwHttpErrors: false,
            ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
        });

        instance.cookieJar = cookieJar;
        instance.userAgent = userAgent;
        return instance;
    }

    /**
     * Generate a complete browser fingerprint context for a session.
     */
    generateBrowserContext() {
        const fingerprint = fingerprintGenerator.generateFingerprint({ mobile: false });
        const chromeMatch = fingerprint.userAgent.match(/Chrome\/(\d+)/);
        const chromeVersion = chromeMatch ? chromeMatch[1] : '131';

        return {
            guid: fingerprint.stripeIds.guid,
            muid: fingerprint.stripeIds.muid,
            sid: fingerprint.stripeIds.sid,
            userAgent: fingerprint.userAgent,
            sessionStart: Date.now(),
            secChUa: `"Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}", "Not-A.Brand";v="99"`,
            secChUaPlatform: fingerprint.userAgent.includes('Windows') ? '"Windows"'
                : fingerprint.userAgent.includes('Macintosh') ? '"macOS"'
                    : '"Linux"',
            secChUaMobile: fingerprint.userAgent.includes('Mobile') ? '?1' : '?0',
            acceptLanguage: fingerprint.language.acceptLanguage,
        };
    }

    getTimeOnPage(browserContext) {
        const elapsed = Date.now() - browserContext.sessionStart;
        const baseTime = Math.floor(Math.random() * 10000) + 5000;
        return elapsed + baseTime;
    }

    getStripeHeaders(browserContext) {
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Accept-Language': browserContext.acceptLanguage,
            'Origin': 'https://js.stripe.com',
            'Referer': 'https://js.stripe.com/',
            'User-Agent': browserContext.userAgent,
            'Sec-CH-UA': browserContext.secChUa,
            'Sec-CH-UA-Mobile': browserContext.secChUaMobile,
            'Sec-CH-UA-Platform': browserContext.secChUaPlatform,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
        };
    }

    async getDonationPage(session) {
        this._log('PAGE', `Fetching donation page: ${this.site.donateUrl}`);
        try {
            const response = await session(this.site.donateUrl, {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Referer': this.site.baseUrl,
                }
            });

            this._log('PAGE', `Response status: ${response.statusCode}`);

            if (response.statusCode !== 200) {
                this._log('PAGE', `FAILED - HTTP error`, { statusCode: response.statusCode });
                return { success: false, error: `HTTP_${response.statusCode}` };
            }

            const html = response.body;
            const formIdMatch = html.match(/name="charitable_form_id" value="([^"]+)"/);
            const formId = formIdMatch ? formIdMatch[1] : this._generateFormId();
            const nonceMatch = html.match(/name="_charitable_donation_nonce" value="([^"]+)"/);
            const nonce = nonceMatch ? nonceMatch[1] : null;

            this._log('PAGE', `SUCCESS - formId: ${formId}, nonce: ${nonce ? 'found' : 'NOT FOUND'}`);
            return { success: true, formId, nonce, html };
        } catch (error) {
            this._log('PAGE', `EXCEPTION`, { code: error.code, message: error.message });
            return { success: false, error: `${error.code || 'ERROR'}: ${error.message}` };
        }
    }

    async createPaymentMethod(cardData, fakeUser, browserContext, proxyAgent = null) {
        this._log('PM', `Creating PaymentMethod for card: ${cardData.number?.slice(0, 6)}****`);

        const timeOnPage = this.getTimeOnPage(browserContext);

        const formData = new URLSearchParams({
            'type': 'card',
            'billing_details[name]': `${fakeUser.firstName} ${fakeUser.lastName}`,
            'billing_details[email]': fakeUser.email,
            'billing_details[address][country]': 'US',
            'billing_details[address][postal_code]': fakeUser.postalCode || '10001',
            'billing_details[address][state]': '0',
            'billing_details[phone]': fakeUser.phone || '5551234567',
            'card[number]': cardData.number,
            'card[cvc]': cardData.cvv || cardData.cvc,
            'card[exp_month]': cardData.expMonth,
            'card[exp_year]': cardData.expYear,
            'guid': browserContext.guid,
            'muid': browserContext.muid,
            'sid': browserContext.sid,
            'payment_user_agent': 'stripe.js/8c194b4c2c; stripe-js-v3/8c194b4c2c; card-element',
            'referrer': this.site.baseUrl,
            'time_on_page': timeOnPage.toString(),
            'client_attribution_metadata[client_session_id]': this._generateUUID(),
            'client_attribution_metadata[merchant_integration_source]': 'elements',
            'client_attribution_metadata[merchant_integration_subtype]': 'card-element',
            'client_attribution_metadata[merchant_integration_version]': '2017',
            'key': this.site.pkKey,
        });

        try {
            this._log('PM', `Calling Stripe API with pkKey: ${this.site.pkKey?.slice(0, 12)}...`);

            let response;
            try {
                response = await got.post('https://api.stripe.com/v1/payment_methods', {
                    body: formData.toString(),
                    headers: this.getStripeHeaders(browserContext),
                    timeout: { request: this.timeout },
                    throwHttpErrors: false,
                    ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
                });
                this._log('PM', `Stripe API response status: ${response.statusCode}`);
            } catch (requestErr) {
                this._log('PM', `NETWORK ERROR`, { code: requestErr.code, message: requestErr.message });
                return { success: false, error: requestErr.code || requestErr.message, code: 'REQUEST_ERROR', isNetworkError: true };
            }

            let pm;
            try {
                pm = JSON.parse(response.body);
            } catch (parseErr) {
                this._log('PM', `PARSE ERROR - body length: ${response.body?.length}`, { bodyPreview: response.body?.slice(0, 200) });
                if (typeof response.body === 'string' && response.body.includes('<html')) {
                    return { success: false, error: 'Proxy returned HTML', code: 'PROXY_ERROR', isNetworkError: true };
                }
                if (!response.body || response.body.length === 0) {
                    return { success: false, error: 'Empty response', code: 'EMPTY_RESPONSE', isNetworkError: true };
                }
                return { success: false, error: 'Invalid response', code: 'PARSE_ERROR', isNetworkError: true };
            }

            // Stripe API error - this is a card decline
            if (pm.error) {
                this._log('PM', `STRIPE ERROR (card decline)`, { code: pm.error.code, message: pm.error.message });
                return { success: false, error: pm.error.message, code: pm.error.code || 'STRIPE_ERROR', isNetworkError: false };
            }

            this._log('PM', `SUCCESS - PaymentMethod created`, { id: pm.id, brand: pm.card?.brand, country: pm.card?.country });
            return {
                success: true,
                paymentMethodId: pm.id,
                brand: pm.card?.brand,
                country: pm.card?.country,
                last4: pm.card?.last4
            };
        } catch (error) {
            this._log('PM', `UNEXPECTED ERROR`, { message: error.message, stack: error.stack });
            return { success: false, error: error.message, code: 'UNEXPECTED_ERROR', isNetworkError: true };
        }
    }

    async submitDonation(session, params) {
        const { formId, nonce, paymentMethodId, fakeUser } = params;

        this._log('SUBMIT', `Submitting donation`, { formId, nonce: nonce ? 'present' : 'MISSING', paymentMethodId });

        const formData = new URLSearchParams({
            'charitable_form_id': formId,
            [formId]: '',
            '_charitable_donation_nonce': nonce || '',
            '_wp_http_referer': '/donate/',
            'campaign_id': this.site.campaignId,
            'description': 'Donate',
            'ID': '0',
            'gateway': 'stripe',
            'donation_amount': 'custom',
            'custom_donation_amount': '1.00',
            'title': '',
            'first_name': fakeUser.firstName,
            'last_name': fakeUser.lastName,
            'email': fakeUser.email,
            'phone_type': '0',
            'phone': fakeUser.phone || '5551234567',
            'address': '',
            'city': '',
            'state': '0',
            'postcode': fakeUser.postalCode || '10001',
            'country': 'US',
            'donation_reason': '',
            'stripe_payment_method': paymentMethodId,
            'action': 'make_donation',
            'form_action': 'make_donation',
        });

        try {
            this._log('SUBMIT', `Calling AJAX: ${this.site.ajaxUrl}`);

            const response = await session.post(this.site.ajaxUrl, {
                body: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': this.site.baseUrl,
                    'Referer': this.site.donateUrl
                }
            });

            this._log('SUBMIT', `AJAX response status: ${response.statusCode}`);

            let data;
            try {
                data = JSON.parse(response.body);
            } catch {
                this._log('SUBMIT', `PARSE ERROR`, { bodyPreview: response.body?.slice(0, 200) });
                return { success: false, error: 'PARSE_ERROR', isNetworkError: true };
            }

            this._log('SUBMIT', `AJAX response data`, { success: data.success, requires_action: data.requires_action, errors: data.errors });

            if (data.success === true) {
                if (data.requires_action === true) {
                    this._log('SUBMIT', `3DS_REQUIRED - donation_id: ${data.donation_id}`);
                    return {
                        success: true,
                        approved: false,
                        status: '3DS_REQUIRED',
                        message: '3DS_REQUIRED',
                        donationId: data.donation_id
                    };
                }

                this._log('SUBMIT', `APPROVED - donation_id: ${data.donation_id}`);
                return {
                    success: true,
                    approved: true,
                    message: 'APPROVED',
                    donationId: data.donation_id,
                    redirectUrl: data.redirect_to
                };
            } else {
                const errorMsg = data.errors?.[0] || 'Unknown error';

                if (errorMsg.includes('unable to verify your form submission') ||
                    errorMsg.includes('nonce') ||
                    errorMsg.includes('reload the page')) {
                    this._log('SUBMIT', `NONCE_EXPIRED`, { errorMsg });
                    return { success: false, error: `NONCE_EXPIRED: ${errorMsg}`, isNetworkError: true };
                }

                this._log('SUBMIT', `DECLINED`, { errorMsg });
                return {
                    success: true,
                    approved: false,
                    message: errorMsg,
                    donationId: data.donation_id,
                    rawResponse: data
                };
            }
        } catch (error) {
            this._log('SUBMIT', `EXCEPTION`, { message: error.message });
            return { success: false, error: error.message, isNetworkError: true };
        }
    }

    async validate(cardData) {
        const cardPreview = `${cardData.number?.slice(0, 6)}****|${cardData.expMonth}|${cardData.expYear}`;
        this._log('VALIDATE', `=== Starting validation for ${cardPreview} ===`);

        const proxyAgent = await this.getProxyAgent();
        this._log('VALIDATE', `Proxy agent: ${proxyAgent ? 'configured' : 'direct'}`);

        // Generate consistent browser context for this entire validation flow
        const browserContext = this.generateBrowserContext();
        const session = this.createSession(proxyAgent, browserContext);
        const fakeUser = this.generateFakeUser();
        this._log('VALIDATE', `Using fake user: ${fakeUser.email}`);

        // Step 1: Get donation page
        this._log('VALIDATE', `Step 1: Getting donation page...`);
        const pageResult = await this.getDonationPage(session);
        if (!pageResult.success) {
            this._log('VALIDATE', `FAILED at Step 1 (page)`, { error: pageResult.error });
            return { success: false, error: `PAGE_FAIL: ${pageResult.error}`, isNetworkError: true };
        }

        // Step 2: Create PaymentMethod
        this._log('VALIDATE', `Step 2: Creating PaymentMethod...`);
        const pmResult = await this.createPaymentMethod(cardData, fakeUser, browserContext, proxyAgent);
        if (!pmResult.success) {
            if (pmResult.isNetworkError) {
                this._log('VALIDATE', `FAILED at Step 2 (PM) - network error`, { error: pmResult.error });
                return {
                    success: false,
                    error: pmResult.error,
                    code: pmResult.code,
                    isNetworkError: true
                };
            }
            this._log('VALIDATE', `DECLINED at Step 2 (PM) - card error`, { error: pmResult.error, code: pmResult.code });
            return {
                success: true,
                approved: false,
                status: 'DECLINED',
                message: pmResult.error,
                code: pmResult.code,
                brand: null,
                country: null
            };
        }

        // Step 3: Submit donation
        this._log('VALIDATE', `Step 3: Submitting donation...`);
        const submitResult = await this.submitDonation(session, {
            formId: pageResult.formId,
            nonce: pageResult.nonce,
            paymentMethodId: pmResult.paymentMethodId,
            fakeUser
        });

        if (!submitResult.success) {
            if (submitResult.isNetworkError) {
                this._log('VALIDATE', `FAILED at Step 3 (submit) - network error`, { error: submitResult.error });
                return { success: false, error: `SUBMIT_FAIL: ${submitResult.error}`, isNetworkError: true };
            }
            this._log('VALIDATE', `FAILED at Step 3 (submit)`, { error: submitResult.error });
            return { success: false, error: `SUBMIT_FAIL: ${submitResult.error}` };
        }

        const finalStatus = submitResult.approved ? 'APPROVED' : (submitResult.status || 'DECLINED');
        this._log('VALIDATE', `=== Validation complete: ${finalStatus} ===`, {
            donationId: submitResult.donationId,
            brand: pmResult.brand
        });

        return {
            success: true,
            approved: submitResult.approved,
            status: finalStatus,
            message: submitResult.message,
            donationId: submitResult.donationId,
            brand: pmResult.brand,
            country: pmResult.country,
            last4: pmResult.last4
        };
    }

    _generateFormId() {
        return [...Array(13)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    _generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

export const rememberOrgClient = new RememberOrgClient();
