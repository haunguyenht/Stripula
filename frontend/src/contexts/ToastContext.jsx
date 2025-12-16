import { createContext, useState, useCallback, useRef, useEffect } from 'react';

const DEFAULT_DURATION = 4000;
const VALID_TYPES = ['success', 'error', 'warning', 'info'];

export const ToastContext = createContext(null);

/**
 * ToastProvider Component
 * Manages toast notification state globally
 * Provides methods to show, dismiss, and manage toasts
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  // Dismiss a specific toast by ID
  const dismiss = useCallback((id) => {
    // Clear any existing timer for this toast
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  // Create a new toast
  const toast = useCallback((options) => {
    const {
      message,
      type = 'info',
      duration = DEFAULT_DURATION,
      persistent = false
    } = options;

    // Validate type, default to 'info' if invalid
    const validType = VALID_TYPES.includes(type) ? type : 'info';
    
    // Validate duration, use default if negative
    const validDuration = duration > 0 ? duration : DEFAULT_DURATION;

    // Generate unique ID
    const id = crypto.randomUUID();

    const newToast = {
      id,
      message,
      type: validType,
      duration: validDuration,
      persistent
    };

    setToasts(prev => [...prev, newToast]);

    // Set up auto-dismiss timer if not persistent
    if (!persistent) {
      const timer = setTimeout(() => {
        dismiss(id);
      }, validDuration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [dismiss]);

  // Convenience methods for each toast type
  const success = useCallback((message, options = {}) => {
    return toast({ ...options, message, type: 'success' });
  }, [toast]);

  const error = useCallback((message, options = {}) => {
    return toast({ ...options, message, type: 'error' });
  }, [toast]);

  const warning = useCallback((message, options = {}) => {
    return toast({ ...options, message, type: 'warning' });
  }, [toast]);

  const info = useCallback((message, options = {}) => {
    return toast({ ...options, message, type: 'info' });
  }, [toast]);

  const value = {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}
