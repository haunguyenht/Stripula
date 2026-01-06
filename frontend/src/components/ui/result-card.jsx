import * as React from "react";
import { memo, useMemo, forwardRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * ResultCard Component - Compact Premium Redesign
 * 
 * ═══════════════════════════════════════════════════════════════════
 * LIGHT THEME: Vintage Banking - Cream paper with copper accents
 * DARK THEME: Obsidian Nebula - Deep glass with colored status glow
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Compact responsive layout
 * - Status-based colored left accent bar
 * - Subtle glass effect in dark mode (no white tints)
 * - Smooth micro-animations
 */

// Status configuration - NO WHITE TINTS in dark mode
const STATUS_CONFIG = {
  live: {
    // Light mode - vintage emerald
    lightBg: 'bg-[hsl(42,35%,97%)]',
    lightBorder: 'border-[hsl(150,30%,70%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-emerald-500 before:to-emerald-600',
    lightShadow: 'shadow-[0_1px_8px_rgba(34,120,80,0.06)]',
    // Dark mode - deep emerald glass, NO white
    darkBg: 'dark:bg-emerald-950/40',
    darkBorder: 'dark:border-emerald-500/25',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-emerald-400 dark:before:to-emerald-500',
    darkShadow: 'dark:shadow-[0_0_24px_-8px_rgba(52,211,153,0.3),0_4px_16px_rgba(0,0,0,0.4)]',
  },
  approved: {
    lightBg: 'bg-[hsl(42,35%,97%)]',
    lightBorder: 'border-[hsl(150,30%,70%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-emerald-500 before:to-emerald-600',
    lightShadow: 'shadow-[0_1px_8px_rgba(34,120,80,0.06)]',
    darkBg: 'dark:bg-emerald-950/40',
    darkBorder: 'dark:border-emerald-500/25',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-emerald-400 dark:before:to-emerald-500',
    darkShadow: 'dark:shadow-[0_0_24px_-8px_rgba(52,211,153,0.3),0_4px_16px_rgba(0,0,0,0.4)]',
  },
  '3ds': {
    lightBg: 'bg-[hsl(40,38%,97%)]',
    lightBorder: 'border-[hsl(30,50%,70%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-orange-500 before:to-orange-600',
    lightShadow: 'shadow-[0_1px_8px_rgba(180,100,50,0.06)]',
    darkBg: 'dark:bg-orange-950/40',
    darkBorder: 'dark:border-orange-500/25',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-orange-400 dark:before:to-orange-500',
    darkShadow: 'dark:shadow-[0_0_24px_-8px_rgba(251,146,60,0.3),0_4px_16px_rgba(0,0,0,0.4)]',
  },
  dead: {
    lightBg: 'bg-[hsl(40,25%,96%)]',
    lightBorder: 'border-[hsl(355,25%,75%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-rose-500 before:to-rose-600',
    lightShadow: 'shadow-[0_1px_6px_rgba(139,90,43,0.04)]',
    darkBg: 'dark:bg-rose-950/30',
    darkBorder: 'dark:border-rose-500/20',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-rose-400 dark:before:to-rose-500',
    darkShadow: 'dark:shadow-[0_0_20px_-8px_rgba(251,113,133,0.2),0_4px_16px_rgba(0,0,0,0.35)]',
  },
  declined: {
    lightBg: 'bg-[hsl(40,25%,96%)]',
    lightBorder: 'border-[hsl(355,25%,75%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-rose-500 before:to-rose-600',
    lightShadow: 'shadow-[0_1px_6px_rgba(139,90,43,0.04)]',
    darkBg: 'dark:bg-rose-950/30',
    darkBorder: 'dark:border-rose-500/20',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-rose-400 dark:before:to-rose-500',
    darkShadow: 'dark:shadow-[0_0_20px_-8px_rgba(251,113,133,0.2),0_4px_16px_rgba(0,0,0,0.35)]',
  },
  error: {
    lightBg: 'bg-[hsl(42,32%,96%)]',
    lightBorder: 'border-[hsl(40,40%,72%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-amber-500 before:to-amber-600',
    lightShadow: 'shadow-[0_1px_6px_rgba(180,120,50,0.04)]',
    darkBg: 'dark:bg-amber-950/30',
    darkBorder: 'dark:border-amber-500/20',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-amber-400 dark:before:to-amber-500',
    darkShadow: 'dark:shadow-[0_0_20px_-8px_rgba(251,191,36,0.2),0_4px_16px_rgba(0,0,0,0.35)]',
  },
  none: {
    lightBg: 'bg-[hsl(42,30%,97%)]',
    lightBorder: 'border-[hsl(35,20%,82%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-neutral-400 before:to-neutral-500',
    lightShadow: 'shadow-[0_1px_4px_rgba(139,90,43,0.03)]',
    darkBg: 'dark:bg-neutral-900/50',
    darkBorder: 'dark:border-neutral-700/40',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-neutral-500 dark:before:to-neutral-600',
    darkShadow: 'dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]',
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
      if (statusLower === 'approved' || statusLower === 'charged') return 'approved';
      if (statusLower === 'live' || statusLower.startsWith('live')) return 'live';
      if (statusLower === '3ds' || statusLower === '3ds_required') return '3ds';
      if (statusLower === 'die' || statusLower === 'dead') return 'dead';
      if (statusLower === 'declined') return 'declined';
      if (statusLower === 'error' || statusLower === 'retry' || statusLower === 'captcha') return 'error';
      return 'none';
    }, [status]);

    const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.none;

    const cardContent = (
      <div
        ref={!animate ? ref : undefined}
        onClick={onClick}
        className={cn(
          // Base structure - COMPACT
          "group relative overflow-hidden",
          "rounded-xl sm:rounded-2xl",
          
          // Left accent bar - thinner
          "before:absolute before:left-0 before:top-0 before:bottom-0",
          "before:w-[3px] sm:before:w-1",
          "before:rounded-l-xl sm:before:rounded-l-2xl before:z-20",
          config.lightAccent,
          config.darkAccent,
          
          // Border
          "border",
          config.lightBorder,
          config.darkBorder,
          
          // Light mode
          config.lightBg,
          config.lightShadow,
          
          // Dark mode - deep colored glass, NO white tints
          config.darkBg,
          "dark:backdrop-blur-xl dark:backdrop-saturate-150",
          config.darkShadow,
          
          // Transition
          "transition-all duration-200 ease-out",
          
          // Hover states
          isInteractive && [
            "cursor-pointer",
            "hover:translate-y-[-1px]",
            "hover:shadow-[0_2px_12px_rgba(139,90,43,0.08)]",
            "dark:hover:shadow-[0_0_32px_-8px_rgba(139,92,246,0.2),0_6px_20px_rgba(0,0,0,0.45)]",
            "dark:hover:border-opacity-40",
          ],
          
          // Selected state
          isSelected && [
            "ring-2 ring-[hsl(25,70%,50%)]/50 border-[hsl(25,65%,55%)]",
            "dark:ring-violet-500/50 dark:border-violet-500/50",
            "dark:shadow-[0_0_32px_-6px_rgba(139,92,246,0.4),0_8px_24px_rgba(0,0,0,0.5)]",
            "translate-y-[-2px]",
          ],
          
          // Loading state
          isLoading && "opacity-50 pointer-events-none",
          
          className
        )}
        {...props}
      >
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );

    // Render with or without motion wrapper
    if (animate) {
      return (
        <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ 
            duration: 0.2, 
            ease: [0.25, 0.1, 0.25, 1],
            layout: { duration: 0.15 }
          }}
        >
          {cardContent}
        </motion.div>
      );
    }

    return cardContent;
  }
);
ResultCardBase.displayName = "ResultCard";

