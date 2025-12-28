/**
 * Gateway Message Formatter (Frontend)
 * Centralizes message formatting for all payment gateway responses
 * Provides standardized, user-friendly messages across all gateways
 */

// Status types for all gateways
export const STATUS_TYPES = {
    APPROVED: 'APPROVED',
    DECLINED: 'DECLINED',
    ERROR: 'ERROR',
    THREE_DS: '3DS_REQUIRED',
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    REFUNDED: 'REFUNDED',
    CANCELLED: 'CANCELLED',
};

// Stripe decline codes with user-friendly messages
// Note: Some decline codes indicate "live" cards (valid but declined for specific reasons)
const STRIPE_DECLINE_CODES = {
    // ═══════════════════════════════════════════════════════════════════════════
    // LIVE card indicators (card is valid but declined for specific reasons)
    // These cards exist and could work with correct info or different conditions
    // ═══════════════════════════════════════════════════════════════════════════
    
    // CVC/CVV Issues (LIVE - card number is valid, just wrong security code)
    'incorrect_cvc': { message: 'Invalid CVC - CCN Valid', shortCode: 'CVC', category: 'cvc_error', severity: 'success', isLive: true },
    'invalid_cvc': { message: 'Invalid CVC - CCN Valid', shortCode: 'CVC', category: 'cvc_error', severity: 'success', isLive: true },
    'cvc_check_failed': { message: 'CVC Failed - CCN Valid', shortCode: 'CVC', category: 'cvc_error', severity: 'success', isLive: true },
    
    // Address/ZIP Issues (LIVE - card valid, address mismatch)
    'incorrect_zip': { message: 'Invalid ZIP - CCN Valid', shortCode: 'ZIP', category: 'avs_error', severity: 'success', isLive: true },
    'incorrect_address': { message: 'Invalid Address - CCN Valid', shortCode: 'AVS', category: 'avs_error', severity: 'success', isLive: true },
    'postal_code_invalid': { message: 'Invalid Postal - CCN Valid', shortCode: 'ZIP', category: 'avs_error', severity: 'success', isLive: true },
    'address_zip_check_failed': { message: 'AVS Failed - CCN Valid', shortCode: 'AVS', category: 'avs_error', severity: 'success', isLive: true },
    
    // Funds/Limit Issues (LIVE - card valid, just no money or limit reached)
    'insufficient_funds': { message: 'Insufficient Funds', shortCode: 'NSF', category: 'live_card', severity: 'success', isLive: true },
    'card_velocity_exceeded': { message: 'Velocity Exceeded', shortCode: 'VEL', category: 'live_card', severity: 'success', isLive: true },
    'withdrawal_count_limit_exceeded': { message: 'Withdrawal Limit', shortCode: 'WDL', category: 'live_card', severity: 'success', isLive: true },
    'exceeds_withdrawal_amount_limit': { message: 'Withdrawal Limit', shortCode: 'WDL', category: 'live_card', severity: 'success', isLive: true },
    'exceeds_withdrawal_count_limit': { message: 'Withdrawal Count', shortCode: 'WDC', category: 'live_card', severity: 'success', isLive: true },
    'amount_too_large': { message: 'Amount Too Large', shortCode: 'AMT', category: 'live_card', severity: 'success', isLive: true },
    'amount_too_small': { message: 'Amount Too Small', shortCode: 'AMT', category: 'live_card', severity: 'success', isLive: true },
    'approve_with_id': { message: 'Approve With ID', shortCode: 'AID', category: 'live_card', severity: 'success', isLive: true },
    'call_issuer': { message: 'Call Issuer', shortCode: 'ISS', category: 'live_card', severity: 'success', isLive: true },
    
    // 3DS/Authentication (LIVE - card valid, needs extra verification)
    'authentication_required': { message: '3DS Required', shortCode: '3DS', category: 'live_card', severity: 'success', isLive: true },
    'card_not_supported': { message: '3DS Not Supported', shortCode: 'NOS', category: 'live_card', severity: 'success', isLive: true },
    'authentication_failure': { message: '3DS Failed', shortCode: '3DS', category: 'live_card', severity: 'success', isLive: true },
    'offline_pin_required': { message: 'PIN Required', shortCode: 'PIN', category: 'live_card', severity: 'success', isLive: true },
    'online_or_offline_pin_required': { message: 'PIN Required', shortCode: 'PIN', category: 'live_card', severity: 'success', isLive: true },
    'pin_try_exceeded': { message: 'PIN Tries Exceeded', shortCode: 'PIN', category: 'live_card', severity: 'success', isLive: true },
    
    // Temporary Blocks (LIVE - card valid, temporarily blocked)
    'card_declined_rate_limit_exceeded': { message: 'Rate Limited', shortCode: 'RLM', category: 'live_card', severity: 'success', isLive: true },
    'revocation_of_authorization': { message: 'Auth Revoked', shortCode: 'REV', category: 'live_card', severity: 'success', isLive: true },
    'stop_payment_order': { message: 'Stop Payment', shortCode: 'STP', category: 'live_card', severity: 'success', isLive: true },
    
    // Merchant/Transaction Issues (LIVE - card valid, merchant issue)
    'invalid_transaction': { message: 'Invalid Transaction', shortCode: 'TXN', category: 'live_card', severity: 'success', isLive: true },
    'not_permitted_card': { message: 'Not Permitted', shortCode: 'NPM', category: 'live_card', severity: 'success', isLive: true },
    'no_action_taken': { message: 'No Action Taken', shortCode: 'NAT', category: 'live_card', severity: 'success', isLive: true },
    'refer_to_card_issuer': { message: 'Refer to Issuer', shortCode: 'ISS', category: 'live_card', severity: 'success', isLive: true },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DIE card indicators (card is invalid, blocked, or should not be retried)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Bank refusals (DIE)
    'do_not_honor': { message: 'Do Not Honor', shortCode: 'DNH', category: 'card_error', severity: 'error', isLive: false },
    'generic_decline': { message: 'Card Declined', shortCode: 'DCL', category: 'card_error', severity: 'warning', isLive: false },
    'card_declined': { message: 'Card Declined', shortCode: 'DCL', category: 'card_error', severity: 'warning', isLive: false },
    'transaction_not_allowed': { message: 'Not Allowed', shortCode: 'TNA', category: 'processing_error', severity: 'warning', isLive: false },
    'pickup_card': { message: 'Pickup Card', shortCode: 'PKP', category: 'card_error', severity: 'error', isLive: false },
    'restricted_card': { message: 'Restricted Card', shortCode: 'RST', category: 'card_error', severity: 'warning', isLive: false },
    'security_violation': { message: 'Security Issue', shortCode: 'SEC', category: 'security_error', severity: 'error', isLive: false },
    'service_not_allowed': { message: 'Service Not Allowed', shortCode: 'SNA', category: 'card_error', severity: 'error', isLive: false },
    
    // Card issues (DIE)
    'lost_card': { message: 'Lost Card', shortCode: 'LST', category: 'card_error', severity: 'error', isLive: false },
    'stolen_card': { message: 'Stolen Card', shortCode: 'STL', category: 'card_error', severity: 'error', isLive: false },
    'expired_card': { message: 'Expired Card', shortCode: 'EXP', category: 'card_error', severity: 'warning', isLive: false },
    'invalid_number': { message: 'Invalid Number', shortCode: 'NUM', category: 'number_error', severity: 'error', isLive: false },
    'incorrect_number': { message: 'Incorrect Number', shortCode: 'NUM', category: 'number_error', severity: 'error', isLive: false },
    'invalid_account': { message: 'Invalid Account', shortCode: 'ACC', category: 'account_error', severity: 'error', isLive: false },
    'new_account_information_available': { message: 'Card Reissued', shortCode: 'NEW', category: 'card_error', severity: 'error', isLive: false },
    
    // Fraud (DIE)
    'fraudulent': { message: 'Fraudulent', shortCode: 'FRD', category: 'security_error', severity: 'error', isLive: false },
    'highest_risk_level': { message: 'High Risk', shortCode: 'RSK', category: 'security_error', severity: 'error', isLive: false },
    
    // Expiry issues (DIE)
    'invalid_expiry_month': { message: 'Invalid Expiry', shortCode: 'EXP', category: 'expiry_error', severity: 'error', isLive: false },
    'invalid_expiry_year': { message: 'Invalid Expiry', shortCode: 'EXP', category: 'expiry_error', severity: 'error', isLive: false },
    'invalid_expiry': { message: 'Invalid Expiry', shortCode: 'EXP', category: 'expiry_error', severity: 'error', isLive: false },
    
    // Currency issues (DIE)
    'currency_not_supported': { message: 'Currency N/S', shortCode: 'CUR', category: 'account_error', severity: 'warning', isLive: false },
    'invalid_amount': { message: 'Invalid Amount', shortCode: 'AMT', category: 'processing_error', severity: 'error', isLive: false },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ERROR - Temporary/processing issues, may be retryable
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Processing issues
    'processing_error': { message: 'Processing Error', shortCode: 'PRC', category: 'processing_error', severity: 'warning', isLive: false },
    'duplicate_transaction': { message: 'Duplicate', shortCode: 'DUP', category: 'processing_error', severity: 'info', isLive: false },
    'issuer_not_available': { message: 'Issuer N/A', shortCode: 'ISS', category: 'processing_error', severity: 'warning', isLive: false },
    'try_again_later': { message: 'Try Again', shortCode: 'TRY', category: 'processing_error', severity: 'warning', isLive: false },
    'reenter_transaction': { message: 'Reenter', shortCode: 'REN', category: 'processing_error', severity: 'warning', isLive: false },
    
    // Authorization issues
    'not_authorized': { message: 'Not Authorized', shortCode: 'NAU', category: 'security_error', severity: 'warning', isLive: false },
    
    // Test mode
    'testmode_decline': { message: 'Test Decline', shortCode: 'TST', category: 'test_error', severity: 'info', isLive: false },
    'live_mode_test_card': { message: 'Test Card', shortCode: 'TST', category: 'test_error', severity: 'info', isLive: false },
    'test_mode_live_card': { message: 'Live in Test', shortCode: 'TST', category: 'test_error', severity: 'info', isLive: false },
};

