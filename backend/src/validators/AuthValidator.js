import { AuthResult } from '../domain/AuthResult.js';
import { WooCommerceClient } from '../infrastructure/auth/WooCommerceClient.js';
import { WooCommerceLoginClient } from '../infrastructure/auth/WooCommerceLoginClient.js';
import { YogatketClient } from '../infrastructure/auth/YogatketClient.js';
import { YogatketLoginClient } from '../infrastructure/auth/YogatketLoginClient.js';
import { StripePaymentMethodClient } from '../infrastructure/auth/StripePaymentMethodClient.js';
import { DEFAULT_AUTH_SITE } from '../utils/constants.js';
import { GatewayMessageFormatter } from '../utils/GatewayMessageFormatter.js';

/**
 * Auth Validator
 * Validates cards via WooCommerce registration + SetupIntent flow
 * or direct SetupIntent confirm flow (Yogateket-style)
 * Creates fresh session per card for rate-limit avoidance
 */
export class AuthValidator {
    constructor(options = {}) {
        this.site = options.site || DEFAULT_AUTH_SITE;
        this.proxyManager = options.proxyManager || null;
        this.initClient();
        this.pmClient = options.pmClient || new StripePaymentMethodClient({ proxyManager: this.proxyManager });
    }

    initClient() {
        if (this.site.type === 'setupintent-login') {
            this.client = new YogatketLoginClient(this.site, { proxyManager: this.proxyManager });
        } else if (this.site.type === 'setupintent') {
            this.client = new YogatketClient(this.site, { proxyManager: this.proxyManager });
        } else if (this.site.type === 'woocommerce-login') {
            this.wooClient = new WooCommerceLoginClient(this.site, { proxyManager: this.proxyManager });
        } else {
            this.wooClient = new WooCommerceClient(this.site, { proxyManager: this.proxyManager });
        }
    }

    getName() {
        return `AuthValidator (${this.site.label})`;
    }

    setConcurrency(concurrency) {
        // No-op - kept for API compatibility
    }

    async validate(cardInfo) {
        const startTime = Date.now();
        const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;

        console.log(`[AuthValidator] validate START - site: ${this.site.label}, type: ${this.site.type}`);

        try {
            // Route to appropriate validation method based on site type
            if (this.site.type === 'setupintent' || this.site.type === 'setupintent-login') {
                console.log('[AuthValidator] Routing to validateSetupIntent');
                return await this.validateSetupIntent(cardInfo, fullCard, startTime);
            } else if (this.site.type === 'woocommerce-login') {
                console.log('[AuthValidator] Routing to validateWooCommerceLogin');
                return await this.validateWooCommerceLogin(cardInfo, fullCard, startTime);
            } else {
                console.log('[AuthValidator] Routing to validateWooCommerce');
                return await this.validateWooCommerce(cardInfo, fullCard, startTime);
            }
        } catch (error) {
            console.log(`[AuthValidator] validate ERROR: ${error.message}`);
            return AuthResult.error(error.message, {
                card: fullCard,
                site: this.site.label,
                duration: Date.now() - startTime
            });
        }
    }

    /**
     * WooCommerce flow: Register -> Create PM -> Submit SetupIntent via AJAX
     */
    async validateWooCommerce(cardInfo, fullCard, startTime) {
        console.log('[AuthValidator] validateWooCommerce - Step 1: Register and get nonces');
        const registration = await this.wooClient.registerAndGetNonces();

        if (!registration.success) {
            console.log(`[AuthValidator] Registration FAILED: ${registration.error}`);
            return AuthResult.error(`REG_FAIL: ${registration.error}`, {
                card: fullCard,
                site: this.site.label,
                duration: Date.now() - startTime
            });
        }
        console.log('[AuthValidator] Registration SUCCESS');

        // Use pkKey from registration result (extracted from page) or site config
        const pkKey = registration.pkKey || this.site.pkKey;
        if (!pkKey) {
            console.log('[AuthValidator] PK_KEY_NOT_FOUND');
            return AuthResult.error('PK_KEY_NOT_FOUND', {
                card: fullCard,
                site: this.site.label,
                duration: Date.now() - startTime
            });
        }
        console.log(`[AuthValidator] Step 2: Creating PaymentMethod with PK: ${pkKey.substring(0, 20)}...`);

        const pmResult = await this.pmClient.createPaymentMethod(
            cardInfo,
            pkKey,
            this.site.baseUrl,
            registration.fingerprint
        );

        if (!pmResult.success) {
            console.log(`[AuthValidator] PaymentMethod creation FAILED: ${pmResult.error}`);
            const parsed = GatewayMessageFormatter.parseDeclineFromText(pmResult.error);
            return AuthResult.declined(parsed.message, {
                card: fullCard,
                site: this.site.label,
                declineCode: parsed.code,
                duration: Date.now() - startTime
            });
        }

        console.log(`[AuthValidator] PaymentMethod created: ${pmResult.pmId}`);
        console.log('[AuthValidator] Step 3: Submitting SetupIntent');

        const authResult = await this.wooClient.submitSetupIntent(pmResult.pmId, registration);

        if (!authResult.success) {
            console.log(`[AuthValidator] SetupIntent DECLINED: ${authResult.message || authResult.error}`);
            const errorMsg = authResult.message || authResult.error || 'Card declined';
            const parsed = GatewayMessageFormatter.parseDeclineFromText(errorMsg);
            return AuthResult.declined(parsed.message, {
                card: fullCard,
                site: this.site.label,
                declineCode: parsed.code,
                duration: Date.now() - startTime
            });
        }

        console.log('[AuthValidator] SetupIntent APPROVED!');
        return AuthResult.approved('APPROVED', {
            card: fullCard,
            site: this.site.label,
            duration: Date.now() - startTime
        });
    }

