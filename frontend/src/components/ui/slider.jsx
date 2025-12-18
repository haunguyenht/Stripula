import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils.js"

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
      // Light mode: OrangeAI warm track
      "h-2 bg-[rgb(237,234,233)]",
      // Dark mode: OPUX track
      "dark:h-1.5 dark:bg-white/10"
    )}>
      {/* Range (filled portion) */}
      <SliderPrimitive.Range className={cn(
        "absolute h-full rounded-full",
        // Light mode: OrangeAI orange range
        "bg-[rgb(255,64,23)]",
        // Dark mode: OPUX primary range
        "dark:bg-primary"
      )} />
    </SliderPrimitive.Track>
    {/* Thumb */}
    <SliderPrimitive.Thumb className={cn(
      "block rounded-full transition-colors",
      "focus-visible:outline-none focus-visible:ring-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Light mode: OrangeAI warm thumb
      "h-5 w-5 bg-white border-2 border-[rgb(255,64,23)]",
      "shadow-[0_2px_4px_rgba(0,0,0,0.15)]",
      "hover:border-[rgb(255,80,40)]",
      "focus-visible:ring-[rgb(255,64,23)]/20",
      // Dark mode: OPUX thumb
      "dark:h-4 dark:w-4 dark:border dark:border-border dark:bg-card dark:shadow-subtle",
      "dark:hover:border-primary/50",
      "dark:focus-visible:ring-primary/20"
    )} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