// Memoization comparison
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

const ResultCard = memo(ResultCardBase, areResultCardPropsEqual);

/**
 * ResultCardContent - COMPACT padding
 */
const ResultCardContent = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        // Compact padding - smaller on mobile
        "px-3 py-2.5 sm:px-4 sm:py-3",
        "text-neutral-800 dark:text-neutral-100",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardContent.displayName = "ResultCardContent";

/**
 * ResultCardHeader - Compact layout
 */
const ResultCardHeader = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-wrap items-center justify-between",
        "gap-1.5 sm:gap-2",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardHeader.displayName = "ResultCardHeader";

/**
 * ResultCardRow - Compact row
 */
const ResultCardRow = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("flex items-center gap-1.5 sm:gap-2", className)} 
      {...props} 
    />
  )
));
ResultCardRow.displayName = "ResultCardRow";

/**
 * ResultCardDataZone - Compact data zone
 */
const ResultCardDataZone = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-wrap items-center gap-1.5 sm:gap-2",
        "mt-2 sm:mt-2.5 pt-2 sm:pt-2.5",
        "border-t border-neutral-200/60 dark:border-neutral-700/30",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardDataZone.displayName = "ResultCardDataZone";

/**
 * ResultCardResponseZone - Compact response zone
 */
const ResultCardResponseZone = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-wrap items-center justify-between",
        "gap-1.5 sm:gap-2 mt-1.5 sm:mt-2",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardResponseZone.displayName = "ResultCardResponseZone";

/**
 * ResultCardSecurityZone - Compact security zone
 */
const ResultCardSecurityZone = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-wrap items-center gap-1.5 sm:gap-2",
        "mt-2 sm:mt-2.5 pt-2 sm:pt-2.5",
        "border-t border-neutral-200/60 dark:border-neutral-700/30",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardSecurityZone.displayName = "ResultCardSecurityZone";

/**
 * ResultCardActions - Compact actions
 */
