import { ChargeValidator } from './ChargeValidator.js';
import { NoChargeValidator } from './NoChargeValidator.js';
import { SetupValidator } from './SetupValidator.js';
import { CheckoutSessionValidator } from './CheckoutSessionValidator.js';
import { VALIDATION_METHODS } from '../utils/constants.js';

/**
 * Validator Factory
 * Creates appropriate validator based on validation method
 */
export class ValidatorFactory {
    constructor(dependencies) {
        this.dependencies = dependencies;
        this.validators = new Map();
    }

    /**
     * Get or create validator for method
     * @param {string} method - Validation method
     * @returns {BaseValidator}
     */
    getValidator(method) {
        if (this.validators.has(method)) {
            return this.validators.get(method);
        }

        const validator = this.createValidator(method);
        this.validators.set(method, validator);
        return validator;
    }

    /**
     * Create validator instance
     * @private
     */
    createValidator(method) {
        switch (method) {
            case VALIDATION_METHODS.CHARGE:
                return new ChargeValidator(this.dependencies);
            
            case VALIDATION_METHODS.NO_CHARGE:
                return new NoChargeValidator(this.dependencies);
            
            case VALIDATION_METHODS.SETUP:
                return new SetupValidator(this.dependencies);
            
            case VALIDATION_METHODS.CHECKOUT:
                return new CheckoutSessionValidator(this.dependencies);
            
            default:
                console.log(`[ValidatorFactory] Unknown method: ${method}, defaulting to charge`);
                return new ChargeValidator(this.dependencies);
        }
    }

    /**
     * Get all available validation methods
     */
    getAvailableMethods() {
        return Object.values(VALIDATION_METHODS);
    }
}
