import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';
import crypto from 'crypto';

/**
 * User Tiers Configuration
 * Defines rate multipliers per tier
 * 
 * Requirements: 6.2-6.6
 */
export const USER_TIERS = {
    free: { multiplier: 1.0, dailyClaim: 10 },
    bronze: { multiplier: 0.95, dailyClaim: 15 },
    silver: { multiplier: 0.85, dailyClaim: 20 },
    gold: { multiplier: 0.70, dailyClaim: 30 },
    diamond: { multiplier: 0.50, dailyClaim: 30 }
};

/**
 * Starter credits for new users
 * Requirement: 9.1
 */
export const STARTER_CREDITS = 25;

/**
 * Referral bonus credits
 * Requirement: 9.3
 */
export const REFERRAL_CREDITS = 15;

/**
 * Maximum referrals per user (150 credits max)
 * Requirement: 9.4
 */
export const MAX_REFERRALS = 10;

/**
 * User Service
 * Handles user account management, tier operations, and daily usage tracking
 * 
 * Requirements: 9.1, 9.2, 6.2-6.6, 11.2, 9.3, 9.4, 9.5
 */
export class UserService {
    constructor() {
        // Service is stateless, uses Supabase client directly
    }

    /**
     * Get user by ID
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object|null>} User object or null if not found
     */
    async getUser(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            return null;
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null;
            }
            throw new Error(`Failed to get user: ${error.message}`);
        }

        return user;
    }

    /**
     * Get user by Telegram ID
     * 
     * @param {number} telegramId - Telegram user ID
     * @returns {Promise<Object|null>} User object or null if not found
     */
    async getUserByTelegramId(telegramId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!telegramId) {
            return null;
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null;
            }
            throw new Error(`Failed to get user by Telegram ID: ${error.message}`);
        }

        return user;
    }

    /**
     * Create a new user with starter credits and free tier
     * 
     * Requirements: 9.1, 9.2
     * 
     * @param {Object} telegramData - Telegram auth data
     * @param {string} referrerId - Optional referrer user ID
     * @returns {Promise<Object>} Created user object
     */
    async createUser(telegramData, referrerId = null) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!telegramData || !telegramData.id || !telegramData.first_name) {
            throw new Error('Invalid Telegram data: id and first_name required');
        }

        const telegramId = parseInt(telegramData.id, 10);

        // Check if user already exists
        const existingUser = await this.getUserByTelegramId(telegramId);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Generate unique referral code
        const referralCode = this._generateReferralCode();

        // Validate referrer if provided
        let validReferrerId = null;
        if (referrerId) {
            const referrer = await this.getUser(referrerId);
            if (referrer && referrer.referral_count < MAX_REFERRALS) {
                validReferrerId = referrerId;
            }
        }

        // Create user with starter credits (Requirement 9.1) and free tier (Requirement 9.2)
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                telegram_id: telegramId,
                username: telegramData.username || null,
                first_name: telegramData.first_name,
                last_name: telegramData.last_name || null,
                photo_url: telegramData.photo_url || null,
                tier: 'free',
                credit_balance: STARTER_CREDITS,
                referral_code: referralCode,
                referred_by: validReferrerId,
                referral_count: 0,
                daily_cards_used: 0,
                is_flagged: false
            })
            .select()
            .single();

        if (createError) {
            throw new Error(`Failed to create user: ${createError.message}`);
        }

        // Record starter credits transaction
        await supabase.from('credit_transactions').insert({
            user_id: newUser.id,
            amount: STARTER_CREDITS,
            balance_after: STARTER_CREDITS,
            type: 'starter',
            description: 'Welcome bonus credits'
        });

        // Grant referral credits to referrer if valid (Requirement 9.3)
        if (validReferrerId) {
            await this._grantReferralCredits(validReferrerId, newUser.id);
        }

        return newUser;
    }

    /**
     * Get user's daily usage statistics
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} Daily usage info
     */
    async getDailyUsage(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const cardsUsed = user.daily_cards_used || 0;

        return {
            cardsUsed,
            tier: user.tier
        };
    }

    /**
     * Increment daily usage counter
     * 
     * @param {string} userId - User UUID
     * @param {number} count - Number of cards to add to usage
     * @returns {Promise<Object>} Updated usage info
     */
    async incrementDailyUsage(userId, count = 1) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (count < 0) {
            throw new Error('Count must be non-negative');
        }

        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if we need to reset daily counter (new day)
        const shouldReset = this._shouldResetDailyCounter(user.updated_at);
        const currentUsage = shouldReset ? 0 : (user.daily_cards_used || 0);
        const newUsage = currentUsage + count;

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({
                daily_cards_used: newUsage,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update daily usage: ${error.message}`);
        }

        return this.getDailyUsage(userId);
    }

    /**
     * Check if user can perform an operation
     * 
     * @param {string} userId - User UUID
     * @param {number} cardCount - Number of cards in the operation
     * @returns {Promise<Object>} Result with canPerform flag and details
     */
    async canPerformOperation(userId, cardCount = 1) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const user = await this.getUser(userId);
        if (!user) {
            return { canPerform: false, reason: 'User not found' };
        }

        // Check if user is flagged
        if (user.is_flagged) {
            return { canPerform: false, reason: 'Account suspended' };
        }

        return { canPerform: true };
    }

    /**
     * Get user by referral code
     * 
     * @param {string} referralCode - Referral code
     * @returns {Promise<Object|null>} User object or null
     */
    async getUserByReferralCode(referralCode) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!referralCode) {
            return null;
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('referral_code', referralCode.toUpperCase())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to get user by referral code: ${error.message}`);
        }

        return user;
    }

    /**
     * Process referral when a new user signs up with a referral code
     * 
     * Requirements: 9.3, 9.4, 9.5
     * 
     * @param {string} referralCode - Referral code used during signup
     * @param {string} newUserId - ID of the new user
     * @returns {Promise<Object>} Result of referral processing
     */
    async processReferral(referralCode, newUserId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const referrer = await this.getUserByReferralCode(referralCode);
        if (!referrer) {
            return { success: false, error: 'Invalid referral code' };
        }

        // Check referral limit (Requirement 9.4)
        if (referrer.referral_count >= MAX_REFERRALS) {
            return { success: false, error: 'Referrer has reached maximum referrals' };
        }

        // Get new user to check for self-referral
        const newUser = await this.getUser(newUserId);
        if (!newUser) {
            return { success: false, error: 'New user not found' };
        }

        // Prevent self-referral
        if (referrer.id === newUserId || referrer.telegram_id === newUser.telegram_id) {
            return { success: false, error: 'Cannot use your own referral code' };
        }

        // Check referrer account age (at least 1 hour old)
        const referrerCreatedAt = new Date(referrer.created_at);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (referrerCreatedAt >= oneHourAgo) {
            return { success: false, error: 'Referrer account too new' };
        }

        // Update new user's referred_by field
        const { error: updateError } = await supabase
            .from('users')
            .update({ referred_by: referrer.id })
            .eq('id', newUserId);

        if (updateError) {
            return { success: false, error: `Failed to update referral: ${updateError.message}` };
        }

        // Grant referral credits
        await this._grantReferralCredits(referrer.id, newUserId);

        return { success: true, referrerId: referrer.id };
    }

    /**
     * Get referral statistics for a user
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} Referral stats
     */
    async getReferralStats(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Count referred users
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', userId);

        if (error) {
            throw new Error(`Failed to get referral stats: ${error.message}`);
        }

        const referralCount = count || 0;
        const creditsEarned = referralCount * REFERRAL_CREDITS;
        const remainingReferrals = Math.max(0, MAX_REFERRALS - referralCount);

        return {
            referralCode: user.referral_code,
            referralCount,
            creditsEarned,
            maxReferrals: MAX_REFERRALS,
            remainingReferrals,
            canEarnMore: referralCount < MAX_REFERRALS
        };
    }

    /**
     * Update user profile
     * 
     * @param {string} userId - User UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, updates) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Only allow certain fields to be updated
        const allowedFields = ['username', 'first_name', 'last_name', 'photo_url'];
        const sanitizedUpdates = {};
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                sanitizedUpdates[field] = updates[field];
            }
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            throw new Error('No valid fields to update');
        }

        sanitizedUpdates.updated_at = new Date().toISOString();

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(sanitizedUpdates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }

        return updatedUser;
    }

    /**
     * Get tier configuration for a user
     * 
     * @param {string} tier - Tier name
     * @returns {Object} Tier configuration
     */
    getTierConfig(tier) {
        return USER_TIERS[tier] || USER_TIERS.free;
    }

    /**
     * Reset daily usage for all users (called by cron job at midnight UTC)
     * 
     * Requirement: 6.7
     * 
     * @returns {Promise<number>} Number of users reset
     */
    async resetAllDailyUsage() {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { data, error } = await supabase
            .from('users')
            .update({ daily_cards_used: 0 })
            .gt('daily_cards_used', 0)
            .select('id');

        if (error) {
            throw new Error(`Failed to reset daily usage: ${error.message}`);
        }

        return data?.length || 0;
    }

    /**
     * Flag a user account for suspicious activity
     * 
     * Requirements: 11.4, 11.5
     * 
     * @param {string} userId - User UUID
     * @param {string} reason - Reason for flagging
     * @returns {Promise<Object>} Updated user
     */
    async flagAccount(userId, reason) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID required');
        }

        if (!reason) {
            throw new Error('Flag reason required');
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({
                is_flagged: true,
                flag_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to flag account: ${error.message}`);
        }

        // Log the flagging action
        await supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'account_flagged',
            details: { reason }
        });

        return updatedUser;
    }

    /**
     * Unflag a user account after review
     * 
     * Requirement: 11.5
     * 
     * @param {string} userId - User UUID
     * @param {string} reviewNote - Note from reviewer
     * @returns {Promise<Object>} Updated user
     */
    async unflagAccount(userId, reviewNote = '') {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID required');
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({
                is_flagged: false,
                flag_reason: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to unflag account: ${error.message}`);
        }

        // Log the unflagging action
        await supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'account_unflagged',
            details: { review_note: reviewNote }
        });

        return updatedUser;
    }

    /**
     * Check if a user account is flagged
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} Flag status and reason
     */
    async getAccountFlagStatus(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return {
            isFlagged: user.is_flagged || false,
            reason: user.flag_reason || null
        };
    }

    // ==================== Private Methods ====================

    /**
     * Grant referral credits to referrer
     * 
     * Requirements: 9.3, 9.4
     * 
     * @private
     * @param {string} referrerId - Referrer user ID
     * @param {string} referredUserId - New user ID
     */
    async _grantReferralCredits(referrerId, referredUserId) {
        const referrer = await this.getUser(referrerId);
        if (!referrer) {
            return;
        }

        // Check referral limit (Requirement 9.4)
        if (referrer.referral_count >= MAX_REFERRALS) {
            return;
        }

        const newBalance = parseFloat(referrer.credit_balance) + REFERRAL_CREDITS;

        // Update referrer's balance and referral count
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credit_balance: newBalance,
                referral_count: (referrer.referral_count || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', referrerId);

        if (updateError) {

            return;
        }

        // Record referral credit transaction
        await supabase.from('credit_transactions').insert({
            user_id: referrerId,
            amount: REFERRAL_CREDITS,
            balance_after: newBalance,
            type: 'referral',
            description: `Referral bonus for user ${referredUserId}`
        });
    }

    /**
     * Generate a unique referral code
     * 
     * @private
     * @returns {string} 8-character alphanumeric code
     */
    _generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Check if daily counter should be reset (new UTC day)
     * 
     * @private
     * @param {string} lastUpdated - ISO timestamp of last update
     * @returns {boolean} True if counter should be reset
     */
    _shouldResetDailyCounter(lastUpdated) {
        if (!lastUpdated) {
            return true;
        }

        const lastDate = new Date(lastUpdated);
        const now = new Date();

        // Compare UTC dates
        const lastUTCDate = new Date(Date.UTC(
            lastDate.getUTCFullYear(),
            lastDate.getUTCMonth(),
            lastDate.getUTCDate()
        ));

        const nowUTCDate = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));

        return nowUTCDate > lastUTCDate;
    }

    /**
     * Get next midnight UTC timestamp
     * 
     * @private
     * @returns {string} ISO timestamp of next midnight UTC
     */
    _getNextMidnightUTC() {
        const now = new Date();
        const tomorrow = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0, 0, 0, 0
        ));
        return tomorrow.toISOString();
    }
}

export default UserService;
