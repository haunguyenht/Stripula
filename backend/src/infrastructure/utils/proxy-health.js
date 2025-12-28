/**
 * Proxy Health Tracker for monitoring proxy error rates
 * Tracks error rates over rolling window for health monitoring
 */

import { createThrottledLogger } from './index.js';

const logger = createThrottledLogger('[ProxyHealth]');

// ═══════════════════════════════════════════════════════════════════════════
// PROXY HEALTH TRACKER
// Tracks proxy error rates over rolling window for health monitoring
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ProxyHealthTracker - Tracks proxy error rates for health monitoring
 * 
 * Features:
 * - Rolling window of last N requests (default: 10)
 * - Emits warning when error rate exceeds threshold (default: 50%)
 * - Per-gateway tracking
 * - Throttled logging to reduce console noise
 */
export class ProxyHealthTracker {
    /**
     * Create a new ProxyHealthTracker
     * @param {Object} options - Configuration options
     * @param {number} [options.windowSize=10] - Rolling window size
     * @param {number} [options.errorThreshold=0.5] - Error rate threshold for warning (0.5 = 50%)
     * @param {Function} [options.onDegraded] - Callback when gateway becomes degraded: (gatewayId, stats) => void
     * @param {boolean} [options.verbose=false] - Enable verbose logging for every success/error
     */
    constructor(options = {}) {
        this.windowSize = options.windowSize ?? 10;
        this.errorThreshold = options.errorThreshold ?? 0.5;
        this.onDegraded = options.onDegraded ?? null;
        this.verbose = options.verbose ?? false;
        
        /**
         * Error rates per gateway
         * Map<gatewayId, { errors: number, total: number, lastError: string, lastErrorTime: number, lastReset: number }>
         */
        this.errorRates = new Map();
        
        /**
         * Last logged state per gateway (for throttling)
         * Map<gatewayId, { lastLogTime: number, lastDegradedNotify: number }>
         */
        this.logState = new Map();
        
        /**
         * Minimum interval between identical logs (ms)
         */
        this.logThrottleInterval = 5000;
    }
    
    /**
     * Record a successful proxy operation
     * @param {string} gatewayId - Gateway identifier
     * @param {number} [latencyMs] - Optional latency in milliseconds
     */
    recordSuccess(gatewayId, latencyMs = null) {
        const stats = this._getStats(gatewayId);
        stats.total++;
        if (latencyMs !== null) {
            stats.lastLatency = latencyMs;
        }
        this._checkWindow(gatewayId, stats);
        
        // Only log in verbose mode to reduce hot-path noise
        if (this.verbose) {
            logger.debug(`${gatewayId}: Success (${stats.errors}/${stats.total}, ${this._getErrorRate(stats)}%)`);
        }
    }
    
    /**
     * Record a proxy error
     * @param {string} gatewayId - Gateway identifier
     * @param {string} errorType - Type of error (e.g., 'proxy_error', 'timeout')
     * @returns {boolean} - True if gateway is now degraded (error rate > threshold)
     */
    recordError(gatewayId, errorType) {
        const stats = this._getStats(gatewayId);
        stats.errors++;
        stats.total++;
        stats.lastError = errorType;
        stats.lastErrorTime = Date.now();
        this._checkWindow(gatewayId, stats);
        
        const errorRate = this._getErrorRate(stats);
        const isDegraded = stats.total >= this.windowSize && stats.errors / stats.total > this.errorThreshold;
        
        // Throttled logging - only log on degraded state change or periodically
        if (isDegraded) {
            const state = this._getLogState(gatewayId);
            const now = Date.now();
            
            if (now - state.lastDegradedNotify > this.logThrottleInterval) {
                logger.warn(`⚠ High error rate for ${gatewayId}: ${stats.errors}/${stats.total} (${errorRate}%)`);
                state.lastDegradedNotify = now;
                
                if (this.onDegraded) {
                    this.onDegraded(gatewayId, { ...stats, errorRate });
                }
            }
        } else if (this.verbose) {
            logger.debug(`${gatewayId}: Error "${errorType}" (${stats.errors}/${stats.total}, ${errorRate}%)`);
        }
        
        return isDegraded;
    }
    
