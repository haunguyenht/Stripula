import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

/**
 * Separator Component - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking
 * - Copper-tinted sepia border with subtle embossed effect
 * 
 * DARK MODE: PREMIUM Liquid Aurora
 * - Liquid glass with optional aurora gradient variants
 */

const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, variant = "default", ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        // Light: Copper-tinted sepia border with subtle embossed effect
        "bg-gradient-to-r from-[hsl(30,28%,84%)] via-[hsl(30,25%,80%)] to-[hsl(30,28%,84%)]",
        "shadow-[0_1px_0_rgba(255,255,255,0.4)]",
        // Dark: Base glass border
        variant === "default" && "dark:bg-none dark:bg-white/[0.1]",
        // Dark: PREMIUM Aurora gradient variant
        variant === "aurora" && orientation === "horizontal" && 
          "dark:bg-none dark:bg-gradient-to-r dark:from-transparent dark:via-[hsl(250,90%,65%)]/35 dark:to-transparent",
        variant === "aurora" && orientation === "vertical" && 
          "dark:bg-none dark:bg-gradient-to-b dark:from-transparent dark:via-[hsl(185,100%,55%)]/35 dark:to-transparent",
        // Dark: PREMIUM Glow variant with aurora specular
        variant === "glow" && "dark:bg-none dark:bg-white/[0.15] dark:shadow-[0_0_12px_rgba(139,92,246,0.3),0_0_6px_rgba(34,211,238,0.2)]",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
