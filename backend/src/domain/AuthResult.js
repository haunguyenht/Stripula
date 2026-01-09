import { GatewayMessageFormatter } from '../utils/GatewayMessageFormatter.js';

/**
 * Auth validation result entity
 * Represents the outcome of a card authentication attempt
 */
export class AuthResult {
    static STATUS = {
        APPROVED: 'APPROVED',
        DECLINED: 'DECLINED',
        ERROR: 'ERROR',
        PENDING: 'PENDING',
        THREE_DS: '3DS_REQUIRED'
    };

    constructor({
        status,
        message,
        success = false,
        card = null,
        site = null,
        declineCode = null,
        rawResponse = null,
        duration = null,
        binData = null
    }) {
        this.status = status;
        this.message = message;
        this.success = success;
        this.card = card;
        this.site = site;
        this.declineCode = declineCode;
        this.rawResponse = rawResponse;
        this.duration = duration;
        this.binData = binData;
        
        // Format message using GatewayMessageFormatter
        const formatted = GatewayMessageFormatter.formatResponse({
            status: this.status,
            message: this.message,
            declineCode: this.declineCode,
            gateway: 'auth'
        });
        this.formattedMessage = formatted.formattedMessage;
        this.shortCode = formatted.shortCode;
        this.isLive = formatted.isLive;
        this.displayColor = formatted.displayColor;
    }

    isApproved() {
        return this.status === AuthResult.STATUS.APPROVED;
    }

    isDeclined() {
        return this.status === AuthResult.STATUS.DECLINED;
    }

    isError() {
        return this.status === AuthResult.STATUS.ERROR;
    }

    toJSON() {
        const json = {
            status: this.status,
            message: this.formattedMessage || this.message,
            success: this.success,
            card: this.card,
            site: this.site,
            declineCode: this.declineCode,
            shortCode: this.shortCode,
            isLive: this.isLive,
            displayColor: this.displayColor,
            duration: this.duration
        };
        if (this.binData) {
            json.binData = this.binData;
        }
        return json;
    }

    static approved(message, options = {}) {
        return new AuthResult({ 
            status: AuthResult.STATUS.APPROVED, 
            message, 
            success: true, 
            ...options 
        });
    }

    static declined(message, options = {}) {
        return new AuthResult({ 
            status: AuthResult.STATUS.DECLINED, 
            message, 
            success: false, 
            ...options 
        });
    }

    static error(message, options = {}) {
        return new AuthResult({ 
            status: AuthResult.STATUS.ERROR, 
            message, 
            success: false, 
            ...options 
        });
    }

