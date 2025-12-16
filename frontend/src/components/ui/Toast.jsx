import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast type to style mapping
 * Maps toast types to their corresponding colors and icons
 * 
 * Light Mode:
 * - success: Emerald (#10B981)
 * - error: Rose (#F43F5E)
 * - warning: Amber (#F59E0B)
 * - info: Sky (#0EA5E9)
 * 
 * Dark Mode:
 * - success: Emerald (#34D399)
 * - error: Rose (#FB7185)
 * - warning: Amber (#FBBF24)
 * - info: Sky (#38BDF8)
 */
const typeConfig = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-emerald-500 dark:text-emerald-400',
    borderClass: 'border-l-emerald-500 dark:border-l-emerald-400',
    bgClass: 'bg-emerald-50/50 dark:bg-emerald-500/10',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-rose-500 dark:text-rose-400',
    borderClass: 'border-l-rose-500 dark:border-l-rose-400',
    bgClass: 'bg-rose-50/50 dark:bg-rose-500/10',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500 dark:text-amber-400',
    borderClass: 'border-l-amber-500 dark:border-l-amber-400',
    bgClass: 'bg-amber-50/50 dark:bg-amber-500/10',
  },
  info: {
    icon: Info,
    iconClass: 'text-sky-500 dark:text-sky-400',
    borderClass: 'border-l-sky-500 dark:border-l-sky-400',
    bgClass: 'bg-sky-50/50 dark:bg-sky-500/10',
  },
};

/**
 * Toast Component
 * Displays a single toast notification with theme support
 * 
 * Features:
 * - Uses floating-panel CSS class for consistent elevation
 * - Type-to-style mapping (success/error/warning/info)
 * - Lucide icons for each toast type
 * - Light and dark theme support via CSS variables
 * - Accessible dismiss button
 * - Framer Motion enter/exit animations
 * 
 * @param {Object} props
 * @param {string} props.id - Unique toast identifier
 * @param {string} props.message - Toast message content
 * @param {('success'|'error'|'warning'|'info')} props.type - Toast type
 * @param {function} props.onDismiss - Callback when dismiss button is clicked
 */
export function Toast({ id, message, type = 'info', onDismiss }) {
  // Get config for the toast type, default to info if invalid
  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        opacity: { duration: 0.2 }
      }}
      className={cn(
        'flex items-start gap-3 p-4 min-w-[300px] max-w-[400px]',
        'rounded-2xl border-l-4',
        'bg-white dark:bg-[#252033]',
        'shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]',
        'border border-white/40 dark:border-white/10',
        config.borderClass,
        config.bgClass
      )}
      role="alert"
      data-testid={`toast-${type}`}
    >
      {/* Icon */}
      <IconComponent 
        className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClass)} 
        aria-hidden="true"
      />
      
      {/* Message */}
      <p className="flex-1 text-sm text-luma leading-relaxed">
        {message}
      </p>
      
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(id)}
        className={cn(
          'flex-shrink-0 p-1 rounded-lg',
          'text-luma-muted hover:text-luma',
          'hover:bg-luma-coral-10',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-luma-coral-20'
        )}
        aria-label="Dismiss notification"
        type="button"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export default Toast;
