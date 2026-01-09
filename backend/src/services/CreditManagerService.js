import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';
import { USER_TIERS } from './UserService.js';
import { GatewayConfigCache } from '../infrastructure/cache/GatewayConfigCache.js';
import { getGatewayLabel } from '../utils/constants.js';

/**
 * Transaction types for credit operations
 * Requirement: 3.3
 */
export const TRANSACTION_TYPES = {
    PURCHASE: 'purchase',
    USAGE: 'usage',
    CLAIM: 'claim',
    BONUS: 'bonus',
    REFERRAL: 'referral',
    STARTER: 'starter',
    REFUND: 'refund'
};



/**
 * Calculate credit cost for a single card based on status
 * @param {Object} pricing - Pricing config { approved: number, live: number } (required)
 * @param {string} resultStatus - Result status (approved, live, dead, error, etc.)
 * @returns {number} Credit cost to deduct
 * @throws {Error} If pricing not provided or missing required fields
 */
export function calculateCreditCost(pricing, resultStatus) {
    if (!pricing) {
        throw new Error('Pricing configuration is required');
    }

    if (pricing.approved === undefined || pricing.live === undefined) {
        throw new Error('Pricing must include approved and live rates');
    }

    const statusLower = resultStatus.toLowerCase();

    // Dead/error/captcha/declined are always free
    if (['dead', 'error', 'captcha', 'declined'].includes(statusLower)) {
        return 0;
    }

    // Return fixed cost for status
    if (statusLower === 'approved') {
        return pricing.approved;
    }

    if (statusLower === 'live') {
        return pricing.live;
    }

    return 0;
}

/**
 * Calculate total credit cost for a batch
 * @param {Object} pricing - Pricing config { approved: number, live: number } (required)
 * @param {Object} counts - Status counts { approved: number, live: number }
 * @returns {number} Total credit cost
 * @throws {Error} If pricing not provided or missing required fields
 */
export function calculateBatchCreditCost(pricing, counts) {
    if (!pricing) {
        throw new Error('Pricing configuration is required');
    }

    if (pricing.approved === undefined || pricing.live === undefined) {
        throw new Error('Pricing must include approved and live rates');
    }

    const approvedCount = counts?.approved || 0;
    const liveCount = counts?.live || 0;

    const approvedCost = approvedCount * pricing.approved;
    const liveCost = liveCount * pricing.live;

    return approvedCost + liveCost;
}

/**
 * Credit Manager Service
 * 
 * Core service for credit operations with anti-cheat protections.
 * Handles balance tracking, credit consumption, and transaction logging.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.5, 6.2-6.6, 9.2
 */
export class CreditManagerService {
    constructor() {
        // Gateway config cache with 60-second TTL (Requirement 9.2)
        this._gatewayConfigCache = new GatewayConfigCache(60000);
    }

