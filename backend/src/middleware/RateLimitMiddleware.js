/**
 * Rate Limit Middleware
 * Handles rate limiting for login attempts and user operations
 * Uses sliding window algorithm for smoother rate limiting
 * 
 * Requirements: 9.6, 11.1, 11.2, 11.3
 */

import { SlidingWindowRateLimiter } from '../infrastructure/ratelimit/index.js';

// Shared rate limiter instances
const ipRateLimiter = new SlidingWindowRateLimiter();
const userRateLimiter = new SlidingWindowRateLimiter();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Start cleanup timer
setInterval(() => {
    ipRateLimiter.cleanup();
    userRateLimiter.cleanup();
}, CLEANUP_INTERVAL);

export class RateLimitMiddleware {
    constructor(options = {}) {
        // Default configurations
        this.loginLimitPerMinute = options.loginLimitPerMinute || 5;
        this.operationLimitPerMinute = options.operationLimitPerMinute || 60;
    }

    /**
     * Get client IP address from request
     * Handles proxies and load balancers
     * @private
     */
    _getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.ip ||
               'unknown';
    }

    /**
     * Set rate limit headers on response
     * @private
     */
    _setRateLimitHeaders(res, limit, remaining, resetAt) {
        res.set('X-RateLimit-Limit', limit.toString());
        res.set('X-RateLimit-Remaining', remaining.toString());
        res.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
    }

    /**
     * Rate limit by IP address
     * Used for login attempts (5/min per IP)
     * 
     * Requirement 9.6: Use sliding window algorithm to prevent burst abuse
     * Requirement 11.1: Limit login attempts to 5 per minute per IP address
     * 
     * @param {number} maxRequests - Maximum requests per window (default: 5)
     * @param {number} windowMs - Window size in milliseconds (default: 60000 = 1 minute)
     */
    limitByIP(maxRequests = 5, windowMs = 60 * 1000) {
        return (req, res, next) => {
            const ip = this._getClientIP(req);
            const key = `ip:${ip}`;

            const result = ipRateLimiter.check(key, maxRequests, windowMs);

            // Set rate limit headers
            this._setRateLimitHeaders(res, maxRequests, result.remaining, result.resetAt);

            if (!result.allowed) {
                res.set('Retry-After', result.retryAfter.toString());
                return res.status(429).json({
                    status: 'ERROR',
                    code: 'AUTH_RATE_LIMITED',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: result.retryAfter
                });
            }

            next();
        };
    }

    /**
     * Rate limit by user ID
     * Used for authenticated operations
     * 
     * Requirement 9.6: Use sliding window algorithm to prevent burst abuse
     * Requirement 11.2: Enforce operation limits based on User_Tier
     * Requirement 11.3: Reject further operations when limit reached
     * 
     * @param {number} maxRequests - Maximum requests per window (default: 60)
     * @param {number} windowMs - Window size in milliseconds (default: 60000 = 1 minute)
     */
    limitByUser(maxRequests = 60, windowMs = 60 * 1000) {
        return (req, res, next) => {
            // User must be authenticated (set by AuthMiddleware)
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'AUTH_SESSION_INVALID',
                    message: 'Authentication required'
                });
            }

            const key = `user:${user.id}`;
            const result = userRateLimiter.check(key, maxRequests, windowMs);

            // Set rate limit headers
            this._setRateLimitHeaders(res, maxRequests, result.remaining, result.resetAt);

            if (!result.allowed) {
                res.set('Retry-After', result.retryAfter.toString());
                return res.status(429).json({
                    status: 'ERROR',
                    code: 'RATE_LIMITED',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: result.retryAfter
                });
            }

            next();
        };
    }

    /**
     * Rate limit by IP and endpoint combination
     * More granular control for specific endpoints
     * 
     * Requirement 9.6: Use sliding window algorithm to prevent burst abuse
     * 
     * @param {string} endpoint - Endpoint identifier
     * @param {number} maxRequests - Maximum requests per window
     * @param {number} windowMs - Window size in milliseconds
     */
    limitByIPAndEndpoint(endpoint, maxRequests = 10, windowMs = 60 * 1000) {
        return (req, res, next) => {
            const ip = this._getClientIP(req);
            const key = `ip:${ip}:${endpoint}`;

            const result = ipRateLimiter.check(key, maxRequests, windowMs);

            // Set rate limit headers
            this._setRateLimitHeaders(res, maxRequests, result.remaining, result.resetAt);

            if (!result.allowed) {
                res.set('Retry-After', result.retryAfter.toString());
                return res.status(429).json({
                    status: 'ERROR',
                    code: 'RATE_LIMITED',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: result.retryAfter
                });
            }

            next();
        };
    }

    /**
     * Get current rate limit status for an IP
     * Useful for debugging and monitoring
     */
    getIPStatus(ip, limit = 5, windowMs = 60 * 1000) {
        const key = `ip:${ip}`;
        return ipRateLimiter.getStatus(key, limit, windowMs);
    }

    /**
     * Get current rate limit status for a user
     * Useful for debugging and monitoring
     */
    getUserStatus(userId, limit = 60, windowMs = 60 * 1000) {
        const key = `user:${userId}`;
        return userRateLimiter.getStatus(key, limit, windowMs);
    }

    /**
     * Reset rate limit for an IP (admin use)
     */
    resetIPLimit(ip) {
        const key = `ip:${ip}`;
        ipRateLimiter.reset(key);
    }

    /**
     * Reset rate limit for a user (admin use)
     */
    resetUserLimit(userId) {
        const key = `user:${userId}`;
        userRateLimiter.reset(key);
    }
}

export default RateLimitMiddleware;
