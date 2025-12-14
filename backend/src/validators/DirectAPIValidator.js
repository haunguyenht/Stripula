import { BaseValidator } from './BaseValidator.js';
import { ValidationResult } from '../domain/ValidationResult.js';

/**
 * Direct API Validator
 * Validates cards using direct Stripe API (no browser)
 * Requires SK with raw card API access
 */
export class DirectAPIValidator extends BaseValidator {
    getName() {
        return 'DirectAPIValidator';
    }

    async validate(card, keys, proxy = null) {
        const startTime = Date.now();
        this.logStart(card, 'direct-api');

        // Lookup BIN in parallel
        const binPromise = this.lookupBin(card);

        try {
            // Step 1: Create source with raw card data
            console.log(`[${this.getName()}] Step 1: Creating source...`);
            const source = await this.stripeClient.createSource(keys.sk, card, proxy);

            // Step 2: Create customer with source
            console.log(`[${this.getName()}] Step 2: Creating customer with source...`);
            const customer = await this.stripeClient.createCustomer(keys.sk, {
                description: `Verification ${Date.now()}`,
                source: source.id
            }, proxy);

            // Step 3: Create charge
            console.log(`[${this.getName()}] Step 3: Charging $1.00...`);
            const charge = await this.stripeClient.createCharge(keys.sk, {
                amount: 100,
                currency: 'usd',
                customerId: customer.id
            }, proxy);

            const cvcCheck = charge.payment_method_details?.card?.checks?.cvc_check || 'unknown';
            const sellerMessage = charge.outcome?.seller_message;

            // Step 4: Refund
            console.log(`[${this.getName()}] Step 4: Refunding...`);
            await this.stripeClient.refund(keys.sk, charge.id, proxy);

            const binData = await binPromise;
            const duration = Date.now() - startTime;

            // Interpret result
            let result;
            if (sellerMessage === 'Payment complete.' && cvcCheck === 'pass') {
                result = ValidationResult.live('CVV Match ✓ (Charged $1.00 + Refunded)', {
                    binData,
                    cvcCheck,
                    chargeId: charge.id,
                    method: 'direct',
                    duration,
                    fraudData: { cvcCheck }
                });
            } else if (cvcCheck === 'fail') {
                result = ValidationResult.live('CCN Match (Incorrect CVV)', {
                    binData,
                    cvcCheck,
                    chargeId: charge.id,
                    method: 'direct',
                    duration,
                    fraudData: { cvcCheck }
                });
            } else {
                result = ValidationResult.live(`Charged $1.00 + Refunded (cvc_check: ${cvcCheck})`, {
                    binData,
                    cvcCheck,
                    chargeId: charge.id,
                    method: 'direct',
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
            result.method = 'direct';
            result.duration = duration;
            this.logResult(card, result);
            return result;
        }
    }
}
