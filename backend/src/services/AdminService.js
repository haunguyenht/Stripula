import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';
import { TRANSACTION_TYPES } from './CreditManagerService.js';

/**
 * Valid tiers for admin operations
 */
const ADMIN_VALID_TIERS = ['free', 'bronze', 'silver', 'gold', 'diamond'];

/**
 * Admin Service
 * 
 * Handles administrative operations including user management,
 * tier updates, credit adjustments, and system analytics.
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5, 5.1-5.7
 */
export class AdminService {
    constructor(options = {}) {
        this.userService = options.userService || null;
    }

    /**
     * Get users with filters and pagination
     * 
     * Requirements: 3.1
     * 
     * @param {Object} filters - Filter options
     * @param {string} filters.search - Search by username or first_name
     * @param {string} filters.tier - Filter by tier
     * @param {boolean} filters.flagged - Filter by flagged status
     * @param {Object} pagination - Pagination options
     * @param {number} pagination.page - Page number (1-based)
     * @param {number} pagination.limit - Items per page (default 50)
     * @returns {Promise<Object>} Paginated users result
     */
    async getUsers(filters = {}, pagination = {}) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { search, tier, flagged } = filters;
        const { page = 1, limit = 50 } = pagination;

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;

        // Build query
        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Apply search filter (username or first_name)
        if (search && search.trim()) {
            const searchTerm = search.trim().toLowerCase();
            query = query.or(`username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%`);
        }

        // Apply tier filter
        if (tier && ADMIN_VALID_TIERS.includes(tier)) {
            query = query.eq('tier', tier);
        }

        // Apply flagged filter
        if (flagged !== undefined && flagged !== null) {
            query = query.eq('is_flagged', Boolean(flagged));
        }

        // Apply pagination
        query = query.range(offset, offset + limitNum - 1);

        const { data: users, error, count } = await query;

        if (error) {
            throw new Error(`Failed to get users: ${error.message}`);
        }

        // Transform users for response (exclude sensitive fields)
        const transformedUsers = (users || []).map(u => ({
            id: u.id,
            telegramId: u.telegram_id,
            username: u.username,
            firstName: u.first_name,
            lastName: u.last_name,
            photoUrl: u.photo_url,
            tier: u.tier,
            tierExpiresAt: u.tier_expires_at || null,
            creditBalance: parseFloat(u.credit_balance) || 0,
            isFlagged: u.is_flagged || false,
            flagReason: u.flag_reason,
            isAdmin: u.is_admin || false,
            dailyCardsUsed: u.daily_cards_used || 0,
            referralCode: u.referral_code,
            referralCount: u.referral_count || 0,
            createdAt: u.created_at,
            updatedAt: u.updated_at
        }));