// Approved/Success message mappings
const APPROVED_MESSAGES = {
    'CARD_ADDED': { message: 'Card Added', shortCode: 'CCN' },
    'CARD_AUTHENTICATED': { message: 'Authenticated', shortCode: 'AUTH' },
    'CARD_VERIFIED': { message: 'Verified', shortCode: 'VRF' },
    'CHARGE_APPROVED': { message: 'Approved', shortCode: 'APR' },
    'CHARGE_SUCCESS': { message: 'Charged', shortCode: 'CHG' },
    'PAYMENT_SUCCEEDED': { message: 'Succeeded', shortCode: 'SUC' },
    'PAYMENT_COMPLETE': { message: 'Complete', shortCode: 'CMP' },
    'TOKEN_CREATED': { message: 'Token OK', shortCode: 'TOK' },
    'PM_CREATED': { message: 'PM Created', shortCode: 'PM' },
    'REFUNDED': { message: 'Refunded', shortCode: 'REF' },
    'SUCCESS': { message: 'Success', shortCode: 'OK' },
    'APPROVED': { message: 'Approved', shortCode: 'APR' },
};

// Pending/3DS message mappings
const PENDING_MESSAGES = {
    '3DS_REQUIRED': { message: '3DS Required', shortCode: '3DS' },
    '3DS_CHALLENGE': { message: '3DS Challenge', shortCode: '3DS' },
    'REQUIRES_ACTION': { message: 'Action Required', shortCode: 'ACT' },
    'REQUIRES_CONFIRMATION': { message: 'Needs Confirm', shortCode: 'CFM' },
    'PROCESSING': { message: 'Processing', shortCode: 'PRC' },
    'PENDING': { message: 'Pending', shortCode: 'PND' },
};

