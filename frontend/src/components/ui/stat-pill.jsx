import { memo } from 'react';
import { cn } from '@/lib/utils';

// Light mode active colors - Vintage Banking / Cream Paper + Copper Foil
const colorClasses = {
  default: '',
  emerald: 'data-[active=true]:bg-[hsl(145,25%,92%)] data-[active=true]:text-[hsl(145,45%,35%)]',
  rose: 'data-[active=true]:bg-[hsl(355,25%,93%)] data-[active=true]:text-[hsl(355,40%,45%)]',
  amber: 'data-[active=true]:bg-[hsl(38,35%,92%)] data-[active=true]:text-[hsl(30,55%,40%)]',
  coral: 'data-[active=true]:bg-[hsl(25,35%,92%)] data-[active=true]:text-[hsl(25,65%,45%)]',
  cyan: 'data-[active=true]:bg-[hsl(180,25%,92%)] data-[active=true]:text-[hsl(180,40%,35%)]',
  primary: 'data-[active=true]:bg-[hsl(25,30%,92%)] data-[active=true]:text-primary',
  success: 'data-[active=true]:bg-[hsl(145,25%,92%)] data-[active=true]:text-[hsl(145,45%,35%)]',
  destructive: 'data-[active=true]:bg-[hsl(355,25%,93%)] data-[active=true]:text-[hsl(355,40%,45%)]',
  warning: 'data-[active=true]:bg-[hsl(38,35%,92%)] data-[active=true]:text-[hsl(30,55%,40%)]',
};

// Dark mode active colors (Liquid Aurora style) - with neon glow
const darkColorClasses = {
  default: 'dark:data-[active=true]:bg-white/[0.08] dark:data-[active=true]:text-white dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(139,92,246,0.4)]',
  emerald: 'dark:data-[active=true]:bg-emerald-500/[0.12] dark:data-[active=true]:text-emerald-400 dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(16,185,129,0.5)]',
  rose: 'dark:data-[active=true]:bg-rose-500/[0.12] dark:data-[active=true]:text-rose-400 dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(244,63,94,0.5)]',
  amber: 'dark:data-[active=true]:bg-amber-500/[0.12] dark:data-[active=true]:text-amber-400 dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(245,158,11,0.5)]',
  coral: 'dark:data-[active=true]:bg-orange-500/[0.12] dark:data-[active=true]:text-orange-400 dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(249,115,22,0.5)]',
  cyan: 'dark:data-[active=true]:bg-cyan-500/[0.12] dark:data-[active=true]:text-[var(--aurora-cyan)] dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(34,211,238,0.5)]',
  primary: 'dark:data-[active=true]:bg-[var(--aurora-indigo)]/[0.12] dark:data-[active=true]:text-[var(--aurora-indigo)] dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(139,92,246,0.5)]',
  success: 'dark:data-[active=true]:bg-emerald-500/[0.12] dark:data-[active=true]:text-emerald-400 dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(16,185,129,0.5)]',
  destructive: 'dark:data-[active=true]:bg-rose-500/[0.12] dark:data-[active=true]:text-rose-400 dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(244,63,94,0.5)]',
  warning: 'dark:data-[active=true]:bg-amber-500/[0.12] dark:data-[active=true]:text-amber-400 dark:data-[active=true]:shadow-[0_0_12px_-4px_rgba(245,158,11,0.5)]',
};

// Dot colors - Vintage ink tones for light mode
const dotColors = {
  default: 'bg-[hsl(25,20%,50%)]',
  emerald: 'bg-[hsl(145,45%,38%)] dark:bg-emerald-400',
  rose: 'bg-[hsl(355,40%,48%)] dark:bg-red-400',
  amber: 'bg-[hsl(35,55%,45%)] dark:bg-amber-400',
  coral: 'bg-[hsl(25,65%,48%)] dark:bg-orange-400',
  cyan: 'bg-[hsl(180,40%,38%)] dark:bg-cyan-400',
  primary: 'bg-primary',
  success: 'bg-[hsl(145,45%,38%)] dark:bg-emerald-400',
  destructive: 'bg-[hsl(355,40%,48%)] dark:bg-red-400',
  warning: 'bg-[hsl(35,55%,45%)] dark:bg-amber-400',
};

/**
 * StatPill - Liquid Aurora Design System
 * 
 * Compact stat display with filter functionality
 * Light: Vintage Banking | Dark: Liquid glass with aurora neon glow
 * Responsive: shows only dot+value on small screens, full label on larger screens
 */
export const StatPill = memo(function StatPill({ 
  label, 
  value, 
  color = 'default', 
  active = false, 
  onClick,
  className,
  showDot = false,
  compact = false, // Force compact mode
}) {
  const isClickable = typeof onClick === 'function';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      data-active={active}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium transition-all duration-200",
        // Larger padding on bigger screens
        "sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-xs",
        "border border-transparent",
        // Light mode - vintage parchment styling
        "text-[hsl(25,30%,35%)] hover:bg-[hsl(38,30%,92%)]",
        // Light mode active - aged paper with copper border
        "data-[active=true]:border-[hsl(30,25%,78%)] data-[active=true]:bg-[hsl(40,35%,95%)]",
        colorClasses[color],
        // Dark mode base - Liquid glass
        "dark:text-white/70 dark:hover:text-white/90 dark:hover:bg-white/[0.06]",
        // Dark mode active - Liquid glass with aurora border
        "dark:data-[active=true]:border-white/[0.15] dark:data-[active=true]:bg-white/[0.08]",
        "dark:data-[active=true]:backdrop-blur-sm",
        darkColorClasses[color],
        isClickable ? "cursor-pointer" : "cursor-default",
        className
      )}
      title={`${label}: ${value}`}
    >
      {showDot && (
        <span className={cn(
          "h-1.5 w-1.5 sm:h-1.5 sm:w-1.5 rounded-full shrink-0",
          dotColors[color],
          // Glow effect for active dot in dark mode
          active && "dark:shadow-[0_0_6px_currentColor]"
        )} />
      )}
      <span className={cn(
        "text-muted-foreground dark:text-inherit/70 data-[active=true]:text-inherit",
        // Show label on small screens when active, always show on md+
        compact ? "hidden" : "hidden sm:inline",
        // Show label when active even on small screens
        active && !compact && "inline"
      )}>
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </button>
  );
});

/**
 * StatPillGroup - Group of stat pills
 * Supports flex-nowrap via className for horizontal scrolling layouts
 * Memoized for performance (Requirements 5.5)
 */
export const StatPillGroup = memo(function StatPillGroup({ 
  stats, 
  activeFilter, 
  onFilterChange,
  className,
  compact = false,
}) {
  return (
    <div className={cn("flex gap-1", className)}>
      {stats.map((stat) => (
        <StatPill
          key={stat.id}
          label={stat.label}
          value={stat.value}
          color={stat.color}
          showDot={stat.showDot}
          active={activeFilter === stat.id}
          onClick={() => onFilterChange?.(stat.id)}
          compact={compact}
        />
      ))}
    </div>
  );
});
