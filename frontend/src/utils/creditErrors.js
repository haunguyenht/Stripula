/**
 * Credit Error Handler Utility
 * Provides user-friendly messages for credit-related API errors
 * and backend error handling for batch processing
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

import { classifyError, isRetryableError } from './errorHandler';

/**
 * Backend error messages for batch processing
 * Requirements: 6.1, 6.2, 6.5, 16.1, 16.2
 */
export const BACKEND_ERROR_MESSAGES = {
    PAYLOAD_TOO_LARGE: {
        title: 'Batch Too Large',
        message: 'Batch too large. Please reduce to under 5,000 cards per batch.',
        severity: 'error'
    },
    SERVER_ERROR: {
        title: 'Server Error',
        getMessage: (data) => data?.message || 'A server error occurred. Your processed results have been preserved.',
        severity: 'error'
    },
    TIMEOUT: {
        title: 'Request Timeout',
        message: 'Request timed out. Try reducing batch size or check your connection.',
        severity: 'warning'
    },
    CONNECTION_LOST: {
        title: 'Connection Lost',
        message: 'Connection lost. Your processed results have been preserved. Please try again.',
        severity: 'warning'
    },
    GATEWAY_TIMEOUT: {
        title: 'Gateway Timeout',
        message: 'The server took too long to respond. Try reducing batch size.',
        severity: 'warning'
    }
};

/**
 * Credit error codes and their user-friendly messages
 */
export const CREDIT_ERROR_MESSAGES = {
    CREDIT_INSUFFICIENT: {
        title: 'Insufficient Credits',
        getMessage: (data) => {
            const balance = data?.currentBalance ?? 0;
            const required = data?.requiredCredits ?? 0;
            return `Not enough credits. Balance: ${balance.toFixed(1)}, Required: ${required.toFixed(1)}`;
        },
        severity: 'error'
    },
    CREDIT_OPERATION_LOCKED: {
        title: 'Operation In Progress',
        getMessage: () => 'Another validation is already running. Please wait or stop it first.',
        severity: 'warning'
    },
    CREDIT_DUPLICATE_REQUEST: {
        title: 'Duplicate Request',
        getMessage: () => 'This request was already processed.',
        severity: 'info'
    },
    CREDIT_LOCK_TIMEOUT: {
        title: 'Server Busy',
        getMessage: () => 'Server is busy. Please try again in a moment.',
        severity: 'warning'
    },
    CREDIT_NOT_FREE_TIER: {
        title: 'Not Available',
        getMessage: () => 'Daily claim is only available for free tier users.',
        severity: 'info'
    },
    CREDIT_ALREADY_CLAIMED: {
        title: 'Already Claimed',
        getMessage: (data) => {
            const resetTime = data?.nextClaimAvailable;
            const resetStr = resetTime ? formatResetTime(resetTime) : 'tomorrow';
            return `You've already claimed today. Next claim available at ${resetStr}.`;
        },
        severity: 'info'
    },
    GATEWAY_INACTIVE: {
        title: 'Gateway Unavailable',
        getMessage: (data) => data?.message || 'This gateway is currently unavailable.',
        severity: 'error'
    },
    GATEWAY_MAINTENANCE: {
        title: 'Gateway Maintenance',
        getMessage: (data) => data?.reason || 'Gateway is under maintenance. Please try again later.',
        severity: 'warning'
    },
    AUTH_REQUIRED: {
        title: 'Login Required',
        getMessage: () => 'Please log in to continue.',
        severity: 'error'
    }
};

/**
 * Format reset time for display
 * @param {string} isoTime - ISO timestamp
 * @returns {string} Formatted time string
 */
