import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * StatPill Component
 * Combined stat display + filter button
 * Used in Results panel for session stats
 */

const colorVariants = {
    default: {
        base: 'text-gray-500 bg-white/60 border-gray-200',
        active: 'ring-1 ring-orange-400/40 bg-orange-50 border-orange-300 text-orange-600',
    },
    emerald: {
        base: 'text-emerald-600/70 bg-emerald-50/50 border-emerald-200/50',
        active: 'ring-1 ring-emerald-400/40 bg-emerald-100 border-emerald-300 text-emerald-600',
    },
    rose: {
        base: 'text-rose-500/70 bg-rose-50/50 border-rose-200/50',
        active: 'ring-1 ring-rose-400/40 bg-rose-100 border-rose-300 text-rose-600',
    },
    amber: {
        base: 'text-amber-600/70 bg-amber-50/50 border-amber-200/50',
        active: 'ring-1 ring-amber-400/40 bg-amber-100 border-amber-300 text-amber-600',
    },
    indigo: {
        base: 'text-indigo-500/70 bg-indigo-50/50 border-indigo-200/50',
        active: 'ring-1 ring-indigo-400/40 bg-indigo-100 border-indigo-300 text-indigo-600',
    },
};

export function StatPill({ 
    label, 
    value, 
    color = 'default', 
    active = false, 
    onClick,
    className,
    showDot = false,
}) {
    const variant = colorVariants[color] || colorVariants.default;
    const isClickable = typeof onClick === 'function';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!isClickable}
            className={cn(
                "flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg border transition-all duration-200",
                "text-[10px] md:text-xs font-medium whitespace-nowrap",
                isClickable && "cursor-pointer hover:brightness-110",
                !isClickable && "cursor-default",
                active ? variant.active : variant.base,
                className
            )}
        >
            {showDot && (
                <span className={cn(
                    "w-1 h-1 md:w-1.5 md:h-1.5 rounded-full shrink-0",
                    color === 'emerald' && "bg-emerald-500",
                    color === 'rose' && "bg-rose-500",
                    color === 'amber' && "bg-amber-500",
                    color === 'indigo' && "bg-indigo-500",
                    color === 'default' && "bg-gray-400",
                )} />
            )}
            <span>{label}</span>
            <span className="font-mono font-bold">{value}</span>
        </button>
    );
}

/**
 * StatPillGroup - Container for multiple StatPills
 * Handles filter state management
 */
export function StatPillGroup({ 
    stats, 
    activeFilter, 
    onFilterChange,
    className,
}) {
    return (
        <div className={cn("flex items-center gap-1 md:gap-2 flex-nowrap overflow-x-auto", className)}>
            {stats.map((stat) => (
                <StatPill
                    key={stat.id}
                    label={stat.label}
                    value={stat.value}
                    color={stat.color}
                    showDot={stat.showDot}
                    active={activeFilter === stat.id}
                    onClick={() => onFilterChange?.(stat.id)}
                />
            ))}
        </div>
    );
}

