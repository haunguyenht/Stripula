/**
 * Global Error Handler Middleware
 * 
 * Express error handler that catches all unhandled errors.
 * Integrates with ErrorReporterService for Telegram notifications.
 * Returns appropriate responses based on request type (API vs HTML).
 * 
 * Requirements:
 * - 6.1: Display 500 error page for unhandled errors
 * - 6.2: Display generic "Something went wrong" message without exposing error details
 * - 6.7: Provide options to retry or return to dashboard
 * - 7.1: Return consistent JSON error format for API endpoints
 * - 7.2: Include status code, error type, and user-friendly message
 * - 7.3: Do NOT include stack traces or internal error details in production
 */
export class GlobalErrorHandler {
    constructor(options = {}) {
        this.errorReporter = options.errorReporter || null;
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }

    /**
     * Express error handler middleware
     * 
     * Requirements: 6.1, 6.2, 7.1, 7.2, 7.3
     * 
     * @returns {Function} Express error middleware (err, req, res, next)
     */
    handle() {
        return async (err, req, res, next) => {
            // If headers already sent, delegate to default Express error handler
            if (res.headersSent) {
                return next(err);
            }

            // Generate error ID and report to Telegram
            let errorId = null;
            if (this.errorReporter) {
                try {
                    const result = await this.errorReporter.reportError(err, {
                        req,
                        user: req.user || null
                    });
                    errorId = result.errorId;
                } catch (reportError) {
                    console.error('[GlobalErrorHandler] Failed to report error:', reportError.message);
                    // Generate a fallback error ID
                    errorId = this._generateFallbackErrorId();
                }
            } else {
                errorId = this._generateFallbackErrorId();
            }

            // Log the error
            console.error(`[GlobalErrorHandler] Error ${errorId}:`, err.message);
            if (this.isDevelopment) {
                console.error(err.stack);
            }

            // Format and send response
            const { status, body } = this._formatResponse(err, req, errorId);
            res.status(status).json(body);
        };
    }

    /**
     * Format error response based on request type
     * 
     * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
     * 
     * @param {Error} err - The error object
     * @param {Object} req - Express request object
     * @param {string} errorId - Unique error reference ID
     * @returns {{ status: number, body: Object }} Response status and body
     */
    _formatResponse(err, req, errorId) {
        // Determine HTTP status code
        const status = this._getStatusCode(err);
        
        // Determine error type
        const errorType = this._getErrorType(err, status);
        
        // Get user-friendly message
        const message = this._getUserFriendlyMessage(err, status);

        // Build response body
        const body = {
            status: 'ERROR',
            error: {
                code: status,
                type: errorType,
                message: message
            }
        };

        // Include error reference ID for 500 errors (Requirement 7.6)
        if (status >= 500) {
            body.error.errorId = errorId;
        }

        // Include stack trace only in development mode (Requirement 7.3)
        if (this.isDevelopment && err.stack) {
            body.error.stack = err.stack;
            body.error.details = err.message;
        }

        return { status, body };
    }

    /**
     * Determine HTTP status code from error
     * 
     * @param {Error} err - The error object
     * @returns {number} HTTP status code
     * @private
     */
    _getStatusCode(err) {
        // Check for explicit status code
        if (err.status) return err.status;
        if (err.statusCode) return err.statusCode;
        
        // Check for common error types
        const message = (err.message || '').toLowerCase();
        
        if (err.name === 'ValidationError' || message.includes('validation')) {
            return 400;
        }
        if (err.name === 'UnauthorizedError' || message.includes('unauthorized') || message.includes('authentication')) {
            return 401;
        }
        if (err.name === 'ForbiddenError' || message.includes('forbidden') || message.includes('access denied')) {
            return 403;
        }
        if (err.name === 'NotFoundError' || message.includes('not found')) {
            return 404;
        }
        if (message.includes('rate limit') || message.includes('too many')) {
            return 429;
        }
        
        // Default to 500 for unhandled errors
        return 500;
    }

    /**
     * Get error type string for response
     * 
     * @param {Error} err - The error object
     * @param {number} status - HTTP status code
     * @returns {string} Error type
     * @private
     */
    _getErrorType(err, status) {
        // Use error name if meaningful
        if (err.name && err.name !== 'Error') {
            return err.name;
        }
        
        // Map status codes to types
        const statusTypes = {
            400: 'BadRequest',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'NotFound',
            429: 'TooManyRequests',
            500: 'InternalServerError',
            502: 'BadGateway',
            503: 'ServiceUnavailable',
            504: 'GatewayTimeout'
        };
        
        return statusTypes[status] || 'UnknownError';
    }

    /**
     * Get user-friendly error message
     * 
     * Requirements: 6.2, 7.2 - Generic messages without exposing details
     * 
     * @param {Error} err - The error object
     * @param {number} status - HTTP status code
     * @returns {string} User-friendly message
     * @private
     */
    _getUserFriendlyMessage(err, status) {
        // In production, use generic messages for server errors
        if (!this.isDevelopment && status >= 500) {
            return 'Something went wrong. Please try again later.';
        }
        
        // For client errors, provide more specific messages
        const statusMessages = {
            400: 'Invalid request. Please check your input and try again.',
            401: 'Authentication required. Please log in to continue.',
            403: 'Access denied. You do not have permission to access this resource.',
            404: 'The requested resource was not found.',
            429: 'Too many requests. Please wait a moment and try again.',
            500: 'Something went wrong. Please try again later.',
            502: 'Service temporarily unavailable. Please try again later.',
            503: 'Service is currently under maintenance. Please try again later.',
            504: 'Request timed out. Please try again later.'
        };
        
        // Use status-based message or error message in development
        if (this.isDevelopment && err.message) {
            return err.message;
        }
        
        return statusMessages[status] || 'An unexpected error occurred.';
    }

    /**
     * Generate a fallback error ID when ErrorReporter is not available
     * 
     * @returns {string} Fallback error ID
     * @private
     */
    _generateFallbackErrorId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ERR-${timestamp}${random}`.substring(0, 12);
    }

    /**
     * Create a 404 Not Found handler middleware
     * 
     * Requirement: 7.4 - Return JSON format for API routes
     * 
     * @returns {Function} Express middleware
     */
    notFoundHandler() {
        return (req, res, next) => {
            const { status, body } = this._formatResponse(
                { name: 'NotFoundError', message: 'Resource not found' },
                req,
                null
            );
            res.status(status).json(body);
        };
    }

    /**
     * Create a 403 Forbidden handler
     * 
     * Requirement: 7.5 - Return JSON format with generic message
     * 
     * @param {string} [customMessage] - Optional custom message
     * @returns {{ status: number, body: Object }} Response object
     */
    forbiddenResponse(customMessage) {
        return {
            status: 403,
            body: {
                status: 'ERROR',
                error: {
                    code: 403,
                    type: 'Forbidden',
                    message: customMessage || 'Access denied. You do not have permission to access this resource.'
                }
            }
        };
    }
}

export default GlobalErrorHandler;
