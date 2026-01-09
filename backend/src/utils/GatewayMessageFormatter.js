/**
 * Gateway Message Formatter
 * Centralizes message formatting for all payment gateway responses
 * Provides standardized, user-friendly messages across all gateways
 */

// Stripe decline codes with user-friendly messages
// Note: Some decline codes indicate "live" cards (valid but declined for specific reasons)
const STRIPE_DECLINE_CODES = {
    // ═══════════════════════════════════════════════════════════════════════════
    // LIVE card indicators (card is valid but declined for specific reasons)
    // These cards exist and could work with correct info or different conditions
    // ═══════════════════════════════════════════════════════════════════════════
    
    // CVC/CVV Issues (LIVE - card number is valid, just wrong security code)
    'incorrect_cvc': { message: 'Invalid CVC - CCN Valid', category: 'cvc_error', severity: 'success', isLive: true },
    'invalid_cvc': { message: 'Invalid CVC - CCN Valid', category: 'cvc_error', severity: 'success', isLive: true },
    'cvc_check_failed': { message: 'CVC Check Failed - CCN Valid', category: 'cvc_error', severity: 'success', isLive: true },
    
    // Address/ZIP Issues (LIVE - card valid, address mismatch)
    'incorrect_zip': { message: 'Invalid ZIP - CCN Valid', category: 'avs_error', severity: 'success', isLive: true },
    'incorrect_address': { message: 'Invalid Address - CCN Valid', category: 'avs_error', severity: 'success', isLive: true },
    'postal_code_invalid': { message: 'Invalid Postal Code - CCN Valid', category: 'avs_error', severity: 'success', isLive: true },
    'address_zip_check_failed': { message: 'AVS Failed - CCN Valid', category: 'avs_error', severity: 'success', isLive: true },
    
    // Funds/Limit Issues (LIVE - card valid, just no money or limit reached)
    'insufficient_funds': { message: 'Insufficient Funds - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'card_velocity_exceeded': { message: 'Velocity Exceeded - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'withdrawal_count_limit_exceeded': { message: 'Withdrawal Limit - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'exceeds_withdrawal_amount_limit': { message: 'Withdrawal Limit - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'exceeds_withdrawal_count_limit': { message: 'Withdrawal Count - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'amount_too_large': { message: 'Amount Too Large - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'amount_too_small': { message: 'Amount Too Small - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'approve_with_id': { message: 'Approve With ID - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'call_issuer': { message: 'Call Issuer - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    
    // 3DS/Authentication (LIVE - card valid, needs extra verification)
    'authentication_required': { message: '3DS Required - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'card_not_supported': { message: '3DS Not Supported - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'authentication_failure': { message: '3DS Failed - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'offline_pin_required': { message: 'PIN Required - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'online_or_offline_pin_required': { message: 'PIN Required - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'pin_try_exceeded': { message: 'PIN Tries Exceeded - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    
    // Temporary Blocks (LIVE - card valid, temporarily blocked)
    'card_declined_rate_limit_exceeded': { message: 'Rate Limited - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'revocation_of_authorization': { message: 'Auth Revoked - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'stop_payment_order': { message: 'Stop Payment - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    
    // Merchant/Transaction Issues (LIVE - card valid, merchant issue)
    'invalid_transaction': { message: 'Invalid Transaction - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'not_permitted_card': { message: 'Not Permitted - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'no_action_taken': { message: 'No Action Taken - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    'refer_to_card_issuer': { message: 'Refer to Issuer - CCN Valid', category: 'live_card', severity: 'success', isLive: true },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DIE card indicators (card is invalid, blocked, or should not be retried)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Bank refusals (DIE)
    'do_not_honor': { message: 'Do Not Honor', category: 'card_error', severity: 'error', isLive: false },
    'generic_decline': { message: 'Card Declined', category: 'card_error', severity: 'warning', isLive: false },
    'card_declined': { message: 'Card Declined', category: 'card_error', severity: 'warning', isLive: false },
    'transaction_not_allowed': { message: 'Transaction Not Allowed', category: 'processing_error', severity: 'warning', isLive: false },
    'pickup_card': { message: 'Pickup Card', category: 'card_error', severity: 'error', isLive: false },
    'restricted_card': { message: 'Restricted Card', category: 'card_error', severity: 'warning', isLive: false },
    'security_violation': { message: 'Security Violation', category: 'security_error', severity: 'error', isLive: false },
    'service_not_allowed': { message: 'Service Not Allowed', category: 'card_error', severity: 'error', isLive: false },
    
    // Card issues (DIE)
    'lost_card': { message: 'Lost Card', category: 'card_error', severity: 'error', isLive: false },
    'stolen_card': { message: 'Stolen Card', category: 'card_error', severity: 'error', isLive: false },
    'expired_card': { message: 'Expired Card', category: 'card_error', severity: 'warning', isLive: false },
    'invalid_number': { message: 'Invalid Card Number', category: 'number_error', severity: 'error', isLive: false },
    'incorrect_number': { message: 'Incorrect Card Number', category: 'number_error', severity: 'error', isLive: false },
    'invalid_account': { message: 'Invalid Account', category: 'account_error', severity: 'error', isLive: false },
    'new_account_information_available': { message: 'Card Reissued', category: 'card_error', severity: 'error', isLive: false },
    
    // Fraud (DIE)
    'fraudulent': { message: 'Fraudulent', category: 'security_error', severity: 'error', isLive: false },
    'highest_risk_level': { message: 'High Risk', category: 'security_error', severity: 'error', isLive: false },
    
    // Expiry issues (DIE)
    'invalid_expiry_month': { message: 'Invalid Expiry Month', category: 'expiry_error', severity: 'error', isLive: false },
    'invalid_expiry_year': { message: 'Invalid Expiry Year', category: 'expiry_error', severity: 'error', isLive: false },
    'invalid_expiry': { message: 'Invalid Expiry', category: 'expiry_error', severity: 'error', isLive: false },
    
    // Currency issues (DIE)
    'currency_not_supported': { message: 'Currency Not Supported', category: 'account_error', severity: 'warning', isLive: false },
    'invalid_amount': { message: 'Invalid Amount', category: 'processing_error', severity: 'error', isLive: false },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ERROR - Temporary/processing issues, may be retryable
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Rate limiting (gateway-level, not card issue)
    'rate_limited': { message: 'Rate Limited', category: 'rate_limit', severity: 'warning', isLive: false },
    'too_soon': { message: 'Too Soon', category: 'rate_limit', severity: 'warning', isLive: false },
    
    // Processing issues
    'processing_error': { message: 'Processing Error', category: 'processing_error', severity: 'warning', isLive: false },
    'duplicate_transaction': { message: 'Duplicate Transaction', category: 'processing_error', severity: 'info', isLive: false },
    'issuer_not_available': { message: 'Issuer Not Available', category: 'processing_error', severity: 'warning', isLive: false },
    'try_again_later': { message: 'Try Again Later', category: 'processing_error', severity: 'warning', isLive: false },
    'reenter_transaction': { message: 'Reenter Transaction', category: 'processing_error', severity: 'warning', isLive: false },
    
    // Authorization issues
    'not_authorized': { message: 'Not Authorized', category: 'security_error', severity: 'warning', isLive: false },
    
    // Test mode
    'testmode_decline': { message: 'Test Mode Decline', category: 'test_error', severity: 'info', isLive: false },
    'live_mode_test_card': { message: 'Test Card in Live Mode', category: 'test_error', severity: 'info', isLive: false },
    'test_mode_live_card': { message: 'Live Card in Test Mode', category: 'test_error', severity: 'info', isLive: false },
};

// Text patterns to match in raw responses
const TEXT_PATTERNS = [
    // Card declined patterns
    { pattern: /insufficient[_\s]?funds/i, code: 'insufficient_funds' },
    { pattern: /lost[_\s]?card/i, code: 'lost_card' },
    { pattern: /stolen[_\s]?card/i, code: 'stolen_card' },
    { pattern: /expired[_\s]?card/i, code: 'expired_card' },
    { pattern: /pickup[_\s]?card/i, code: 'pickup_card' },
    { pattern: /restricted[_\s]?card/i, code: 'restricted_card' },
    
    // CVC patterns
    { pattern: /incorrect[_\s]?cvc/i, code: 'incorrect_cvc' },
    { pattern: /invalid[_\s]?cvc/i, code: 'invalid_cvc' },
    { pattern: /security[_\s]?code[_\s]?(is[_\s]?)?invalid/i, code: 'incorrect_cvc' },
    { pattern: /invalid[_\s]?security[_\s]?code/i, code: 'incorrect_cvc' },
    { pattern: /card'?s?[_\s]?security[_\s]?code/i, code: 'incorrect_cvc' },
    { pattern: /cvv[_\s]?(is[_\s]?)?invalid/i, code: 'incorrect_cvc' },
    { pattern: /cvc[_\s]?(is[_\s]?)?invalid/i, code: 'incorrect_cvc' },
    
    // Number patterns
    { pattern: /invalid[_\s]?number/i, code: 'invalid_number' },
    { pattern: /incorrect[_\s]?number/i, code: 'incorrect_number' },
    { pattern: /invalid[_\s]?card[_\s]?number/i, code: 'invalid_number' },
    
    // Expiry patterns
    { pattern: /invalid[_\s]?expiry/i, code: 'invalid_expiry' },
    { pattern: /invalid[_\s]?expir/i, code: 'invalid_expiry' },
    
    // Account patterns
    { pattern: /invalid[_\s]?account/i, code: 'invalid_account' },
    { pattern: /card[_\s]?not[_\s]?supported/i, code: 'card_not_supported' },
    { pattern: /currency[_\s]?not[_\s]?supported/i, code: 'currency_not_supported' },
    
    // Security patterns
    { pattern: /fraudulent/i, code: 'fraudulent' },
    { pattern: /security[_\s]?violation/i, code: 'security_violation' },
    { pattern: /not[_\s]?authorized/i, code: 'not_authorized' },
    
    // Processing patterns
    { pattern: /processing[_\s]?error/i, code: 'processing_error' },
    { pattern: /do[_\s]?not[_\s]?honor/i, code: 'do_not_honor' },
    { pattern: /generic[_\s]?decline/i, code: 'generic_decline' },
    { pattern: /transaction[_\s]?not[_\s]?allowed/i, code: 'transaction_not_allowed' },
    { pattern: /duplicate[_\s]?transaction/i, code: 'duplicate_transaction' },
    { pattern: /refer[_\s]?to[_\s]?card[_\s]?issuer/i, code: 'refer_to_card_issuer' },
    
    // General decline patterns
    { pattern: /card[_\s]?declined/i, code: 'card_declined' },
    { pattern: /your[_\s]?card[_\s]?was[_\s]?declined/i, code: 'card_declined' },
    { pattern: /card[_\s]?has[_\s]?been[_\s]?declined/i, code: 'card_declined' },
    
    // Test patterns
    { pattern: /testmode[_\s]?decline/i, code: 'testmode_decline' },
    { pattern: /live[_\s]?mode[_\s]?test[_\s]?card/i, code: 'live_mode_test_card' },
    
    // Rate limiting patterns
    { pattern: /cannot add a new payment method so soon/i, code: 'rate_limited' },
    { pattern: /too[_\s]?many[_\s]?requests/i, code: 'rate_limited' },
    { pattern: /rate[_\s]?limit/i, code: 'rate_limited' },
    { pattern: /try[_\s]?again[_\s]?later/i, code: 'rate_limited' },
];

// Gateway-specific error codes
const GATEWAY_ERROR_CODES = {
    // HTTP errors
    'HTTP_400': { message: 'Bad Request', category: 'gateway_error', severity: 'error' },
    'HTTP_401': { message: 'Unauthorized', category: 'gateway_error', severity: 'error' },
    'HTTP_402': { message: 'Payment Required', category: 'gateway_error', severity: 'warning' },
    'HTTP_403': { message: 'Forbidden', category: 'gateway_error', severity: 'error' },
    'HTTP_404': { message: 'Gateway Not Found', category: 'gateway_error', severity: 'error' },
    'HTTP_429': { message: 'Rate Limited', category: 'gateway_error', severity: 'warning' },
    'HTTP_500': { message: 'Gateway Error', category: 'gateway_error', severity: 'error' },
    'HTTP_502': { message: 'Bad Gateway', category: 'gateway_error', severity: 'error' },
    'HTTP_503': { message: 'Service Unavailable', category: 'gateway_error', severity: 'error' },
    
    // Internal errors
    'INVALID_FORMAT': { message: 'Invalid Card Format', category: 'input_error', severity: 'error' },
    'INVALID_CARD': { message: 'Invalid Card', category: 'input_error', severity: 'error' },
    'TIMEOUT': { message: 'Request Timeout', category: 'network_error', severity: 'warning' },
    'CONNECTION_ERROR': { message: 'Connection Error', category: 'network_error', severity: 'warning' },
    'NO_NONCE': { message: 'Gateway Session Error', category: 'gateway_error', severity: 'error' },
    'REG_FAIL': { message: 'Registration Failed', category: 'gateway_error', severity: 'error' },
    'TOKEN_ERROR': { message: 'Token Creation Failed', category: 'gateway_error', severity: 'error' },
    
    // Exception errors
    'EXCEPTION_FETCH': { message: 'Network Fetch Error', category: 'network_error', severity: 'error' },
    'EXCEPTION_PARSE': { message: 'Response Parse Error', category: 'gateway_error', severity: 'error' },
};

// Status types for all gateways
const STATUS_TYPES = {
    APPROVED: 'APPROVED',
    DECLINED: 'DECLINED',
    ERROR: 'ERROR',
    THREE_DS: '3DS_REQUIRED',
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    REFUNDED: 'REFUNDED',
    CANCELLED: 'CANCELLED',
};

// Approved/Success message mappings
const APPROVED_MESSAGES = {
    // Auth success
    'CARD_ADDED': { message: 'Card Added', display: 'Card successfully added', shortCode: 'CCN' },
    'CARD_AUTHENTICATED': { message: 'Authenticated', display: 'Card authenticated successfully', shortCode: 'AUTH' },
    'CARD_VERIFIED': { message: 'Verified', display: 'Card verified successfully', shortCode: 'VRF' },
    
    // Charge success
    'CHARGE_APPROVED': { message: 'Approved', display: 'Payment approved', shortCode: 'APR' },
    'CHARGE_SUCCESS': { message: 'Charged', display: 'Charge successful', shortCode: 'CHG' },
    'PAYMENT_SUCCEEDED': { message: 'Succeeded', display: 'Payment successful', shortCode: 'SUC' },
    'PAYMENT_COMPLETE': { message: 'Complete', display: 'Payment completed', shortCode: 'CMP' },
    
    // Token success
    'TOKEN_CREATED': { message: 'Token Created', display: 'Token created successfully', shortCode: 'TOK' },
    'PM_CREATED': { message: 'PM Created', display: 'Payment method created', shortCode: 'PM' },
    
    // Refund success
    'REFUNDED': { message: 'Refunded', display: 'Payment refunded', shortCode: 'REF' },
    'REFUND_SUCCESS': { message: 'Refunded', display: 'Refund successful', shortCode: 'REF' },
    
    // Generic
    'SUCCESS': { message: 'Success', display: 'Operation successful', shortCode: 'OK' },
    'APPROVED': { message: 'Approved', display: 'Approved', shortCode: 'APR' },
};

// 3DS/Pending message mappings
const PENDING_MESSAGES = {
    '3DS_REQUIRED': { message: '3DS Required', display: '3D Secure verification required', shortCode: '3DS' },
    '3DS_CHALLENGE': { message: '3DS Challenge', display: '3D Secure challenge required', shortCode: '3DS' },
    'REQUIRES_ACTION': { message: 'Action Required', display: 'Additional action required', shortCode: 'ACT' },
    'REQUIRES_CONFIRMATION': { message: 'Needs Confirm', display: 'Confirmation required', shortCode: 'CFM' },
    'REQUIRES_PAYMENT_METHOD': { message: 'Needs PM', display: 'Payment method required', shortCode: 'PM' },
    'REQUIRES_CAPTURE': { message: 'Needs Capture', display: 'Capture required', shortCode: 'CAP' },
    'PROCESSING': { message: 'Processing', display: 'Payment is processing', shortCode: 'PRC' },
    'PENDING': { message: 'Pending', display: 'Payment pending', shortCode: 'PND' },
    'AWAITING': { message: 'Awaiting', display: 'Awaiting response', shortCode: 'AWA' },
};

// Error message mappings (non-decline errors)
const ERROR_MESSAGES = {
    // API errors
    'API_ERROR': { message: 'API Error', display: 'Gateway API error', shortCode: 'API' },
    'RATE_LIMIT': { message: 'Rate Limited', display: 'Too many requests', shortCode: 'RTE' },
    'AUTHENTICATION_ERROR': { message: 'Auth Error', display: 'Authentication failed', shortCode: 'AUT' },
    'INVALID_REQUEST': { message: 'Invalid Request', display: 'Invalid request', shortCode: 'INV' },
    
    // Network errors
    'TIMEOUT': { message: 'Timeout', display: 'Request timed out', shortCode: 'TMO' },
    'CONNECTION_ERROR': { message: 'Connection Error', display: 'Connection failed', shortCode: 'CON' },
    'NETWORK_ERROR': { message: 'Network Error', display: 'Network error', shortCode: 'NET' },
    
    // Parse errors
    'PARSE_ERROR': { message: 'Parse Error', display: 'Failed to parse response', shortCode: 'PRS' },
    'INVALID_RESPONSE': { message: 'Invalid Response', display: 'Invalid gateway response', shortCode: 'RSP' },
    
    // Input errors
    'INVALID_FORMAT': { message: 'Invalid Format', display: 'Invalid card format', shortCode: 'FMT' },
    'INVALID_CARD': { message: 'Invalid Card', display: 'Invalid card data', shortCode: 'CRD' },
    'MISSING_FIELD': { message: 'Missing Field', display: 'Required field missing', shortCode: 'MIS' },
    
    // Gateway errors
    'GATEWAY_ERROR': { message: 'Gateway Error', display: 'Gateway error', shortCode: 'GWY' },
    'NO_NONCE': { message: 'No Nonce', display: 'Gateway session error', shortCode: 'NON' },
    'REG_FAIL': { message: 'Reg Failed', display: 'Registration failed', shortCode: 'REG' },
    'TOKEN_ERROR': { message: 'Token Error', display: 'Token creation failed', shortCode: 'TKN' },
    'SESSION_EXPIRED': { message: 'Session Expired', display: 'Session expired', shortCode: 'SES' },
    
    // Rate limiting
    'RATE_LIMITED': { message: 'Rate Limited', display: 'Too many requests, try again later', shortCode: 'RATE' },
    'TOO_SOON': { message: 'Too Soon', display: 'Please wait before trying again', shortCode: 'WAIT' },
    
    // Generic
    'ERROR': { message: 'Error', display: 'An error occurred', shortCode: 'ERR' },
    'UNKNOWN': { message: 'Unknown', display: 'Unknown error', shortCode: 'UNK' },
};

/**
 * Gateway Message Formatter class
 */
// Export status types for external use
export { STATUS_TYPES };

/**
 * Gateway Message Formatter class
 */
export class GatewayMessageFormatter {
    /**
     * Get standardized decline info from a decline code
     * @param {string} code - The decline code
     * @returns {object} - Standardized decline info with message, category, severity
     */
    static getDeclineInfo(code) {
        if (!code) {
            return {
                code: 'card_declined',
                message: 'Card Declined',
                category: 'card_error',
                severity: 'warning'
            };
        }

        const normalizedCode = code.toLowerCase().replace(/[\s-]/g, '_');
        const info = STRIPE_DECLINE_CODES[normalizedCode];

        if (info) {
            return {
                code: normalizedCode,
                ...info
            };
        }

        // Check gateway error codes
        const gatewayInfo = GATEWAY_ERROR_CODES[code.toUpperCase()];
        if (gatewayInfo) {
            return {
                code: code.toUpperCase(),
                ...gatewayInfo
            };
        }

        return {
            code: normalizedCode,
            message: this.humanize(code),
            category: 'card_error',
            severity: 'warning'
        };
    }

    /**
     * Parse raw text response and extract decline code
     * @param {string} text - Raw response text
     * @returns {object} - Extracted decline info
     */
    static parseDeclineFromText(text) {
        if (!text) {
            return this.getDeclineInfo('card_declined');
        }

        const textStr = String(text);

        // Check for HTTP error patterns
        const httpMatch = textStr.match(/HTTP[_\s]?(\d{3})/i);
        if (httpMatch) {
            return this.getDeclineInfo(`HTTP_${httpMatch[1]}`);
        }

        // Check for exception patterns
        const exceptionMatch = textStr.match(/EXCEPTION[_\s]?(\w+)/i);
        if (exceptionMatch) {
            return this.getDeclineInfo(`EXCEPTION_${exceptionMatch[1].toUpperCase()}`);
        }

        // Check predefined patterns
        for (const { pattern, code } of TEXT_PATTERNS) {
            if (pattern.test(textStr)) {
                return this.getDeclineInfo(code);
            }
        }

        // Generic decline detection
        if (/decline|denied|failed|rejected/i.test(textStr)) {
            return this.getDeclineInfo('generic_decline');
        }

        // No pattern matched - return the original message with card_declined code
        // This preserves the actual error message from the gateway
        return {
            code: 'card_declined',
            message: this.truncateMessage(textStr, 100),  // Keep more of the message
            category: 'card_error',
            severity: 'warning'
        };
    }

    /**
     * Format approved/success message for display
     * @param {string} code - Success code
     * @returns {object} - Formatted success info
     */
    static formatApprovedMessage(code) {
        const normalizedCode = (code || '').toUpperCase().replace(/[\s-]/g, '_');
        const info = APPROVED_MESSAGES[normalizedCode];
        
        if (info) {
            return {
                code: normalizedCode,
                message: info.message,
                display: info.display,
                shortCode: info.shortCode,
                status: STATUS_TYPES.APPROVED
            };
        }

        return {
            code: normalizedCode || 'SUCCESS',
            message: 'Approved',
            display: 'Operation successful',
            shortCode: 'APR',
            status: STATUS_TYPES.APPROVED
        };
    }

    /**
     * Format pending/3DS message for display
     * @param {string} code - Pending code
     * @returns {object} - Formatted pending info
     */
    static formatPendingMessage(code) {
        const normalizedCode = (code || '').toUpperCase().replace(/[\s-]/g, '_');
        const info = PENDING_MESSAGES[normalizedCode];
        
        if (info) {
            return {
                code: normalizedCode,
                message: info.message,
                display: info.display,
                shortCode: info.shortCode,
                status: STATUS_TYPES.PENDING
            };
        }

        return {
            code: normalizedCode || 'PENDING',
            message: 'Pending',
            display: 'Awaiting response',
            shortCode: 'PND',
            status: STATUS_TYPES.PENDING
        };
    }

    /**
     * Format error message for display (non-decline errors)
     * @param {string} code - Error code
     * @returns {object} - Formatted error info
     */
    static formatErrorMessage(code) {
        const normalizedCode = (code || '').toUpperCase().replace(/[\s-]/g, '_');
        const info = ERROR_MESSAGES[normalizedCode];
        
        if (info) {
            return {
                code: normalizedCode,
                message: info.message,
                display: info.display,
                shortCode: info.shortCode,
                status: STATUS_TYPES.ERROR
            };
        }

        // Check gateway error codes
        const gatewayInfo = GATEWAY_ERROR_CODES[normalizedCode];
        if (gatewayInfo) {
            return {
                code: normalizedCode,
                message: gatewayInfo.message,
                display: gatewayInfo.message,
                shortCode: 'ERR',
                status: STATUS_TYPES.ERROR
            };
        }

        return {
            code: normalizedCode || 'ERROR',
            message: 'Error',
            display: 'An error occurred',
            shortCode: 'ERR',
            status: STATUS_TYPES.ERROR
        };
    }

    /**
     * Format declined message for display
     * @param {string} code - Decline code
     * @returns {object} - Formatted decline info
     */
    static formatDeclinedMessage(code) {
        const info = this.getDeclineInfo(code);
        return {
            code: info.code,
            message: info.message,
            display: info.message,
            shortCode: this.getShortCode(info.code),
            category: info.category,
            severity: info.severity,
            isLive: info.isLive || false,
            status: STATUS_TYPES.DECLINED
        };
    }

    /**
     * Check if a decline code indicates a "live" card
     * Live cards are valid but declined for balance/limit reasons
     * @param {string} code - Decline code
     * @returns {boolean} - Whether the card is live
     */
    static isLiveCard(code) {
        if (!code) return false;
        const normalizedCode = code.toLowerCase().replace(/[\s-]/g, '_');
        const info = STRIPE_DECLINE_CODES[normalizedCode];
        return info?.isLive || false;
    }

    /**
     * Get short code for decline codes (for compact display)
     * @param {string} code - Decline code
     * @returns {string} - Short code
     */
    static getShortCode(code) {
        const shortCodes = {
            'card_declined': 'DCL',
            'generic_decline': 'DCL',
            'do_not_honor': 'DNH',
            'insufficient_funds': 'NSF',
            'lost_card': 'LST',
            'stolen_card': 'STL',
            'expired_card': 'EXP',
            'pickup_card': 'PKP',
            'restricted_card': 'RST',
            'incorrect_cvc': 'CVC',
            'invalid_cvc': 'CVC',
            'invalid_number': 'NUM',
            'incorrect_number': 'NUM',
            'invalid_expiry': 'EXP',
            'invalid_expiry_month': 'EXP',
            'invalid_expiry_year': 'EXP',
            'invalid_account': 'ACC',
            'card_not_supported': 'NOS',
            'currency_not_supported': 'CUR',
            'fraudulent': 'FRD',
            'security_violation': 'SEC',
            'not_authorized': 'NAU',
            'processing_error': 'PRC',
            'transaction_not_allowed': 'TNA',
            'duplicate_transaction': 'DUP',
            'refer_to_card_issuer': 'ISS',
            'testmode_decline': 'TST',
            'live_mode_test_card': 'TST',
        };
        return shortCodes[code] || 'DCL';
    }

    /**
     * Format any gateway response for user display
     * Handles all status types: APPROVED, DECLINED, ERROR, 3DS_REQUIRED, PENDING, etc.
     * @param {object} params - Response parameters
     * @param {string} params.status - Status (APPROVED, DECLINED, ERROR, 3DS_REQUIRED, PENDING, PROCESSING)
     * @param {string} params.message - Raw message
     * @param {string} params.declineCode - Decline code if available
     * @param {string} params.gateway - Gateway identifier (stripe, shopify, woocommerce)
     * @returns {object} - Formatted response for display
     */
    static formatResponse({ status, message, declineCode, gateway = 'stripe' }) {
        const normalizedStatus = (status || '').toUpperCase();
        const result = {
            status: normalizedStatus,
            gateway,
            originalMessage: message,
            formattedMessage: '',
            shortCode: '',
            declineCode: null,
            category: null,
            severity: null,
            displayColor: 'gray',
            isLive: false
        };

        // Handle APPROVED status
        if (normalizedStatus === STATUS_TYPES.APPROVED) {
            const info = this.formatApprovedMessage(message);
            result.formattedMessage = info.message;
            result.shortCode = info.shortCode;
            result.displayColor = 'green';
            result.severity = 'success';
            result.category = 'success';
            return result;
        }

        // Handle 3DS_REQUIRED status
        if (normalizedStatus === STATUS_TYPES.THREE_DS || normalizedStatus === '3DS_REQUIRED') {
            const info = this.formatPendingMessage('3DS_REQUIRED');
            result.formattedMessage = info.message;
            result.shortCode = info.shortCode;
            result.displayColor = 'blue';
            result.severity = 'info';
            result.category = '3ds';
            return result;
        }

        // Handle PENDING/PROCESSING status
        if (normalizedStatus === STATUS_TYPES.PENDING || 
            normalizedStatus === STATUS_TYPES.PROCESSING ||
            normalizedStatus === 'REQUIRES_ACTION' ||
            normalizedStatus === 'REQUIRES_CONFIRMATION') {
            const info = this.formatPendingMessage(message || normalizedStatus);
            result.formattedMessage = info.message;
            result.shortCode = info.shortCode;
            result.displayColor = 'blue';
            result.severity = 'info';
            result.category = 'pending';
            return result;
        }

        // Handle ERROR status (non-decline errors like timeout, network, etc.)
        if (normalizedStatus === STATUS_TYPES.ERROR) {
            // Check if it's actually a decline disguised as error
            if (declineCode) {
                const declineInfo = this.formatDeclinedMessage(declineCode);
                result.status = STATUS_TYPES.DECLINED;
                result.formattedMessage = declineInfo.message;
                result.shortCode = declineInfo.shortCode;
                result.declineCode = declineInfo.code;
                result.category = declineInfo.category;
                result.severity = declineInfo.severity;
                result.isLive = declineInfo.isLive;
                // Live cards get green color
                result.displayColor = declineInfo.isLive ? 'green' : this.getDisplayColor(declineInfo.severity);
                return result;
            }

            // Parse error from message
            const errorInfo = this.formatErrorMessage(message);
            result.formattedMessage = errorInfo.message;
            result.shortCode = errorInfo.shortCode;
            result.displayColor = 'red';
            result.severity = 'error';
            result.category = 'error';
            return result;
        }

        // Handle DECLINED status
        if (normalizedStatus === STATUS_TYPES.DECLINED) {
            let declineInfo;
            if (declineCode) {
                declineInfo = this.formatDeclinedMessage(declineCode);
            } else {
                // Try to parse decline code from message
                const parsed = this.parseDeclineFromText(message);
                declineInfo = this.formatDeclinedMessage(parsed.code);
            }

            result.formattedMessage = declineInfo.message;
            result.shortCode = declineInfo.shortCode;
            result.declineCode = declineInfo.code;
            result.category = declineInfo.category;
            result.severity = declineInfo.severity;
            result.isLive = declineInfo.isLive;
            // Live cards get green color
            result.displayColor = declineInfo.isLive ? 'green' : this.getDisplayColor(declineInfo.severity);
            return result;
        }

        // Handle REFUNDED status
        if (normalizedStatus === STATUS_TYPES.REFUNDED) {
            const info = this.formatApprovedMessage('REFUNDED');
            result.formattedMessage = info.message;
            result.shortCode = info.shortCode;
            result.displayColor = 'blue';
            result.severity = 'info';
            result.category = 'refund';
            return result;
        }

        // Handle CANCELLED status
        if (normalizedStatus === STATUS_TYPES.CANCELLED || normalizedStatus === 'CANCELED') {
            result.formattedMessage = 'Cancelled';
            result.shortCode = 'CAN';
            result.displayColor = 'gray';
            result.severity = 'info';
            result.category = 'cancelled';
            return result;
        }

        // Unknown status - try to parse from message
        const parsed = this.parseDeclineFromText(message);
        result.formattedMessage = parsed.message;
        result.shortCode = this.getShortCode(parsed.code) || 'UNK';
        result.declineCode = parsed.code;
        result.category = parsed.category;
        result.severity = parsed.severity;
        result.displayColor = this.getDisplayColor(parsed.severity);

        return result;
    }

    /**
     * Format error for consistent display across all gateways
     * @param {Error|string} error - The error
     * @param {string} gateway - Gateway identifier
     * @returns {object} - Formatted error
     */
    static formatError(error, gateway = 'stripe') {
        const errorMessage = error?.message || String(error);
        const declineInfo = this.parseDeclineFromText(errorMessage);

        return {
            status: 'ERROR',
            gateway,
            originalMessage: errorMessage,
            formattedMessage: declineInfo.message,
            declineCode: declineInfo.code,
            category: declineInfo.category,
            severity: 'error',
            displayColor: 'red'
        };
    }

    /**
     * Get display color based on severity
     * @param {string} severity - Severity level
     * @returns {string} - Color name for display
     */
    static getDisplayColor(severity) {
        const colors = {
            'success': 'green',
            'info': 'blue',
            'warning': 'yellow',
            'error': 'red'
        };
        return colors[severity] || 'gray';
    }

    /**
     * Humanize a code string for display
     * @param {string} code - Code to humanize
     * @returns {string} - Human readable string
     */
    static humanize(code) {
        if (!code) return 'Unknown';
        return code
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    /**
     * Truncate long messages for display
     * @param {string} message - Message to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated message
     */
    static truncateMessage(message, maxLength = 50) {
        if (!message) return 'Unknown Error';
        const str = String(message).trim();
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
    }

    /**
     * Get all available decline codes with their info
     * @returns {object} - All decline codes
     */
    static getAllDeclineCodes() {
        return { ...STRIPE_DECLINE_CODES };
    }

    /**
     * Get all available error codes with their info
     * @returns {object} - All error codes
     */
    static getAllErrorCodes() {
        return { ...GATEWAY_ERROR_CODES };
    }

    /**
     * Check if a code represents a retryable error
     * @param {string} code - The error code
     * @returns {boolean} - Whether the error is retryable
     */
    static isRetryable(code) {
        const nonRetryable = [
            'lost_card', 'stolen_card', 'fraudulent', 'pickup_card',
            'invalid_number', 'incorrect_number', 'invalid_account',
            'invalid_cvc', 'invalid_expiry', 'invalid_expiry_month', 'invalid_expiry_year'
        ];
        return !nonRetryable.includes(code?.toLowerCase());
    }

    /**
     * Get category description for display
     * @param {string} category - Category code
     * @returns {string} - Category description
     */
    static getCategoryDescription(category) {
        const descriptions = {
            'card_error': 'Card Issue',
            'cvc_error': 'CVC/CVV Issue',
            'number_error': 'Card Number Issue',
            'expiry_error': 'Expiry Date Issue',
            'account_error': 'Account Issue',
            'security_error': 'Security Issue',
            'processing_error': 'Processing Issue',
            'issuer_error': 'Issuer Issue',
            'test_error': 'Test Mode',
            'gateway_error': 'Gateway Issue',
            'network_error': 'Network Issue',
            'input_error': 'Input Error',
            'unknown': 'Unknown Issue'
        };
        return descriptions[category] || 'Unknown Issue';
    }
}

export default GatewayMessageFormatter;
