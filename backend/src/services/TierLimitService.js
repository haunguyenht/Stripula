import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';

/**
 * Valid tier names in order from lowest to highest
 */
export const VALID_TIERS = ['free', 'bronze', 'silver', 'gold', 'diamond'];

/**
 * Default card limits per tier
 * Requirements: 1.1
 */
export const DEFAULT_TIER_LIMITS = {
    free: 500,
    bronze: 1000,
    silver: 1500,
    gold: 2000,
    diamond: 3000
};

/**
 * Tier limit validation bounds
 * Requirements: 7.6
 */
export const TIER_LIMIT_BOUNDS = {
    MIN: 100,
    MAX: 10000
};

/**
 * Tier Limit Service
 * 
 * Manages tier-based card input limits.
 * Provides caching with invalidation on updates.
 * 
 * Requirements: 1.1, 7.2, 7.3, 7.6
 */
export class TierLimitService {
    constructor(options = {}) {
        // Tier limits cache: { [tier]: { limit, updatedAt, isCustom } }
        this._cache = null;
        this._cacheTime = null;
        this._cacheExpiryMs = 60000; // 1 minute cache TTL
        
        // Gateway manager for SSE broadcasts
        this.gatewayManager = options.gatewayManager || null;
    }

    /**
     * Get all tier limits
     * 
     * Requirements: 1.1, 7.3
     * 
     * @returns {Promise<Object>} Tier limits with metadata
     */
    async getTierLimits() {
        // Try cache first
        const cached = this._getCachedLimits();
        if (cached) {
            return cached;
        }

        // If database not configured, return defaults
        if (!isSupabaseConfigured()) {
            return this._getDefaultLimitsResponse();
        }

        // Fetch from database
        const { data: limits, error } = await supabase
            .from('tier_card_limits')
            .select('*')
            .order('tier');

        if (error) {
            return this._getDefaultLimitsResponse();
        }

        // Build response with defaults for missing tiers
        const result = this._buildLimitsResponse(limits || []);
        
        // Update cache
        this._updateCache(result);

        return result;
    }

    /**
     * Get limit for a specific tier
     * 
     * Requirements: 1.1
     * 
     * @param {string} tier - User tier
     * @returns {Promise<number>} Card limit for the tier
     */
    async getTierLimit(tier) {
        if (!tier || !VALID_TIERS.includes(tier.toLowerCase())) {
            throw new Error(`Invalid tier: ${tier}`);
        }

        const normalizedTier = tier.toLowerCase();
        const limits = await this.getTierLimits();
        return limits.limits[normalizedTier] || DEFAULT_TIER_LIMITS[normalizedTier];
    }

