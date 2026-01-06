/**
 * Playwright-Based Validator
 * 
 * Uses real browser with Stripe Elements for authentic fraud signals.
 * Drops in as a replacement for SKBasedModernValidator.
 * 
 * Features:
 * - Human-like typing (not paste)
 * - Stripe Elements for authentic fraud signals
 * - 3DS modal detection
 * - Detailed Radar outcomes
 */

import { SKBasedResult } from '../domain/SKBasedResult.js';
import { PlaywrightElementsClient } from '../infrastructure/charge/PlaywrightElementsClient.js';
import { binLookupClient } from '../infrastructure/external/BinLookupClient.js';
import { classifyDecline, isLiveCard } from '../utils/skbasedClassifier.js';

export class PlaywrightValidator {
    constructor(options = {}) {
        this.debug = options.debug ?? false;
        this.headless = options.headless ?? true;
        this.binLookup = options.binLookup || binLookupClient;
        // External payment page URL (optional) - for VPS deployment
        // Example: https://pay.yourdomain.com/payment.html
        this.externalPageUrl = options.externalPageUrl || process.env.PAYMENT_PAGE_URL || null;
    }

    _log(message, data = null) {
        if (this.debug) {
            console.log(`[PlaywrightValidator] ${message}`, data ? JSON.stringify(data) : '');
        }
    }

    getName() {
        return 'playwright-elements';
    }

    /**
     * Parse card line into components
     */
    parseCard(cardLine) {
        if (!cardLine) return null;

        const parts = cardLine.split('|');
        if (parts.length < 4) return null;

        const [number, expMonth, expYear, cvc] = parts.map(p => p.trim());

        // Validate basic fields
        if (!number || !expMonth || !expYear || !cvc) return null;
        if (number.length < 13 || number.length > 19) return null;

        return {
            number,
            expMonth: expMonth.padStart(2, '0'),
            expYear: expYear.length === 2 ? '20' + expYear : expYear,
            cvc
        };
    }

    /**
     * Validate a card using Playwright Stripe Elements
     * 
     * @param {object} cardInfo - Card details { number, expMonth, expYear, cvc }
     * @param {object} options - Validation options { skKey, pkKey, proxy, chargeAmount, currency }
     * @returns {Promise<SKBasedResult>} Validation result
     */
    async validate(cardInfo, options = {}) {
        const { skKey, pkKey, proxy, chargeAmount = 100, currency = 'gbp' } = options;

        this._log('Validating card', {
            card: `${cardInfo.number.slice(0, 6)}****${cardInfo.number.slice(-4)}`,
            currency,
            amount: chargeAmount
        });

        // Parse proxy if provided
        let proxyConfig = null;
        if (proxy) {
            if (typeof proxy === 'string') {
                proxyConfig = PlaywrightElementsClient.parseProxy(proxy);
            } else {
                proxyConfig = {
                    host: proxy.host,
                    port: proxy.port,
                    username: proxy.username,
                    password: proxy.password
                };
            }
        }

        // Create Playwright client
        const client = new PlaywrightElementsClient({
            pkKey,
            skKey,
            currency,
            amount: chargeAmount,
            proxy: proxyConfig,
            headless: this.headless,
            debug: this.debug,
            externalPageUrl: this.externalPageUrl
        });

        try {
            // Charge card
            const result = await client.chargeCard({
                number: cardInfo.number,
                exp_month: cardInfo.expMonth,
                exp_year: cardInfo.expYear,
                cvc: cardInfo.cvc
            });

            this._log('Validation result', result);

            // Close browser
            await client.close();

            // Convert to SKBasedResult format (async for BIN lookup)
            return await this._toSKBasedResult(result, cardInfo);

        } catch (error) {
            this._log('Validation error', { error: error.message });
            await client.close().catch(() => { });

            // Pass full card for error results too
            const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;
            return SKBasedResult.error(error.message, {
                card: fullCard
            });
        }
    }

