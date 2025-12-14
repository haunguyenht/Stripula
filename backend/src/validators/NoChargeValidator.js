import { BaseValidator } from './BaseValidator.js';
import { ValidationResult } from '../domain/ValidationResult.js';
import { generateRealisticIdentity } from '../utils/identity.js';

/**
 * NoCharge Validator
 * Validates cards by attaching to customer without charging
 * Uses SetupIntent flow to check cvc_check
 */
export class NoChargeValidator extends BaseValidator {
    getName() {
        return 'NoChargeValidator';
    }

    async validate(card, keys, proxy = null) {
        const startTime = Date.now();
        this.logStart(card, 'no-charge');

        // Lookup BIN in parallel
        const binPromise = this.lookupBin(card);

        try {
            // Step 1: Create PaymentMethod via Playwright
            console.log(`[${this.getName()}] Step 1: Creating PaymentMethod...`);
            const pmResult = await this.browserService.createPaymentMethod(keys.pk, card);

            if (!pmResult.success) {
                const binData = await binPromise;
                return ValidationResult.error(`Tokenization failed: ${pmResult.error}`, {
                    binData,
                    method: 'nocharge'
                });
            }

            // Step 2: Create customer
            console.log(`[${this.getName()}] Step 2: Creating customer...`);
            const identity = await generateRealisticIdentity();
            const customer = await this.stripeClient.createCustomer(keys.sk, {
                email: identity.email,
                description: `Verification ${Date.now()}`,
                address: {
                    line1: identity.street,
                    city: identity.city,
                    state: identity.state,
                    postalCode: identity.zip,
                    country: identity.country
                }
            }, proxy);

            // Step 3: Attach PaymentMethod to customer
            console.log(`[${this.getName()}] Step 3: Attaching PaymentMethod to customer...`);
            const attachResult = await this.stripeClient.attachPaymentMethod(
                keys.sk,
                pmResult.paymentMethodId,
                customer.id,
                proxy
            );

            // Extract CVC check result
            const cvcCheck = attachResult.card?.checks?.cvc_check || 'unknown';
            const binData = await binPromise;
            const duration = Date.now() - startTime;

            // Interpret result
            let result;
            if (cvcCheck === 'pass') {
                result = ValidationResult.live('CVV Match ✓', {
                    binData,
                    cvcCheck,
                    method: 'nocharge',
                    duration,
                    fraudData: { cvcCheck }
                });
            } else if (cvcCheck === 'fail') {
                result = ValidationResult.live('CCN Match (Incorrect CVV)', {
                    binData,
                    cvcCheck,
                    method: 'nocharge',
                    duration,
                    fraudData: { cvcCheck }
                });
            } else {
                result = ValidationResult.live(`Card valid (cvc_check: ${cvcCheck})`, {
                    binData,
                    cvcCheck,
                    method: 'nocharge',
                    duration,
                    fraudData: { cvcCheck }
                });
            }

            this.logResult(card, result);
            return result;

        } catch (error) {
            const binData = await binPromise;
            const duration = Date.now() - startTime;
            const result = this.handleError(error);
            result.binData = binData;
            result.method = 'nocharge';
            result.duration = duration;
            this.logResult(card, result);
            return result;
        }
    }
}
