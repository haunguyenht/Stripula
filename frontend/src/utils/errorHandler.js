/**
 * Comprehensive Error Handler Utility
 * Provides centralized error handling with user-friendly messages
 * and retry support for retryable errors.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

/**
 * Error codes that are retryable
 * Requirements: 16.5
 */
export const RETRYABLE_ERROR_CODES = [
  'NETWORK_ERROR',
  'DATABASE_ERROR',
  'TIMEOUT',
  'CONNECTION_ERROR',
  'GATEWAY_TIMEOUT',
  'SERVER_ERROR',
];

/**
 * Error message mapping for user-friendly display
 * Requirements: 16.1, 16.2, 16.3
 */
export const ERROR_MESSAGES = {
  // Network errors - Requirement 16.1
  NETWORK_ERROR: 'Connection error - please try again',
  CONNECTION_ERROR: 'Connection error - please try again',
  TIMEOUT: 'Request timed out - please try again',
  GATEWAY_TIMEOUT: 'Server took too long to respond - please try again',
  
  // Server errors - Requirement 16.2
  SERVER_ERROR: 'Server error - please try again later',
  DATABASE_ERROR: 'Database error - please try again',
  INTERNAL_ERROR: 'An internal error occurred',
  
  // Validation errors - Requirement 16.3
  INVALID_CREDIT_RATE: 'Please enter a valid credit rate between 0.1 and 100.0',
  VALIDATION_ERROR: 'Please check your input and try again',
  INVALID_INPUT: 'Invalid input provided',
  
  // Auth errors - Requirement 16.4
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  AUTH_REQUIRED: 'Please log in to continue.',
  
  // Gateway errors
  GATEWAY_NOT_FOUND: 'Gateway not found. Please refresh and try again.',
  GATEWAY_UNAVAILABLE: 'Gateway is currently unavailable.',
  
  // Default
  DEFAULT: 'An unexpected error occurred. Please try again.',
};

/**
 * Classify an error based on its properties
 * @param {Error|Response|Object} error - The error to classify
 * @returns {string} Error code
 */
export function classifyError(error) {
  if (!error) return 'DEFAULT';
  
  // Check for HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'GATEWAY_NOT_FOUND';
      case 408:
      case 504:
        return 'GATEWAY_TIMEOUT';
      case 500:
        return 'SERVER_ERROR';
      case 502:
      case 503:
        return 'GATEWAY_UNAVAILABLE';
    }
  }
  
  // Check error message patterns
  const message = (error.message || error.error || '').toLowerCase();
  
  if (message.includes('network') || message.includes('failed to fetch')) {
    return 'NETWORK_ERROR';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'TIMEOUT';
  }
  if (message.includes('connection')) {
    return 'CONNECTION_ERROR';
  }
  if (message.includes('session') || message.includes('expired')) {
    return 'SESSION_EXPIRED';
  }
  if (message.includes('unauthorized') || message.includes('not authenticated')) {
    return 'UNAUTHORIZED';
  }
  if (message.includes('forbidden') || message.includes('permission')) {
    return 'FORBIDDEN';
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }
  
  // Check for error code property
  if (error.code) {
    if (ERROR_MESSAGES[error.code]) {
      return error.code;
    }
  }
  
  return 'DEFAULT';
}

/**
 * Get user-friendly error message
 * @param {Error|Response|Object} error - The error
 * @param {string} [fallbackMessage] - Fallback message if none found
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, fallbackMessage) {
  if (!error) return fallbackMessage || ERROR_MESSAGES.DEFAULT;
  
  // If error has a specific message from server, use it for server errors
  const errorCode = classifyError(error);
  
  // For server errors, prefer the server's message if available
  if (errorCode === 'SERVER_ERROR' && error.message) {
    return error.message;
  }
  
  // Use predefined message for known error codes
  if (ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  
  // Fallback to error message or default
  return error.message || fallbackMessage || ERROR_MESSAGES.DEFAULT;
}

/**
 * Check if an error is retryable
 * @param {Error|Response|Object} error - The error
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(error) {
  const errorCode = classifyError(error);
  return RETRYABLE_ERROR_CODES.includes(errorCode);
}

/**
 * Check if error indicates session expiry
 * @param {Error|Response|Object} error - The error
 * @returns {boolean} Whether session has expired
 */
export function isSessionExpired(error) {
  const errorCode = classifyError(error);
  return errorCode === 'UNAUTHORIZED' || errorCode === 'SESSION_EXPIRED';
}

/**
 * Handle API response and extract error info
 * @param {Response} response - Fetch response
 * @returns {Promise<{success: boolean, data?: any, error?: Object}>}
 */
export async function handleApiResponse(response) {
  if (response.ok) {
    try {
      const data = await response.json();
      return { success: true, data };
    } catch {
      return { success: true, data: null };
    }
  }
  
  // Extract error info
  let errorData = {};
  try {
    errorData = await response.json();
  } catch {
    // If we can't parse JSON, use status text
    errorData = { message: response.statusText };
  }
  
  const errorCode = classifyError({ status: response.status, ...errorData });
  const message = getErrorMessage({ status: response.status, ...errorData });
  
  return {
    success: false,
    error: {
      code: errorCode,
      message,
      status: response.status,
      data: errorData,
      isRetryable: isRetryableError({ code: errorCode }),
      isSessionExpired: isSessionExpired({ code: errorCode }),
    }
  };
}

/**
 * Create error handler with toast integration
 * @param {Object} toast - Toast functions from useToast
 * @param {Object} options - Handler options
 * @returns {Function} Error handler function
 */
export function createErrorHandler(toast, options = {}) {
  const { onSessionExpired, onRetry } = options;
  
  return (error, retryFn) => {
    const errorCode = classifyError(error);
    const message = getErrorMessage(error);
    const canRetry = isRetryableError(error) && typeof retryFn === 'function';
    
    // Handle session expiry - Requirement 16.4
    if (isSessionExpired(error)) {
      toast.error(message);
      if (onSessionExpired) {
        onSessionExpired();
      }
      return;
    }
    
    // Show error toast with retry action if applicable - Requirement 16.5
    if (canRetry) {
      toast.error(message, {
        errorCode,
        onRetry: () => {
          if (onRetry) onRetry();
          retryFn();
        },
      });
    } else {
      toast.error(message);
    }
  };
}

export default {
  classifyError,
  getErrorMessage,
  isRetryableError,
  isSessionExpired,
  handleApiResponse,
  createErrorHandler,
  ERROR_MESSAGES,
  RETRYABLE_ERROR_CODES,
};
