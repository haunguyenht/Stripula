import { ValidationResult } from '../../domain/ValidationResult.js';

/**
 * Centralized Stripe API error handler
 * Maps Stripe error codes and decline codes to ValidationResult
 */
export class StripeErrorHandler {
    // Decline codes that indicate card is live but CVV is wrong
    static CCN_LIVE_CODES = ['incorrect_cvc'];
    
    // Decline codes that indicate card is live and active
    static CVV_LIVE_CODES = ['insufficient_funds', 'incorrect_zip'];
    
    // Decline codes that indicate card is live but blocked/restricted
    static BLOCKED_LIVE_CODES = ['stolen_card', 'lost_card', 'pickup_card', 'restricted_card', 'security_violation'];
    
    // Decline codes that suggest retry later
    static RETRY_CODES = ['try_again_later', 'do_not_honor', 'processing_error'];
    
    // Dead card codes
    static DEAD_CODES = ['card_declined', 'incorrect_number', 'invalid_number', 'invalid_expiry_month', 'invalid_expiry_year', 'expired_card', 'invalid_cvc'];

    /**
     * Parse Stripe error from axios error response
     * @param {Error} error - Axios error object
     * @returns {ValidationResult}
     */
    handle(error) {
        const stripeError = error.response?.data?.error;
        const code = stripeError?.code;
        const declineCode = stripeError?.decline_code;
        const message = stripeError?.message || error.message;

        // CCN LIVE - card number valid but CVV wrong
        if (this.matchesCode(code, declineCode, StripeErrorHandler.CCN_LIVE_CODES)) {
            return ValidationResult.live('CCN Match (Incorrect CVV)', { declineCode: 'incorrect_cvc' });
        }

        // CVV LIVE - card is valid and active
        if (code === 'insufficient_funds' || declineCode === 'insufficient_funds') {
            return ValidationResult.live('CVV Match (Insufficient Funds)', { declineCode: 'insufficient_funds' });
        }

        if (code === 'incorrect_zip' || declineCode === 'incorrect_zip') {
            return ValidationResult.live('CVV Match (Incorrect ZIP)', { declineCode: 'incorrect_zip' });
        }

        // Blocked cards - still considered live
        if (this.matchesCode(code, declineCode, StripeErrorHandler.BLOCKED_LIVE_CODES)) {
            const matchedCode = declineCode || code;
            return ValidationResult.live(`Declined: ${matchedCode}`, { declineCode: matchedCode });
        }

        // Retry-able declines - still live
        if (this.matchesCode(code, declineCode, StripeErrorHandler.RETRY_CODES)) {
            const matchedCode = declineCode || code;
            return ValidationResult.live(`Declined: ${matchedCode}`, { declineCode: matchedCode });
        }

        // Generic card declined
        if (code === 'card_declined') {
            return ValidationResult.die(`Declined: ${declineCode || 'generic'}`, { declineCode: declineCode || 'generic_decline' });
        }

        // Invalid card number
        if (code === 'incorrect_number' || code === 'invalid_number') {
            return ValidationResult.die('Invalid card number', { declineCode: code });
        }

        // Invalid/expired card
        if (['invalid_expiry_month', 'invalid_expiry_year', 'expired_card'].includes(code)) {
            return ValidationResult.die('Invalid/expired card', { declineCode: code });
        }

        // Invalid CVC format
        if (code === 'invalid_cvc') {
            return ValidationResult.die('Invalid CVC format', { declineCode: 'invalid_cvc' });
        }

        // API errors
        if (code === 'invalid_api_key') {
            return ValidationResult.error('Invalid Stripe API key');
        }

        if (code === 'testmode_charges_only') {
            return ValidationResult.error('Test mode key - use live key');
        }

        // Raw card API not enabled
        if (message?.includes('Sending credit card numbers directly') || message?.includes('Stripe Elements')) {
            return ValidationResult.error('SK does not have raw card API access - provide PK key to bypass');
        }

        // Rate limit
        if (code === 'rate_limit' || message?.includes('rate_limit')) {
            return ValidationResult.error('Rate limited - try again later');
        }

        // Default error
        return ValidationResult.error(message);
    }

    /**
     * Check if code or declineCode matches any in the list
     */
    matchesCode(code, declineCode, codeList) {
        return codeList.includes(code) || codeList.includes(declineCode);
    }

    /**
     * Interpret CVC check result
     * @param {string} cvcCheck - CVC check result from Stripe
     * @param {string} last4 - Last 4 digits of card
     * @returns {ValidationResult}
     */
    interpretCvcCheck(cvcCheck, last4 = '****') {
        if (cvcCheck === 'pass' || cvcCheck === 'success') {
            console.log(`[StripeError] ✓ ${last4} - CVV LIVE`);
            return ValidationResult.live(`CVV Match ✓ (cvc_check: ${cvcCheck})`, {
                fraudData: { cvcCheck }
            });
        }

        if (cvcCheck === 'fail') {
            console.log(`[StripeError] ~ ${last4} - CCN LIVE (CVV fail)`);
            return ValidationResult.live('CCN Match (Incorrect CVV)', {
                fraudData: { cvcCheck }
            });
        }

        console.log(`[StripeError] ? ${last4} - CVC unchecked: ${cvcCheck}`);
        return ValidationResult.live(`Card valid (cvc_check: ${cvcCheck || 'unchecked'})`, {
            fraudData: { cvcCheck }
        });
    }
}

// Export singleton
export const stripeErrorHandler = new StripeErrorHandler();
