import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils.js"

/**
 * Tooltip Component - Dual Theme Design System
 * 
 * Light mode: Vintage Banking - Sepia-tinted paper tooltip
 * Dark mode: Liquid Aurora - Glass with aurora edge glow
 */

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-lg px-3 py-1.5 text-xs font-medium",
        // Light mode: Vintage banking - sepia ink on cream paper
        "bg-gradient-to-b from-[hsl(25,30%,20%)] to-[hsl(25,35%,16%)]",
        "text-[hsl(38,50%,94%)]",
        "border border-[hsl(25,25%,28%)]",
        "shadow-[0_4px_16px_hsla(25,35%,15%,0.25),0_2px_6px_hsla(25,40%,10%,0.15)]",
        // Dark mode: PREMIUM Liquid glass with enhanced aurora edge
        "dark:bg-none dark:bg-[rgba(12,14,22,0.96)]",
        "dark:backdrop-blur-[80px] dark:backdrop-saturate-[220%]",
        "dark:border dark:border-[hsl(0_0%_100%/0.12)]",
        "dark:text-white",
        "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_0_24px_rgba(139,92,246,0.12),0_0_16px_rgba(34,211,238,0.08),0_12px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.1)]",
        // Animations
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  )
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
