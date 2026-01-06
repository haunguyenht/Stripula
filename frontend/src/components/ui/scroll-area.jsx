import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils.js"

/**
 * ScrollArea Component - Liquid Aurora Design System
 * 
 * Light mode: Vintage Banking - Copper-tinted scrollbar
 * Dark mode: Liquid glass scrollbar with aurora glow on hover
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
          // Light: Copper-tinted scrollbar
          "bg-[hsl(25,35%,60%)]/30 hover:bg-[hsl(25,35%,50%)]/50",
          // Dark: Liquid glass scrollbar with aurora glow
          "dark:bg-white/[0.15] dark:hover:bg-white/[0.25]",
          "dark:hover:shadow-[0_0_8px_rgba(139,92,246,0.4)]"
        )} 
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
)
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
