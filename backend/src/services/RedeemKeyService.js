import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';
import { TRANSACTION_TYPES } from './CreditManagerService.js';

/**
 * Safe alphanumeric characters for key generation
 * Excludes ambiguous characters: 0/O, 1/I/L
 * Requirements: 4.4
 */
const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Key types
 */
export const KEY_TYPES = {
    CREDITS: 'credits',
    TIER: 'tier'
};

/**
 * Valid tier values for tier keys
 */
export const VALID_TIERS = ['bronze', 'silver', 'gold', 'diamond'];

/**
 * Redeem Key Service
 * 
 * Handles redeem key generation, redemption, and management.
 * 
 * Requirements: 4.1-4.8, 5.2-5.7
 */
export class RedeemKeyService {
    constructor(creditManagerService = null) {
        this.creditManagerService = creditManagerService;
    }

    /**
     * Generate a single unique key code
     * Format: XXXX-XXXX-XXXX-XXXX (16 chars + 3 dashes = 19 chars)
     * Uses safe alphanumeric chars (no 0/O, 1/I/L)
     * 
     * Requirements: 4.4
     * 
     * @returns {string} Generated key code
     */
    generateKeyCode() {
        let code = '';
        for (let i = 0; i < 16; i++) {
            code += SAFE_CHARS.charAt(Math.floor(Math.random() * SAFE_CHARS.length));
        }
        // Format: XXXX-XXXX-XXXX-XXXX
        return code.match(/.{4}/g).join('-');
    }

    /**
     * Generate multiple redeem keys
     * 
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
     * 
     * @param {Object} options - Key generation options
     * @param {string} options.type - 'credits' or 'tier'
     * @param {number|string} options.value - Credit amount or tier name
     * @param {number} options.quantity - Number of keys to generate (1-1000)
     * @param {number} options.maxUses - Max uses per key (default 1)
     * @param {Date|string} options.expiresAt - Optional expiration date
     * @param {string} options.note - Optional admin note
     * @param {string} options.createdBy - Admin user ID who created the keys
     * @returns {Promise<Object>} Result with generated keys
     */
    async generateKeys(options) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { type, value, quantity, maxUses = 1, expiresAt = null, note = null, createdBy } = options;

        // Validate type
        if (!type || !Object.values(KEY_TYPES).includes(type)) {
            throw new Error(`Invalid key type: ${type}. Must be 'credits' or 'tier'`);
        }

        // Validate value based on type
        if (type === KEY_TYPES.CREDITS) {
            const creditValue = parseInt(value, 10);
            if (isNaN(creditValue) || creditValue <= 0) {
                throw new Error('Credit value must be a positive number');
            }
        } else if (type === KEY_TYPES.TIER) {
            if (!VALID_TIERS.includes(value)) {
                throw new Error(`Invalid tier: ${value}. Must be one of: ${VALID_TIERS.join(', ')}`);
            }
        }

