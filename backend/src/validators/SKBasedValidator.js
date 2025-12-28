import { SKBasedResult } from '../domain/SKBasedResult.js';
import { StripeSourceClient } from '../infrastructure/charge/StripeSourceClient.js';
import { StripeChargeClient } from '../infrastructure/charge/StripeChargeClient.js';
import { binLookupClient } from '../infrastructure/external/BinLookupClient.js';
import { classifyDecline } from '../utils/skbasedClassifier.js';

/**
 * SK-Based Validator
 * 
 * Validates cards using the Source API → Charge → Refund flow with user-provided
 * Stripe SK/PK keys. Retries on network errors until successful.
 */
export class SKBasedValidator {
    constructor(options = {}) {
        this.proxyManager = options.proxyManager || null;
        this.sourceClient = options.sourceClient || new StripeSourceClient({ proxyManager: this.proxyManager });
        this.chargeClient = options.chargeClient || new StripeChargeClient({ proxyManager: this.proxyManager });
        this.binLookup = options.binLookup || binLookupClient;
        this.debug = options.debug !== false;
    }

    _log(message, data = null) {
        // Logging disabled
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getName() {
        return 'SKBasedValidator';
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

    /**
     * Check if error message indicates a timeout or network error
     * @private
     */
    _isTimeoutError(errorMessage) {
        if (!errorMessage) return false;
        const message = (errorMessage || '').toLowerCase();
        return message.includes('timeout') ||
            message.includes('etimedout') ||
            message.includes('econnreset') ||
            message.includes('econnrefused') ||
            message.includes('socket hang up') ||
            message.includes('network error') ||
            message.includes('stream has been aborted') ||
            message.includes('request aborted') ||
            message.includes('enotfound') ||
            message.includes('30000ms exceeded') ||
            message.includes('exceeded');
    }

    async validate(cardInfo, options = {}) {
        const startTime = Date.now();
        const {
            skKey,
            pkKey,
            proxy = null,
            chargeAmount = 100,
            currency = 'usd',
            gateway = 'skbased'
        } = options;

        const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;
        const maskedCard = `${cardInfo.number.slice(0, 6)}******${cardInfo.number.slice(-4)}`;

        this._log(`Starting validation for ${maskedCard}`);

        const baseData = {
            card: fullCard,
            gateway,
            chargeAmount: `${(chargeAmount / 100).toFixed(2)}`
        };

        // Retry configuration - keep trying on network errors
        const maxRetries = 10;
        const retryDelay = 2000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Step 1: Create Source (new source each attempt)
                this._log(`Step 1: Creating Source... (attempt ${attempt}/${maxRetries})`);
                const sourceResult = await this.sourceClient.createSource(
                    {
                        number: cardInfo.number,
                        expMonth: cardInfo.expMonth,
                        expYear: cardInfo.expYear,
                        cvc: cardInfo.cvc
                    },
                    pkKey,
                    { proxy }
                );

                if (!sourceResult.success) {
                    if (sourceResult.isNetworkError) {
                        this._log(`Source network error (attempt ${attempt}), retrying...`);
                        await this._sleep(retryDelay);
                        continue;
                    }

                    // Card error - not retryable
                    const duration = Date.now() - startTime;
                    const classification = classifyDecline(sourceResult.declineCode || sourceResult.code, null, null);
                    const binData = await this._fetchBinData(cardInfo.number);

                    return new SKBasedResult({
                        ...baseData,
                        ...binData,
                        status: classification.status,
                        message: sourceResult.error || classification.message,
                        declineCode: sourceResult.declineCode || sourceResult.code,
                        duration
                    });
                }

                const sourceId = sourceResult.sourceId;
                this._log(`Source created: ${sourceId}`);

                // Step 2: Charge the Source
                this._log('Step 2: Charging Source...');
                const chargeResult = await this.chargeClient.charge(sourceId, skKey, {
                    amount: chargeAmount,
                    currency,
                    proxy
                });

                // Network error or source consumed - retry with new source
                if (!chargeResult.success && (chargeResult.isNetworkError || chargeResult.error?.includes('consumed'))) {
                    this._log(`Charge failed (network/consumed) attempt ${attempt}, retrying...`);
                    await this._sleep(retryDelay);
                    continue;
                }

                const binData = await this._fetchBinData(cardInfo.number);

                // Charge succeeded - NO REFUND (for performance)
                if (chargeResult.success && chargeResult.status === 'succeeded') {
                    const duration = Date.now() - startTime;

                    let message = 'Payment Complete';
                    if (chargeResult.cvcCheck === 'pass') message = 'CVV Approved';

                    this._log(`✅ Charge succeeded: ${chargeResult.chargeId}`);

                    return SKBasedResult.approved({
                        ...baseData,
                        ...binData,
                        message,
                        sourceId,
                        chargeId: chargeResult.chargeId,
                        riskLevel: chargeResult.riskLevel,
                        avsCheck: chargeResult.avsCheck,
                        cvcCheck: chargeResult.cvcCheck,
                        networkStatus: chargeResult.networkStatus,
                        duration
                    });
                }

                // 3DS required
                if (chargeResult.code === 'card_error' && chargeResult.declineCode === 'authentication_required') {
                    this._log('Step 3: 3DS required, attempting bypass...');
                    const bypassResult = await this.chargeClient.attempt3DSBypass(sourceId, pkKey, proxy);
                    const duration = Date.now() - startTime;

                    if (bypassResult.success && bypassResult.bypassed) {
                        this._log('✅ 3DS bypass succeeded');
                        return SKBasedResult.approved({
                            ...baseData,
                            ...binData,
                            message: '3DS Bypassed',
                            sourceId,
                            vbvStatus: 'Bypassed',
                            riskLevel: chargeResult.riskLevel,
                            avsCheck: chargeResult.avsCheck,
                            cvcCheck: chargeResult.cvcCheck,
                            networkStatus: chargeResult.networkStatus,
                            duration
                        });
                    }

                    this._log('⚠️ 3DS bypass failed - card is LIVE');
                    return SKBasedResult.live({
                        ...baseData,
                        ...binData,
                        message: '3DS Required',
                        sourceId,
                        vbvStatus: '3DS Required',
                        riskLevel: chargeResult.riskLevel,
                        avsCheck: chargeResult.avsCheck,
                        cvcCheck: chargeResult.cvcCheck,
                        networkStatus: chargeResult.networkStatus,
                        duration
                    });
                }

                // Charge declined
                const duration = Date.now() - startTime;
                const classification = classifyDecline(
                    chargeResult.declineCode,
                    chargeResult.cvcCheck,
                    { network_status: chargeResult.networkStatus }
                );

                this._log(`Charge declined: ${chargeResult.declineCode} → ${classification.status}`);

                return new SKBasedResult({
                    ...baseData,
                    ...binData,
                    status: classification.status,
                    message: classification.message,
                    declineCode: chargeResult.declineCode,
                    sourceId,
                    chargeId: chargeResult.chargeId,
                    riskLevel: chargeResult.riskLevel,
                    avsCheck: chargeResult.avsCheck,
                    cvcCheck: chargeResult.cvcCheck,
                    networkStatus: chargeResult.networkStatus,
                    duration
                });

            } catch (error) {
                this._log(`❌ Exception attempt ${attempt}: ${error.message}`);
                if (attempt < maxRetries) {
                    await this._sleep(retryDelay);
                    continue;
                }
            }
        }

        // All retries exhausted - return as ERROR (network issue), not DECLINED
        const binData = await this._fetchBinData(cardInfo.number);
        return SKBasedResult.error('Network timeout', {
            ...baseData,
            ...binData,
            isNetworkError: true,
            duration: Date.now() - startTime
        });
    }

    async _fetchBinData(cardNumber) {
        try {
            const binData = await this.binLookup.lookup(cardNumber);
            if (binData && !binData.error) {
                return {
                    brand: binData.scheme?.toUpperCase() || null,
                    type: binData.type?.toUpperCase() || null,
                    category: binData.category?.toUpperCase() || null,
                    funding: binData.type || null,
                    bank: binData.bank || null,
                    country: binData.countryCode || null,
                    countryFlag: binData.countryEmoji || null
                };
            }
        } catch (error) {
            this._log(`BIN lookup failed: ${error.message}`);
        }
        return {};
    }
}

export default SKBasedValidator;
