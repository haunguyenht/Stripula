import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, buttonVariants } from './Button';
import { InlineSpinner } from './spinner';
import { cn } from '@/lib/utils';

/**
 * LoadingButton - Button with integrated loading state
 * 
 * Features:
 * - Smooth transition between states
 * - Maintains button width during loading
 * - Customizable loading text
 * - Inherits all Button variants
 */
export const LoadingButton = React.forwardRef(({
  children,
  isLoading = false,
  loadingText,
  disabled,
  className,
  spinnerClassName,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn('relative', className)}
      {...props}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <InlineSpinner size="sm" className={spinnerClassName} />
            {loadingText && <span>{loadingText}</span>}
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
});

LoadingButton.displayName = 'LoadingButton';

/**
 * IconLoadingButton - Button that shows spinner in place of icon when loading
 */
export const IconLoadingButton = React.forwardRef(({
  children,
  icon: Icon,
  isLoading = false,
  disabled,
  className,
  iconClassName,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn('relative', className)}
      {...props}
    >
      <span className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="spinner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <InlineSpinner size="sm" />
            </motion.span>
          ) : Icon ? (
            <motion.span
              key="icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Icon className={cn('h-4 w-4', iconClassName)} />
            </motion.span>
          ) : null}
        </AnimatePresence>
        {children}
      </span>
    </Button>
  );
});

IconLoadingButton.displayName = 'IconLoadingButton';

/**
 * ProgressButton - Button with progress indicator
 */
export const ProgressButton = React.forwardRef(({
  children,
  progress = 0,
  isLoading = false,
  disabled,
  className,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {/* Progress bar background */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-white/20 dark:bg-black/20"
          initial={{ x: '-100%' }}
          animate={{ x: `${progress - 100}%` }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <span className="relative flex items-center gap-2">
        {isLoading && <InlineSpinner size="sm" />}
        {children}
        {isLoading && progress > 0 && (
          <span className="text-xs opacity-80 tabular-nums">
            {Math.round(progress)}%
          </span>
        )}
      </span>
    </Button>
  );
});

ProgressButton.displayName = 'ProgressButton';

export default LoadingButton;
