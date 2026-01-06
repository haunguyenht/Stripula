import crypto from 'crypto';

/**
 * Error Reporter Service
 * 
 * Captures and reports errors to Telegram with rate limiting.
 * Generates unique error reference IDs for support purposes.
 * Persists errors to database for tracking.
 * 
 * Requirements:
 * - 6.3: Provide unique error reference ID for support purposes
 * - 6.4: Send error details to Telegram admin channel
 * - 6.5: Include error message, stack trace, request path, user ID, timestamp
 * - 6.6: Rate-limit notifications (max 10 per minute for same error type)
 */
export class ErrorReporterService {
    constructor(options = {}) {
        this.telegramBotService = options.telegramBotService;
        this.supabase = options.supabase;
        
        // Rate limiting: Map<errorType, { count, windowStart }>
        this.errorCounts = new Map();
        this.maxErrorsPerMinute = options.maxErrorsPerMinute || 10;
        this.rateLimitWindowMs = options.rateLimitWindowMs || 60000; // 1 minute
        
        // Error ID prefix for easy identification
        this.errorIdPrefix = options.errorIdPrefix || 'ERR';
    }

    /**
     * Report an error to Telegram and persist to database
     * 
     * Requirements: 6.3, 6.4, 6.5, 6.6
     * 
     * @param {Error} error - The error object
     * @param {Object} context - Additional context
     * @param {Object} context.req - Express request object
     * @param {Object} context.user - User object (if authenticated)
     * @param {string} context.errorId - Pre-generated error ID (optional)
     * @returns {Promise<{errorId: string, reported: boolean}>}
     */
    async reportError(error, context = {}) {
        const { req, user, errorId: providedErrorId } = context;
        
        // Generate unique error ID if not provided
        const errorId = providedErrorId || this.generateErrorId();
        
        // Extract error details
        const errorMessage = error?.message || String(error) || 'Unknown error';
        const errorStack = error?.stack || null;
        const errorType = this._getErrorType(error);
        
        // Extract request context
        const path = req?.originalUrl || req?.url || req?.path || null;
        const ipAddress = this._getClientIP(req);
        const userId = user?.id || null;
        const userAgent = req?.headers?.['user-agent'] || null;
        const method = req?.method || null;
        
        const timestamp = new Date().toISOString();
        
        // Check rate limiting before sending to Telegram
        const shouldReport = this._shouldReport(errorType);
        let reportedToTelegram = false;
        
        if (shouldReport && this.telegramBotService) {
            try {
                const formattedMessage = this._formatErrorMessage(error, {
                    errorId,
                    path,
                    method,
                    userId,
                    userAgent,
                    ipAddress,
                    timestamp
                });
                
                await this.telegramBotService.notifyAdmin('APPLICATION ERROR', formattedMessage);
                reportedToTelegram = true;
            } catch (telegramError) {
                console.error('[ErrorReporter] Failed to send Telegram notification:', telegramError.message);
            }
        }
        
        // Persist error to database
        await this._persistError({
            errorId,
            message: errorMessage,
            stack: errorStack,
            path,
            userId,
            ipAddress,
            reportedToTelegram
        });
        
        return { errorId, reported: reportedToTelegram };
    }

    /**
     * Generate a unique error reference ID
     * 
     * Requirement: 6.3 - Unique error reference ID for support
     * 
     * Format: ERR-XXXXXXXX (8 random alphanumeric characters)
     * Uses crypto for randomness to ensure uniqueness
     * 
     * @returns {string} Unique error ID
     */
    generateErrorId() {
        // Generate 8 random bytes and convert to base36 (alphanumeric)
        const randomBytes = crypto.randomBytes(6);
        const randomPart = randomBytes.toString('hex').toUpperCase().substring(0, 8);
        return `${this.errorIdPrefix}-${randomPart}`;
    }

    /**
     * Check if error should be reported based on rate limiting
     * 
     * Requirement: 6.6 - Max 10 notifications per minute for same error type
     * 
     * @param {string} errorType - Type/category of error
     * @returns {boolean} True if should report
     */
    _shouldReport(errorType) {
        const now = Date.now();
        const key = errorType || 'unknown';
        
        // Get or create rate limit entry
        let entry = this.errorCounts.get(key);
        
        if (!entry || (now - entry.windowStart) >= this.rateLimitWindowMs) {
            // Start new window
            entry = { count: 0, windowStart: now };
            this.errorCounts.set(key, entry);
        }
        
        // Check if under limit
        if (entry.count < this.maxErrorsPerMinute) {
            entry.count++;
            return true;
        }
        
        // Rate limited - log but don't report
        console.warn(`[ErrorReporter] Rate limited: ${key} (${entry.count}/${this.maxErrorsPerMinute} in window)`);
        return false;
    }

