import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils.js"

/**
 * Slider Component - Liquid Aurora Design System
 * 
 * Dark mode features:
 * - Track: Liquid glass with subtle aurora gradient
 * - Range: Aurora indigo gradient with neon glow
 * - Thumb: Bright with neon shadow, aurora ring on focus
 */

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    {/* Track */}
    <SliderPrimitive.Track className={cn(
      "relative w-full grow overflow-hidden rounded-full",
      // Light mode: Vintage Banking
      "h-2 bg-[hsl(30,25%,82%)]",
      // Dark mode: Liquid glass track
      "dark:h-2 dark:bg-[hsl(0_0%_100%/0.08)]",
      "dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
    )}>
      {/* Range (filled portion) */}
      <SliderPrimitive.Range className={cn(
        "absolute h-full rounded-full",
        // Light mode: Vintage copper
        "bg-[hsl(25,75%,45%)]",
        // Dark mode: Aurora gradient with glow
        "dark:bg-gradient-to-r dark:from-[hsl(250,90%,60%)] dark:to-[hsl(210,100%,60%)]",
        "dark:shadow-[0_0_12px_rgba(139,92,246,0.4)]"
      )} />
    </SliderPrimitive.Track>
    {/* Thumb */}
    <SliderPrimitive.Thumb className={cn(
      "block rounded-full transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Light mode: Vintage Banking
      "h-5 w-5 bg-[hsl(38,45%,98%)] border-2 border-[hsl(25,75%,45%)]",
      "shadow-[0_2px_6px_rgba(139,90,43,0.25)]",
      "hover:border-[hsl(25,60%,40%)]",
      "focus-visible:ring-[hsl(25,75%,45%)]/20",
      // Dark mode: Bright thumb with neon glow
      "dark:h-5 dark:w-5 dark:bg-white dark:border-2 dark:border-[hsl(250,90%,60%)]",
      "dark:shadow-[0_0_12px_rgba(139,92,246,0.5),0_2px_8px_rgba(0,0,0,0.3)]",
      "dark:hover:border-[hsl(250,90%,70%)]",
      "dark:hover:shadow-[0_0_16px_rgba(139,92,246,0.6),0_2px_10px_rgba(0,0,0,0.4)]",
      "dark:focus-visible:ring-[hsl(250,90%,65%)/0.4]"
    )} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
