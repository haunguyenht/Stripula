import { GatewayMessageFormatter } from '../utils/GatewayMessageFormatter.js';

/**
 * Charge validation result entity
 * Represents the outcome of a card charge attempt via donation sites
 */
export class ChargeResult {
    static STATUS = {
        APPROVED: 'APPROVED',
        DECLINED: 'DECLINED',
        ERROR: 'ERROR',
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
        binData = null,
        brand = null,
        country = null,
        last4 = null,
        donationId = null,
        chargeAmount = null
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
        this.brand = brand;
        this.country = country;
        this.last4 = last4;
        this.donationId = donationId;
        this.chargeAmount = chargeAmount;
        
        // Format message using GatewayMessageFormatter
        const formatted = GatewayMessageFormatter.formatResponse({
            status: this.status,
            message: this.message,
            declineCode: this.declineCode,
            gateway: 'charge'
        });
        this.formattedMessage = formatted.formattedMessage;
        this.shortCode = formatted.shortCode;
        this.isLive = formatted.isLive;
        this.displayColor = formatted.displayColor;
    }

    isApproved() {
        return this.status === ChargeResult.STATUS.APPROVED;
    }

    isDeclined() {
        return this.status === ChargeResult.STATUS.DECLINED;
    }

    is3DS() {
        return this.status === ChargeResult.STATUS.THREE_DS;
    }

    isLiveCard() {
        return this.status === ChargeResult.STATUS.THREE_DS || this.isLive === true;
    }

    isError() {
        return this.status === ChargeResult.STATUS.ERROR;
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
        if (this.binData) json.binData = this.binData;
        if (this.brand) json.brand = this.brand;
        if (this.country) json.country = this.country;
        if (this.last4) json.last4 = this.last4;
        if (this.donationId) json.donationId = this.donationId;
        if (this.chargeAmount) json.chargeAmount = this.chargeAmount;
        return json;
    }

    static approved(message, options = {}) {
        return new ChargeResult({
            status: ChargeResult.STATUS.APPROVED,
            message,
            success: true,
            ...options
        });
    }

    static declined(message, options = {}) {
        return new ChargeResult({
            status: ChargeResult.STATUS.DECLINED,
            message,
            success: false,
            ...options
        });
    }

    static error(message, options = {}) {
        return new ChargeResult({
            status: ChargeResult.STATUS.ERROR,
            message,
            success: false,
            ...options
        });
    }

    static fromStripeTokenError(error, cardInfo = {}) {
        const message = error?.message || error || 'Token creation failed';
        const code = error?.code || error?.decline_code || 'token_error';
        
        return ChargeResult.declined(message, {
            card: cardInfo.fullCard,
            declineCode: code
        });
    }

    /**
     * Parse Stripe error response using GatewayMessageFormatter
     */
    static fromStripeError(text, options = {}) {
        const { card, brand, country } = options;
        
        // Use GatewayMessageFormatter to parse the text
        const parsed = GatewayMessageFormatter.parseDeclineFromText(text);
        
        // Always use the parsed result - it now returns the actual message
        return ChargeResult.declined(parsed.message, {
            card,
            brand,
            country,
            declineCode: parsed.code
        });
    }
}
