import * as React from "react"
import { cn } from "@/lib/utils.js"

/**
 * Textarea Component - Premium Liquid Aurora Design System
 * 
 * Dark mode features:
 * - PREMIUM Liquid glass background with blur(60px) saturation(200%)
 * - Enhanced aurora indigo focus ring with multi-layer neon glow
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
          // Dark mode: PREMIUM Liquid glass textarea with aurora focus
          "dark:rounded-lg",
          "dark:bg-[hsl(0_0%_100%/0.04)]",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[200%]",
          "dark:border dark:border-[hsl(0_0%_100%/0.1)]",
          "dark:text-white dark:placeholder:text-white/45",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.2)]",
          // PREMIUM Aurora focus state
          "dark:focus-visible:outline-none",
          "dark:focus-visible:border-[hsl(252,95%,68%)/0.6]",
          "dark:focus-visible:ring-2 dark:focus-visible:ring-[hsl(252,95%,68%)/0.25]",
          "dark:focus-visible:shadow-[0_0_24px_rgba(139,92,246,0.35),0_0_48px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]",
          // Hover state
          "dark:hover:border-[hsl(0_0%_100%/0.15)]",
          "dark:hover:bg-[hsl(0_0%_100%/0.055)]",
          "dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_6px_20px_rgba(0,0,0,0.25)]",
          // Custom scrollbar for dark mode
          "dark:scrollbar-thin dark:scrollbar-track-transparent",
          "dark:scrollbar-thumb-white/25 dark:hover:scrollbar-thumb-white/35",
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
