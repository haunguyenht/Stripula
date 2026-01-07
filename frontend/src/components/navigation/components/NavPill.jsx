import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * NavPill - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking
 * - Transparent base, copper accents on interaction
 * 
 * DARK MODE: PREMIUM Liquid Aurora
 * - Enhanced glass morphism with aurora tints
 * - Crystalline edges with multi-layer glow
 */
const NavPill = React.forwardRef(
  ({ 
    children, 
    className, 
    delay = 0, 
    as: Component = 'div',
    ...props 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "nav-pill flex items-center",
          "h-7 xs:h-8 md:h-10",
          // Light mode: Vintage Banking - transparent
          "rounded-lg md:rounded-xl bg-transparent border-0 shadow-none",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: PREMIUM Liquid Aurora Pill
          // ═══════════════════════════════════════════════════════════
          "dark:rounded-lg md:dark:rounded-xl dark:bg-transparent",
          className
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
NavPill.displayName = 'NavPill';

/**
 * NavPillButton - Dual Theme button variant
 * 
 * LIGHT MODE: Vintage Banking - copper foil hover
 * DARK MODE: PREMIUM Liquid Aurora - enhanced glow effects
 */
const NavPillButton = React.forwardRef(
  ({ children, className, delay = 0, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          // Mobile-first sizing
          "h-7 xs:h-8 md:h-10 nav-pill relative",
          "flex items-center gap-1 xs:gap-1.5 md:gap-2",
          "px-1.5 xs:px-2 md:px-3",
          "text-xs md:text-sm font-semibold",
          // Light mode: Vintage Banking - sepia text, copper hover
          "rounded-lg md:rounded-xl bg-transparent",
          // Hover gradient in light mode - dark mode overrides are separate (no reset needed for hover-only)
          "text-[hsl(25,35%,25%)] hover:text-[hsl(25,70%,40%)]",
          "hover:bg-gradient-to-b hover:from-[hsl(38,45%,94%)] hover:to-[hsl(38,40%,91%)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.3)] dark:[text-shadow:none]",
          "transition-all duration-300",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: PREMIUM Liquid Aurora Button
          // ═══════════════════════════════════════════════════════════
          "dark:rounded-lg md:dark:rounded-xl",
          // Enhanced glass background
          "dark:bg-white/[0.04]",
          // Crystalline border with aurora tint
          "dark:border dark:border-white/[0.08]",
          // Text with aurora tint
          "dark:text-white/90",
          // Hover: Enhanced aurora glow activation
          "dark:hover:bg-gradient-to-r dark:hover:from-[rgba(139,92,246,0.12)] dark:hover:via-[rgba(34,211,238,0.08)] dark:hover:to-[rgba(139,92,246,0.12)]",
          "dark:hover:border-[rgba(139,92,246,0.35)]",
          "dark:hover:text-white",
          "dark:hover:shadow-[0_0_24px_-4px_rgba(139,92,246,0.4),0_0_16px_-2px_rgba(34,211,238,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]",
          className
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
NavPillButton.displayName = 'NavPillButton';

/**
 * NavPillNav - Dual Theme Navigation Container
 * 
 * LIGHT MODE: Vintage Banking - Cream paper with copper accents
 * DARK MODE: PREMIUM Liquid Aurora - Enhanced frosted glass with aurora edge
 */
const NavPillNav = React.forwardRef(
  ({ children, className, delay = 0.05, ...props }, ref) => {
    return (
      <motion.nav
        ref={ref}
        className={cn(
          "nav-pill relative flex items-center",
          // Mobile-first spacing
          "gap-0.5 xs:gap-0.5 md:gap-1",
          "px-1 xs:px-1.5 md:px-2",
          "py-0.5 xs:py-1 md:py-1.5",
          "rounded-lg xs:rounded-xl md:rounded-2xl",
          // Light mode: Floating cream paper with copper border (bg-none resets light gradient)
          "bg-gradient-to-b from-[hsl(40,50%,97%)]/95 to-[hsl(38,45%,94%)]/90",
          "backdrop-blur-md",
          "border border-[hsl(30,35%,75%)]/50",
          "shadow-[0_4px_20px_rgba(101,67,33,0.1),inset_0_1px_0_rgba(255,255,255,0.7)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: PREMIUM Liquid Aurora Glass (bg-none resets light gradient)
          // ═══════════════════════════════════════════════════════════
          "dark:rounded-lg xs:dark:rounded-xl md:dark:rounded-2xl",
          // Enhanced liquid glass background (bg-none resets light gradient)
          "dark:bg-none dark:bg-[rgba(12,14,22,0.85)]",
          "dark:backdrop-blur-[80px] dark:backdrop-saturate-[200%]",
          // Aurora-tinted border
          "dark:border dark:border-[rgba(139,92,246,0.12)]",
          // Multi-layer shadow with aurora edge glow
          "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_0_40px_-10px_rgba(139,92,246,0.15),0_0_30px_-8px_rgba(34,211,238,0.1),0_8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
          className
        )}
        initial={{ opacity: 0, y: -15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
        {...props}
      >
        {children}
      </motion.nav>
    );
  }
);
NavPillNav.displayName = 'NavPillNav';

export { NavPill, NavPillButton, NavPillNav };
