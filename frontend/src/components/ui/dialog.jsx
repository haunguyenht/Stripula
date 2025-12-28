import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Dialog Component - Redesigned
 * 
 * Modern dialog with improved typography, glassmorphism,
 * and smooth animations for both light and dark themes.
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
      // Light mode overlay
      "bg-black/40",
      // Dark mode overlay with more blur
      "dark:bg-black/60",
      // Backdrop blur
      "backdrop-blur-[6px]",
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
        // Border radius
        "rounded-2xl",
        
        // ===== LIGHT MODE =====
        "bg-white",
        "border border-black/[0.06]",
        "shadow-[0_16px_70px_-12px_rgba(0,0,0,0.25),0_4px_20px_-4px_rgba(0,0,0,0.1)]",
        
        // ===== DARK MODE (Glassmorphism) =====
        "dark:bg-[linear-gradient(145deg,rgba(38,38,42,0.92),rgba(26,26,30,0.95))]",
        "dark:border-white/[0.08]",
        "dark:shadow-[0_24px_80px_-16px_rgba(0,0,0,0.6),0_8px_32px_-8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "dark:backdrop-blur-xl dark:backdrop-saturate-150",
        
        // ===== ANIMATIONS =====
        "duration-300 ease-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97]",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[49%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[49%]",
        
        className
      )}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close 
          className={cn(
            "absolute right-4 top-4",
            "rounded-lg p-1.5",
            // Light mode
            "text-neutral-400 hover:text-neutral-600",
            "hover:bg-neutral-100",
            // Dark mode
            "dark:text-white/40 dark:hover:text-white/80",
            "dark:hover:bg-white/10",
            // Transitions
            "transition-all duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
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
      "pt-2",
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
      // Typography
      "text-[17px] font-semibold leading-tight tracking-[-0.01em]",
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
      "dark:text-white/55",
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
}
