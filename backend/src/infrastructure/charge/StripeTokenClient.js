import axios from 'axios';
import { STRIPE_API } from '../../utils/constants.js';
import { fingerprintGenerator } from '../../utils/FingerprintGenerator.js';

/**
 * Stripe Token Client
 * Creates card tokens via Stripe API using publishable key
 * 
 * ⚠️ DEPRECATED - DO NOT USE!
 * ================================
 * Testing (Dec 2024) confirmed that the Token API (/v1/tokens) is BLOCKED
 * by Stripe's "unsupported integration surface" check, even with the
 * checkout.stripe.com Origin header.
 * 
 * USE StripePaymentMethodClient INSTEAD!
 * The PaymentMethod API (/v1/payment_methods) works with the checkout.stripe.com
 * Origin and can create PaymentMethods without browser automation.
 * 
 * See: src/infrastructure/auth/StripePaymentMethodClient.js
 */
export class StripeTokenClient {
    constructor() {
        this.endpoint = STRIPE_API.TOKENS;
        this.timeout = 30000;

    }

    /**
     * Create a token from card details using publishable key
     * @param {Object} card - Card details {number, expMonth, expYear, cvc}
     * @param {string} pkKey - Stripe publishable key
     * @param {Object} options - Optional fingerprint and proxy settings
     * @returns {Promise<{success: boolean, token?: Object, error?: string}>}
     */
    async createToken(card, pkKey, options = {}) {
        const { fingerprint: existingFingerprint, proxy } = options;
        const fingerprint = existingFingerprint || fingerprintGenerator.generateFingerprint();
        const stripeIds = fingerprint.stripeIds;



        try {
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://js.stripe.com',
                'Referer': 'https://js.stripe.com/',
                'User-Agent': fingerprint.userAgent,
                'Accept-Language': fingerprint.language?.acceptLanguage || 'en-US,en;q=0.9'
            };

            const data = new URLSearchParams({
                'card[number]': card.number,
                'card[cvc]': card.cvc || card.cvv,
                'card[exp_month]': card.expMonth,
                'card[exp_year]': card.expYear,
                'card[name]': options.cardholderName || 'Cardholder',
                'guid': stripeIds.guid,
                'muid': stripeIds.muid,
                'sid': stripeIds.sid,
                'payment_user_agent': 'stripe.js/78ef418',
                'time_on_page': String(fingerprint.timeOnPage || Math.floor(Math.random() * 50000) + 50000),
                'key': pkKey
            });

            const axiosConfig = {
                headers,
                timeout: this.timeout
            };

            if (proxy) {
                axiosConfig.proxy = proxy;
            }

            const response = await axios.post(this.endpoint, data.toString(), axiosConfig);

            if (response.status === 200 && response.data.id) {


                return {
                    success: true,
                    token: {
                        id: response.data.id,
                        brand: response.data.card?.brand || null,
                        country: response.data.card?.country || null,
                        last4: response.data.card?.last4 || null,
                        funding: response.data.card?.funding || null
                    }
                };
            }

            return {
                success: false,
                error: response.data.error?.message || 'Unknown Stripe error'
            };
        } catch (error) {

            if (error.response?.data?.error) {

                return {
                    success: false,
                    error: error.response.data.error.message,
                    code: error.response.data.error.code,
                    declineCode: error.response.data.error.decline_code
                };
            }
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export const stripeTokenClient = new StripeTokenClient();