function formatResetTime(isoTime) {
    try {
        const date = new Date(isoTime);
        const now = new Date();
        
        // If it's today, show time only
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // If it's tomorrow, show "tomorrow at HH:MM"
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === tomorrow.toDateString()) {
            return `tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Otherwise show full date
        return date.toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch {
        return 'midnight UTC';
    }
}

/**
 * Get user-friendly error info for a credit error code
 * @param {string} code - Error code from API
 * @param {Object} data - Additional error data from API
 * @returns {{ title: string, message: string, severity: string }}
 */
export function getCreditErrorInfo(code, data = {}) {
    const errorConfig = CREDIT_ERROR_MESSAGES[code];
    
    if (errorConfig) {
        return {
            title: errorConfig.title,
            message: errorConfig.getMessage(data),
            severity: errorConfig.severity
        };
    }
    
    // Default for unknown errors
    return {
        title: 'Error',
        message: data?.message || 'An unexpected error occurred.',
        severity: 'error'
    };
}

/**
 * Check if an API response is a credit-related error
 * @param {Response} response - Fetch response object
 * @returns {boolean}
 */
export function isCreditError(response) {
    return response.status === 429 || response.status === 402 || response.status === 409;
}

/**
 * Check if an API response is a backend batch processing error
 * Requirements: 6.1, 6.2, 6.5
 * @param {Response} response - Fetch response object
 * @returns {boolean}
 */
export function isBackendError(response) {
    return response.status === 413 || response.status === 500 || response.status === 504;
}

/**
 * Get backend error info based on HTTP status
 * Requirements: 6.1, 6.2, 6.5
 * @param {number} status - HTTP status code
 * @param {Object} data - Response data (if available)
 * @returns {{ title: string, message: string, severity: string }}
 */
export function getBackendErrorInfo(status, data = {}) {
    switch (status) {
        case 413:
            return {
                title: BACKEND_ERROR_MESSAGES.PAYLOAD_TOO_LARGE.title,
                message: BACKEND_ERROR_MESSAGES.PAYLOAD_TOO_LARGE.message,
                severity: BACKEND_ERROR_MESSAGES.PAYLOAD_TOO_LARGE.severity
            };
        case 500:
            return {
                title: BACKEND_ERROR_MESSAGES.SERVER_ERROR.title,
                message: BACKEND_ERROR_MESSAGES.SERVER_ERROR.getMessage(data),
                severity: BACKEND_ERROR_MESSAGES.SERVER_ERROR.severity
            };
        case 504:
            return {
                title: BACKEND_ERROR_MESSAGES.GATEWAY_TIMEOUT.title,
                message: BACKEND_ERROR_MESSAGES.GATEWAY_TIMEOUT.message,
                severity: BACKEND_ERROR_MESSAGES.GATEWAY_TIMEOUT.severity
            };
        default:
            return {
                title: 'Error',
                message: data?.message || `Request failed with status ${status}`,
                severity: 'error'
            };
    }
}

/**
 * Handle backend batch processing errors
 * Returns error info if it's a backend error, null otherwise
 * Requirements: 6.1, 6.2, 6.5
 * 
 * @param {Response} response - Fetch response object
 * @returns {Promise<{ title: string, message: string, severity: string, status: number, data: Object, preserveResults: boolean } | null>}
 */
export async function handleBackendError(response) {
    if (!isBackendError(response)) {
        return null;
    }
    
    let data = {};
    try {
        data = await response.json();
    } catch {
        // If we can't parse JSON, continue with empty data
    }
    
    const errorInfo = getBackendErrorInfo(response.status, data);
    
    return {
        ...errorInfo,
        status: response.status,
        data,
        // For 500 errors, we want to preserve any results that were processed
        preserveResults: response.status === 500
    };
}

/**
 * Handle timeout/connection errors from fetch
 * Requirements: 6.5
 * @param {Error} error - The error object
 * @returns {{ title: string, message: string, severity: string, isTimeout: boolean, preserveResults: boolean } | null}
 */
export function handleTimeoutError(error) {
    if (!error) return null;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';
    
    // Check for timeout errors
    if (errorName === 'timeouterror' || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('timed out')) {
        return {
            title: BACKEND_ERROR_MESSAGES.TIMEOUT.title,
            message: BACKEND_ERROR_MESSAGES.TIMEOUT.message,
            severity: BACKEND_ERROR_MESSAGES.TIMEOUT.severity,
            isTimeout: true,
            preserveResults: true
        };
    }
    
    // Check for connection/network errors
    if (errorName === 'typeerror' && errorMessage.includes('failed to fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection')) {
        return {
            title: BACKEND_ERROR_MESSAGES.CONNECTION_LOST.title,
            message: BACKEND_ERROR_MESSAGES.CONNECTION_LOST.message,
            severity: BACKEND_ERROR_MESSAGES.CONNECTION_LOST.severity,
            isTimeout: false,
            preserveResults: true
        };
    }
    
    return null;
}

/**
 * Handle credit-related API errors
 * Returns error info if it's a credit error, null otherwise
 * Requirements: 16.1, 16.2, 16.5
 * 
 * @param {Response} response - Fetch response object
 * @returns {Promise<{ title: string, message: string, severity: string, code: string, data: Object, isRetryable: boolean } | null>}
 */
export async function handleCreditError(response) {
    if (!isCreditError(response) && response.ok) {
        return null;
    }
    
    // Check for backend errors first (413, 500, 504)
    const backendError = await handleBackendError(response);
    if (backendError) {
        return {
            ...backendError,
            code: `HTTP_${response.status}`,
            isRetryable: backendError.status === 500 || backendError.status === 504
        };
    }
    
    try {
        const data = await response.json();
        const code = data?.code || 'UNKNOWN_ERROR';
        const errorInfo = getCreditErrorInfo(code, data);
        
        // Determine if error is retryable
        const retryableCodes = ['CREDIT_LOCK_TIMEOUT', 'CREDIT_OPERATION_LOCKED'];
        const isRetryable = retryableCodes.includes(code) || isRetryableError({ code });
        
        return {
            ...errorInfo,
            code,
            data,
            isRetryable
        };
    } catch {
        // If we can't parse JSON, return generic error
        return {
            title: 'Error',
            message: `Request failed with status ${response.status}`,
            severity: 'error',
            code: 'UNKNOWN_ERROR',
            data: {},
            isRetryable: response.status >= 500
        };
    }
}

/**
 * Show appropriate toast for credit error
 * Requirements: 16.1, 16.2, 16.5
 * @param {Object} toast - Toast functions from useToast hook
 * @param {Object} errorInfo - Error info from handleCreditError
 * @param {Function} onRetry - Optional retry callback for retryable errors
 */
export function showCreditErrorToast(toast, errorInfo, onRetry) {
    const { title, message, severity, code, isRetryable } = errorInfo;
    const fullMessage = title ? `${title}: ${message}` : message;
    
    // Build toast options
    const toastOptions = {};
    
    // Add retry action for retryable errors - Requirement 16.5
    if (isRetryable && typeof onRetry === 'function') {
        toastOptions.errorCode = code;
        toastOptions.onRetry = onRetry;
    }
    
    switch (severity) {
        case 'warning':
            toast.warning(fullMessage, toastOptions);
            break;
        case 'info':
            toast.info(fullMessage, toastOptions);
            break;
        case 'error':
        default:
            toast.error(fullMessage, toastOptions);
            break;
    }
}
