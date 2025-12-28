import { EventEmitter } from 'events';
import { SKBasedModernValidator } from '../validators/SKBasedModernValidator.js';
import { SKBasedResult } from '../domain/SKBasedResult.js';
import { classifyFailure } from '../utils/failureClassifier.js';
import { GATEWAY_IDS } from '../utils/constants.js';

/**
 * SK-Based Charge Service
 * 
 * Orchestrates SK-based card validation using the modern PaymentMethod → PaymentIntent flow.
 * Uses js.stripe.com origin with payment-element headers for reduced Radar friction.
 * Extends EventEmitter for real-time result streaming to the frontend.
 * 
 * Integrates with:
 * - SpeedManager for tier-based concurrency and delay limits
 * - GatewayManager for availability checks and health metrics
 * 
 * Events emitted:
 * - 'result': Emitted for each completed card validation
 * - 'progress': Emitted with processed count and stats
 * - 'batchComplete': Emitted when batch processing completes
 * - 'abort': Emitted when batch is stopped
 * 
 * Modern Flow Features:
 * - PaymentMethod → PaymentIntent (recommended by Stripe)
 * - js.stripe.com origin with payment-element user agent
 * - Fresh fingerprints (guid, muid, sid) per request
 * - Client attribution metadata for legitimacy
 * - Auto-refund on success
 */
export class SKBasedChargeService extends EventEmitter {
    /**
     * Create a new SKBasedChargeService
     * 
     * @param {Object} options - Configuration options
     * @param {Object} options.speedManager - SpeedManager instance for tier-based limits
     * @param {Object} options.gatewayManager - GatewayManager instance for availability checks
     * @param {boolean} options.debug - Enable debug logging (default: true)
     */
    constructor(options = {}) {
        super();
        this.speedManager = options.speedManager || null;
        this.gatewayManager = options.gatewayManager || null;
        this.debug = options.debug !== false;
        // Use modern validator (PaymentMethod → PaymentIntent flow)
        this.validator = new SKBasedModernValidator({ debug: this.debug });
        this.abortFlag = false;
        this.currentExecutor = null;
    }

    /**
     * Log debug messages
     * @private
     */
    _log(message, data = null) {
        // Logging disabled
    }

    /**
     * Get the gateway ID for SK-based validation
     * @returns {string} Gateway ID
     */
    getGatewayId() {
        return GATEWAY_IDS.SKBASED_CHARGE_1;
    }

    /**
     * Process a single card using SK-based validation
     * 
     * @param {string} cardLine - Card in format "number|mm|yy|cvv"
     * @param {Object} options - Validation options
     * @param {string} options.skKey - Stripe secret key
     * @param {string} options.pkKey - Stripe publishable key
     * @param {Object} options.proxy - Proxy configuration
     * @param {number} options.chargeAmount - Amount to charge in cents
     * @param {string} options.currency - Currency code
     * @returns {Promise<SKBasedResult>}
     */
    async processCard(cardLine, options = {}) {
        const cardPreview = cardLine?.slice(0, 10) + '****';
        this._log(`processCard: ${cardPreview}`);

        const gatewayId = this.getGatewayId();
        const startTime = Date.now();

        // Parse the card line
        const cardInfo = this.validator.parseCard(cardLine);
        if (!cardInfo) {
            this._log(`processCard: INVALID_FORMAT`);
            return SKBasedResult.error('Invalid card format', { card: cardLine });
        }

        try {
            // Validate the card
            const result = await this.validator.validate(cardInfo, {
                skKey: options.skKey,
                pkKey: options.pkKey,
                proxy: options.proxy,
                chargeAmount: options.chargeAmount || 100,
                currency: options.currency || 'usd',
                gateway: gatewayId
            });

            const latencyMs = Date.now() - startTime;
            this._log(`processCard: Validation complete in ${latencyMs}ms`, { status: result.status });

            // Record success/failure for health tracking (Requirement 7.4)
            if (this.gatewayManager) {
                if (result.isApproved() || result.isDeclined()) {
                    // Both approved and declined are successful gateway responses
                    this.gatewayManager.recordSuccess(gatewayId, latencyMs);
                } else if (result.isError()) {
                    // Classify the error and record with proper category
                    const category = classifyFailure(result.message);
                    this.gatewayManager.recordFailure(gatewayId, result.message, category);
                }
            }

            return result;
        } catch (error) {
            this._log(`processCard: Exception - ${error.message}`);

            // Record failure for health tracking
            if (this.gatewayManager) {
                const category = classifyFailure(error);
                this.gatewayManager.recordFailure(gatewayId, error.message, category);
            }

            return SKBasedResult.error(error.message, { card: cardLine });
        }
    }

