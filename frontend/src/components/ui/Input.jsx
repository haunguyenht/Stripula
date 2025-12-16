import { cn } from '../../lib/utils';
import { forwardRef } from 'react';

/**
 * Input Components - Luma Warm Theme
 * Uses centralized CSS classes with warm color palette
 */

const Input = forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "floating-input rounded-apple",
                "flex h-11 w-full px-4",
                "text-sm font-mono text-luma",
                "placeholder:text-luma-muted",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-luma-muted",
                "focus:outline-none focus:border-luma-coral-30 focus:ring-2 focus:ring-luma-coral-20",
                "transition-all duration-200",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = "Input";

const Textarea = forwardRef(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                "floating-input rounded-apple-lg",
                "flex w-full p-4",
                "text-sm font-mono text-luma leading-relaxed",
                "placeholder:text-luma-muted",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-luma-muted",
                "focus:outline-none focus:border-luma-coral-30 focus:ring-2 focus:ring-luma-coral-20",
                "resize-none scrollbar-thin transition-all duration-200",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Textarea.displayName = "Textarea";

const Select = forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div className="relative">
            <select
                className={cn(
                    "floating-input rounded-apple",
                    "flex h-11 w-full px-4 appearance-none cursor-pointer",
                    "text-sm font-apple-medium text-luma",
                    "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-luma-muted",
                    "focus:outline-none focus:border-luma-coral-30 focus:ring-2 focus:ring-luma-coral-20",
                    "transition-all duration-200",
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-luma-muted">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3.5L5 6.5L8 3.5" />
                </svg>
            </div>
        </div>
    );
});

Select.displayName = "Select";

const RangeSlider = forwardRef(({ className, value, min = 0, max = 100, ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100;
    
    return (
        <div className="relative w-full">
            <input
                type="range"
                value={value}
                min={min}
                max={max}
                className={cn(
                    "range-slider w-full h-2 rounded-full appearance-none cursor-pointer",
                    className
                )}
                style={{
                    background: `linear-gradient(to right, var(--luma-coral) 0%, var(--luma-coral) ${percentage}%, var(--luma-border) ${percentage}%, var(--luma-border) 100%)`
                }}
                ref={ref}
                {...props}
            />
        </div>
    );
});

RangeSlider.displayName = "RangeSlider";

export { Input, Textarea, Select, RangeSlider };
