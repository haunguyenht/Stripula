import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * NavPill - Cyberpunk Design System
 * 
 * LIGHT MODE: Vintage Banking
 * - Cream parchment with copper accents
 * - Embossed text shadows
 * 
 * DARK MODE: Cyberpunk Neon
 * - Deep dark backgrounds with neon edge glow
 * - Electric cyan (#00f0ff) and hot pink (#ff0080) accents
 * - Visible glowing borders
 * - Tech/sci-fi aesthetic
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
          "rounded-lg md:rounded-xl bg-transparent border-0 shadow-none",
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
 * NavPillButton - Cyberpunk Neon Button
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
          "text-xs md:text-sm font-medium",
          "transition-all duration-300",
          // ═══════════════════════════════════════════════════════════
          // LIGHT MODE: Vintage Banking Glass
          // ═══════════════════════════════════════════════════════════
          "rounded-lg md:rounded-xl",
          "bg-gradient-to-b from-white/90 to-[hsl(40,40%,97%)]/80",
          "border border-[hsl(30,25%,82%)]",
          "text-[hsl(25,35%,30%)]",
          "shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)]",
          "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
          "hover:bg-gradient-to-b hover:from-white hover:to-[hsl(38,45%,95%)]/90",
          "hover:border-[hsl(25,45%,70%)]",
          "hover:text-[hsl(25,55%,38%)]",
          "hover:shadow-[0_4px_12px_rgba(180,120,80,0.12)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Clean Cyberpunk HUD
          // ═══════════════════════════════════════════════════════════
          "dark:bg-transparent",
          "dark:border-0",
          "dark:text-[rgba(120,200,230,0.9)]",
          "dark:shadow-none",
          "dark:[text-shadow:none]",
          // Hover: Neon cyan glow
          "dark:hover:bg-[rgba(0,240,255,0.1)]",
          "dark:hover:text-[rgba(0,240,255,1)]",
          "dark:hover:[text-shadow:0_0_10px_rgba(0,240,255,0.7)]",
          "dark:hover:shadow-[0_0_15px_-4px_rgba(0,240,255,0.5)]",
          className
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
NavPillButton.displayName = 'NavPillButton';

/**
 * NavPillNav - Cyberpunk HUD Navigation Container
 * Floating panel with neon gradient border (cyan → pink)
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
          "px-1.5 xs:px-2 md:px-3",
          "py-1 xs:py-1.5 md:py-2",
          "rounded-xl xs:rounded-2xl md:rounded-full",
          // ═══════════════════════════════════════════════════════════
          // LIGHT MODE: Vintage Banking Glass Panel
          // ═══════════════════════════════════════════════════════════
          "bg-gradient-to-b from-white/95 to-[hsl(40,45%,97%)]/90",
          "backdrop-blur-md",
          "border border-[hsl(30,30%,80%)]",
          "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
          // ═══════════════════════════════════════════════════════════
          // DARK MODE: Neon Gradient Border (Cyan → Pink)
          // ═══════════════════════════════════════════════════════════
          "dark:bg-none dark:bg-[rgba(10,15,25,0.4)]",
          "dark:backdrop-blur-sm",
          "dark:border-0",
          // Gradient border using background-clip trick
          "dark:p-[1.5px]",
          "dark:[background:linear-gradient(90deg,rgba(0,240,255,0.8),rgba(180,0,255,0.6),rgba(255,0,128,0.7),rgba(0,240,255,0.8))_border-box]",
          // Glow effect
          "dark:shadow-[0_0_20px_-5px_rgba(0,240,255,0.5),0_0_30px_-8px_rgba(255,0,128,0.3)]",
          className
        )}
        initial={{ opacity: 0, y: -15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
        {...props}
      >
        {/* Light mode: specular highlight */}
        <div className={cn(
          "absolute top-0 left-6 right-6 h-px rounded-full dark:hidden",
          "bg-gradient-to-r from-transparent via-white/50 to-transparent"
        )} />
        
        {/* Dark mode: Inner container to create gradient border effect */}
        <div className={cn(
          "hidden dark:flex items-center w-full h-full",
          "bg-[rgba(8,12,20,0.95)] rounded-[inherit]",
          "px-1 xs:px-1.5 md:px-2",
          "gap-0.5 xs:gap-0.5 md:gap-1"
        )}>
          {children}
        </div>
        
        {/* Light mode: show children directly */}
        <div className="flex items-center gap-0.5 xs:gap-0.5 md:gap-1 dark:hidden">
          {children}
        </div>
      </motion.nav>
    );
  }
);
NavPillNav.displayName = 'NavPillNav';

export { NavPill, NavPillButton, NavPillNav };
