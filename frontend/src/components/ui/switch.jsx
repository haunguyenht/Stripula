import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

/**
 * Switch Component - Premium Dual Theme Design System
 * 
 * Light mode: Vintage Banking - Copper foil accent when checked
 * Dark mode: PREMIUM Liquid Aurora - Enhanced aurora indigo glow when checked
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
      // Dark mode: PREMIUM Liquid glass track with enhanced aurora glow
      "dark:bg-[hsl(0_0%_100%/0.12)]",
      "dark:data-[state=checked]:bg-[hsl(252,95%,62%)]",
      "dark:data-[state=checked]:shadow-[0_0_24px_rgba(139,92,246,0.55),0_0_48px_rgba(34,211,238,0.2),0_0_72px_rgba(139,92,246,0.15)]",
      "dark:focus-visible:ring-[hsl(252,95%,68%)/0.35]",
      "dark:focus-visible:ring-offset-[hsl(222,20%,6%)]",
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
        // Dark mode: PREMIUM Bright thumb with enhanced glow when checked
        "dark:bg-white",
        "dark:data-[state=checked]:shadow-[0_0_12px_rgba(255,255,255,0.5),0_0_24px_rgba(139,92,246,0.3)]"
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
