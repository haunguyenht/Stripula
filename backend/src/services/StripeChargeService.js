import { EventEmitter } from 'events';
import { ChargeGatewayValidator } from '../validators/ChargeGatewayValidator.js';
import { ChargeResult } from '../domain/ChargeResult.js';
import { CHARGE_SITES, DEFAULT_CHARGE_SITE, DEFAULTS } from '../utils/constants.js';
import { binLookupClient } from '../infrastructure/external/BinLookupClient.js';
import { classifyFailure } from '../utils/failureClassifier.js';

/**
 * Stripe Charge Service
 * Orchestrates charge validation using donation site gateways
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4 - Uses SpeedManager for tier-based speed limits
 * Requirements: 3.1, 3.2, 3.3 (Proxy) - Per-gateway proxy configuration
 */
export class StripeChargeService extends EventEmitter {
    constructor(options = {}) {
        super();
        this.site = options.site || DEFAULT_CHARGE_SITE;
        this.concurrency = options.concurrency || DEFAULTS.CONCURRENCY;
        this.speedManager = options.speedManager || null;
        this.gatewayManager = options.gatewayManager || null;
        this.debug = options.debug !== false;
        this.validator = new ChargeGatewayValidator({
            site: this.site,
            debug: this.debug
        });
        this.abortFlag = false;
        this.currentExecutor = null;
        this._currentProxyConfig = null;
    }

    _log(message, data = null) {
        // Logging disabled
    }

    getAvailableSites() {
        return Object.values(CHARGE_SITES).map(site => ({
            id: site.id,
            label: site.label
        }));
    }

    setSite(siteId) {
        const site = Object.values(CHARGE_SITES).find(s => s.id === siteId);
        if (site) {
            this.site = site;
            this.validator = new ChargeGatewayValidator({
                site
            });
        }
    }

    /**
     * Create a proxy manager wrapper for gateway-specific proxy config
     * This allows the validator to use the gateway's proxy configuration
     * 
     * Requirements: 3.1, 3.2, 3.3 (Proxy) - Per-gateway proxy configuration
     * 
     * @param {Object|null} proxyConfig - Gateway proxy config from GatewayManager
     * @returns {Object|null} Proxy manager-like object or null
     */
    _createGatewayProxyManager(proxyConfig) {
        if (!proxyConfig) {
            return null;
        }

        // Create a proxy manager-like object that returns the gateway's proxy config
        // ProxyAgentFactory.create() expects an object with {type, host, port, username?, password?}
        return {
            isEnabled: () => true,
            getNextProxy: async () => {
                // Return the proxy config object directly (not a URL string)
                // ProxyAgentFactory.create() will build the URL from this object
                return {
                    type: proxyConfig.type || 'http',
                    host: proxyConfig.host,
                    port: proxyConfig.port,
                    username: proxyConfig.username,
                    password: proxyConfig.password
                };
            }
        };
    }

    /**
     * Process a single card
     * Records success/failure for gateway health tracking (Requirements 4.1, 4.2, 4.3)
     * 
     * @param {string} cardLine - Card in format "number|mm|yy|cvv"
     * @returns {Promise<ChargeResult>}
     */
    async processCard(cardLine) {
        const cardPreview = cardLine?.slice(0, 10) + '****';
        this._log(`processCard: ${cardPreview}`);

        const cardInfo = this.validator.parseCard(cardLine);
        const gatewayId = this.site?.id || 'charge-1';
        const startTime = Date.now();

        if (!cardInfo) {
            this._log(`processCard: INVALID_FORMAT`);
            return ChargeResult.error('INVALID_FORMAT', { card: cardLine });
        }

        this._log(`processCard: Parsed card, calling validator.validate()`);
        try {
            const result = await this.validator.validate(cardInfo);
            const latencyMs = Date.now() - startTime;
            this._log(`processCard: Validation complete in ${latencyMs}ms`, { status: result.status, approved: result.isApproved?.() });

            // Record success/failure for health tracking (Requirements 4.1, 4.2)
            if (this.gatewayManager) {
                if (result.isApproved() || result.isDeclined()) {
                    // Both approved and declined are successful gateway responses (Requirement 4.1)
                    this.gatewayManager.recordSuccess(gatewayId, latencyMs);
                } else if (result.status === 'ERROR') {
                    // Classify the error and record with proper category (Requirement 4.2)
                    const category = classifyFailure(result.message);
                    this.gatewayManager.recordFailure(gatewayId, result.message, category);
                }
            }

            if (result.isApproved() && cardInfo.number) {
                try {
                    const binData = await binLookupClient.lookup(cardInfo.number);
                    if (binData && !binData.error) {
                        result.binData = binData;
                    }
                } catch (e) {
                    // BIN lookup error ignored
                }
            }

            return result;
        } catch (error) {
            // Record failure with proper classification for health tracking (Requirement 4.2)
            if (this.gatewayManager) {
                const category = classifyFailure(error);
                this.gatewayManager.recordFailure(gatewayId, error.message, category);
            }
            return ChargeResult.error(error.message, { card: cardLine });
        }
    }

