import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';

/**
 * Valid tier names in order from lowest to highest
 */
export const VALID_TIERS = ['free', 'bronze', 'silver', 'gold', 'diamond'];

/**
 * Valid gateway IDs for speed configuration
 * Only 2 types: auth and charge
 * - auth: Auth validation gateways
 * - charge: Charge, Shopify, SKBased, ChargeAVS - all use charge speed config
 */
export const VALID_GATEWAYS = ['auth', 'charge'];

/**
 * Speed mode names for display
 */
export const SPEED_MODE_NAMES = {
    free: 'Slow',
    bronze: 'Normal',
    silver: 'Fast',
    gold: 'Turbo',
    diamond: 'Turbo'
};

/**
 * Speed mode descriptions
 */
export const SPEED_MODE_DESCRIPTIONS = {
    free: 'Slowest but still kills',
    bronze: 'Balanced speed and stability',
    silver: 'High speed checking',
    gold: 'Maximum speed',
    diamond: 'Maximum speed'
};

/**
 * Default speed limits per tier
 * Concurrency: number of simultaneous validations
 * Delay: milliseconds between validation batches
 * 
 * Based on speed modes:
 * - Slow (free): 1 concurrent, 4s delay
 * - Normal (bronze): 2 concurrent, 2s delay
 * - Fast (silver): 3 concurrent, 1s delay
 * - Turbo (gold/diamond): 5 concurrent, 500ms delay
 * 
 * Requirements: 2.1-2.6
 */
export const DEFAULT_SPEED_LIMITS = {
    free:    { concurrency: 1, delay: 4000 },   // Slow
    bronze:  { concurrency: 2, delay: 2000 },   // Normal
    silver:  { concurrency: 3, delay: 1000 },   // Fast
    gold:    { concurrency: 5, delay: 500  },   // Turbo
    diamond: { concurrency: 5, delay: 500  }    // Turbo
};

/**
 * Validation constraints
 * Requirements: 8.1, 8.2
 */
export const VALIDATION_CONSTRAINTS = {
    concurrency: { min: 1, max: 50 },
    delay: { min: 100, max: 10000 }
};

/**
 * Speed Config Service
 * 
 * Manages gateway speed configurations per tier.
 * Provides caching with 1-minute TTL and invalidation on updates.
 * 
 * Requirements: 1.1-1.6, 2.1-2.7, 8.1-8.4
 */
export class SpeedConfigService {
    constructor() {
        // Speed config cache: { [gatewayId]: { [tier]: SpeedConfig } }
        this._cache = null;
        this._cacheTime = null;
        this._cacheExpiryMs = 60000; // 1 minute cache TTL
    }

    /**
     * Get speed config for a specific gateway and tier
     * 
     * Requirements: 1.3, 1.4, 2.1, 2.7
     * 
     * @param {string} gatewayId - Gateway ID (auth or charge)
     * @param {string} tier - User tier (free, bronze, silver, gold, diamond)
     * @returns {Promise<Object>} Speed configuration
     */
    async getSpeedConfig(gatewayId, tier) {
        // Validate inputs
        if (!gatewayId || !VALID_GATEWAYS.includes(gatewayId)) {
            throw new Error(`Invalid gateway ID: ${gatewayId}`);
        }
        if (!tier || !VALID_TIERS.includes(tier)) {
            throw new Error(`Invalid tier: ${tier}`);
        }

        // Try cache first
        const cached = this._getCachedConfig(gatewayId, tier);
        if (cached) {
            return cached;
        }

        // If database not configured, return defaults
        if (!isSupabaseConfigured()) {
            return this._getDefaultConfig(gatewayId, tier);
        }

        // Fetch from database
        const { data: config, error } = await supabase
            .from('gateway_speed_configs')
            .select('*')
            .eq('gateway_id', gatewayId)
            .eq('tier', tier)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found - return default
                return this._getDefaultConfig(gatewayId, tier);
            }

