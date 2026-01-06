import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/motion';
import { useRef, useCallback } from 'react';

/**
 * ThemeToggle - Icon Morphing toggle with Circular Reveal page transition
 * 
 * Features:
 * - Sun/Moon icons morph into each other with rotation animation
 * - Circular reveal effect expands from button to change page theme
 * - Respects prefers-reduced-motion
 * 
 * Inspired by: shadcn/ui, Vercel, Linear, Josh Comeau
 */
export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const reducedMotion = prefersReducedMotion();
  const buttonRef = useRef(null);

  // Handle theme toggle with circular reveal effect
  const handleToggle = useCallback(async () => {
    // If reduced motion or View Transitions not supported, just toggle
    if (reducedMotion || !document.startViewTransition) {
      toggleTheme();
      return;
    }

    // Get button position for the reveal origin
    const button = buttonRef.current;
    if (!button) {
      toggleTheme();
      return;
    }

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Calculate the maximum radius needed to cover the entire screen
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Set CSS custom properties for the animation origin
    document.documentElement.style.setProperty('--theme-toggle-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-toggle-y', `${y}px`);
    document.documentElement.style.setProperty('--theme-toggle-radius', `${maxRadius}px`);

    // Use View Transitions API for smooth circular reveal
    try {
      const transition = document.startViewTransition(() => {
        toggleTheme();
      });

      // Wait for transition to complete
      await transition.finished;
    } catch {
      // View Transition may be blocked by browser extensions
      toggleTheme();
    }
  }, [toggleTheme, reducedMotion]);

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleToggle}
      className={cn(
        // Base button styling
        "relative flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer",
        "transition-colors duration-200",
        // Light mode: Vintage Banking - warm parchment hover
        "bg-transparent hover:bg-[hsl(38,40%,92%)]",
        // Dark mode: OPUX glass styling
        "dark:hover:bg-white/10",
        // Focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(25,70%,50%)]/20 focus-visible:ring-offset-2",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon - visible in dark mode (to switch to light) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          opacity: isDark ? 1 : 0,
          rotate: isDark ? 0 : 90,
        }}
        transition={
          reducedMotion 
            ? { duration: 0 } 
            : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
        }
      >
        <Sun className="w-4 h-4 text-yellow-400" />
      </motion.div>

      {/* Moon icon - visible in light mode (to switch to dark) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          opacity: isDark ? 0 : 1,
          rotate: isDark ? -90 : 0,
        }}
        transition={
          reducedMotion 
            ? { duration: 0 } 
            : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
        }
      >
        <Moon className="w-4 h-4 text-[hsl(25,50%,35%)] dark:text-slate-400" />
      </motion.div>
    </motion.button>
  );
}
