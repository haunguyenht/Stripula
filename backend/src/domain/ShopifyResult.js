import { GatewayMessageFormatter } from '../utils/GatewayMessageFormatter.js';

/**
 * Shopify validation result entity
 * Represents the outcome of a Shopify checkout validation attempt
 */
export class ShopifyResult {
    static STATUS = {
        APPROVED: 'APPROVED',
        DECLINED: 'DECLINED',
        ERROR: 'ERROR',
        CAPTCHA: 'CAPTCHA',
        SITE_DEAD: 'SITE_DEAD'
    };

    constructor({
        status,
        message,
        success = false,
        card = null,
        site = null,
        domain = null,
        gateway = null,
        price = null,
        supportedBrands = [],
        declineCode = null,
        rawResponse = null,
        duration = null,
        binData = null,
        shouldStopBatch = false
    }) {
        this.status = status;
        this.message = message;
        this.success = success;
        this.card = card;
        this.site = site;
        this.domain = domain;
        this.gateway = gateway;
        this.price = price;
        this.supportedBrands = supportedBrands;
        this.declineCode = declineCode;
        this.rawResponse = rawResponse;
        this.duration = duration;
        this.binData = binData;
        this.shouldStopBatch = shouldStopBatch;
        
        // Format message using GatewayMessageFormatter
        const formatted = GatewayMessageFormatter.formatResponse({
            status: this.status,
            message: this.message,
            declineCode: this.declineCode,
            gateway: 'shopify'
        });
        this.formattedMessage = formatted.formattedMessage;
        this.shortCode = formatted.shortCode;
        this.isLive = formatted.isLive;
        this.displayColor = formatted.displayColor;
    }

    isApproved() {
        return this.status === ShopifyResult.STATUS.APPROVED;
    }

    isDeclined() {
        return this.status === ShopifyResult.STATUS.DECLINED;
    }

    isError() {
        return this.status === ShopifyResult.STATUS.ERROR;
    }

    isCaptcha() {
        return this.status === ShopifyResult.STATUS.CAPTCHA;
    }

    isSiteDead() {
        return this.status === ShopifyResult.STATUS.SITE_DEAD;
    }

    toJSON() {
        const json = {
            status: this.status,
            message: this.formattedMessage || this.message,
            success: this.success,
            card: this.card,
            site: this.site,
            domain: this.domain,
            declineCode: this.declineCode,
            shortCode: this.shortCode,
            isLive: this.isLive,
            displayColor: this.displayColor,
            duration: this.duration
        };
        if (this.gateway) json.gateway = this.gateway;
        if (this.price) json.price = this.price;
        if (this.supportedBrands?.length > 0) json.supportedBrands = this.supportedBrands;
        if (this.binData) json.binData = this.binData;
        if (this.shouldStopBatch) json.shouldStopBatch = this.shouldStopBatch;
        return json;
    }

    static approved(message, options = {}) {
        return new ShopifyResult({
            status: ShopifyResult.STATUS.APPROVED,
            message,
            success: true,
            ...options
        });
    }

    static declined(message, options = {}) {
        return new ShopifyResult({
            status: ShopifyResult.STATUS.DECLINED,
            message,
            success: false,
            ...options
        });
    }

    static error(message, options = {}) {
        return new ShopifyResult({
            status: ShopifyResult.STATUS.ERROR,
            message,
            success: false,
            ...options
        });
    }

    static captcha(message, options = {}) {
        return new ShopifyResult({
            status: ShopifyResult.STATUS.CAPTCHA,
            message: message || 'CAPTCHA required - IP blocked',
            success: false,
            ...options
        });
    }

    static siteDead(message, options = {}) {
        return new ShopifyResult({
            status: ShopifyResult.STATUS.SITE_DEAD,
            message: message || 'Site is dead - please change site',
            success: false,
            ...options
        });
    }

    /**
     * Parse Auto Shopify API response into ShopifyResult
     * API Response format:
     * - Charge: { "Response": "Order completed 💎", "CC": "...", "Price": "1.59", "Gate": "Shopify Payments", "Site": "..." }
     * - Declined: { "Response": "CARD_DECLINED", "CC": "...", "Price": "1.59", "Gate": "Shopify Payments", "Site": "..." }
     * - Captcha: { "Response": "CAPTCHA_REQUIRED", ... }
     * - Site Dead: { "Response": "SITE DEAD 05", ... }
     */
    static fromAutoApiResponse(apiResult, options = {}) {
        const responseText = apiResult.responseText || '';
        const isApproved = apiResult.isApproved || false;

        // Check for CAPTCHA
        if (apiResult.isCaptcha) {
            return ShopifyResult.captcha(responseText, {
                ...options,
                gateway: apiResult.gateway,
                price: apiResult.price,
                shouldStopBatch: apiResult.shouldStopBatch || false
            });
        }

        // Check for Site Dead
        if (apiResult.isSiteDead) {
            return ShopifyResult.siteDead(responseText, {
                ...options,
                gateway: apiResult.gateway,
                price: apiResult.price,
                shouldStopBatch: true
            });
        }

        if (isApproved) {
            return ShopifyResult.approved(responseText || 'Order completed', {
                ...options,
                gateway: apiResult.gateway,
                price: apiResult.price,
                supportedBrands: ['visa', 'mastercard', 'amex', 'discover']
            });
        }

        // Parse decline code from response text
        const parsed = GatewayMessageFormatter.parseDeclineFromText(responseText);
        
        if (parsed.code !== 'unknown') {
            return ShopifyResult.declined(parsed.message, {
                ...options,
                declineCode: parsed.code,
                gateway: apiResult.gateway,
                price: apiResult.price
            });
        }

        // Generic decline
        return ShopifyResult.declined(responseText || 'Card declined', {
            ...options,
            declineCode: 'generic_decline',
            gateway: apiResult.gateway,
            price: apiResult.price
        });
    }

    /**
     * Parse Shopify checkout response into ShopifyResult
     */
    static fromCheckoutResponse(responseBody, errorMessage = null, options = {}) {
        const body = responseBody || '';

        // Check if site accepts credit cards
        if (!body.includes('name="credit_card') && !body.includes('key="pay_now')) {
            return ShopifyResult.error('Site does not accept credit cards', options);
        }

        // Extract supported brands
        const brands = [];
        try {
            const brandMatches = body.matchAll(/<span class="visually-hidden">\s*(.*?),/g);
            for (const match of brandMatches) {
                if (match && match[1]) {
                    const brand = String(match[1]).replace(/<[^>]+>/g, '').trim();
                    if (brand && !brands.includes(brand)) {
                        brands.push(brand);
                    }
                }
            }
        } catch (e) {
            // Ignore regex errors
        }

        if (brands.length === 0) {
            return ShopifyResult.error('No supported card brands found', options);
        }

        // Check for decline patterns in error message using GatewayMessageFormatter
        if (errorMessage) {
            const parsed = GatewayMessageFormatter.parseDeclineFromText(errorMessage);
            
            if (parsed.code !== 'unknown') {
                return ShopifyResult.declined(parsed.message, {
                    ...options,
                    declineCode: parsed.code,
                    supportedBrands: brands
                });
            }

            // Generic decline
            if (/decline|denied|rejected/i.test(errorMessage)) {
                const genericParsed = GatewayMessageFormatter.getDeclineInfo('generic_decline');
                return ShopifyResult.declined(genericParsed.message, {
                    ...options,
                    declineCode: 'generic_decline',
                    supportedBrands: brands
                });
            }
        }

        // Success - card accepted
        return ShopifyResult.approved('Card accepted', {
            ...options,
            supportedBrands: brands
        });
    }
}
