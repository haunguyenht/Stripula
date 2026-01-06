import { ShopifyResult } from '../domain/ShopifyResult.js';
import { AutoShopifyClient } from '../infrastructure/auth/AutoShopifyClient.js';

/**
 * Shopify Validator
 * Validates cards via Auto Shopify API (charge type)
 * API: https://autoshopi.up.railway.app/?cc=cc&url=site&proxy=proxy
 */
export class ShopifyValidator {
    constructor(options = {}) {
        this.proxyManager = options.proxyManager || null;
        this.shopifyUrl = options.shopifyUrl || '';
        this.proxyString = options.proxyString || '';
        this._initClient();
    }

    _initClient() {
        this.client = new AutoShopifyClient(
            { prodUrl: this.shopifyUrl, baseUrl: this.shopifyUrl },
            { proxyManager: this.proxyManager, proxyString: this.proxyString }
        );
    }

    getName() {
        return `ShopifyValidator (Auto API)`;
    }

    setShopifyUrl(url) {
        this.shopifyUrl = url;
        this._initClient();
    }

    setProxy(proxyString) {
        this.proxyString = proxyString;
        this._initClient();
    }

    setConcurrency(concurrency) {
        // No-op - kept for API compatibility
    }

    async validate(cardInfo) {
        const startTime = Date.now();
        const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;

        if (!this.shopifyUrl) {
            return ShopifyResult.error('Shopify URL is required', {
                card: fullCard,
                duration: Date.now() - startTime
            });
        }

        try {
            const result = await this.client.validateCard(cardInfo);

            if (!result.success) {
                return ShopifyResult.error(result.error, {
                    card: fullCard,
                    site: this.shopifyUrl,
                    duration: result.duration || (Date.now() - startTime)
                });
            }

            return ShopifyResult.fromAutoApiResponse(result, {
                card: fullCard,
                site: result.site || this.shopifyUrl,
                gateway: result.gateway,
                price: result.price,
                duration: result.duration || (Date.now() - startTime)
            });

        } catch (error) {
            return ShopifyResult.error(error.message, {
                card: fullCard,
                site: this.shopifyUrl,
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
