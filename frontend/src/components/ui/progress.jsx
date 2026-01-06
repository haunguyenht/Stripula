import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

/**
 * Progress Component - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking
 * - Cream parchment track with embossed effect
 * - Copper foil fill with metallic shine
 * 
 * DARK MODE: PREMIUM Liquid Aurora
 * - Liquid glass track with aurora tint
 * - Multi-color aurora gradient fill with enhanced glow
 */

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full",
      // Light mode: Vintage banking - cream parchment track with embossed effect
      "bg-gradient-to-b from-[hsl(30,28%,88%)] to-[hsl(30,25%,84%)]",
      "shadow-[inset_0_1px_2px_rgba(101,67,33,0.1),inset_0_-1px_0_rgba(255,255,255,0.5)]",
      // Dark mode: PREMIUM Liquid glass track with aurora tint
      "dark:bg-none dark:bg-[rgba(15,18,25,0.6)]",
      "dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(139,92,246,0.08)]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-300 ease-out rounded-full",
        // Light mode: Vintage banking - polished copper gradient
        "bg-gradient-to-r from-[hsl(25,70%,48%)] via-[hsl(28,75%,52%)] to-[hsl(25,65%,45%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(101,67,33,0.2)]",
        // Dark mode: PREMIUM Aurora gradient with enhanced multi-layer glow
        "dark:bg-gradient-to-r dark:from-[hsl(250,90%,60%)] dark:via-[hsl(210,100%,60%)] dark:to-[hsl(185,100%,55%)]",
        "dark:shadow-[0_0_20px_rgba(139,92,246,0.5),0_0_40px_rgba(34,211,238,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
