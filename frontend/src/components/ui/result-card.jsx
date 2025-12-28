import * as React from "react";
import { memo, useMemo, forwardRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * ResultCard Component - Redesigned
 * 
 * A modern result card with:
 * - Status-based gradient backgrounds
 * - Refined typography (lighter font weights)
 * - Subtle left border accent
 * - Smooth hover states
 * - Glass effect in dark mode
 * - Memoized for performance (Requirements 5.5)
 * 
 * @param {string} status - Status: live, approved, dead, declined, error, 3ds, or undefined
 * @param {boolean} isSelected - Whether the card is selected
 * @param {boolean} isLoading - Whether the card is in loading state
 * @param {function} onClick - Click handler (makes card interactive)
 * @param {boolean} animate - Whether to use motion animations (default: true)
 */

// Status configuration with gradients and colors
const STATUS_CONFIG = {
  live: {
    gradient: 'from-emerald-500/[0.08] via-emerald-500/[0.03] to-transparent',
    darkGradient: 'dark:from-emerald-500/[0.12] dark:via-emerald-500/[0.04] dark:to-transparent',
    border: 'border-l-emerald-500',
    darkBorder: 'dark:border-l-emerald-400',
    glow: 'shadow-emerald-500/5',
    darkGlow: 'dark:shadow-emerald-500/10',
  },
  approved: {
    gradient: 'from-emerald-500/[0.08] via-emerald-500/[0.03] to-transparent',
    darkGradient: 'dark:from-emerald-500/[0.12] dark:via-emerald-500/[0.04] dark:to-transparent',
    border: 'border-l-emerald-500',
    darkBorder: 'dark:border-l-emerald-400',
    glow: 'shadow-emerald-500/5',
    darkGlow: 'dark:shadow-emerald-500/10',
  },
  '3ds': {
    gradient: 'from-orange-500/[0.08] via-orange-500/[0.03] to-transparent',
    darkGradient: 'dark:from-orange-500/[0.12] dark:via-orange-500/[0.04] dark:to-transparent',
    border: 'border-l-orange-500',
    darkBorder: 'dark:border-l-orange-400',
    glow: 'shadow-orange-500/5',
    darkGlow: 'dark:shadow-orange-500/10',
  },
  dead: {
    gradient: 'from-rose-500/[0.06] via-rose-500/[0.02] to-transparent',
    darkGradient: 'dark:from-rose-500/[0.10] dark:via-rose-500/[0.03] dark:to-transparent',
    border: 'border-l-rose-500',
    darkBorder: 'dark:border-l-rose-400',
    glow: 'shadow-rose-500/5',
    darkGlow: 'dark:shadow-rose-500/8',
  },
  declined: {
    gradient: 'from-rose-500/[0.06] via-rose-500/[0.02] to-transparent',
    darkGradient: 'dark:from-rose-500/[0.10] dark:via-rose-500/[0.03] dark:to-transparent',
    border: 'border-l-rose-500',
    darkBorder: 'dark:border-l-rose-400',
    glow: 'shadow-rose-500/5',
    darkGlow: 'dark:shadow-rose-500/8',
  },
  error: {
    gradient: 'from-amber-500/[0.06] via-amber-500/[0.02] to-transparent',
    darkGradient: 'dark:from-amber-500/[0.10] dark:via-amber-500/[0.03] dark:to-transparent',
    border: 'border-l-amber-500',
    darkBorder: 'dark:border-l-amber-400',
    glow: 'shadow-amber-500/5',
    darkGlow: 'dark:shadow-amber-500/8',
  },
  none: {
    gradient: '',
    darkGradient: '',
    border: 'border-l-transparent',
    darkBorder: 'dark:border-l-transparent',
    glow: '',
    darkGlow: '',
  },
};

const ResultCardBase = forwardRef(
  ({ 
    className, 
    status, 
    isSelected = false, 
    isLoading = false,
    onClick,
    animate = true,
    interactive,
    children, 
    ...props 
  }, ref) => {
    const isInteractive = interactive || !!onClick;
    
    // Normalize status
    const normalizedStatus = useMemo(() => {
      if (!status) return 'none';
      const statusLower = status.toLowerCase();
      if (statusLower === 'approved') return 'approved';
      if (statusLower === 'live' || statusLower.startsWith('live')) return 'live';
      if (statusLower === '3ds' || statusLower === '3ds_required') return '3ds';
      if (statusLower === 'die' || statusLower === 'dead') return 'dead';
      if (statusLower === 'declined') return 'declined';
      if (statusLower === 'error' || statusLower === 'retry') return 'error';
      return 'none';
    }, [status]);

    const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.none;

    const cardContent = (
      <div
        ref={!animate ? ref : undefined}
        onClick={onClick}
        className={cn(
          // Base styling
          "group relative overflow-hidden",
          "rounded-xl",
          
          // Border
          "border border-l-[3px]",
          config.border,
          config.darkBorder,
          
          // Light mode
          "bg-gradient-to-r",
          config.gradient,
          "border-neutral-200/60",
          "shadow-sm",
          config.glow,
          
          // Dark mode - glass effect
          "dark:bg-[linear-gradient(to_right,var(--tw-gradient-stops)),linear-gradient(135deg,rgba(40,40,44,0.7),rgba(32,32,36,0.6))]",
          config.darkGradient,
          "dark:border-white/[0.06]",
          "dark:backdrop-blur-sm",
          "dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]",
          config.darkGlow,
          
          // Hover states
          isInteractive && [
            "cursor-pointer",
            "transition-all duration-200 ease-out",
            "hover:shadow-md hover:border-neutral-300/70",
            "dark:hover:border-white/[0.1] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
          ],
          
          // Selected state
          isSelected && [
            "ring-2 ring-primary/30 border-primary/40",
            "dark:ring-primary/40 dark:border-primary/50",
          ],
          
          // Loading state
          isLoading && "opacity-50 pointer-events-none",
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );

    // Render with or without motion wrapper
    if (animate) {
      return (
        <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {cardContent}
        </motion.div>
      );
    }

    return cardContent;
  }
);
ResultCardBase.displayName = "ResultCard";

// Custom comparison function for ResultCard memoization (Requirements 5.5)
// Only re-render when relevant props change
function areResultCardPropsEqual(prevProps, nextProps) {
  return (
    prevProps.status === nextProps.status &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.animate === nextProps.animate &&
    prevProps.interactive === nextProps.interactive &&
    prevProps.className === nextProps.className &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.children === nextProps.children
  );
}

// Memoized ResultCard component (Requirements 5.5)
const ResultCard = memo(ResultCardBase, areResultCardPropsEqual);

/**
 * ResultCardContent Component
 * 
 * Content wrapper with refined padding.
 * Memoized for performance (Requirements 5.5)
 */
const ResultCardContent = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "p-3",
        // Light typography defaults
        "text-neutral-900 dark:text-white/90",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardContent.displayName = "ResultCardContent";

/**
 * ResultCardRow Component
 * 
 * A flex row within ResultCard for consistent spacing.
 * Memoized for performance (Requirements 5.5)
 */
const ResultCardRow = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("flex items-center gap-2", className)} 
      {...props} 
    />
  )
));
ResultCardRow.displayName = "ResultCardRow";

