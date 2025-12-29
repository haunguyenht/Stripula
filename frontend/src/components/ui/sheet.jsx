import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils.js"

/**
 * Sheet Component - Redesigned for OrangeAI/OPUX Design System
 * 
 * Mobile drawer/slide-out panel with glass morphism effects
 * Light mode: Clean white with subtle shadows
 * Dark mode: Glass morphism with gradient overlays
 */

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50",
      // Light mode overlay
      "bg-neutral-900/40",
      // Dark mode overlay
      "dark:bg-black/70",
      // Backdrop blur
      "backdrop-blur-sm dark:backdrop-blur-md",
      // Animations
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  cn(
    "fixed z-50 flex flex-col gap-4",
    "transition-all ease-out",
    "data-[state=closed]:duration-300 data-[state=open]:duration-400",
    "data-[state=open]:animate-in data-[state=closed]:animate-out"
  ),
  {
    variants: {
      side: {
        top: cn(
          "inset-x-0 top-0",
          "max-h-[85vh]",
          "p-6 pb-8",
          "rounded-b-2xl",
          // Light mode
          "bg-white border-b border-neutral-200/80",
          "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
          // Dark mode
          "dark:bg-[#1a1d24]/95 dark:border-white/[0.08]",
          "dark:shadow-[0_8px_48px_rgba(0,0,0,0.5)]",
          "dark:backdrop-blur-xl",
          // Animations
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top"
        ),
        bottom: cn(
          "inset-x-0 bottom-0",
          "max-h-[90vh]",
          "p-6 pt-4",
          "rounded-t-2xl",
          // Light mode
          "bg-white border-t border-neutral-200/80",
          "shadow-[0_-8px_32px_rgba(0,0,0,0.12)]",
          // Dark mode
          "dark:bg-[#1a1d24]/95 dark:border-white/[0.08]",
          "dark:shadow-[0_-8px_48px_rgba(0,0,0,0.5)]",
          "dark:backdrop-blur-xl",
          // Animations
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
        ),
        left: cn(
          "inset-y-0 left-0",
          "h-full w-[85vw] sm:max-w-sm",
          "p-6",
          // Light mode
          "bg-white border-r border-neutral-200/80",
          "shadow-[8px_0_32px_rgba(0,0,0,0.12)]",
          // Dark mode
          "dark:bg-[#1a1d24]/95 dark:border-white/[0.08]",
          "dark:shadow-[8px_0_48px_rgba(0,0,0,0.5)]",
          "dark:backdrop-blur-xl",
          // Animations
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
        ),
        right: cn(
          "inset-y-0 right-0",
          "h-full w-[85vw] sm:max-w-sm",
          "p-6",
          // Light mode
          "bg-white border-l border-neutral-200/80",
          "shadow-[-8px_0_32px_rgba(0,0,0,0.12)]",
          // Dark mode
          "dark:bg-[#1a1d24]/95 dark:border-white/[0.08]",
          "dark:shadow-[-8px_0_48px_rgba(0,0,0,0.5)]",
          "dark:backdrop-blur-xl",
          // Animations
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        ),
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

const SheetContent = React.forwardRef(
  ({ side = "right", className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {/* Subtle gradient overlay for dark mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent" />
        </div>
        
        {/* Handle bar for bottom sheet (mobile) */}
        {side === "bottom" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-white/20" />
          </div>
        )}
        
        {/* Content wrapper */}
        <div className="relative z-10 flex flex-col h-full">
          {children}
        </div>
        
        {/* Close button */}
        <SheetPrimitive.Close 
          className={cn(
            "absolute right-4 top-4 z-20",
            "flex items-center justify-center",
            "h-8 w-8 rounded-xl",
            // Light mode
            "text-neutral-400 hover:text-neutral-600",
            "bg-transparent hover:bg-neutral-100",
            // Dark mode
            "dark:text-white/40 dark:hover:text-white/90",
            "dark:hover:bg-white/10",
            // Focus ring
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            // Transition
            "transition-all duration-150",
            "disabled:pointer-events-none",
            // Hide for bottom sheets (they have handle)
            side === "bottom" && "top-3"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
)
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col gap-2 text-center sm:text-left",
      "pb-4 border-b border-neutral-200/60 dark:border-white/[0.06]",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3",
      "pt-4 mt-auto border-t border-neutral-200/60 dark:border-white/[0.06]",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-[-0.01em]",
      "text-neutral-900 dark:text-white",
      className
    )}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn(
      "text-[14px] leading-relaxed",
      "text-neutral-500 dark:text-white/60",
      className
    )}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

/**
 * SheetBody - Scrollable content area
 */
const SheetBody = ({ className, ...props }) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto py-4",
      "-mx-6 px-6", // Extend to edges for proper scrollbar position
      "text-[14px] leading-relaxed",
      "text-neutral-600 dark:text-white/70",
      className
    )}
    {...props}
  />
)
SheetBody.displayName = "SheetBody"

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
