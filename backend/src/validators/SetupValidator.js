import { BaseValidator } from './BaseValidator.js';
import { ValidationResult } from '../domain/ValidationResult.js';

/**
 * Setup Validator
 * Validates cards via Stripe Checkout in setup mode
 * Supports 3DS authentication
 */
export class SetupValidator extends BaseValidator {
    getName() {
        return 'SetupValidator';
    }

    async validate(card, keys, proxy = null) {
        const startTime = Date.now();
        this.logStart(card, 'setup-checkout');

        // Lookup BIN in parallel
        const binPromise = this.lookupBin(card);

        try {
            // Step 1: Create Checkout Session in setup mode
            console.log(`[${this.getName()}] Step 1: Creating Checkout Session...`);
            const session = await this.stripeClient.createCheckoutSession(keys.sk, {
                mode: 'setup'
            }, proxy);

            // Step 2: Fill checkout page via Playwright
            console.log(`[${this.getName()}] Step 2: Filling checkout page...`);
            const checkoutResult = await this.browserService.fillCheckoutPage(session.url, card);

            const binData = await binPromise;
            const duration = Date.now() - startTime;

            if (checkoutResult.success) {
                // Get the SetupIntent from session
                const updatedSession = await this.stripeClient.getCheckoutSession(
                    keys.sk,
                    session.id,
                    ['setup_intent'],
                    proxy
                );

                const result = ValidationResult.live('Card saved via Checkout', {
                    binData,
                    setupIntentId: updatedSession.setup_intent?.id,
                    method: 'setup',
                    duration
                });

                this.logResult(card, result);
                return result;
            }

            // Handle specific error patterns
            const errorMsg = checkoutResult.error?.toLowerCase() || '';
            
            if (errorMsg.includes('incorrect') || errorMsg.includes('cvc') || errorMsg.includes('security')) {
                const result = ValidationResult.live('CCN Match (Incorrect CVC)', {
                    binData,
                    declineCode: 'incorrect_cvc',
                    method: 'setup',
                    duration
                });
                this.logResult(card, result);
                return result;
            }

            if (errorMsg.includes('insufficient') || errorMsg.includes('funds')) {
                const result = ValidationResult.live('CVV Match (Insufficient Funds)', {
                    binData,
                    declineCode: 'insufficient_funds',
                    method: 'setup',
                    duration
                });
                this.logResult(card, result);
                return result;
            }

            const result = ValidationResult.die(checkoutResult.error || 'Checkout failed', {
                binData,
                method: 'setup',
                duration
            });

            this.logResult(card, result);
            return result;

        } catch (error) {
            const binData = await binPromise;
            const duration = Date.now() - startTime;
            const result = this.handleError(error);
            result.binData = binData;
            result.method = 'setup';
            result.duration = duration;
            this.logResult(card, result);
            return result;
        }
    }
}
