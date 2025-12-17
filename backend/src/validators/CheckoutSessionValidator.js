import { BaseValidator } from './BaseValidator.js';
import { ValidationResult } from '../domain/ValidationResult.js';
import { getRandomChargeAmount, formatCurrency } from '../utils/helpers.js';
import Stripe from 'stripe';
import { STRIPE_API_VERSION } from '../utils/constants.js';

/**
 * Checkout Session Validator
 * Uses Stripe Checkout Sessions API with custom UI mode
 * This is Stripe's official approach and less likely to trigger bot detection
 */
export class CheckoutSessionValidator extends BaseValidator {
    getName() {
        return 'CheckoutSessionValidator';
    }

    /**
     * Create a Checkout Session for card validation
     * @param {StripeKeys} keys - Stripe keys
     * @param {number} amount - Amount in cents
     * @returns {Promise<Object>}
     */
    async createCheckoutSession(keys, amount = 100) {
        const stripe = new Stripe(keys.sk, {
            apiVersion: STRIPE_API_VERSION
        });

        const session = await stripe.checkout.sessions.create({
            ui_mode: 'custom',
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Card Validation',
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            return_url: 'http://localhost:5001/checkout-complete?session_id={CHECKOUT_SESSION_ID}',
        });

        return {
            sessionId: session.id,
            clientSecret: session.client_secret,
            amount
        };
    }

    /**
     * Get session status and payment details
     * @param {StripeKeys} keys - Stripe keys
     * @param {string} sessionId - Checkout Session ID
     * @returns {Promise<Object>}
     */
    async getSessionStatus(keys, sessionId) {
        const stripe = new Stripe(keys.sk, {
            apiVersion: STRIPE_API_VERSION
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent', 'payment_intent.latest_charge']
        });

        const paymentIntent = session.payment_intent;
        const charge = paymentIntent?.latest_charge;
        const outcome = charge?.outcome || {};
        const cardChecks = charge?.payment_method_details?.card?.checks || {};

        return {
            status: session.status,
            paymentStatus: session.payment_status,
            paymentIntentId: paymentIntent?.id,
            paymentIntentStatus: paymentIntent?.status,
            chargeId: charge?.id,
            riskLevel: outcome.risk_level,
            riskScore: outcome.risk_score,
            sellerMessage: outcome.seller_message,
            networkStatus: outcome.network_status,
            cvcCheck: cardChecks.cvc_check,
            avsCheck: cardChecks.address_postal_code_check || cardChecks.address_line1_check,
            outcome
        };
    }

    /**
     * Refund a completed session
     * @param {StripeKeys} keys - Stripe keys
     * @param {string} chargeId - Charge ID to refund
     * @returns {Promise<Object>}
     */
    async refundSession(keys, chargeId) {
        const stripe = new Stripe(keys.sk, {
            apiVersion: STRIPE_API_VERSION
        });

        const refund = await stripe.refunds.create({
            charge: chargeId
        });

        return {
            refundId: refund.id,
            status: refund.status
        };
    }

    /**
     * Validate using browser-based checkout session
     * This method is used by Playwright to fill the checkout form
     */
    async validate(card, keys, proxy = null, options = {}) {
        const startTime = Date.now();
        this.logStart(card, 'checkout-session');

        try {
            // Create checkout session
            const chargeAmount = options.chargeAmount || getRandomChargeAmount();
            console.log(`[${this.getName()}] Step 1: Creating Checkout Session for ${formatCurrency(chargeAmount)}...`);
            
            const session = await this.createCheckoutSession(keys, chargeAmount);
            console.log(`[${this.getName()}] ✓ Session: ${session.sessionId}`);

            // Step 2: Use Playwright to fill the checkout form
            console.log(`[${this.getName()}] Step 2: Filling checkout via Playwright...`);
            
            const checkoutResult = await this.browserService.fillCheckoutSession(
                keys.pk,
                session.clientSecret,
                card
            );

            if (!checkoutResult.success) {
                const binData = await this.lookupBin(card);
                return ValidationResult.error(`Checkout failed: ${checkoutResult.error}`, {
                    binData,
                    method: 'checkout',
                    sessionId: session.sessionId
                });
            }

            // Step 3: Get session status
            console.log(`[${this.getName()}] Step 3: Checking session status...`);
            const status = await this.getSessionStatus(keys, session.sessionId);
            
            console.log(`[${this.getName()}] 📊 Status: ${status.status} | Payment: ${status.paymentStatus}`);
            console.log(`[${this.getName()}] 📊 Risk: ${status.riskLevel || 'N/A'} | Score: ${status.riskScore || 'N/A'}`);
            console.log(`[${this.getName()}] 📊 CVC: ${status.cvcCheck || 'N/A'} | AVS: ${status.avsCheck || 'N/A'}`);

            const binData = await this.lookupBin(card);
            const duration = Date.now() - startTime;

            if (status.status === 'complete' && status.chargeId) {
                // Step 4: Refund
                console.log(`[${this.getName()}] Step 4: Refunding...`);
                await this.refundSession(keys, status.chargeId);
                console.log(`[${this.getName()}] ✓ Refunded`);

                const result = ValidationResult.approved(
                    `Checkout ${formatCurrency(chargeAmount)} + Refunded | Risk: ${status.riskLevel || 'unknown'} | CVC: ${status.cvcCheck || 'unknown'}`,
                    {
                        binData,
                        riskLevel: status.riskLevel,
                        riskScore: status.riskScore,
                        cvcCheck: status.cvcCheck,
                        avsCheck: status.avsCheck,
                        sellerMessage: status.sellerMessage,
                        sessionId: session.sessionId,
                        paymentIntentId: status.paymentIntentId,
                        chargeId: status.chargeId,
                        chargeAmount,
                        chargeAmountFormatted: formatCurrency(chargeAmount),
                        method: 'checkout',
                        duration,
                        fraudData: {
                            cvcCheck: status.cvcCheck,
                            avsCheck: status.avsCheck,
                            riskLevel: status.riskLevel,
                            riskScore: status.riskScore
                        }
                    }
                );

                this.logResult(card, result);
                return result;
            }

            // Payment failed
            return ValidationResult.error(`Session status: ${status.status}`, {
                binData,
                sessionId: session.sessionId,
                status: status.status,
                paymentStatus: status.paymentStatus,
                method: 'checkout',
                duration
            });

        } catch (error) {
            const binData = await this.lookupBin(card);
            const duration = Date.now() - startTime;
            const result = this.handleError(error);
            result.binData = binData;
            result.method = 'checkout';
            result.duration = duration;
            this.logResult(card, result);
            return result;
        }
    }
}