    /**
     * Parse raw WooCommerce response into AuthResult
     */
    static fromWooCommerceResponse(rawResult, cardInfo = {}) {
        if (typeof rawResult === 'string') {
            if (rawResult.startsWith('HTTP_') || rawResult.startsWith('EXCEPTION_') ||
                ['INVALID_FORMAT', 'INVALID_CARD', 'REG_FAIL', 'NO_NONCE', 'TIMEOUT', 'CONNECTION_ERROR'].includes(rawResult)) {
                return AuthResult.error(rawResult, { card: cardInfo.fullCard });
            }

            if (rawResult.startsWith('PM_FAIL:')) {
                // Parse the PM_FAIL message using GatewayMessageFormatter
                const failMessage = rawResult.slice(8);
                const parsed = GatewayMessageFormatter.parseDeclineFromText(failMessage);
                return AuthResult.declined(parsed.message, { 
                    card: cardInfo.fullCard,
                    declineCode: parsed.code || 'pm_creation_failed'
                });
            }
        }

        try {
            const data = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
            const success = data.success || false;
            const dataObj = data.data || {};
            const status = dataObj.status || '';
            const message = dataObj.message || '';
            const error = dataObj.error || {};

            if (success && status === 'succeeded') {
                return AuthResult.approved('CARD_ADDED', { card: cardInfo.fullCard });
            } else if (error && Object.keys(error).length > 0) {
                // Use GatewayMessageFormatter to format the error message
                const parsed = GatewayMessageFormatter.getDeclineInfo(error.code);
                return AuthResult.declined(parsed.message, { 
                    card: cardInfo.fullCard,
                    declineCode: error.code 
                });
            } else if (message) {
                // Parse message using GatewayMessageFormatter
                const parsed = GatewayMessageFormatter.parseDeclineFromText(message);
                return AuthResult.declined(parsed.message, { 
                    card: cardInfo.fullCard,
                    declineCode: parsed.code
                });
            } else {
                return AuthResult.declined('Card Declined', { card: cardInfo.fullCard, declineCode: 'generic_decline' });
            }
        } catch (e) {
            const rawStr = (rawResult || '').toString();
            
            if (rawStr.toLowerCase().includes('succeeded')) {
                return AuthResult.approved('CARD_ADDED', { card: cardInfo.fullCard });
            }

            // Use GatewayMessageFormatter to parse the raw response
            const parsed = GatewayMessageFormatter.parseDeclineFromText(rawStr);
            
            if (parsed.code !== 'card_declined' || parsed.message !== 'Card Declined') {
                return AuthResult.declined(parsed.message, { 
                    card: cardInfo.fullCard,
                    declineCode: parsed.code 
                });
            }

            return AuthResult.error(`Invalid response: ${rawStr.slice(0, 100)}`, { 
                card: cardInfo.fullCard 
            });
        }
    }

    /**
     * Parse raw Stripe SetupIntent confirm response into AuthResult
     * Used for sites that use direct SetupIntent confirm (e.g., Yogateket)
     */
    static fromSetupIntentResponse(rawResult, cardInfo = {}) {
        try {
            const data = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;

            // Check for Stripe error
            if (data.error) {
                const error = data.error;
                const code = error.decline_code || error.code || 'card_declined';
                // Use GatewayMessageFormatter for consistent message
                const parsed = GatewayMessageFormatter.getDeclineInfo(code);
                
                return AuthResult.declined(parsed.message, {
                    card: cardInfo.fullCard,
                    declineCode: code
                });
            }

            // Check for successful setup intent
            if (data.status === 'succeeded') {
                return AuthResult.approved('CARD_AUTHENTICATED', { card: cardInfo.fullCard });
            }

            // Check for requires_action (3DS, etc.)
            if (data.status === 'requires_action' || data.status === 'requires_confirmation') {
                return AuthResult.approved('3DS_REQUIRED', { card: cardInfo.fullCard });
            }

            // Check for processing
            if (data.status === 'processing') {
                return AuthResult.approved('PROCESSING', { card: cardInfo.fullCard });
            }

            // Unknown status - treat as declined
            const parsed = GatewayMessageFormatter.parseDeclineFromText(data.status);
            return AuthResult.declined(parsed.message, {
                card: cardInfo.fullCard,
                declineCode: parsed.code
            });

        } catch (e) {
            // Try to parse as string response
            const str = (rawResult || '').toString();
            const strLower = str.toLowerCase();
            
            if (strLower.includes('succeeded')) {
                return AuthResult.approved('CARD_AUTHENTICATED', { card: cardInfo.fullCard });
            }
            
            if (strLower.includes('requires_action') || strLower.includes('requires_confirmation')) {
                return AuthResult.approved('3DS_REQUIRED', { card: cardInfo.fullCard });
            }

            // Use GatewayMessageFormatter to parse decline patterns
            const parsed = GatewayMessageFormatter.parseDeclineFromText(str);
            
            if (parsed.code !== 'card_declined' || parsed.message !== 'Card Declined') {
                return AuthResult.declined(parsed.message, {
                    card: cardInfo.fullCard,
                    declineCode: parsed.code
                });
            }

            return AuthResult.error(`Parse error: ${e.message}`, {
                card: cardInfo.fullCard
            });
        }
    }
}
