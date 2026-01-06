import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils.js"

/**
 * Sheet Component - Liquid Aurora Design System
 * 
 * Dark mode features:
 * - Overlay: Deep cosmic blur with aurora gradient
 * - Content: Liquid glass panel with 60px blur
 * - Aurora edge glow on borders
 * - Specular highlight (top edge glow)
 * - Handle bar with subtle aurora tint
 */

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50",
      // Light mode: Vintage sepia overlay
      "bg-[hsl(25,30%,20%)]/40",
      // Dark mode: PREMIUM Deep cosmic with enhanced aurora tint
      "dark:bg-[hsl(222,20%,4%)]/85",
      // Backdrop blur - PREMIUM enhanced
      "backdrop-blur-sm dark:backdrop-blur-2xl",
      // Animations
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "duration-300",
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
          // Light mode: Vintage Banking
          "bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(38,45%,95%)] border-b border-[hsl(30,35%,75%)]/50",
          "shadow-[0_8px_32px_rgba(101,67,33,0.12)]",
          // Dark mode: Liquid Aurora glass (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(15,18,25,0.95)]",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]",
          "dark:border-b dark:border-[hsl(0_0%_100%/0.08)]",
          "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.06),0_8px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
          // Animations
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top"
        ),
        bottom: cn(
          "inset-x-0 bottom-0",
          "max-h-[90vh]",
          "p-6 pt-4",
          "rounded-t-2xl",
          // Light mode: Vintage Banking
          "bg-gradient-to-b from-[hsl(40,50%,97%)] to-[hsl(38,45%,95%)] border-t border-[hsl(30,35%,75%)]/50",
          "shadow-[0_-8px_32px_rgba(101,67,33,0.12)]",
          // Dark mode: PREMIUM Liquid Aurora glass (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(12,14,22,0.96)]",
          "dark:backdrop-blur-[100px] dark:backdrop-saturate-[220%]",
          "dark:border-t dark:border-[hsl(0_0%_100%/0.1)]",
          "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.1),0_-12px_64px_rgba(0,0,0,0.55),0_0_50px_-15px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]",
          // Animations
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
        ),
        left: cn(
          "inset-y-0 left-0",
          "h-full w-[85vw] sm:max-w-sm",
          "p-6",
          // Light mode: Vintage Banking
          "bg-gradient-to-r from-[hsl(40,50%,97%)] to-[hsl(38,45%,95%)] border-r border-[hsl(30,35%,75%)]/50",
          "shadow-[8px_0_32px_rgba(101,67,33,0.12)]",
          // Dark mode: Liquid Aurora glass (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(15,18,25,0.95)]",
          "dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]",
          "dark:border-r dark:border-[hsl(0_0%_100%/0.08)]",
          "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.06),8px_0_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
          // Animations
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
        ),
        right: cn(
          "inset-y-0 right-0",
          "h-full w-[85vw] sm:max-w-sm",
          "p-6",
          // Light mode: Vintage Banking
          "bg-gradient-to-l from-[hsl(40,50%,97%)] to-[hsl(38,45%,95%)] border-l border-[hsl(30,35%,75%)]/50",
          "shadow-[-8px_0_32px_rgba(101,67,33,0.12)]",
          // Dark mode: PREMIUM Liquid Aurora glass (bg-none resets gradient)
          "dark:bg-none dark:bg-[rgba(12,14,22,0.96)]",
          "dark:backdrop-blur-[100px] dark:backdrop-saturate-[220%]",
          "dark:border-l dark:border-[hsl(0_0%_100%/0.1)]",
          "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.1),-12px_0_64px_rgba(0,0,0,0.55),0_0_50px_-15px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]",
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
        {/* PREMIUM Aurora gradient overlay for dark mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(252,95%,68%)]/[0.05] via-transparent to-[hsl(185,100%,62%)]/[0.03]" />
        </div>
        
        {/* Handle bar for bottom sheet with enhanced aurora tint */}
        {side === "bottom" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-white/25 dark:shadow-[0_0_12px_rgba(139,92,246,0.3)]" />
          </div>
        )}
        
        {/* Content wrapper */}
        <div className="relative z-10 flex flex-col h-full">
          {children}
        </div>
        
        {/* Close button with aurora hover */}
        <SheetPrimitive.Close 
          className={cn(
            "absolute right-4 top-4 z-20",
            "flex items-center justify-center",
            "h-8 w-8 rounded-xl",
            // Light mode
            "text-neutral-400 hover:text-neutral-600",
            "bg-transparent hover:bg-neutral-100",
            // Dark mode: Aurora hover
            "dark:text-white/40 dark:hover:text-white/90",
            "dark:hover:bg-[hsl(250,90%,65%)/0.15]",
            "dark:hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]",
            // Focus ring
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(250,90%,65%)/0.4]",
            // Transition
            "transition-all duration-200",
            "disabled:pointer-events-none",
            // Adjust for bottom sheets
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
      "pb-4 border-b border-neutral-200/60 dark:border-white/[0.08]",
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
      "pt-4 mt-auto border-t border-neutral-200/60 dark:border-white/[0.08]",
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

const SheetBody = ({ className, ...props }) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto py-4",
      "-mx-6 px-6",
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
