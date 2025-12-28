/**
 * Unified retry utility for network and proxy operations
 * Consolidates retry implementations into one configurable utility
 */

import { sleep, createThrottledLogger } from './index.js';

const logger = createThrottledLogger('[Retry]');

// ═══════════════════════════════════════════════════════════════════════════
// RETRY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default retry configuration
 * Unified across all retry scenarios
 */
export const RETRY_DEFAULTS = {
    maxRetries: 3,
    backoff: [200, 400, 800],  // Fast backoff: 200ms, 400ms, 800ms
    exponential: true
};

/**
 * Error categories for retry decision
 */
export const ErrorCategory = {
    RETRYABLE: 'RETRYABLE',
    PROXY_ERROR: 'PROXY_ERROR',
    FATAL: 'FATAL',
    CARD_ERROR: 'CARD_ERROR'
};

// ═══════════════════════════════════════════════════════════════════════════
// ERROR PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Error patterns for categorization
 */
export const ERROR_PATTERNS = {
    RETRYABLE: [
        'timeout',
        'econnreset',
        'socket hang up',
        'stream',
        'aborted',
        'net::err',
        'failed to fetch',
        'network error'
    ],
    FATAL: [
        'invalid api key',
        'rate_limit',
        'account_blocked',
        'api_key_expired',
        'no such token',
        'invalid_api_key',
        'authentication_failed',
        'permission_denied',
        'account_invalid'
    ],
    CARD_ERROR: [
        'incorrect_number',
        'invalid_number',
        'expired_card',
        'invalid_cvc',
        'incorrect_cvc',
        'insufficient_funds',
        'lost_card',
        'stolen_card',
        'fraudulent',
        'fraud',
        'do_not_honor',
        'generic_decline',
        'authentication_required',
        'card_declined',
        'card_not_supported',
        'card_velocity_exceeded',
        'pickup_card',
        'restricted_card',
        'security_violation',
        'service_not_allowed',
        'transaction_not_allowed',
        'highest_risk_level'
    ],
    PROXY: [
        'proxy',
        'CONNECT',
        'ECONNRESET',
        'socket hang up',
        'stream',
        'aborted',
        'Squid',
        'Access Denied',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENETUNREACH',
        'EHOSTUNREACH',
        'tunnel',
        '407',
        'proxy authentication'
    ]
};

/**
 * Retryable error codes (for axios/http errors)
 */
export const RETRYABLE_ERROR_CODES = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNABORTED',
    'ENOTFOUND',
    'ENETUNREACH',
    'ECONNREFUSED'
];

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CATEGORIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if an error is a proxy-related error
 * @param {Error|string} error - Error object or message
 * @returns {boolean}
 */
export function isProxyError(error) {
    const message = (error?.message || error || '').toLowerCase();
    return ERROR_PATTERNS.PROXY.some(pattern => message.includes(pattern.toLowerCase()));
}

/**
 * Categorize error for retry decision
 * @param {Error|string} error - Error object or message
 * @returns {string} - ErrorCategory value
 */
export function categorizeError(error) {
    const message = (error?.message || error || '').toLowerCase();
    const code = (error?.code || '').toLowerCase();
    
    // Check FATAL patterns first (most specific - fail immediately)
    for (const pattern of ERROR_PATTERNS.FATAL) {
        if (message.includes(pattern.toLowerCase())) {
            return ErrorCategory.FATAL;
        }
    }
    
    // Check CARD_ERROR patterns (card-specific - no retry needed)
    for (const pattern of ERROR_PATTERNS.CARD_ERROR) {
        if (message.includes(pattern.toLowerCase())) {
            return ErrorCategory.CARD_ERROR;
        }
    }
    
    // Check PROXY_ERROR patterns
    if (isProxyError(error)) {
        return ErrorCategory.PROXY_ERROR;
    }
    
    // Check error codes
    if (code && RETRYABLE_ERROR_CODES.includes(code.toUpperCase())) {
        return ErrorCategory.RETRYABLE;
    }
    
    // Check RETRYABLE patterns
    for (const pattern of ERROR_PATTERNS.RETRYABLE) {
        if (message.includes(pattern.toLowerCase())) {
            return ErrorCategory.RETRYABLE;
        }
    }
    
    // Default to RETRYABLE for unknown errors (safer - allows retry)
    return ErrorCategory.RETRYABLE;
}

/**
 * Check if error is retryable
 * @param {Error|string} error - Error object or message
 * @returns {boolean}
 */
export function isRetryable(error) {
    const category = categorizeError(error);
    return category === ErrorCategory.RETRYABLE || category === ErrorCategory.PROXY_ERROR;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED RETRY EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} RetryConfig
 * @property {number} [maxRetries=3] - Maximum number of retries
 * @property {number[]} [backoff=[200,400,800]] - Backoff delays in ms
 * @property {Function} [categorizeError] - Custom error categorization function
 * @property {Function} [onRetry] - Callback before each retry: (attempt, error, delay) => void
 * @property {Function} [onProxyError] - Callback when proxy error detected: (error, attempt) => void
 * @property {boolean} [retryProxyErrors=true] - Whether to retry proxy errors
 * @property {boolean} [retryRetryableErrors=true] - Whether to retry RETRYABLE errors
 * @property {string} [label='Retry'] - Label for logging
 */

