/**
 * Interface for Stripe API client
 * Wraps all Stripe API operations with proxy support
 */
export class IStripeAPIClient {
    /**
     * Check if a secret key is valid
     * @param {string} skKey - Stripe secret key
     * @returns {Promise<Object>} - Key validation result
     */
    async checkKey(skKey) {
        throw new Error('Not implemented');
    }

    /**
     * Create a payment intent
     * @param {string} skKey - Stripe secret key
     * @param {Object} params - Payment intent parameters
     * @param {Proxy|null} proxy - Optional proxy
     * @returns {Promise<Object>} - Payment intent object
     */
    async createPaymentIntent(skKey, params, proxy = null) {
        throw new Error('Not implemented');
    }

    /**
     * Confirm a payment intent
     * @param {string} skKey - Stripe secret key
     * @param {string} intentId - Payment intent ID
     * @param {string} paymentMethod - Payment method ID
     * @param {Proxy|null} proxy - Optional proxy
     * @returns {Promise<Object>} - Confirmed payment intent
     */
    async confirmPaymentIntent(skKey, intentId, paymentMethod, proxy = null) {
        throw new Error('Not implemented');
    }

    /**
     * Refund a charge
     * @param {string} skKey - Stripe secret key
     * @param {string} chargeId - Charge ID to refund
     * @param {Proxy|null} proxy - Optional proxy
     * @returns {Promise<Object>} - Refund object
     */
    async refund(skKey, chargeId, proxy = null) {
        throw new Error('Not implemented');
    }

    /**
     * Create a customer
     * @param {string} skKey - Stripe secret key
     * @param {Object} params - Customer parameters
     * @param {Proxy|null} proxy - Optional proxy
     * @returns {Promise<Object>} - Customer object
     */
    async createCustomer(skKey, params, proxy = null) {
        throw new Error('Not implemented');
    }

    /**
     * Create a setup intent
     * @param {string} skKey - Stripe secret key
     * @param {Object} params - Setup intent parameters
     * @param {Proxy|null} proxy - Optional proxy
     * @returns {Promise<Object>} - Setup intent object
     */
    async createSetupIntent(skKey, params, proxy = null) {
        throw new Error('Not implemented');
    }

    /**
     * Attach a payment method to a customer
     * @param {string} skKey - Stripe secret key
     * @param {string} paymentMethodId - Payment method ID
     * @param {string} customerId - Customer ID
     * @param {Proxy|null} proxy - Optional proxy
     * @returns {Promise<Object>} - Attached payment method
     */
    async attachPaymentMethod(skKey, paymentMethodId, customerId, proxy = null) {
        throw new Error('Not implemented');
    }
}
