import { toast } from 'sonner';

/**
 * Custom hook to access toast notification functionality
 * Uses sonner under the hood for a cleaner API
 * 
 * @returns {{
 *   toast: (message: string, options?: object) => string | number,
 *   success: (message: string, options?: object) => string | number,
 *   error: (message: string, options?: object) => string | number,
 *   warning: (message: string, options?: object) => string | number,
 *   info: (message: string, options?: object) => string | number,
 *   dismiss: (id?: string | number) => void,
 *   dismissAll: () => void
 * }}
 */
export function useToast() {
  return {
    toast: (message, options) => toast(message, options),
    success: (message, options) => toast.success(message, options),
    error: (message, options) => toast.error(message, options),
    warning: (message, options) => toast.warning(message, options),
    info: (message, options) => toast.info(message, options),
    dismiss: (id) => toast.dismiss(id),
    dismissAll: () => toast.dismiss(),
  };
}
