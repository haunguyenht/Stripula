import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Skeleton Component - Content placeholder loaders
 * 
 * Themed for both OrangeAI (light) and OPUX (dark) modes
 * Features smooth shimmer animation
 */

// Base skeleton with shimmer animation
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md',
        'bg-[rgb(248,247,247)] dark:bg-white/5',
        className
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 1.5,
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

// Card content skeleton
export function SkeletonCard({ className }) {
  return (
    <div className={cn(
      'rounded-2xl p-4',
      'bg-white dark:bg-[rgba(30,41,59,0.5)]',
      'border border-[rgb(237,234,233)] dark:border-white/10',
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

// Result card skeleton - matches ResultCard layout
export function SkeletonResultCard({ className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-xl p-4',
        'bg-white dark:bg-[rgba(30,41,59,0.5)]',
        'border border-[rgb(237,234,233)] dark:border-white/10',
        'dark:backdrop-blur-sm',
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
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgb(237,234,233)] dark:border-white/5">
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
      <div className="flex items-center gap-4 py-3 border-b border-[rgb(237,234,233)] dark:border-white/10">
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
