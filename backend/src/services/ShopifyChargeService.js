import { EventEmitter } from 'events';
import { ShopifyValidator } from '../validators/ShopifyValidator.js';
import { ShopifyResult } from '../domain/ShopifyResult.js';
import { DEFAULTS } from '../utils/constants.js';
import { binLookupClient } from '../infrastructure/external/BinLookupClient.js';
import { classifyFailure } from '../utils/failureClassifier.js';

/**
 * Shopify Charge Service
 * Orchestrates Shopify card validation using Auto Shopify API
 * User provides the Shopify site URL for validation
 * 
 * API: https://autoshopi.up.railway.app/?cc=cc&url=site&proxy=proxy
 * 
 * Requirements: 8.1, 8.2 - Statistics tracking integration
 */
export class ShopifyChargeService extends EventEmitter {
    constructor(options = {}) {
        super();
        this.concurrency = options.concurrency || DEFAULTS.CONCURRENCY;
        this.speedManager = options.speedManager || null;
        this.gatewayManager = options.gatewayManager || null;
        // Dashboard Service for statistics tracking (Requirements: 8.1, 8.2)
        this.dashboardService = options.dashboardService || null;
        // User-provided Shopify URL and proxy
        this.shopifyUrl = '';
        this.proxyString = '';
        this.validator = new ShopifyValidator({});
        this.abortFlag = false;
        this.currentExecutor = null;
        this._currentProxyConfig = null;
    }

    /**
     * Set the Shopify URL for validation
     */
    setShopifyUrl(url) {
        this.shopifyUrl = url;
        this.validator.setShopifyUrl(url);
    }

    /**
     * Set proxy string (ip:port:username:password)
     */
    setProxy(proxyString) {
        this.proxyString = proxyString;
        this.validator.setProxy(proxyString);
    }

    /**
     * Get current Shopify URL
     */
    getShopifyUrl() {
        return this.shopifyUrl;
    }