        // Validate quantity
        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 1 || qty > 1000) {
            throw new Error('Quantity must be between 1 and 1000');
        }

        // Validate maxUses
        const uses = parseInt(maxUses, 10);
        if (isNaN(uses) || uses < 1) {
            throw new Error('Max uses must be at least 1');
        }

        // Validate expiresAt if provided
        let expirationDate = null;
        if (expiresAt) {
            expirationDate = new Date(expiresAt);
            if (isNaN(expirationDate.getTime())) {
                throw new Error('Invalid expiration date');
            }
            if (expirationDate <= new Date()) {
                throw new Error('Expiration date must be in the future');
            }
        }

        // Generate unique keys
        const keysToInsert = [];
        const generatedCodes = new Set();

        for (let i = 0; i < qty; i++) {
            let code;
            // Ensure uniqueness within this batch
            do {
                code = this.generateKeyCode();
            } while (generatedCodes.has(code));
            generatedCodes.add(code);

            keysToInsert.push({
                code,
                type,
                value: String(value),
                max_uses: uses,
                current_uses: 0,
                expires_at: expirationDate ? expirationDate.toISOString() : null,
                revoked_at: null,
                note: note || null,
                created_by: createdBy || null
            });
        }

        // Insert keys into database
        const { data: insertedKeys, error } = await supabase
            .from('redeem_keys')
            .insert(keysToInsert)
            .select();

        if (error) {
            // Handle unique constraint violation (extremely rare with 16-char codes)
            if (error.code === '23505') {
                throw new Error('Key generation conflict. Please try again.');
            }
            throw new Error(`Failed to generate keys: ${error.message}`);
        }

        return {
            success: true,
            count: insertedKeys.length,
            keys: insertedKeys.map(k => ({
                id: k.id,
                code: k.code,
                type: k.type,
                value: k.value,
                maxUses: k.max_uses,
                expiresAt: k.expires_at,
                createdAt: k.created_at
            }))
        };
    }


    /**
     * Redeem a key for credits or tier upgrade
     * 
     * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
     * 
     * @param {string} userId - User UUID
     * @param {string} keyCode - Key code to redeem (XXXX-XXXX-XXXX-XXXX)
     * @param {string} ip - IP address of the request
     * @returns {Promise<Object>} Redemption result
     */
    async redeemKey(userId, keyCode, ip = null) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!keyCode) {
            return {
                success: false,
                error: 'KEY_INVALID',
                message: 'Invalid key'
            };
        }

        // Normalize key code (uppercase, trim)
        const normalizedCode = keyCode.trim().toUpperCase();

        // Validate key format (XXXX-XXXX-XXXX-XXXX)
        if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode)) {
            return {
                success: false,
                error: 'KEY_INVALID',
                message: 'Invalid key'
            };
        }

        // Get the key from database
        const { data: key, error: keyError } = await supabase
            .from('redeem_keys')
            .select('*')
            .eq('code', normalizedCode)
            .single();

        if (keyError || !key) {
            return {
                success: false,
                error: 'KEY_INVALID',
                message: 'Invalid key'
            };
        }

        // Check if key is revoked (Requirement 5.6)
        if (key.revoked_at) {
            return {
                success: false,
                error: 'KEY_REVOKED',
                message: 'Key revoked'
            };
        }

        // Check if key is expired (Requirement 5.5)
        if (key.expires_at && new Date(key.expires_at) <= new Date()) {
            return {
                success: false,
                error: 'KEY_EXPIRED',
                message: 'Key expired'
            };
        }

        // Check if key is exhausted (Requirement 5.4)
        if (key.current_uses >= key.max_uses) {
            return {
                success: false,
                error: 'KEY_EXHAUSTED',
                message: 'Key already redeemed'
            };
        }

        // Check if user already redeemed this key (Requirement 5.7)
        const { data: existingRedemption } = await supabase
            .from('key_redemptions')
            .select('id')
            .eq('key_id', key.id)
            .eq('user_id', userId)
            .single();

        if (existingRedemption) {
            return {
                success: false,
                error: 'KEY_ALREADY_USED',
                message: 'Already redeemed by you'
            };
        }

        // Get user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, credit_balance, tier')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            throw new Error('User not found');
        }

        // Perform redemption in a transaction-like manner
        // Note: Supabase doesn't support true transactions via JS client,
        // so we use optimistic locking via current_uses check
        
        let result;
        
        if (key.type === KEY_TYPES.CREDITS) {
            result = await this._redeemCreditsKey(key, user, ip);
        } else if (key.type === KEY_TYPES.TIER) {
            result = await this._redeemTierKey(key, user, ip);
        } else {
            return {
                success: false,
                error: 'KEY_INVALID',
                message: 'Invalid key type'
            };
        }

        return result;
    }

    /**
     * Redeem a credits key
     * 
     * @private
     * @param {Object} key - Key record
     * @param {Object} user - User record
     * @param {string} ip - IP address
     * @returns {Promise<Object>} Redemption result
     */
    async _redeemCreditsKey(key, user, ip) {
        const creditsToAdd = parseInt(key.value, 10);
        const currentBalance = parseFloat(user.credit_balance) || 0;
        const newBalance = currentBalance + creditsToAdd;

        // Update key usage with optimistic locking
        const { data: updatedKey, error: keyUpdateError } = await supabase
            .from('redeem_keys')
            .update({ current_uses: key.current_uses + 1 })
            .eq('id', key.id)
            .eq('current_uses', key.current_uses) // Optimistic lock
            .select()
            .single();

        if (keyUpdateError || !updatedKey) {
            return {
                success: false,
                error: 'KEY_EXHAUSTED',
                message: 'Key already redeemed'
            };
        }

        // Update user balance
        const { error: balanceError } = await supabase
            .from('users')
            .update({
                credit_balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (balanceError) {
            // Rollback key usage
            await supabase
                .from('redeem_keys')
                .update({ current_uses: key.current_uses })
                .eq('id', key.id);
            throw new Error(`Failed to update balance: ${balanceError.message}`);
        }

        // Record redemption (Requirement 5.7)
        const { error: redemptionError } = await supabase
            .from('key_redemptions')
            .insert({
                key_id: key.id,
                user_id: user.id,
                ip_address: ip
            });

        if (redemptionError) {
            // Log but don't fail - the redemption was successful
        }

        // Record credit transaction
        await supabase.from('credit_transactions').insert({
            user_id: user.id,
            amount: creditsToAdd,
            balance_after: newBalance,
            type: TRANSACTION_TYPES.BONUS,
            description: `Redeemed key: ${key.code}`
        });

        return {
            success: true,
            type: KEY_TYPES.CREDITS,
            creditsAdded: creditsToAdd,
            newBalance: newBalance
        };
    }

    /**
     * Redeem a tier upgrade key
     * 
     * @private
     * @param {Object} key - Key record
     * @param {Object} user - User record
     * @param {string} ip - IP address
     * @returns {Promise<Object>} Redemption result
     */
    async _redeemTierKey(key, user, ip) {
        const newTier = key.value;

        // Validate tier
        if (!VALID_TIERS.includes(newTier)) {
            return {
                success: false,
                error: 'KEY_INVALID',
                message: 'Invalid tier in key'
            };
        }

        // Check if user already has this tier or higher
        const tierOrder = ['free', 'bronze', 'silver', 'gold', 'diamond'];
        const currentTierIndex = tierOrder.indexOf(user.tier || 'free');
        const newTierIndex = tierOrder.indexOf(newTier);

        if (newTierIndex <= currentTierIndex) {
            return {
                success: false,
                error: 'TIER_NOT_UPGRADE',
                message: `You already have ${user.tier} tier or higher`
            };
        }

        // Update key usage with optimistic locking
        const { data: updatedKey, error: keyUpdateError } = await supabase
            .from('redeem_keys')
            .update({ current_uses: key.current_uses + 1 })
            .eq('id', key.id)
            .eq('current_uses', key.current_uses) // Optimistic lock
            .select()
            .single();

        if (keyUpdateError || !updatedKey) {
            return {
                success: false,
                error: 'KEY_EXHAUSTED',
                message: 'Key already redeemed'
            };
        }

        // Update user tier
        const { error: tierError } = await supabase
            .from('users')
            .update({
                tier: newTier,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (tierError) {
            // Rollback key usage
            await supabase
                .from('redeem_keys')
                .update({ current_uses: key.current_uses })
                .eq('id', key.id);
            throw new Error(`Failed to update tier: ${tierError.message}`);
        }

        // Record redemption (Requirement 5.7)
        const { error: redemptionError } = await supabase
            .from('key_redemptions')
            .insert({
                key_id: key.id,
                user_id: user.id,
                ip_address: ip
            });

        if (redemptionError) {
        }

        return {
            success: true,
            type: KEY_TYPES.TIER,
            newTier: newTier,
            previousTier: user.tier || 'free'
        };
    }


    /**
     * Get keys with filters and pagination (admin)
     * 
     * Requirements: 4.7
     * 
     * @param {Object} filters - Filter options
     * @param {string} filters.type - Filter by type ('credits' or 'tier')
     * @param {string} filters.status - Filter by status ('unused', 'used', 'expired', 'revoked')
     * @param {string} filters.createdBy - Filter by creator user ID
     * @param {Object} pagination - Pagination options
     * @param {number} pagination.page - Page number (1-based)
     * @param {number} pagination.limit - Items per page (default 50)
     * @returns {Promise<Object>} Paginated keys result
     */
    async getKeys(filters = {}, pagination = {}) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { type, status, createdBy } = filters;
        const { page = 1, limit = 50 } = pagination;

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;

        // Build query
        let query = supabase
            .from('redeem_keys')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Apply type filter
        if (type && Object.values(KEY_TYPES).includes(type)) {
            query = query.eq('type', type);
        }

        // Apply status filter
        const now = new Date().toISOString();
        if (status) {
            switch (status) {
                case 'unused':
                    query = query
                        .eq('current_uses', 0)
                        .is('revoked_at', null)
                        .or(`expires_at.is.null,expires_at.gt.${now}`);
                    break;
                case 'used':
                    query = query.gt('current_uses', 0);
                    break;
                case 'expired':
                    query = query
                        .not('expires_at', 'is', null)
                        .lt('expires_at', now);
                    break;
                case 'revoked':
                    query = query.not('revoked_at', 'is', null);
                    break;
            }
        }

        // Apply creator filter
        if (createdBy) {
            query = query.eq('created_by', createdBy);
        }

        // Apply pagination
        query = query.range(offset, offset + limitNum - 1);

        const { data: keys, error, count } = await query;

        if (error) {
            throw new Error(`Failed to get keys: ${error.message}`);
        }

        // Transform keys for response
        const transformedKeys = (keys || []).map(k => ({
            id: k.id,
            code: k.code,
            type: k.type,
            value: k.value,
            maxUses: k.max_uses,
            currentUses: k.current_uses,
            expiresAt: k.expires_at,
            revokedAt: k.revoked_at,
            note: k.note,
            createdBy: k.created_by,
            createdAt: k.created_at,
            status: this._getKeyStatus(k)
        }));

        return {
            keys: transformedKeys,
            total: count || 0,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil((count || 0) / limitNum),
            hasMore: offset + transformedKeys.length < (count || 0)
        };
    }

    /**
     * Revoke a key (admin)
     * 
     * Requirements: 4.8
     * 
     * @param {string} keyId - Key UUID to revoke
     * @returns {Promise<Object>} Revocation result
     */
    async revokeKey(keyId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!keyId) {
            throw new Error('Key ID is required');
        }

        // Get the key
        const { data: key, error: fetchError } = await supabase
            .from('redeem_keys')
            .select('id, code, revoked_at, current_uses')
            .eq('id', keyId)
            .single();

        if (fetchError || !key) {
            throw new Error('Key not found');
        }

        // Check if already revoked
        if (key.revoked_at) {
            return {
                success: false,
                error: 'ALREADY_REVOKED',
                message: 'Key is already revoked'
            };
        }

        // Revoke the key
        const { error: updateError } = await supabase
            .from('redeem_keys')
            .update({ revoked_at: new Date().toISOString() })
            .eq('id', keyId);

        if (updateError) {
            throw new Error(`Failed to revoke key: ${updateError.message}`);
        }

        return {
            success: true,
            keyId: key.id,
            code: key.code,
            message: 'Key revoked successfully'
        };
    }

    /**
     * Get a key by its code
     * 
     * @param {string} code - Key code
     * @returns {Promise<Object|null>} Key record or null
     */
    async getKeyByCode(code) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!code) {
            return null;
        }

        const normalizedCode = code.trim().toUpperCase();

        const { data: key, error } = await supabase
            .from('redeem_keys')
            .select('*')
            .eq('code', normalizedCode)
            .single();

        if (error || !key) {
            return null;
        }

        return {
            id: key.id,
            code: key.code,
            type: key.type,
            value: key.value,
            maxUses: key.max_uses,
            currentUses: key.current_uses,
            expiresAt: key.expires_at,
            revokedAt: key.revoked_at,
            note: key.note,
            createdBy: key.created_by,
            createdAt: key.created_at,
            status: this._getKeyStatus(key)
        };
    }

    /**
     * Get key status based on its state
     * 
     * @private
     * @param {Object} key - Key record
     * @returns {string} Status string
     */
    _getKeyStatus(key) {
        if (key.revoked_at) {
            return 'revoked';
        }
        if (key.expires_at && new Date(key.expires_at) <= new Date()) {
            return 'expired';
        }
        if (key.current_uses >= key.max_uses) {
            return 'exhausted';
        }
        if (key.current_uses > 0) {
            return 'partially_used';
        }
        return 'unused';
    }

    /**
     * Get redemption history for a key
     * 
     * @param {string} keyId - Key UUID
     * @returns {Promise<Array>} List of redemptions
     */
    async getKeyRedemptions(keyId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { data: redemptions, error } = await supabase
            .from('key_redemptions')
            .select(`
                id,
                user_id,
                ip_address,
                redeemed_at,
                users (
                    username,
                    first_name
                )
            `)
            .eq('key_id', keyId)
            .order('redeemed_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to get redemptions: ${error.message}`);
        }

        return (redemptions || []).map(r => ({
            id: r.id,
            userId: r.user_id,
            username: r.users?.username || r.users?.first_name || 'Unknown',
            ipAddress: r.ip_address,
            redeemedAt: r.redeemed_at
        }));
    }

    /**
     * Get user's redemption history
     * 
     * @param {string} userId - User UUID
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} Paginated redemption history
     */
    async getUserRedemptions(userId, pagination = {}) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { page = 1, limit = 20 } = pagination;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const { data: redemptions, error, count } = await supabase
            .from('key_redemptions')
            .select(`
                id,
                redeemed_at,
                redeem_keys (
                    code,
                    type,
                    value
                )
            `, { count: 'exact' })
            .eq('user_id', userId)
            .order('redeemed_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (error) {
            throw new Error(`Failed to get user redemptions: ${error.message}`);
        }

        return {
            redemptions: (redemptions || []).map(r => ({
                id: r.id,
                code: r.redeem_keys?.code,
                type: r.redeem_keys?.type,
                value: r.redeem_keys?.value,
                redeemedAt: r.redeemed_at
            })),
            total: count || 0,
            page: pageNum,
            limit: limitNum,
            hasMore: offset + (redemptions?.length || 0) < (count || 0)
        };
    }
}

export default RedeemKeyService;
