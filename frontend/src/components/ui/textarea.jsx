import * as React from "react"
import { cn } from "@/lib/utils.js"

/**
 * Textarea Component - Liquid Aurora Design System
 * 
 * Dark mode features:
 * - Liquid glass background with blur(40px) saturation(180%)
 * - Aurora indigo focus ring with neon glow
 * - Specular highlight (inset top edge)
 * - Custom scrollbar styling
 */

const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-[60px] w-full px-3 py-2 text-sm transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Light mode: Vintage Banking - cream parchment textarea
          "rounded-lg bg-[hsl(40,50%,97%)] border border-[hsl(30,30%,78%)]",
          "text-[hsl(25,35%,20%)] placeholder:text-[hsl(25,15%,55%)]",
          "shadow-[inset_0_1px_2px_rgba(101,67,33,0.06)]",
          "focus-visible:outline-none focus-visible:border-[hsl(25,70%,50%)] focus-visible:ring-2 focus-visible:ring-[hsl(25,70%,50%)]/15",
          // Dark mode: Liquid glass textarea with aurora focus
          "dark:rounded-lg",
          "dark:bg-[hsl(0_0%_100%/0.03)]",
          "dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]",
          "dark:border dark:border-[hsl(0_0%_100%/0.08)]",
          "dark:text-white dark:placeholder:text-white/40",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
          // Aurora focus state
          "dark:focus-visible:outline-none",
          "dark:focus-visible:border-[hsl(250,90%,65%)/0.5]",
          "dark:focus-visible:ring-2 dark:focus-visible:ring-[hsl(250,90%,65%)/0.2]",
          "dark:focus-visible:shadow-[0_0_16px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]",
          // Hover state
          "dark:hover:border-[hsl(0_0%_100%/0.12)]",
          "dark:hover:bg-[hsl(0_0%_100%/0.04)]",
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
