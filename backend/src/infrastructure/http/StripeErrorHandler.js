import { ValidationResult } from '../../domain/ValidationResult.js';

/**
 * Centralized Stripe API error handler
 * Maps Stripe error codes and decline codes to ValidationResult
 * Based on comprehensive PHP checker reference
 */
export class StripeErrorHandler {
    // LIVE codes - card number valid, CVV wrong
    static CCN_LIVE_CODES = ['incorrect_cvc', 'invalid_cvc'];
    
    // LIVE codes - card is valid and active (CVV matched)
    static CVV_LIVE_CODES = ['insufficient_funds', 'incorrect_zip'];
    
    // LIVE codes - 3DS required (card is valid)
    static THREEDS_CODES = ['authentication_required', 'card_error_authentication_required'];
    
    // DEAD codes - card blocked/restricted
    static BLOCKED_DEAD_CODES = ['stolen_card', 'lost_card', 'pickup_card', 'restricted_card', 'security_violation'];
    
    // DEAD codes - fraud related
    static FRAUD_DEAD_CODES = ['fraudulent'];
    
    // DEAD codes - generic declines
    static DECLINE_DEAD_CODES = [
        'do_not_honor', 
        'generic_decline', 
        'transaction_not_allowed',
        'card_not_supported',
        'currency_not_supported',
        'service_not_allowed',
        'invalid_account'
    ];
    
    // DEAD codes - card data issues
    static INVALID_CARD_CODES = [
        'card_declined',
        'incorrect_number', 
        'invalid_number', 
        'invalid_expiry_month', 
        'invalid_expiry_year', 
        'expired_card',
        'processing_error'
    ];

