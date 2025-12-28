/**
 * SK-Based Auth Classifier
 * 
 * Classifies SetupIntent responses into LIVE/CCN/DECLINED/ERROR statuses.
 * Based on API Tokenization Research (December 2024).
 * 
 * SetupIntent bypasses Radar and goes directly to bank for $0 authorization.
 */

/**
 * Decline code to status mapping
 * 
 * LIVE: Card is valid and authorized
 * CCN: Card number valid but CVV is wrong
 * DECLINED: Card declined by bank
 * ERROR: Processing error
 */
const DECLINE_CLASSIFICATION = {
    // LIVE status (card works, may have other issues)
    'insufficient_funds': { status: 'LIVE', message: 'Insufficient Funds (Card Valid)' },
    'withdrawal_count_limit_exceeded': { status: 'LIVE', message: 'Daily Limit Reached (Card Valid)' },
    
    // CCN status (card number valid, CVV wrong)
    'incorrect_cvc': { status: 'CCN', message: 'Incorrect CVC' },
    'invalid_cvc': { status: 'CCN', message: 'Invalid CVC' },
    
    // DECLINED status (card blocked/invalid)
    'generic_decline': { status: 'DECLINED', message: 'Generic Decline' },
    'card_declined': { status: 'DECLINED', message: 'Card Declined' },
    'do_not_honor': { status: 'DECLINED', message: 'Do Not Honor' },
    'fraudulent': { status: 'DECLINED', message: 'Fraudulent Card' },
    'lost_card': { status: 'DECLINED', message: 'Lost Card' },
    'stolen_card': { status: 'DECLINED', message: 'Stolen Card' },
    'pickup_card': { status: 'DECLINED', message: 'Pickup Card (Reported Stolen/Lost)' },
    'expired_card': { status: 'DECLINED', message: 'Expired Card' },
    'incorrect_number': { status: 'DECLINED', message: 'Incorrect Card Number' },
    'invalid_number': { status: 'DECLINED', message: 'Invalid Card Number' },
    'invalid_expiry_month': { status: 'DECLINED', message: 'Invalid Expiry Month' },
    'invalid_expiry_year': { status: 'DECLINED', message: 'Invalid Expiry Year' },
    'invalid_account': { status: 'DECLINED', message: 'Invalid Account' },
    'card_not_supported': { status: 'LIVE', message: 'Card Not Supported - CCN Valid' },
    'restricted_card': { status: 'DECLINED', message: 'Restricted Card' },
    'service_not_allowed': { status: 'DECLINED', message: 'Service Not Allowed' },
    'transaction_not_allowed': { status: 'DECLINED', message: 'Transaction Not Allowed' },
    'not_permitted': { status: 'DECLINED', message: 'Not Permitted' },
    'security_violation': { status: 'DECLINED', message: 'Security Violation' },
    'merchant_blacklist': { status: 'DECLINED', message: 'Merchant Blacklist' },
    'new_account_information_available': { status: 'DECLINED', message: 'Card Info Changed' },
    
    // ERROR status (processing issues)
    'processing_error': { status: 'ERROR', message: 'Processing Error' },
    'try_again_later': { status: 'ERROR', message: 'Try Again Later' },
    'issuer_not_available': { status: 'ERROR', message: 'Issuer Not Available' },
    'reenter_transaction': { status: 'ERROR', message: 'Re-enter Transaction' },
    'call_issuer': { status: 'ERROR', message: 'Call Issuer' },
    
    // 3DS related
    'authentication_required': { status: 'LIVE', message: '3DS Required (Card Valid)' },
};

/**
 * Get detailed human-readable decline reason
 * @param {string} declineCode - Stripe decline code
 * @returns {string} Human-readable reason
 */
export function getDeclineReason(declineCode) {
    const reasons = {
        // Card valid but issue
        'insufficient_funds': 'Card valid but no funds available',
        'withdrawal_count_limit_exceeded': 'Card valid but daily limit reached',

        // CVV issues
        'incorrect_cvc': 'Card number valid but CVV is wrong',
        'invalid_cvc': 'CVV format is invalid',

        // Generic declines
        'generic_decline': 'Bank declined - no specific reason given',
        'card_declined': 'Bank declined the transaction',
        'do_not_honor': 'Bank refused - contact card issuer',

        // Fraud/Security
        'fraudulent': 'Card flagged as fraudulent',
        'lost_card': 'Card reported as lost',
        'stolen_card': 'Card reported as stolen',
        'pickup_card': 'Bank requests card pickup - possible fraud',
        'restricted_card': 'Card restricted from this type of transaction',
        'security_violation': 'Security violation detected',
        'merchant_blacklist': 'Card on merchant blocklist',

        // Card issues
        'expired_card': 'Card has expired',
        'invalid_number': 'Card number is invalid',
        'incorrect_number': 'Card number is incorrect',
        'invalid_expiry_month': 'Expiry month is invalid',
        'invalid_expiry_year': 'Expiry year is invalid',
        'invalid_account': 'Card account is invalid or closed',
        'card_not_supported': 'Card not supported by merchant',
        'new_account_information_available': 'Card info has changed - re-enter',

        // Processing issues
        'processing_error': 'Temporary error - try again',
        'try_again_later': 'Bank unavailable - try later',
        'issuer_not_available': 'Card issuer not reachable',
        'reenter_transaction': 'Re-enter transaction',
        'call_issuer': 'Contact card issuer',

        // Transaction issues
        'transaction_not_allowed': 'Transaction type not allowed',
        'not_permitted': 'Transaction not permitted on this card',
        'service_not_allowed': 'Service not allowed for this card',

        // 3DS issues
        'authentication_required': 'Card requires 3DS authentication',
    };

    return reasons[declineCode] || `Unknown decline reason: ${declineCode}`;
}

/**
 * Classify a SetupIntent response into status
 * 
 * @param {string} declineCode - Stripe decline code
 * @param {string} cvcCheck - CVC check result (pass, fail, unavailable, unchecked)
 * @param {string} setupIntentStatus - SetupIntent status (succeeded, requires_action, requires_payment_method)
 * @returns {{ status: string, message: string }}
 */
export function classifyAuthResult(declineCode, cvcCheck, setupIntentStatus) {
    // SetupIntent succeeded = LIVE
    if (setupIntentStatus === 'succeeded') {
        if (cvcCheck === 'pass') {
            return { status: 'LIVE', message: 'Card Authorized (CVC Passed)' };
        }
        if (cvcCheck === 'fail') {
            return { status: 'CCN', message: 'Card Authorized but CVC Failed' };
        }
        return { status: 'LIVE', message: 'Card Authorized' };
    }

    // 3DS required = LIVE (card is valid, just needs verification)
    if (setupIntentStatus === 'requires_action') {
        return { status: 'LIVE', message: '3DS Required (Card Valid)' };
    }

    // Check CVC first
    if (cvcCheck === 'fail') {
        return { status: 'CCN', message: 'Incorrect CVC' };
    }

    // Check decline code
    if (declineCode && DECLINE_CLASSIFICATION[declineCode]) {
        return DECLINE_CLASSIFICATION[declineCode];
    }

    // Default to DECLINED for requires_payment_method
    if (setupIntentStatus === 'requires_payment_method') {
        return { status: 'DECLINED', message: declineCode || 'Card Declined' };
    }

    // Unknown status
    return { status: 'ERROR', message: 'Unknown Status' };
}

export default { classifyAuthResult, getDeclineReason, DECLINE_CLASSIFICATION };