    /**
     * Convert Playwright result to SKBasedResult
     * Pass full card info (not masked) for frontend display
     * Fetches BIN data from binLookupClient for approved/live cards
     */
    async _toSKBasedResult(result, cardInfo) {
        // Build full card string for frontend (not masked)
        const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;

        // Helper to fetch BIN data for live/approved cards
        const fetchBinData = async () => {
            try {
                const binData = await this.binLookup.lookup(cardInfo.number);
                if (binData && !binData.error) {
                    return binData;
                }
            } catch (err) {
                this._log('BIN lookup failed', { error: err.message });
            }
            return null;
        };

        // Success (Charged)
        if (result.success || result.status === 'Charged') {
            const binData = await fetchBinData();
            return new SKBasedResult({
                status: 'APPROVED',
                code: 'charged',
                message: `Charged ${result.amount / 100} ${result.currency || 'GBP'}`,
                card: fullCard,
                // Use BIN lookup data instead of Stripe response
                brand: binData?.scheme || null,
                type: binData?.type || null,
                category: binData?.category || null,
                country: binData?.countryCode || null,
                countryFlag: binData?.countryEmoji || null,
                bank: binData?.bank || null,
                funding: null, // BIN lookup doesn't provide funding type
                riskLevel: result.risk_level,
                avsCheck: result.avs_check,
                cvcCheck: result.cvc_check,
                threeDs: result.threeDs,
                paymentIntentId: result.pi_id,
                paymentMethodId: result.pm_id,
                timeTaken: result.time_taken,
                chargeAmount: result.amount,
                currency: result.currency
            });
        }

        // 3DS Required (Live card)
        if (result.status === 'Live' || result.threeDs === 'required' || result.status === 'requires_action') {
            const binData = await fetchBinData();
            return new SKBasedResult({
                status: 'LIVE',
                code: '3ds_required',
                message: '3DS authentication required',
                card: fullCard,
                brand: binData?.scheme || null,
                type: binData?.type || null,
                category: binData?.category || null,
                country: binData?.countryCode || null,
                countryFlag: binData?.countryEmoji || null,
                bank: binData?.bank || null,
                funding: null,
                riskLevel: result.risk_level || 'normal',
                avsCheck: result.avs_check,
                cvcCheck: result.cvc_check,
                threeDs: 'required',
                paymentIntentId: result.pi_id,
                paymentMethodId: result.pm_id,
                timeTaken: result.time_taken
            });
        }

        // Check if decline code indicates a live card (e.g., insufficient_funds, incorrect_cvc)
        const declineCode = result.decline_code || result.code;
        if (declineCode && isLiveCard(declineCode)) {
            const binData = await fetchBinData();
            const classification = classifyDecline(declineCode, result.cvc_check);
            return new SKBasedResult({
                status: 'LIVE',
                code: declineCode,
                message: classification.message,
                card: fullCard,
                brand: binData?.scheme || null,
                type: binData?.type || null,
                category: binData?.category || null,
                country: binData?.countryCode || null,
                countryFlag: binData?.countryEmoji || null,
                bank: binData?.bank || null,
                funding: null,
                riskLevel: result.risk_level,
                avsCheck: result.avs_check,
                cvcCheck: result.cvc_check,
                threeDs: result.threeDs,
                declineCode: declineCode,
                networkStatus: result.network_status,
                timeTaken: result.time_taken
            });
        }

        // Declined - no BIN lookup needed for dead cards
        const declineClassification = classifyDecline(declineCode, result.cvc_check);
        return new SKBasedResult({
            status: declineClassification.status === 'ERROR' ? 'ERROR' : 'DECLINED',
            code: declineCode || 'declined',
            message: declineClassification.message || result.error || 'Card declined',
            card: fullCard,
            brand: null,
            type: null,
            country: null,
            funding: null,
            riskLevel: result.risk_level,
            avsCheck: result.avs_check,
            cvcCheck: result.cvc_check,
            threeDs: result.threeDs,
            declineCode: declineCode,
            networkStatus: result.network_status,
            timeTaken: result.time_taken
        });
    }
}

export default PlaywrightValidator;
