import { BaseValidator } from './BaseValidator.js';
import { ValidationResult } from '../domain/ValidationResult.js';
import { getRandomChargeAmount, formatCurrency } from '../utils/helpers.js';

/**
 * Charge Validator
 * Validates cards by charging $0.50-$50 and immediately refunding
 * Uses Playwright for PaymentMethod creation to bypass Radar
 */
export class ChargeValidator extends BaseValidator {
    getName() {
        return 'ChargeValidator';
    }

    async validate(card, keys, proxy = null) {
        const startTime = Date.now();
        this.logStart(card, 'charge+refund');

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
                    method: 'charge'
                });
            }

            console.log(`[${this.getName()}] ✓ PaymentMethod: ${pmResult.paymentMethodId}`);

            // Step 2: Create and confirm PaymentIntent
            const chargeAmount = getRandomChargeAmount();
            console.log(`[${this.getName()}] Step 2: Charging ${formatCurrency(chargeAmount)}...`);

            const intent = await this.stripeClient.createPaymentIntent(keys.sk, {
                amount: chargeAmount,
                currency: 'usd',
                paymentMethod: pmResult.paymentMethodId,
                confirm: true
            }, proxy);

            // Extract fraud/risk data
            const charge = intent.latest_charge || intent.charges?.data?.[0] || {};
            const outcome = charge.outcome || {};
            const cardChecks = charge.payment_method_details?.card?.checks || {};

            const riskLevel = outcome.risk_level || 'unknown';
            const cvcCheck = cardChecks.cvc_check || 'unknown';
            const avsCheck = cardChecks.address_postal_code_check || cardChecks.address_line1_check || 'unknown';

            // Get BIN data
            const binData = await binPromise;

            // Handle 3DS requirement
            if (intent.status === 'requires_action') {
                const duration = Date.now() - startTime;
                return ValidationResult.live('3DS Required', {
                    binData,
                    riskLevel: 'elevated',
                    cvcCheck: 'unchecked',
                    avsCheck: 'unchecked',
                    paymentIntentId: intent.id,
                    method: 'charge',
                    duration,
                    fraudData: { requires3ds: true }
                });
            }

            // Step 3: Refund if succeeded
            if (intent.status === 'succeeded') {
                const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id;
                
                if (chargeId) {
                    console.log(`[${this.getName()}] Step 3: Refunding ${chargeId}...`);
                    await this.stripeClient.refund(keys.sk, chargeId, proxy);
                    console.log(`[${this.getName()}] ✓ Refunded`);
                }

                const duration = Date.now() - startTime;
                const result = ValidationResult.live(
                    `Charged ${formatCurrency(chargeAmount)} + Refunded | Risk: ${riskLevel} | CVC: ${cvcCheck}`,
                    {
                        binData,
                        riskLevel,
                        riskScore: outcome.risk_score || null,
                        cvcCheck,
                        avsCheck,
                        sellerMessage: outcome.seller_message,
                        paymentIntentId: intent.id,
                        chargeId,
                        method: 'charge',
                        duration,
                        fraudData: { cvcCheck, avsCheck, riskLevel, riskScore: outcome.risk_score }
                    }
                );

                this.logResult(card, result);
                return result;
            }

            // Unexpected status
            const duration = Date.now() - startTime;
            return ValidationResult.error(`Unexpected status: ${intent.status}`, {
                binData,
                paymentIntentId: intent.id,
                method: 'charge',
                duration
            });

        } catch (error) {
            const binData = await binPromise;
            const duration = Date.now() - startTime;
            const result = this.handleError(error);
            result.binData = binData;
            result.method = 'charge';
            result.duration = duration;
            this.logResult(card, result);
            return result;
        }
    }
}
