import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * NavPill - Minimal pill wrapper with motion animations
 * 
 * OrangeAI warm design (light) / OPUX glass design (dark).
 * Hover styles are handled by CSS (.nav-pill:hover) for proper dark mode support.
 * 
 * @param {React.ReactNode} children - Content to render inside the pill
 * @param {string} className - Additional classes
 * @param {number} delay - Animation delay in seconds
 * @param {React.Ref} ref - Forwarded ref
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
          // Light mode: OrangeAI - transparent, no bg (inside white container)
          "rounded-md bg-transparent",
          // Dark mode: OPUX glass pill
          "dark:rounded-xl dark:bg-transparent dark:border-0 dark:shadow-none",
          className
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
NavPill.displayName = 'NavPill';

/**
 * NavPillButton - NavPill variant that's a button
 * OrangeAI warm design (light) / OPUX glass design (dark)
 */
const NavPillButton = React.forwardRef(
  ({ children, className, delay = 0, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          "h-10 nav-pill",
          "flex items-center gap-2 px-3 text-sm font-semibold",
          // Light mode: OrangeAI link style - transparent, hover to orange
          "rounded-md bg-transparent",
          "text-[rgb(37,27,24)] hover:text-[rgb(255,64,23)]",
          "transition-colors duration-300",
          // Dark mode: OPUX glass button pill
          "dark:rounded-xl dark:bg-transparent dark:border-0 dark:shadow-none",
          "dark:text-white/90",
          className
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
NavPillButton.displayName = 'NavPillButton';

/**
 * NavPillNav - NavPill variant for navigation (uses nav element)
 * OrangeAI warm design (light) / OPUX glass design (dark)
 */
const NavPillNav = React.forwardRef(
  ({ children, className, delay = 0.05, ...props }, ref) => {
    return (
      <motion.nav
        ref={ref}
        className={cn(
          "nav-pill",
          // Light mode: OrangeAI - compact flex with reasonable gaps
          "flex items-center gap-1",
          "rounded-md bg-transparent",
          // Dark mode: OPUX glass nav pill
          "dark:rounded-xl dark:bg-transparent dark:border-0 dark:shadow-none dark:gap-0.5 dark:px-1",
          className
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay }}
        {...props}
      >
        {children}
      </motion.nav>
    );
  }
);
NavPillNav.displayName = 'NavPillNav';

export { NavPill, NavPillButton, NavPillNav };
