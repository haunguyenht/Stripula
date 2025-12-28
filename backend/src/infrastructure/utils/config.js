/**
 * Unified configuration for infrastructure layer
 * Consolidates timeout and retry settings to eliminate inconsistencies
 */

// ═══════════════════════════════════════════════════════════════════════════
// RETRY CONFIGURATION
// Unified retry settings with faster backoff
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retry configuration for all retry scenarios
 * Optimized: faster backoff (200/400/800 instead of 500/1000/2000)
 */
export const RETRY_CONFIG = {
    // Fast backoff for proxy recovery: 200ms, 400ms, 800ms
    backoff: [200, 400, 800],
    
    // Max retries for different scenarios
    maxRetries: 3
};

// ═══════════════════════════════════════════════════════════════════════════
// PROXY CONFIGURATION
// Proxy-related settings
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Proxy configuration
 */
export const PROXY_CONFIG = {
    // Retry configuration for proxy errors
    maxRetries: 3,
    backoff: [200, 400, 800],
    
    // Pause duration when gateway is degraded
    pauseOnDegraded: 5000,
    
    // Health tracking
    healthWindowSize: 10,
    healthErrorThreshold: 0.5, // 50%
    
    // Localhost bypass patterns
    bypassPatterns: ['localhost', '127.0.0.1', '::1']
};
