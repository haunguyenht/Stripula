import { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  classifyError, 
  getErrorMessage, 
  isRetryableError, 
  isSessionExpired 
} from '@/utils/errorHandler';

/**
 * useErrorHandler Hook
 * Provides centralized error handling with toast notifications,
 * session expiry handling, and retry support.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 * 
 * @param {Object} options - Hook options
 * @param {Function} options.onSessionExpired - Custom session expiry handler
 * @returns {Object} Error handling methods
 */
export function useErrorHandler(options = {}) {
  const { onSessionExpired: customSessionHandler } = options;
  const { error: showError, warning, info } = useToast();
  const { logout } = useAuth();

  /**
   * Handle session expiry - Requirement 16.4
   * Shows toast and logs out user
   */
  const handleSessionExpiry = useCallback(async () => {
    showError('Your session has expired. Please log in again.');
    await logout();
    // Call custom handler if provided (e.g., for navigation)
    if (customSessionHandler) {
      customSessionHandler();
    }
  }, [showError, logout, customSessionHandler]);

  /**
   * Handle an error with appropriate toast and actions
   * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
   * 
   * @param {Error|Object} error - The error to handle
   * @param {Object} options - Handler options
   * @param {Function} options.onRetry - Retry callback for retryable errors
   * @param {string} options.fallbackMessage - Fallback error message
   * @param {boolean} options.showToast - Whether to show toast (default: true)
   * @returns {Object} Error info with code, message, and flags
   */
  const handleError = useCallback((error, options = {}) => {
    const { onRetry, fallbackMessage, showToast = true } = options;
    
    const errorCode = classifyError(error);
    const message = getErrorMessage(error, fallbackMessage);
    const canRetry = isRetryableError(error);
    const sessionExpired = isSessionExpired(error);
    
    // Handle session expiry - Requirement 16.4
    if (sessionExpired) {
      handleSessionExpiry();
      return {
        code: errorCode,
        message,
        isRetryable: false,
        isSessionExpired: true,
        handled: true
      };
    }
    
    // Show toast with retry action if applicable - Requirement 16.5
    if (showToast) {
      if (canRetry && typeof onRetry === 'function') {
        showError(message, {
          errorCode,
          onRetry
        });
      } else {
        showError(message);
      }
    }
    
    return {
      code: errorCode,
      message,
      isRetryable: canRetry,
      isSessionExpired: false,
      handled: true
    };
  }, [showError, handleSessionExpiry]);

  /**
   * Handle network errors - Requirement 16.1
   * @param {Error} error - Network error
   * @param {Function} onRetry - Retry callback
   */
  const handleNetworkError = useCallback((error, onRetry) => {
    return handleError(error, {
      onRetry,
      fallbackMessage: 'Connection error - please try again'
    });
  }, [handleError]);

  /**
   * Handle server errors - Requirement 16.2
   * @param {Error|Object} error - Server error
   * @param {Function} onRetry - Retry callback
   */
  const handleServerError = useCallback((error, onRetry) => {
    return handleError(error, {
      onRetry,
      fallbackMessage: 'Server error - please try again later'
    });
  }, [handleError]);

  /**
   * Handle validation errors - Requirement 16.3
   * Returns error info without showing toast (for inline display)
   * @param {Error|Object} error - Validation error
   * @returns {Object} Error info for inline display
   */
  const handleValidationError = useCallback((error) => {
    const errorCode = classifyError(error);
    const message = getErrorMessage(error, 'Please check your input and try again');
    
    // Don't show toast for validation errors - they should be shown inline
    return {
      code: errorCode,
      message,
      isRetryable: false,
      isSessionExpired: false,
      isValidationError: true
    };
  }, []);

  /**
   * Create an error handler for async operations
   * @param {Object} options - Handler options
   * @returns {Function} Error handler function
   */
  const createHandler = useCallback((options = {}) => {
    return (error, retryFn) => handleError(error, { ...options, onRetry: retryFn });
  }, [handleError]);

  return {
    handleError,
    handleNetworkError,
    handleServerError,
    handleValidationError,
    handleSessionExpiry,
    createHandler,
    // Re-export utilities for convenience
    classifyError,
    getErrorMessage,
    isRetryableError,
    isSessionExpired
  };
}

export default useErrorHandler;
