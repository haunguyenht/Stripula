import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Badge Component - Premium Glass 2025
 * Refined status colors with subtle glow
 */
export function Badge({ children, variant = 'default', className, animated = false, size = 'default' }) {
    const variants = {
        default: "text-white/50 bg-white/[0.04] border-white/[0.06]",
        
        // Live/Success variants
        live: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        live_plus: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30 font-bold",
        live_zero: "text-amber-400 bg-amber-500/10 border-amber-500/15",
        live_neg: "text-amber-500/70 bg-amber-500/5 border-amber-500/10",
        
        // Die/Dead variants
        die: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        dead: "text-rose-500/60 bg-rose-500/5 border-rose-500/10",
        
        // Status variants
        error: "text-amber-400 bg-amber-500/10 border-amber-500/15",
        retry: "text-purple-400 bg-purple-500/10 border-purple-500/15",
        
        // Success/Approved
        approved: "text-indigo-300 bg-indigo-500/15 border-indigo-500/25 font-bold",
        success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        
        // Other variants
        outline: "text-white/50 bg-transparent border-white/[0.08]",
        primary: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        info: "text-cyan-400 bg-cyan-500/10 border-cyan-500/15",
        secondary: "text-purple-400 bg-purple-500/10 border-purple-500/15",
        warning: "text-amber-400 bg-amber-500/10 border-amber-500/15",
    };

    const sizes = {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-1 text-[11px]",
        lg: "px-3 py-1.5 text-xs",
    };

    const Component = animated ? motion.span : 'span';
    const motionProps = animated ? {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring", stiffness: 500, damping: 30 }
    } : {};

    return (
        <Component
            className={cn(
                "inline-flex items-center rounded-md font-semibold uppercase tracking-wider",
                "border",
                variants[variant],
                sizes[size],
                className
            )}
            {...motionProps}
        >
            {children}
        </Component>
    );
}

// Status dot indicator
export function StatusDot({ status = 'default', pulse = false, size = 'default', className }) {
    const colors = {
        default: 'bg-white/30',
        live: 'bg-emerald-400',
        die: 'bg-rose-400',
        error: 'bg-amber-400',
        approved: 'bg-indigo-400',
        warning: 'bg-amber-400',
        info: 'bg-cyan-400',
    };

    const sizes = {
        sm: 'w-1.5 h-1.5',
        default: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
    };

    return (
        <span 
            className={cn(
                "inline-block rounded-full",
                colors[status],
                sizes[size],
                pulse && "animate-pulse-soft",
                className
            )} 
        />
    );
}
