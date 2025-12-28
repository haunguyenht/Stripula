import { ShopifyResult } from '../domain/ShopifyResult.js';
import { ShopifyClient } from '../infrastructure/auth/ShopifyClient.js';
import { DEFAULT_SHOPIFY_SITE } from '../utils/constants.js';

/**
 * Shopify Validator
 * Validates cards via Shopify checkout flow
 * Creates fresh session per card for rate-limit avoidance
 */
export class ShopifyValidator {
    constructor(options = {}) {
        this.site = options.site || DEFAULT_SHOPIFY_SITE;
        this.proxyManager = options.proxyManager || null;
        this.client = new ShopifyClient(this.site, { proxyManager: this.proxyManager });
    }

    getName() {
        return `ShopifyValidator (${this.site.label})`;
    }

    setSite(site) {
        this.site = site;
        this.client = new ShopifyClient(site, { proxyManager: this.proxyManager });
    }

    setConcurrency(concurrency) {
        // No-op - kept for API compatibility
    }

    async validate(cardInfo) {
        const startTime = Date.now();
        const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;

        try {
            const result = await this.client.validateCard(cardInfo);

            if (!result.success) {
                return ShopifyResult.error(result.error, {
                    card: fullCard,
                    site: this.site.label,
                    domain: this.site.domain,
                    duration: result.duration || (Date.now() - startTime)
                });
            }

            // Parse the checkout response
            const shopifyResult = ShopifyResult.fromCheckoutResponse(
                result.body,
                result.errorMessage,
                {
                    card: fullCard,
                    site: this.site.label,
                    domain: this.site.domain,
                    gateway: result.gateway,
                    price: result.price,
                    duration: result.duration || (Date.now() - startTime)
                }
            );

            return shopifyResult;

        } catch (error) {
            return ShopifyResult.error(error.message, {
                card: fullCard,
                site: this.site.label,
                domain: this.site.domain,
                duration: Date.now() - startTime
            });
        }
    }

    parseCard(cardLine) {
        if (!cardLine || typeof cardLine !== 'string') return null;
        const parts = cardLine.split('|');
        if (parts.length !== 4) return null;

        let [number, expMonth, expYear, cvc] = parts.map(p => (p || '').trim());
        number = String(number || '').replace(/\s/g, '');

        if (number.length < 13) return null;

        expYear = expYear.length === 4 ? expYear.slice(-2) : expYear;
        expMonth = expMonth.padStart(2, '0');

        return { number, expMonth, expYear, cvc };
    }
}