        return {
            users: transformedUsers,
            total: count || 0,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil((count || 0) / limitNum),
            hasMore: offset + transformedUsers.length < (count || 0)
        };
    }

    /**
     * Update user tier with optional duration
     * 
     * Requirements: 3.2, 5.1, 5.2, 5.3
     * 
     * @param {string} userId - User UUID
     * @param {string} tier - New tier value
     * @param {number|null} durationDays - Duration in days (null/0 = permanent)
     * @returns {Promise<Object>} Updated user with tierExpiresAt
     */
    async updateUserTier(userId, tier, durationDays = null) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!tier || !ADMIN_VALID_TIERS.includes(tier)) {
            throw new Error(`Invalid tier: ${tier}. Must be one of: ${ADMIN_VALID_TIERS.join(', ')}`);
        }

        // Get current user for previous tier info
        const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('id, tier, tier_expires_at, username, first_name')
            .eq('id', userId)
            .single();

        if (fetchError || !currentUser) {
            throw new Error('User not found');
        }

        const previousTier = currentUser.tier;
        const previousExpiresAt = currentUser.tier_expires_at;

        // Use UserService.setTierWithDuration for tier update (Requirements 5.1, 5.2, 5.3)
        let updatedUser;
        if (this.userService) {
            updatedUser = await this.userService.setTierWithDuration(userId, tier, durationDays);
        } else {
            // Fallback: direct database update if userService not available
            let tierExpiresAt = null;
            if (tier !== 'free' && durationDays !== null && durationDays !== undefined && durationDays > 0) {
                if (durationDays > 365) {
                    throw new Error('Duration cannot exceed 365 days');
                }
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + durationDays);
                tierExpiresAt = expiresAt.toISOString();
            }

            const { data, error: updateError } = await supabase
                .from('users')
                .update({
                    tier: tier,
                    tier_expires_at: tierExpiresAt,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (updateError) {
                throw new Error(`Failed to update tier: ${updateError.message}`);
            }
            updatedUser = data;
        }

        // Log the admin action
        await this._logAdminAction(userId, 'tier_update', {
            previousTier,
            newTier: tier,
            previousExpiresAt,
            newExpiresAt: updatedUser.tier_expires_at,
            durationDays: durationDays || 'permanent'
        });

        return {
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                firstName: updatedUser.first_name,
                previousTier,
                newTier: tier,
                tierExpiresAt: updatedUser.tier_expires_at,
                durationDays: durationDays || null
            }
        };
    }

    /**
     * Extend user's current tier duration
     * 
     * Requirements: 5.5, 5.6, 5.7
     * 
     * @param {string} userId - User UUID
     * @param {number} additionalDays - Days to add (must be positive integer, 1-365)
     * @returns {Promise<Object>} Result with previous and new expiration dates
     */
    async extendUserTier(userId, additionalDays) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Validate additionalDays
        if (!Number.isInteger(additionalDays)) {
            throw new Error('Additional days must be a positive integer');
        }
        if (additionalDays < 1) {
            throw new Error('Additional days must be a positive number');
        }
        if (additionalDays > 365) {
            throw new Error('Additional days cannot exceed 365');
        }

        // Get current user for previous expiration info
        const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('id, tier, tier_expires_at, username, first_name')
            .eq('id', userId)
            .single();

        if (fetchError || !currentUser) {
            throw new Error('User not found');
        }

        // Cannot extend free tier
        if (currentUser.tier === 'free') {
            throw new Error('Cannot extend duration for free tier');
        }

        const previousExpiresAt = currentUser.tier_expires_at;

        // Use UserService.extendTierDuration for extension (Requirements 5.6, 5.7)
        let updatedUser;
        if (this.userService) {
            updatedUser = await this.userService.extendTierDuration(userId, additionalDays);
        } else {
            // Fallback: direct calculation if userService not available
            const now = new Date();
            let newExpiresAt;

            if (currentUser.tier_expires_at) {
                const currentExpiration = new Date(currentUser.tier_expires_at);
                
                // Check if tier has already expired
                if (currentExpiration <= now) {
                    // Tier expired - calculate from today
                    newExpiresAt = new Date(now);
                } else {
                    // Tier still active - add to current expiration
                    newExpiresAt = new Date(currentExpiration);
                }
            } else {
                // Permanent tier (no expiration) - extend from now
                newExpiresAt = new Date(now);
            }
            
            newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);

            const { data, error: updateError } = await supabase
                .from('users')
                .update({
                    tier_expires_at: newExpiresAt.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (updateError) {
                throw new Error(`Failed to extend tier duration: ${updateError.message}`);
            }
            updatedUser = data;
        }

        // Log the admin action
        await this._logAdminAction(userId, 'tier_extension', {
            tier: currentUser.tier,
            previousExpiresAt,
            newExpiresAt: updatedUser.tier_expires_at,
            daysAdded: additionalDays
        });

        return {
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                firstName: updatedUser.first_name,
                tier: currentUser.tier,
                previousExpiresAt,
                newExpiresAt: updatedUser.tier_expires_at,
                daysAdded: additionalDays
            }
        };
    }

    /**
     * Update user credits (add or subtract)
     * 
     * Requirements: 3.2
     * 
     * @param {string} userId - User UUID
     * @param {number} amount - Amount to add (positive) or subtract (negative)
     * @param {string} reason - Reason for the adjustment
     * @returns {Promise<Object>} Updated user with new balance
     */
    async updateUserCredits(userId, amount, reason) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new Error('Amount must be a valid number');
        }

        if (!reason || !reason.trim()) {
            throw new Error('Reason is required for credit adjustments');
        }

        // Get current user
        const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('id, credit_balance, username, first_name')
            .eq('id', userId)
            .single();

        if (fetchError || !currentUser) {
            throw new Error('User not found');
        }

        const previousBalance = parseFloat(currentUser.credit_balance) || 0;
        const newBalance = previousBalance + amount;

        // Prevent negative balance
        if (newBalance < 0) {
            throw new Error(`Cannot reduce balance below 0. Current balance: ${previousBalance}, requested change: ${amount}`);
        }

        // Update user balance
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                credit_balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            throw new Error(`Failed to update credits: ${updateError.message}`);
        }

        // Record credit transaction
        const transactionType = amount >= 0 ? TRANSACTION_TYPES.BONUS : TRANSACTION_TYPES.USAGE;
        const { data: transaction, error: txError } = await supabase
            .from('credit_transactions')
            .insert({
                user_id: userId,
                amount: amount,
                balance_after: newBalance,
                type: transactionType,
                description: `Admin adjustment: ${reason.trim()}`
            })
            .select('id')
            .single();

        if (txError) {
        }

        // Log the admin action
        await this._logAdminAction(userId, 'credit_adjustment', {
            previousBalance,
            amount,
            newBalance,
            reason: reason.trim()
        });

        return {
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                firstName: updatedUser.first_name,
                previousBalance,
                amount,
                newBalance
            },
            transactionId: transaction?.id
        };
    }


    /**
     * Flag a user account
     * 
     * Requirements: 3.5
     * 
     * @param {string} userId - User UUID
     * @param {string} reason - Reason for flagging
     * @param {string} adminUserId - Admin user ID (to prevent self-flagging)
     * @returns {Promise<Object>} Updated user
     */
    async flagUser(userId, reason, adminUserId = null) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!reason || !reason.trim()) {
            throw new Error('Reason is required for flagging a user');
        }

        // Prevent admin from flagging themselves
        if (adminUserId && userId === adminUserId) {
            return {
                success: false,
                error: 'CANNOT_FLAG_SELF',
                message: 'You cannot flag your own account'
            };
        }

        // Get current user
        const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('id, is_flagged, is_admin, username, first_name')
            .eq('id', userId)
            .single();

        if (fetchError || !currentUser) {
            throw new Error('User not found');
        }

        // Prevent flagging other admins
        if (currentUser.is_admin) {
            return {
                success: false,
                error: 'CANNOT_FLAG_ADMIN',
                message: 'Cannot flag an admin account'
            };
        }

        if (currentUser.is_flagged) {
            return {
                success: false,
                error: 'ALREADY_FLAGGED',
                message: 'User is already flagged'
            };
        }

        // Flag the user
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                is_flagged: true,
                flag_reason: reason.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            throw new Error(`Failed to flag user: ${updateError.message}`);
        }

        // Log the admin action
        await this._logAdminAction(userId, 'user_flagged', {
            reason: reason.trim()
        });

        return {
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                firstName: updatedUser.first_name,
                isFlagged: true,
                flagReason: reason.trim()
            }
        };
    }

    /**
     * Unflag a user account
     * 
     * Requirements: 3.5
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} Updated user
     */
    async unflagUser(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Get current user
        const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('id, is_flagged, flag_reason, username, first_name')
            .eq('id', userId)
            .single();

        if (fetchError || !currentUser) {
            throw new Error('User not found');
        }

        if (!currentUser.is_flagged) {
            return {
                success: false,
                error: 'NOT_FLAGGED',
                message: 'User is not flagged'
            };
        }

        const previousReason = currentUser.flag_reason;

        // Unflag the user
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                is_flagged: false,
                flag_reason: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            throw new Error(`Failed to unflag user: ${updateError.message}`);
        }

        // Log the admin action
        await this._logAdminAction(userId, 'user_unflagged', {
            previousReason
        });

        return {
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                firstName: updatedUser.first_name,
                isFlagged: false,
                previousFlagReason: previousReason
            }
        };
    }

    /**
     * Get system analytics
     * 
     * Requirements: 3.4
     * 
     * @param {Object} dateRange - Date range for analytics
     * @param {string} dateRange.startDate - Start date (ISO string)
     * @param {string} dateRange.endDate - End date (ISO string)
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalytics(dateRange = {}) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { startDate, endDate } = dateRange;

        // Default to last 30 days if no date range provided
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

        const startISO = start.toISOString();
        const endISO = end.toISOString();

        // Get total users count
        const { count: totalUsers, error: totalUsersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (totalUsersError) {
            throw new Error(`Failed to get total users: ${totalUsersError.message}`);
        }

        // Get active users (users who have transactions in the date range)
        const { data: activeUserData, error: activeUsersError } = await supabase
            .from('credit_transactions')
            .select('user_id')
            .gte('created_at', startISO)
            .lte('created_at', endISO);

        if (activeUsersError) {
            throw new Error(`Failed to get active users: ${activeUsersError.message}`);
        }

        const activeUsers = new Set((activeUserData || []).map(t => t.user_id)).size;

        // Get total credits consumed (sum of negative transactions)
        const { data: creditData, error: creditError } = await supabase
            .from('credit_transactions')
            .select('amount')
            .lt('amount', 0)
            .gte('created_at', startISO)
            .lte('created_at', endISO);

        if (creditError) {
            throw new Error(`Failed to get credit data: ${creditError.message}`);
        }

        const totalCreditsConsumed = (creditData || []).reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

        // Get users by tier
        const { data: tierData, error: tierError } = await supabase
            .from('users')
            .select('tier');

        if (tierError) {
            throw new Error(`Failed to get tier data: ${tierError.message}`);
        }

        const usersByTier = {};
        for (const tier of ADMIN_VALID_TIERS) {
            usersByTier[tier] = 0;
        }
        for (const user of (tierData || [])) {
            const tier = user.tier || 'free';
            usersByTier[tier] = (usersByTier[tier] || 0) + 1;
        }

        // Get keys generated in date range
        const { count: keysGenerated, error: keysGenError } = await supabase
            .from('redeem_keys')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startISO)
            .lte('created_at', endISO);

        if (keysGenError) {
            throw new Error(`Failed to get keys generated: ${keysGenError.message}`);
        }

        // Get keys redeemed in date range
        const { count: keysRedeemed, error: keysRedeemedError } = await supabase
            .from('key_redemptions')
            .select('*', { count: 'exact', head: true })
            .gte('redeemed_at', startISO)
            .lte('redeemed_at', endISO);

        if (keysRedeemedError) {
            throw new Error(`Failed to get keys redeemed: ${keysRedeemedError.message}`);
        }

        return {
            dateRange: {
                startDate: startISO,
                endDate: endISO
            },
            totalUsers: totalUsers || 0,
            activeUsers: activeUsers || 0,
            totalCreditsConsumed: Math.round(totalCreditsConsumed * 100) / 100,
            usersByTier,
            keysGenerated: keysGenerated || 0,
            keysRedeemed: keysRedeemed || 0
        };
    }

    /**
     * Get a single user by ID (admin view with full details)
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} User details
     */
    async getUserById(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            telegramId: user.telegram_id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            photoUrl: user.photo_url,
            tier: user.tier,
            creditBalance: parseFloat(user.credit_balance) || 0,
            isFlagged: user.is_flagged || false,
            flagReason: user.flag_reason,
            isAdmin: user.is_admin || false,
            dailyCardsUsed: user.daily_cards_used || 0,
            referralCode: user.referral_code,
            referralCount: user.referral_count || 0,
            referredBy: user.referred_by,
            lastDailyClaim: user.last_daily_claim,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };
    }

    /**
     * Log admin action for audit trail
     * 
     * @private
     * @param {string} targetUserId - User ID being acted upon
     * @param {string} action - Action type
     * @param {Object} details - Action details
     */
    async _logAdminAction(targetUserId, action, details) {
        try {
            await supabase.from('audit_logs').insert({
                user_id: targetUserId,
                action: action,
                details: details
            });
        } catch (error) {
            // Log but don't fail the main operation
        }
    }
}

export default AdminService;