    /**
     * Parse Stripe error from axios error response
     * @param {Error} error - Axios error object
     * @returns {ValidationResult}
     */
    handle(error) {
        const statusCode = error.response?.status;
        const stripeError = error.response?.data?.error;
        const code = stripeError?.code;
        const declineCode = stripeError?.decline_code;
        const message = stripeError?.message || error.message;
        
        // Extract risk data from error response (available on some declines)
        const charge = stripeError?.charge || stripeError?.payment_intent?.latest_charge;
        const outcome = charge?.outcome || {};
        const riskData = {
            riskLevel: outcome.risk_level,
            riskScore: outcome.risk_score,
            networkStatus: outcome.network_status,
            sellerMessage: outcome.seller_message,
            type: outcome.type,
            reason: outcome.reason
        };

        // Handle unusual HTTP status codes (bot protection, proxy issues)
        if (statusCode === 492 || statusCode === 493 || statusCode === 520 || statusCode === 521 || statusCode === 522) {
            // Log full error for debugging
            console.log(`[StripeError] ⚠️ HTTP ${statusCode} Bot Protection Triggered`);
            console.log(`[StripeError] Full response:`, JSON.stringify(error.response?.data || {}, null, 2));
            console.log(`[StripeError] Headers:`, JSON.stringify(error.response?.headers || {}, null, 2));
            return ValidationResult.error(`Bot protection triggered (HTTP ${statusCode}) - try different proxy/IP`, {
                httpStatus: statusCode,
                responseData: error.response?.data,
                headers: error.response?.headers
            });
        }

        // CloudFlare errors
        if (statusCode >= 520 && statusCode <= 530) {
            return ValidationResult.error(`CloudFlare error (HTTP ${statusCode}) - origin server issue`);
        }

        // IP restriction error
        if (message?.includes('does not allow requests from your IP')) {
            return ValidationResult.error('IP restricted - API key has IP whitelist enabled');
        }

        // Rate limiting
        if (statusCode === 429) {
            return ValidationResult.error('Rate limited (HTTP 429) - slow down requests');
        }

        // Forbidden (often bot detection)
        if (statusCode === 403) {
            return ValidationResult.error('Forbidden (HTTP 403) - possible bot detection or IP block');
        }

        // Log risk data if available
        if (riskData.riskLevel || riskData.sellerMessage) {
            console.log(`[StripeError] Risk: ${riskData.riskLevel || 'N/A'} | Score: ${riskData.riskScore || 'N/A'} | ${riskData.sellerMessage || ''}`);
        }

        // CCN LIVE - card number valid but CVV wrong
        if (this.matchesCode(code, declineCode, StripeErrorHandler.CCN_LIVE_CODES)) {
            return ValidationResult.live('CCN Match (Incorrect CVV)', { declineCode: declineCode || code, riskData });
        }

        // CVV LIVE - card is valid and active
        if (code === 'insufficient_funds' || declineCode === 'insufficient_funds') {
            return ValidationResult.live('CVV Match (Insufficient Funds)', { declineCode: 'insufficient_funds', riskData });
        }

        if (code === 'incorrect_zip' || declineCode === 'incorrect_zip') {
            return ValidationResult.live('CVV Match (Incorrect ZIP)', { declineCode: 'incorrect_zip', riskData });
        }

        // 3DS Required - card is valid but needs authentication
        if (this.matchesCode(code, declineCode, StripeErrorHandler.THREEDS_CODES)) {
            return ValidationResult.live('3DS Required', { declineCode: 'authentication_required', riskData });
        }

        // Blocked/restricted cards - DEAD
        if (this.matchesCode(code, declineCode, StripeErrorHandler.BLOCKED_DEAD_CODES)) {
            const matchedCode = declineCode || code;
            return ValidationResult.die(`Declined: ${matchedCode.toUpperCase()}`, { declineCode: matchedCode, riskData });
        }

        // Fraud - DEAD
        if (this.matchesCode(code, declineCode, StripeErrorHandler.FRAUD_DEAD_CODES)) {
            return ValidationResult.die('Declined: FRAUDULENT', { declineCode: 'fraudulent', riskData });
        }

        // Generic declines - DEAD
        if (this.matchesCode(code, declineCode, StripeErrorHandler.DECLINE_DEAD_CODES)) {
            const matchedCode = declineCode || code;
            return ValidationResult.die(`Declined: ${matchedCode.toUpperCase().replace(/_/g, ' ')}`, { declineCode: matchedCode, riskData });
        }

        // Invalid card data - DEAD
        if (this.matchesCode(code, declineCode, StripeErrorHandler.INVALID_CARD_CODES)) {
            const matchedCode = declineCode || code;
            return ValidationResult.die(`Declined: ${matchedCode.toUpperCase().replace(/_/g, ' ')}`, { declineCode: matchedCode, riskData });
        }

        // Generic card declined
        if (code === 'card_declined') {
            return ValidationResult.die(`Declined: ${(declineCode || 'GENERIC').toUpperCase()}`, { declineCode: declineCode || 'generic_decline', riskData });
        }

        // CVC check results
        if (message?.includes('cvc_check')) {
            if (message.includes('"fail"') || message.includes('"unavailable"') || message.includes('"unchecked"')) {
                return ValidationResult.die('CVC Check Failed', { declineCode: 'cvc_check_failed' });
            }
        }

        // API errors
        if (code === 'invalid_api_key' || code === 'api_key_expired') {
            return ValidationResult.error('Invalid or expired Stripe API key');
        }

        if (code === 'testmode_charges_only') {
            return ValidationResult.error('Test mode key - use live key');
        }

        // Raw card API not enabled (Stripe no longer supports this)
        if (message?.includes('Sending credit card numbers directly') || message?.includes('Stripe Elements')) {
            return ValidationResult.error('Direct card API not supported - use Playwright tokenization');
        }

        // Rate limit
        if (code === 'rate_limit' || code === 'card_decline_rate_limit_exceeded' || message?.includes('rate_limit')) {
            return ValidationResult.error('Rate limited - try again later');
        }

        // Parameter errors
        if (code === 'parameter_invalid_empty') {
            return ValidationResult.error('Invalid card data provided');
        }

        // Default error
        return ValidationResult.error(message || 'Unknown error');
    }

    /**
     * Check if code or declineCode matches any in the list
     */
    matchesCode(code, declineCode, codeList) {
        return codeList.includes(code) || codeList.includes(declineCode);
    }

    /**
     * Interpret CVC check result from successful charge
     * @param {string} cvcCheck - CVC check result from Stripe
     * @param {string} last4 - Last 4 digits of card
     * @returns {ValidationResult}
     */
    interpretCvcCheck(cvcCheck, last4 = '****') {
        if (cvcCheck === 'pass') {
            console.log(`[StripeError] ✓ ${last4} - CVV LIVE`);
            return ValidationResult.live('CVV Match ✓', { fraudData: { cvcCheck } });
        }

        if (cvcCheck === 'fail') {
            console.log(`[StripeError] ~ ${last4} - CCN LIVE (CVV fail)`);
            return ValidationResult.live('CCN Match (Incorrect CVV)', { fraudData: { cvcCheck } });
        }

        if (cvcCheck === 'unavailable' || cvcCheck === 'unchecked') {
            console.log(`[StripeError] ? ${last4} - CVC unchecked`);
            return ValidationResult.live(`Card valid (CVC: ${cvcCheck})`, { fraudData: { cvcCheck } });
        }

        return ValidationResult.live(`Card valid (CVC: ${cvcCheck || 'unknown'})`, { fraudData: { cvcCheck } });
    }
}

// Export singleton
export const stripeErrorHandler = new StripeErrorHandler();
