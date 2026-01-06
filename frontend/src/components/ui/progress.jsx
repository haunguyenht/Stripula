import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

/**
 * Progress Component - Dual Theme Design System
 * 
 * Light mode: Vintage Banking - Copper fill on cream track
 * Dark mode: Liquid Aurora - Gradient with animated glow
 */

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full",
      // Light mode: Vintage banking - cream track
      "bg-[hsl(30,25%,85%)]",
      // Dark mode: Liquid glass track
      "dark:bg-[hsl(0_0%_100%/0.08)]",
      "dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-300 ease-out",
        // Light mode: Vintage banking - copper gradient
        "bg-gradient-to-r from-[hsl(25,75%,45%)] to-[hsl(25,65%,55%)]",
        // Dark mode: Aurora gradient with glow
        "dark:bg-gradient-to-r dark:from-[hsl(250,90%,60%)] dark:via-[hsl(220,100%,60%)] dark:to-[hsl(185,100%,55%)]",
        "dark:shadow-[0_0_16px_rgba(139,92,246,0.4),0_0_32px_rgba(34,211,238,0.2)]"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