    /**
     * Update limit for a specific tier (admin only)
     * 
     * Requirements: 7.2, 7.3, 7.6
     * 
     * @param {string} tier - Tier to update
     * @param {number} limit - New card limit
     * @param {string} adminId - Admin user ID making the change
     * @returns {Promise<Object>} Result with old and new limit
     */
    async updateTierLimit(tier, limit, adminId) {
        // Validate tier
        if (!tier || !VALID_TIERS.includes(tier.toLowerCase())) {
            throw new Error(`Invalid tier: ${tier}. Must be one of: ${VALID_TIERS.join(', ')}`);
        }

        // Validate limit is a number
        if (typeof limit !== 'number' || !Number.isInteger(limit)) {
            throw new Error('Limit must be an integer');
        }

        // Validate limit bounds (Requirement 7.6)
        if (limit < TIER_LIMIT_BOUNDS.MIN || limit > TIER_LIMIT_BOUNDS.MAX) {
            throw new Error(`Limit must be between ${TIER_LIMIT_BOUNDS.MIN} and ${TIER_LIMIT_BOUNDS.MAX}`);
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const normalizedTier = tier.toLowerCase();

        // Get current limit
        const currentLimits = await this.getTierLimits();
        const oldLimit = currentLimits.limits[normalizedTier] || DEFAULT_TIER_LIMITS[normalizedTier];

        // Update in database
        const { data: updated, error } = await supabase
            .from('tier_card_limits')
            .upsert({
                tier: normalizedTier,
                card_limit: limit,
                updated_at: new Date().toISOString(),
                updated_by: adminId || null
            }, {
                onConflict: 'tier'
            })
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to update tier limit: ${error.message}`);
        }

        // Invalidate cache
        this.invalidateCache();

        // Broadcast SSE event
        this._broadcastTierLimitChange(normalizedTier, oldLimit, limit);

        return {
            success: true,
            tier: normalizedTier,
            oldLimit,
            newLimit: limit,
            defaultLimit: DEFAULT_TIER_LIMITS[normalizedTier],
            isCustom: limit !== DEFAULT_TIER_LIMITS[normalizedTier],
            updatedAt: updated.updated_at
        };
    }


    /**
     * Reset all tier limits to defaults (admin only)
     * 
     * Requirements: 7.5
     * 
     * @param {string} adminId - Admin user ID making the change
     * @returns {Promise<Object>} Result with reset limits
     */
    async resetToDefaults(adminId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Get current limits before reset
        const currentLimits = await this.getTierLimits();
        const oldLimits = { ...currentLimits.limits };

        // Reset each tier to default
        for (const tier of VALID_TIERS) {
            const defaultLimit = DEFAULT_TIER_LIMITS[tier];
            
            const { error } = await supabase
                .from('tier_card_limits')
                .upsert({
                    tier,
                    card_limit: defaultLimit,
                    updated_at: new Date().toISOString(),
                    updated_by: adminId || null
                }, {
                    onConflict: 'tier'
                });

            if (error) {
            }
        }

        // Invalidate cache
        this.invalidateCache();

        // Broadcast SSE event for reset
        this._broadcastTierLimitsReset(oldLimits, DEFAULT_TIER_LIMITS);

        return {
            success: true,
            oldLimits,
            newLimits: { ...DEFAULT_TIER_LIMITS },
            defaults: { ...DEFAULT_TIER_LIMITS }
        };
    }

    /**
     * Validate a limit value
     * 
     * Requirements: 7.6
     * 
     * @param {number} limit - Limit to validate
     * @returns {Object} Validation result { valid: boolean, error?: string }
     */
    validateLimit(limit) {
        if (typeof limit !== 'number') {
            return { valid: false, error: 'Limit must be a number' };
        }

        if (!Number.isInteger(limit)) {
            return { valid: false, error: 'Limit must be an integer' };
        }

        if (limit < TIER_LIMIT_BOUNDS.MIN || limit > TIER_LIMIT_BOUNDS.MAX) {
            return { 
                valid: false, 
                error: `Limit must be between ${TIER_LIMIT_BOUNDS.MIN} and ${TIER_LIMIT_BOUNDS.MAX}` 
            };
        }

        return { valid: true };
    }

    /**
     * Check if a card count is within the tier limit
     * 
     * Requirements: 1.2, 1.3
     * 
     * @param {number} cardCount - Number of cards
     * @param {string} tier - User tier
     * @returns {Promise<Object>} { isWithinLimit, limit, cardCount, excess }
     */
    async isWithinLimit(cardCount, tier) {
        const limit = await this.getTierLimit(tier);
        const isWithinLimit = cardCount <= limit;
        
        return {
            isWithinLimit,
            limit,
            cardCount,
            excess: isWithinLimit ? 0 : cardCount - limit
        };
    }

    /**
     * Invalidate the tier limits cache
     */
    invalidateCache() {
        this._cache = null;
        this._cacheTime = null;
    }

    // ============================================================
    // PRIVATE CACHE METHODS
    // ============================================================

    /**
     * Get cached limits if valid
     * 
     * @private
     * @returns {Object|null} Cached limits or null if expired
     */
    _getCachedLimits() {
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

        return this._cache;
    }

    /**
     * Update cache with new limits
     * 
     * @private
     * @param {Object} limits - Limits response to cache
     */
    _updateCache(limits) {
        this._cache = limits;
        this._cacheTime = Date.now();
    }

    /**
     * Build limits response from database rows
     * 
     * @private
     * @param {Array} rows - Database rows
     * @returns {Object} Formatted limits response
     */
    _buildLimitsResponse(rows) {
        const limitsMap = new Map(rows.map(r => [r.tier, r]));
        
        const limits = {};
        const metadata = {};

        for (const tier of VALID_TIERS) {
            const row = limitsMap.get(tier);
            if (row) {
                limits[tier] = row.card_limit;
                metadata[tier] = {
                    isCustom: row.card_limit !== DEFAULT_TIER_LIMITS[tier],
                    updatedAt: row.updated_at,
                    updatedBy: row.updated_by
                };
            } else {
                limits[tier] = DEFAULT_TIER_LIMITS[tier];
                metadata[tier] = {
                    isCustom: false,
                    updatedAt: null,
                    updatedBy: null
                };
            }
        }

        return {
            limits,
            defaults: { ...DEFAULT_TIER_LIMITS },
            metadata
        };
    }

    /**
     * Get default limits response (used when database not available)
     * 
     * @private
     * @returns {Object} Default limits response
     */
    _getDefaultLimitsResponse() {
        const metadata = {};
        for (const tier of VALID_TIERS) {
            metadata[tier] = {
                isCustom: false,
                updatedAt: null,
                updatedBy: null
            };
        }

        return {
            limits: { ...DEFAULT_TIER_LIMITS },
            defaults: { ...DEFAULT_TIER_LIMITS },
            metadata
        };
    }

    // ============================================================
    // PRIVATE SSE BROADCAST METHODS
    // ============================================================

    /**
     * Broadcast tier limit change via SSE
     * 
     * @private
     * @param {string} tier - Tier that changed
     * @param {number} oldLimit - Previous limit
     * @param {number} newLimit - New limit
     */
    _broadcastTierLimitChange(tier, oldLimit, newLimit) {
        if (!this.gatewayManager) {
            return;
        }

        this.gatewayManager.broadcast({
            type: 'tierLimitChange',
            tier,
            oldLimit,
            newLimit,
            isCustom: newLimit !== DEFAULT_TIER_LIMITS[tier],
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Broadcast tier limits reset via SSE
     * 
     * @private
     * @param {Object} oldLimits - Previous limits
     * @param {Object} newLimits - New (default) limits
     */
    _broadcastTierLimitsReset(oldLimits, newLimits) {
        if (!this.gatewayManager) {
            return;
        }

        this.gatewayManager.broadcast({
            type: 'tierLimitsReset',
            oldLimits,
            newLimits,
            timestamp: new Date().toISOString()
        });
    }
}

export default TierLimitService;