// Error message mappings
const ERROR_MESSAGES = {
    'TIMEOUT': { message: 'Timeout', shortCode: 'TMO' },
    'CONNECTION_ERROR': { message: 'Connection Error', shortCode: 'CON' },
    'NETWORK_ERROR': { message: 'Network Error', shortCode: 'NET' },
    'INVALID_FORMAT': { message: 'Invalid Format', shortCode: 'FMT' },
    'INVALID_CARD': { message: 'Invalid Card', shortCode: 'CRD' },
    'GATEWAY_ERROR': { message: 'Gateway Error', shortCode: 'GWY' },
    'NO_NONCE': { message: 'No Nonce', shortCode: 'NON' },
    'REG_FAIL': { message: 'Reg Failed', shortCode: 'REG' },
    'TOKEN_ERROR': { message: 'Token Error', shortCode: 'TKN' },
    'API_ERROR': { message: 'API Error', shortCode: 'API' },
    'RATE_LIMIT': { message: 'Rate Limited', shortCode: 'RTE' },
    'ERROR': { message: 'Error', shortCode: 'ERR' },
    'UNKNOWN': { message: 'Unknown', shortCode: 'UNK' },
};

// Text patterns to match in raw responses
const TEXT_PATTERNS = [
    { pattern: /insufficient[_\s]?funds/i, code: 'insufficient_funds' },
    { pattern: /do[_\s]?not[_\s]?honor/i, code: 'do_not_honor' },
    { pattern: /lost[_\s]?card/i, code: 'lost_card' },
    { pattern: /stolen[_\s]?card/i, code: 'stolen_card' },
    { pattern: /expired[_\s]?card/i, code: 'expired_card' },
    { pattern: /pickup[_\s]?card/i, code: 'pickup_card' },
    { pattern: /restricted[_\s]?card/i, code: 'restricted_card' },
    { pattern: /incorrect[_\s]?cvc/i, code: 'incorrect_cvc' },
    { pattern: /invalid[_\s]?cvc/i, code: 'invalid_cvc' },
    { pattern: /invalid[_\s]?number/i, code: 'invalid_number' },
    { pattern: /incorrect[_\s]?number/i, code: 'incorrect_number' },
    { pattern: /invalid[_\s]?expiry/i, code: 'invalid_expiry' },
    { pattern: /invalid[_\s]?account/i, code: 'invalid_account' },
    { pattern: /card[_\s]?not[_\s]?supported/i, code: 'card_not_supported' },
    { pattern: /fraudulent/i, code: 'fraudulent' },
    { pattern: /security[_\s]?violation/i, code: 'security_violation' },
    { pattern: /not[_\s]?authorized/i, code: 'not_authorized' },
    { pattern: /processing[_\s]?error/i, code: 'processing_error' },
    { pattern: /generic[_\s]?decline/i, code: 'generic_decline' },
    { pattern: /card[_\s]?declined/i, code: 'card_declined' },
    { pattern: /your[_\s]?card[_\s]?was[_\s]?declined/i, code: 'card_declined' },
];

