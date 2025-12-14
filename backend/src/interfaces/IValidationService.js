/**
 * Interface for card validation services
 * Implements Strategy Pattern for different validation methods
 */
export class IValidationService {
    /**
     * Validate a card using this validation strategy
     * @param {Card} card - Card entity to validate
     * @param {StripeKeys} keys - Stripe API keys
     * @param {Proxy|null} proxy - Optional proxy configuration
     * @returns {Promise<ValidationResult>}
     */
    async validate(card, keys, proxy = null) {
        throw new Error('Method validate() must be implemented');
    }

    /**
     * Get the name of this validation method
     * @returns {string}
     */
    getName() {
        throw new Error('Method getName() must be implemented');
    }
}
