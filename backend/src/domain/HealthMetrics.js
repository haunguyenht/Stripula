/**
 * HealthMetrics domain class
 * Tracks health metrics for a gateway including success rate, latency, and failure counts
 * 
 * NOTE: Health status is now MANUALLY controlled - no automatic status changes.
 * This class only tracks metrics and provides alert/recovery threshold detection.
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

    // Alert thresholds for notifications (NOT automatic status changes)
    static ALERT_THRESHOLDS = {
        CONSECUTIVE_FAILURES: 15,      // Alert at 15+ consecutive failures
        SUCCESS_RATE_PERCENT: 30,      // Alert at <30% success rate
        ROLLING_WINDOW_SIZE: 50,       // Track last 50 requests for rate calculation
        RECOVERY_CONSECUTIVE: 5        // Recovery after 5 consecutive successes
    };

    constructor(gatewayId) {
        this.gatewayId = gatewayId;
        this.recentRequests = [];  // Last N requests: { success, latencyMs, timestamp }
        this.totalRequests = 0;
        this.totalSuccesses = 0;
        this.totalFailures = 0;
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;  // NEW: Track consecutive successes for recovery detection
        this.lastSuccessAt = null;
        this.lastFailureAt = null;
        this.lastError = null;  // NEW: Track last error message/type
        this.avgLatencyMs = 0;
        this.storedHealthStatus = HealthMetrics.HEALTH.ONLINE;  // NEW: Stored status (manual control only)
        
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
        this.consecutiveSuccesses++;  // Increment consecutive successes
        this.lastSuccessAt = new Date();
        this._updateRecentRequests(true, latencyMs);
        this._updateAvgLatency();
    }

    /**
     * Record a failed request
     * @param {string} errorType - Error type/message for tracking
     * @param {string} category - Failure category: proxy_error, gateway_error, timeout, network_error
     */
    recordFailure(errorType = null, category = null) {
        this.totalRequests++;
        this.totalFailures++;
        this.consecutiveFailures++;
        this.consecutiveSuccesses = 0;  // Reset consecutive successes
        this.lastFailureAt = new Date();
        this.lastError = errorType;  // Track last error
        this._updateRecentRequests(false, 0);
        
        // Record failure by category
        const validCategory = this._validateCategory(category);
        this.failuresByCategory[validCategory]++;
    }

    /**
     * Check if alert thresholds are exceeded (for notification purposes)
     * Does NOT change health status automatically
     * @returns {Object} { shouldAlert: boolean, reason: string, metrics: Object }
     */
    shouldTriggerAlert() {
        const successRate = this.getSuccessRate();
        const thresholds = HealthMetrics.ALERT_THRESHOLDS;
        
        let shouldAlert = false;
        let reason = '';
        
        // Check consecutive failures threshold
        if (this.consecutiveFailures >= thresholds.CONSECUTIVE_FAILURES) {
            shouldAlert = true;
            reason = `${this.consecutiveFailures} consecutive failures (threshold: ${thresholds.CONSECUTIVE_FAILURES})`;
        }
        // Check success rate threshold
        else if (successRate < thresholds.SUCCESS_RATE_PERCENT && this.recentRequests.length >= 10) {
            shouldAlert = true;
            reason = `Success rate ${successRate}% below threshold (${thresholds.SUCCESS_RATE_PERCENT}%)`;
        }
        
        return {
            shouldAlert,
            reason,
            metrics: {
                consecutiveFailures: this.consecutiveFailures,
                successRate,
                lastError: this.lastError
            }
        };
    }

    /**
     * Check if recovery threshold is met (5 consecutive successes)
     * @returns {boolean} True if gateway has recovered
     */
    shouldTriggerRecovery() {
        return this.consecutiveSuccesses >= HealthMetrics.ALERT_THRESHOLDS.RECOVERY_CONSECUTIVE;
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
     * Get health status - returns STORED status only (no auto-calculation)
     * Health status is now controlled manually via setHealthStatus()
     * @returns {string} Health status
     */
    getHealthStatus() {
        return this.storedHealthStatus;
    }

    /**
     * Set health status manually
     * @param {string} status - Health status: online, degraded, offline
     */
    setHealthStatus(status) {
        const validStatuses = Object.values(HealthMetrics.HEALTH);
        if (validStatuses.includes(status)) {
            this.storedHealthStatus = status;
        }
    }

    /**
     * Check if the gateway is healthy (not offline)
     * @returns {boolean}
     */
    isHealthy() {
        return this.getHealthStatus() !== HealthMetrics.HEALTH.OFFLINE;
    }

    /**
     * Reset all metrics (does NOT change health status)
     */
    reset() {
        this.recentRequests = [];
        this.totalRequests = 0;
        this.totalSuccesses = 0;
        this.totalFailures = 0;
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;
        this.lastSuccessAt = null;
        this.lastFailureAt = null;
        this.lastError = null;
        this.avgLatencyMs = 0;
        this.resetFailureCategories();
        // NOTE: storedHealthStatus is NOT reset - preserves manual status
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
            consecutiveSuccesses: this.consecutiveSuccesses,
            lastSuccessAt: this.lastSuccessAt,
            lastFailureAt: this.lastFailureAt,
            lastError: this.lastError,
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
        
        // Keep only the last N requests (using new ALERT_THRESHOLDS)
        if (this.recentRequests.length > HealthMetrics.ALERT_THRESHOLDS.ROLLING_WINDOW_SIZE) {
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
        metrics.consecutiveSuccesses = data.consecutiveSuccesses || 0;
        metrics.lastSuccessAt = data.lastSuccessAt ? new Date(data.lastSuccessAt) : null;
        metrics.lastFailureAt = data.lastFailureAt ? new Date(data.lastFailureAt) : null;
        metrics.lastError = data.lastError || null;
        metrics.avgLatencyMs = data.avgLatencyMs || 0;
        metrics.storedHealthStatus = data.healthStatus || HealthMetrics.HEALTH.ONLINE;
        
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
