import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';
import { GATEWAY_TYPES, getGatewayTypeInfo } from '../utils/constants.js';

/**
 * Default pricing config for gateways
 * Pricing: approved (charged cards), live (validated cards), dead/error (free)
 * Single fixed values, not ranges
 */
export const DEFAULT_GATEWAY_PRICING = {
    approved: 5,  // Credits for APPROVED cards
    live: 3,      // Credits for LIVE cards
    dead: 0,
    error: 0,
    captcha: 0
};

/**
 * Default gateway rates by sub-type
 * Hierarchy: STRIPE (auth, charge, skbased-auth, skbased) | SHOPIFY
 */
export const DEFAULT_GATEWAY_RATES = {
    // Stripe sub-types
    auth: {
        rate: 1.0,
        name: 'Auth Gateway',
        description: 'WooCommerce SetupIntent validation',
        parentType: 'stripe',
        subType: 'auth',
        pricing: DEFAULT_GATEWAY_PRICING
    },
    charge: {
        rate: 3.0,
        name: 'Charge Gateway',
        description: 'PK-based charge validation',
        parentType: 'stripe',
        subType: 'charge',
        pricing: DEFAULT_GATEWAY_PRICING
    },
    'skbased-auth': {
        rate: 2.0,
        name: 'SK Auth Gateway',
        description: 'SK-based SetupIntent $0 authorization',
        parentType: 'stripe',
        subType: 'skbased-auth',
        pricing: DEFAULT_GATEWAY_PRICING
    },
    skbased: {
        rate: 3.0,
        name: 'SK Charge Gateway',
        description: 'SK-based charge with refund validation',
        parentType: 'stripe',
        subType: 'skbased',
        pricing: DEFAULT_GATEWAY_PRICING
    },
    // Shopify (no sub-type)
    shopify: {
        rate: 2.0,
        name: 'Shopify Gateway',
        description: 'Shopify checkout validation',
        parentType: 'shopify',
        subType: null,
        pricing: DEFAULT_GATEWAY_PRICING
    }
};

/**
 * Credit rate validation constants
 * Requirements: 2.2, 5.5
 */
export const CREDIT_RATE_LIMITS = {
    MIN: 0.1,
    MAX: 100.0
};

/**
 * Audit action types for credit rate changes
 * Requirements: 10.1, 10.4
 */
export const CREDIT_RATE_AUDIT_ACTIONS = {
    CHANGE: 'credit_rate_change',
    RESET: 'credit_rate_reset'
};

/**
 * Valid tier values in hierarchy order (lowest to highest)
 * Used for tier restriction validation
 */
export const TIER_HIERARCHY = ['free', 'bronze', 'silver', 'gold', 'diamond'];

/**
 * Get tier level (index) for comparison
 * @param {string} tier - Tier name
 * @returns {number} Tier level (0-4), -1 if invalid
 */
export function getTierLevel(tier) {
    if (!tier) return -1;
    return TIER_HIERARCHY.indexOf(tier.toLowerCase());
}

/**
 * Check if a user tier meets the minimum tier requirement
 * @param {string} userTier - User's tier
 * @param {string} minTier - Minimum required tier (null = all allowed)
 * @returns {boolean} True if user has access
 */
export function canTierAccess(userTier, minTier) {
    if (!minTier) return true; // No restriction
    const userLevel = getTierLevel(userTier);
    const minLevel = getTierLevel(minTier);
    if (userLevel === -1 || minLevel === -1) return false;
    return userLevel >= minLevel;
}

/**
 * Gateway Config Service
 * 
 * Manages gateway credit rates and configurations.
 * Provides caching with invalidation on updates.
 * 
 * Requirements: 5.1, 5.3, 5.4, 5.5
 */
export class GatewayConfigService {
    constructor(options = {}) {
        // Gateway config cache
        this._cache = null;
        this._cacheTime = null;
        this._cacheExpiryMs = 60000; // 1 minute cache TTL

        // Gateway manager for SSE broadcasts (Requirement 14.1)
        this.gatewayManager = options.gatewayManager || null;
    }

