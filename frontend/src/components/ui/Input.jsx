import * as React from "react";
import { cn } from "../../lib/utils.js";

/**
 * Input Component - Apple-style Inset Field
 * 
 * Dark mode features:
 * - Darker recessed background for contrast
 * - Inner shadow for "pressed in" depth
 * - Clean white focus ring (no colored glow)
 * - High contrast text
 */

const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-10 w-full px-3.5 py-2 text-sm transition-all duration-200 ease-out",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Light mode: Vintage Banking - cream parchment input
          "rounded-xl bg-[hsl(40,50%,97%)] border border-[hsl(30,30%,78%)]",
          "text-[hsl(25,35%,20%)] placeholder:text-[hsl(25,15%,55%)]",
          "shadow-[inset_0_1px_2px_rgba(101,67,33,0.06)]",
          "focus-visible:outline-none focus-visible:border-[hsl(25,70%,50%)] focus-visible:ring-2 focus-visible:ring-[hsl(25,70%,50%)]/15",
          // Dark mode: Apple-style inset field
          "dark:rounded-xl",
          "dark:bg-[rgba(0,0,0,0.25)]",
          "dark:backdrop-blur-[20px]",
          "dark:border dark:border-[rgba(255,255,255,0.1)]",
          "dark:text-white/95 dark:placeholder:text-white/40",
          // Inset shadow for depth + subtle top highlight
          "dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(255,255,255,0.05)]",
          // Clean focus state - white ring, no colored glow
          "dark:focus-visible:outline-none",
          "dark:focus-visible:border-[rgba(255,255,255,0.25)]",
          "dark:focus-visible:ring-2 dark:focus-visible:ring-white/15",
          "dark:focus-visible:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_4px_rgba(255,255,255,0.05)]",
          "dark:focus-visible:bg-[rgba(0,0,0,0.3)]",
          // Hover state
          "dark:hover:border-[rgba(255,255,255,0.15)]",
          "dark:hover:bg-[rgba(0,0,0,0.28)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
