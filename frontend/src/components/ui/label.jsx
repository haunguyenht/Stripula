import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils.js"

/**
 * Label Component - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking
 * - Rich sepia ink with subtle embossed text shadow
 * 
 * DARK MODE: PREMIUM Liquid Aurora
 * - Soft white with subtle aurora tint
 */

const labelVariants = cva(
  cn(
    "text-sm font-medium leading-none",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    // Light: Rich sepia ink with embossed effect
    "text-[hsl(25,40%,28%)]",
    "[text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
    // Dark: PREMIUM Aurora-tinted white (reset text-shadow)
    "dark:text-white/90",
    "dark:[text-shadow:none]"
  )
)

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