    /**
     * Process multiple cards with concurrency control
     * 
     * Uses SpeedManager for tier-based speed limits when available.
     * Emits 'result', 'progress', and 'batchComplete' events for real-time streaming.
     * 
     * Requirements: 7.1-7.6, 8.1-8.3
     * 
     * @param {string[]} cards - Array of card strings in format "number|mm|yy|cvv"
     * @param {Object} options - Processing options
     * @param {string} options.skKey - Stripe secret key (required)
     * @param {string} options.pkKey - Stripe publishable key (required)
     * @param {Object} options.proxy - Proxy configuration (required)
     * @param {number} options.chargeAmount - Amount to charge in cents (default: 100)
     * @param {string} options.currency - Currency code (default: 'usd')
     * @param {string} options.tier - User tier for speed limits (default: 'free')
     * @param {Function} options.onProgress - Progress callback
     * @param {Function} options.onResult - Result callback
     * @returns {Promise<Object>} Batch results with stats
     */
    async processBatch(cards, options = {}) {
        const {
            skKey,
            pkKey,
            proxy,
            chargeAmount = 100,
            currency = 'usd',
            tier = 'free',
            onProgress = null,
            onResult = null
        } = options;

        const gatewayId = this.getGatewayId();
        this._log(`processBatch: Starting batch of ${cards.length} cards`, { gatewayId, tier });

        // Check gateway availability before processing (Requirement 7.2, 7.3)
        if (this.gatewayManager) {
            const isAvailable = this.gatewayManager.isAvailable(gatewayId);
            this._log(`processBatch: Gateway availability check`, { gatewayId, isAvailable });

            if (!isAvailable) {
                const reason = this.gatewayManager.getUnavailabilityReason(gatewayId);
                this._log(`Gateway ${gatewayId} unavailable: ${reason?.message}`);

                // Emit batchComplete to release any locks (Requirement 8.3)
                const unavailableResult = {
                    results: [],
                    stats: { approved: 0, live: 0, declined: 0, errors: 0 },
                    total: cards.length,
                    liveCount: 0,
                    duration: 0,
                    unavailable: true,
                    unavailableReason: reason,
                    gatewayId
                };

                this.emit('batchComplete', unavailableResult);
                return unavailableResult;
            }
        }

        this.abortFlag = false;
        const results = [];
        const total = cards.length;
        let processed = 0;
        const stats = { approved: 0, live: 0, declined: 0, errors: 0 };
        const startTime = Date.now();

        // Validation options for each card
        const validationOptions = {
            skKey,
            pkKey,
            proxy,
            chargeAmount,
            currency
        };

        // Use SpeedManager if available (Requirement 7.5)
        if (this.speedManager) {
            try {
                const executor = await this.speedManager.createExecutor('charge', tier);
                this.currentExecutor = executor;

                // Convert cards to tasks
                const tasks = cards.map((card, index) => async () => {
                    if (this.abortFlag) {
                        throw new Error('Aborted');
                    }

                    const result = await this.processCard(card, validationOptions);
                    result.index = index;
                    return result;
                });

                // Execute with speed limits
                // Use onResult callback for live streaming results (Requirement 8.1)
                await executor.executeBatch(
                    tasks,
                    (completed, totalTasks) => {
                        // Progress callback
                        const executorStats = executor.getStats();
                        this.emit('progress', {
                            processed: completed,
                            total: totalTasks,
                            ...stats,
                            executorStats
                        });
                    },
                    (execResult, index) => {
                        // Result callback - emit immediately for live streaming (Requirement 8.1)
                        if (execResult.success) {
                            const result = execResult.result;
                            results.push(result);
                            processed++;

                            // Update stats
                            if (result.isApproved()) {
                                stats.approved++;
                                stats.live++;
                            } else if (result.status === 'LIVE') {
                                stats.live++;
                            } else if (result.isDeclined()) {
                                stats.declined++;
                            } else {
                                stats.errors++;
                            }

                            this.emit('result', result);
                            if (onResult) onResult(result.toJSON ? result.toJSON() : result);
                        } else {
                            const errorResult = SKBasedResult.error(execResult.error, { card: cards[index] });
                            results.push(errorResult);
                            processed++;
                            stats.errors++;

                            this.emit('result', errorResult);
                            if (onResult) onResult(errorResult.toJSON ? errorResult.toJSON() : errorResult);
                        }

                        // Emit progress (Requirement 8.2)
                        if (onProgress) onProgress({ processed, total, ...stats });
                    }
                );

                const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                const liveCount = stats.live;

                // Emit batchComplete (Requirement 8.3)
                const batchResult = {
                    results,
                    stats,
                    total,
                    liveCount,
                    duration: parseFloat(duration),
                    gatewayId
                };

                this.emit('complete', batchResult);
                this.emit('batchComplete', batchResult);

                this.currentExecutor = null;
                return batchResult;

            } catch (error) {
                this.currentExecutor = null;

                if (error.message === 'Execution cancelled' || error.message === 'Aborted') {
                    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                    const liveCount = stats.live;

                    const abortedResult = {
                        results,
                        stats,
                        total,
                        liveCount,
                        duration: parseFloat(duration),
                        aborted: true,
                        gatewayId
                    };

                    this.emit('complete', { ...abortedResult });
                    this.emit('batchComplete', abortedResult);

                    return abortedResult;
                }

                // Fall through to legacy processing on other errors
                this._log(`SpeedManager error, falling back to legacy: ${error.message}`);
            }
        }

        // Legacy processing (fallback when SpeedManager not available)
        return this._processBatchLegacy(cards, {
            ...validationOptions,
            tier,
            onProgress,
            onResult
        });
    }