            return this._getDefaultConfig(gatewayId, tier);
        }

        // Update cache
        this._updateCacheEntry(config);

        return this._formatConfig(config);
    }

    /**
     * Get all speed configs for a gateway (all tiers)
     * 
     * Requirements: 1.3, 2.7
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Promise<Array>} Array of speed configs for all tiers
     */
    async getGatewaySpeedConfigs(gatewayId) {
        if (!gatewayId || !VALID_GATEWAYS.includes(gatewayId)) {
            throw new Error(`Invalid gateway ID: ${gatewayId}`);
        }

        // If database not configured, return defaults
        if (!isSupabaseConfigured()) {
            return VALID_TIERS.map(tier => this._getDefaultConfig(gatewayId, tier));
        }

        // Try to use cache
        const cachedConfigs = this._getCachedGatewayConfigs(gatewayId);
        if (cachedConfigs) {
            return cachedConfigs;
        }

        // Fetch from database
        const { data: configs, error } = await supabase
            .from('gateway_speed_configs')
            .select('*')
            .eq('gateway_id', gatewayId)
            .order('tier');

        if (error) {

            return VALID_TIERS.map(tier => this._getDefaultConfig(gatewayId, tier));
        }

        // Build result with defaults for missing tiers
        const configMap = new Map(configs.map(c => [c.tier, c]));
        const result = VALID_TIERS.map(tier => {
            const config = configMap.get(tier);
            if (config) {
                this._updateCacheEntry(config);
                return this._formatConfig(config);
            }
            return this._getDefaultConfig(gatewayId, tier);
        });

        return result;
    }

    /**
     * Get all speed configs in matrix format (admin view)
     * 
     * Requirements: 1.6
     * 
     * @returns {Promise<Object>} Speed config matrix
     */
    async getAllSpeedConfigs() {
        // If database not configured, return defaults
        if (!isSupabaseConfigured()) {
            return this._getDefaultMatrix();
        }

        // Try to refresh cache
        await this._refreshCache();

        // Build matrix from cache or defaults
        const configs = {};
        for (const gatewayId of VALID_GATEWAYS) {
            configs[gatewayId] = {};
            for (const tier of VALID_TIERS) {
                const cached = this._getCachedConfig(gatewayId, tier);
                configs[gatewayId][tier] = cached || this._getDefaultConfig(gatewayId, tier);
            }
        }

        return {
            gateways: VALID_GATEWAYS,
            tiers: VALID_TIERS,
            configs
        };
    }


    /**
     * Update speed config for a gateway and tier (admin only)
     * 
     * Requirements: 1.1, 1.2, 1.5
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} tier - User tier
     * @param {Object} config - Config updates { concurrency?, delay? }
     * @returns {Promise<Object>} Updated speed config
     */
    async updateSpeedConfig(gatewayId, tier, config) {
        // Validate inputs
        if (!gatewayId || !VALID_GATEWAYS.includes(gatewayId)) {
            throw new Error(`Invalid gateway ID: ${gatewayId}`);
        }
        if (!tier || !VALID_TIERS.includes(tier)) {
            throw new Error(`Invalid tier: ${tier}`);
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Validate the config values
        const validation = this.validateSpeedConfig(config);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Build update data
        const updateData = {
            updated_at: new Date().toISOString(),
            is_custom: true
        };

        if (config.concurrency !== undefined) {
            updateData.concurrency = config.concurrency;
        }
        if (config.delay !== undefined) {
            updateData.delay = config.delay;
        }

        // Validate tier ordering if updating
        const orderingValidation = await this._validateTierOrdering(gatewayId, tier, updateData);
        if (!orderingValidation.valid) {
            throw new Error(orderingValidation.error);
        }

        // Update in database
        const { data: updated, error } = await supabase
            .from('gateway_speed_configs')
            .update(updateData)
            .eq('gateway_id', gatewayId)
            .eq('tier', tier)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to update speed config: ${error.message}`);
        }

        // Invalidate cache so new config applies immediately (Requirement 1.5)
        this.invalidateCache();

        return this._formatConfig(updated);
    }

    /**
     * Reset speed configs to defaults
     * 
     * Requirements: 1.1, 1.2
     * 
     * @param {string} gatewayId - Optional gateway ID (resets all if not provided)
     * @returns {Promise<void>}
     */
    async resetToDefaults(gatewayId = null) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Validate gateway if provided
        if (gatewayId && !VALID_GATEWAYS.includes(gatewayId)) {
            throw new Error(`Invalid gateway ID: ${gatewayId}`);
        }

        const gatewaysToReset = gatewayId ? [gatewayId] : VALID_GATEWAYS;

        for (const gw of gatewaysToReset) {
            for (const tier of VALID_TIERS) {
                const defaults = DEFAULT_SPEED_LIMITS[tier];
                
                const { error } = await supabase
                    .from('gateway_speed_configs')
                    .update({
                        concurrency: defaults.concurrency,
                        delay: defaults.delay,
                        is_custom: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('gateway_id', gw)
                    .eq('tier', tier);

                if (error) {

                }
            }
        }

        // Invalidate cache
        this.invalidateCache();
    }

    /**
     * Validate speed config values
     * 
     * Requirements: 8.1, 8.2, 8.4
     * 
     * @param {Object} config - Config to validate { concurrency?, delay? }
     * @returns {Object} Validation result { valid: boolean, error?: string }
     */
    validateSpeedConfig(config) {
        if (!config || typeof config !== 'object') {
            return { valid: false, error: 'Config must be an object' };
        }

        // Check if at least one field is provided
        if (config.concurrency === undefined && config.delay === undefined) {
            return { valid: false, error: 'At least one of concurrency or delay must be provided' };
        }

        // Validate concurrency (Requirement 8.1)
        if (config.concurrency !== undefined) {
            if (typeof config.concurrency !== 'number' || !Number.isInteger(config.concurrency)) {
                return { valid: false, error: 'Concurrency must be an integer' };
            }
            if (config.concurrency < VALIDATION_CONSTRAINTS.concurrency.min || 
                config.concurrency > VALIDATION_CONSTRAINTS.concurrency.max) {
                return { 
                    valid: false, 
                    error: `Concurrency must be between ${VALIDATION_CONSTRAINTS.concurrency.min} and ${VALIDATION_CONSTRAINTS.concurrency.max}` 
                };
            }
        }

        // Validate delay (Requirement 8.2)
        if (config.delay !== undefined) {
            if (typeof config.delay !== 'number' || !Number.isInteger(config.delay)) {
                return { valid: false, error: 'Delay must be an integer' };
            }
            if (config.delay < VALIDATION_CONSTRAINTS.delay.min || 
                config.delay > VALIDATION_CONSTRAINTS.delay.max) {
                return { 
                    valid: false, 
                    error: `Delay must be between ${VALIDATION_CONSTRAINTS.delay.min}ms and ${VALIDATION_CONSTRAINTS.delay.max}ms` 
                };
            }
        }

        return { valid: true };
    }

    /**
     * Validate tier ordering invariant
     * Higher tiers must have >= concurrency and <= delay than lower tiers
     * 
     * Requirement: 8.3
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} tier - Tier being updated
     * @param {Object} newValues - New values { concurrency?, delay? }
     * @returns {Promise<Object>} Validation result { valid: boolean, error?: string }
     */
    async _validateTierOrdering(gatewayId, tier, newValues) {
        // Get all configs for this gateway
        const configs = await this.getGatewaySpeedConfigs(gatewayId);
        
        // Build a map with the proposed update
        const configMap = new Map();
        for (const config of configs) {
            if (config.tier === tier) {
                // Apply proposed changes
                configMap.set(tier, {
                    concurrency: newValues.concurrency !== undefined ? newValues.concurrency : config.concurrency,
                    delay: newValues.delay !== undefined ? newValues.delay : config.delay
                });
            } else {
                configMap.set(config.tier, {
                    concurrency: config.concurrency,
                    delay: config.delay
                });
            }
        }

        // Validate ordering: each tier should have >= concurrency and <= delay than previous
        for (let i = 1; i < VALID_TIERS.length; i++) {
            const lowerTier = VALID_TIERS[i - 1];
            const higherTier = VALID_TIERS[i];
            
            const lowerConfig = configMap.get(lowerTier);
            const higherConfig = configMap.get(higherTier);

            if (!lowerConfig || !higherConfig) continue;

            // Higher tier must have >= concurrency
            if (higherConfig.concurrency < lowerConfig.concurrency) {
                return {
                    valid: false,
                    error: `${higherTier} tier must have concurrency >= ${lowerTier} tier (${lowerConfig.concurrency})`
                };
            }

            // Higher tier must have <= delay
            if (higherConfig.delay > lowerConfig.delay) {
                return {
                    valid: false,
                    error: `${higherTier} tier must have delay <= ${lowerTier} tier (${lowerConfig.delay}ms)`
                };
            }
        }

        return { valid: true };
    }

    /**
     * Invalidate the speed config cache
     * Called when configs are updated to ensure new settings apply immediately
     * 
     * Requirement: 1.5
     */
    invalidateCache() {
        this._cache = null;
        this._cacheTime = null;
    }


    // ============================================================
    // PRIVATE CACHE METHODS
    // ============================================================

    /**
     * Get a specific config from cache
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @param {string} tier - Tier name
     * @returns {Object|null} Cached config or null if cache miss
     */
    _getCachedConfig(gatewayId, tier) {
        if (!this._cache || !this._cacheTime) {
            return null;
        }

        const now = Date.now();
        if (now - this._cacheTime > this._cacheExpiryMs) {
            // Cache expired
            this._cache = null;
            this._cacheTime = null;
            return null;
        }

        return this._cache[gatewayId]?.[tier] || null;
    }

    /**
     * Get all configs for a gateway from cache
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @returns {Array|null} Cached configs or null if cache miss
     */
    _getCachedGatewayConfigs(gatewayId) {
        if (!this._cache || !this._cacheTime) {
            return null;
        }

        const now = Date.now();
        if (now - this._cacheTime > this._cacheExpiryMs) {
            this._cache = null;
            this._cacheTime = null;
            return null;
        }

        const gatewayCache = this._cache[gatewayId];
        if (!gatewayCache) {
            return null;
        }

        // Check if we have all tiers cached
        const hasAllTiers = VALID_TIERS.every(tier => gatewayCache[tier]);
        if (!hasAllTiers) {
            return null;
        }

        return VALID_TIERS.map(tier => gatewayCache[tier]);
    }

    /**
     * Update a single entry in the cache
     * 
     * @private
     * @param {Object} config - Database config row
     */
    _updateCacheEntry(config) {
        if (!config || !config.gateway_id || !config.tier) {
            return;
        }

        if (!this._cache) {
            this._cache = {};
            this._cacheTime = Date.now();
        }

        if (!this._cache[config.gateway_id]) {
            this._cache[config.gateway_id] = {};
        }

        this._cache[config.gateway_id][config.tier] = this._formatConfig(config);
    }

    /**
     * Refresh the entire cache from database
     * 
     * @private
     * @returns {Promise<void>}
     */
    async _refreshCache() {
        if (!isSupabaseConfigured()) {
            return;
        }

        const { data: configs, error } = await supabase
            .from('gateway_speed_configs')
            .select('*');

        if (error) {

            return;
        }

        this._cache = {};
        for (const config of (configs || [])) {
            if (!this._cache[config.gateway_id]) {
                this._cache[config.gateway_id] = {};
            }
            this._cache[config.gateway_id][config.tier] = this._formatConfig(config);
        }
        this._cacheTime = Date.now();
    }

    // ============================================================
    // PRIVATE HELPER METHODS
    // ============================================================

    /**
     * Format database config row to API response format
     * 
     * @private
     * @param {Object} config - Database config row
     * @returns {Object} Formatted config
     */
    _formatConfig(config) {
        return {
            gatewayId: config.gateway_id,
            tier: config.tier,
            concurrency: config.concurrency,
            delay: config.delay,
            isCustom: config.is_custom || false,
            updatedAt: config.updated_at || null
        };
    }

    /**
     * Get default config for a gateway and tier
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @param {string} tier - Tier name
     * @returns {Object} Default config
     */
    _getDefaultConfig(gatewayId, tier) {
        const defaults = DEFAULT_SPEED_LIMITS[tier] || DEFAULT_SPEED_LIMITS.free;
        return {
            gatewayId,
            tier,
            concurrency: defaults.concurrency,
            delay: defaults.delay,
            isCustom: false,
            updatedAt: null
        };
    }

    /**
     * Get default matrix for all gateways and tiers
     * 
     * @private
     * @returns {Object} Default config matrix
     */
    _getDefaultMatrix() {
        const configs = {};
        for (const gatewayId of VALID_GATEWAYS) {
            configs[gatewayId] = {};
            for (const tier of VALID_TIERS) {
                configs[gatewayId][tier] = this._getDefaultConfig(gatewayId, tier);
            }
        }

        return {
            gateways: VALID_GATEWAYS,
            tiers: VALID_TIERS,
            configs
        };
    }
}

export default SpeedConfigService;
