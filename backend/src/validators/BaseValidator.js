import { IValidationService } from '../interfaces/IValidationService.js';
import { ValidationResult } from '../domain/ValidationResult.js';

/**
 * Base Validator - Abstract class for all validation strategies
 * Implements common functionality shared by all validators
 */
export class BaseValidator extends IValidationService {
    constructor(options = {}) {
        super();
        this.stripeClient = options.stripeClient;
        this.binLookup = options.binLookup;
        this.errorHandler = options.errorHandler;
        this.retryHandler = options.retryHandler;
    }

    /**
     * Validate a card - must be implemented by subclasses
     */
    async validate(card, keys, proxy = null) {
        throw new Error('validate() must be implemented by subclass');
    }

    /**
     * Get validator name - must be implemented by subclasses
     */
    getName() {
        throw new Error('getName() must be implemented by subclass');
    }

    /**
     * Lookup BIN data for card
     * @protected
     */
    async lookupBin(card) {
        if (!this.binLookup) return null;
        try {
            return await this.binLookup.lookup(card.number);
        } catch (error) {
            // Logging disabled
            return null;
        }
    }

    /**
     * Execute with retry logic
     * @protected
     */
    async withRetry(fn, context = {}) {
        if (!this.retryHandler) {
            return await fn();
        }
        return await this.retryHandler.execute(fn, { label: this.getName(), ...context });
    }

    /**
     * Handle Stripe error and convert to ValidationResult
     * @protected
     */
    handleError(error) {
        if (this.errorHandler) {
            return this.errorHandler.handle(error);
        }
        return ValidationResult.error(error.message || 'Unknown error');
    }

    /**
     * Log validation start
     * @protected
     */
    logStart(card, method) {
        // Logging disabled
    }

    /**
     * Log validation result
     * @protected
     */
    logResult(card, result) {
        // Logging disabled
    }
}
