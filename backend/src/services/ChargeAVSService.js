import { EventEmitter } from 'events';
import { ChargeAVSValidator } from '../validators/ChargeAVSValidator.js';
import { ChargeResult } from '../domain/ChargeResult.js';
import { CHARGE_AVS_SITES, DEFAULT_CHARGE_AVS_SITE } from '../utils/constants.js';

/**
 * Charge AVS Service
 * Handles batch card validation via Qgiv with AVS (Address Verification)
 * Requires card format: number|mm|yy|cvv|zip
 */
export class ChargeAVSService extends EventEmitter {
    constructor(options = {}) {
        super();
        this.site = options.site || DEFAULT_CHARGE_AVS_SITE;
        this.validator = new ChargeAVSValidator({ site: this.site });
        this.speedManager = options.speedManager || null;
        this.gatewayManager = options.gatewayManager || null;
        this.dashboardService = options.dashboardService || null;
        this.binLookupClient = options.binLookupClient || null;
        this.telegramBotService = options.telegramBotService || null;
        this.proxyManager = null;
        this.isRunning = false;
        this.shouldStop = false;
    }

    getAvailableSites() {
        return Object.values(CHARGE_AVS_SITES).map(site => ({
            id: site.id,
            label: site.label,
            chargeAmount: site.chargeAmount || null
        }));
    }

    setSite(siteId) {
        const site = Object.values(CHARGE_AVS_SITES).find(s => s.id === siteId);
        if (site) {
            this.site = site;
            this.validator = new ChargeAVSValidator({ 
                site,
                proxyManager: this.proxyManager
            });
        }
    }

    /**
     * Create a proxy manager wrapper for gateway-specific proxy config
     */
    _createProxyManagerWrapper(gatewayId) {
        if (!this.gatewayManager) return null;

        const self = this;
        return {
            isEnabled() {
                const proxyConfig = self.gatewayManager.getProxyConfig(gatewayId);
                return !!(proxyConfig && proxyConfig.host && proxyConfig.port);
            },
            async getNextProxy() {
                const proxyConfig = self.gatewayManager.getProxyConfig(gatewayId);
                if (!proxyConfig) return null;
                return {
                    host: proxyConfig.host,
                    port: proxyConfig.port,
                    username: proxyConfig.username,
                    password: proxyConfig.password,
                    type: proxyConfig.type || 'http'
                };
            }
        };
    }

    stop() {
        this.shouldStop = true;
        this.isRunning = false;
    }

    async processBatch(cards, options = {}) {
        const { 
            concurrency = 1, 
            siteId, 
            onResult, 
            onProgress,
            userId,
            userTier = 'free'
        } = options;

        // Set site if provided
        if (siteId) {
            this.setSite(siteId);
        }

        const gatewayId = this.site?.id || 'charge-avs-1';

        // Check gateway availability
        if (this.gatewayManager) {
            const isAvailable = this.gatewayManager.isAvailable(gatewayId);
            if (!isAvailable) {
                const reason = this.gatewayManager.getUnavailabilityReason(gatewayId);
                this.emit('batchComplete', {
                    results: [],
                    stats: { approved: 0, declined: 0, errors: 0 },
                    unavailable: true,
                    unavailableReason: reason,
                    gatewayId
                });
                return { unavailable: true, unavailableReason: reason };
            }
        }

        // Create proxy manager wrapper for this gateway
        this.proxyManager = this._createProxyManagerWrapper(gatewayId);
        
        // Reinitialize validator with proxy manager
        this.validator = new ChargeAVSValidator({
            site: this.site,
            proxyManager: this.proxyManager
        });

        this.isRunning = true;
        this.shouldStop = false;

        const results = [];
        const stats = { approved: 0, threeDS: 0, declined: 0, errors: 0 };
        let processed = 0;
        const total = cards.length;

        this.emit('start', { total });

        // Get speed executor
        let executor = null;
        if (this.speedManager) {
            executor = await this.speedManager.createExecutor('charge', userTier);
        }

        // Create validation tasks
        const tasks = cards.map((card, index) => async () => {
            if (this.shouldStop) {
                return { skipped: true, index };
            }

            const startTime = Date.now();
            try {
                const result = await this.validator.validate(card);
                result.duration = Date.now() - startTime;
                result.index = index;

                // Fetch BIN data for approved/live cards
                if ((result.isApproved() || result.status === '3DS_REQUIRED') && this.binLookupClient) {
                    try {
                        const binData = await this.binLookupClient.lookup(card.number);
                        if (binData) {
                            result.binData = binData;
                            result.brand = binData.brand;
                            result.country = binData.country;
                        }
                    } catch (e) {
                        // Ignore BIN lookup errors
                    }
                }

                return { success: true, result, index };
            } catch (error) {
                const errorResult = ChargeResult.error(error.message, {
                    card: `${card.number}|${card.expMonth}|${card.expYear}|${card.cvc}${card.zip ? '|' + card.zip : ''}`,
                    site: this.site.label,
                    duration: Date.now() - startTime
                });
                errorResult.index = index;
                return { success: false, result: errorResult, index };
            }
        });

        // Execute with speed limits
        if (executor) {
            await executor.executeBatch(
                tasks,
                (completed, totalTasks) => {
                    this.emit('progress', { processed: completed, total: totalTasks, ...stats });
                },
                (execResult, index) => {
                    if (execResult.skipped) return;

                    const result = execResult.result;
                    results.push(result);
                    processed++;

                    // Update stats
                    if (result.isApproved()) {
                        stats.approved++;
                    } else if (result.status === '3DS_REQUIRED') {
                        stats.threeDS++;
                    } else if (result.isDeclined()) {
                        stats.declined++;
                    } else {
                        stats.errors++;
                    }

                    // Record health metrics
                    if (this.gatewayManager) {
                        if (result.isApproved() || result.isDeclined() || result.status === '3DS_REQUIRED') {
                            this.gatewayManager.recordSuccess(gatewayId, result.duration);
                        } else if (result.status === 'ERROR') {
                            this.gatewayManager.recordFailure(gatewayId, result.message);
                        }
                    }

                    this.emit('result', result);
                    if (onResult) onResult(result.toJSON ? result.toJSON() : result);
                    if (onProgress) onProgress({ processed, total, ...stats });
                }
            );
        } else {
            // Fallback: sequential processing
            for (const task of tasks) {
                if (this.shouldStop) break;
                const execResult = await task();
                if (!execResult.skipped) {
                    const result = execResult.result;
                    results.push(result);
                    processed++;

                    if (result.isApproved()) stats.approved++;
                    else if (result.status === '3DS_REQUIRED') stats.threeDS++;
                    else if (result.isDeclined()) stats.declined++;
                    else stats.errors++;

                    this.emit('result', result);
                    if (onResult) onResult(result.toJSON ? result.toJSON() : result);
                    if (onProgress) onProgress({ processed, total, ...stats });
                }
            }
        }

        this.isRunning = false;

        // Update dashboard stats
        if (this.dashboardService && userId) {
            const hitsCount = stats.approved + stats.threeDS;
            await this.dashboardService.incrementUserStats(userId, results.length, hitsCount).catch(() => {});
        }

        this.emit('batchComplete', { results, stats });
        return { results, stats };
    }
}

export default ChargeAVSService;
