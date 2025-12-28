/**
 * SK-Based Charge Validation Result Entity
 * 
 * Represents the outcome of a card validation using the Source API → Charge flow.
 * Includes detailed response information from Stripe including risk level, AVS/CVC checks,
 * 3DS status, and BIN data.
 * 
 * Requirements: 9.24-9.32
 */
export class SKBasedResult {
    static STATUS = {
        APPROVED: 'APPROVED',
        LIVE: 'LIVE',
        DECLINED: 'DECLINED',
        ERROR: 'ERROR'
    };

    constructor(data = {}) {
        // Core status fields
        this.status = data.status || SKBasedResult.STATUS.ERROR;
        this.message = data.message || '';
        this.card = data.card || null;
        this.declineCode = data.declineCode || null;

        // Stripe response details (Requirements 9.24-9.27)
        this.riskLevel = data.riskLevel || null;      // normal, elevated, highest
        this.avsCheck = data.avsCheck || null;        // pass, fail, unavailable, unchecked
        this.cvcCheck = data.cvcCheck || null;        // pass, fail, unavailable, unchecked
        this.networkStatus = data.networkStatus || null; // approved_by_network, declined_by_network, not_sent_to_network
        this.vbvStatus = data.vbvStatus || null;      // 3DS status

        // BIN data (Requirement 9.28)
        this.brand = data.brand || null;              // VISA, MASTERCARD, etc.
        this.type = data.type || null;                // CREDIT, DEBIT
        this.category = data.category || null;        // GOLD, PLATINUM, CLASSIC, etc.
        this.funding = data.funding || null;          // credit, debit, prepaid
        this.bank = data.bank || null;                // Bank name
        this.country = data.country || null;          // Country code
        this.countryFlag = data.countryFlag || null;  // Flag emoji (Requirement 9.29)

        // Metadata (Requirements 9.30-9.32)
        this.chargeAmount = data.chargeAmount || null; // Amount charged (e.g., "$1")
        this.duration = data.duration || null;         // Time taken in ms
        this.gateway = data.gateway || 'skbased';      // Gateway identifier
        this.chargeId = data.chargeId || null;         // Stripe charge ID
        // refundId removed - no refund for performance
        this.sourceId = data.sourceId || null;         // Stripe source ID

        // RK-based flow fields
        this.paymentIntentId = data.paymentIntentId || null;  // Stripe PaymentIntent ID
        this.paymentMethodId = data.paymentMethodId || null;  // Stripe PaymentMethod ID
        this.validationMode = data.validationMode || null;    // 'auth' or 'charge'
        this.charged = data.charged || false;                 // Whether funds were captured
    }

    /**
     * Check if the result is APPROVED status
     * @returns {boolean}
     */
    isApproved() {
        return this.status === SKBasedResult.STATUS.APPROVED;
    }

    /**
     * Check if the result is LIVE (includes both APPROVED and LIVE statuses)
     * LIVE means the card is valid but may have been declined for other reasons
     * @returns {boolean}
     */
    isLive() {
        return this.status === SKBasedResult.STATUS.LIVE ||
            this.status === SKBasedResult.STATUS.APPROVED;
    }

    /**
     * Check if the result is DECLINED status
     * @returns {boolean}
     */
    isDeclined() {
        return this.status === SKBasedResult.STATUS.DECLINED;
    }

    /**
     * Check if the result is ERROR status
     * @returns {boolean}
     */
    isError() {
        return this.status === SKBasedResult.STATUS.ERROR;
    }

    /**
     * Serialize the result to JSON for API responses
     * @returns {object}
     */
    toJSON() {
        // Parse card string into object for frontend compatibility
        let cardObj = this.card;
        if (typeof this.card === 'string' && this.card.includes('|')) {
            const parts = this.card.split('|');
            if (parts.length >= 3) {
                cardObj = {
                    number: parts[0]?.trim(),
                    expMonth: parts[1]?.trim(),
                    expYear: parts[2]?.trim(),
                    cvc: parts[3]?.trim() || '',
                    cvv: parts[3]?.trim() || ''
                };
            }
        }

        const json = {
            status: this.status,
            message: this.message,
            card: cardObj,
            declineCode: this.declineCode,
            riskLevel: this.riskLevel,
            avsCheck: this.avsCheck,
            cvcCheck: this.cvcCheck,
            networkStatus: this.networkStatus,
            vbvStatus: this.vbvStatus,
            brand: this.brand,
            type: this.type,
            category: this.category,
            funding: this.funding,
            bank: this.bank,
            country: this.country,
            countryFlag: this.countryFlag,
            chargeAmount: this.chargeAmount,
            duration: this.duration,
            gateway: this.gateway
        };

        // Include BIN data as nested object for frontend compatibility
        if (this.brand || this.type || this.bank || this.country) {
            json.binData = {
                scheme: this.brand?.toLowerCase(),
                type: this.type?.toLowerCase(),
                bank: this.bank,
                country: this.country,
                countryCode: this.country,
                countryEmoji: this.countryFlag
            };
        }

        // Include optional IDs if present
        if (this.chargeId) json.chargeId = this.chargeId;
        // refundId removed - no refund for performance
        if (this.sourceId) json.sourceId = this.sourceId;

        return json;
    }

    /**
     * Create an APPROVED result
     * @param {object} data - Result data
     * @returns {SKBasedResult}
     */
    static approved(data = {}) {
        return new SKBasedResult({
            ...data,
            status: SKBasedResult.STATUS.APPROVED
        });
    }

    /**
     * Create a LIVE result (card is valid but declined for specific reasons)
     * @param {object} data - Result data
     * @returns {SKBasedResult}
     */
    static live(data = {}) {
        return new SKBasedResult({
            ...data,
            status: SKBasedResult.STATUS.LIVE
        });
    }

    /**
     * Create a DECLINED result
     * @param {object} data - Result data
     * @returns {SKBasedResult}
     */
    static declined(data = {}) {
        return new SKBasedResult({
            ...data,
            status: SKBasedResult.STATUS.DECLINED
        });
    }

    /**
     * Create an ERROR result
     * @param {string} message - Error message
     * @param {object} data - Additional result data
     * @returns {SKBasedResult}
     */
    static error(message, data = {}) {
        return new SKBasedResult({
            ...data,
            status: SKBasedResult.STATUS.ERROR,
            message
        });
    }
}

export default SKBasedResult;
