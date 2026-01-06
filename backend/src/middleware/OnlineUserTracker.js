import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';

/**
 * Online threshold in milliseconds (5 minutes)
 * Users active within this threshold are considered online
 */
export const ONLINE_THRESHOLD = 5 * 60 * 1000;

/**
 * Minimum interval between activity updates (30 seconds)
 * Prevents excessive database writes
 */
export const UPDATE_INTERVAL = 30 * 1000;

/**
 * OnlineUserTracker
 * 
 * Middleware to track user activity for online status.
 * Updates last_active_at timestamp on authenticated API requests.
 * 
 * Requirements:
 * - 6.4: Remove users from online list after 5 minutes of inactivity
 * - 6.5: Update last activity timestamp on any action
 * - 8.3: Update last_active_at on any authenticated API request
 */
export class OnlineUserTracker {
    constructor(options = {}) {
        this.supabase = options.supabase || supabase;
        this.ONLINE_THRESHOLD = options.onlineThreshold || ONLINE_THRESHOLD;
        this.UPDATE_INTERVAL = options.updateInterval || UPDATE_INTERVAL;
        
        // In-memory cache to throttle database updates
        // Maps userId -> lastUpdateTimestamp
        this.lastUpdateCache = new Map();
        
        // Optional DashboardService for broadcasting online events
        this.dashboardService = options.dashboardService || null;
    }

    /**
     * Express middleware to update last_active_at
     * 
     * Requirements: 6.5, 8.3
     * 
     * @returns {Function} Express middleware function
     */
    middleware() {
        return async (req, res, next) => {
            // Only track authenticated users
            if (req.user?.id) {
                // Fire and forget - don't block the request
                this.updateActivity(req.user.id).catch(() => {
                    // Silently ignore errors to not affect the request
                });
            }
            next();
        };
    }

    /**
     * Update user's last activity timestamp
     * Throttled to prevent excessive database writes
     * 
     * Requirement: 6.5
     * 
     * @param {string} userId - User UUID
     * @returns {Promise<boolean>} True if update was performed
     */
    async updateActivity(userId) {
        if (!isSupabaseConfigured()) {
            return false;
        }

        if (!userId) {
            return false;
        }

        const now = Date.now();
        const lastUpdate = this.lastUpdateCache.get(userId);

        // Throttle updates to prevent excessive database writes
        if (lastUpdate && (now - lastUpdate) < this.UPDATE_INTERVAL) {
            return false;
        }

        try {
            // Check if user was previously offline (for broadcasting)
            let wasOffline = false;
            if (this.dashboardService) {
                const { data: user } = await this.supabase
                    .from('users')
                    .select('last_active_at, username')
                    .eq('id', userId)
                    .single();

                if (user && user.last_active_at) {
                    wasOffline = !this.isOnline(user.last_active_at);
                }
            }

            // Update last_active_at
            const { error } = await this.supabase
                .from('users')
                .update({ last_active_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) {
                return false;
            }

            // Update cache
            this.lastUpdateCache.set(userId, now);

            // Broadcast online event if user came back online
            if (wasOffline && this.dashboardService) {
                const { data: user } = await this.supabase
                    .from('users')
                    .select('username')
                    .eq('id', userId)
                    .single();

                if (user) {
                    this.dashboardService.broadcastOnlineUserEvent('userOnline', {
                        userId,
                        username: user.username
                    });
                }
            }

            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Check if a user is online based on their last activity timestamp
     * 
     * Requirement: 6.4
     * 
     * @param {string|Date} lastActiveAt - Last activity timestamp
     * @returns {boolean} True if user is online
     */
    isOnline(lastActiveAt) {
        if (!lastActiveAt) {
            return false;
        }

        const lastActive = new Date(lastActiveAt).getTime();
        const threshold = Date.now() - this.ONLINE_THRESHOLD;

        return lastActive >= threshold;
    }

    /**
     * Get the online threshold in milliseconds
     * 
     * @returns {number} Online threshold in ms
     */
    getOnlineThreshold() {
        return this.ONLINE_THRESHOLD;
    }

    /**
     * Clear the update cache (useful for testing)
     */
    clearCache() {
        this.lastUpdateCache.clear();
    }

    /**
     * Set the DashboardService for broadcasting events
     * 
     * @param {DashboardService} dashboardService - Dashboard service instance
     */
    setDashboardService(dashboardService) {
        this.dashboardService = dashboardService;
    }
}

/**
 * Create middleware function directly
 * Convenience function for simple usage
 * 
 * @param {Object} options - Options for OnlineUserTracker
 * @returns {Function} Express middleware function
 */
export function createOnlineUserTrackerMiddleware(options = {}) {
    const tracker = new OnlineUserTracker(options);
    return tracker.middleware();
}

export default OnlineUserTracker;