/**
 * @typedef {Object} RetryResult
 * @property {boolean} success - Whether operation succeeded
 * @property {*} [result] - Result from successful operation
 * @property {string} [error] - Error message if failed
 * @property {string} [errorCategory] - Error category if failed
 * @property {boolean} [isProxyError] - Whether failure was due to proxy
 * @property {number} attempts - Total number of attempts
 * @property {number} totalRetryTime - Total time spent on retries in ms
 */

/**
 * Execute an operation with unified retry logic
 * 
 * Features:
 * - Fast backoff: 200ms, 400ms, 800ms (configurable)
 * - Error categorization: FATAL and CARD_ERROR fail immediately
 * - Proxy error detection and optional retry
 * - Callback hooks for logging/monitoring
 * 
 * @param {Function} operation - Async function to execute: (attempt) => Promise<any>
 * @param {RetryConfig} [config={}] - Retry configuration
 * @returns {Promise<RetryResult>}
 */
export async function executeWithRetry(operation, config = {}) {
    const maxRetries = config.maxRetries ?? RETRY_DEFAULTS.maxRetries;
    const backoff = config.backoff ?? RETRY_DEFAULTS.backoff;
    const errorCategorizer = config.categorizeError ?? categorizeError;
    const onRetry = config.onRetry;
    const onProxyError = config.onProxyError;
    const retryProxyErrors = config.retryProxyErrors ?? true;
    const retryRetryableErrors = config.retryRetryableErrors ?? true;
    const label = config.label ?? 'Retry';
    
    let lastError = null;
    let attempts = 0;
    let totalRetryTime = 0;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        attempts++;
        
        try {
            const result = await operation(attempt);
            return { success: true, result, attempts, totalRetryTime };
        } catch (error) {
            lastError = error;
            const errorCategory = errorCategorizer(error);
            const errorIsProxy = isProxyError(error);
            
            // Notify proxy error callback
            if (errorIsProxy && onProxyError) {
                onProxyError(error, attempt);
            }
            
            // FATAL or CARD_ERROR - fail immediately (no retry)
            if (errorCategory === ErrorCategory.FATAL || errorCategory === ErrorCategory.CARD_ERROR) {
                return {
                    success: false,
                    error: error.message || String(error),
                    errorCategory,
                    isProxyError: errorIsProxy,
                    attempts,
                    totalRetryTime
                };
            }
            
            // Check if we should retry
            const shouldRetryProxy = errorIsProxy && retryProxyErrors;
            const shouldRetryError = errorCategory === ErrorCategory.RETRYABLE && retryRetryableErrors;
            const hasRetriesLeft = attempt < maxRetries;
            
            if (hasRetriesLeft && (shouldRetryProxy || shouldRetryError)) {
                const delay = backoff[attempt] ?? backoff[backoff.length - 1];
                totalRetryTime += delay;
                
                logger.debug(`[${label}] Retry ${attempt + 1}/${maxRetries} after ${delay}ms (${errorCategory})`);
                
                if (onRetry) {
                    await onRetry(attempt + 1, error, delay);
                }
                
                await sleep(delay);
                continue;
            }
            
            // Not retryable or no retries left - fail
            return {
                success: false,
                error: error.message || String(error),
                errorCategory,
                isProxyError: errorIsProxy,
                attempts,
                totalRetryTime
            };
        }
    }
    
    // All retries exhausted
    return {
        success: false,
        error: lastError?.message || 'Max retries exceeded',
        errorCategory: categorizeError(lastError),
        isProxyError: isProxyError(lastError),
        attempts,
        totalRetryTime
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// RETRY HANDLER CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RetryHandler class for convenient retry operations
 * Wraps the unified executeWithRetry function
 */
export class RetryHandler {
    /**
     * @param {Object} options
     * @param {number} [options.maxRetries=3] - Maximum retry attempts
     * @param {number} [options.baseDelayMs=200] - Base delay in ms
     * @param {boolean} [options.exponential=true] - Use exponential backoff
     */
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelayMs = options.baseDelayMs ?? 200;
        this.exponential = options.exponential ?? true;
        
        // Build backoff array
        this.backoff = [];
        for (let i = 0; i < this.maxRetries; i++) {
            if (this.exponential) {
                this.backoff.push(this.baseDelayMs * (i + 1));
            } else {
                this.backoff.push(this.baseDelayMs);
            }
        }
    }
    
    /**
     * Check if an error is retryable
     * @param {Error} error - Error to check
     * @returns {boolean}
     */
    isRetryable(error) {
        return isRetryable(error);
    }
    
    /**
     * Calculate delay for retry attempt
     * @param {number} attempt - Current attempt number (1-indexed)
     * @returns {number} Delay in milliseconds
     */
    getDelay(attempt) {
        return this.backoff[attempt - 1] ?? this.backoff[this.backoff.length - 1];
    }
    
    /**
     * Execute function with retry logic
     * @param {Function} fn - Async function to execute
     * @param {Object} context - Context for logging
     * @returns {Promise<any>}
     */
    async execute(fn, context = {}) {
        const label = context.label || 'RetryHandler';
        
        const result = await executeWithRetry(
            async () => fn(),
            {
                maxRetries: this.maxRetries,
                backoff: this.backoff,
                label,
                retryProxyErrors: true,
                retryRetryableErrors: true
            }
        );
        
        if (result.success) {
            return result.result;
        }
        
        throw new Error(result.error);
    }
    
    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return sleep(ms);
    }
}

// Export default instance
export const retryHandler = new RetryHandler();
