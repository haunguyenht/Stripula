import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * StatPill Component - Modern Glassmorphism Style
 * Animated, glassy pills with vibrant colors
 */

const colorConfig = {
    default: {
        dot: 'bg-gray-400 dark:bg-gray-500',
        activeBg: 'bg-white dark:bg-[#2d2640]',
        activeBorder: 'border-gray-200 dark:border-pink-500/30',
        activeGlow: 'shadow-sm dark:shadow-[0_0_20px_rgba(255,107,157,0.15)]',
        text: 'text-gray-500 dark:text-gray-400',
        activeText: 'text-gray-900 dark:text-white',
    },
    emerald: {
        dot: 'bg-emerald-500',
        activeBg: 'bg-white dark:bg-[#1a2e25]',
        activeBorder: 'border-emerald-200 dark:border-emerald-500/40',
        activeGlow: 'shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
        text: 'text-emerald-600 dark:text-emerald-400',
        activeText: 'text-emerald-700 dark:text-emerald-300',
    },
    rose: {
        dot: 'bg-rose-500',
        activeBg: 'bg-white dark:bg-[#2e1a22]',
        activeBorder: 'border-rose-200 dark:border-rose-500/40',
        activeGlow: 'shadow-sm dark:shadow-[0_0_20px_rgba(244,63,94,0.2)]',
        text: 'text-rose-500 dark:text-rose-400',
        activeText: 'text-rose-600 dark:text-rose-300',
    },
    amber: {
        dot: 'bg-amber-500 dark:bg-pink-500',
        activeBg: 'bg-white dark:bg-[#2e1a2a]',
        activeBorder: 'border-amber-200 dark:border-pink-500/40',
        activeGlow: 'shadow-sm dark:shadow-[0_0_20px_rgba(255,107,157,0.2)]',
        text: 'text-amber-600 dark:text-pink-400',
        activeText: 'text-amber-700 dark:text-pink-300',
    },
    indigo: {
        dot: 'bg-indigo-500',
        activeBg: 'bg-white dark:bg-[#1a1a2e]',
        activeBorder: 'border-indigo-200 dark:border-indigo-500/40',
        activeGlow: 'shadow-sm dark:shadow-[0_0_20px_rgba(99,102,241,0.2)]',
        text: 'text-indigo-500 dark:text-indigo-400',
        activeText: 'text-indigo-600 dark:text-indigo-300',
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
    const config = colorConfig[color] || colorConfig.default;
    const isClickable = typeof onClick === 'function';

    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={!isClickable}
            className={cn(
                "relative flex items-center gap-2.5 px-5 py-3 rounded-2xl",
                "text-[13px] font-semibold whitespace-nowrap",
                "transition-all duration-200 ease-out",
                isClickable && "cursor-pointer",
                !isClickable && "cursor-default",
                active 
                    ? cn(config.activeBg, config.activeGlow, config.activeText, "border-2", config.activeBorder)
                    : cn("bg-transparent hover:bg-white/5 dark:hover:bg-white/5 border-2 border-transparent", config.text),
                className
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {/* Animated dot indicator */}
            {showDot && (
                <motion.span 
                    className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        config.dot
                    )}
                    animate={active ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.6, repeat: active ? Infinity : 0, repeatDelay: 2 }}
                />
            )}
            <span className="tracking-tight">{label}</span>
            <span className="font-bold tabular-nums">{value}</span>
        </motion.button>
    );
}

/**
 * StatPillGroup - Modern Glass Container
 * Frosted glass background with inner glow
 */
export function StatPillGroup({ 
    stats, 
    activeFilter, 
    onFilterChange,
    className,
}) {
    return (
        <motion.div 
            className={cn(
                "inline-flex items-center gap-1 p-1.5 rounded-2xl",
                "bg-white/50 dark:bg-[#1f1a2e]/80 backdrop-blur-xl",
                "border border-gray-200/50 dark:border-white/5",
                className
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <StatPill
                        label={stat.label}
                        value={stat.value}
                        color={stat.color}
                        showDot={stat.showDot}
                        active={activeFilter === stat.id}
                        onClick={() => onFilterChange?.(stat.id)}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}

/**
 * MiniBarChart - Animated bar visualization
 */
export function MiniBarChart({ 
    data = [], 
    color = 'default',
    height = 24,
    className,
}) {
    const maxValue = Math.max(...data, 1);
    const barGradients = {
        default: 'from-gray-300 to-gray-400',
        emerald: 'from-emerald-300 to-emerald-500',
        rose: 'from-rose-300 to-rose-500',
        amber: 'from-amber-300 to-amber-500',
        indigo: 'from-indigo-300 to-indigo-500',
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
                            "w-2 rounded-full bg-gradient-to-t",
                            barGradients[color] || barGradients.default
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

/**
 * StatCard - Modern glass card with hover effects
 */
export function StatCard({
    label,
    value,
    color = 'default',
    trend,
    chartData,
    className,
}) {
    const config = colorConfig[color] || colorConfig.default;
    
    return (
        <motion.div 
            className={cn(
                "relative flex flex-col p-5 rounded-3xl overflow-hidden",
                "bg-white/60 dark:bg-white/10 backdrop-blur-xl",
                "border border-white/50 dark:border-white/10",
                "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]",
                className
            )}
            whileHover={{ 
                y: -4, 
                boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            {/* Gradient accent */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20",
                color === 'emerald' && "bg-emerald-400",
                color === 'rose' && "bg-rose-400",
                color === 'amber' && "bg-amber-400",
                color === 'indigo' && "bg-indigo-400",
                color === 'default' && "bg-gray-400",
            )} />
            
            <div className="relative flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {label}
                </span>
                {trend !== undefined && (
                    <motion.span 
                        className={cn(
                            "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                            trend >= 0 
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50" 
                                : "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50"
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
                    className={cn(
                        "text-3xl font-bold tracking-tight",
                        config.activeText
                    )}
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
