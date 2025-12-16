import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

/**
 * Custom hook to access toast notification context
 * Provides methods to show, dismiss, and manage toast notifications
 * 
 * @returns {{
 *   toasts: Array<{id: string, message: string, type: string, duration: number, persistent: boolean}>,
 *   toast: (options: {message: string, type?: string, duration?: number, persistent?: boolean}) => string,
 *   success: (message: string, options?: {duration?: number, persistent?: boolean}) => string,
 *   error: (message: string, options?: {duration?: number, persistent?: boolean}) => string,
 *   warning: (message: string, options?: {duration?: number, persistent?: boolean}) => string,
 *   info: (message: string, options?: {duration?: number, persistent?: boolean}) => string,
 *   dismiss: (id: string) => void,
 *   dismissAll: () => void
 * }}
 * @throws {Error} If used outside of ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider. Wrap your application with <ToastProvider> to use toast notifications.');
  }
  
  return context;
}
