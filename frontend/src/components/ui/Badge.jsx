import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Badge Component - Premium Glass 2025
 * Refined status colors with subtle glow
 */
export function Badge({ children, variant = 'default', className, animated = false, size = 'default' }) {
    const variants = {
        default: "text-gray-500 bg-gray-100 border-gray-200",
        
        // Live/Success variants
        live: "text-emerald-600 bg-emerald-100 border-emerald-200",
        live_plus: "text-emerald-700 bg-emerald-100 border-emerald-300 font-bold",
        live_zero: "text-amber-600 bg-amber-100 border-amber-200",
        live_neg: "text-amber-500 bg-amber-50 border-amber-200",
        
        // Die/Dead variants
        die: "text-rose-600 bg-rose-100 border-rose-200",
        dead: "text-rose-500 bg-rose-50 border-rose-200",
        
        // Status variants
        error: "text-amber-600 bg-amber-100 border-amber-200",
        retry: "text-purple-600 bg-purple-100 border-purple-200",
        
        // Success/Approved
        approved: "text-orange-600 bg-orange-100 border-orange-200 font-bold",
        success: "text-emerald-600 bg-emerald-100 border-emerald-200",
        
        // Other variants
        outline: "text-gray-500 bg-transparent border-gray-300",
        primary: "text-orange-600 bg-orange-100 border-orange-200",
        info: "text-cyan-600 bg-cyan-100 border-cyan-200",
        secondary: "text-purple-600 bg-purple-100 border-purple-200",
        warning: "text-amber-600 bg-amber-100 border-amber-200",
    };

    const sizes = {
        xs: "px-1.5 py-0.5 text-[9px]",
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
        default: 'bg-gray-400',
        live: 'bg-emerald-500',
        die: 'bg-rose-500',
        error: 'bg-amber-500',
        approved: 'bg-orange-500',
        warning: 'bg-amber-500',
        info: 'bg-cyan-500',
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
