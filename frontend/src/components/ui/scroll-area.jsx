import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils.js"

/**
 * ScrollArea Component - Dual Theme Design System
 * 
 * LIGHT MODE: Vintage Banking
 * - Copper-tinted scrollbar with embossed effect
 * 
 * DARK MODE: PREMIUM Liquid Aurora
 * - Liquid glass scrollbar with enhanced aurora glow on hover
 */

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent p-[2px]",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent p-[2px]",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb 
        className={cn(
          "relative flex-1 rounded-full transition-all duration-300",
          // Light: Copper-tinted scrollbar with subtle embossed effect
          "bg-[hsl(25,40%,58%)]/35 hover:bg-[hsl(25,45%,50%)]/55",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
          // Dark: PREMIUM Liquid glass scrollbar with enhanced aurora glow
          "dark:bg-white/[0.18] dark:hover:bg-white/[0.28]",
          "dark:hover:shadow-[0_0_12px_rgba(139,92,246,0.5),0_0_6px_rgba(34,211,238,0.3)]"
        )} 
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
)
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
