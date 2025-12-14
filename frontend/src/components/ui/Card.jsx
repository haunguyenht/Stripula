import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

/**
 * Card Component - Premium Glass 2025
 * Clean surfaces with subtle depth
 */
export function Card({ 
    children, 
    className, 
    variant = 'default',
    hover = false,
    animated = false,
    ...props 
}) {
    const variants = {
        default: "glass",
        flat: "glass-sm",
        elevated: "glass-lg",
    };

    const hoverStyles = hover ? 'glass-hover cursor-pointer' : '';

    const Component = animated ? MotionDiv : 'div';
    const motionProps = animated ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 400, damping: 30 }
    } : {};

    return (
        <Component
            className={cn(
                "rounded-2xl",
                variants[variant],
                hoverStyles,
                className
            )}
            {...motionProps}
            {...props}
        >
            {children}
        </Component>
    );
}

export function CardHeader({ children, className, ...props }) {
    return (
        <div 
            className={cn("p-5 pb-4 border-b border-white/[0.04]", className)} 
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({ children, className, ...props }) {
    return (
        <h3 
            className={cn("text-base font-semibold text-white", className)} 
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardDescription({ children, className, ...props }) {
    return (
        <p 
            className={cn("text-sm text-white/40 mt-1", className)} 
            {...props}
        >
            {children}
        </p>
    );
}

export function CardContent({ children, className, ...props }) {
    return (
        <div className={cn("p-5", className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className, ...props }) {
    return (
        <div 
            className={cn("flex items-center p-5 pt-0 border-t border-white/[0.04]", className)} 
            {...props}
        >
            {children}
        </div>
    );
}

// Result card with status accent
export function ResultCard({ 
    children, 
    status = 'default', 
    className,
    onClick,
    ...props 
}) {
    const statusStyles = {
        default: 'border-l-white/10',
        live: 'border-l-emerald-500/60',
        die: 'border-l-rose-500/50 opacity-70',
        error: 'border-l-amber-500/50',
        approved: 'border-l-indigo-500/60',
        warning: 'border-l-amber-500/50',
        info: 'border-l-cyan-500/50',
    };

    return (
        <MotionDiv
            className={cn(
                "p-4 rounded-xl",
                "bg-[rgba(17,17,27,0.6)]",
                "border border-white/[0.04]",
                "border-l-[3px]",
                "transition-all duration-200",
                "hover:bg-[rgba(22,22,35,0.7)] hover:border-white/[0.06]",
                onClick && "cursor-pointer",
                statusStyles[status],
                className
            )}
            whileHover={onClick ? { x: 2 } : undefined}
            whileTap={onClick ? { scale: 0.995 } : undefined}
            onClick={onClick}
            {...props}
        >
            {children}
        </MotionDiv>
    );
}

// Floating card with enhanced elevation
export function FloatingCard({ children, className, ...props }) {
    return (
        <MotionDiv
            className={cn(
                "rounded-2xl glass-lg",
                className
            )}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            {...props}
        >
            {children}
        </MotionDiv>
    );
}
