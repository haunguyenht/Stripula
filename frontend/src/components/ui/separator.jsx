import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

/**
 * Separator Component - Liquid Aurora Design System
 * 
 * Light mode: Vintage Banking - Copper-tinted sepia border
 * Dark mode: Liquid glass with optional aurora gradient
 */

const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, variant = "default", ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        // Light: Copper-tinted sepia border
        "bg-[hsl(30,25%,82%)]",
        // Dark: Base glass border
        variant === "default" && "dark:bg-white/[0.08]",
        // Dark: Aurora gradient variant
        variant === "aurora" && orientation === "horizontal" && 
          "dark:bg-gradient-to-r dark:from-transparent dark:via-[var(--aurora-indigo)]/30 dark:to-transparent",
        variant === "aurora" && orientation === "vertical" && 
          "dark:bg-gradient-to-b dark:from-transparent dark:via-[var(--aurora-cyan)]/30 dark:to-transparent",
        // Dark: Glow variant with specular
        variant === "glow" && "dark:bg-white/[0.12] dark:shadow-[0_0_8px_rgba(139,92,246,0.2)]",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
