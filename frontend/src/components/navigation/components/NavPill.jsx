import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * NavPill - Obsidian Aurora Design System
 * 
 * Base pill wrapper with aurora glass morphism.
 * Features crystalline edges and subtle glow effects.
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
          "h-10 nav-pill flex items-center",
          // Light mode: Vintage Banking - transparent
          "rounded-xl bg-transparent border-0 shadow-none",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Obsidian Aurora Pill
          // ═══════════════════════════════════════════════════════════
          "dark:rounded-xl dark:bg-transparent",
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
 * NavPillButton - Obsidian Aurora button variant
 * 
 * Interactive button with aurora glow hover effects and crystalline appearance.
 */
const NavPillButton = React.forwardRef(
  ({ children, className, delay = 0, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          "h-10 nav-pill relative",
          "flex items-center gap-2 px-3 text-sm font-semibold",
          // Light mode: Vintage Banking - sepia text, copper hover
          "rounded-xl bg-transparent",
          "text-[hsl(25,35%,25%)] hover:text-[hsl(25,75%,45%)]",
          "hover:bg-[hsl(38,40%,92%)]",
          "transition-all duration-300",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Obsidian Aurora Button
          // ═══════════════════════════════════════════════════════════
          "dark:rounded-xl",
          // Subtle glass background
          "dark:bg-white/[0.03]",
          // Crystalline border
          "dark:border dark:border-white/[0.06]",
          // Text with aurora tint
          "dark:text-white/90",
          // Hover: Aurora glow activation
          "dark:hover:bg-gradient-to-r dark:hover:from-cyan-500/[0.08] dark:hover:via-violet-500/[0.06] dark:hover:to-cyan-500/[0.08]",
          "dark:hover:border-cyan-400/30",
          "dark:hover:text-white",
          "dark:hover:shadow-[0_0_20px_-4px_rgba(34,211,238,0.3),0_0_12px_-2px_rgba(139,92,246,0.2)]",
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
 * NavPillNav - Clean Dark Glass Navigation
 * 
 * Simple, elegant frosted glass container.
 */
const NavPillNav = React.forwardRef(
  ({ children, className, delay = 0.05, ...props }, ref) => {
    return (
      <motion.nav
        ref={ref}
        className={cn(
          "nav-pill relative",
          // Light mode: Floating cream paper with copper border
          "flex items-center gap-1",
          "rounded-2xl px-2 py-1.5",
          "bg-gradient-to-b from-[hsl(40,50%,97%)]/95 to-[hsl(38,45%,94%)]/90",
          "backdrop-blur-md",
          "border border-[hsl(30,35%,75%)]/50",
          "shadow-[0_4px_20px_rgba(101,67,33,0.1),inset_0_1px_0_rgba(255,255,255,0.7)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Clean Frosted Glass
          // ═══════════════════════════════════════════════════════════
          "dark:rounded-2xl dark:gap-0.5 dark:px-2 dark:py-1.5",
          // Simple dark glass background
          "dark:bg-white/[0.04]",
          "dark:backdrop-blur-xl",
          // Subtle border
          "dark:border dark:border-white/[0.08]",
          // Clean shadow with subtle glow
          "dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]",
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
