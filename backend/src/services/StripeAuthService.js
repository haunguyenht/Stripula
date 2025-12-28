import { EventEmitter } from 'events';
import { AuthValidator } from '../validators/AuthValidator.js';
import { AuthResult } from '../domain/AuthResult.js';
import { AUTH_SITES, DEFAULT_AUTH_SITE, SKBASED_AUTH_SITES, DEFAULTS } from '../utils/constants.js';
import { binLookupClient } from '../infrastructure/external/BinLookupClient.js';
import { classifyFailure } from '../utils/failureClassifier.js';

/**
 * Stripe Auth Service
 * Orchestrates auth validation using the modular validator pattern
 * 
 * Supports two types of auth validation:
 * 1. WooCommerce SetupIntent (auth-*) - Uses site-specific PK keys
 * 2. SK-Based SetupIntent (skbased-auth-*) - Uses backend-configured SK/PK keys
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4 - Uses SpeedManager for tier-based speed limits
 * Requirements: 2.2, 2.5, 3.2, 4.1 - Gateway availability and health tracking
 * Requirements: 3.1, 3.2, 3.3 (Proxy) - Per-gateway proxy configuration
 */
export class StripeAuthService extends EventEmitter {
    constructor(options = {}) {
        super();
        this.site = options.site || DEFAULT_AUTH_SITE;
        this.concurrency = options.concurrency || DEFAULTS.CONCURRENCY;
        this.speedManager = options.speedManager || null;
        this.gatewayManager = options.gatewayManager || null;
        // SK-Based Auth Service for routing skbased-auth-* gateways
        this.skbasedAuthService = options.skbasedAuthService || null;
        this.validator = new AuthValidator({
            site: this.site,
            concurrency: this.concurrency
        });
        this.abortFlag = false;
        this.currentExecutor = null;
        // Current gateway proxy config (set before batch processing)
        this._currentProxyConfig = null;
    }

    /**
     * Check if current site is SK-based auth
     */
    _isSKBasedAuth(siteId = null) {
        const id = siteId || this.site?.id;
        return id?.startsWith('skbased-auth-');
    }

    /**
     * Get available auth sites (includes both WooCommerce and SK-based auth)
     */
    getAvailableSites() {
        // WooCommerce auth sites
        const wooSites = Object.values(AUTH_SITES).map(site => ({
            id: site.id,
            label: site.label,
            type: 'woocommerce'
        }));

        // SK-based auth sites
        const skSites = Object.values(SKBASED_AUTH_SITES).map(site => ({
            id: site.id,
            label: site.label,
            type: 'skbased-auth'
        }));

        return [...wooSites, ...skSites];
    }

