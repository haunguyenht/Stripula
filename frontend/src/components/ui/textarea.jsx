import * as React from "react"
import { cn } from "@/lib/utils.js"

/**
 * Textarea Component - Clean Minimal Style
 * 
 * Designed to be embedded in containers that provide their own styling.
 * Base styles are minimal to avoid conflicts when used inside styled wrappers.
 */

const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-[60px] w-full px-3.5 py-2.5 text-sm transition-all duration-200 ease-out",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Light mode: Vintage Banking - cream parchment textarea
          "rounded-xl bg-[hsl(40,50%,97%)] border border-[hsl(30,30%,78%)]",
          "text-[hsl(25,35%,20%)] placeholder:text-[hsl(25,15%,55%)]",
          "shadow-[inset_0_1px_2px_rgba(101,67,33,0.06)]",
          "focus-visible:outline-none focus-visible:border-[hsl(25,70%,50%)] focus-visible:ring-2 focus-visible:ring-[hsl(25,70%,50%)]/15",
          // Dark mode: Clean minimal style
          "dark:rounded-xl",
          "dark:bg-white/[0.03]",
          "dark:border dark:border-white/10",
          "dark:text-white/90 dark:placeholder:text-white/40",
          "dark:shadow-none",
          // Focus state
          "dark:focus-visible:outline-none",
          "dark:focus-visible:border-white/20",
          "dark:focus-visible:ring-2 dark:focus-visible:ring-white/10",
          // Hover state
          "dark:hover:border-white/15",
          // Custom scrollbar for dark mode
          "dark:scrollbar-thin dark:scrollbar-track-transparent",
          "dark:scrollbar-thumb-white/20 dark:hover:scrollbar-thumb-white/30",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
