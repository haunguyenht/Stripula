import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Badge Component - Luma Warm Theme 2025
 * 
 * Status colors aligned with Luma warm aesthetic and CSS variables:
 * - Live/Success: Emerald (#10B981) - var(--luma-success)
 * - Dead/Die: Rose (#F43F5E) - var(--luma-error)
 * - Error/Warning: Amber (#F59E0B) - var(--luma-warning)
 * 
 * Uses centralized CSS classes from index.css for status indicators:
 * - .status-indicator-live: For live/success states
 * - .status-indicator-dead: For dead/die states  
 * - .status-indicator-error: For error/warning states
 * 
 * Requirements:
 * - 1.1: LIVE results use .status-indicator-live (emerald styling)
 * - 1.2: DEAD/DIE results use .status-indicator-dead (rose styling)
 * - 1.3: ERROR results use .status-indicator-error (amber styling)
 */
export function Badge({ children, variant = 'default', className, animated = false, size = 'default' }) {
    // Variants using centralized CSS classes for status indicators
    // Maintains backward compatibility with existing variant names
    const variants = {
        // Default - neutral warm gray
        default: "text-luma-secondary bg-luma-muted border-luma",
        
        // Modern status badges with gradients and icons
        approved: "status-badge status-badge-approved",
        live: "status-badge status-badge-live",
        live_plus: "status-badge status-badge-live",
        live_zero: "status-badge status-badge-live",
        live_neg: "status-badge status-badge-live",
        success: "status-badge status-badge-live",
        die: "status-badge status-badge-die",
        dead: "status-badge status-badge-die",
        error: "status-badge status-badge-error",
        warning: "status-badge status-badge-error",
        retry: "status-badge status-badge-retry",
        
        // Other variants with warm theme colors
        outline: "text-luma-secondary bg-transparent border-luma-strong",
        primary: "text-luma-coral-dark bg-luma-coral-10 border-luma-coral-30",
        info: "text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
        secondary: "text-luma-secondary bg-luma-muted border-luma",
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

/**
 * StatusDot Component - Visual status indicator
 * 
 * Colors aligned with Luma theme CSS variables:
 * - live: Emerald (#10B981) - var(--luma-success)
 * - die/dead: Rose (#F43F5E) - var(--luma-error)
 * - error/warning: Amber (#F59E0B) - var(--luma-warning)
 */
export function StatusDot({ status = 'default', pulse = false, size = 'default', className }) {
    // Uses centralized status-dot-* classes from index.css
    const colors = {
        default: 'bg-gray-400',
        // Live status - Emerald (Requirement 6.1)
        live: 'status-dot-live',
        // Die/Dead status - Rose (Requirement 6.2)
        die: 'status-dot-die',
        dead: 'status-dot-dead',
        // Error/Warning status - Amber (Requirement 6.3)
        error: 'status-dot-error',
        warning: 'status-dot-warning',
        // Approved - Luma coral
        approved: 'bg-luma-coral',
        // Info - Sky blue
        info: 'status-dot-info',
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
