import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * StatPill Component - Compact Modern Design
 * Uses centralized CSS classes from index.css (.stat-pill-*)
 */

const colorClassMap = {
    default: '',
    emerald: 'stat-pill-emerald',
    rose: 'stat-pill-rose',
    amber: 'stat-pill-amber',
    coral: 'stat-pill-coral',
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
    const isClickable = typeof onClick === 'function';
    const colorClass = colorClassMap[color] || '';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!isClickable}
            className={cn(
                "stat-pill",
                colorClass,
                active && "stat-pill-active",
                isClickable ? "cursor-pointer" : "cursor-default",
                className
            )}
            title={`${label}: ${value}`}
        >
            {/* Colored dot - always visible for color indication */}
            <span className={cn(
                "stat-pill-dot",
                !showDot && "hidden sm:inline-block" // Hide on mobile unless showDot is true
            )} />
            {/* Label - hidden on very small screens */}
            <span className="stat-pill-label hidden sm:inline">{label}</span>
            <span className="stat-pill-value">{value}</span>
        </button>
    );
}

/**
 * StatPillGroup - Compact Segmented Control
 * Uses centralized CSS classes from index.css (.stat-pill-group)
 * Handles overflow by wrapping on smaller screens
 */
export function StatPillGroup({ 
    stats, 
    activeFilter, 
    onFilterChange,
    className,
}) {
    return (
        <div 
            className={cn("stat-pill-group flex-wrap", className)}
        >
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

/**
 * MiniBarChart - Animated bar visualization
 * Uses centralized CSS classes (.bar-gradient-*) from index.css
 */
export function MiniBarChart({ 
    data = [], 
    color = 'default',
    height = 24,
    className,
}) {
    const maxValue = Math.max(...data, 1);
    const barGradientClassMap = {
        default: 'bar-gradient-default',
        emerald: 'bar-gradient-emerald',
        rose: 'bar-gradient-rose',
        amber: 'bar-gradient-amber',
        indigo: 'bar-gradient-indigo',
    };
    
    return (
        <div 
            className={cn("flex items-end gap-1", className)}
            style={{ height }}
        >
            {data.map((value, index) => {
                const barHeight = (value / maxValue) * 100;
                return (
                    <motion.div
                        key={index}
                        className={cn(
                            "w-2 rounded-full",
                            barGradientClassMap[color] || barGradientClassMap.default
                        )}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: `${Math.max(barHeight, 15)}%`, opacity: 1 }}
                        transition={{ 
                            duration: 0.5, 
                            delay: index * 0.08,
                            ease: [0.34, 1.56, 0.64, 1]
                        }}
                    />
                );
            })}
        </div>
    );
}

// Text color mapping for StatCard - uses centralized CSS classes (.stat-text-*)
const statCardTextClassMap = {
    default: 'stat-text-default',
    emerald: 'stat-text-emerald',
    rose: 'stat-text-rose',
    amber: 'stat-text-amber',
};

/**
 * StatCard - Modern glass card with hover effects
 * Uses centralized CSS classes (.stat-text-*) from index.css
 */
export function StatCard({
    label,
    value,
    color = 'default',
    trend,
    chartData,
    className,
}) {
    const textColorClass = statCardTextClassMap[color] || statCardTextClassMap.default;
    
    return (
        <motion.div 
            className={cn(
                "relative flex flex-col p-5 rounded-3xl overflow-hidden",
                "surface-glass",
                className
            )}
            whileHover={{ 
                y: -4, 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            {/* Gradient accent - uses centralized stat-accent-* classes */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20",
                color === 'emerald' && "stat-accent-emerald",
                color === 'rose' && "stat-accent-rose",
                color === 'amber' && "stat-accent-amber",
                color === 'default' && "stat-accent-default",
            )} />
            
            <div className="relative flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {label}
                </span>
                {trend !== undefined && (
                    <motion.span 
                        className={cn(
                            "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                            trend >= 0 ? "trend-positive" : "trend-negative"
                        )}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </motion.span>
                )}
            </div>
            <div className="relative flex items-end justify-between">
                <motion.span 
                    className={cn("text-3xl font-bold tracking-tight", textColorClass)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {value}
                </motion.span>
                {chartData && chartData.length > 0 && (
                    <MiniBarChart data={chartData} color={color} height={28} />
                )}
            </div>
        </motion.div>
    );
}