    /**
     * Legacy batch processing without SpeedManager
     * @private
     */
    async _processBatchLegacy(cards, options) {
        const {
            skKey,
            pkKey,
            proxy,
            chargeAmount,
            currency,
            tier = 'free',
            onProgress,
            onResult
        } = options;

        // Import defaults for tier-based limiting in legacy mode
        const { DEFAULT_SPEED_LIMITS } = await import('./SpeedConfigService.js');
        const tierLimits = DEFAULT_SPEED_LIMITS[tier] || DEFAULT_SPEED_LIMITS.free;

        const concurrency = tierLimits.concurrency;
        const delay = tierLimits.delay;

        this._log(`Legacy mode | Tier: ${tier} | Concurrency: ${concurrency} | Delay: ${delay}ms`);

        const gatewayId = this.getGatewayId();
        const validationOptions = { skKey, pkKey, proxy, chargeAmount, currency };

        const results = [];
        const queue = [...cards];
        const total = cards.length;
        let processed = 0;
        let activeWorkers = 0;
        const stats = { approved: 0, live: 0, declined: 0, errors: 0 };
        const startTime = Date.now();

        return new Promise((resolve) => {
            const processNext = async () => {
                if (this.abortFlag) {
                    if (activeWorkers === 0) {
                        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                        const liveCount = stats.live;

                        const abortedResult = {
                            results,
                            stats,
                            total,
                            liveCount,
                            duration: parseFloat(duration),
                            aborted: true,
                            gatewayId
                        };

                        this.emit('complete', abortedResult);
                        this.emit('batchComplete', abortedResult);
                        resolve(abortedResult);
                    }
                    return;
                }

                if (queue.length === 0) {
                    if (activeWorkers === 0) {
                        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                        const liveCount = stats.live;

                        const batchResult = {
                            results,
                            stats,
                            total,
                            liveCount,
                            duration: parseFloat(duration),
                            gatewayId
                        };

                        this.emit('complete', batchResult);
                        this.emit('batchComplete', batchResult);
                        resolve(batchResult);
                    }
                    return;
                }

                const card = queue.shift();
                activeWorkers++;

                try {
                    const result = await this.processCard(card, validationOptions);
                    results.push(result);
                    processed++;

                    // Update stats
                    if (result.isApproved()) {
                        stats.approved++;
                        stats.live++;
                    } else if (result.status === 'LIVE') {
                        stats.live++;
                    } else if (result.isDeclined()) {
                        stats.declined++;
                    } else {
                        stats.errors++;
                    }

                    const progress = { processed, total, ...stats };

                    this.emit('progress', progress);
                    this.emit('result', result);

                    if (onProgress) onProgress(progress);
                    if (onResult) onResult(result.toJSON ? result.toJSON() : result);

                } catch (error) {
                    const errorResult = SKBasedResult.error(error.message, { card });
                    results.push(errorResult);
                    processed++;
                    stats.errors++;

                    this.emit('result', errorResult);

                    if (onProgress) onProgress({ processed, total, ...stats });
                    if (onResult) onResult(errorResult.toJSON ? errorResult.toJSON() : errorResult);
                }

                activeWorkers--;

                // Delay between cards
                if (queue.length > 0 && delay > 0 && !this.abortFlag) {
                    await new Promise(r => setTimeout(r, delay));
                }

                processNext();
            };

            // Start workers with staggered delays
            const initialWorkers = Math.min(concurrency, queue.length);
            for (let i = 0; i < initialWorkers; i++) {
                setTimeout(() => processNext(), i * delay);
            }
        });
    }

    /**
     * Stop batch processing
     * 
     * Sets abort flag and cancels SpeedExecutor if active.
     */
    stopBatch() {
        this._log('stopBatch: Stopping batch processing');
        this.abortFlag = true;

        // Cancel SpeedExecutor if active
        if (this.currentExecutor) {
            this.currentExecutor.cancel();
        }

        this.emit('abort');
    }
}

export default SKBasedChargeService;