    /**
     * Get all active gateway configurations
     * 
     * Requirement: 5.1
     * 
     * @returns {Promise<Array>} Array of active gateway configs
     */
    async getActiveGateways() {
        if (!isSupabaseConfigured()) {
            // Return defaults if database not configured
            return this._getDefaultGateways();
        }

        // Try to use cache first
        const cached = this._getCachedGateways();
        if (cached) {
            return cached.filter(g => g.is_active);
        }

        // Fetch from database
        const { data: configs, error } = await supabase
            .from('gateway_configs')
            .select('*')
            .eq('is_active', true)
            .order('gateway_id');

        if (error) {

            // Return defaults on error
            return this._getDefaultGateways();
        }

        // Update cache with all configs (we'll filter for active)
        await this._refreshCache();

        return configs || [];
    }

    /**
     * Get a specific gateway configuration
     * 
     * Requirement: 5.1
     * 
     * @param {string} gatewayId - Gateway ID (e.g., 'auth', 'charge', 'shopify')
     * @returns {Promise<Object|null>} Gateway config or null if not found
     */
    async getGateway(gatewayId) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        if (!isSupabaseConfigured()) {
            // Return default if database not configured
            return this._getDefaultGateway(gatewayId);
        }

        // Try cache first
        const cached = this._getCachedGateway(gatewayId);
        if (cached !== undefined) {
            return cached;
        }

        // Fetch from database
        const { data: config, error } = await supabase
            .from('gateway_configs')
            .select('*')
            .eq('gateway_id', gatewayId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found - return default if available
                return this._getDefaultGateway(gatewayId);
            }

