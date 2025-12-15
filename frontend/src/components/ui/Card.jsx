import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

/**
 * Card Component - Warm Theme 2025
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
        default: "bg-white/80 border border-orange-200/40 shadow-sm",
        flat: "bg-white/60 border border-orange-200/30",
        elevated: "bg-white border border-orange-200/50 shadow-md",
    };

    const hoverStyles = hover ? 'hover:bg-white hover:shadow-md hover:border-orange-300/50 cursor-pointer transition-all duration-200' : '';

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
            className={cn("p-5 pb-4 border-b border-orange-200/30", className)} 
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({ children, className, ...props }) {
    return (
        <h3 
            className={cn("text-base font-semibold text-gray-800", className)} 
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardDescription({ children, className, ...props }) {
    return (
        <p 
            className={cn("text-sm text-gray-500 mt-1", className)} 
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
            className={cn("flex items-center p-5 pt-0 border-t border-orange-200/30", className)} 
            {...props}
        >
            {children}
        </div>
    );
}

// Result card with status accent - Warm theme
export function ResultCard({ 
    children, 
    status = 'default', 
    className,
    onClick,
    ...props 
}) {
    const statusStyles = {
        default: 'border-l-gray-300',
        live: 'border-l-emerald-500',
        die: 'border-l-rose-400 opacity-80',
        error: 'border-l-amber-500',
        approved: 'border-l-orange-500',
        warning: 'border-l-amber-500',
        info: 'border-l-cyan-500',
    };

    return (
        <MotionDiv
            className={cn(
                "p-4 rounded-xl",
                "bg-white/80",
                "border border-orange-200/40",
                "border-l-[3px]",
                "transition-all duration-200",
                "hover:bg-white hover:border-orange-300/50 hover:shadow-sm",
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

// Floating card with enhanced elevation - Warm theme
export function FloatingCard({ children, className, ...props }) {
    return (
        <MotionDiv
            className={cn(
                "rounded-2xl bg-white border border-orange-200/50 shadow-lg",
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
