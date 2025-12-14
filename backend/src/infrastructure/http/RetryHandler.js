/**
 * Retry handler for network requests
 * Implements exponential backoff with retryable error detection
 */
export class RetryHandler {
    static RETRYABLE_ERROR_CODES = [
        'econnreset',
        'etimedout',
        'econnaborted',
        'enotfound',
        'enetunreach',
        'econnrefused'
    ];

    static RETRYABLE_MESSAGE_PATTERNS = [
        'timeout',
        'network',
        'socket',
        'econnreset',
        'econnrefused'
    ];

    /**
     * @param {Object} options
     * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
     * @param {number} options.baseDelayMs - Base delay in ms (default: 1000)
     * @param {boolean} options.exponential - Use exponential backoff (default: true)
     */
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelayMs = options.baseDelayMs ?? 1000;
        this.exponential = options.exponential ?? true;
    }

    /**
     * Check if an error is retryable
     * @param {Error} error - Error to check
     * @returns {boolean}
     */
    isRetryable(error) {
        const message = error.message?.toLowerCase() || '';
        const code = error.code?.toLowerCase() || '';

        // Check error codes
        if (RetryHandler.RETRYABLE_ERROR_CODES.includes(code)) {
            return true;
        }

        // Check message patterns
        return RetryHandler.RETRYABLE_MESSAGE_PATTERNS.some(pattern => 
            message.includes(pattern) || code.includes(pattern)
        );
    }

    /**
     * Calculate delay for retry attempt
     * @param {number} attempt - Current attempt number (1-indexed)
     * @returns {number} Delay in milliseconds
     */
    getDelay(attempt) {
        if (this.exponential) {
            return this.baseDelayMs * attempt;
        }
        return this.baseDelayMs;
    }

    /**
     * Execute function with retry logic
     * @param {Function} fn - Async function to execute
     * @param {Object} context - Context for logging
     * @returns {Promise<any>}
     */
    async execute(fn, context = {}) {
        let lastError;
        const label = context.label || 'RetryHandler';

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (this.isRetryable(error) && attempt < this.maxRetries) {
                    const delay = this.getDelay(attempt);
                    console.log(`[${label}] Retry ${attempt}/${this.maxRetries} after error: ${error.code || error.message}`);
                    await this.sleep(delay);
                } else {
                    throw error;
                }
            }
        }

        throw lastError;
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export default instance
export const retryHandler = new RetryHandler();
