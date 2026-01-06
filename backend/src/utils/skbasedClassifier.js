/**
 * SK-Based Decline Code Classifier
 * 
 * Classifies Stripe decline codes into status categories (APPROVED, LIVE, DECLINED, ERROR)
 * with user-friendly messages for the SK-based charge validation flow.
 * 
 * Requirements: 9.1-9.23
 */

/**
 * Decline code classification mapping
 * Maps Stripe decline codes to status and message
 * 
 * Status meanings:
 * - APPROVED: Charge succeeded and was refunded
 * - LIVE: Card is valid but declined for specific reasons (CVV valid, insufficient funds, etc.)
 * - DECLINED: Card is invalid or blocked
 * - ERROR: Processing or system error
 */
export const DECLINE_CLASSIFICATION = {
    // ═══════════════════════════════════════════════════════════════════════════
    // APPROVED status (Requirements 9.1-9.3)
    // ═══════════════════════════════════════════════════════════════════════════
    'payment_complete': { status: 'APPROVED', message: 'Payment Complete' },
    'cvc_pass': { status: 'APPROVED', message: 'CVV Approved' },
    'charge_succeeded': { status: 'APPROVED', message: 'Charge Succeeded' },

    // ═══════════════════════════════════════════════════════════════════════════
    // LIVE status - Card is valid but declined for specific reasons
    // (Requirements 9.4, 9.6-9.7, 9.12-9.13)
    // ═══════════════════════════════════════════════════════════════════════════

    // 3DS Required (Requirement 9.4)
    '3ds_required': { status: 'LIVE', message: '3DS Required' },
    'authentication_required': { status: 'LIVE', message: '3DS Required' },

    // Insufficient Funds (Requirement 9.6)
    'insufficient_funds': { status: 'LIVE', message: 'Insufficient Funds (CVV Valid)' },

    // CVC Issues (Requirements 9.12-9.13) - Card number is valid
    'incorrect_cvc': { status: 'LIVE', message: 'CCN (Incorrect CVC)' },
    'invalid_cvc': { status: 'LIVE', message: 'CCN (Invalid CVC)' },

    // ═══════════════════════════════════════════════════════════════════════════
    // DECLINED status - Card is invalid or blocked
    // (Requirements 9.5, 9.8-9.11, 9.14-9.22)
    // ═══════════════════════════════════════════════════════════════════════════

    // Generic Decline (Requirement 9.5)
    'generic_decline': { status: 'DECLINED', message: 'Generic Decline' },
    'card_declined': { status: 'DECLINED', message: 'Card Declined' },

    // Do Not Honor (Requirement 9.8)
    'do_not_honor': { status: 'DECLINED', message: 'Do Not Honor' },

    // Lost Card (Requirement 9.9)
    'lost_card': { status: 'DECLINED', message: 'Lost Card' },

    // Stolen Card (Requirement 9.10)
    'stolen_card': { status: 'DECLINED', message: 'Stolen Card' },

    // Pickup Card (Requirement 9.11)
    'pickup_card': { status: 'DECLINED', message: 'Pickup Card (Reported Stolen/Lost)' },

    // Expired Card (Requirement 9.14)
    'expired_card': { status: 'DECLINED', message: 'Expired Card' },

    // Incorrect Number (Requirement 9.16)
    'incorrect_number': { status: 'DECLINED', message: 'Incorrect Card Number' },
    'invalid_number': { status: 'DECLINED', message: 'Invalid Card Number' },

    // Service Not Allowed (Requirement 9.17)
    'service_not_allowed': { status: 'DECLINED', message: 'Service Not Allowed' },

    // Transaction Not Allowed (Requirement 9.18)
    'transaction_not_allowed': { status: 'DECLINED', message: 'Transaction Not Allowed' },

    // Invalid Account (Requirement 9.19)
    'invalid_account': { status: 'DECLINED', message: 'Invalid Account' },

    // CVC Check Failed (Requirement 9.21)
    'cvc_fail': { status: 'DECLINED', message: 'CVC Check Failed' },

    // CVC Check Unavailable (Requirement 9.22)
    'cvc_unavailable': { status: 'DECLINED', message: 'CVC Check Unavailable' },

    // Additional common decline codes
    'restricted_card': { status: 'DECLINED', message: 'Restricted Card' },
    'security_violation': { status: 'DECLINED', message: 'Security Violation' },
    'fraudulent': { status: 'DECLINED', message: 'Fraudulent Card' },
    'invalid_expiry_month': { status: 'DECLINED', message: 'Invalid Expiry Month' },
    'invalid_expiry_year': { status: 'DECLINED', message: 'Invalid Expiry Year' },
    'invalid_expiry': { status: 'DECLINED', message: 'Invalid Expiry' },
    'currency_not_supported': { status: 'DECLINED', message: 'Currency Not Supported' },
    'card_not_supported': { status: 'LIVE', message: '3DS Not Supported - CCN Valid' },
    'new_account_information_available': { status: 'DECLINED', message: 'Card Reissued' },

    // ═══════════════════════════════════════════════════════════════════════════
    // ERROR status - Processing or system errors
    // (Requirements 9.15, 9.20, 9.23)
    // ═══════════════════════════════════════════════════════════════════════════

    // Processing Error (Requirement 9.15)
    'processing_error': { status: 'ERROR', message: 'Processing Error' },

    // CVC Unchecked - Proxy Error (Requirement 9.20)
    'cvc_unchecked': { status: 'ERROR', message: 'CVC Unchecked (Proxy Error)' },

    // Network/Proxy errors (Requirement 9.23)
    'network_error': { status: 'ERROR', message: 'Network Error' },
    'proxy_error': { status: 'ERROR', message: 'Proxy Connection Error' },
    'timeout': { status: 'ERROR', message: 'Request Timeout' },
    'connection_error': { status: 'ERROR', message: 'Connection Error' },

    // Additional error codes
    'issuer_not_available': { status: 'ERROR', message: 'Issuer Not Available' },
    'try_again_later': { status: 'ERROR', message: 'Try Again Later' },
    'rate_limited': { status: 'ERROR', message: 'Rate Limited' },
    'api_error': { status: 'ERROR', message: 'API Error' },
};

