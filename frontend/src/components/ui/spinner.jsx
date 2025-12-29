import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Spinner Component - Distinctive loading indicators for Stripula
 * 
 * Variants:
 * - pulse: Elegant pulsing ring (default)
 * - dots: Bouncing dots in sequence
 * - orbit: Orbiting particles - card validation themed
 * - bars: Audio-wave style bars
 * - card: Credit card shaped shimmer
 */

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
  '2xl': 'h-16 w-16',
};

// ============================================
// PULSE VARIANT - Elegant concentric rings
// ============================================
function PulseSpinner({ size = 'md', className }) {
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/30 dark:border-white/20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Middle ring */}
      <motion.div
        className="absolute inset-[15%] rounded-full border-2 border-primary/50 dark:border-white/30"
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.2, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      />
      {/* Inner core */}
      <motion.div
        className="absolute inset-[30%] rounded-full bg-primary dark:bg-[#AB726F]"
        animate={{ scale: [0.8, 1, 0.8], opacity: [1, 0.7, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
    </div>
  );
}

// ============================================
// DOTS VARIANT - Bouncing sequential dots
// ============================================
function DotsSpinner({ size = 'md', className }) {
  const dotSize = {
    xs: 'h-1 w-1',
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
    xl: 'h-3 w-3',
    '2xl': 'h-4 w-4',
  };

  const gap = {
    xs: 'gap-0.5',
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
    xl: 'gap-2.5',
    '2xl': 'gap-3',
  };

  return (
    <div className={cn('flex items-center', gap[size], className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'rounded-full bg-primary dark:bg-[#AB726F]',
            dotSize[size]
          )}
          animate={{
            y: [0, -8, 0],
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// ORBIT VARIANT - Orbiting particles
// ============================================
function OrbitSpinner({ size = 'md', className }) {
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Central core with glow */}
      <div className="absolute inset-[35%] rounded-full bg-primary/20 dark:bg-[#AB726F]/20 blur-sm" />
      <div className="absolute inset-[40%] rounded-full bg-primary dark:bg-[#AB726F]" />
      
      {/* Orbit track */}
      <div className="absolute inset-0 rounded-full border border-dashed border-primary/20 dark:border-white/10" />
      
      {/* Orbiting particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.div
            className={cn(
              'absolute rounded-full',
              i === 0 ? 'h-1.5 w-1.5 bg-primary dark:bg-[#AB726F] top-0 left-1/2 -translate-x-1/2' :
              i === 1 ? 'h-1 w-1 bg-primary/70 dark:bg-white/50 bottom-0 left-1/2 -translate-x-1/2' :
              'h-1 w-1 bg-primary/50 dark:bg-white/30 top-1/2 right-0 -translate-y-1/2'
            )}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// BARS VARIANT - Audio wave bars
// ============================================
function BarsSpinner({ size = 'md', className }) {
  const barHeight = {
    xs: 'h-2',
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
    '2xl': 'h-10',
  };

  return (
    <div className={cn('flex items-end gap-0.5', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'w-1 rounded-full bg-primary dark:bg-[#AB726F]',
            barHeight[size]
          )}
          animate={{
            scaleY: [0.3, 1, 0.3],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
          style={{ transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  );
}

// ============================================
// CARD VARIANT - Credit card shimmer effect
// ============================================
function CardSpinner({ size = 'md', className }) {
  const cardSize = {
    xs: 'h-4 w-6',
    sm: 'h-6 w-9',
    md: 'h-8 w-12',
    lg: 'h-10 w-16',
    xl: 'h-14 w-22',
    '2xl': 'h-18 w-28',
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-md overflow-hidden',
        'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20',
        'dark:from-white/10 dark:via-white/5 dark:to-white/10',
        'border border-primary/20 dark:border-white/10',
        cardSize[size],
        className
      )}
      animate={{ rotateY: [0, 10, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Card chip */}
      <div className="absolute top-1/4 left-1.5 h-1.5 w-2 rounded-sm bg-primary/30 dark:bg-white/20" />
      {/* Card stripe */}
      <div className="absolute bottom-1/4 left-1.5 right-1.5 h-0.5 rounded-full bg-primary/20 dark:bg-white/10" />
    </motion.div>
  );
}

// ============================================
// RING VARIANT - Simple rotating ring (classic)
// ============================================
function RingSpinner({ size = 'md', className }) {
  return (
    <motion.div
      className={cn(
        'rounded-full border-2 border-primary/20 dark:border-white/10',
        'border-t-primary dark:border-t-[#AB726F]',
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ============================================
// MAIN SPINNER COMPONENT
// ============================================
export function Spinner({ 
  variant = 'pulse', 
  size = 'md', 
  className,
  label,
}) {
  const SpinnerComponent = {
    pulse: PulseSpinner,
    dots: DotsSpinner,
    orbit: OrbitSpinner,
    bars: BarsSpinner,
    card: CardSpinner,
    ring: RingSpinner,
  }[variant] || PulseSpinner;

  if (label) {
    return (
      <div className="flex flex-col items-center gap-3">
        <SpinnerComponent size={size} className={className} />
        <motion.span
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {label}
        </motion.span>
      </div>
    );
  }

  return <SpinnerComponent size={size} className={className} />;
}

// ============================================
// INLINE SPINNER - For buttons and inline contexts
// ============================================
export function InlineSpinner({ size = 'sm', className }) {
  return (
    <motion.div
      className={cn(
        'rounded-full border-2 border-current/20 border-t-current',
        size === 'xs' ? 'h-3 w-3' : 
        size === 'sm' ? 'h-4 w-4' : 
        size === 'md' ? 'h-5 w-5' : 'h-6 w-6',
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ============================================
// LOADING STATE WRAPPER
// ============================================
export function LoadingState({ 
  isLoading, 
  children, 
  variant = 'pulse',
  size = 'lg',
  label = 'Loading...',
  className,
  spinnerClassName,
}) {
  if (!isLoading) return children;

  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <Spinner 
        variant={variant} 
        size={size} 
        label={label}
        className={spinnerClassName}
      />
    </div>
  );
}

export default Spinner;