    /**
     * Format error message for Telegram notification
     * 
     * Requirement: 6.5 - Include error message, stack trace, path, user ID, timestamp
     * 
     * @param {Error} error - The error object
     * @param {Object} context - Error context
     * @returns {string} Formatted message for Telegram
     */
    _formatErrorMessage(error, context) {
        const {
            errorId,
            path,
            method,
            userId,
            userAgent,
            ipAddress,
            timestamp
        } = context;
        
        const errorMessage = error?.message || String(error) || 'Unknown error';
        const errorName = error?.name || 'Error';
        const errorStack = error?.stack || 'No stack trace available';
        
        // Format timestamp for display
        const displayTime = new Date(timestamp).toLocaleString('en-US', {
            timeZone: 'UTC',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Truncate stack trace if too long (Telegram has 4096 char limit)
        const maxStackLength = 1500;
        const truncatedStack = errorStack.length > maxStackLength
            ? errorStack.substring(0, maxStackLength) + '\n... (truncated)'
            : errorStack;
        
        // Build message parts
        const parts = [
            `🆔 <b>Error ID:</b> <code>${errorId}</code>`,
            ``,
            `❌ <b>${errorName}:</b>`,
            `<code>${this._escapeHtml(errorMessage)}</code>`,
            ``
        ];
        
        // Request info
        if (path || method) {
            parts.push(`📍 <b>Request:</b> ${method || 'GET'} ${path || 'N/A'}`);
        }
        
        // User info
        if (userId) {
            parts.push(`👤 <b>User ID:</b> <code>${userId}</code>`);
        } else {
            parts.push(`👤 <b>User:</b> Anonymous`);
        }
        
        // IP address
        if (ipAddress) {
            parts.push(`🌐 <b>IP:</b> ${ipAddress}`);
        }
        
        // User agent (truncated)
        if (userAgent) {
            const shortUA = userAgent.length > 80 
                ? userAgent.substring(0, 80) + '...' 
                : userAgent;
            parts.push(`📱 <b>UA:</b> ${this._escapeHtml(shortUA)}`);
        }
        
        parts.push(``);
        parts.push(`🕐 <b>Time:</b> ${displayTime} UTC`);
        parts.push(``);
        parts.push(`📋 <b>Stack Trace:</b>`);
        parts.push(`<pre>${this._escapeHtml(truncatedStack)}</pre>`);
        
        return parts.join('\n');
    }

    /**
     * Persist error to database
     * 
     * @param {Object} errorData - Error data to persist
     * @private
     */
    async _persistError(errorData) {
        if (!this.supabase) {
            console.warn('[ErrorReporter] Supabase not configured, skipping persistence');
            return;
        }
        
        try {
            const { error } = await this.supabase
                .from('error_logs')
                .insert({
                    error_id: errorData.errorId,
                    message: errorData.message,
                    stack: errorData.stack,
                    path: errorData.path,
                    user_id: errorData.userId,
                    ip_address: errorData.ipAddress,
                    reported_to_telegram: errorData.reportedToTelegram
                });
            
            if (error) {
                console.error('[ErrorReporter] Failed to persist error:', error.message);
            }
        } catch (err) {
            console.error('[ErrorReporter] Database error:', err.message);
        }
    }

    /**
     * Get error type/category for rate limiting
     * 
     * @param {Error} error - The error object
     * @returns {string} Error type
     * @private
     */
    _getErrorType(error) {
        if (!error) return 'unknown';
        
        // Use error name if available
        if (error.name && error.name !== 'Error') {
            return error.name;
        }
        
        // Try to categorize by message patterns
        const message = (error.message || '').toLowerCase();
        
        if (message.includes('timeout')) return 'timeout';
        if (message.includes('connection')) return 'connection';
        if (message.includes('database') || message.includes('supabase')) return 'database';
        if (message.includes('stripe')) return 'stripe';
        if (message.includes('telegram')) return 'telegram';
        if (message.includes('validation')) return 'validation';
        if (message.includes('auth')) return 'auth';
        
        return 'general';
    }

    /**
     * Get client IP address from request
     * 
     * @param {Object} req - Express request object
     * @returns {string|null} Client IP address
     * @private
     */
    _getClientIP(req) {
        if (!req) return null;
        
        // Check common proxy headers
        const forwarded = req.headers?.['x-forwarded-for'];
        if (forwarded) {
            // x-forwarded-for can contain multiple IPs, take the first
            return forwarded.split(',')[0].trim();
        }
        
        return req.headers?.['x-real-ip'] 
            || req.connection?.remoteAddress 
            || req.socket?.remoteAddress 
            || req.ip 
            || null;
    }

    /**
     * Escape HTML special characters for Telegram
     * 
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Clear rate limit counters (useful for testing)
     */
    clearRateLimits() {
        this.errorCounts.clear();
    }

    /**
     * Get current rate limit status for an error type
     * 
     * @param {string} errorType - Error type to check
     * @returns {Object} Rate limit status
     */
    getRateLimitStatus(errorType) {
        const entry = this.errorCounts.get(errorType || 'unknown');
        if (!entry) {
            return { count: 0, remaining: this.maxErrorsPerMinute, windowStart: null };
        }
        
        const now = Date.now();
        const windowExpired = (now - entry.windowStart) >= this.rateLimitWindowMs;
        
        if (windowExpired) {
            return { count: 0, remaining: this.maxErrorsPerMinute, windowStart: null };
        }
        
        return {
            count: entry.count,
            remaining: Math.max(0, this.maxErrorsPerMinute - entry.count),
            windowStart: entry.windowStart,
            windowExpiresIn: this.rateLimitWindowMs - (now - entry.windowStart)
        };
    }
}

export default ErrorReporterService;