    /**
     * Create a proxy manager wrapper for gateway-specific proxy config
     */
    _createGatewayProxyManager(proxyConfig) {
        if (!proxyConfig) {
            return null;
        }

        return {
            isEnabled: () => true,
            getNextProxy: async () => {
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
     */
    async processCard(cardLine) {
        const gatewayId = 'auto-shopify-1';
        const startTime = Date.now();

        try {
            const cardInfo = this.validator.parseCard(cardLine);

            if (!cardInfo) {
                return ShopifyResult.error('INVALID_FORMAT', { card: cardLine });
            }

            const result = await this.validator.validate(cardInfo);
            const latencyMs = Date.now() - startTime;

            // Record success/failure for health tracking
            if (this.gatewayManager) {
                if (result.isApproved() || result.isDeclined()) {
                    this.gatewayManager.recordSuccess(gatewayId, latencyMs);
                } else if (result.status === 'ERROR') {
                    const category = classifyFailure(result.message);
                    this.gatewayManager.recordFailure(gatewayId, result.message, category);
                }
            }

            // Fetch BIN data for approved cards
            if (result.isApproved() && cardInfo.number) {
                try {
                    const binData = await binLookupClient.lookup(cardInfo.number);
                    if (binData && !binData.error) {
                        result.binData = binData;
                    }
                } catch (e) {
                    // Ignore BIN lookup errors
                }
            }

            return result;
        } catch (error) {
            if (this.gatewayManager) {
                const category = classifyFailure(error);
                this.gatewayManager.recordFailure(gatewayId, error.message, category);
            }

            return ShopifyResult.error(error.message, { card: cardLine });
        }
    }

    /**
     * Process multiple cards with concurrency control
     * 
     * Requirements: 8.1, 8.2 - Statistics tracking integration
     */
    async processBatch(cards, options = {}) {
        const {
            concurrency = DEFAULTS.CONCURRENCY,
            onProgress = null,
            onResult = null,
            tier = 'free',
            shopifyUrl = null,
            userId = null
        } = options;

        // Set URL if provided
        if (shopifyUrl) {
            this.setShopifyUrl(shopifyUrl);
        }

        if (!this.shopifyUrl) {
            const errorResult = {
                results: [],
                stats: { approved: 0, declined: 0, errors: cards.length },
                total: cards.length,
                liveCount: 0,
                duration: 0,
                error: 'Shopify URL is required'
            };
            this.emit('batchComplete', errorResult);
            return errorResult;
        }

        const gatewayId = 'auto-shopify-1';

        // Check gateway availability
        if (this.gatewayManager) {
            const isAvailable = this.gatewayManager.isAvailable(gatewayId);
            if (!isAvailable) {
                const reason = this.gatewayManager.getUnavailabilityReason(gatewayId);
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
                return unavailableResult;
            }

            // Retrieve proxy configuration from gateway (admin-configured)
            const proxyConfig = this.gatewayManager.getProxyConfig(gatewayId);
            if (proxyConfig) {
                const gatewayProxyManager = this._createGatewayProxyManager(proxyConfig);
                this.validator = new ShopifyValidator({
                    shopifyUrl: this.shopifyUrl,
                    proxyManager: gatewayProxyManager,
                    proxyString: this.proxyString // Preserve user-provided proxy
                });
                this._currentProxyConfig = proxyConfig;
            } else {
                // No gateway proxy config - use user-provided proxyString
                this.validator = new ShopifyValidator({
                    shopifyUrl: this.shopifyUrl,
                    proxyString: this.proxyString
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

        // Use SpeedManager if available
        if (this.speedManager) {
            try {
                // Get tier-based delay but force concurrency to 1 for Auto Shopify
                // (external API may have rate limits)
                const settings = await this.speedManager.getSpeedSettings('charge', tier);
                const { SpeedExecutor } = await import('./SpeedExecutor.js');
                const executor = new SpeedExecutor(1, settings.delay); // Force concurrency=1
                this.currentExecutor = executor;

                const tasks = cards.map((card, index) => async () => {
                    if (this.abortFlag) {
                        throw new Error('Aborted');
                    }
                    const result = await this.processCard(card);
                    result.index = index;
                    return result;
                });

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
                    async (execResult, index) => {
                        if (execResult.success) {
                            const result = execResult.result;
                            results.push(result);
                            processed++;

                            if (result.isApproved()) stats.approved++;
                            else if (result.isDeclined()) stats.declined++;
                            else stats.errors++;

                            this.emit('result', result);
                            if (onResult) await Promise.resolve(onResult(result.toJSON ? result.toJSON() : result));

                            // Check if we should stop the batch (CAPTCHA or SITE_DEAD after retries)
                            if (result.shouldStopBatch) {
                                this.stopBatch();
                            }
                        } else {
                            const errorResult = ShopifyResult.error(execResult.error, { card: cards[index] });
                            results.push(errorResult);
                            processed++;
                            stats.errors++;

                            this.emit('result', errorResult);
                            if (onResult) await Promise.resolve(onResult(errorResult.toJSON ? errorResult.toJSON() : errorResult));
                        }

                        if (onProgress) onProgress({ processed, total, ...stats });
                    }
                );

                const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                const liveCount = stats.approved;

                // Increment user statistics (Requirements: 8.1, 8.2)
                // cardsCount = total cards validated, hitsCount = approved cards
                if (userId && this.dashboardService) {
                    try {
                        await this.dashboardService.incrementUserStats(userId, total, liveCount);
                    } catch (err) {
                        console.error('[ShopifyChargeService] Failed to increment user stats:', err.message);
                    }
                }

                this.emit('complete', { results, stats, duration: parseFloat(duration) });
                this.emit('batchComplete', {
                    results,
                    stats,
                    liveCount,
                    total,
                    duration: parseFloat(duration),
                    gatewayId
                });

                this.currentExecutor = null;
                return { results, stats, total, liveCount, duration: parseFloat(duration) };

            } catch (error) {
                this.currentExecutor = null;

                if (error.message === 'Execution cancelled' || error.message === 'Aborted') {
                    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                    const liveCount = stats.approved;

                    // Increment user statistics for processed cards before abort (Requirements: 8.1, 8.2)
                    if (userId && this.dashboardService && processed > 0) {
                        try {
                            await this.dashboardService.incrementUserStats(userId, processed, liveCount);
                        } catch (err) {
                            console.error('[ShopifyChargeService] Failed to increment user stats (aborted):', err.message);
                        }
                    }

                    this.emit('complete', { results, stats, duration: parseFloat(duration), aborted: true });
                    this.emit('batchComplete', {
                        results,
                        stats,
                        liveCount,
                        total,
                        duration: parseFloat(duration),
                        aborted: true,
                        gatewayId
                    });

                    return { results, stats, total, liveCount, duration: parseFloat(duration), aborted: true };
                }
            }
        }

        throw new Error('SpeedManager is required for batch processing');
    }

    /**
     * Stop batch processing
     */
    stopBatch() {
        this.abortFlag = true;
        if (this.currentExecutor) {
            this.currentExecutor.cancel();
        }
        this.emit('abort');
    }
}
