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
        "z-50 overflow-hidden rounded-lg px-3 py-1.5 text-xs",
        // Light mode: Vintage banking - sepia ink on cream
        "bg-[hsl(25,35%,18%)] text-[hsl(38,45%,96%)]",
        "shadow-[0_4px_12px_hsla(25,35%,18%,0.20)]",
        // Dark mode: Liquid glass with aurora edge
        "dark:bg-[hsl(220,20%,12%)]/95",
        "dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]",
        "dark:border dark:border-[hsl(0_0%_100%/0.1)]",
        "dark:text-white",
        "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.1),0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
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
