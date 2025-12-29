import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

/**
 * LoadingOverlay - Full-screen or container loading overlay
 * 
 * Features:
 * - Glass-morphism backdrop for OPUX dark mode
 * - Smooth entrance/exit animations
 * - Multiple spinner variants
 * - Optional progress indicator
 */
export function LoadingOverlay({
  isLoading,
  variant = 'pulse',
  size = 'xl',
  label = 'Loading...',
  sublabel,
  progress,
  fullScreen = false,
  className,
  children,
}) {
  return (
    <div className={cn('relative', fullScreen && 'h-screen w-screen', className)}>
      {children}
      
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute inset-0 z-50 flex flex-col items-center justify-center',
              // Light mode: clean white overlay
              'bg-white/80 backdrop-blur-sm',
              // Dark mode: OPUX glass overlay
              'dark:bg-[hsl(201_44%_14%/0.85)] dark:backdrop-blur-md',
            )}
          >
            {/* Decorative background elements for dark mode */}
            <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none overflow-hidden">
              <motion.div
                className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-[#AB726F]/10 blur-3xl"
                animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute bottom-1/3 right-1/4 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl"
                animate={{ scale: [1, 1.3, 1], y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
            </div>

            {/* Content container */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative flex flex-col items-center gap-4"
            >
              <Spinner variant={variant} size={size} />
              
              {label && (
                <motion.p
                  className="text-base font-medium text-foreground"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {label}
                </motion.p>
              )}
              
              {sublabel && (
                <p className="text-sm text-muted-foreground">
                  {sublabel}
                </p>
              )}

              {progress !== undefined && (
                <div className="w-48 mt-2">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-primary dark:bg-[#AB726F] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1.5">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * PageLoader - Full page loading state with app background
 * Used during initial app load or auth checking
 */
export function PageLoader({ 
  label = 'Loading...', 
  sublabel,
  variant = 'orbit',
}) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[rgb(248,247,247)] dark:bg-[hsl(201_44%_14%)]">
      {/* Decorative background for dark mode */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/bg-tile.webp')] bg-repeat opacity-30" />
        <motion.div
          className="absolute top-1/3 left-1/3 h-64 w-64 rounded-full bg-[#AB726F]/5 blur-[100px]"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      
      <div className="flex-1 flex items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Logo or brand element could go here */}
          <motion.div
            className={cn(
              'h-16 w-16 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br from-primary to-primary/80',
              'dark:from-[#AB726F] dark:to-[#9d5e5b]',
              'shadow-lg shadow-primary/20 dark:shadow-[#AB726F]/20'
            )}
            animate={{ 
              rotateY: [0, 10, -10, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 10h18" />
              <path d="M7 15h4" />
            </svg>
          </motion.div>

          <Spinner variant={variant} size="lg" />
          
          <div className="text-center">
            <motion.p
              className="text-base font-medium text-foreground"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {label}
            </motion.p>
            {sublabel && (
              <p className="text-sm text-muted-foreground mt-1">{sublabel}</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * PanelLoader - Loading state for panel content areas
 * Matches the panel styling with proper backgrounds
 */
export function PanelLoader({
  label = 'Loading...',
  variant = 'pulse',
  size = 'lg',
  className,
}) {
  return (
    <div className={cn(
      'flex items-center justify-center py-20',
      'rounded-2xl overflow-hidden',
      'bg-white dark:bg-[rgba(30,41,59,0.5)]',
      'border border-[rgb(237,234,233)] dark:border-white/10',
      'dark:backdrop-blur-sm shadow-sm dark:shadow-none',
      className
    )}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <Spinner variant={variant} size={size} />
        </div>
        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {label}
        </motion.p>
      </motion.div>
    </div>
  );
}

export default LoadingOverlay;
