import * as React from "react";
import { memo, useMemo, forwardRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * ResultCard Component - Premium Redesign
 * 
 * A luxurious result card with:
 * - Premium frosted glass morphism
 * - Status-based ambient glow effects
 * - Layered shadows for depth
 * - Refined typography with clear hierarchy
 * - Smooth micro-animations
 * - Zone-based layout structure
 * 
 * @param {string} status - Status: live, approved, dead, declined, error, 3ds, or undefined
 * @param {boolean} isSelected - Whether the card is selected
 * @param {boolean} isLoading - Whether the card is in loading state
 * @param {function} onClick - Click handler (makes card interactive)
 * @param {boolean} animate - Whether to use motion animations (default: true)
 */

// Premium status configuration with transparent glass morphism
// Light Theme: Vintage Banking / Cream Paper + Copper Foil
// Dark Theme: Liquid Aurora Design System
const STATUS_CONFIG = {
  live: {
    // Light mode - vintage emerald ink on aged paper
    lightBg: 'bg-[hsl(38,35%,97%)]',
    lightBorder: 'border-[hsl(145,35%,65%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-[hsl(145,45%,42%)] before:to-[hsl(155,40%,35%)]',
    lightShadow: 'shadow-[0_2px_12px_rgba(34,120,80,0.08),0_1px_3px_rgba(139,90,43,0.04)]',
    lightHoverShadow: 'hover:shadow-[0_4px_20px_rgba(34,120,80,0.12),0_2px_6px_rgba(139,90,43,0.06)]',
    // Dark mode - transparent glass with emerald accent glow
    darkBg: 'dark:bg-emerald-500/[0.03]',
    darkBorder: 'dark:border-emerald-400/20',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-emerald-400 dark:before:to-emerald-500',
    darkGlow: 'dark:shadow-[0_0_40px_-10px_rgba(52,211,153,0.25),0_8px_32px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.1)]',
    darkHoverGlow: 'dark:hover:shadow-[0_0_60px_-10px_rgba(52,211,153,0.35),0_12px_48px_rgba(0,0,0,0.5),inset_0_0.5px_0_rgba(255,255,255,0.15)]',
  },
  approved: {
    // Light mode - antique green seal on parchment
    lightBg: 'bg-[hsl(40,38%,97%)]',
    lightBorder: 'border-[hsl(150,30%,60%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-[hsl(145,45%,42%)] before:to-[hsl(155,40%,35%)]',
    lightShadow: 'shadow-[0_2px_12px_rgba(34,120,80,0.08),0_1px_3px_rgba(139,90,43,0.04)]',
    lightHoverShadow: 'hover:shadow-[0_4px_20px_rgba(34,120,80,0.12),0_2px_6px_rgba(139,90,43,0.06)]',
    darkBg: 'dark:bg-emerald-500/[0.03]',
    darkBorder: 'dark:border-emerald-400/20',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-emerald-400 dark:before:to-emerald-500',
    darkGlow: 'dark:shadow-[0_0_40px_-10px_rgba(52,211,153,0.25),0_8px_32px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.1)]',
    darkHoverGlow: 'dark:hover:shadow-[0_0_60px_-10px_rgba(52,211,153,0.35),0_12px_48px_rgba(0,0,0,0.5),inset_0_0.5px_0_rgba(255,255,255,0.15)]',
  },
  '3ds': {
    // Light mode - copper/bronze warning tint
    lightBg: 'bg-[hsl(38,40%,97%)]',
    lightBorder: 'border-[hsl(25,55%,60%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-[hsl(25,70%,48%)] before:to-[hsl(20,65%,40%)]',
    lightShadow: 'shadow-[0_2px_12px_rgba(180,100,50,0.1),0_1px_3px_rgba(139,90,43,0.04)]',
    lightHoverShadow: 'hover:shadow-[0_4px_20px_rgba(180,100,50,0.15),0_2px_6px_rgba(139,90,43,0.06)]',
    darkBg: 'dark:bg-orange-500/[0.03]',
    darkBorder: 'dark:border-orange-400/20',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-orange-400 dark:before:to-orange-500',
    darkGlow: 'dark:shadow-[0_0_40px_-10px_rgba(251,146,60,0.25),0_8px_32px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.1)]',
    darkHoverGlow: 'dark:hover:shadow-[0_0_60px_-10px_rgba(251,146,60,0.35),0_12px_48px_rgba(0,0,0,0.5),inset_0_0.5px_0_rgba(255,255,255,0.15)]',
  },
  dead: {
    // Light mode - faded burgundy ink on aged paper
    lightBg: 'bg-[hsl(38,25%,96%)]',
    lightBorder: 'border-[hsl(0,25%,72%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-[hsl(355,40%,50%)] before:to-[hsl(350,35%,42%)]',
    lightShadow: 'shadow-[0_1px_8px_rgba(139,90,43,0.04)]',
    lightHoverShadow: 'hover:shadow-[0_2px_12px_rgba(139,90,43,0.06)]',
    darkBg: 'dark:bg-rose-500/[0.02]',
    darkBorder: 'dark:border-rose-400/15',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-rose-400 dark:before:to-rose-500',
    darkGlow: 'dark:shadow-[0_0_30px_-10px_rgba(251,113,133,0.15),0_8px_32px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.08)]',
    darkHoverGlow: 'dark:hover:shadow-[0_0_40px_-10px_rgba(251,113,133,0.2),0_10px_40px_rgba(0,0,0,0.45),inset_0_0.5px_0_rgba(255,255,255,0.1)]',
  },
  declined: {
    // Light mode - muted burgundy seal
    lightBg: 'bg-[hsl(38,25%,96%)]',
    lightBorder: 'border-[hsl(355,25%,70%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-[hsl(355,40%,50%)] before:to-[hsl(350,35%,42%)]',
    lightShadow: 'shadow-[0_1px_8px_rgba(139,90,43,0.04)]',
    lightHoverShadow: 'hover:shadow-[0_2px_12px_rgba(139,90,43,0.06)]',
    darkBg: 'dark:bg-rose-500/[0.02]',
    darkBorder: 'dark:border-rose-400/15',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-rose-400 dark:before:to-rose-500',
    darkGlow: 'dark:shadow-[0_0_30px_-10px_rgba(251,113,133,0.15),0_8px_32px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.08)]',
    darkHoverGlow: 'dark:hover:shadow-[0_0_40px_-10px_rgba(251,113,133,0.2),0_10px_40px_rgba(0,0,0,0.45),inset_0_0.5px_0_rgba(255,255,255,0.1)]',
  },
  error: {
    // Light mode - aged amber/ochre warning
    lightBg: 'bg-[hsl(40,35%,96%)]',
    lightBorder: 'border-[hsl(35,45%,65%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-[hsl(38,60%,48%)] before:to-[hsl(30,55%,40%)]',
    lightShadow: 'shadow-[0_1px_8px_rgba(180,120,50,0.06)]',
    lightHoverShadow: 'hover:shadow-[0_2px_12px_rgba(180,120,50,0.1)]',
    darkBg: 'dark:bg-amber-500/[0.02]',
    darkBorder: 'dark:border-amber-400/15',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-amber-400 dark:before:to-amber-500',
    darkGlow: 'dark:shadow-[0_0_30px_-10px_rgba(251,191,36,0.15),0_8px_32px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.08)]',
    darkHoverGlow: 'dark:hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.2),0_10px_40px_rgba(0,0,0,0.45),inset_0_0.5px_0_rgba(255,255,255,0.1)]',
  },
  none: {
    // Light mode - clean vintage parchment
    lightBg: 'bg-[hsl(40,35%,97%)]',
    lightBorder: 'border-[hsl(30,25%,82%)]',
    lightAccent: 'before:bg-gradient-to-b before:from-[hsl(30,20%,65%)] before:to-[hsl(25,18%,55%)]',
    lightShadow: 'shadow-[0_1px_6px_rgba(139,90,43,0.04)]',
    lightHoverShadow: 'hover:shadow-[0_2px_12px_rgba(139,90,43,0.08)]',
    darkBg: 'dark:bg-white/[0.02]',
    darkBorder: 'dark:border-white/[0.08]',
    darkAccent: 'dark:before:bg-gradient-to-b dark:before:from-neutral-500 dark:before:to-neutral-600',
    darkGlow: 'dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.08)]',
    darkHoverGlow: 'dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.5),inset_0_0.5px_0_rgba(255,255,255,0.12)]',
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
          // Base structure
          "group relative overflow-hidden",
          "rounded-2xl",
          
          // Premium left accent bar
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1",
          "before:rounded-l-2xl before:z-20",
          config.lightAccent,
          config.darkAccent,
          
          // Border
          "border",
          config.lightBorder,
          config.darkBorder,
          
          // Light mode backgrounds (reset gradient in dark mode)
          config.lightBg,
          "dark:from-transparent dark:via-transparent dark:to-transparent",
          config.lightShadow,
          
          // Dark mode - transparent frosted glass
          config.darkBg,
          "dark:backdrop-blur-2xl dark:backdrop-saturate-[1.5]",
          config.darkGlow,
          
          // Transition for all states
          "transition-all duration-300 ease-out",
          
          // Hover states
          isInteractive && [
            "cursor-pointer",
            config.lightHoverShadow,
            config.darkHoverGlow,
            "hover:translate-y-[-2px]",
            "dark:hover:bg-white/[0.04]",
            "dark:hover:border-white/[0.12]",
          ],
          
          // Selected state - Premium copper foil selection glow
          isSelected && [
            // Light mode - copper foil selection with vintage feel
            "ring-2 ring-[hsl(25,70%,50%)]/50 border-[hsl(25,65%,55%)]",
            "shadow-[0_4px_20px_-4px_rgba(180,100,50,0.25),0_0_0_1px_rgba(180,100,50,0.15)]",
            "bg-[hsl(40,40%,96%)]",
            // Dark mode - electric cyan/gold selection aura
            "dark:ring-[#00d4ff]/50 dark:border-[#00d4ff]/60",
            "dark:shadow-[0_0_40px_-8px_rgba(0,212,255,0.5),0_0_80px_-12px_rgba(0,212,255,0.3),0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]",
            "dark:bg-[#00d4ff]/[0.06]",
            // Shared - lift and scale
            "translate-y-[-3px] scale-[1.01]",
            // Pulsing border animation for selected state
            "after:absolute after:inset-0 after:rounded-2xl after:pointer-events-none",
            "after:shadow-[inset_0_0_0_2px_rgba(180,100,50,0.2)]",
            "dark:after:shadow-[inset_0_0_0_2px_rgba(0,212,255,0.25)]",
            "after:animate-[pulse_2s_ease-in-out_infinite]",
          ],
          
          // Loading state
          isLoading && "opacity-50 pointer-events-none",
          
          className
        )}
        {...props}
      >
        {/* Glass highlight edge - top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 dark:opacity-100 pointer-events-none rounded-t-2xl" />
        
        {/* Selection indicator badge - top right corner */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 z-30 flex items-center justify-center">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              // Light mode - copper foil badge
              "bg-gradient-to-br from-[hsl(25,70%,50%)] to-[hsl(20,65%,42%)] shadow-[0_2px_8px_rgba(180,100,50,0.4)]",
              // Dark mode - electric cyan badge
              "dark:from-[#00d4ff] dark:to-[#00a8cc] dark:shadow-[0_0_16px_rgba(0,212,255,0.6)]",
              // Subtle pulse animation
              "animate-[bounce_1s_ease-in-out]"
            )}>
              <svg 
                className="w-3.5 h-3.5 text-white dark:text-slate-900" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Tile pattern overlay for dark mode - matches body background */}
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none rounded-2xl overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/bg-tile.webp)',
              backgroundSize: '200px 200px',
              backgroundRepeat: 'repeat',
              opacity: 0.04,
              mixBlendMode: 'overlay',
            }}
          />
        </div>
        
        {/* Top gradient sheen for glass effect */}
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none rounded-2xl overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%)',
            }}
          />
        </div>
        
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
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ 
            duration: 0.25, 
            ease: [0.25, 0.1, 0.25, 1],
            layout: { duration: 0.2 }
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

