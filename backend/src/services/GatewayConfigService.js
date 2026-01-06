import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';
import { GATEWAY_TYPES, getGatewayTypeInfo } from '../utils/constants.js';

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
        
        // CreditManagerService reference for cache invalidation
        this.creditManagerService = options.creditManagerService || null;
    }

    /**
     * Get all active gateway configurations
     * 
     * Requirement: 5.1
     * 
     * @returns {Promise<Array>} Array of active gateway configs
     * @throws {Error} If database not configured or query fails
     */
    async getActiveGateways() {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured - gateway configurations unavailable');
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
            throw new Error(`Failed to fetch gateway configurations: ${error.message}`);
        }

        if (!configs || configs.length === 0) {
            throw new Error('No gateway configurations found in database');
        }

        // Update cache with all configs (we'll filter for active)
        await this._refreshCache();

        return configs;
    }

    /**
     * Get a specific gateway configuration
     * 
     * Requirement: 5.1
     * 
     * @param {string} gatewayId - Gateway ID (e.g., 'auth', 'charge', 'shopify')
     * @returns {Promise<Object>} Gateway config
     * @throws {Error} If gateway not found or database unavailable
     */
    async getGateway(gatewayId) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured - gateway configuration unavailable');
        }

        // Try cache first
        const cached = this._getCachedGateway(gatewayId);
        if (cached !== undefined && cached !== null) {
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
                throw new Error(`Gateway configuration not found: ${gatewayId}`);
            }
            throw new Error(`Failed to fetch gateway configuration: ${error.message}`);
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
     * @param {string} config.gateway_id - Unique gateway ID (required)
     * @param {string} config.gateway_name - Display name (required)
     * @param {number} config.pricing_approved - Credits for APPROVED cards (required)
     * @param {number} config.pricing_live - Credits for LIVE cards (required)
     * @param {string} config.description - Gateway description
     * @param {boolean} config.is_active - Whether gateway is active (default: true)
     * @returns {Promise<Object>} Created gateway config
     * @throws {Error} If required fields missing or database unavailable
     */
    async createGateway(config) {
        if (!config || !config.gateway_id) {
            throw new Error('Gateway ID is required');
        }

        if (!config.gateway_name) {
            throw new Error('Gateway name is required');
        }

        if (config.pricing_approved === undefined || config.pricing_approved === null) {
            throw new Error('pricing_approved is required');
        }

        if (config.pricing_live === undefined || config.pricing_live === null) {
            throw new Error('pricing_live is required');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const insertData = {
            gateway_id: config.gateway_id,
            gateway_name: config.gateway_name,
            pricing_approved: config.pricing_approved,
            pricing_live: config.pricing_live,
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
     * @returns {Promise<number>} Credit rate (pricing_approved)
     * @throws {Error} If gateway not found or pricing not configured
     */
    async getGatewayRate(gatewayId) {
        const gateway = await this.getGateway(gatewayId);
        
        if (gateway.pricing_approved === undefined || gateway.pricing_approved === null) {
            throw new Error(`Pricing not configured for gateway: ${gatewayId}`);
        }
        
        return gateway.pricing_approved;
    }

    /**
     * Invalidate the gateway config cache
     * Called when configs are updated to ensure new rates apply immediately
     * Also invalidates CreditManagerService cache if available
     * 
     * Requirement: 5.3
     */
    invalidateCache(gatewayId = null) {
        this._cache = null;
        this._cacheTime = null;
        
        // Also invalidate CreditManagerService cache for immediate effect
        if (this.creditManagerService && typeof this.creditManagerService.invalidateGatewayCache === 'function') {
            this.creditManagerService.invalidateGatewayCache(gatewayId);
        }
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

        const oldRate = existing.pricing_approved;
        if (oldRate === undefined || oldRate === null) {
            throw new Error(`Current pricing not configured for gateway: ${gatewayId}`);
        }

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
        this._broadcastCreditRateChange(gatewayId, oldRate, rate, true);

        return {
            success: true,
            gatewayId,
            oldRate,
            newRate: rate,
            updatedAt: updated.updated_at
        };
    }

    /**
     * Reset credit rate for a gateway (requires providing the default values)
     * 
     * Requirements: 4.4, 5.3
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} adminId - Admin user ID making the change
     * @param {Object} defaultPricing - Default pricing { approved: number, live: number }
     * @returns {Promise<Object>} Result with old rate and new rate
     * @throws {Error} If gateway not found or defaults not provided
     */
    async resetCreditRate(gatewayId, adminId, defaultPricing) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        if (!defaultPricing || defaultPricing.approved === undefined || defaultPricing.live === undefined) {
            throw new Error('Default pricing (approved and live) must be provided for reset operation');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Get current gateway config
        const existing = await this.getGateway(gatewayId);

        const oldRate = existing.pricing_approved;
        if (oldRate === undefined || oldRate === null) {
            throw new Error(`Current pricing not configured for gateway: ${gatewayId}`);
        }

        // Update to provided default pricing
        const { data: updated, error } = await supabase
            .from('gateway_configs')
            .update({
                pricing_approved: defaultPricing.approved,
                pricing_live: defaultPricing.live,
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
        await this._logCreditRateAudit(gatewayId, oldRate, defaultPricing.approved, adminId, CREDIT_RATE_AUDIT_ACTIONS.RESET);

        // Broadcast SSE event
        this._broadcastCreditRateChange(gatewayId, oldRate, defaultPricing.approved, false);

        return {
            success: true,
            gatewayId,
            oldRate,
            newRate: defaultPricing.approved,
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

        if (existing.pricing_approved === undefined || existing.pricing_live === undefined) {
            throw new Error(`Current pricing not configured for gateway: ${gatewayId}`);
        }

        const oldPricing = {
            approved: existing.pricing_approved,
            live: existing.pricing_live
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
     * @returns {Promise<Object>} Credit rate info
     * @throws {Error} If gateway not found or pricing not configured
     */
    async getCreditRate(gatewayId) {
        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        const gateway = await this.getGateway(gatewayId);

        if (gateway.pricing_approved === undefined || gateway.pricing_live === undefined) {
            throw new Error(`Pricing not configured for gateway: ${gatewayId}`);
        }

        return {
            gatewayId,
            pricing: {
                approved: gateway.pricing_approved,
                live: gateway.pricing_live
            },
            updatedAt: gateway.updated_at
        };
    }

    /**
     * Get all credit rates with metadata, pricing info, and type hierarchy
     * 
     * @returns {Promise<Array>} Array of credit rate info for all gateways
     * @throws {Error} If pricing not configured for any gateway
     */
    async getAllCreditRates() {
        const gateways = await this.getActiveGateways();

        return gateways.map(gateway => {
            if (gateway.pricing_approved === undefined || gateway.pricing_live === undefined) {
                throw new Error(`Pricing not configured for gateway: ${gateway.gateway_id}`);
            }

            const typeHierarchy = getGatewayTypeInfo(gateway.gateway_id);

            return {
                gatewayId: gateway.gateway_id,
                gatewayName: gateway.gateway_name,
                rate: gateway.pricing_approved, // Keep for backward compatibility
                // Type hierarchy
                parentType: gateway.parent_type || typeHierarchy.parentType,
                subType: gateway.sub_type || typeHierarchy.subType,
                type: this._getGatewayType(gateway.gateway_id), // Legacy: auth, charge, shopify
                updatedAt: gateway.updated_at,
                // Pricing info from database (single values, not ranges)
                pricing: {
                    approved: gateway.pricing_approved,
                    live: gateway.pricing_live
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

}


export default GatewayConfigService;
