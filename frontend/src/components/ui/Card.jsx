import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

/**
 * Card Components - Uses centralized CSS classes
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
        default: "card-3d",
        flat: "bg-luma-surface rounded-apple-lg",
        elevated: "card-3d",
        "3d": "card-3d",
        apple: "card-apple",
    };

    const hoverStyles = hover ? 'cursor-pointer' : '';

    const Component = animated ? MotionDiv : 'div';
    const motionProps = animated ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 400, damping: 30 }
    } : {};

    return (
        <Component
            className={cn(variants[variant], hoverStyles, className)}
            {...motionProps}
            {...props}
        >
            {children}
        </Component>
    );
}

export function CardHeader({ children, className, ...props }) {
    return (
        <div className={cn("p-5 pb-4 border-b border-hairline", className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className, ...props }) {
    return (
        <h3 className={cn("text-base font-apple-medium text-luma", className)} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className, ...props }) {
    return (
        <p className={cn("text-sm text-luma-secondary mt-1", className)} {...props}>
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
        <div className={cn("flex items-center p-5 pt-0 border-t border-luma", className)} {...props}>
            {children}
        </div>
    );
}

/**
 * ResultCard - Uses warm Luma theme status colors
 * - Live: Emerald left border (#10B981) with warm background tint (Requirements 6.1)
 * - Dead/Die: Rose left border (#F43F5E) with warm background tint (Requirements 6.2)
 * - Error: Amber left border with warm background tint (Requirements 6.3)
 * - Hover: Elevation increase and translateY(-1px) (Requirements 6.4)
 * - Selected: Coral ring highlight (Requirements 6.5)
 */
export function ResultCard({ 
    children, 
    status = 'default', 
    isSelected = false,
    className,
    onClick,
    ...props 
}) {
    // Status classes - uses centralized result-status-* classes from index.css
    // Dark mode: clean look with just left indicator, no background tint
    const statusClass = {
        default: 'result-status-default',
        live: 'result-status-live',
        die: 'result-status-die',
        dead: 'result-status-dead',
        error: 'result-status-error',
        approved: 'border-l-[3px] border-l-luma-coral dark:border-l-pink-400 bg-luma-coral-10 dark:bg-transparent',
        warning: 'result-status-warning',
        info: 'result-status-info',
    };

    // Selected state with ring highlight using CSS variable for theme-aware color
    const selectedStyles = isSelected 
        ? 'ring-2 ring-luma-coral ring-offset-2 ring-offset-white dark:ring-offset-[#1a1625] shadow-[0_0_20px_rgba(232,131,107,0.3)] dark:shadow-[0_0_20px_rgba(255,107,157,0.4)]' 
        : '';

    // Get status class, fallback to default for unknown statuses
    const appliedStatusClass = Object.hasOwn(statusClass, status) 
        ? statusClass[status] 
        : statusClass.default;

    return (
        <MotionDiv
            className={cn(
                "p-4 md:p-5",
                "result-card-elevated",
                "relative",
                appliedStatusClass,
                onClick && "cursor-pointer",
                selectedStyles,
                className
            )}
            whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={onClick}
            {...props}
        >
            {children}
        </MotionDiv>
    );
}

/**
 * FloatingCard - Uses centralized CSS
 */
export function FloatingCard({ children, className, ...props }) {
    return (
        <MotionDiv
            className={cn("floating-panel", className)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            {...props}
        >
            {children}
        </MotionDiv>
    );
}
