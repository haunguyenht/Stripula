import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Dialog Component - Redesigned for OrangeAI/OPUX Design System
 * 
 * Light mode: Clean white with warm shadows and subtle borders
 * Dark mode: Glass morphism with gradient overlays and depth
 */

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      // Light mode: Warm, slightly tinted overlay
      "bg-neutral-900/40",
      // Dark mode: Deeper overlay with blur
      "dark:bg-black/70",
      // Backdrop blur for both modes
      "backdrop-blur-sm dark:backdrop-blur-md",
      // Animations
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "duration-200",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, hideCloseButton = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Positioning
        "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
        // Sizing
        "w-[calc(100%-2rem)] max-w-lg",
        // Layout
        "grid gap-5",
        // Padding
        "p-6",
        // Border radius - rounded for modern feel
        "rounded-2xl",
        
        // ===== LIGHT MODE (OrangeAI) =====
        "bg-white",
        "border border-neutral-200/80",
        // Layered shadow for depth
        "shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.06),0_24px_48px_rgba(0,0,0,0.04)]",
        
        // ===== DARK MODE (OPUX Glass) =====
        "dark:bg-[#1a1d24]/95",
        "dark:border dark:border-white/[0.08]",
        // Glass effect with inner glow
        "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_80px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "dark:backdrop-blur-xl",
        
        // ===== ANIMATIONS =====
        "duration-300 ease-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-[0.96] data-[state=open]:zoom-in-[0.96]",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        
        className
      )}
      {...props}
    >
      {/* Subtle gradient overlay for dark mode depth */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none hidden dark:block">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Close button */}
      {!hideCloseButton && (
        <DialogPrimitive.Close 
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
            // Ring on focus
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            // Transitions
            "transition-all duration-150",
            "disabled:pointer-events-none"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col gap-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3",
      "pt-3",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      // Typography - slightly larger, tighter tracking
      "text-lg font-semibold leading-tight tracking-[-0.01em]",
      // Light mode
      "text-neutral-900",
      // Dark mode
      "dark:text-white",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      // Typography
      "text-[14px] leading-relaxed",
      // Light mode
      "text-neutral-500",
      // Dark mode
      "dark:text-white/60",
      className
    )}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

/**
 * DialogBody - Optional body wrapper for consistent spacing
 */
const DialogBody = ({ className, ...props }) => (
  <div
    className={cn(
      "text-[14px] leading-relaxed",
      "text-neutral-600 dark:text-white/70",
      className
    )}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

/**
 * DialogSection - Card-like section within dialog for grouping content
 */
const DialogSection = ({ className, variant = "default", ...props }) => (
  <div
    className={cn(
      "rounded-xl p-4",
      variant === "default" && [
        "bg-neutral-50 dark:bg-white/[0.03]",
        "border border-neutral-200/60 dark:border-white/[0.06]",
      ],
      variant === "highlight" && [
        "bg-primary/5 dark:bg-primary/10",
        "border border-primary/20 dark:border-primary/20",
      ],
      variant === "warning" && [
        "bg-amber-50 dark:bg-amber-500/10",
        "border border-amber-200 dark:border-amber-500/20",
      ],
      variant === "danger" && [
        "bg-red-50 dark:bg-red-500/10",
        "border border-red-200 dark:border-red-500/20",
      ],
      variant === "success" && [
        "bg-emerald-50 dark:bg-emerald-500/10",
        "border border-emerald-200 dark:border-emerald-500/20",
      ],
      className
    )}
    {...props}
  />
)
DialogSection.displayName = "DialogSection"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogSection,
}