const ResultCardActions = memo(forwardRef(
  ({ className, alwaysVisible = false, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "absolute top-2 right-2 sm:top-2.5 sm:right-2.5",
        "flex items-center gap-0.5 sm:gap-1",
        "transition-opacity duration-200",
        !alwaysVisible && "opacity-0 group-hover:opacity-100",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardActions.displayName = "ResultCardActions";

/**
 * ResultCardLoadingOverlay
 */
const ResultCardLoadingOverlay = memo(forwardRef(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        "bg-neutral-100/80 dark:bg-neutral-900/70",
        "backdrop-blur-sm",
        "rounded-xl sm:rounded-2xl z-20",
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
 * ResultCardStatus - COMPACT status badge
 */
const ResultCardStatus = memo(forwardRef(
  ({ className, status, children, ...props }, ref) => {
    const statusLower = status?.toLowerCase() || '';
    
    const getStatusStyles = () => {
      if (statusLower === 'approved' || statusLower === 'charged' || statusLower === 'live' || statusLower.startsWith('live')) {
        // Emerald - success
        return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-500/40";
      }
      if (statusLower === '3ds' || statusLower === 'live 3ds') {
        // Orange - warning
        return "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-500/40";
      }
      if (statusLower === 'declined' || statusLower === 'dead' || statusLower === 'die') {
        // Rose - declined (darker in dark mode)
        return "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-500/30";
      }
      if (statusLower === 'error' || statusLower === 'retry' || statusLower === 'captcha') {
        // Amber - error
        return "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-500/40";
      }
      // Default - neutral
      return "bg-neutral-200/60 text-neutral-600 border-neutral-300/50 dark:bg-neutral-800/50 dark:text-neutral-400 dark:border-neutral-600/40";
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          // Compact sizing
          "px-2 py-0.5 sm:px-2.5 sm:py-1",
          "rounded-md sm:rounded-lg",
          // Smaller text
          "text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider",
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
 * ResultCardLabel - Compact label
 */
const ResultCardLabel = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "text-[10px] sm:text-[11px] font-medium tracking-wide",
        "text-neutral-500 dark:text-neutral-500",
        className
      )}
      {...props}
    />
  )
));
ResultCardLabel.displayName = "ResultCardLabel";

/**
 * ResultCardValue - Compact value
 */
const ResultCardValue = memo(forwardRef(
  ({ className, mono = true, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "text-[10px] sm:text-[11px]",
        mono && "font-mono tabular-nums tracking-tight",
        "text-neutral-700 dark:text-neutral-300",
        className
      )}
      {...props}
    />
  )
));
ResultCardValue.displayName = "ResultCardValue";

/**
 * ResultCardMessage - Status message
 */
const ResultCardMessage = memo(forwardRef(
  ({ className, status, ...props }, ref) => {
    const statusLower = status?.toLowerCase() || '';
    
    const getMessageStyles = () => {
      if (statusLower === 'approved' || statusLower === 'charged' || statusLower === 'live' || statusLower.startsWith('live')) {
        return "text-emerald-600 dark:text-emerald-400";
      }
      if (statusLower === '3ds' || statusLower === 'live 3ds') {
        return "text-orange-600 dark:text-orange-400";
      }
      if (statusLower === 'declined' || statusLower === 'dead' || statusLower === 'die') {
        return "text-rose-500 dark:text-rose-400";
      }
      if (statusLower === 'error' || statusLower === 'retry' || statusLower === 'captcha') {
        return "text-amber-600 dark:text-amber-400";
      }
      return "text-neutral-500 dark:text-neutral-400";
    };

    return (
      <p
        ref={ref}
        className={cn(
          "text-[10px] sm:text-[11px] font-medium leading-relaxed",
          getMessageStyles(),
          className
        )}
        {...props}
      />
    );
  }
));
ResultCardMessage.displayName = "ResultCardMessage";

/**
 * ResultCardPill - Compact pill
 */
const ResultCardPill = memo(forwardRef(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: "bg-neutral-200/50 text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-400",
      success: "bg-emerald-100/60 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
      warning: "bg-amber-100/60 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
      danger: "bg-rose-100/60 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center",
          "px-1.5 py-0.5 sm:px-2",
          "rounded-md",
          "text-[9px] sm:text-[10px] font-medium",
          variantStyles[variant] || variantStyles.default,
          className
        )}
        {...props}
      />
    );
  }
));
ResultCardPill.displayName = "ResultCardPill";

/**
 * ResultCardDuration - Compact duration
 */
const ResultCardDuration = memo(forwardRef(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-0.5 sm:gap-1",
        "text-[9px] sm:text-[10px] font-medium tabular-nums",
        "text-neutral-400 dark:text-neutral-500",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
));
ResultCardDuration.displayName = "ResultCardDuration";

export { 
  ResultCard, 
  ResultCardContent,
  ResultCardHeader,
  ResultCardRow, 
  ResultCardDataZone,
  ResultCardResponseZone,
  ResultCardSecurityZone,
  ResultCardActions,
  ResultCardLoadingOverlay,
  ResultCardStatus,
  ResultCardLabel,
  ResultCardValue,
  ResultCardMessage,
  ResultCardPill,
  ResultCardDuration,
};
