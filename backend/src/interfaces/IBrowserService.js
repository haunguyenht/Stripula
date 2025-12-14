/**
 * Interface for browser automation services
 * Handles Stripe.js interactions via headless browser
 */
export class IBrowserService {
    /**
     * Create a payment method using Stripe.js in browser
     * @param {string} pkKey - Stripe publishable key
     * @param {Card} card - Card details
     * @param {Object|null} billingDetails - Optional billing details
     * @returns {Promise<string>} - Payment method ID
     */
    async createPaymentMethod(pkKey, card, billingDetails = null) {
        throw new Error('Not implemented');
    }

    /**
     * Close the browser instance
     * @returns {Promise<void>}
     */
    async closeBrowser() {
        throw new Error('Not implemented');
    }

    /**
     * Set headless mode
     * @param {boolean} value - Whether to run headless
     */
    setHeadless(value) {
        throw new Error('Not implemented');
    }
}
