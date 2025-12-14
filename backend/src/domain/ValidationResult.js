/**
 * Validation result entity
 */
export class ValidationResult {
    static STATUS = {
        LIVE: 'LIVE',
        DIE: 'DIE',
        ERROR: 'ERROR',
        PENDING: 'PENDING',
        RETRY: 'RETRY'
    };

    constructor({
        status,
        message,
        success = false,
        card = null,
        binData = null,
        fraudData = null,
        riskLevel = 'unknown',
        riskScore = null,
        cvcCheck = 'unknown',
        avsCheck = 'unknown',
        declineCode = null,
        sellerMessage = null,
        paymentIntentId = null,
        chargeId = null,
        method = null,
        duration = null
    }) {
        this.status = status;
        this.message = message;
        this.success = success;
        this.response = message; // Alias for backward compatibility
        this.card = card;
        this.binData = binData;
        this.fraudData = fraudData;
        this.riskLevel = riskLevel;
        this.riskScore = riskScore;
        this.cvcCheck = cvcCheck;
        this.avsCheck = avsCheck;
        this.declineCode = declineCode;
        this.sellerMessage = sellerMessage;
        this.paymentIntentId = paymentIntentId;
        this.chargeId = chargeId;
        this.method = method;
        this.duration = duration;
    }

    isLive() {
        return this.status === ValidationResult.STATUS.LIVE;
    }

    isDead() {
        return this.status === ValidationResult.STATUS.DIE;
    }

    isError() {
        return this.status === ValidationResult.STATUS.ERROR;
    }

    isRetryable() {
        return this.status === ValidationResult.STATUS.RETRY;
    }

    toJSON() {
        return {
            status: this.status,
            message: this.message,
            success: this.success,
            response: this.response,
            card: this.card,
            binData: this.binData,
            fraudData: this.fraudData,
            riskLevel: this.riskLevel,
            riskScore: this.riskScore,
            cvcCheck: this.cvcCheck,
            avsCheck: this.avsCheck,
            declineCode: this.declineCode,
            sellerMessage: this.sellerMessage,
            paymentIntentId: this.paymentIntentId,
            chargeId: this.chargeId,
            method: this.method,
            duration: this.duration
        };
    }

    static live(message, options = {}) {
        return new ValidationResult({ status: ValidationResult.STATUS.LIVE, message, success: true, ...options });
    }

    static die(message, options = {}) {
        return new ValidationResult({ status: ValidationResult.STATUS.DIE, message, success: false, ...options });
    }

    static error(message, options = {}) {
        return new ValidationResult({ status: ValidationResult.STATUS.ERROR, message, success: false, ...options });
    }
}
