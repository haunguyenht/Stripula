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
        // Primary - Refined gradient with glow
        primary: `
            text-white font-semibold
            bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
            shadow-[0_2px_20px_-4px_rgba(99,102,241,0.5)]
            hover:shadow-[0_4px_28px_-4px_rgba(99,102,241,0.6)]
            hover:brightness-110
            active:scale-[0.98] active:brightness-95
            border border-white/10
        `,
        // Secondary - Subtle glass
        secondary: `
            text-white/70 font-medium
            bg-white/[0.04]
            border border-white/[0.06]
            hover:text-white hover:bg-white/[0.08]
            hover:border-white/[0.1]
            active:scale-[0.98]
        `,
        // Destructive - Red gradient
        destructive: `
            text-white font-semibold
            bg-gradient-to-r from-red-500 to-rose-500
            shadow-[0_2px_20px_-4px_rgba(239,68,68,0.4)]
            hover:shadow-[0_4px_28px_-4px_rgba(239,68,68,0.5)]
            hover:brightness-110
            active:scale-[0.98]
            border border-white/10
        `,
        // Ghost - Minimal
        ghost: `
            bg-transparent
            text-white/50 hover:text-white
            hover:bg-white/[0.04]
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
            border border-white/10
        `,
        // Outline - Border only
        outline: `
            text-white/70 font-medium
            bg-transparent
            border border-white/[0.1]
            hover:text-white hover:bg-white/[0.04]
            hover:border-indigo-500/30
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

// Icon button - Minimal and clean
export function IconButton({ children, className, variant = 'default', ...props }) {
    const variants = {
        default: `
            text-white/40 hover:text-white
            bg-transparent hover:bg-white/[0.06]
        `,
        ghost: `
            text-white/40 hover:text-white
            bg-transparent
        `,
        glass: `
            text-white/50 hover:text-white
            bg-white/[0.03] hover:bg-white/[0.08]
            border border-white/[0.04] hover:border-white/[0.08]
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
