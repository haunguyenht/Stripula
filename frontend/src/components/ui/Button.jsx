import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionButton = motion.button;

/**
 * Button Component - Premium Glass 2025
 * Ultra refined with subtle animations
 */
export function Button({ 
    children, 
    className, 
    variant = 'primary', 
    size = 'default', 
    isLoading,
    animated = true,
    ...props 
}) {
    const baseStyles = `
        relative inline-flex items-center justify-center gap-2.5
        font-semibold tracking-wide
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0c14]
        disabled:pointer-events-none disabled:opacity-40
        rounded-xl cursor-pointer overflow-hidden
    `;

    const variants = {
        // Primary - Warm orange gradient
        primary: `
            text-white font-semibold
            bg-gradient-to-r from-orange-500 to-orange-400
            shadow-[0_2px_20px_-4px_rgba(255,107,53,0.4)]
            hover:shadow-[0_4px_28px_-4px_rgba(255,107,53,0.5)]
            hover:brightness-110
            active:scale-[0.98] active:brightness-95
            border border-orange-400/50
        `,
        // Secondary - Light warm
        secondary: `
            text-gray-600 font-medium
            bg-white/80
            border border-orange-200/50
            hover:text-gray-800 hover:bg-white
            hover:border-orange-300/60
            active:scale-[0.98]
            shadow-sm
        `,
        // Destructive - Red gradient
        destructive: `
            text-white font-semibold
            bg-gradient-to-r from-red-500 to-rose-500
            shadow-[0_2px_20px_-4px_rgba(239,68,68,0.4)]
            hover:shadow-[0_4px_28px_-4px_rgba(239,68,68,0.5)]
            hover:brightness-110
            active:scale-[0.98]
            border border-red-400/50
        `,
        // Ghost - Minimal warm
        ghost: `
            bg-transparent
            text-gray-500 hover:text-gray-700
            hover:bg-orange-50
            active:scale-[0.98]
        `,
        // Success - Green gradient
        success: `
            text-white font-semibold
            bg-gradient-to-r from-emerald-500 to-teal-500
            shadow-[0_2px_20px_-4px_rgba(16,185,129,0.4)]
            hover:shadow-[0_4px_28px_-4px_rgba(16,185,129,0.5)]
            hover:brightness-110
            active:scale-[0.98]
            border border-emerald-400/50
        `,
        // Outline - Border only warm
        outline: `
            text-gray-600 font-medium
            bg-transparent
            border border-orange-200
            hover:text-gray-800 hover:bg-orange-50
            hover:border-orange-300
            active:scale-[0.98]
        `,
    };

    const sizes = {
        sm: "h-9 px-4 text-xs",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10 p-0",
    };

    const motionProps = animated ? {
        whileHover: { scale: 1.01 },
        whileTap: { scale: 0.98 },
        transition: { type: "spring", stiffness: 500, damping: 30 }
    } : {};

    return (
        <MotionButton
            className={cn(baseStyles, variants[variant], sizes[size], isLoading && "cursor-wait", className)}
            disabled={isLoading || props.disabled}
            {...motionProps}
            {...props}
        >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </MotionButton>
    );
}

// Icon button - Warm theme
export function IconButton({ children, className, variant = 'default', ...props }) {
    const variants = {
        default: `
            text-gray-400 hover:text-gray-600
            bg-transparent hover:bg-orange-50
        `,
        ghost: `
            text-gray-400 hover:text-gray-600
            bg-transparent
        `,
        glass: `
            text-gray-500 hover:text-gray-700
            bg-white/60 hover:bg-white
            border border-orange-200/50 hover:border-orange-300/60
            shadow-sm
        `,
    };

    return (
        <motion.button
            className={cn(
                "relative p-2 rounded-lg transition-all duration-200",
                variants[variant],
                className
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            {...props}
        >
            {children}
        </motion.button>
    );
}