    /**
     * Process multiple cards with concurrency control
     * Uses SpeedManager for tier-based speed limits when available
     * 
     * Requirements: 3.1, 3.2, 3.3, 3.4 - Tier-based speed enforcement
     * Requirements: 3.1, 3.2, 3.3 (Proxy) - Per-gateway proxy configuration
     * 
     * @param {string[]} cards - Array of card strings
     * @param {Object} options - Processing options
     * @returns {Promise<Object>}
     */
    async processBatch(cards, options = {}) {
        const {
            concurrency = DEFAULTS.CONCURRENCY,
            delayBetweenCards = 3000,
            onProgress = null,
            onResult = null,
            tier = 'free'
        } = options;

        // Get the gateway ID for the current site
        const gatewayId = this.site?.id || 'charge-1';

        this._log(`processBatch: Starting batch of ${cards.length} cards`, { gatewayId, tier, concurrency });

        // Check gateway availability before processing
        if (this.gatewayManager) {
            const isAvailable = this.gatewayManager.isAvailable(gatewayId);
            this._log(`processBatch: Gateway availability check`, { gatewayId, isAvailable });
            if (!isAvailable) {
                const reason = this.gatewayManager.getUnavailabilityReason(gatewayId);

                // Emit batchComplete to release any locks
                const unavailableResult = {
                    results: [],
                    stats: { approved: 0, declined: 0, errors: 0 },
                    total: cards.length,
                    liveCount: 0,
                    duration: 0,
                    unavailable: true,
                    unavailableReason: reason,
                    gatewayId
                };

                this.emit('batchComplete', unavailableResult);

                // Return early with unavailable status
                return unavailableResult;
            }

            // Retrieve proxy configuration from GatewayManager (Requirement 3.1 Proxy)
            const proxyConfig = this.gatewayManager.getProxyConfig(gatewayId);
            if (proxyConfig) {
                // Create a proxy manager wrapper for the gateway's proxy config
                const gatewayProxyManager = this._createGatewayProxyManager(proxyConfig);
                // Update validator with gateway proxy (Requirement 3.2 Proxy)
                this.validator = new ChargeGatewayValidator({
                    site: this.site,
                    proxyManager: gatewayProxyManager
                });
                this._currentProxyConfig = proxyConfig;
            } else {
                this.validator = new ChargeGatewayValidator({
                    site: this.site
                });
                this._currentProxyConfig = null;
            }
        }

        this.abortFlag = false;
        this.concurrency = concurrency;

        const results = [];
        const total = cards.length;
        let processed = 0;
        const stats = { approved: 0, declined: 0, errors: 0 };
        const startTime = Date.now();

        // Use SpeedManager if available (Requirement 3.1)
        if (this.speedManager) {
            try {
                const executor = await this.speedManager.createExecutor('charge', tier);
                this.currentExecutor = executor;

                // Convert cards to tasks
                const tasks = cards.map((card, index) => async () => {
                    if (this.abortFlag) {
                        throw new Error('Aborted');
                    }

                    const result = await this.processCard(card);
                    result.index = index;
                    return result;
                });

                // Execute with speed limits (Requirements 3.2, 3.3)
                // Use onResult callback for live streaming results
                await executor.executeBatch(
                    tasks,
                    (completed, totalTasks) => {
                        const executorStats = executor.getStats();
                        this.emit('progress', {
                            processed: completed,
                            total: totalTasks,
                            ...stats,
                            executorStats
                        });
                    },
                    (execResult, index) => {
                        // Live streaming: emit result immediately as each task completes
                        if (execResult.success) {
                            const result = execResult.result;
                            results.push(result);
                            processed++;

                            if (result.isApproved()) stats.approved++;
                            else if (result.isDeclined()) stats.declined++;
                            else stats.errors++;

                            this.emit('result', result);
                            if (onResult) onResult(result.toJSON ? result.toJSON() : result);
                        } else {
                            const errorResult = ChargeResult.error(execResult.error, { card: cards[index] });
                            results.push(errorResult);
                            processed++;
                            stats.errors++;

                            this.emit('result', errorResult);
                            if (onResult) onResult(errorResult.toJSON ? errorResult.toJSON() : errorResult);
                        }

                        if (onProgress) onProgress({ processed, total, ...stats });
                    }
                );

                // Results already processed via onResult callback above

                const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                const liveCount = stats.approved;

                this.emit('complete', { results, stats, duration: parseFloat(duration) });
                this.emit('batchComplete', {
                    results,
                    stats,
                    liveCount,
                    total,
                    duration: parseFloat(duration),
                    gatewayId: 'charge'
                });

                this.currentExecutor = null;
                return { results, stats, total, liveCount, duration: parseFloat(duration) };

            } catch (error) {
                this.currentExecutor = null;

                if (error.message === 'Execution cancelled' || error.message === 'Aborted') {
                    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                    const liveCount = stats.approved;

                    this.emit('complete', { results, stats, duration: parseFloat(duration), aborted: true });
                    this.emit('batchComplete', {
                        results,
                        stats,
                        liveCount,
                        total,
                        duration: parseFloat(duration),
                        aborted: true,
                        gatewayId: 'charge'
                    });

                    return { results, stats, total, liveCount, duration: parseFloat(duration), aborted: true };
                }

                // Fall through to legacy processing on other errors

            }
        }

        // Legacy processing (fallback when SpeedManager not available)
        return this._processBatchLegacy(cards, { concurrency, delayBetweenCards, onProgress, onResult, tier });
    }