    /**
     * Set active site
     */
    setSite(siteId) {
        // Check if it's an SK-based auth site
        if (this._isSKBasedAuth(siteId)) {
            const site = Object.values(SKBASED_AUTH_SITES).find(s => s.id === siteId);
            if (site) {
                this.site = site;
                // No validator needed for SK-based auth - uses SKBasedAuthService
            }
            return;
        }

        // WooCommerce auth site
        const site = Object.values(AUTH_SITES).find(s => s.id === siteId);
        if (site) {
            this.site = site;
            this.validator = new AuthValidator({
                site,
                concurrency: this.concurrency
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
     * Records success/failure for gateway health tracking (Requirement 4.1)
     * Uses proper failure classification (Requirements 4.1, 4.2, 4.3)
     * 
     * @param {string} cardLine - Card in format "number|mm|yy|cvv"
     * @returns {Promise<AuthResult>}
     */
    async processCard(cardLine) {
        const cardInfo = this.validator.parseCard(cardLine);
        const gatewayId = this.site?.id || 'auth-1';
        const startTime = Date.now();

        if (!cardInfo) {
            // Format errors should NOT be recorded as gateway failures (Requirement 4.3)
            return AuthResult.error('INVALID_FORMAT', { card: cardLine });
        }

        try {
            const result = await this.validator.validate(cardInfo);
            const latencyMs = Date.now() - startTime;

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
            // Record failure with proper classification for health tracking (Requirement 4.2)
            if (this.gatewayManager) {
                const category = classifyFailure(error);
                this.gatewayManager.recordFailure(gatewayId, error.message, category);
            }
            return AuthResult.error(error.message, { card: cardLine });
        }
    }

    /**
     * Process multiple cards with concurrency control
     * Uses SpeedManager for tier-based speed limits when available
     * 
     * Routes to SKBasedAuthService for skbased-auth-* gateways
     * 
     * Requirements: 3.1, 3.2, 3.3, 3.4 - Tier-based speed enforcement
     * Requirements: 2.2, 2.5, 3.2, 4.1 - Gateway availability and health tracking
     * Requirements: 3.1, 3.2, 3.3 (Proxy) - Per-gateway proxy configuration
     * 
     * @param {string[]} cards - Array of card strings
     * @param {Object} options - Processing options
     * @returns {Promise<Object>}
     */
    async processBatch(cards, options = {}) {
        const {
            concurrency = DEFAULTS.CONCURRENCY,
            delayBetweenCards = 2500,
            onProgress = null,
            onResult = null,
            tier = 'free'
        } = options;

        // Get the gateway ID for the current site
        const gatewayId = this.site?.id || 'auth-1';

        // Route to SKBasedAuthService for skbased-auth-* gateways
        if (this._isSKBasedAuth(gatewayId) && this.skbasedAuthService) {

            // Get proxy config from gateway manager
            let proxyConfig = null;
            if (this.gatewayManager) {
                proxyConfig = this.gatewayManager.getProxyConfig(gatewayId);
            }

            // Get SK/PK keys from gateway config (stored in gateway_configs table)
            let skKey = null;
            let pkKey = null;
            if (this.gatewayManager) {
                const gatewayConfig = this.gatewayManager.getGatewayConfig?.(gatewayId);
                skKey = gatewayConfig?.skKey;
                pkKey = gatewayConfig?.pkKey;
            }

            if (!skKey || !pkKey) {
                const errorResult = {
                    results: [],
                    stats: { live: 0, ccn: 0, declined: 0, errors: cards.length },
                    total: cards.length,
                    liveCount: 0,
                    duration: 0,
                    error: 'SK/PK keys not configured for this gateway',
                    gatewayId
                };
                this.emit('batchComplete', errorResult);
                return errorResult;
            }

            if (!proxyConfig) {
                const errorResult = {
                    results: [],
                    stats: { live: 0, ccn: 0, declined: 0, errors: cards.length },
                    total: cards.length,
                    liveCount: 0,
                    duration: 0,
                    error: 'Proxy not configured for this gateway',
                    gatewayId
                };
                this.emit('batchComplete', errorResult);
                return errorResult;
            }

            // Forward events from SKBasedAuthService
            const forwardResult = async (result) => {
                // Map SK-based auth statuses to auth statuses for consistency
                // LIVE -> APPROVED (valid card, full auth)
                // CCN -> APPROVED (card number valid, CVV wrong - still a valid/live card)
                // DECLINED -> DECLINED
                // ERROR -> ERROR
                const mappedResult = { ...result };
                if (result.status === 'LIVE') {
                    mappedResult.status = 'APPROVED';
                } else if (result.status === 'CCN') {
                    // CCN means card number is valid (live) but CVV is wrong
                    // Treat as APPROVED with CCN indicator in message
                    mappedResult.status = 'APPROVED';
                    mappedResult.message = result.message || 'CCN (Card Valid, CVV Mismatch)';
                    mappedResult.isCCN = true;
                }
                this.emit('result', mappedResult);
                if (onResult) await Promise.resolve(onResult(mappedResult));
            };

            const forwardProgress = (progress) => {
                // Map stats for consistency - CCN counts as approved (live) in auth context
                const mappedProgress = {
                    ...progress,
                    approved: (progress.live || 0) + (progress.ccn || 0),
                    declined: progress.declined || 0,
                    errors: progress.errors || 0
                };
                this.emit('progress', mappedProgress);
                if (onProgress) onProgress(mappedProgress);
            };

            // Process via SKBasedAuthService
            const result = await this.skbasedAuthService.processBatch(cards, {
                skKey,
                pkKey,
                proxy: proxyConfig,
                tier,
                onProgress: forwardProgress,
                onResult: forwardResult
            });

            // Map result stats for consistency - CCN counts as approved (live) in auth context
            const mappedResult = {
                results: result.results,
                stats: {
                    approved: (result.stats?.live || 0) + (result.stats?.ccn || 0),
                    declined: result.stats?.declined || 0,
                    errors: result.stats?.errors || 0
                },
                total: result.total,
                liveCount: (result.stats?.live || 0) + (result.stats?.ccn || 0),
                duration: result.duration,
                gatewayId
            };

            this.emit('complete', mappedResult);
            this.emit('batchComplete', mappedResult);
            return mappedResult;
        }

        // Check gateway availability before processing (Requirement 2.2)
        if (this.gatewayManager) {
            const isAvailable = this.gatewayManager.isAvailable(gatewayId);
            if (!isAvailable) {
                const reason = this.gatewayManager.getUnavailabilityReason(gatewayId);

                // Emit batchComplete to release any locks (Requirement 2.5)
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
                this.validator = new AuthValidator({
                    site: this.site,
                    concurrency: this.concurrency,
                    proxyManager: gatewayProxyManager
                });
                this._currentProxyConfig = proxyConfig;
            } else {
                this.validator = new AuthValidator({
                    site: this.site,
                    concurrency: this.concurrency
                });
                this._currentProxyConfig = null;
            }
        }

        this.abortFlag = false;

        // Update validator concurrency for session pool sizing
        this.concurrency = concurrency;
        this.validator.setConcurrency(concurrency);

        const results = [];
        const total = cards.length;
        let processed = 0;
        const stats = { approved: 0, declined: 0, errors: 0 };
        const startTime = Date.now();

        // Use SpeedManager if available (Requirement 3.1)
        if (this.speedManager) {
            try {
                const executor = await this.speedManager.createExecutor('auth', tier);
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
                    async (execResult, index) => {
                        // Live streaming: emit result immediately as each task completes
                        if (execResult.success) {
                            const result = execResult.result;
                            results.push(result);
                            processed++;

                            if (result.isApproved()) stats.approved++;
                            else if (result.isDeclined()) stats.declined++;
                            else stats.errors++;

                            this.emit('result', result);
                            if (onResult) await Promise.resolve(onResult(result.toJSON ? result.toJSON() : result));
                        } else {
                            const errorResult = AuthResult.error(execResult.error, { card: cards[index] });
                            results.push(errorResult);
                            processed++;
                            stats.errors++;

                            this.emit('result', errorResult);
                            if (onResult) await Promise.resolve(onResult(errorResult.toJSON ? errorResult.toJSON() : errorResult));
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
                    gatewayId: 'auth'
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
                        gatewayId: 'auth'
                    });

                    return { results, stats, total, liveCount, duration: parseFloat(duration), aborted: true };
                }

                // Fall through to legacy processing on other errors

            }
        }

        // SpeedManager is required - throw error if not available
        throw new Error('SpeedManager is required for batch processing');
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

        // Also stop SKBasedAuthService if active
        if (this.skbasedAuthService) {
            this.skbasedAuthService.stopBatch();
        }

        this.emit('abort');
    }
}