/**
 * ResultCardActions Component
 * 
 * Container for action buttons, positioned at top-right.
 * Visible on hover by default.
 * Memoized for performance (Requirements 5.5)
 */
const ResultCardActions = memo(forwardRef(
  ({ className, alwaysVisible = false, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "absolute top-2 right-2 flex items-center gap-0.5",
        "transition-opacity duration-150",
        !alwaysVisible && "opacity-0 group-hover:opacity-100",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardActions.displayName = "ResultCardActions";

/**
 * ResultCardLoadingOverlay Component
 * 
 * Overlay for loading/refreshing state.
 * Memoized for performance (Requirements 5.5)
 */
const ResultCardLoadingOverlay = memo(forwardRef(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        "bg-white/60 dark:bg-black/40",
        "backdrop-blur-[2px]",
        "rounded-xl",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
));
ResultCardLoadingOverlay.displayName = "ResultCardLoadingOverlay";

/**
 * ResultCardStatus Component
 * 
 * A refined status indicator badge.
 * Memoized for performance (Requirements 5.5)
 */
const ResultCardStatus = memo(forwardRef(
  ({ className, status, children, ...props }, ref) => {
    const statusLower = status?.toLowerCase() || '';
    
    const getStatusStyles = () => {
      if (statusLower === 'approved' || statusLower === 'charged' || statusLower === 'live') {
        return "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/20";
      }
      if (statusLower === '3ds' || statusLower === 'live 3ds') {
        return "bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 border-orange-500/20";
      }
      if (statusLower === 'declined' || statusLower === 'dead' || statusLower === 'die') {
        return "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border-rose-500/20";
      }
      if (statusLower === 'error' || statusLower === 'retry') {
        return "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border-amber-500/20";
      }
      return "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-white/60 border-neutral-200/50";
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          "px-2 py-0.5 rounded-md",
          "text-[10px] font-semibold uppercase tracking-wide",
          "border",
          getStatusStyles(),
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
));
ResultCardStatus.displayName = "ResultCardStatus";

/**
 * ResultCardLabel Component
 * 
 * A light-weight label for card info.
 * Memoized for performance (Requirements 5.5)
 */
const ResultCardLabel = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "text-[11px] font-normal tracking-wide",
        "text-neutral-500 dark:text-white/50",
        className
      )}
      {...props}
    />
  )
));
ResultCardLabel.displayName = "ResultCardLabel";

/**
 * ResultCardValue Component
 * 
 * A mono-spaced value display.
 * Memoized for performance (Requirements 5.5)
 */
const ResultCardValue = memo(forwardRef(
  ({ className, mono = true, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "text-xs",
        mono && "font-mono tabular-nums",
        "text-neutral-600 dark:text-white/70",
        className
      )}
      {...props}
    />
  )
));
ResultCardValue.displayName = "ResultCardValue";

/**
 * ResultCardMessage Component
 * 
 * Status message with appropriate coloring.
 * Memoized for performance (Requirements 5.5)
 */
const ResultCardMessage = memo(forwardRef(
  ({ className, status, ...props }, ref) => {
    const statusLower = status?.toLowerCase() || '';
    
    const getMessageStyles = () => {
      if (statusLower === 'approved' || statusLower === 'charged' || statusLower === 'live' || statusLower.startsWith('live')) {
        return "text-emerald-600 dark:text-emerald-400";
      }
      if (statusLower === 'declined' || statusLower === 'dead' || statusLower === 'die') {
        return "text-rose-500 dark:text-rose-400";
      }
      if (statusLower === 'error' || statusLower === 'retry') {
        return "text-amber-600 dark:text-amber-400";
      }
      return "text-neutral-500 dark:text-white/60";
    };

    return (
      <p
        ref={ref}
        className={cn(
          "text-[11px] font-normal leading-relaxed",
          getMessageStyles(),
          className
        )}
        {...props}
      />
    );
  }
));
ResultCardMessage.displayName = "ResultCardMessage";

export { 
  ResultCard, 
  ResultCardContent, 
  ResultCardRow, 
  ResultCardActions,
  ResultCardLoadingOverlay,
  ResultCardStatus,
  ResultCardLabel,
  ResultCardValue,
  ResultCardMessage,
};

