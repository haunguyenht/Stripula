import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

/**
 * Default toast durations
 * Requirements: 7.3, 7.4
 */
const TOAST_DURATIONS = {
  success: 4000,    // Auto-dismiss after 4 seconds - Requirement 7.3
  error: Infinity,  // Keep until dismissed - Requirement 7.4
  warning: 6000,    // Slightly longer for warnings
  info: 4000,       // Same as success
};

/**
 * Retryable error codes that should show a retry action
 * Requirements: 16.5
 */
const RETRYABLE_ERRORS = [
  'NETWORK_ERROR',
  'DATABASE_ERROR',
  'TIMEOUT',
  'CONNECTION_ERROR',
  'GATEWAY_TIMEOUT',
  'SERVER_ERROR',
];

/**
 * Custom hook to access toast notification functionality
 * Uses sonner under the hood for a cleaner API
 * 
 * Features:
 * - Auto-dismiss for success (4s)
 * - Error toasts remain until dismissed
 * - Retry action for retryable errors
 * - Queue support (sonner handles this natively)
 * - Memoized functions to prevent infinite re-render loops
 * 
 * @returns {{
 *   toast: (message: string, options?: object) => string | number,
 *   success: (message: string, options?: object) => string | number,
 *   error: (message: string, options?: ErrorOptions) => string | number,
 *   warning: (message: string, options?: object) => string | number,
 *   info: (message: string, options?: object) => string | number,
 *   dismiss: (id?: string | number) => void,
 *   dismissAll: () => void,
 *   promise: (promise: Promise, options: PromiseOptions) => string | number
 * }}
 * 
 * @typedef {Object} ErrorOptions
 * @property {string} [errorCode] - Error code to determine if retry should be shown
 * @property {Function} [onRetry] - Callback function when retry is clicked
 * @property {string} [description] - Additional description text
 * 
 * @typedef {Object} PromiseOptions
 * @property {string} loading - Message while loading
 * @property {string} success - Message on success
 * @property {string} error - Message on error
 */
export function useToast() {
  /**
   * Show a success toast with auto-dismiss
   */
  const success = useCallback((message, options = {}) => {
    return toast.success(message, {
      duration: TOAST_DURATIONS.success,
      ...options,
    });
  }, []);

  /**
   * Show an error toast that stays until dismissed
   * Supports retry action for retryable errors
   * Requirements: 16.5
   */
  const error = useCallback((message, options = {}) => {
    const { errorCode, onRetry, ...restOptions } = options;
    
    // Show retry if:
    // 1. onRetry callback is provided AND
    // 2. Either errorCode is in RETRYABLE_ERRORS OR no errorCode is provided (caller knows best)
    const isRetryable = !errorCode || RETRYABLE_ERRORS.includes(errorCode);
    const showRetry = typeof onRetry === 'function' && isRetryable;
    
    return toast.error(message, {
      duration: TOAST_DURATIONS.error,
      ...(showRetry && {
        action: {
          label: 'Retry',
          onClick: onRetry,
        },
      }),
      ...restOptions,
    });
  }, []);

  /**
   * Show a warning toast
   */
  const warning = useCallback((message, options = {}) => {
    return toast.warning(message, {
      duration: TOAST_DURATIONS.warning,
      ...options,
    });
  }, []);

  /**
   * Show an info toast
   */
  const info = useCallback((message, options = {}) => {
    return toast.info(message, {
      duration: TOAST_DURATIONS.info,
      ...options,
    });
  }, []);

  /**
   * Show a promise toast that updates based on promise state
   */
  const promise = useCallback((promiseToTrack, options = {}) => {
    return toast.promise(promiseToTrack, {
      loading: options.loading || 'Loading...',
      success: options.success || 'Success!',
      error: options.error || 'Something went wrong',
      ...options,
    });
  }, []);

  const showToast = useCallback((message, options) => toast(message, options), []);
  const dismiss = useCallback((id) => toast.dismiss(id), []);
  const dismissAll = useCallback(() => toast.dismiss(), []);

  return useMemo(() => ({
    toast: showToast,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
    promise,
  }), [showToast, success, error, warning, info, dismiss, dismissAll, promise]);
}

/**
 * Check if an error code is retryable
 * @param {string} errorCode - The error code to check
 * @returns {boolean} - Whether the error is retryable
 */
export function isRetryableError(errorCode) {
  return RETRYABLE_ERRORS.includes(errorCode);
}

/**
 * Export toast durations for external use
 */
export { TOAST_DURATIONS, RETRYABLE_ERRORS };
