import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

/**
 * Switch Component - Dual Theme Design System
 * 
 * Light mode: Vintage Banking - Copper foil accent when checked
 * Dark mode: Liquid Aurora - Aurora indigo glow when checked
 */

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-all duration-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "h-5 w-9 border-2 border-transparent",
      // Light mode: Vintage banking - copper accent when checked
      "bg-[hsl(30,25%,82%)] data-[state=checked]:bg-[hsl(25,75%,45%)]",
      "focus-visible:ring-[hsl(25,75%,45%)]/20 focus-visible:ring-offset-[hsl(38,45%,96%)]",
      // Dark mode: Liquid glass track with aurora glow
      "dark:bg-[hsl(0_0%_100%/0.1)]",
      "dark:data-[state=checked]:bg-[hsl(250,90%,60%)]",
      "dark:data-[state=checked]:shadow-[0_0_16px_rgba(139,92,246,0.4),0_0_32px_rgba(139,92,246,0.2)]",
      "dark:focus-visible:ring-[hsl(250,90%,65%)/0.3]",
      "dark:focus-visible:ring-offset-[hsl(220,18%,7%)]",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block rounded-full shadow-lg ring-0 transition-all duration-300",
        "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        // Light mode: Cream thumb with subtle shadow
        "bg-[hsl(38,45%,98%)]",
        "shadow-[0_1px_3px_hsla(25,35%,18%,0.15)]",
        // Dark mode: Bright thumb with glow when checked
        "dark:bg-white",
        "dark:data-[state=checked]:shadow-[0_0_8px_rgba(255,255,255,0.4)]"
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
