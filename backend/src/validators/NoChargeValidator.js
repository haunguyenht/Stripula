import { BaseValidator } from './BaseValidator.js';
import { ValidationResult } from '../domain/ValidationResult.js';

/**
 * NoCharge Validator
 * Validates cards using SetupIntent flow (most accurate CVV check)
 * Does not charge the card - only validates it can be saved for future use
 */
export class NoChargeValidator extends BaseValidator {
    getName() {
        return 'NoChargeValidator';
    }

    async validate(card, keys, proxy = null) {
        const startTime = Date.now();
        this.logStart(card, 'setup-intent');

        // Lookup BIN in parallel
        const binPromise = this.lookupBin(card);

        try {
            // Step 1: Create SetupIntent (server-side)
            console.log(`[${this.getName()}] Step 1: Creating SetupIntent...`);
            const setupIntent = await this.stripeClient.createSetupIntentForClient(keys.sk, {
                usage: 'off_session'
            }, proxy);

            if (!setupIntent.client_secret) {
                const binData = await binPromise;
                return ValidationResult.error('Failed to create SetupIntent', {
                    binData,
                    method: 'nocharge'
                });
            }

            console.log(`[${this.getName()}] ✓ SetupIntent: ${setupIntent.id}`);

            // Step 2: Confirm SetupIntent with card via Playwright (most accurate CVV check)
            console.log(`[${this.getName()}] Step 2: Confirming with card...`);
            const confirmResult = await this.browserService.confirmSetupIntent(
                keys.pk,
                setupIntent.client_secret,
                card
            );

            const binData = await binPromise;
            const duration = Date.now() - startTime;

            if (!confirmResult.success) {
                // Parse the error for more detail
                const result = this.interpretSetupError(confirmResult, binData, duration);
                this.logResult(card, result);
                return result;
            }

            // Extract CVC check from confirmed SetupIntent
            const cvcCheck = confirmResult.cvcCheck || 'unknown';
            
            // Interpret CVV result
            let result;
            if (cvcCheck === 'pass') {
                result = ValidationResult.live('CVV Match ✓', {
                    binData,
                    cvcCheck,
                    method: 'nocharge',
                    duration,
                    paymentMethodId: confirmResult.paymentMethodId,
                    setupIntentId: confirmResult.setupIntentId,
                    fraudData: { cvcCheck, radarSession: confirmResult.radarSession }
                });
            } else if (cvcCheck === 'fail') {
                result = ValidationResult.live('CCN Match (Incorrect CVV)', {
                    binData,
                    cvcCheck,
                    method: 'nocharge',
                    duration,
                    paymentMethodId: confirmResult.paymentMethodId,
                    fraudData: { cvcCheck }
                });
            } else if (cvcCheck === 'unchecked') {
                result = ValidationResult.live('Card Valid (CVV not checked)', {
                    binData,
                    cvcCheck,
                    method: 'nocharge',
                    duration,
                    paymentMethodId: confirmResult.paymentMethodId,
                    fraudData: { cvcCheck }
                });
            } else {
                result = ValidationResult.live(`Card Valid (cvc: ${cvcCheck})`, {
                    binData,
                    cvcCheck,
                    method: 'nocharge',
                    duration,
                    paymentMethodId: confirmResult.paymentMethodId,
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

    /**
     * Interpret SetupIntent confirmation errors
     * @private
     */
    interpretSetupError(confirmResult, binData, duration) {
        const error = confirmResult.error || 'Unknown error';
        const code = confirmResult.code;
        const declineCode = confirmResult.decline_code;

        // Comprehensive decline code handling
        const declineMessages = {
            'insufficient_funds': 'Insufficient Funds',
            'lost_card': 'Lost Card',
            'stolen_card': 'Stolen Card',
            'expired_card': 'Expired Card',
            'incorrect_cvc': 'Incorrect CVV',
            'incorrect_number': 'Incorrect Number',
            'card_declined': 'Card Declined',
            'processing_error': 'Processing Error',
            'do_not_honor': 'Do Not Honor',
            'pickup_card': 'Pickup Card',
            'card_not_supported': 'Card Not Supported',
            'invalid_account': 'Invalid Account',
            'new_account_information_available': 'New Account Info Available',
            'try_again_later': 'Try Again Later',
            'fraudulent': 'Fraudulent',
            'generic_decline': 'Generic Decline',
            'invalid_cvc': 'Invalid CVV',
            'invalid_expiry_month': 'Invalid Expiry Month',
            'invalid_expiry_year': 'Invalid Expiry Year',
            'invalid_number': 'Invalid Number',
            'issuer_not_available': 'Issuer Not Available',
            'not_permitted': 'Not Permitted',
            'restricted_card': 'Restricted Card',
            'revocation_of_authorization': 'Revocation Of Authorization',
            'security_violation': 'Security Violation',
            'service_not_allowed': 'Service Not Allowed',
            'transaction_not_allowed': 'Transaction Not Allowed',
            'withdrawal_count_limit_exceeded': 'Withdrawal Limit Exceeded',
            'testmode_decline': 'Test Mode Decline',
            'approve_with_id': 'Approved (ID Required)',
            'call_issuer': 'Call Issuer',
            'card_velocity_exceeded': 'Velocity Exceeded'
        };

        const message = declineMessages[declineCode] || error;
        
        // Determine if it's a dead card or just an error
        const deadCodes = [
            'lost_card', 'stolen_card', 'expired_card', 'fraudulent',
            'pickup_card', 'invalid_account', 'restricted_card',
            'incorrect_number', 'invalid_number'
        ];
        
        if (deadCodes.includes(declineCode)) {
            return ValidationResult.dead(message, {
                binData,
                method: 'nocharge',
                duration,
                code,
                declineCode
            });
        }

        // CVV-related errors indicate card exists but wrong CVV
        if (declineCode === 'incorrect_cvc' || declineCode === 'invalid_cvc') {
            return ValidationResult.live('CCN Match (Incorrect CVV)', {
                binData,
                method: 'nocharge',
                duration,
                code,
                declineCode,
                cvcCheck: 'fail'
            });
        }

        // Generic decline - could be live or dead
        if (declineCode === 'generic_decline' || declineCode === 'card_declined' || declineCode === 'do_not_honor') {
            return ValidationResult.dead(message, {
                binData,
                method: 'nocharge',
                duration,
                code,
                declineCode
            });
        }

        // Default to error for unknown cases
        return ValidationResult.error(message, {
            binData,
            method: 'nocharge',
            duration,
            code,
            declineCode
        });
    }
}