// Custom comparison function for ResultCard memoization
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

// Memoized ResultCard component
const ResultCard = memo(ResultCardBase, areResultCardPropsEqual);

/**
 * ResultCardContent Component
 * 
 * Content wrapper with premium padding and typography.
 */
const ResultCardContent = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "px-4 py-3.5",
        // Premium typography
        "text-neutral-800 dark:text-white/90",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardContent.displayName = "ResultCardContent";

/**
 * ResultCardHeader Component
 * 
 * Zone 1: Header with status, card number, and actions.
 */
const ResultCardHeader = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 sm:gap-3",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardHeader.displayName = "ResultCardHeader";

/**
 * ResultCardRow Component
 * 
 * A flex row within ResultCard for consistent spacing.
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
 * ResultCardDataZone Component
 * 
 * Zone 2: Rich data display (BIN info, metadata).
 */
const ResultCardDataZone = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-wrap items-center gap-2 mt-3",
        "pt-3 border-t border-neutral-100/80 dark:border-white/5",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardDataZone.displayName = "ResultCardDataZone";

/**
 * ResultCardResponseZone Component
 * 
 * Zone 3: Response message and metadata.
 */
const ResultCardResponseZone = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 mt-2.5",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardResponseZone.displayName = "ResultCardResponseZone";

