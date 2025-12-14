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
                "text-sm font-mono text-white",
                "bg-[rgba(12,12,20,0.8)]",
                "border border-white/[0.06]",
                "placeholder:text-white/25",
                "focus:outline-none",
                "focus:border-indigo-500/40 focus:bg-[rgba(17,17,27,0.9)]",
                "focus:ring-2 focus:ring-indigo-500/10",
                "disabled:cursor-not-allowed disabled:opacity-40",
                "transition-all duration-200",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = "Input";

// Textarea - Refined styling
const Textarea = forwardRef(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                "flex w-full rounded-xl p-4",
                "text-sm font-mono text-white/90 leading-relaxed",
                "bg-[rgba(12,12,20,0.8)]",
                "border border-white/[0.06]",
                "placeholder:text-white/25",
                "focus:outline-none",
                "focus:border-indigo-500/40 focus:bg-[rgba(17,17,27,0.9)]",
                "focus:ring-2 focus:ring-indigo-500/10",
                "disabled:cursor-not-allowed disabled:opacity-40",
                "transition-all duration-200 resize-none",
                "scrollbar-thin",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Textarea.displayName = "Textarea";

// Select - Clean dropdown
const Select = forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div className="relative">
            <select
                className={cn(
                    "flex h-11 w-full rounded-xl px-4 appearance-none cursor-pointer",
                    "text-sm font-mono text-white",
                    "bg-[rgba(12,12,20,0.8)]",
                    "border border-white/[0.06]",
                    "focus:outline-none",
                    "focus:border-indigo-500/40 focus:bg-[rgba(17,17,27,0.9)]",
                    "focus:ring-2 focus:ring-indigo-500/10",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    "transition-all duration-200",
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3.5L5 6.5L8 3.5" />
                </svg>
            </div>
        </div>
    );
});

Select.displayName = "Select";

// Range slider - Modern gradient thumb
const RangeSlider = forwardRef(({ className, ...props }, ref) => {
    return (
        <div className="relative">
            <input
                type="range"
                className={cn(
                    "w-full h-1.5 rounded-full appearance-none cursor-pointer",
                    "bg-white/[0.06]",
                    "[&::-webkit-slider-thumb]:appearance-none",
                    "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
                    "[&::-webkit-slider-thumb]:rounded-full",
                    "[&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-indigo-400 [&::-webkit-slider-thumb]:to-purple-500",
                    "[&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(99,102,241,0.5)]",
                    "[&::-webkit-slider-thumb]:cursor-pointer",
                    "[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200",
                    "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20",
                    "[&::-webkit-slider-thumb]:hover:scale-110",
                    "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4",
                    "[&::-moz-range-thumb]:rounded-full",
                    "[&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-indigo-400 [&::-moz-range-thumb]:to-purple-500",
                    "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/20",
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
