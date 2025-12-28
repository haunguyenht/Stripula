import { SpeedExecutor } from './SpeedExecutor.js';
import { DEFAULT_SPEED_LIMITS, VALID_TIERS } from './SpeedConfigService.js';

/**
 * SpeedManager - Manages speed-limited execution for validation gateways
 * 
 * Creates SpeedExecutor instances with appropriate settings based on
 * gateway and user tier. Provides speed comparison data for UI display.
 * 
 * Requirements: 3.1, 3.4
 */
export class SpeedManager {
    /**
     * Create a new SpeedManager
     * 
     * @param {Object} options - Configuration options
     * @param {Object} options.speedConfigService - SpeedConfigService instance
     */
    constructor(options = {}) {
        this.speedConfigService = options.speedConfigService;
        
        if (!this.speedConfigService) {
            throw new Error('SpeedManager requires speedConfigService');
        }
    }

    /**
     * Create a speed-limited executor for a batch
     * 
     * Requirement 3.1: Retrieves user's tier and creates executor with appropriate limits
     * 
     * @param {string} gatewayId - Gateway ID (auth or charge)
     * @param {string} tier - User tier (free, bronze, silver, gold, diamond)
     * @returns {Promise<SpeedExecutor>} Configured SpeedExecutor instance
     */
    async createExecutor(gatewayId, tier) {
        const settings = await this.getSpeedSettings(gatewayId, tier);
        return new SpeedExecutor(settings.concurrency, settings.delay);
    }

    /**
     * Get current speed settings for display
     * 
     * Requirement 3.4: Returns gateway-specific speed limits
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} tier - User tier
     * @returns {Promise<Object>} Speed settings
     */
    async getSpeedSettings(gatewayId, tier) {
        try {
            const config = await this.speedConfigService.getSpeedConfig(gatewayId, tier);
            return {
                concurrency: config.concurrency,
                delay: config.delay,
                tier: config.tier,
                gatewayId: config.gatewayId,
                isCustom: config.isCustom
            };
        } catch (error) {
            // Fallback to defaults if service fails
            const defaults = DEFAULT_SPEED_LIMITS[tier] || DEFAULT_SPEED_LIMITS.free;
            return {
                concurrency: defaults.concurrency,
                delay: defaults.delay,
                tier: tier || 'free',
                gatewayId,
                isCustom: false
            };
        }
    }

    /**
     * Get speed comparison across all tiers for a gateway
     * 
     * Calculates speed multipliers and estimated times for UI display
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Promise<Array>} Array of tier comparisons
     */
    async getSpeedComparison(gatewayId) {
        try {
            const configs = await this.speedConfigService.getGatewaySpeedConfigs(gatewayId);
            
            // Get free tier as baseline for multiplier calculation
            const freeConfig = configs.find(c => c.tier === 'free') || configs[0];
            const baselineSpeed = this._calculateEffectiveSpeed(freeConfig.concurrency, freeConfig.delay);

            return configs.map(config => {
                const effectiveSpeed = this._calculateEffectiveSpeed(config.concurrency, config.delay);
                const speedMultiplier = baselineSpeed > 0 ? effectiveSpeed / baselineSpeed : 1;
                
                // Estimate time for 100 cards (in seconds)
                // Time = (cards / concurrency) * (taskTime + delay) / 1000
                // Assuming average task time of 500ms
                const avgTaskTimeMs = 500;
                const estimatedTimeFor100Cards = this._estimateTimeForCards(
                    100, 
                    config.concurrency, 
                    config.delay, 
                    avgTaskTimeMs
                );

                return {
                    tier: config.tier,
                    concurrency: config.concurrency,
                    delay: config.delay,
                    speedMultiplier: Math.round(speedMultiplier * 10) / 10,
                    estimatedTimeFor100Cards: Math.round(estimatedTimeFor100Cards),
                    isCustom: config.isCustom
                };
            });
        } catch (error) {
            // Return defaults
            return this._getDefaultComparison(gatewayId);
        }
    }

    /**
     * Calculate effective speed (cards per second) for given settings
     * 
     * @private
     * @param {number} concurrency - Concurrent tasks
     * @param {number} delay - Delay between completions in ms
     * @returns {number} Effective cards per second
     */
    _calculateEffectiveSpeed(concurrency, delay) {
        // Assuming average task time of 500ms
        const avgTaskTimeMs = 500;
        // Effective time per card = (taskTime + delay) / concurrency
        const effectiveTimePerCard = (avgTaskTimeMs + delay) / concurrency;
        // Cards per second = 1000 / effectiveTimePerCard
        return effectiveTimePerCard > 0 ? 1000 / effectiveTimePerCard : 0;
    }

    /**
     * Estimate time to process N cards
     * 
     * @private
     * @param {number} cardCount - Number of cards
     * @param {number} concurrency - Concurrent tasks
     * @param {number} delay - Delay between completions in ms
     * @param {number} avgTaskTimeMs - Average task time in ms
     * @returns {number} Estimated time in seconds
     */
    _estimateTimeForCards(cardCount, concurrency, delay, avgTaskTimeMs) {
        if (cardCount <= 0 || concurrency <= 0) {
            return 0;
        }

        // Number of batches needed
        const batches = Math.ceil(cardCount / concurrency);
        
        // Time per batch = max task time + delay (except last batch)
        const timePerBatch = avgTaskTimeMs + delay;
        
        // Total time = (batches - 1) * timePerBatch + avgTaskTime (last batch no delay)
        const totalTimeMs = (batches - 1) * timePerBatch + avgTaskTimeMs;
        
        return totalTimeMs / 1000;
    }

    /**
     * Get default comparison data when service fails
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @returns {Array} Default tier comparisons
     */
    _getDefaultComparison(gatewayId) {
        const avgTaskTimeMs = 500;
        const freeDefaults = DEFAULT_SPEED_LIMITS.free;
        const baselineSpeed = this._calculateEffectiveSpeed(freeDefaults.concurrency, freeDefaults.delay);

        return VALID_TIERS.map(tier => {
            const defaults = DEFAULT_SPEED_LIMITS[tier];
            const effectiveSpeed = this._calculateEffectiveSpeed(defaults.concurrency, defaults.delay);
            const speedMultiplier = baselineSpeed > 0 ? effectiveSpeed / baselineSpeed : 1;
            const estimatedTimeFor100Cards = this._estimateTimeForCards(
                100,
                defaults.concurrency,
                defaults.delay,
                avgTaskTimeMs
            );

            return {
                tier,
                concurrency: defaults.concurrency,
                delay: defaults.delay,
                speedMultiplier: Math.round(speedMultiplier * 10) / 10,
                estimatedTimeFor100Cards: Math.round(estimatedTimeFor100Cards),
                isCustom: false
            };
        });
    }
}

export default SpeedManager;