            return this._getDefaultGateway(gatewayId);
        }

        // Update cache
        this._updateCacheEntry(config);

        return config;
    }


    /**
     * Update a gateway configuration (admin only)
     * 
     * Requirements: 5.3, 5.4
     * 
     * @param {string} gatewayId - Gateway ID to update
     * @param {Object} updates - Fields to update
     * @param {number} updates.base_credit_rate - New credit rate
     * @param {boolean} updates.is_active - Whether gateway is active
     * @param {string} updates.gateway_name - Display name
     * @param {string} updates.description - Gateway description
     * @returns {Promise<Object>} Updated gateway config
     */
    async updateGateway(gatewayId, updates) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        if (!updates || Object.keys(updates).length === 0) {
            throw new Error('No updates provided');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Validate updates
        const allowedFields = ['pricing_approved', 'pricing_live', 'is_active', 'gateway_name', 'description'];
        const updateData = {};

        for (const [key, value] of Object.entries(updates)) {
            if (!allowedFields.includes(key)) {
                throw new Error(`Invalid field: ${key}`);
            }

            // Validate specific fields
            if (key === 'pricing_approved' || key === 'pricing_live') {
                if (typeof value !== 'number' || value < 0) {
                    throw new Error(`${key} must be a non-negative number`);
                }
                updateData[key] = value;
            } else if (key === 'is_active') {
                if (typeof value !== 'boolean') {
                    throw new Error('is_active must be a boolean');
                }
                updateData[key] = value;
            } else if (key === 'gateway_name' || key === 'description') {
                if (typeof value !== 'string') {
                    throw new Error(`${key} must be a string`);
                }
                updateData[key] = value;
            }
        }

        // Add updated_at timestamp
        updateData.updated_at = new Date().toISOString();

        // Check if gateway exists
        const existing = await this.getGateway(gatewayId);
        if (!existing) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        // Update in database
        const { data: updated, error } = await supabase
            .from('gateway_configs')
            .update(updateData)
            .eq('gateway_id', gatewayId)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to update gateway: ${error.message}`);
        }

        // Invalidate cache so new rate is applied immediately (Requirement 5.3)
        this.invalidateCache();

        return updated;
    }

    /**
     * Create a new gateway configuration
     * 
     * @param {Object} config - Gateway configuration
     * @param {string} config.gateway_id - Unique gateway ID
     * @param {string} config.gateway_name - Display name
     * @param {number} config.pricing_approved - Credits for APPROVED cards (default: 5)
     * @param {number} config.pricing_live - Credits for LIVE cards (default: 3)
     * @param {string} config.description - Gateway description
     * @param {boolean} config.is_active - Whether gateway is active (default: true)
     * @returns {Promise<Object>} Created gateway config
     */
    async createGateway(config) {
        if (!config || !config.gateway_id) {
            throw new Error('Gateway ID is required');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const insertData = {
            gateway_id: config.gateway_id,
            gateway_name: config.gateway_name || config.gateway_id,
            pricing_approved: config.pricing_approved ?? DEFAULT_GATEWAY_PRICING.approved,
            pricing_live: config.pricing_live ?? DEFAULT_GATEWAY_PRICING.live,
            description: config.description || '',
            is_active: config.is_active !== false,
            updated_at: new Date().toISOString()
        };

        const { data: created, error } = await supabase
            .from('gateway_configs')
            .insert(insertData)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error(`Gateway already exists: ${config.gateway_id}`);
            }
            throw new Error(`Failed to create gateway: ${error.message}`);
        }

        // Invalidate cache
        this.invalidateCache();

        return created;
    }

    /**
     * Check if a gateway is active
     * 
     * Requirement: 5.5
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Promise<boolean>} True if gateway is active
     */
    async isGatewayActive(gatewayId) {
        const gateway = await this.getGateway(gatewayId);
        return gateway?.is_active === true;
    }

    /**
     * Get the credit rate for a gateway
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Promise<number>} Credit rate (defaults to 1.0 if not found)
     */
    async getGatewayRate(gatewayId) {
        const gateway = await this.getGateway(gatewayId);
        return gateway?.pricing_approved ?? DEFAULT_GATEWAY_PRICING.approved;
    }

    /**
     * Invalidate the gateway config cache
     * Called when configs are updated to ensure new rates apply immediately
     * 
     * Requirement: 5.3
     */
    invalidateCache() {
        this._cache = null;
        this._cacheTime = null;
    }

    // ============================================================
    // ADMIN CREDIT RATE MANAGEMENT METHODS
    // Requirements: 2.2, 4.4, 5.2, 5.3, 5.5, 10.1-10.4, 14.1
    // ============================================================

    /**
     * Set credit rate for a gateway with validation
     * 
     * Requirements: 2.2, 5.2, 5.5
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {number} rate - New credit rate (0.1 - 100.0)
     * @param {string} adminId - Admin user ID making the change
     * @returns {Promise<Object>} Result with old rate, new rate, and audit info
     * @throws {Error} If validation fails or gateway not found
     */
    async setCreditRate(gatewayId, rate, adminId) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Validate rate is a number (Requirement 5.5)
        if (typeof rate !== 'number' || isNaN(rate)) {
            throw new Error('Credit rate must be a valid number');
        }

        // Validate rate is within bounds (Requirement 2.2)
        if (rate < CREDIT_RATE_LIMITS.MIN || rate > CREDIT_RATE_LIMITS.MAX) {
            throw new Error(`Credit rate must be between ${CREDIT_RATE_LIMITS.MIN} and ${CREDIT_RATE_LIMITS.MAX}`);
        }

        // Get current gateway config
        const existing = await this.getGateway(gatewayId);
        if (!existing) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        const oldRate = existing.pricing_approved ?? DEFAULT_GATEWAY_PRICING.approved;
        const defaultRate = DEFAULT_GATEWAY_PRICING.approved;
        const isCustom = Math.abs(rate - defaultRate) > 0.001;

        // Update in database
        const { data: updated, error } = await supabase
            .from('gateway_configs')
            .update({
                pricing_approved: rate,
                updated_at: new Date().toISOString()
            })
            .eq('gateway_id', gatewayId)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to update credit rate: ${error.message}`);
        }

        // Invalidate cache immediately (Requirement 5.2)
        this.invalidateCache();

        // Log audit entry (Requirement 10.1, 10.2, 10.3)
        await this._logCreditRateAudit(gatewayId, oldRate, rate, adminId, CREDIT_RATE_AUDIT_ACTIONS.CHANGE);

        // Broadcast SSE event (Requirement 14.1)
        this._broadcastCreditRateChange(gatewayId, oldRate, rate, isCustom);

        return {
            success: true,
            gatewayId,
            oldRate,
            newRate: rate,
            isCustom,
            defaultRate,
            updatedAt: updated.updated_at
        };
    }

    /**
     * Reset credit rate to default for a gateway
     * 
     * Requirements: 4.4, 5.3
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} adminId - Admin user ID making the change
     * @returns {Promise<Object>} Result with old rate and default rate
     * @throws {Error} If gateway not found
     */
    async resetCreditRate(gatewayId, adminId) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Get current gateway config
        const existing = await this.getGateway(gatewayId);
        if (!existing) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        const oldRate = existing.pricing_approved ?? DEFAULT_GATEWAY_PRICING.approved;
        const defaultRate = DEFAULT_GATEWAY_PRICING.approved;

        // Update to default pricing
        const { data: updated, error } = await supabase
            .from('gateway_configs')
            .update({
                pricing_approved: DEFAULT_GATEWAY_PRICING.approved,
                pricing_live: DEFAULT_GATEWAY_PRICING.live,
                updated_at: new Date().toISOString()
            })
            .eq('gateway_id', gatewayId)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to reset credit rate: ${error.message}`);
        }

        // Invalidate cache (Requirement 5.3)
        this.invalidateCache();

        // Log audit entry with reset action type (Requirement 10.4)
        await this._logCreditRateAudit(gatewayId, oldRate, defaultRate, adminId, CREDIT_RATE_AUDIT_ACTIONS.RESET);

        // Broadcast SSE event
        this._broadcastCreditRateChange(gatewayId, oldRate, defaultRate, false);

        return {
            success: true,
            gatewayId,
            oldRate,
            newRate: defaultRate,
            defaultRate,
            isCustom: false,
            updatedAt: updated.updated_at
        };
    }

    /**
     * Set pricing for a gateway (approved and live rates)
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {Object} pricing - { approved: number, live: number }
     * @param {string} adminId - Admin user ID
     * @returns {Promise<Object>} Updated pricing info
     */
    async setPricing(gatewayId, pricing, adminId) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { approved, live } = pricing || {};

        // Validate pricing values
        if (approved !== undefined && (typeof approved !== 'number' || approved < 0)) {
            throw new Error('Approved pricing must be a non-negative number');
        }
        if (live !== undefined && (typeof live !== 'number' || live < 0)) {
            throw new Error('Live pricing must be a non-negative number');
        }

        // Get current gateway config
        const existing = await this.getGateway(gatewayId);
        if (!existing) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        const oldPricing = {
            approved: existing.pricing_approved ?? DEFAULT_GATEWAY_PRICING.approved,
            live: existing.pricing_live ?? DEFAULT_GATEWAY_PRICING.live
        };

        const updateData = { updated_at: new Date().toISOString() };
        if (approved !== undefined) {
            updateData.pricing_approved = approved;
        }
        if (live !== undefined) {
            updateData.pricing_live = live;
        }

        const { data: updated, error } = await supabase
            .from('gateway_configs')
            .update(updateData)
            .eq('gateway_id', gatewayId)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to update pricing: ${error.message}`);
        }

        // Invalidate cache
        this.invalidateCache();

        // Log audit entry
        await this._logCreditRateAudit(
            gatewayId,
            `approved:${oldPricing.approved},live:${oldPricing.live}`,
            `approved:${updated.pricing_approved},live:${updated.pricing_live}`,
            adminId,
            'pricing_update'
        );

        // Broadcast SSE event
        this._broadcastPricingChange(gatewayId, oldPricing, {
            approved: updated.pricing_approved,
            live: updated.pricing_live
        });

        return {
            success: true,
            gatewayId,
            oldPricing,
            newPricing: {
                approved: updated.pricing_approved,
                live: updated.pricing_live
            },
            updatedAt: updated.updated_at
        };
    }

    /**
     * Broadcast pricing change via SSE
     */
    _broadcastPricingChange(gatewayId, oldPricing, newPricing) {
        if (this.gatewayManager) {
            this.gatewayManager.broadcast({
                type: 'pricingChange',
                gatewayId,
                oldPricing,
                newPricing,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get credit rate for a gateway with metadata
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Promise<Object>} Credit rate info with isCustom flag
     */
    async getCreditRate(gatewayId) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        const gateway = await this.getGateway(gatewayId);

        if (!gateway) {
            // Return defaults if gateway not in database
            return {
                gatewayId,
                pricing: {
                    approved: DEFAULT_GATEWAY_PRICING.approved,
                    live: DEFAULT_GATEWAY_PRICING.live
                },
                isCustom: false,
                updatedAt: null
            };
        }

        const approvedRate = gateway.pricing_approved ?? DEFAULT_GATEWAY_PRICING.approved;
        const liveRate = gateway.pricing_live ?? DEFAULT_GATEWAY_PRICING.live;
        const isCustom = approvedRate !== DEFAULT_GATEWAY_PRICING.approved ||
            liveRate !== DEFAULT_GATEWAY_PRICING.live;

        return {
            gatewayId,
            pricing: {
                approved: approvedRate,
                live: liveRate
            },
            isCustom,
            updatedAt: gateway.updated_at
        };
    }

    /**
     * Get all credit rates with metadata, pricing info, and type hierarchy
     * 
     * @returns {Promise<Array>} Array of credit rate info for all gateways
     */
    async getAllCreditRates() {
        const gateways = await this.getActiveGateways();

        return gateways.map(gateway => {
            const approvedRate = gateway.pricing_approved ?? DEFAULT_GATEWAY_PRICING.approved;
            const liveRate = gateway.pricing_live ?? DEFAULT_GATEWAY_PRICING.live;
            const isCustom = approvedRate !== DEFAULT_GATEWAY_PRICING.approved ||
                liveRate !== DEFAULT_GATEWAY_PRICING.live;
            const typeHierarchy = getGatewayTypeInfo(gateway.gateway_id);

            return {
                gatewayId: gateway.gateway_id,
                gatewayName: gateway.gateway_name,
                rate: approvedRate, // Keep for backward compatibility
                isCustom,
                // Type hierarchy
                parentType: gateway.parent_type || typeHierarchy.parentType,
                subType: gateway.sub_type || typeHierarchy.subType,
                type: this._getGatewayType(gateway.gateway_id), // Legacy: auth, charge, shopify
                updatedAt: gateway.updated_at,
                // Pricing info from database (single values, not ranges)
                pricing: {
                    approved: gateway.pricing_approved ?? 5,
                    live: gateway.pricing_live ?? 3
                }
            };
        });
    }

    // ============================================================
    // TIER RESTRICTION METHODS
    // ============================================================

    /**
     * Check if a user can access a gateway based on tier restriction
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} userTier - User's tier
     * @returns {Promise<Object>} { canAccess, minTier, userTier }
     */
    async canUserAccessGateway(gatewayId, userTier) {
        const gateway = await this.getGateway(gatewayId);
        if (!gateway) {
            return { canAccess: false, error: 'Gateway not found' };
        }

        const minTier = gateway.min_tier || null;
        const canAccess = canTierAccess(userTier, minTier);

        return {
            canAccess,
            minTier,
            userTier,
            gatewayId
        };
    }

    /**
     * Set minimum tier restriction for a gateway
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string|null} minTier - Minimum tier (null to remove restriction)
     * @param {string} adminId - Admin user ID
     * @returns {Promise<Object>} Result with old and new tier
     */
    async setTierRestriction(gatewayId, minTier, adminId) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Validate tier if provided
        if (minTier !== null && !TIER_HIERARCHY.includes(minTier.toLowerCase())) {
            throw new Error(`Invalid tier: ${minTier}. Must be one of: ${TIER_HIERARCHY.join(', ')}`);
        }

        // Get current gateway config
        const existing = await this.getGateway(gatewayId);
        if (!existing) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        const oldTier = existing.min_tier || null;
        const newTier = minTier ? minTier.toLowerCase() : null;

        // Update in database
        const { data: updated, error } = await supabase
            .from('gateway_configs')
            .update({
                min_tier: newTier,
                updated_at: new Date().toISOString()
            })
            .eq('gateway_id', gatewayId)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to update tier restriction: ${error.message}`);
        }

        // Invalidate cache
        this.invalidateCache();

        // Log audit entry
        await this._logTierRestrictionAudit(gatewayId, oldTier, newTier, adminId);

        // Broadcast SSE event
        this._broadcastTierRestrictionChange(gatewayId, oldTier, newTier);

        return {
            success: true,
            gatewayId,
            oldTier,
            newTier,
            updatedAt: updated.updated_at
        };
    }

    /**
     * Get tier restriction for a gateway
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Promise<Object>} { gatewayId, minTier }
     */
    async getTierRestriction(gatewayId) {
        const gateway = await this.getGateway(gatewayId);
        return {
            gatewayId,
            minTier: gateway?.min_tier || null,
            gatewayName: gateway?.gateway_name || gatewayId
        };
    }

    /**
     * Clear tier restriction for a gateway (allow all tiers)
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} adminId - Admin user ID
     * @returns {Promise<Object>} Result
     */
    async clearTierRestriction(gatewayId, adminId) {
        return this.setTierRestriction(gatewayId, null, adminId);
    }

    /**
     * Get all gateways with their tier restrictions
     * 
     * @returns {Promise<Array>} Array of gateways with tier info
     */
    async getAllTierRestrictions() {
        const gateways = await this.getActiveGateways();

        return gateways.map(gateway => ({
            gatewayId: gateway.gateway_id,
            gatewayName: gateway.gateway_name,
            minTier: gateway.min_tier || null,
            type: this._getGatewayType(gateway.gateway_id)
        }));
    }

    /**
     * Get gateways by parent type
     * 
     * @param {string} parentType - Parent type (stripe, shopify)
     * @returns {Promise<Array>} Array of gateways
     */
    async getGatewaysByParentType(parentType) {
        const gateways = await this.getActiveGateways();
        return gateways.filter(g => {
            const typeInfo = getGatewayTypeInfo(g.gateway_id);
            return typeInfo.parentType === parentType;
        });
    }

    /**
     * Get gateways by sub-type
     * 
     * @param {string} subType - Sub type (auth, charge)
     * @returns {Promise<Array>} Array of gateways
     */
    async getGatewaysBySubType(subType) {
        const gateways = await this.getActiveGateways();
        return gateways.filter(g => {
            const typeInfo = getGatewayTypeInfo(g.gateway_id);
            return typeInfo.subType === subType;
        });
    }

    /**
     * Log tier restriction change to audit log
     * 
     * @private
     */
    async _logTierRestrictionAudit(gatewayId, oldTier, newTier, adminId) {
        if (!isSupabaseConfigured()) {
            return;
        }

        try {
            const auditEntry = {
                gateway_id: gatewayId,
                old_state: oldTier || 'none',
                new_state: newTier || 'none',
                admin_id: adminId || null,
                reason: `tier_restriction_change: ${oldTier || 'none'} -> ${newTier || 'none'}`
            };

            const { error } = await supabase
                .from('gateway_audit_logs')
                .insert(auditEntry);

            if (error) {

            } else {

            }
        } catch (err) {

        }
    }

    /**
     * Broadcast tier restriction change via SSE
     * 
     * @private
     */
    _broadcastTierRestrictionChange(gatewayId, oldTier, newTier) {
        if (!this.gatewayManager) {
            return;
        }

        // Use gateway manager's SSE broadcast
        if (this.gatewayManager.broadcastTierRestrictionChange) {
            this.gatewayManager.broadcastTierRestrictionChange(gatewayId, oldTier, newTier);
        }
    }

    /**
     * Log credit rate change to audit log
     * 
     * Requirements: 10.1, 10.2, 10.3, 10.4
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @param {number} oldRate - Previous rate
     * @param {number} newRate - New rate
     * @param {string} adminId - Admin user ID
     * @param {string} actionType - Action type (credit_rate_change or credit_rate_reset)
     */
    async _logCreditRateAudit(gatewayId, oldRate, newRate, adminId, actionType) {
        if (!isSupabaseConfigured()) {
            return;
        }

        try {
            const auditEntry = {
                gateway_id: gatewayId,
                old_state: String(oldRate),
                new_state: String(newRate),
                admin_id: adminId || null,
                reason: `${actionType}: ${oldRate} -> ${newRate}`
            };

            const { error } = await supabase
                .from('gateway_audit_logs')
                .insert(auditEntry);

            if (error) {
                // Log error silently
            }
        } catch (err) {
            // Error logging audit entry
        }
    }

    /**
     * Broadcast credit rate change via SSE
     * 
     * Requirement: 14.1
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @param {number} oldRate - Previous rate
     * @param {number} newRate - New rate
     * @param {boolean} isCustom - Whether the new rate is custom
     */
    _broadcastCreditRateChange(gatewayId, oldRate, newRate, isCustom) {
        if (!this.gatewayManager) {
            return;
        }

        // Use the gateway manager's SSE broadcast capability
        this.gatewayManager.broadcastCreditRateChange(gatewayId, oldRate, newRate, isCustom);
    }

    /**
     * Get default rate for a gateway based on its type
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @returns {number} Default credit rate
     */
    _getDefaultRateForGateway(gatewayId) {
        // Check if there's a direct match in DEFAULT_GATEWAY_RATES
        if (DEFAULT_GATEWAY_RATES[gatewayId]) {
            return DEFAULT_GATEWAY_RATES[gatewayId].rate;
        }

        // Determine type from gateway ID prefix
        const type = this._getGatewayType(gatewayId);

        // Return default rate for type
        if (DEFAULT_GATEWAY_RATES[type]) {
            return DEFAULT_GATEWAY_RATES[type].rate;
        }

        // Fallback to 1.0
        return 1.0;
    }

    /**
     * Get gateway sub-type from gateway ID
     * 
     * @private
     * @param {string} gatewayId - Gateway ID (e.g., 'auth-1', 'charge-2', 'shopify-05')
     * @returns {string} Gateway sub-type (auth, charge, shopify)
     */
    _getGatewayType(gatewayId) {
        const typeInfo = getGatewayTypeInfo(gatewayId);
        // Return subType if exists, otherwise parentType (for shopify)
        return typeInfo.subType || typeInfo.parentType;
    }

    /**
     * Get full type hierarchy for a gateway
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {{ parentType: string, subType: string|null }}
     */
    getGatewayTypeHierarchy(gatewayId) {
        return getGatewayTypeInfo(gatewayId);
    }

    // ============================================================
    // PRIVATE CACHE METHODS
    // ============================================================

    /**
     * Get all cached gateways if cache is valid
     * 
     * @private
     * @returns {Array|null} Cached configs or null if expired
     */
    _getCachedGateways() {
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

        return Object.values(this._cache);
    }

    /**
     * Get a specific gateway from cache
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @returns {Object|null|undefined} Cached config, null if not found, undefined if cache miss
     */
    _getCachedGateway(gatewayId) {
        if (!this._cache || !this._cacheTime) {
            return undefined;
        }

        const now = Date.now();
        if (now - this._cacheTime > this._cacheExpiryMs) {
            // Cache expired
            this._cache = null;
            this._cacheTime = null;
            return undefined;
        }

        return this._cache[gatewayId] || null;
    }

    /**
     * Update a single entry in the cache
     * 
     * @private
     * @param {Object} config - Gateway config to cache
     */
    _updateCacheEntry(config) {
        if (!config || !config.gateway_id) {
            return;
        }

        if (!this._cache) {
            this._cache = {};
            this._cacheTime = Date.now();
        }

        this._cache[config.gateway_id] = config;
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
            .from('gateway_configs')
            .select('*');

        if (error) {

            return;
        }

        this._cache = {};
        for (const config of (configs || [])) {
            this._cache[config.gateway_id] = config;
        }
        this._cacheTime = Date.now();
    }

    /**
     * Get default gateway configs (used when database not available)
     * 
     * @private
     * @returns {Array} Default gateway configs
     */
    _getDefaultGateways() {
        return Object.entries(DEFAULT_GATEWAY_RATES).map(([id, config]) => ({
            gateway_id: id,
            gateway_name: config.name,
            base_credit_rate: config.rate,
            is_active: true,
            description: config.description,
            updated_at: null
        }));
    }

    /**
     * Get a default gateway config by ID
     * 
     * @private
     * @param {string} gatewayId - Gateway ID (e.g., 'auth-1', 'charge-2', 'skbased-auth-1')
     * @returns {Object|null} Default config or null
     */
    _getDefaultGateway(gatewayId) {
        // First try direct lookup
        let defaultConfig = DEFAULT_GATEWAY_RATES[gatewayId];

        // If not found, try to get config by gateway type
        if (!defaultConfig) {
            const typeInfo = getGatewayTypeInfo(gatewayId);
            // Try subType first (e.g., 'auth', 'charge', 'skbased-auth')
            if (typeInfo.subType) {
                defaultConfig = DEFAULT_GATEWAY_RATES[typeInfo.subType];
            }
            // Fallback to parentType (e.g., 'shopify')
            if (!defaultConfig && typeInfo.parentType) {
                defaultConfig = DEFAULT_GATEWAY_RATES[typeInfo.parentType];
            }
        }

        if (!defaultConfig) {
            return null;
        }

        return {
            gateway_id: gatewayId,
            gateway_name: defaultConfig.name,
            base_credit_rate: defaultConfig.rate,
            is_active: true,
            description: defaultConfig.description,
            updated_at: null
        };
    }
}


export default GatewayConfigService;