    /**
     * Get user's current credit balance
     * 
     * Requirement: 3.2
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<number>} Current credit balance
     */
    async getBalance(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('credit_balance')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('User not found');
            }
            throw new Error(`Failed to get balance: ${error.message}`);
        }

        return parseFloat(user.credit_balance) || 0;
    }

    /**
     * Add credits to user account with transaction logging
     * 
     * Requirements: 3.1, 3.3
     * 
     * @param {string} userId - User UUID
     * @param {number} amount - Amount of credits to add (must be positive)
     * @param {string} type - Transaction type (from TRANSACTION_TYPES)
     * @param {Object} options - Additional options
     * @param {string} options.description - Transaction description
     * @param {string} options.reference - External reference (e.g., payment ID)
     * @param {string} options.idempotencyKey - Idempotency key to prevent duplicates
     * @param {string} options.requestId - Request ID for audit
     * @param {string} options.ipAddress - IP address for audit
     * @returns {Promise<Object>} Result with new balance and transaction ID
     */
    async addCredits(userId, amount, type, options = {}) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error('Amount must be a positive number');
        }

        if (!Object.values(TRANSACTION_TYPES).includes(type)) {
            throw new Error(`Invalid transaction type: ${type}`);
        }

        const { description, reference, idempotencyKey, requestId, ipAddress } = options;

        // Check for duplicate idempotency key
        if (idempotencyKey) {
            const { data: existing } = await supabase
                .from('credit_transactions')
                .select('id, amount, balance_after')
                .eq('idempotency_key', idempotencyKey)
                .single();

            if (existing) {
                // Return cached result for idempotent request
                return {
                    success: true,
                    transactionId: existing.id,
                    amount: parseFloat(existing.amount),
                    newBalance: parseFloat(existing.balance_after),
                    duplicate: true
                };
            }
        }

        // Get current balance
        const currentBalance = await this.getBalance(userId);
        const newBalance = currentBalance + amount;

        // Update user balance
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credit_balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            throw new Error(`Failed to update balance: ${updateError.message}`);
        }

        // Create transaction record
        const { data: transaction, error: txError } = await supabase
            .from('credit_transactions')
            .insert({
                user_id: userId,
                amount: amount,
                balance_after: newBalance,
                type: type,
                description: description || null,
                reference: reference || null,
                idempotency_key: idempotencyKey || null,
                request_id: requestId || null,
                ip_address: ipAddress || null
            })
            .select('id')
            .single();

        if (txError) {
            throw new Error(`Failed to create transaction: ${txError.message}`);
        }

        return {
            success: true,
            transactionId: transaction.id,
            amount: amount,
            previousBalance: currentBalance,
            newBalance: newBalance,
            duplicate: false
        };
    }

    /**
     * Deduct credits from user account based on status counts and gateway pricing
     * 
     * New pricing model: Fixed credits per status, no tier multipliers
     * - APPROVED cards: pricing_approved credits each
     * - LIVE cards: pricing_live credits each
     * - DEAD/ERROR/CAPTCHA: Free (0 credits)
     * 
     * Requirements: 3.1, 3.3, 4.5
     * 
     * @param {string} userId - User UUID
     * @param {string} gatewayId - Gateway ID for rate lookup
     * @param {Object|number} statusCounts - Status counts { approved: N, live: M } or legacy liveCardCount
     * @param {Object} options - Additional options
     * @param {string} options.operationId - Operation ID for tracking
     * @param {string} options.description - Transaction description
     * @param {string} options.idempotencyKey - Idempotency key to prevent duplicates
     * @param {string} options.requestId - Request ID for audit
     * @param {string} options.ipAddress - IP address for audit
     * @returns {Promise<Object>} Result with new balance and deduction details
     */
    async deductCredits(userId, gatewayId, statusCounts, options = {}) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!gatewayId) {
            throw new Error('Gateway ID is required');
        }

        // Support legacy liveCardCount (number) or new statusCounts object
        let approvedCount = 0;
        let liveCount = 0;

        if (typeof statusCounts === 'number') {
            // Legacy: treat as liveCount for backward compatibility
            liveCount = statusCounts;
        } else if (typeof statusCounts === 'object' && statusCounts !== null) {
            approvedCount = statusCounts.approved || 0;
            liveCount = statusCounts.live || 0;
        }

        // No deduction needed for 0 billable cards
        if (approvedCount === 0 && liveCount === 0) {
            const currentBalance = await this.getBalance(userId);
            return {
                success: true,
                creditsDeducted: 0,
                newBalance: currentBalance,
                approvedCount: 0,
                liveCount: 0
            };
        }

        const { operationId, description, idempotencyKey, requestId, ipAddress, totalCards, processedCards, wasStopped, stopReason } = options;

        // Check for duplicate idempotency key
        if (idempotencyKey) {
            const { data: existing } = await supabase
                .from('credit_transactions')
                .select('id, amount, balance_after')
                .eq('idempotency_key', idempotencyKey)
                .single();

            if (existing) {
                return {
                    success: true,
                    transactionId: existing.id,
                    creditsDeducted: Math.abs(parseFloat(existing.amount)),
                    newBalance: parseFloat(existing.balance_after),
                    duplicate: true
                };
            }
        }

        // Get user's balance
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('credit_balance')
            .eq('id', userId)
            .single();

        if (userError) {
            if (userError.code === 'PGRST116') {
                throw new Error('User not found');
            }
            throw new Error(`Failed to get user: ${userError.message}`);
        }

        const currentBalance = parseFloat(user.credit_balance) || 0;

        // Get gateway pricing config
        const pricing = await this.getGatewayPricing(gatewayId);

        // Calculate total credits: (approved × pricing_approved) + (live × pricing_live)
        const creditsToDeduct = calculateBatchCreditCost(pricing, { approved: approvedCount, live: liveCount });

        // Skip DB insert if no credits to deduct
        if (creditsToDeduct === 0) {
            return {
                success: true,
                creditsDeducted: 0,
                newBalance: currentBalance,
                approvedCount,
                liveCount,
                pricing,
                skipped: true
            };
        }

        // Check if sufficient balance (Requirement 3.1 - non-negative balance)
        if (currentBalance < creditsToDeduct) {
            return {
                success: false,
                error: 'CREDIT_INSUFFICIENT',
                message: 'Insufficient credits',
                currentBalance: currentBalance,
                requiredCredits: creditsToDeduct,
                pricing
            };
        }

        const newBalance = currentBalance - creditsToDeduct;

        // Update user balance
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credit_balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            throw new Error(`Failed to update balance: ${updateError.message}`);
        }

        // Create transaction record (negative amount for deduction)
        const txDescription = description ||
            `${approvedCount} APPROVED + ${liveCount} LIVE via ${getGatewayLabel(gatewayId)} (${creditsToDeduct} credits)`;

        const { data: transaction, error: txError } = await supabase
            .from('credit_transactions')
            .insert({
                user_id: userId,
                amount: -creditsToDeduct,
                balance_after: newBalance,
                type: TRANSACTION_TYPES.USAGE,
                gateway_id: gatewayId,
                description: txDescription,
                reference: operationId || null,
                idempotency_key: idempotencyKey || null,
                request_id: requestId || null,
                ip_address: ipAddress || null,
                // Batch tracking fields
                total_cards: totalCards || null,
                processed_cards: processedCards || null,
                was_stopped: wasStopped || false,
                stop_reason: stopReason || null
            })
            .select('id')
            .single();

        if (txError) {
            throw new Error(`Failed to create transaction: ${txError.message}`);
        }

        return {
            success: true,
            transactionId: transaction.id,
            creditsDeducted: creditsToDeduct,
            previousBalance: currentBalance,
            newBalance: newBalance,
            approvedCount,
            liveCount,
            pricing,
            duplicate: false
        };
    }

    /**
     * Get gateway pricing config
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Promise<Object>} Pricing { approved: number, live: number }
     * @throws {Error} If pricing not configured
     */
    async getGatewayPricing(gatewayId) {
        const config = await this.getGatewayConfig(gatewayId);

        if (!config) {
            throw new Error(`Gateway configuration not found: ${gatewayId}`);
        }

        if (config.pricing_approved === undefined || config.pricing_live === undefined) {
            throw new Error(`Pricing not configured for gateway: ${gatewayId}`);
        }

        return {
            approved: config.pricing_approved,
            live: config.pricing_live
        };
    }

    /**
     * Deduct credits for a single card in real-time during batch processing
     * Used to stop batch immediately when credits run out
     * 
     * @param {string} userId - User UUID
     * @param {string} gatewayId - Gateway ID for rate lookup
     * @param {string} statusType - 'approved' or 'live'
     * @returns {Promise<Object>} Result with new balance, or error if insufficient
     */
    async deductSingleCardCredit(userId, gatewayId, statusType) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId || !gatewayId) {
            throw new Error('User ID and Gateway ID are required');
        }

        // Get pricing for this status type
        const pricing = await this.getGatewayPricing(gatewayId);
        const creditCost = statusType === 'approved' ? pricing.approved : pricing.live;

        // Get current balance
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('credit_balance')
            .eq('id', userId)
            .single();

        if (userError) {
            throw new Error(`Failed to get user: ${userError.message}`);
        }

        const currentBalance = parseFloat(user.credit_balance) || 0;

        // Check if sufficient balance
        if (currentBalance < creditCost) {
            return {
                success: false,
                error: 'CREDIT_EXHAUSTED',
                message: 'Credits exhausted - stopping batch',
                currentBalance,
                requiredCredits: creditCost,
                shouldStop: true
            };
        }

        const newBalance = currentBalance - creditCost;

        // Atomic balance update
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credit_balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .eq('credit_balance', currentBalance); // Optimistic lock

        if (updateError) {
            // Retry on concurrent update
            return this.deductSingleCardCredit(userId, gatewayId, statusType);
        }

        return {
            success: true,
            creditsDeducted: creditCost,
            previousBalance: currentBalance,
            newBalance,
            statusType,
            shouldStop: false
        };
    }

    /**
     * Record a batch transaction summary to credit_transactions table
     * Called after batch completion (success, stopped, or credit exhausted)
     * 
     * This is used when deductSingleCardCredit is used for real-time deduction
     * to ensure transaction history is recorded.
     * 
     * @param {string} userId - User UUID
     * @param {string} gatewayId - Gateway ID
     * @param {Object} batchStats - Batch statistics
     * @param {number} batchStats.totalCreditsDeducted - Total credits deducted during batch
     * @param {number} batchStats.approvedCount - Number of approved cards
     * @param {number} batchStats.liveCount - Number of live cards (3DS, live declines)
     * @param {number} batchStats.totalCards - Total cards in batch
     * @param {number} batchStats.processedCards - Cards actually processed
     * @param {number} batchStats.currentBalance - Final balance after batch
     * @param {boolean} batchStats.wasStopped - Whether batch was stopped early
     * @param {string} batchStats.stopReason - Reason for stopping (user_cancelled, credit_exhausted, error, completed)
     * @returns {Promise<Object>} Transaction record result
     */
    async recordBatchTransaction(userId, gatewayId, batchStats) {
        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Database not configured' };
        }

        if (!userId || !gatewayId) {
            return { success: false, error: 'User ID and Gateway ID required' };
        }

        const {
            totalCreditsDeducted = 0,
            approvedCount = 0,
            liveCount = 0,
            totalCards = 0,
            processedCards = 0,
            currentBalance = 0,
            wasStopped = false,
            stopReason = 'completed'
        } = batchStats;

        try {
            // Skip recording if no credits were deducted (0 billable cards)
            if (totalCreditsDeducted === 0) {
                return {
                    success: true,
                    transactionId: null,
                    creditsDeducted: 0,
                    description: 'No billable cards - transaction not recorded',
                    skipped: true
                };
            }

            // Build compact description: "X APPROVED + Y LIVE (Z cards) via Gateway"
            // Stopped batches show processed/total cards
            const gatewayLabel = getGatewayLabel(gatewayId);
            const cardsInfo = wasStopped ? `${processedCards}/${totalCards}` : `${processedCards}`;
            const description = `${approvedCount} APPROVED + ${liveCount} LIVE (${cardsInfo} cards) via ${gatewayLabel}`;

            const { data: transaction, error } = await supabase
                .from('credit_transactions')
                .insert({
                    user_id: userId,
                    amount: -totalCreditsDeducted,
                    balance_after: currentBalance,
                    type: TRANSACTION_TYPES.USAGE,
                    gateway_id: gatewayId,
                    description,
                    total_cards: totalCards,
                    processed_cards: processedCards,
                    was_stopped: wasStopped,
                    stop_reason: stopReason
                })
                .select('id')
                .single();

            if (error) {
                console.error('[CreditManagerService] Failed to record batch transaction:', error.message);
                return { success: false, error: error.message };
            }

            return {
                success: true,
                transactionId: transaction.id,
                creditsDeducted: totalCreditsDeducted,
                description
            };
        } catch (error) {
            console.error('[CreditManagerService] Error recording batch transaction:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if user has sufficient credits for at least one more card
     * Used for real-time stopping during batch processing
     * 
     * @param {string} userId - User UUID
     * @param {string} gatewayId - Gateway ID for rate lookup
     * @param {string} statusType - 'approved' or 'live'
     * @returns {Promise<Object>} Result with canContinue flag
     */
    async canProcessNextCard(userId, gatewayId, statusType = 'live') {
        if (!isSupabaseConfigured()) {
            return { canContinue: true, balance: 0 }; // Skip check if no DB
        }

        try {
            const pricing = await this.getGatewayPricing(gatewayId);
            const creditCost = statusType === 'approved' ? pricing.approved : pricing.live;
            const balance = await this.getBalance(userId);

            return {
                canContinue: balance >= creditCost,
                balance,
                creditCost,
                shortfall: balance < creditCost ? creditCost - balance : 0
            };
        } catch (error) {

            return { canContinue: true, balance: 0 }; // Allow on error to not block
        }
    }

    /**
     * Get transaction history for a user
     * 
     * Requirement: 3.4
     * 
     * @param {string} userId - User UUID
     * @param {Object} options - Query options
     * @param {number} options.limit - Max records to return (default 50)
     * @param {number} options.offset - Offset for pagination (default 0)
     * @param {string} options.type - Filter by transaction type
     * @param {string} options.startDate - Filter by start date (ISO string)
     * @param {string} options.endDate - Filter by end date (ISO string)
     * @returns {Promise<Object>} Transaction history with pagination info
     */
    async getTransactionHistory(userId, options = {}) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        const {
            limit = 50,
            offset = 0,
            type = null,
            startDate = null,
            endDate = null
        } = options;

        // Build query
        let query = supabase
            .from('credit_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Apply filters
        if (type) {
            query = query.eq('type', type);
        }

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data: transactions, error, count } = await query;

        if (error) {
            throw new Error(`Failed to get transaction history: ${error.message}`);
        }

        return {
            transactions: transactions || [],
            total: count || 0,
            limit: limit,
            offset: offset,
            hasMore: (offset + (transactions?.length || 0)) < (count || 0)
        };
    }

    /**
     * Check if user has sufficient credits for an operation
     * 
     * New pricing model: Uses max rate (pricing_approved) for estimation
     * since we don't know upfront which cards will pass
     * 
     * Requirement: 4.3
     * 
     * @param {string} userId - User UUID
     * @param {string} gatewayId - Gateway ID
     * @param {number} cardCount - Number of cards (potential max billable)
     * @returns {Promise<Object>} Credit check result
     */
    async checkSufficientCredits(userId, gatewayId, cardCount) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Get user balance
        const { data: user, error } = await supabase
            .from('users')
            .select('credit_balance, tier')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('User not found');
            }
            throw new Error(`Failed to get user: ${error.message}`);
        }

        const currentBalance = parseFloat(user.credit_balance) || 0;
        const userTier = user.tier || 'free';

        // Get gateway pricing - use max rate (pricing_approved) for estimation
        const pricing = await this.getGatewayPricing(gatewayId);
        const maxRate = Math.max(pricing.approved, pricing.live);
        const requiredCredits = cardCount * maxRate;

        return {
            sufficient: currentBalance >= requiredCredits,
            currentBalance: currentBalance,
            requiredCredits: requiredCredits,
            pricing,
            tier: userTier
        };
    }

    /**
     * Get gateway configuration (with caching)
     * 
     * Uses GatewayConfigCache for TTL-based caching (60 seconds).
     * Requirement: 9.2
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Promise<Object>} Gateway config
     * @throws {Error} If database not configured or gateway not found
     */
    async getGatewayConfig(gatewayId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured - gateway configuration unavailable');
        }

        // Check cache first (Requirement 9.2 - 60 second TTL)
        const cachedConfig = this._gatewayConfigCache.get(gatewayId);
        if (cachedConfig !== null && cachedConfig !== undefined) {
            return cachedConfig;
        }

        // Check if we have any cached data (bulk retrieval optimization)
        const allCached = this._gatewayConfigCache.getAll();
        if (Object.keys(allCached).length > 0) {
            // Cache exists but this gateway isn't in it
            throw new Error(`Gateway configuration not found: ${gatewayId}`);
        }

        // Refresh cache from database
        const { data: configs, error } = await supabase
            .from('gateway_configs')
            .select('*');

        if (error) {
            throw new Error(`Failed to fetch gateway configurations: ${error.message}`);
        }

        if (!configs || configs.length === 0) {
            throw new Error('No gateway configurations found in database');
        }

        // Build cache map and store all configs
        const cacheEntries = {};
        for (const config of configs) {
            cacheEntries[config.gateway_id] = config;
        }
        this._gatewayConfigCache.setAll(cacheEntries);

        const gatewayConfig = cacheEntries[gatewayId];
        if (!gatewayConfig) {
            throw new Error(`Gateway configuration not found: ${gatewayId}`);
        }

        return gatewayConfig;
    }

    /**
     * Get all active gateway configurations
     * 
     * @returns {Promise<Array>} Array of active gateway configs
     * @throws {Error} If database not configured or query fails
     */
    async getActiveGateways() {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured - gateway configurations unavailable');
        }

        const { data: configs, error } = await supabase
            .from('gateway_configs')
            .select('*')
            .eq('is_active', true);

        if (error) {
            throw new Error(`Failed to get gateway configs: ${error.message}`);
        }

        if (!configs || configs.length === 0) {
            throw new Error('No active gateway configurations found in database');
        }

        return configs;
    }

    /**
     * Invalidate gateway config cache
     * Called when gateway configs are updated
     * 
     * Requirement: 9.2 - Cache invalidation on config updates
     * 
     * @param {string} [gatewayId] - Optional specific gateway to invalidate (clears all if not provided)
     */
    invalidateGatewayCache(gatewayId) {
        this._gatewayConfigCache.invalidate(gatewayId);
    }

    /**
     * Claim daily free credits for free-tier users
     * 
     * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} Claim result with new balance or error
     */
    async claimDailyCredits(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Get user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, credit_balance, tier, last_daily_claim')
            .eq('id', userId)
            .single();

        if (userError) {
            if (userError.code === 'PGRST116') {
                throw new Error('User not found');
            }
            throw new Error(`Failed to get user: ${userError.message}`);
        }

        // Get tier config for claim amount
        const tierConfig = USER_TIERS[user.tier] || USER_TIERS.free;

        // Requirement 7.4: Check if already claimed today
        const now = new Date();
        const todayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));

        if (user.last_daily_claim) {
            const lastClaimDate = new Date(user.last_daily_claim);
            const lastClaimTimestamp = lastClaimDate.getTime();
            const nowTimestamp = now.getTime();
            const hoursSinceLastClaim = (nowTimestamp - lastClaimTimestamp) / (1000 * 60 * 60);
            
            // Require minimum 20 hours between claims (allows some flexibility around midnight)
            const MIN_HOURS_BETWEEN_CLAIMS = 20;
            
            if (hoursSinceLastClaim < MIN_HOURS_BETWEEN_CLAIMS) {
                const nextClaimTime = new Date(lastClaimTimestamp + (MIN_HOURS_BETWEEN_CLAIMS * 60 * 60 * 1000));
                const timeUntilNextClaim = nextClaimTime.getTime() - nowTimestamp;

                return {
                    success: false,
                    error: 'CREDIT_ALREADY_CLAIMED',
                    message: 'Already claimed today',
                    lastClaim: user.last_daily_claim,
                    nextClaimAvailable: nextClaimTime,
                    timeUntilNextClaim: timeUntilNextClaim
                };
            }
        }

        // Get daily claim amount from tier config (tierConfig already defined above)
        const claimAmount = tierConfig.dailyClaim || 10;

        const currentBalance = parseFloat(user.credit_balance) || 0;
        const newBalance = currentBalance + claimAmount;
        const claimTimestamp = now.toISOString();

        // Requirement 7.2: Update user balance and record claim timestamp
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credit_balance: newBalance,
                last_daily_claim: claimTimestamp,
                updated_at: claimTimestamp
            })
            .eq('id', userId);

        if (updateError) {
            throw new Error(`Failed to update balance: ${updateError.message}`);
        }

        // Create transaction record
        const { data: transaction, error: txError } = await supabase
            .from('credit_transactions')
            .insert({
                user_id: userId,
                amount: claimAmount,
                balance_after: newBalance,
                type: TRANSACTION_TYPES.CLAIM,
                description: 'Daily free credits claim'
            })
            .select('id')
            .single();

        if (txError) {
            throw new Error(`Failed to create transaction: ${txError.message}`);
        }

        // Calculate next claim time (Requirement 7.3: midnight UTC)
        const nextClaimTime = this._getNextMidnightUTC();
        const timeUntilNextClaim = new Date(nextClaimTime).getTime() - now.getTime();

        return {
            success: true,
            transactionId: transaction.id,
            amount: claimAmount,
            previousBalance: currentBalance,
            newBalance: newBalance,
            claimedAt: claimTimestamp,
            nextClaimAvailable: nextClaimTime,
            timeUntilNextClaim: timeUntilNextClaim
        };
    }

    /**
     * Check daily claim eligibility for a user
     * 
     * Requirements: 7.1, 7.4, 7.5, 7.6
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} Eligibility status with time until next claim
     */
    async getDailyClaimStatus(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Get user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('tier, last_daily_claim')
            .eq('id', userId)
            .single();

        if (userError) {
            if (userError.code === 'PGRST116') {
                throw new Error('User not found');
            }
            throw new Error(`Failed to get user: ${userError.message}`);
        }

        const now = new Date();
        const nowTimestamp = now.getTime();

        // Get tier-specific claim amount
        const tierConfig = USER_TIERS[user.tier] || USER_TIERS.free;
        const claimAmount = tierConfig.dailyClaim || 10;

        // Minimum 20 hours between claims (matches claimDailyCredits logic)
        const MIN_HOURS_BETWEEN_CLAIMS = 20;

        // Check if already claimed within the minimum window
        if (user.last_daily_claim) {
            const lastClaimDate = new Date(user.last_daily_claim);
            const lastClaimTimestamp = lastClaimDate.getTime();
            const hoursSinceLastClaim = (nowTimestamp - lastClaimTimestamp) / (1000 * 60 * 60);

            if (hoursSinceLastClaim < MIN_HOURS_BETWEEN_CLAIMS) {
                const nextClaimTime = new Date(lastClaimTimestamp + (MIN_HOURS_BETWEEN_CLAIMS * 60 * 60 * 1000));
                const timeUntilNextClaim = nextClaimTime.getTime() - nowTimestamp;
                
                return {
                    canClaim: false,
                    reason: 'CREDIT_ALREADY_CLAIMED',
                    message: 'Already claimed today',
                    tier: user.tier,
                    claimAmount: claimAmount,
                    lastClaim: user.last_daily_claim,
                    nextClaimAvailable: nextClaimTime.toISOString(),
                    timeUntilNextClaim: timeUntilNextClaim
                };
            }
        }

        // User is eligible to claim
        // Calculate when next claim would be available after claiming now
        const nextClaimAfterClaiming = new Date(nowTimestamp + (MIN_HOURS_BETWEEN_CLAIMS * 60 * 60 * 1000));
        
        return {
            canClaim: true,
            tier: user.tier,
            claimAmount: claimAmount,
            lastClaim: user.last_daily_claim,
            nextClaimAvailable: nextClaimAfterClaiming.toISOString(),
            timeUntilNextClaim: 0
        };
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

    /**
     * Get credit summary for a user
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} Credit summary with balance and recent activity
     */
    async getCreditSummary(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Get user balance and tier
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('credit_balance, tier, last_daily_claim')
            .eq('id', userId)
            .single();

        if (userError) {
            if (userError.code === 'PGRST116') {
                throw new Error('User not found');
            }
            throw new Error(`Failed to get user: ${userError.message}`);
        }

        // Get recent transactions (last 5)
        const { data: recentTx } = await supabase
            .from('credit_transactions')
            .select('amount, type, created_at, description')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        // Calculate totals for current month
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        const { data: monthlyTx } = await supabase
            .from('credit_transactions')
            .select('amount, type')
            .eq('user_id', userId)
            .gte('created_at', startOfMonth.toISOString());

        let monthlySpent = 0;
        let monthlyEarned = 0;

        for (const tx of (monthlyTx || [])) {
            const amount = parseFloat(tx.amount);
            if (amount < 0) {
                monthlySpent += Math.abs(amount);
            } else {
                monthlyEarned += amount;
            }
        }

        const tierConfig = USER_TIERS[user.tier] || USER_TIERS.free;

        return {
            balance: parseFloat(user.credit_balance) || 0,
            tier: user.tier,
            tierMultiplier: tierConfig.multiplier,
            lastDailyClaim: user.last_daily_claim,
            recentTransactions: recentTx || [],
            monthlySpent: Math.round(monthlySpent * 100) / 100,
            monthlyEarned: Math.round(monthlyEarned * 100) / 100
        };
    }

    /**
     * Check idempotency key and return cached result if exists
     * 
     * Requirement: 13.12
     * 
     * @param {string} idempotencyKey - Unique idempotency key
     * @returns {Promise<Object|null>} Cached transaction result or null
     */
    async checkIdempotencyKey(idempotencyKey) {
        if (!idempotencyKey) {
            return null;
        }

        if (!isSupabaseConfigured()) {
            return null;
        }

        const { data: existing, error } = await supabase
            .from('credit_transactions')
            .select('id, amount, balance_after, type, created_at')
            .eq('idempotency_key', idempotencyKey)
            .single();

        if (error && error.code !== 'PGRST116') {

        }

        if (existing) {
            return {
                found: true,
                transactionId: existing.id,
                amount: parseFloat(existing.amount),
                balanceAfter: parseFloat(existing.balance_after),
                type: existing.type,
                createdAt: existing.created_at
            };
        }

        return null;
    }
}


export default CreditManagerService;
