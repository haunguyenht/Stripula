import { EventEmitter } from 'events';
import { Card } from '../domain/Card.js';
import { StripeKeys } from '../domain/StripeKeys.js';
import { Proxy } from '../domain/Proxy.js';
import { ValidationResult } from '../domain/ValidationResult.js';
import { VALIDATION_METHODS, DEFAULTS } from '../utils/constants.js';

/**
 * Validation Facade
 * Unified entry point for all validation operations
 * Coordinates validators, manages batch processing
 */
export class ValidationFacade extends EventEmitter {
    constructor(options = {}) {
        super();
        this.validatorFactory = options.validatorFactory;
        this.proxyManager = options.proxyManager;
        this.abortFlag = false;
    }

    /**
     * Validate a single card
     * @param {Object} params - Validation parameters
     * @returns {Promise<ValidationResult>}
     */
    async validateCard(params) {
        const { card, skKey, pkKey, proxy = null, method = VALIDATION_METHODS.CHARGE } = params;

        // Create domain entities
        const cardEntity = card instanceof Card ? card : new Card(card);
        const keys = new StripeKeys({ sk: skKey, pk: pkKey });
        const proxyEntity = proxy ? (proxy instanceof Proxy ? proxy : Proxy.fromString(proxy) || proxy) : null;

        // Validate inputs
        if (!cardEntity.isValid()) {
            return ValidationResult.error('Invalid card data');
        }

        const keyValidation = keys.validate();
        if (!keyValidation.valid) {
            return ValidationResult.error(keyValidation.errors.join(', '));
        }

        // Get appropriate validator
        const validator = this.validatorFactory.getValidator(method);
        
        // Execute validation
        console.log(`[ValidationFacade] Validating ****${cardEntity.last4} via ${validator.getName()}`);
        return await validator.validate(cardEntity, keys, proxyEntity);
    }

    /**
     * Validate multiple cards concurrently with progress events
     * @param {Object} params - Batch validation parameters
     * @returns {Promise<Object>}
     */
    async validateBatch(params) {
        const {
            cards,
            cardList,
            skKey,
            pkKey,
            proxy = null,
            method = VALIDATION_METHODS.CHARGE,
            concurrency = DEFAULTS.CONCURRENCY,
            onProgress = null,
            onResult = null
        } = params;

        // Parse cards
        let cardArray = cards;
        if (!cardArray && cardList) {
            cardArray = Card.parseList(cardList);
        }

        if (!cardArray || cardArray.length === 0) {
            throw new Error('No valid cards provided');
        }

        // Create keys entity
        const keys = new StripeKeys({ sk: skKey, pk: pkKey });
        const keyValidation = keys.validate();
        if (!keyValidation.valid) {
            throw new Error(keyValidation.errors.join(', '));
        }

        // Parse proxy
        const proxyEntity = proxy ? (proxy instanceof Proxy ? proxy : Proxy.fromString(proxy) || proxy) : null;

        // Get validator
        const validator = this.validatorFactory.getValidator(method);

        // Initialize state
        const results = [];
        const queue = [...cardArray];
        let processed = 0;
        let activeWorkers = 0;
        const total = cardArray.length;
        const summary = { total, live: 0, die: 0, error: 0, pending: 0 };

        console.log(`[ValidationFacade] ══════════════════════════════════════════`);
        console.log(`[ValidationFacade] Batch: ${total} cards | Method: ${validator.getName()} | Concurrency: ${concurrency}`);
        console.log(`[ValidationFacade] ══════════════════════════════════════════`);

        const startTime = Date.now();
        this.abortFlag = false;

        return new Promise((resolve) => {
            const processNext = async () => {
                // Check abort
                if (this.abortFlag) {
                    if (activeWorkers === 0) {
                        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                        console.log(`[ValidationFacade] ABORTED: ${processed}/${total} in ${duration}s`);
                        summary.aborted = true;
                        summary.remaining = queue.length;
                        this.emit('complete', { results, summary, duration: parseFloat(duration), aborted: true });
                        resolve({ results, summary, duration: parseFloat(duration), aborted: true });
                    }
                    return;
                }

                if (queue.length === 0) {
                    if (activeWorkers === 0) {
                        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                        console.log(`[ValidationFacade] Completed: ${total} cards in ${duration}s`);
                        console.log(`[ValidationFacade] LIVE: ${summary.live} | DIE: ${summary.die} | ERROR: ${summary.error}`);
                        this.emit('complete', { results, summary, duration: parseFloat(duration) });
                        resolve({ results, summary, duration: parseFloat(duration) });
                    }
                    return;
                }

                const card = queue.shift();
                const cardIndex = total - queue.length - 1;
                activeWorkers++;

                try {
                    const cardEntity = card instanceof Card ? card : new Card(card);
                    console.log(`[ValidationFacade] [${cardIndex + 1}/${total}] Processing ****${cardEntity.last4}...`);

                    const result = await validator.validate(cardEntity, keys, proxyEntity);

                    // Add card info to result
                    result.card = {
                        last4: cardEntity.last4,
                        number: cardEntity.number,
                        expMonth: cardEntity.expMonth,
                        expYear: cardEntity.expYear
                    };
                    result.index = cardIndex;

                    results.push(result);

                    // Update summary
                    if (result.status === 'LIVE') summary.live++;
                    else if (result.status === 'DIE') summary.die++;
                    else if (result.status === 'ERROR') summary.error++;
                    else summary.pending++;

                    processed++;

                    // Emit progress
                    const progress = {
                        current: processed,
                        total,
                        percentage: Math.round((processed / total) * 100),
                        result,
                        summary: { ...summary }
                    };

                    this.emit('progress', progress);
                    if (onProgress) onProgress(progress);
                    if (onResult) onResult(result);

                } catch (err) {
                    const cardEntity = card instanceof Card ? card : new Card(card);
                    const errorResult = ValidationResult.error(err.message, {
                        card: {
                            last4: cardEntity.last4,
                            number: cardEntity.number,
                            expMonth: cardEntity.expMonth,
                            expYear: cardEntity.expYear
                        }
                    });
                    errorResult.index = cardIndex;

                    results.push(errorResult);
                    summary.error++;
                    processed++;

                    this.emit('progress', { current: processed, total, result: errorResult, summary: { ...summary } });
                    if (onProgress) onProgress({ current: processed, total, result: errorResult, summary: { ...summary } });
                    if (onResult) onResult(errorResult);
                }

                activeWorkers--;
                processNext();
            };

            // Start initial workers
            const initialWorkers = Math.min(concurrency, queue.length);
            for (let i = 0; i < initialWorkers; i++) {
                processNext();
            }
        });
    }

    /**
     * Stop batch validation
     */
    stopBatch() {
        this.abortFlag = true;
        console.log(`[ValidationFacade] Abort requested`);
        this.emit('abort');
    }

    /**
     * Get available validation methods
     */
    getAvailableMethods() {
        return this.validatorFactory.getAvailableMethods();
    }
}
