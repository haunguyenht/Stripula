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

    async validate(card, keys, proxy = null, options = {}) {
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 3000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const result = await this._doValidate(card, keys, proxy, options, attempt);
            
            // If bot protection error and not last attempt, retry
            if (result.status === 'ERROR' && 
                result.message?.includes('Bot protection') && 
                attempt < maxRetries) {
                console.log(`[${this.getName()}] ⚠️ Bot protection detected, retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            
            return result;
        }
    }

    async _doValidate(card, keys, proxy, options, attempt = 1) {
        const startTime = Date.now();
        let binData = null;
        
        if (attempt === 1) {
            this.logStart(card, 'charge+refund');
        } else {
            console.log(`[${this.getName()}] Retry attempt ${attempt} for ${card.number}`);
        }

        try {
            // Lookup BIN first (single lookup, pass to Playwright)
            binData = await this.lookupBin(card);

            // Step 1: Create PaymentMethod via Playwright
            console.log(`[${this.getName()}] Step 1: Creating PaymentMethod...`);
            const pmResult = await this.browserService.createPaymentMethod(keys.pk, card, { binData });

            if (!pmResult.success) {
                return ValidationResult.error(`Tokenization failed: ${pmResult.error}`, {
                    binData,
                    method: 'charge'
                });
            }

            console.log(`[${this.getName()}] ✓ PaymentMethod: ${pmResult.paymentMethodId}`);

            // Step 2: Create and confirm PaymentIntent
            // Use custom amount if provided, otherwise random
            const chargeAmount = options.chargeAmount || getRandomChargeAmount();
            console.log(`[${this.getName()}] Step 2: Charging ${formatCurrency(chargeAmount)}...`);

            const intent = await this.stripeClient.createPaymentIntent(keys.sk, {
                amount: chargeAmount,
                currency: 'usd',
                paymentMethod: pmResult.paymentMethodId,
                confirm: true
            }, proxy);

            // Extract fraud/risk data (expanded latest_charge gives full outcome)
            const charge = intent.latest_charge || intent.charges?.data?.[0] || {};
            const outcome = charge.outcome || {};
            const cardChecks = charge.payment_method_details?.card?.checks || {};

            const riskLevel = outcome.risk_level || 'unknown';
            const riskScore = outcome.risk_score;
            const cvcCheck = cardChecks.cvc_check || 'unknown';
            const avsCheck = cardChecks.address_postal_code_check || cardChecks.address_line1_check || 'unknown';
            
            // Log Radar data for debugging
            console.log(`[${this.getName()}] 📊 Radar: risk_level=${riskLevel} | risk_score=${riskScore || 'N/A'} | type=${outcome.type || 'N/A'}`);
            console.log(`[${this.getName()}] 📊 Checks: cvc=${cvcCheck} | avs=${avsCheck} | network_status=${outcome.network_status || 'N/A'}`);
            if (outcome.seller_message) {
                console.log(`[${this.getName()}] 📊 Seller message: ${outcome.seller_message}`);
            }

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
                const result = ValidationResult.approved(
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
                        chargeAmount,
                        chargeAmountFormatted: formatCurrency(chargeAmount),
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
            const duration = Date.now() - startTime;
            
            // Try to extract risk data from the error response
            const stripeError = error.response?.data?.error;
            const paymentIntent = stripeError?.payment_intent;
            const latestCharge = paymentIntent?.latest_charge;
            const outcome = latestCharge?.outcome || {};
            
            // Log risk data if available from declined charge
            if (outcome.risk_level || outcome.seller_message) {
                console.log(`[${this.getName()}] 📊 Declined Risk: ${outcome.risk_level || 'N/A'} | Score: ${outcome.risk_score || 'N/A'}`);
                console.log(`[${this.getName()}] 📊 Reason: ${outcome.seller_message || stripeError?.decline_code || 'N/A'}`);
            }
            
            const result = this.handleError(error);
            
            // Include binData and risk data in the result (with fallback)
            result.binData = binData || {
                scheme: null,
                type: null,
                category: null,
                country: null,
                countryCode: null,
                countryEmoji: null,
                bank: null
            };
            result.riskData = {
                riskLevel: outcome.risk_level,
                riskScore: outcome.risk_score,
                sellerMessage: outcome.seller_message,
                networkStatus: outcome.network_status,
                type: outcome.type,
                reason: outcome.reason
            };
            result.method = 'charge';
            result.duration = duration;
            
            this.logResult(card, result);
            return result;
        }
    }
}
