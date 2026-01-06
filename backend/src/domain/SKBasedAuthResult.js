/**
 * SKBasedAuthResult - Domain entity for SK-based auth validation results
 * 
 * Represents the result of a SetupIntent-based $0 authorization check.
 * Uses user-provided SK/PK keys for direct Stripe API validation.
 * 
 * Status meanings:
 * - LIVE: Card authorized successfully ($0 auth passed)
 * - CCN: Card number valid but CVV is wrong
 * - DECLINED: Card declined by bank
 * - ERROR: Processing error occurred
 */
export class SKBasedAuthResult {
    constructor(data = {}) {
        // Core status
        this.status = data.status || 'UNKNOWN';
        this.message = data.message || '';
        this.card = data.card || '';

        // Decline info
        this.declineCode = data.declineCode || null;
        this.declineReason = data.declineReason || null;
        this.errorCode = data.errorCode || null;
        this.errorType = data.errorType || null;

        // Card checks from SetupIntent
        this.cvcCheck = data.cvcCheck || null;
        this.avsLine1Check = data.avsLine1Check || null;
        this.avsPostalCheck = data.avsPostalCheck || null;

        // 3DS info
        this.vbvStatus = data.vbvStatus || null;
        this.bypassed3DS = data.bypassed3DS || false;

        // BIN data
        this.brand = data.brand || null;
        this.type = data.type || null;
        this.category = data.category || null;
        this.funding = data.funding || null;
        this.bank = data.bank || null;
        this.country = data.country || null;
        this.countryFlag = data.countryFlag || null;

        // Stripe IDs
        this.paymentMethodId = data.paymentMethodId || null;
        this.setupIntentId = data.setupIntentId || null;
        this.paymentIntentId = data.paymentIntentId || null;
        this.chargeId = data.chargeId || null;

        // Metadata
        this.gateway = data.gateway || 'skbased-auth';
        this.duration = data.duration || 0;
    }

    /**
     * Check if result is LIVE (authorized)
     */
    isLive() {
        return this.status === 'LIVE';
    }

    /**
     * Check if result is approved (alias for isLive)
     */
    isApproved() {
        return this.status === 'LIVE';
    }

    /**
     * Check if result is CCN (card number valid, CVV wrong)
     */
    isCCN() {
        return this.status === 'CCN';
    }

    /**
     * Check if result is 3DS required
     */
    is3DS() {
        return this.status === '3DS';
    }

    /**
     * Check if result is declined
     */
    isDeclined() {
        return this.status === 'DECLINED';
    }

    /**
     * Check if result is an error
     */
    isError() {
        return this.status === 'ERROR';
    }

    /**
     * Convert to JSON for API response
     */
    toJSON() {
        // Build binData object for frontend compatibility
        const binData = (this.brand || this.type || this.country || this.bank || this.category) ? {
            scheme: this.brand?.toLowerCase(),
            type: this.type?.toLowerCase(),
            category: this.category?.toLowerCase(),
            funding: this.funding,
            bank: this.bank,
            country: this.country,
            countryCode: this.country,
            countryEmoji: this.countryFlag
        } : null;

        return {
            status: this.status,
            message: this.message,
            card: this.card,
            declineCode: this.declineCode,
            declineReason: this.declineReason,
            cvcCheck: this.cvcCheck,
            avsLine1Check: this.avsLine1Check,
            avsPostalCheck: this.avsPostalCheck,
            vbvStatus: this.vbvStatus,
            bypassed3DS: this.bypassed3DS,
            // Include both formats for compatibility
            brand: this.brand,
            type: this.type,
            category: this.category,
            funding: this.funding,
            bank: this.bank,
            country: this.country,
            countryFlag: this.countryFlag,
            // Frontend expects binData as nested object
            binData,
            gateway: this.gateway,
            duration: this.duration
        };
    }

    /**
     * Create a LIVE result
     */
    static live(data = {}) {
        return new SKBasedAuthResult({
            ...data,
            status: 'LIVE'
        });
    }

    /**
     * Create a CCN result (card number valid, CVV wrong)
     */
    static ccn(data = {}) {
        return new SKBasedAuthResult({
            ...data,
            status: 'CCN'
        });
    }

    /**
     * Create a DECLINED result
     */
    static declined(data = {}) {
        return new SKBasedAuthResult({
            ...data,
            status: 'DECLINED'
        });
    }

    /**
     * Create an ERROR result
     */
    static error(message, data = {}) {
        return new SKBasedAuthResult({
            ...data,
            status: 'ERROR',
            message
        });
    }
}

export default SKBasedAuthResult;
