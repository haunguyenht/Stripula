import axios from 'axios';
import { STRIPE_API } from '../../utils/constants.js';
import { proxyAgentFactory } from '../http/ProxyAgentFactory.js';
import { getRandomAPIUserAgent } from '../../utils/helpers.js';

/**
 * Stripe Charge Client
 * Handles charge operations using Source tokens for SK-based validation.
 * 
 * Implements:
 * - Charge creation with Bearer auth (Requirement 5.1)
 * - Configurable charge amount (Requirement 5.2)
 * - Refund operations (Requirement 5.4)
 * - 3DS frictionless bypass (Requirements 6.1-6.5)
 * - Risk level and network status extraction (Requirements 5.6, 5.7)
 * 
 * Requirements: 5.1-5.7, 6.1-6.5
 */
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

export class StripeChargeClient {
    constructor(options = {}) {
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
     * Create axios config with Bearer authentication (Requirement 5.1)
     * @private
     * @param {string} skKey - Stripe secret key
     * @param {object} proxy - Optional proxy configuration
     * @returns {object} Axios config
     */
    _createConfig(skKey, proxy = null) {
        const config = {
            headers: {
                'Authorization': `Bearer ${skKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': getRandomAPIUserAgent(),
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: this.timeout
        };
        return this.proxyFactory.createAxiosConfig(proxy, config);
    }

    /**
     * Charge a Source using the Charges API
     * 
     * Uses Bearer auth with SK key (Requirement 5.1)
     * Configurable amount, default $1.00 = 100 cents (Requirement 5.2)
     * USD currency by default (Requirement 5.3)
     * Extracts risk_level, network_status, avs_check, cvc_check (Requirements 5.6, 5.7)
     * 
     * NOTE: Does NOT retry on network errors because Sources are consumed on first charge attempt.
     * Retry logic should be handled at the validator level by creating a new source.
     * 
     * @param {string} sourceId - Source ID (src_xxx)
     * @param {string} skKey - Stripe secret key (sk_live_xxx or sk_test_xxx)
     * @param {object} options - { amount, currency, proxy, description }
     * @returns {Promise<object>} Charge result with outcome details
     */
    async charge(sourceId, skKey, options = {}) {
        const {
            amount = 100,           // Default $1.00 (Requirement 5.2)
            currency = 'usd',       // Default USD (Requirement 5.3)
            description = 'Card validation charge'
        } = options;

        // Get proxy from options or proxyManager
        const proxy = options.proxy || await this._getProxyFromManager();

        // Log masked SK key for debugging



        if (proxy) {

        }

        // Build request body
        const data = new URLSearchParams({
            'amount': String(amount),
            'currency': currency,
            'source': sourceId,
            'description': description,
            'expand[]': 'outcome'
        });

        const config = this._createConfig(skKey, proxy);

        try {

            const response = await axios.post(STRIPE_API.CHARGES, data.toString(), config);

            const chargeData = response.data;

            // Extract outcome details (Requirements 5.6, 5.7)
            const outcome = chargeData.outcome || {};
            const paymentMethodDetails = chargeData.payment_method_details?.card || {};

            const result = {
                success: true,
                chargeId: chargeData.id,
                status: chargeData.status,
                paid: chargeData.paid,
                captured: chargeData.captured,
                amount: chargeData.amount,
                currency: chargeData.currency,
                networkStatus: outcome.network_status,
                riskLevel: outcome.risk_level,
                riskScore: outcome.risk_score,
                sellerMessage: outcome.seller_message,
                type: outcome.type,
                avsCheck: paymentMethodDetails.checks?.address_postal_code_check || null,
                cvcCheck: paymentMethodDetails.checks?.cvc_check || null,
                addressLine1Check: paymentMethodDetails.checks?.address_line1_check || null,
                brand: paymentMethodDetails.brand,
                last4: paymentMethodDetails.last4,
                funding: paymentMethodDetails.funding,
                country: paymentMethodDetails.country,
                expMonth: paymentMethodDetails.exp_month,
                expYear: paymentMethodDetails.exp_year,
                threeDSecure: paymentMethodDetails.three_d_secure || null
            };


            return result;
        } catch (error) {
            // Check if user cancelled
            if (error.code === 'ERR_CANCELED' || error.name === 'AbortError') {

                return {
                    success: false,
                    error: 'Request cancelled',
                    isAborted: true
                };
            }

            // Handle Stripe API errors (card declines, invalid source, etc.)
            if (error.response?.data?.error) {
                const stripeError = error.response.data.error;

                const charge = stripeError.charge ?
                    (typeof stripeError.charge === 'string' ? { id: stripeError.charge } : stripeError.charge) :
                    null;

                return {
                    success: false,
                    error: stripeError.message,
                    code: stripeError.code,
                    declineCode: stripeError.decline_code,
                    chargeId: charge?.id || null,
                    networkStatus: charge?.outcome?.network_status || null,
                    riskLevel: charge?.outcome?.risk_level || null,
                    cvcCheck: charge?.payment_method_details?.card?.checks?.cvc_check || null,
                    avsCheck: charge?.payment_method_details?.card?.checks?.address_postal_code_check || null
                };
            }

            // Network/proxy error - don't retry here, let validator handle it
            // Sources are consumed on first attempt, so retrying with same source won't work

            return {
                success: false,
                error: error.message,
                isNetworkError: true
            };
        }
    }

    /**
     * Refund a charge (Requirement 5.4)
     * 
     * @param {string} chargeId - Charge ID to refund (ch_xxx)
     * @param {string} skKey - Stripe secret key
     * @param {object} proxy - Optional proxy configuration
     * @returns {Promise<{success: boolean, refundId?: string, error?: string}>}
     */
    async refund(chargeId, skKey, proxy = null) {

        try {
            const data = new URLSearchParams({
                'charge': chargeId
            });

            const config = this._createConfig(skKey, proxy);
            const response = await axios.post(STRIPE_API.REFUNDS, data.toString(), config);

            return {
                success: true,
                refundId: response.data.id,
                status: response.data.status,
                amount: response.data.amount
            };
        } catch (error) {

            if (error.response?.data?.error) {
                return {
                    success: false,
                    error: error.response.data.error.message,
                    code: error.response.data.error.code
                };
            }

            return {
                success: false,
                error: error.message,
                isNetworkError: true
            };
        }
    }

    /**
     * Attempt 3DS frictionless bypass (Requirements 6.1-6.5)
     * 
     * When a charge returns requires_action status, this method attempts
     * to complete 3DS authentication using stripped browser data.
     * 
     * Key technique: Strip browserLanguage and browserTZ fields (Requirement 6.3)
     * to trigger frictionless flow (~40% success rate).
     * 
     * @param {string} paymentIntentId - PaymentIntent ID requiring 3DS
     * @param {string} pkKey - Stripe publishable key
     * @param {object} proxy - Optional proxy configuration
     * @returns {Promise<{success: boolean, bypassed?: boolean, status?: string, error?: string}>}
     */
    async attempt3DSBypass(paymentIntentId, pkKey, proxy = null) {

        try {
            // Build stripped browser data (Requirement 6.3)
            // Empty browserLanguage and browserTZ triggers frictionless flow
            const browserData = {
                browserJavaEnabled: false,
                browserJavascriptEnabled: true,
                browserColorDepth: '24',
                browserScreenHeight: '1080',
                browserScreenWidth: '1920',
                // CRITICAL: Strip these fields for frictionless bypass
                browserLanguage: '',
                browserTZ: ''
            };

            const data = new URLSearchParams({
                'source': paymentIntentId,
                'browser': JSON.stringify(browserData),
                'one_click_authn_device_support[hosted]': 'false',
                'one_click_authn_device_support[same_origin_frame]': 'false',
                'one_click_authn_device_support[spc_eligible]': 'false',
                'one_click_authn_device_support[passkey_eligible]': 'false',
                'one_click_authn_device_support[publickey_credentials_get_allowed]': 'true',
                'key': pkKey
            });

            const config = {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://js.stripe.com',
                    'Referer': 'https://js.stripe.com/',
                    'User-Agent': getRandomAPIUserAgent()
                },
                timeout: this.timeout
            };

            const axiosConfig = this.proxyFactory.createAxiosConfig(proxy, config);

            // Call 3DS2 authenticate endpoint (Requirement 6.2)
            const response = await axios.post(
                'https://api.stripe.com/v1/3ds2/authenticate',
                data.toString(),
                axiosConfig
            );

            const result = response.data;

            // Check if bypass succeeded (Requirement 6.4)
            if (result.id || result.state === 'succeeded') {

                return {
                    success: true,
                    bypassed: true,
                    authId: result.id,
                    state: result.state
                };
            }

            // 3DS bypass failed - requires manual authentication (Requirement 6.5)

            return {
                success: true,
                bypassed: false,
                requires3DS: true,
                state: result.state || 'challenge_required'
            };
        } catch (error) {

            if (error.response?.data?.error) {
                return {
                    success: false,
                    bypassed: false,
                    error: error.response.data.error.message,
                    code: error.response.data.error.code
                };
            }

            return {
                success: false,
                bypassed: false,
                error: error.message,
                isNetworkError: true
            };
        }
    }

    /**
     * Retrieve a charge with expanded outcome data
     * Useful for getting full details after a charge
     * 
     * @param {string} chargeId - Charge ID (ch_xxx)
     * @param {string} skKey - Stripe secret key
     * @param {object} proxy - Optional proxy configuration
     * @returns {Promise<object>} Full charge data
     */
    async retrieveCharge(chargeId, skKey, proxy = null) {

        try {
            const params = new URLSearchParams({
                'expand[]': 'outcome',
                'expand[]': 'payment_method_details'
            });

            const config = this._createConfig(skKey, proxy);
            const response = await axios.get(
                `${STRIPE_API.CHARGES}/${chargeId}?${params.toString()}`,
                config
            );

            return {
                success: true,
                charge: response.data
            };
        } catch (error) {

            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }
}

// Export singleton instance for convenience
export const stripeChargeClient = new StripeChargeClient();

