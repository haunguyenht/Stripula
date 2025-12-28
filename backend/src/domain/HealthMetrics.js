/**
 * HealthMetrics domain class
 * Tracks health metrics for a gateway including success rate, latency, and failure counts
 */
export class HealthMetrics {
    static HEALTH = {
        ONLINE: 'online',
        DEGRADED: 'degraded',
        OFFLINE: 'offline'
    };

    static FAILURE_CATEGORIES = {
        PROXY_ERROR: 'proxy_error',
        GATEWAY_ERROR: 'gateway_error',
        TIMEOUT: 'timeout',
        NETWORK_ERROR: 'network_error'
    };

    // Thresholds for health status calculation
    static THRESHOLDS = {
        DEGRADED_SUCCESS_RATE: 50,      // Below 50% success rate = degraded
        OFFLINE_CONSECUTIVE_FAILURES: 5, // 5+ consecutive failures = offline
        ROLLING_WINDOW_SIZE: 10          // Track last 10 requests
    };

    constructor(gatewayId) {
        this.gatewayId = gatewayId;
        this.recentRequests = [];  // Last N requests: { success, latencyMs, timestamp }
        this.totalRequests = 0;
        this.totalSuccesses = 0;
        this.totalFailures = 0;
        this.consecutiveFailures = 0;
        this.lastSuccessAt = null;
        this.lastFailureAt = null;
        this.avgLatencyMs = 0;
        
        // Failure breakdown by category
        this.failuresByCategory = {
            [HealthMetrics.FAILURE_CATEGORIES.PROXY_ERROR]: 0,
            [HealthMetrics.FAILURE_CATEGORIES.GATEWAY_ERROR]: 0,
            [HealthMetrics.FAILURE_CATEGORIES.TIMEOUT]: 0,
            [HealthMetrics.FAILURE_CATEGORIES.NETWORK_ERROR]: 0
        };
    }

    /**
     * Record a successful request
     * @param {number} latencyMs - Response time in milliseconds
     */
    recordSuccess(latencyMs = 0) {
        this.totalRequests++;
        this.totalSuccesses++;
        this.consecutiveFailures = 0;
        this.lastSuccessAt = new Date();
        this._updateRecentRequests(true, latencyMs);
        this._updateAvgLatency();
    }

    /**
     * Record a failed request
     * @param {string} _errorType - Optional error type for tracking (used for auto-classification if category not provided)
     * @param {string} category - Failure category: proxy_error, gateway_error, timeout, network_error
     */
    recordFailure(_errorType = null, category = null) {
        this.totalRequests++;
        this.totalFailures++;
        this.consecutiveFailures++;
        this.lastFailureAt = new Date();
        this._updateRecentRequests(false, 0);
        
        // Record failure by category
        const validCategory = this._validateCategory(category);
        this.failuresByCategory[validCategory]++;
    }

    /**
     * Validate and normalize failure category
     * @param {string|null} category - Category to validate
     * @returns {string} Valid category (defaults to network_error)
     * @private
     */
    _validateCategory(category) {
        const validCategories = Object.values(HealthMetrics.FAILURE_CATEGORIES);
        if (category && validCategories.includes(category)) {
            return category;
        }
        // Default to network_error if invalid or not provided
        return HealthMetrics.FAILURE_CATEGORIES.NETWORK_ERROR;
    }

    /**
     * Get failure breakdown by category
     * @returns {Object} Failure counts by category
     */
    getFailureBreakdown() {
        return {
            ...this.failuresByCategory,
            total: this.totalFailures
        };
    }

    /**
     * Reset failure categories
     */
    resetFailureCategories() {
        this.failuresByCategory = {
            [HealthMetrics.FAILURE_CATEGORIES.PROXY_ERROR]: 0,
            [HealthMetrics.FAILURE_CATEGORIES.GATEWAY_ERROR]: 0,
            [HealthMetrics.FAILURE_CATEGORIES.TIMEOUT]: 0,
            [HealthMetrics.FAILURE_CATEGORIES.NETWORK_ERROR]: 0
        };
    }

    /**
     * Get the success rate based on recent requests (rolling window)
     * @returns {number} Success rate as percentage (0-100)
     */
    getSuccessRate() {
        if (this.recentRequests.length === 0) {
            return 100; // No requests yet, assume healthy
        }
        const successes = this.recentRequests.filter(r => r.success).length;
        return Math.round((successes / this.recentRequests.length) * 100);
    }