    /**
     * Get current stats for a gateway
     * @param {string} gatewayId - Gateway identifier
     * @returns {Object} - Stats object with errors, total, errorRate, etc.
     */
    getStats(gatewayId) {
        const stats = this._getStats(gatewayId);
        return {
            ...stats,
            errorRate: this._getErrorRate(stats),
            isDegraded: stats.total >= this.windowSize && stats.errors / stats.total > this.errorThreshold
        };
    }
    
    /**
     * Check if a gateway is degraded (error rate > threshold)
     * @param {string} gatewayId - Gateway identifier
     * @returns {boolean}
     */
    isDegraded(gatewayId) {
        const stats = this._getStats(gatewayId);
        return stats.total >= this.windowSize && stats.errors / stats.total > this.errorThreshold;
    }
    
    /**
     * Reset stats for a gateway
     * @param {string} gatewayId - Gateway identifier
     */
    reset(gatewayId) {
        this.errorRates.delete(gatewayId);
        this.logState.delete(gatewayId);
        logger.info(`${gatewayId}: Stats reset`);
    }
    
    /**
     * Reset all stats
     */
    resetAll() {
        this.errorRates.clear();
        this.logState.clear();
        logger.info(`All stats reset`);
    }
    
    /**
     * Get summary of all gateway health
     * @returns {Object} Summary with gateway IDs as keys
     */
    getSummary() {
        const summary = {};
        
        for (const [gatewayId, stats] of this.errorRates.entries()) {
            summary[gatewayId] = {
                errors: stats.errors,
                total: stats.total,
                errorRate: stats.total > 0 ? Math.round((stats.errors / stats.total) * 100) : 0,
                isDegraded: this.isDegraded(gatewayId),
                lastError: stats.lastError,
                lastErrorTime: stats.lastErrorTime,
                lastLatency: stats.lastLatency
            };
        }
        
        return summary;
    }
    
    /**
     * Get or create stats for a gateway
     * @param {string} gatewayId
     * @returns {Object}
     * @private
     */
    _getStats(gatewayId) {
        if (!this.errorRates.has(gatewayId)) {
            this.errorRates.set(gatewayId, {
                errors: 0,
                total: 0,
                lastError: null,
                lastErrorTime: null,
                lastLatency: null,
                lastReset: Date.now()
            });
        }
        return this.errorRates.get(gatewayId);
    }
    
    /**
     * Get or create log state for a gateway
     * @param {string} gatewayId
     * @returns {Object}
     * @private
     */
    _getLogState(gatewayId) {
        if (!this.logState.has(gatewayId)) {
            this.logState.set(gatewayId, {
                lastLogTime: 0,
                lastDegradedNotify: 0
            });
        }
        return this.logState.get(gatewayId);
    }
    
    /**
     * Check and manage rolling window
     * Resets window after windowSize * 2 requests to prevent unbounded growth
     * @param {string} gatewayId
     * @param {Object} stats
     * @private
     */
    _checkWindow(gatewayId, stats) {
        // Reset window after windowSize * 2 requests
        if (stats.total >= this.windowSize * 2) {
            // Keep half the data for continuity
            stats.errors = Math.floor(stats.errors / 2);
            stats.total = Math.floor(stats.total / 2);
            stats.lastReset = Date.now();
            
            if (this.verbose) {
                logger.debug(`${gatewayId}: Window reset (now ${stats.errors}/${stats.total})`);
            }
        }
    }
    
    /**
     * Calculate error rate as percentage
     * @param {Object} stats
     * @returns {string} - Error rate as percentage string (e.g., "50.0")
     * @private
     */
    _getErrorRate(stats) {
        if (stats.total === 0) return '0.0';
        return ((stats.errors / stats.total) * 100).toFixed(1);
    }
}
