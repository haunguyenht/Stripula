import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "h-5 w-9 border-2 border-transparent",
      "bg-[rgb(237,234,233)] data-[state=checked]:bg-[rgb(255,64,23)]",
      "focus-visible:ring-[rgb(255,64,23)]/20 focus-visible:ring-offset-background",
      "dark:bg-white/10 dark:data-[state=checked]:bg-primary",
      "dark:focus-visible:ring-primary/20",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform",
        "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        "dark:bg-card dark:shadow-subtle"
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