    /**
     * WooCommerce Login flow: Login -> Create PM -> Submit SetupIntent via AJAX
     */
    async validateWooCommerceLogin(cardInfo, fullCard, startTime) {
        const loginResult = await this.wooClient.loginAndGetNonces();

        if (!loginResult.success) {
            return AuthResult.error(`LOGIN_FAIL: ${loginResult.error}`, {
                card: fullCard,
                site: this.site.label,
                duration: Date.now() - startTime
            });
        }

        // Use pkKey from login result (extracted from page) or site config
        const pkKey = loginResult.pkKey || this.site.pkKey;
        if (!pkKey) {
            return AuthResult.error('PK_KEY_NOT_FOUND', {
                card: fullCard,
                site: this.site.label,
                duration: Date.now() - startTime
            });
        }

        const pmResult = await this.pmClient.createPaymentMethod(
            cardInfo,
            pkKey,
            this.site.baseUrl,
            loginResult.fingerprint
        );

        if (!pmResult.success) {
            const parsed = GatewayMessageFormatter.parseDeclineFromText(pmResult.error);
            return AuthResult.declined(parsed.message, {
                card: fullCard,
                site: this.site.label,
                declineCode: parsed.code,
                duration: Date.now() - startTime
            });
        }

        const authResult = await this.wooClient.submitSetupIntent(pmResult.pmId, loginResult);

        if (!authResult.success) {
            const errorMsg = authResult.message || authResult.error || 'Card declined';
            const parsed = GatewayMessageFormatter.parseDeclineFromText(errorMsg);
            return AuthResult.declined(parsed.message, {
                card: fullCard,
                site: this.site.label,
                declineCode: parsed.code,
                duration: Date.now() - startTime
            });
        }

        return AuthResult.approved('APPROVED', {
            card: fullCard,
            site: this.site.label,
            duration: Date.now() - startTime
        });
    }

    /**
     * SetupIntent flow: GET page -> extract secret -> POST confirm to Stripe
     */
    async validateSetupIntent(cardInfo, fullCard, startTime) {
        const authResult = await this.client.validate(cardInfo);

        // Handle errors (timeout, connection, etc.)
        if (!authResult.success && authResult.error) {
            return AuthResult.error(authResult.error, {
                card: fullCard,
                site: this.site.label,
                duration: Date.now() - startTime
            });
        }

        // Handle declined cards
        if (!authResult.success || !authResult.approved) {
            const errorMsg = authResult.message || 'Card declined';
            const parsed = GatewayMessageFormatter.parseDeclineFromText(errorMsg);
            return AuthResult.declined(parsed.message, {
                card: fullCard,
                site: this.site.label,
                declineCode: authResult.declineCode || parsed.code,
                duration: Date.now() - startTime
            });
        }

        // Approved (including 3DS - treated as APPROVED for auth)
        return AuthResult.approved('APPROVED', {
            card: fullCard,
            site: this.site.label,
            duration: Date.now() - startTime
        });
    }

    parseCard(cardLine) {
        if (!cardLine || typeof cardLine !== 'string') return null;
        const parts = cardLine.split('|');
        if (parts.length !== 4) return null;

        let [number, expMonth, expYear, cvc] = parts.map(p => (p || '').trim());
        number = number.replace(/\s/g, '');

        if (number.length < 13) return null;

        expYear = expYear.length === 4 ? expYear.slice(-2) : expYear;
        expMonth = expMonth.padStart(2, '0');

        return { number, expMonth, expYear, cvc };
    }
}
