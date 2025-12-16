import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionButton = motion.button;

/**
 * Button Component - Luma Warm Theme
 * - Primary: Orange (#F97316) with pill shape
 * - Secondary: White with warm gray tones (stone palette)
 * - Destructive: Rose (#F43F5E)
 * - Ghost: Transparent with warm hover states (amber tint)
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
    // Uses centralized btn-* classes from index.css
    const variants = {
        primary: "btn-primary focus-visible:ring-orange-500",
        secondary: "btn-secondary focus-visible:ring-stone-400",
        destructive: "btn-destructive focus-visible:ring-rose-500",
        ghost: "btn-ghost focus-visible:ring-stone-400",
        outline: "btn-secondary focus-visible:ring-stone-400",
        success: "btn-success focus-visible:ring-emerald-500",
    };

    const sizes = {
        sm: "h-9 px-4 text-xs",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10 p-0",
    };

    const motionProps = animated ? {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.96 },
        transition: { type: "spring", stiffness: 400, damping: 25 }
    } : {};

    return (
        <MotionButton
            className={cn(
                "relative inline-flex items-center justify-center gap-2",
                "font-medium cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#252033]",
                "disabled:pointer-events-none disabled:opacity-40",
                variants[variant],
                sizes[size],
                isLoading && "cursor-wait",
                className
            )}
            disabled={isLoading || props.disabled}
            {...motionProps}
            {...props}
        >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </MotionButton>
    );
}

/**
 * IconButton - Uses centralized CSS
 */
export function IconButton({ children, className, variant = 'default', ...props }) {
    const variants = {
        default: "btn-icon",
        ghost: "btn-ghost",
        glass: "btn-icon",
    };

    return (
        <motion.button
            className={cn(
                "relative p-2 rounded-apple",
                "focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-40",
                variants[variant],
                className
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            {...props}
        >
            {children}
        </motion.button>
    );
}
