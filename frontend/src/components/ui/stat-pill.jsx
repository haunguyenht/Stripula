import { cn } from '@/lib/utils';

// Light mode active colors
const colorClasses = {
  default: '',
  emerald: 'data-[active=true]:bg-success/10 data-[active=true]:text-success',
  rose: 'data-[active=true]:bg-destructive/10 data-[active=true]:text-destructive',
  amber: 'data-[active=true]:bg-warning/10 data-[active=true]:text-warning',
  coral: 'data-[active=true]:bg-primary/10 data-[active=true]:text-primary',
  primary: 'data-[active=true]:bg-primary/10 data-[active=true]:text-primary',
  success: 'data-[active=true]:bg-success/10 data-[active=true]:text-success',
  destructive: 'data-[active=true]:bg-destructive/10 data-[active=true]:text-destructive',
  warning: 'data-[active=true]:bg-warning/10 data-[active=true]:text-warning',
};

// Dark mode active colors (OPUX style)
const darkColorClasses = {
  default: 'dark:data-[active=true]:bg-white/10 dark:data-[active=true]:text-white',
  emerald: 'dark:data-[active=true]:bg-emerald-500/15 dark:data-[active=true]:text-emerald-400',
  rose: 'dark:data-[active=true]:bg-red-500/15 dark:data-[active=true]:text-red-400',
  amber: 'dark:data-[active=true]:bg-amber-500/15 dark:data-[active=true]:text-amber-400',
  coral: 'dark:data-[active=true]:bg-primary/15 dark:data-[active=true]:text-primary',
  primary: 'dark:data-[active=true]:bg-primary/15 dark:data-[active=true]:text-primary',
  success: 'dark:data-[active=true]:bg-emerald-500/15 dark:data-[active=true]:text-emerald-400',
  destructive: 'dark:data-[active=true]:bg-red-500/15 dark:data-[active=true]:text-red-400',
  warning: 'dark:data-[active=true]:bg-amber-500/15 dark:data-[active=true]:text-amber-400',
};

const dotColors = {
  default: 'bg-muted-foreground',
  emerald: 'bg-success dark:bg-emerald-400',
  rose: 'bg-destructive dark:bg-red-400',
  amber: 'bg-warning dark:bg-amber-400',
  coral: 'bg-primary',
  primary: 'bg-primary',
  success: 'bg-success dark:bg-emerald-400',
  destructive: 'bg-destructive dark:bg-red-400',
  warning: 'bg-warning dark:bg-amber-400',
};

/**
 * StatPill - Compact stat display with filter functionality
 * OPUX styled with glass effect in dark mode
 * Responsive: shows only dot+value on small screens, full label on larger screens
 */
export function StatPill({ 
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
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all duration-200",
        // Larger padding on bigger screens
        "sm:gap-1.5 sm:px-2.5 sm:py-1.5",
        "border border-transparent",
        // Light mode hover
        "hover:bg-muted/50",
        // Light mode active
        "data-[active=true]:border-border data-[active=true]:bg-card",
        colorClasses[color],
        // Dark mode base
        "dark:text-white/70 dark:hover:text-white/90 dark:hover:bg-white/5",
        // Dark mode active - OPUX glass
        "dark:data-[active=true]:border-white/15 dark:data-[active=true]:bg-white/10",
        darkColorClasses[color],
        isClickable ? "cursor-pointer" : "cursor-default",
        className
      )}
      title={`${label}: ${value}`}
    >
      {showDot && (
        <span className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          dotColors[color],
          // Glow effect for active dot in dark mode
          active && "dark:shadow-[0_0_6px_currentColor]"
        )} />
      )}
      <span className={cn(
        "text-muted-foreground dark:text-inherit/70 data-[active=true]:text-inherit",
        // Hide label on small screens unless active, always show on md+
        compact ? "hidden" : "hidden md:inline",
        // Show label when active even on small screens
        active && !compact && "inline md:inline"
      )}>
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </button>
  );
}

/**
 * StatPillGroup - Group of stat pills
 * Supports flex-nowrap via className for horizontal scrolling layouts
 */
export function StatPillGroup({ 
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
}
