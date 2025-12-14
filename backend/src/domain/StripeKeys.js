/**
 * Stripe API keys entity
 */
export class StripeKeys {
    constructor({ sk, pk = null }) {
        this.sk = sk;
        this.pk = pk;
    }

    get secretKey() {
        return this.sk;
    }

    get publishableKey() {
        return this.pk;
    }

    hasPublishableKey() {
        return !!this.pk && this.pk.startsWith('pk_');
    }

    isLiveMode() {
        return this.sk?.includes('_live_') || this.pk?.includes('_live_');
    }

    isTestMode() {
        return this.sk?.includes('_test_') || this.pk?.includes('_test_');
    }

    getMaskedSk() {
        if (!this.sk) return 'N/A';
        return `${this.sk.slice(0, 12)}...${this.sk.slice(-4)}`;
    }

    getMaskedPk() {
        if (!this.pk) return 'N/A';
        return `${this.pk.slice(0, 12)}...${this.pk.slice(-4)}`;
    }

    validate() {
        const errors = [];
        if (!this.sk || !this.sk.startsWith('sk_')) {
            errors.push('Invalid secret key format');
        }
        if (this.pk && !this.pk.startsWith('pk_')) {
            errors.push('Invalid publishable key format');
        }
        return { valid: errors.length === 0, errors };
    }
}
