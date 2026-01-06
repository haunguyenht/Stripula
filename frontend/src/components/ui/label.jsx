import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils.js"

/**
 * Label Component - Liquid Aurora Design System
 * 
 * Light mode: Vintage Banking - Rich sepia ink
 * Dark mode: Liquid Aurora - Soft white with subtle cyan tint
 */

const labelVariants = cva(
  cn(
    "text-sm font-medium leading-none",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    // Light: Rich sepia ink
    "text-[hsl(25,35%,25%)]",
    // Dark: Aurora-tinted white
    "dark:text-white/85"
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
