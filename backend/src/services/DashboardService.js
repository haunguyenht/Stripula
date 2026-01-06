import { EventEmitter } from 'events';
import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';

/**
 * Online threshold in milliseconds (5 minutes)
 * Users active within this threshold are considered online
 */
export const ONLINE_THRESHOLD = 5 * 60 * 1000;

/**
 * Cache TTL in milliseconds (30 seconds)
 */
export const CACHE_TTL = 30000;

/**
 * DashboardService
 * 
 * Central service for dashboard data aggregation, caching, and real-time updates.
 * Provides personal stats, global stats, leaderboard, and online users data.
 * 
 * Requirements:
 * - 1.1, 1.2: Personal statistics display
 * - 2.1, 2.2: Global statistics display
 * - 3.1, 3.2: Platform overview statistics
 * - 5.1: Top carders leaderboard
 * - 6.1: Online users list
 */
export class DashboardService extends EventEmitter {
    constructor(options = {}) {
        super();
        this.supabase = options.supabase || supabase;
        this.sseClients = new Set();
        this.statsCache = null;
        this.statsCacheExpiry = null;
        this.CACHE_TTL = options.cacheTTL || CACHE_TTL;
    }

    // ==================== Personal Stats Methods ====================

    /**
     * Get personal statistics for a user
     * 
     * Requirements: 1.1, 1.2
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} Personal stats { totalCards, totalHits }
     */
    async getPersonalStats(userId) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID required');
        }

        const { data: user, error } = await this.supabase
            .from('users')
            .select('total_cards_checked, total_hits, daily_cards_used, daily_hits, daily_stats_reset_at')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('User not found');
            }
            throw new Error(`Failed to get personal stats: ${error.message}`);
        }

        // Check if daily stats should be reset (new day)
        const shouldReset = this._shouldResetDailyStats(user.daily_stats_reset_at);

        return {
            totalCards: user.total_cards_checked || 0,
            totalHits: user.total_hits || 0,
            cardsToday: shouldReset ? 0 : (user.daily_cards_used || 0),
            hitsToday: shouldReset ? 0 : (user.daily_hits || 0)
        };
    }

    /**
     * Check if daily stats should be reset (new day in UTC)
     * @private
     */
    _shouldResetDailyStats(lastResetAt) {
        if (!lastResetAt) return true;
        
        const lastReset = new Date(lastResetAt);
        const now = new Date();
        
        // Compare dates in UTC
        return lastReset.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);
    }

    // ==================== Global Stats Methods ====================

    /**
     * Get global platform statistics with caching
     * 
     * Requirements: 2.1, 2.2, 3.1, 3.2
     * 
     * @returns {Promise<Object>} Global stats { totalMembers, onlineCount, totalCards, totalHits }
     */
    async getGlobalStats() {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        // Check cache validity
        const now = Date.now();
        if (this.statsCache && this.statsCacheExpiry && now < this.statsCacheExpiry) {
            return this.statsCache;
        }

        // Fetch from platform_stats table
        const { data: platformStats, error: statsError } = await this.supabase
            .from('platform_stats')
            .select('total_members, total_cards_checked, total_hits')
            .eq('id', 1)
            .single();

        if (statsError) {
            throw new Error(`Failed to get platform stats: ${statsError.message}`);
        }

        // Get online users count
        const onlineThreshold = new Date(now - ONLINE_THRESHOLD).toISOString();
        const { count: onlineCount, error: onlineError } = await this.supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('last_active_at', onlineThreshold);

        if (onlineError) {
            throw new Error(`Failed to get online count: ${onlineError.message}`);
        }

        const stats = {
            totalMembers: platformStats?.total_members || 0,
            onlineCount: onlineCount || 0,
            totalCards: platformStats?.total_cards_checked || 0,
            totalHits: platformStats?.total_hits || 0
        };

        // Update cache
        this.statsCache = stats;
        this.statsCacheExpiry = now + this.CACHE_TTL;

        return stats;
    }

    /**
     * Invalidate the stats cache
     */
    invalidateCache() {
        this.statsCache = null;
        this.statsCacheExpiry = null;
    }

    // ==================== Leaderboard Methods ====================

    /**
     * Get top users leaderboard by total hits
     * 
     * Requirement: 5.1
     * 
     * @param {number} limit - Number of users to return (default 5)
     * @returns {Promise<Array>} Leaderboard entries
     */
    async getLeaderboard(limit = 5) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const { data: users, error } = await this.supabase
            .from('users')
            .select('id, username, first_name, tier, total_hits, photo_url')
            .gt('total_hits', 0)
            .order('total_hits', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to get leaderboard: ${error.message}`);
        }

        return (users || []).map((user, index) => ({
            rank: index + 1,
            userId: user.id,
            username: user.username,
            firstName: user.first_name,
            tier: user.tier,
            totalHits: user.total_hits,
            avatarUrl: user.photo_url
        }));
    }

    // ==================== Online Users Methods ====================

    /**
     * Get paginated list of online users
     * 
     * Requirement: 6.1
     * 
     * @param {number} page - Page number (1-indexed)
     * @param {number} limit - Users per page (default 10)
     * @returns {Promise<Object>} Paginated online users
     */
    async getOnlineUsers(page = 1, limit = 10) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        const onlineThreshold = new Date(Date.now() - ONLINE_THRESHOLD).toISOString();
        const offset = (page - 1) * limit;

        // Get total count of online users
        const { count: total, error: countError } = await this.supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('last_active_at', onlineThreshold);

        if (countError) {
            throw new Error(`Failed to count online users: ${countError.message}`);
        }

        // Get paginated online users
        const { data: users, error } = await this.supabase
            .from('users')
            .select('id, username, first_name, tier, last_active_at, photo_url')
            .gte('last_active_at', onlineThreshold)
            .order('last_active_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(`Failed to get online users: ${error.message}`);
        }

        const totalPages = Math.ceil((total || 0) / limit);

        return {
            users: (users || []).map(user => ({
                userId: user.id,
                username: user.username,
                firstName: user.first_name,
                tier: user.tier,
                lastActiveAt: user.last_active_at,
                avatarUrl: user.photo_url
            })),
            pagination: {
                page,
                limit,
                total: total || 0,
                totalPages
            }
        };
    }

    // ==================== Stats Increment Methods ====================

    /**
     * Increment user statistics after validation
     * 
     * Requirements: 8.1, 8.2
     * 
     * @param {string} userId - User UUID
     * @param {number} cardsCount - Number of cards validated
     * @param {number} hitsCount - Number of successful validations (APPROVED + LIVE)
     * @returns {Promise<Object>} Updated stats
     */
    async incrementUserStats(userId, cardsCount = 0, hitsCount = 0) {
        if (!isSupabaseConfigured()) {
            throw new Error('Database not configured');
        }

        if (!userId) {
            throw new Error('User ID required');
        }

        if (cardsCount < 0 || hitsCount < 0) {
            throw new Error('Counts must be non-negative');
        }

        // Skip if nothing to increment
        if (cardsCount === 0 && hitsCount === 0) {
            return this.getPersonalStats(userId);
        }

        // Get current user stats
        const { data: user, error: fetchError } = await this.supabase
            .from('users')
            .select('total_cards_checked, total_hits, daily_cards_used, daily_hits, daily_stats_reset_at')
            .eq('id', userId)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                throw new Error('User not found');
            }
            throw new Error(`Failed to fetch user stats: ${fetchError.message}`);
        }

        const newTotalCards = (user.total_cards_checked || 0) + cardsCount;
        const newTotalHits = (user.total_hits || 0) + hitsCount;

        // Check if daily stats should be reset (new day)
        const shouldReset = this._shouldResetDailyStats(user.daily_stats_reset_at);
        const currentDailyCards = shouldReset ? 0 : (user.daily_cards_used || 0);
        const currentDailyHits = shouldReset ? 0 : (user.daily_hits || 0);
        const newDailyCards = currentDailyCards + cardsCount;
        const newDailyHits = currentDailyHits + hitsCount;

        // Update user stats (both total and daily)
        const updateData = {
            total_cards_checked: newTotalCards,
            total_hits: newTotalHits,
            daily_cards_used: newDailyCards,
            daily_hits: newDailyHits
        };

        // Reset daily_stats_reset_at if it's a new day
        if (shouldReset) {
            updateData.daily_stats_reset_at = new Date().toISOString();
        }

        const { error: updateError } = await this.supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (updateError) {
            throw new Error(`Failed to update user stats: ${updateError.message}`);
        }

        // Update platform stats using the database function
        const { error: platformError } = await this.supabase
            .rpc('increment_platform_stats', {
                cards_delta: cardsCount,
                hits_delta: hitsCount
            });

        if (platformError) {
            // Log but don't fail - user stats were updated
            console.error('Failed to update platform stats:', platformError.message);
        }

        // Invalidate cache since stats changed
        this.invalidateCache();

        const updatedStats = {
            totalCards: newTotalCards,
            totalHits: newTotalHits,
            cardsToday: newDailyCards,
            hitsToday: newDailyHits
        };

        // Broadcast stats update to SSE clients
        this.broadcastStatsUpdate({
            type: 'userStatsUpdate',
            userId,
            personal: updatedStats
        });

        return updatedStats;
    }

    // ==================== SSE Client Management Methods ====================

    /**
     * Add an SSE client for real-time updates
     * 
     * @param {Object} res - Express response object
     */
    addSSEClient(res) {
        this.sseClients.add(res);
    }

    /**
     * Remove an SSE client
     * 
     * @param {Object} res - Express response object
     */
    removeSSEClient(res) {
        this.sseClients.delete(res);
    }

    /**
     * Get count of connected SSE clients
     * 
     * @returns {number} Number of connected clients
     */
    getSSEClientCount() {
        return this.sseClients.size;
    }

    // ==================== SSE Broadcast Methods ====================

    /**
     * Broadcast stats update to all SSE clients
     * 
     * @param {Object} data - Data to broadcast
     */
    broadcastStatsUpdate(data) {
        if (this.sseClients.size === 0) {
            return;
        }

        const message = JSON.stringify({
            ...data,
            timestamp: new Date().toISOString()
        });

        const disconnectedClients = [];

        for (const client of this.sseClients) {
            try {
                client.write(`data: ${message}\n\n`);
            } catch (err) {
                // Client disconnected, mark for removal
                disconnectedClients.push(client);
            }
        }

        // Clean up disconnected clients
        for (const client of disconnectedClients) {
            this.sseClients.delete(client);
        }
    }

    /**
     * Broadcast global stats update
     * 
     * @param {Object} globalStats - Global stats object
     */
    async broadcastGlobalStatsUpdate(globalStats = null) {
        const stats = globalStats || await this.getGlobalStats();
        this.broadcastStatsUpdate({
            type: 'globalStatsUpdate',
            global: stats
        });
    }

    /**
     * Broadcast leaderboard update
     * 
     * @param {Array} leaderboard - Leaderboard entries
     */
    async broadcastLeaderboardUpdate(leaderboard = null) {
        const data = leaderboard || await this.getLeaderboard();
        this.broadcastStatsUpdate({
            type: 'leaderboardUpdate',
            leaderboard: data
        });
    }

    /**
     * Broadcast online user event
     * 
     * @param {string} eventType - 'userOnline' or 'userOffline'
     * @param {Object} user - User data { userId, username }
     */
    broadcastOnlineUserEvent(eventType, user) {
        this.broadcastStatsUpdate({
            type: eventType,
            userId: user.userId,
            username: user.username
        });
    }
}

export default DashboardService;