/**
 * Classify a Stripe decline code into status and message
 * 
 * @param {string} declineCode - The Stripe decline code
 * @param {string} cvcCheck - The CVC check result (pass, fail, unavailable, unchecked)
 * @param {object} chargeOutcome - The charge outcome object from Stripe
 * @returns {object} - { status, message } classification
 */
export function classifyDecline(declineCode, cvcCheck = null, chargeOutcome = null) {
    // Handle null/undefined decline code
    if (!declineCode) {
        // Check CVC status for classification
        if (cvcCheck === 'pass') {
            return { status: 'APPROVED', message: 'CVV Approved' };
        }
        if (cvcCheck === 'unchecked') {
            return { status: 'ERROR', message: 'CVC Unchecked (Proxy Error)' };
        }
        if (cvcCheck === 'fail') {
            return { status: 'DECLINED', message: 'CVC Check Failed' };
        }
        if (cvcCheck === 'unavailable') {
            return { status: 'DECLINED', message: 'CVC Check Unavailable' };
        }

        // Check network status from charge outcome
        if (chargeOutcome?.network_status === 'not_sent_to_network') {
            return { status: 'DECLINED', message: 'Blocked by Radar' };
        }

        return { status: 'ERROR', message: 'Unknown Error' };
    }

    // Normalize the decline code
    const normalizedCode = declineCode.toLowerCase().replace(/[\s-]/g, '_');

    // Look up in classification map
    const classification = DECLINE_CLASSIFICATION[normalizedCode];
    if (classification) {
        return { ...classification };
    }

    // Special handling for CVC-related outcomes
    if (cvcCheck === 'pass' && !classification) {
        // CVC passed but got a decline - card is live
        return { status: 'LIVE', message: `${humanize(declineCode)} (CVV Valid)` };
    }

    if (cvcCheck === 'unchecked') {
        return { status: 'ERROR', message: 'CVC Unchecked (Proxy Error)' };
    }

    // Check network status for Radar blocks
    if (chargeOutcome?.network_status === 'not_sent_to_network') {
        return { status: 'DECLINED', message: 'Blocked by Radar' };
    }

    // Default to DECLINED with humanized message
    return {
        status: 'DECLINED',
        message: humanize(declineCode)
    };
}

/**
 * Humanize a decline code string for display
 * @param {string} code - Code to humanize
 * @returns {string} - Human readable string
 */
function humanize(code) {
    if (!code) return 'Unknown';
    const result = code
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
    return result || 'Unknown';
}

/**
 * Get all known decline codes
 * @returns {string[]} - Array of all known decline codes
 */
export function getAllDeclineCodes() {
    return Object.keys(DECLINE_CLASSIFICATION);
}

/**
 * Check if a decline code indicates a live card
 * @param {string} declineCode - The decline code to check
 * @returns {boolean} - True if the card is considered live
 */
export function isLiveCard(declineCode) {
    if (!declineCode) return false;
    const normalizedCode = declineCode.toLowerCase().replace(/[\s-]/g, '_');
    const classification = DECLINE_CLASSIFICATION[normalizedCode];
    return classification?.status === 'LIVE' || classification?.status === 'APPROVED';
}

export default classifyDecline;