    /**
     * Calculate health status based on metrics
     * - 5+ consecutive failures = offline
     * - <50% success rate in last 10 requests = degraded
     * - Otherwise = online
     * @returns {string} Health status
     */
    getHealthStatus() {
        // Check consecutive failures first (highest priority)
        if (this.consecutiveFailures >= HealthMetrics.THRESHOLDS.OFFLINE_CONSECUTIVE_FAILURES) {
            return HealthMetrics.HEALTH.OFFLINE;
        }
        
        // Check success rate
        if (this.getSuccessRate() < HealthMetrics.THRESHOLDS.DEGRADED_SUCCESS_RATE) {
            return HealthMetrics.HEALTH.DEGRADED;
        }
        
        return HealthMetrics.HEALTH.ONLINE;
    }

    /**
     * Check if the gateway is healthy (not offline)
     * @returns {boolean}
     */
    isHealthy() {
        return this.getHealthStatus() !== HealthMetrics.HEALTH.OFFLINE;
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.recentRequests = [];
        this.totalRequests = 0;
        this.totalSuccesses = 0;
        this.totalFailures = 0;
        this.consecutiveFailures = 0;
        this.lastSuccessAt = null;
        this.lastFailureAt = null;
        this.avgLatencyMs = 0;
        this.resetFailureCategories();
    }

    /**
     * Convert to JSON for API responses
     * @returns {Object}
     */
    toJSON() {
        return {
            gatewayId: this.gatewayId,
            successRate: this.getSuccessRate(),
            avgLatencyMs: this.avgLatencyMs,
            consecutiveFailures: this.consecutiveFailures,
            lastSuccessAt: this.lastSuccessAt,
            lastFailureAt: this.lastFailureAt,
            totalRequests: this.totalRequests,
            totalSuccesses: this.totalSuccesses,
            totalFailures: this.totalFailures,
            healthStatus: this.getHealthStatus(),
            failuresByCategory: this.getFailureBreakdown(),
            recentRequests: this.recentRequests  // Include for persistence
        };
    }

    /**
     * Update the rolling window of recent requests
     * @param {boolean} success - Whether the request was successful
     * @param {number} latencyMs - Response time in milliseconds
     * @private
     */
    _updateRecentRequests(success, latencyMs) {
        this.recentRequests.push({ 
            success, 
            latencyMs, 
            timestamp: Date.now() 
        });
        
        // Keep only the last N requests
        if (this.recentRequests.length > HealthMetrics.THRESHOLDS.ROLLING_WINDOW_SIZE) {
            this.recentRequests.shift();
        }
    }

    /**
     * Update the average latency based on recent successful requests
     * @private
     */
    _updateAvgLatency() {
        const successfulRequests = this.recentRequests.filter(r => r.success && r.latencyMs > 0);
        if (successfulRequests.length === 0) {
            return;
        }
        const sum = successfulRequests.reduce((acc, r) => acc + r.latencyMs, 0);
        this.avgLatencyMs = Math.round(sum / successfulRequests.length);
    }

    /**
     * Create HealthMetrics from stored JSON data
     * @param {Object} data - Stored metrics data
     * @returns {HealthMetrics}
     */
    static fromJSON(data) {
        const metrics = new HealthMetrics(data.gatewayId);
        metrics.recentRequests = data.recentRequests || [];
        metrics.totalRequests = data.totalRequests || 0;
        metrics.totalSuccesses = data.totalSuccesses || 0;
        metrics.totalFailures = data.totalFailures || 0;
        metrics.consecutiveFailures = data.consecutiveFailures || 0;
        metrics.lastSuccessAt = data.lastSuccessAt ? new Date(data.lastSuccessAt) : null;
        metrics.lastFailureAt = data.lastFailureAt ? new Date(data.lastFailureAt) : null;
        metrics.avgLatencyMs = data.avgLatencyMs || 0;
        
        // Parse failure categories
        if (data.failuresByCategory) {
            metrics.failuresByCategory = {
                [HealthMetrics.FAILURE_CATEGORIES.PROXY_ERROR]: data.failuresByCategory.proxy_error || 0,
                [HealthMetrics.FAILURE_CATEGORIES.GATEWAY_ERROR]: data.failuresByCategory.gateway_error || 0,
                [HealthMetrics.FAILURE_CATEGORIES.TIMEOUT]: data.failuresByCategory.timeout || 0,
                [HealthMetrics.FAILURE_CATEGORIES.NETWORK_ERROR]: data.failuresByCategory.network_error || 0
            };
        }
        
        return metrics;
    }
}