    /**
     * Legacy batch processing without SpeedManager
     * @private
     * 
     * Note: This fallback enforces tier-based limits using DEFAULT_SPEED_LIMITS
     * to prevent users from bypassing speed restrictions
     */
    async _processBatchLegacy(cards, options) {
        const {
            concurrency,
            delayBetweenCards,
            onProgress,
            onResult,
            tier = 'free'
        } = options;

        // Import defaults for tier-based limiting in legacy mode
        const { DEFAULT_SPEED_LIMITS } = await import('./SpeedConfigService.js');
        const tierLimits = DEFAULT_SPEED_LIMITS[tier] || DEFAULT_SPEED_LIMITS.free;

        // Enforce tier-based limits even in legacy mode
        const effectiveConcurrency = Math.min(concurrency, tierLimits.concurrency);
        const effectiveDelay = Math.max(delayBetweenCards, tierLimits.delay);

        const results = [];
        const queue = [...cards];
        const total = cards.length;
        let processed = 0;
        let activeWorkers = 0;
        const stats = { approved: 0, declined: 0, errors: 0 };

        const startTime = Date.now();

        return new Promise((resolve) => {
            const processNext = async () => {
                if (this.abortFlag) {
                    if (activeWorkers === 0) {
                        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                        const liveCount = stats.approved;
                        this.emit('complete', { results, stats, duration: parseFloat(duration), aborted: true });
                        this.emit('batchComplete', {
                            results,
                            stats,
                            liveCount,
                            total,
                            duration: parseFloat(duration),
                            aborted: true,
                            gatewayId: 'charge'
                        });
                        resolve({ results, stats, total, liveCount, duration: parseFloat(duration), aborted: true });
                    }
                    return;
                }

                if (queue.length === 0) {
                    if (activeWorkers === 0) {
                        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                        const liveCount = stats.approved;
                        this.emit('complete', { results, stats, duration: parseFloat(duration) });
                        this.emit('batchComplete', {
                            results,
                            stats,
                            liveCount,
                            total,
                            duration: parseFloat(duration),
                            gatewayId: 'charge'
                        });
                        resolve({ results, stats, total, liveCount, duration: parseFloat(duration) });
                    }
                    return;
                }

                const card = queue.shift();
                activeWorkers++;

                try {
                    const result = await this.processCard(card);
                    results.push(result);
                    processed++;

                    if (result.isApproved()) stats.approved++;
                    else if (result.isDeclined()) stats.declined++;
                    else stats.errors++;

                    const progress = { processed, total, ...stats };

                    this.emit('progress', progress);
                    this.emit('result', result);

                    if (onProgress) onProgress(progress);
                    if (onResult) onResult(result.toJSON ? result.toJSON() : result);

                } catch (error) {
                    const errorResult = ChargeResult.error(error.message, { card });
                    results.push(errorResult);
                    processed++;
                    stats.errors++;

                    if (onProgress) onProgress({ processed, total, ...stats });
                    if (onResult) onResult(errorResult.toJSON ? errorResult.toJSON() : errorResult);
                }

                activeWorkers--;

                // Delay between cards (using tier-enforced delay)
                if (queue.length > 0 && effectiveDelay > 0 && !this.abortFlag) {
                    await new Promise(r => setTimeout(r, effectiveDelay));
                }

                processNext();
            };

            // Start workers with staggered delays (using tier-enforced limits)
            const initialWorkers = Math.min(effectiveConcurrency, queue.length);
            for (let i = 0; i < initialWorkers; i++) {
                setTimeout(() => processNext(), i * effectiveDelay);
            }
        });
    }

    /**
     * Stop batch processing
     */
    stopBatch() {
        this.abortFlag = true;

        // Cancel SpeedExecutor if active
        if (this.currentExecutor) {
            this.currentExecutor.cancel();
        }

        this.emit('abort');
    }
}
