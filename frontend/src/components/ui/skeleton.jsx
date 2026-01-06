import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Skeleton Component - Liquid Aurora Design System
 * 
 * Light Theme: Vintage Banking with warm copper shimmer
 * Dark Theme: Aurora shimmer with indigo→cyan sweep + liquid glass
 * 
 * Features:
 * - Liquid glass background in dark mode
 * - Dual-layer aurora gradient shimmer animation
 * - Specular highlight edge
 */

// Base skeleton with aurora shimmer animation
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        // Light mode: Vintage parchment
        'bg-[hsl(38,25%,91%)]',
        // Dark mode: Liquid glass base
        'dark:bg-white/[0.04]',
        // Specular highlight in dark mode
        'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
        className
      )}
      {...props}
    >
      {/* Light mode shimmer - warm copper sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(25,60%,75%)]/30 to-transparent dark:hidden"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Dark mode shimmer - Aurora indigo sweep */}
      <motion.div
        className="absolute inset-0 hidden dark:block bg-gradient-to-r from-transparent via-[var(--aurora-indigo)]/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Secondary aurora layer - cyan, offset for depth */}
      <motion.div
        className="absolute inset-0 hidden dark:block bg-gradient-to-r from-transparent via-[var(--aurora-cyan)]/15 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 2,
          delay: 0.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Text line skeleton
export function SkeletonText({ lines = 1, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// Avatar skeleton
export function SkeletonAvatar({ size = 'md', className }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
  );
}

// Card content skeleton - Liquid Aurora styling
export function SkeletonCard({ className }) {
  return (
    <div className={cn(
      'rounded-2xl p-4',
      // Light: Vintage banking cream
      'bg-[hsl(38,45%,98%)] border border-[hsl(30,25%,85%)]',
      // Dark: Liquid glass
      'dark:bg-white/[0.03] dark:border-white/[0.08]',
      'dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]',
      // Specular highlight
      'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
      className
    )}>
      <div className="flex items-start gap-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

// Result card skeleton - Liquid Aurora styling matching ResultCard
export function SkeletonResultCard({ className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-2xl p-4',
        // Light: Vintage banking cream
        'bg-[hsl(38,45%,98%)] border border-[hsl(30,25%,85%)]',
        // Dark: Liquid glass with aurora edge glow
        'dark:bg-white/[0.03] dark:border-white/[0.08]',
        'dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]',
        // Specular highlight + subtle aurora glow
        'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_30px_-12px_rgba(139,92,246,0.15)]',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Card info */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        {/* Right side - Status badge */}
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {/* Bottom row - BIN info */}
      <div className={cn(
        'flex items-center gap-2 mt-3 pt-3 border-t',
        'border-[hsl(30,25%,88%)] dark:border-white/5'
      )}>
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
    </motion.div>
  );
}

// Stats skeleton
export function SkeletonStats({ count = 4, className }) {
  return (
    <div className={cn('flex gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-16 rounded-full" />
      ))}
    </div>
  );
}

// Table row skeleton
export function SkeletonTableRow({ columns = 4, className }) {
  return (
    <div className={cn('flex items-center gap-4 py-3', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === 0 ? 'w-8 rounded-full' : 
            i === columns - 1 ? 'w-16' : 'flex-1'
          )}
        />
      ))}
    </div>
  );
}

// Table skeleton
export function SkeletonTable({ rows = 5, columns = 4, className }) {
  return (
    <div className={cn('space-y-0', className)}>
      {/* Header */}
      <div className={cn(
        'flex items-center gap-4 py-3 border-b',
        'border-[hsl(30,25%,88%)] dark:border-white/10'
      )}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'h-4',
              i === 0 ? 'w-8' : 'flex-1'
            )}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

// Form field skeleton
export function SkeletonFormField({ className }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

// List of cards skeleton
export function SkeletonResultList({ count = 3, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonResultCard key={i} />
      ))}
    </div>
  );
}

// Panel content skeleton - for validation panels
export function SkeletonPanelContent({ className }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Config section */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonFormField />
          <SkeletonFormField />
        </div>
      </div>
      
      {/* Textarea section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      
      {/* Button row */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export default Skeleton;