/**
 * ResultCardSecurityZone Component
 * 
 * Zone 4: Security checks and risk indicators.
 */
const ResultCardSecurityZone = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-wrap items-center gap-2.5 mt-3",
        "pt-3 border-t border-neutral-100/80 dark:border-white/5",
        className
      )} 
      {...props} 
    />
  )
));
ResultCardSecurityZone.displayName = "ResultCardSecurityZone";

/**
 * ResultCardActions Component
 * 
 * Container for action buttons, positioned at top-right.
 */
const ResultCardActions = memo(forwardRef(
  ({ className, alwaysVisible = false, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "absolute top-3 right-3 flex items-center gap-1",
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
 * ResultCardLoadingOverlay Component
 * 
 * Overlay for loading/refreshing state.
 */
const ResultCardLoadingOverlay = memo(forwardRef(
  ({ className, children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        "bg-[hsl(40,35%,97%)]/80 dark:bg-black/50",
        "backdrop-blur-sm",
        "rounded-2xl z-20",
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
 * A refined status indicator badge with premium styling.
 */
const ResultCardStatus = memo(forwardRef(
  ({ className, status, children, ...props }, ref) => {
    const statusLower = status?.toLowerCase() || '';
    
    const getStatusStyles = () => {
      if (statusLower === 'approved' || statusLower === 'charged' || statusLower === 'live' || statusLower.startsWith('live')) {
        return "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/25";
      }
      if (statusLower === '3ds' || statusLower === 'live 3ds') {
        return "bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/25";
      }
      if (statusLower === 'declined' || statusLower === 'dead' || statusLower === 'die') {
        return "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/25";
      }
      if (statusLower === 'error' || statusLower === 'retry' || statusLower === 'captcha') {
        return "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/25";
      }
      return "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-white/60 border-neutral-200/50 dark:border-white/10";
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          "px-2.5 py-1 rounded-lg",
          "text-[10px] font-semibold uppercase tracking-wider",
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
 */
const ResultCardLabel = memo(forwardRef(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "text-[11px] font-medium tracking-wide",
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
 * A mono-spaced value display with premium styling.
 */
const ResultCardValue = memo(forwardRef(
  ({ className, mono = true, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "text-[11px]",
        mono && "font-mono tabular-nums tracking-tight",
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
 * Status message with appropriate coloring and premium typography.
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
      return "text-neutral-500 dark:text-white/60";
    };

    return (
      <p
        ref={ref}
        className={cn(
          "text-[11px] font-medium leading-relaxed",
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
 * ResultCardPill Component
 * 
 * A premium pill/tag for displaying metadata.
 */
const ResultCardPill = memo(forwardRef(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: "bg-neutral-100/80 text-neutral-600 dark:bg-white/5 dark:text-white/60",
      success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center",
          "px-2 py-0.5 rounded-md",
          "text-[10px] font-medium",
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
 * ResultCardDuration Component
 * 
 * Elegant duration display with icon.
 */
const ResultCardDuration = memo(forwardRef(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1",
        "text-[10px] font-medium tabular-nums",
        "text-neutral-400 dark:text-white/40",
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