/**
 * Gateway Message Formatter
 */
export class GatewayMessageFormatter {
    /**
     * Get decline info from a decline code
     */
    static getDeclineInfo(code) {
        if (!code) {
            return { code: 'unknown', message: 'Unknown', shortCode: 'UNK', category: 'unknown', severity: 'warning', isLive: false };
        }
        
        const normalizedCode = code.toLowerCase().replace(/[\s-]/g, '_');
        const info = STRIPE_DECLINE_CODES[normalizedCode];
        
        if (info) {
            return { code: normalizedCode, ...info, isLive: info.isLive || false };
        }
        
        return {
            code: normalizedCode,
            message: this.humanize(code),
            shortCode: 'DCL',
            category: 'unknown',
            severity: 'warning',
            isLive: false
        };
    }

    /**
     * Parse raw text response and extract decline code
     */
    static parseDeclineFromText(text) {
        if (!text) return this.getDeclineInfo('unknown');
        
        const textStr = String(text);
        
        for (const { pattern, code } of TEXT_PATTERNS) {
            if (pattern.test(textStr)) {
                return this.getDeclineInfo(code);
            }
        }
        
        if (/decline|denied|failed|rejected/i.test(textStr)) {
            return this.getDeclineInfo('generic_decline');
        }
        
        return { code: 'unknown', message: this.truncate(textStr), shortCode: 'UNK', category: 'unknown', severity: 'warning', isLive: false };
    }

