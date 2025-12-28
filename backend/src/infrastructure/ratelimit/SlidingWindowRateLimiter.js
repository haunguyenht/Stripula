/**
 * Sliding Window Rate Limiter
 * Implements a sliding window algorithm for rate limiting
 * 
 * Unlike fixed window, sliding window provides smoother rate limiting
 * by tracking individual request timestamps and removing expired ones.
 * 
 * Requirements: 9.6
 */

export class SlidingWindowRateLimiter {
    constructor() {
        this._windows = new Map();
    }

    /**
     * Check if request is allowed under rate limit
     * @param {string} key - Identifier (IP, user ID, etc.)
     * @param {number} limit - Max requests allowed in window
     * @param {number} windowMs - Window size in milliseconds
     * @returns {Object} { allowed: boolean, remaining: number, resetAt: number, retryAfter?: number }
     */
    check(key, limit, windowMs) {
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get or create window data
        let windowData = this._windows.get(key);
        if (!windowData) {
            windowData = { requests: [] };
            this._windows.set(key, windowData);
        }

        // Remove expired requests (sliding window)
        windowData.requests = windowData.requests.filter(
            timestamp => timestamp > windowStart
        );

        const currentCount = windowData.requests.length;
        const remaining = Math.max(0, limit - currentCount);
        const allowed = currentCount < limit;

        if (allowed) {
            windowData.requests.push(now);
        }

        // Calculate reset time (when oldest request expires)
        const resetAt = windowData.requests.length > 0
            ? windowData.requests[0] + windowMs
            : now + windowMs;

        const result = { allowed, remaining: allowed ? remaining - 1 : 0, resetAt };

        if (!allowed) {
            result.retryAfter = Math.ceil((resetAt - now) / 1000);
        }

        return result;
    }

    /**
     * Get current status for a key without modifying state
     * @param {string} key - Identifier
     * @param {number} limit - Max requests allowed
     * @param {number} windowMs - Window size in milliseconds
     * @returns {Object|null} Current status or null if no data
     */
    getStatus(key, limit, windowMs) {
        const windowData = this._windows.get(key);
        if (!windowData) return null;

        const now = Date.now();
        const windowStart = now - windowMs;

        // Count valid requests without modifying
        const validRequests = windowData.requests.filter(
            timestamp => timestamp > windowStart
        );

        const currentCount = validRequests.length;
        const remaining = Math.max(0, limit - currentCount);
        const resetAt = validRequests.length > 0
            ? validRequests[0] + windowMs
            : now + windowMs;

        return {
            count: currentCount,
            remaining,
            resetAt,
            windowMs
        };
    }

    /**
     * Reset rate limit for a specific key
     * @param {string} key - Identifier to reset
     */
    reset(key) {
        this._windows.delete(key);
    }

    /**
     * Cleanup old entries to prevent memory leaks
     * Should be called periodically
     * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
     */
    cleanup(maxAge = 3600000) {
        const cutoff = Date.now() - maxAge;

        for (const [key, data] of this._windows) {
            // Remove entries with no recent requests
            if (data.requests.length === 0 ||
                data.requests[data.requests.length - 1] < cutoff) {
                this._windows.delete(key);
            }
        }
    }

    /**
     * Get the number of tracked keys (for monitoring)
     * @returns {number} Number of keys being tracked
     */
    get size() {
        return this._windows.size;
    }

    /**
     * Clear all rate limit data
     */
    clear() {
        this._windows.clear();
    }
}

export default SlidingWindowRateLimiter;
