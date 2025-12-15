import { cn } from '../../lib/utils';
import { forwardRef } from 'react';

/**
 * Input Components - Premium Glass 2025
 * Clean, minimal with refined focus states
 */

const Input = forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-xl px-4",
                "text-sm font-mono text-gray-700",
                "bg-white/80",
                "border border-orange-200/50",
                "placeholder:text-gray-400",
                "focus:outline-none",
                "focus:border-orange-400/60 focus:bg-white",
                "focus:ring-2 focus:ring-orange-400/20",
                "disabled:cursor-not-allowed disabled:opacity-40",
                "transition-all duration-200",
                "shadow-sm",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = "Input";

// Textarea - Warm theme styling
const Textarea = forwardRef(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                "flex w-full rounded-xl p-4",
                "text-sm font-mono text-gray-700 leading-relaxed",
                "bg-white/80",
                "border border-orange-200/50",
                "placeholder:text-gray-400",
                "focus:outline-none",
                "focus:border-orange-400/60 focus:bg-white",
                "focus:ring-2 focus:ring-orange-400/20",
                "disabled:cursor-not-allowed disabled:opacity-40",
                "transition-all duration-200 resize-none",
                "scrollbar-thin shadow-sm",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Textarea.displayName = "Textarea";

// Select - Warm theme dropdown
const Select = forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div className="relative">
            <select
                className={cn(
                    "flex h-11 w-full rounded-xl px-4 appearance-none cursor-pointer",
                    "text-sm font-mono text-gray-700",
                    "bg-white/80",
                    "border border-orange-200/50",
                    "focus:outline-none",
                    "focus:border-orange-400/60 focus:bg-white",
                    "focus:ring-2 focus:ring-orange-400/20",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    "transition-all duration-200",
                    "shadow-sm",
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3.5L5 6.5L8 3.5" />
                </svg>
            </div>
        </div>
    );
});

Select.displayName = "Select";

// Range slider - Warm theme gradient thumb
const RangeSlider = forwardRef(({ className, ...props }, ref) => {
    return (
        <div className="relative">
            <input
                type="range"
                className={cn(
                    "w-full h-1.5 rounded-full appearance-none cursor-pointer",
                    "bg-orange-200/50",
                    "[&::-webkit-slider-thumb]:appearance-none",
                    "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
                    "[&::-webkit-slider-thumb]:rounded-full",
                    "[&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-orange-400 [&::-webkit-slider-thumb]:to-orange-500",
                    "[&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,107,53,0.4)]",
                    "[&::-webkit-slider-thumb]:cursor-pointer",
                    "[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200",
                    "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white",
                    "[&::-webkit-slider-thumb]:hover:scale-110",
                    "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4",
                    "[&::-moz-range-thumb]:rounded-full",
                    "[&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-orange-400 [&::-moz-range-thumb]:to-orange-500",
                    "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white",
                    className
                )}
                ref={ref}
                {...props}
            />
        </div>
    );
});

RangeSlider.displayName = "RangeSlider";

export { Input, Textarea, Select, RangeSlider };
