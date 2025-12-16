import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useTheme } from '../../hooks/useTheme';

/**
 * ThemeToggle - Button to toggle between light and dark themes
 * Uses nav-pill styling for consistency with TopTabBar
 */
export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-xl",
        "bg-white/60 dark:bg-white/10 backdrop-blur-xl",
        "border border-white/40 dark:border-white/20",
        "shadow-sm",
        "text-gray-600 dark:text-gray-300",
        "hover:bg-white/80 dark:hover:bg-white/20",
        "transition-colors duration-200",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {isDark ? (
          <Sun size={18} className="text-yellow-400" />
        ) : (
          <Moon size={18} className="text-gray-600" />
        )}
      </motion.div>
    </motion.button>
  );
}