    /**
     * Format any gateway response for display
     * @param {object} params - { status, message, declineCode, gateway }
     * @returns {object} - Formatted response with message, shortCode, color, isLive, etc.
     */
    static format({ status, message, declineCode, gateway = 'stripe' }) {
        const normalizedStatus = (status || '').toUpperCase();
        
        const result = {
            status: normalizedStatus,
            gateway,
            originalMessage: message,
            message: '',
            shortCode: '',
            color: 'gray',
            bgColor: 'bg-gray-500/10',
            textColor: 'text-gray-500',
            category: null,
            severity: null,
            isLive: false,
        };

        // APPROVED
        if (normalizedStatus === STATUS_TYPES.APPROVED) {
            const info = APPROVED_MESSAGES[(message || '').toUpperCase()] || { message: 'Approved', shortCode: 'APR' };
            result.message = info.message;
            result.shortCode = info.shortCode;
            result.color = 'green';
            result.bgColor = 'bg-green-500/10';
            result.textColor = 'text-green-500';
            result.severity = 'success';
            result.category = 'success';
            return result;
        }

        // 3DS_REQUIRED
        if (normalizedStatus === STATUS_TYPES.THREE_DS || normalizedStatus === '3DS_REQUIRED') {
            const info = PENDING_MESSAGES['3DS_REQUIRED'];
            result.message = info.message;
            result.shortCode = info.shortCode;
            result.color = 'blue';
            result.bgColor = 'bg-blue-500/10';
            result.textColor = 'text-blue-500';
            result.severity = 'info';
            result.category = '3ds';
            return result;
        }

        // PENDING/PROCESSING
        if (normalizedStatus === STATUS_TYPES.PENDING || normalizedStatus === STATUS_TYPES.PROCESSING) {
            const info = PENDING_MESSAGES[(message || '').toUpperCase()] || { message: 'Pending', shortCode: 'PND' };
            result.message = info.message;
            result.shortCode = info.shortCode;
            result.color = 'blue';
            result.bgColor = 'bg-blue-500/10';
            result.textColor = 'text-blue-500';
            result.severity = 'info';
            result.category = 'pending';
            return result;
        }

        // ERROR
        if (normalizedStatus === STATUS_TYPES.ERROR) {
            // Check if it's a decline with a code
            if (declineCode) {
                const declineInfo = this.getDeclineInfo(declineCode);
                if (declineInfo.isLive) {
                    result.status = STATUS_TYPES.DECLINED;
                    result.message = declineInfo.message;
                    result.shortCode = declineInfo.shortCode;
                    result.color = 'green';
                    result.bgColor = 'bg-green-500/10';
                    result.textColor = 'text-green-500';
                    result.isLive = true;
                    result.category = declineInfo.category;
                    result.severity = 'success';
                    return result;
                }
            }
            
            const info = ERROR_MESSAGES[(message || '').toUpperCase()] || { message: 'Error', shortCode: 'ERR' };
            result.message = info.message;
            result.shortCode = info.shortCode;
            result.color = 'red';
            result.bgColor = 'bg-red-500/10';
            result.textColor = 'text-red-500';
            result.severity = 'error';
            result.category = 'error';
            return result;
        }

        // DECLINED
        if (normalizedStatus === STATUS_TYPES.DECLINED) {
            let declineInfo;
            if (declineCode) {
                declineInfo = this.getDeclineInfo(declineCode);
            } else {
                declineInfo = this.parseDeclineFromText(message);
            }

            result.message = declineInfo.message;
            result.shortCode = declineInfo.shortCode;
            result.category = declineInfo.category;
            result.severity = declineInfo.severity;
            result.isLive = declineInfo.isLive;

            // LIVE cards get green color
            if (declineInfo.isLive) {
                result.color = 'green';
                result.bgColor = 'bg-green-500/10';
                result.textColor = 'text-green-500';
            } else {
                // Non-live declines based on severity
                result.color = declineInfo.severity === 'error' ? 'red' : 'yellow';
                result.bgColor = declineInfo.severity === 'error' ? 'bg-red-500/10' : 'bg-yellow-500/10';
                result.textColor = declineInfo.severity === 'error' ? 'text-red-500' : 'text-yellow-500';
            }
            return result;
        }

        // REFUNDED
        if (normalizedStatus === STATUS_TYPES.REFUNDED) {
            result.message = 'Refunded';
            result.shortCode = 'REF';
            result.color = 'blue';
            result.bgColor = 'bg-blue-500/10';
            result.textColor = 'text-blue-500';
            result.severity = 'info';
            result.category = 'refund';
            return result;
        }

        // CANCELLED
        if (normalizedStatus === STATUS_TYPES.CANCELLED || normalizedStatus === 'CANCELED') {
            result.message = 'Cancelled';
            result.shortCode = 'CAN';
            result.color = 'gray';
            result.bgColor = 'bg-gray-500/10';
            result.textColor = 'text-gray-500';
            result.severity = 'info';
            result.category = 'cancelled';
            return result;
        }

        // Unknown - try to parse
        const parsed = this.parseDeclineFromText(message);
        result.message = parsed.message;
        result.shortCode = parsed.shortCode || 'UNK';
        result.isLive = parsed.isLive;
        
        if (parsed.isLive) {
            result.color = 'green';
            result.bgColor = 'bg-green-500/10';
            result.textColor = 'text-green-500';
        }
        
        return result;
    }

