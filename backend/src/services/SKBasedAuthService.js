import { EventEmitter } from 'events';
import { SKBasedAuthValidator } from '../validators/SKBasedAuthValidator.js';
import { SKBasedAuthResult } from '../domain/SKBasedAuthResult.js';
import { classifyFailure } from '../utils/failureClassifier.js';
import { GATEWAY_IDS } from '../utils/constants.js';

/**
 * SK-Based Auth Service
 * 
 * Orchestrates SK-based card authorization using user-provided Stripe SK/PK keys.
 * Uses SetupIntent for $0 authorization which bypasses Radar and goes directly to bank.
 * 
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
 */
export class SKBasedAuthService extends EventEmitter {
    /**
     * Create a new SKBasedAuthService
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
        this.validator = new SKBasedAuthValidator({ debug: this.debug });
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
     * Get the gateway ID for SK-based auth validation
     * @returns {string} Gateway ID
     */
    getGatewayId() {
        return GATEWAY_IDS.SKBASED_AUTH_1;
    }

    /**
     * Process a single card using SK-based auth validation
     * 
     * @param {string} cardLine - Card in format "number|mm|yy|cvv"
     * @param {Object} options - Validation options
     * @param {string} options.skKey - Stripe secret key
     * @param {string} options.pkKey - Stripe publishable key
     * @param {Object} options.proxy - Proxy configuration
     * @returns {Promise<SKBasedAuthResult>}
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
            return SKBasedAuthResult.error('Invalid card format', { card: cardLine });
        }

        try {
            // Validate the card
            const result = await this.validator.validate(cardInfo, {
                skKey: options.skKey,
                pkKey: options.pkKey,
                proxy: options.proxy,
                gateway: gatewayId
            });

            const latencyMs = Date.now() - startTime;
            this._log(`processCard: Validation complete in ${latencyMs}ms`, { status: result.status });

            // Record success/failure for health tracking
            if (this.gatewayManager) {
                if (result.isLive() || result.isDeclined() || result.isCCN()) {
                    // All valid responses are successful gateway responses
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

            return SKBasedAuthResult.error(error.message, { card: cardLine });
        }
    }

    /**
     * Process multiple cards with concurrency control
     * 
     * Uses SpeedManager for tier-based speed limits when available.
     * Emits 'result', 'progress', and 'batchComplete' events for real-time streaming.
     * 
     * @param {string[]} cards - Array of card strings in format "number|mm|yy|cvv"
     * @param {Object} options - Processing options
     * @param {string} options.skKey - Stripe secret key (required)
     * @param {string} options.pkKey - Stripe publishable key (required)
     * @param {Object} options.proxy - Proxy configuration (required)
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
            tier = 'free',
            onProgress = null,
            onResult = null
        } = options;

        const gatewayId = this.getGatewayId();
        this._log(`processBatch: Starting batch of ${cards.length} cards`, { gatewayId, tier });

        // Check gateway availability before processing
        if (this.gatewayManager) {
            const isAvailable = this.gatewayManager.isAvailable(gatewayId);
            this._log(`processBatch: Gateway availability check`, { gatewayId, isAvailable });

            if (!isAvailable) {
                const reason = this.gatewayManager.getUnavailabilityReason(gatewayId);
                this._log(`Gateway ${gatewayId} unavailable: ${reason?.message}`);

                // Emit batchComplete to release any locks
                const unavailableResult = {
                    results: [],
                    stats: { live: 0, ccn: 0, declined: 0, errors: 0 },
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
        const stats = { live: 0, ccn: 0, declined: 0, errors: 0 };
        const startTime = Date.now();

        // Validation options for each card
        const validationOptions = {
            skKey,
            pkKey,
            proxy
        };

        // Use SpeedManager if available
        if (this.speedManager) {
            try {
                const executor = await this.speedManager.createExecutor('auth', tier);
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
                // Use onResult callback for live streaming results
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
                    async (execResult, index) => {
                        // Result callback - emit immediately for live streaming
                        if (execResult.success) {
                            const result = execResult.result;
                            results.push(result);
                            processed++;

                            // Update stats
                            if (result.isLive()) {
                                stats.live++;
                            } else if (result.isCCN()) {
                                stats.ccn++;
                            } else if (result.isDeclined()) {
                                stats.declined++;
                            } else {
                                stats.errors++;
                            }

                            this.emit('result', result);
                            if (onResult) await Promise.resolve(onResult(result.toJSON ? result.toJSON() : result));
                        } else {
                            const errorResult = SKBasedAuthResult.error(execResult.error, { card: cards[index] });
                            results.push(errorResult);
                            processed++;
                            stats.errors++;

                            this.emit('result', errorResult);
                            if (onResult) await Promise.resolve(onResult(errorResult.toJSON ? errorResult.toJSON() : errorResult));
                        }

                        // Emit progress
                        if (onProgress) onProgress({ processed, total, ...stats });
                    }
                );

                const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                const liveCount = stats.live;

                // Emit batchComplete
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

        // SpeedManager is required - throw error if not available
        throw new Error('SpeedManager is required for batch processing');
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

export default SKBasedAuthService;