    /**
     * Check if a decline code indicates a "live" card
     */
    static isLiveCard(code) {
        if (!code) return false;
        const normalizedCode = code.toLowerCase().replace(/[\s-]/g, '_');
        const info = STRIPE_DECLINE_CODES[normalizedCode];
        return info?.isLive || false;
    }

    /**
     * Check if an error is retryable
     */
    static isRetryable(code) {
        const nonRetryable = [
            'lost_card', 'stolen_card', 'fraudulent', 'pickup_card',
            'invalid_number', 'incorrect_number', 'invalid_account',
            'invalid_cvc', 'invalid_expiry'
        ];
        return !nonRetryable.includes(code?.toLowerCase());
    }

    /**
     * Get all live card codes
     */
    static getLiveCardCodes() {
        return Object.entries(STRIPE_DECLINE_CODES)
            .filter(([_, info]) => info.isLive)
            .map(([code, info]) => ({ code, ...info }));
    }

    /**
     * Humanize a code string
     */
    static humanize(code) {
        if (!code) return 'Unknown';
        return code
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    /**
     * Truncate long messages
     */
    static truncate(message, maxLength = 30) {
        if (!message) return 'Unknown';
        const str = String(message).trim();
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
    }
}

// Convenience export
export const formatGatewayMessage = (params) => GatewayMessageFormatter.format(params);
export const isLiveCard = (code) => GatewayMessageFormatter.isLiveCard(code);

export default GatewayMessageFormatter;
