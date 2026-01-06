import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Dialog Component - Dual Theme Design System
 * 
 * Light Theme (Vintage Banking):
 * - Cream parchment background with aged paper texture
 * - Copper foil accents and double-rule certificate borders
 * - Embossed text shadows and wax seal effects
 * - Treasury seal corner ornaments
 * 
 * Dark Theme (Liquid Aurora):
 * - Deep cosmic blur with aurora gradient overlay
 * - Liquid glass panel with specular highlights
 * - Aurora border glow on edges
 * - Smooth spring-like animations
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
      // Light mode: Warm sepia-tinted overlay like aged bank vault
      "bg-[hsl(25,25%,15%)]/50",
      // Dark mode: Deep cosmic overlay with aurora tint
      "dark:bg-[hsl(220,18%,5%)]/80",
      // Backdrop blur for both modes
      "backdrop-blur-sm dark:backdrop-blur-xl",
      // Animations
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "duration-300",
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
        
        // ===== LIGHT MODE (Vintage Banking Certificate) =====
        "bg-gradient-to-b from-[hsl(40,50%,97%)] via-[hsl(38,45%,95%)] to-[hsl(35,40%,93%)]",
        // Double-rule certificate border
        "border-2 border-[hsl(30,35%,72%)]",
        // Layered shadows: inner certificate rules + outer bank vault shadow
        "shadow-[inset_0_0_0_3px_hsl(38,45%,96%),inset_0_0_0_4px_hsl(30,30%,78%),0_16px_64px_rgba(101,67,33,0.18),0_4px_16px_rgba(101,67,33,0.12)]",
        
        // ===== DARK MODE (Liquid Aurora Glass) - bg-none resets gradient =====
        "dark:bg-none dark:bg-[rgba(15,18,25,0.95)]",
        "dark:backdrop-blur-[60px] dark:backdrop-saturate-[180%]",
        "dark:border dark:border-[hsl(0_0%_100%/0.08)]",
        // Multi-layer shadow with aurora edge glow
        "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_0_40px_rgba(139,92,246,0.08),0_24px_80px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]",
        
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
      {/* Paper texture overlay for light mode */}
      <div 
        className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none dark:hidden opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px'
        }}
      />
      
      {/* Corner ornaments - vintage certificate style (light mode only) */}
      <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-[hsl(25,60%,55%)]/50 rounded-tl-sm pointer-events-none dark:hidden" />
      <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-[hsl(25,60%,55%)]/50 rounded-tr-sm pointer-events-none dark:hidden" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-[hsl(25,60%,55%)]/50 rounded-bl-sm pointer-events-none dark:hidden" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-[hsl(25,60%,55%)]/50 rounded-br-sm pointer-events-none dark:hidden" />
      
      {/* Aurora gradient overlay for dark mode */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none hidden dark:block">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(250,90%,65%)]/[0.03] via-transparent to-[hsl(185,100%,60%)]/[0.02]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Close button - wax seal style in light, aurora hover in dark */}
      {!hideCloseButton && (
        <DialogPrimitive.Close 
          className={cn(
            "absolute right-4 top-4 z-20",
            "flex items-center justify-center",
            "h-8 w-8 rounded-xl",
            // Light mode: Vintage Banking wax seal hover
            "text-[hsl(25,25%,50%)] hover:text-[hsl(25,40%,30%)]",
            "bg-transparent hover:bg-gradient-to-b hover:from-[hsl(38,40%,94%)] hover:to-[hsl(35,35%,90%)]",
            "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_3px_rgba(101,67,33,0.15)]",
            // Dark mode: Aurora hover glow
            "dark:text-white/40 dark:hover:text-white/90",
            "dark:hover:bg-[hsl(250,90%,65%)/0.15]",
            "dark:hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]",
            // Ring on focus
            "focus:outline-none focus-visible:ring-2",
            "focus-visible:ring-[hsl(25,60%,50%)]/40 dark:focus-visible:ring-[hsl(250,90%,65%)/0.4]",
            // Transitions
            "transition-all duration-200",
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
      "text-lg font-semibold leading-tight tracking-[-0.01em]",
      // Light mode: Vintage Banking
      "text-[hsl(25,35%,20%)]",
      // Dark mode: Bright white
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
      "text-[14px] leading-relaxed",
      // Light mode: Vintage Banking
      "text-[hsl(25,20%,45%)]",
      // Dark mode
      "dark:text-white/60",
      className
    )}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

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

const DialogSection = ({ className, variant = "default", ...props }) => (
  <div
    className={cn(
      "rounded-xl p-4",
      variant === "default" && [
        // Light: aged ledger paper inset
        "bg-gradient-to-b from-[hsl(38,35%,94%)] to-[hsl(35,30%,91%)]",
        "border border-[hsl(30,25%,78%)]",
        "shadow-[inset_0_1px_3px_rgba(101,67,33,0.08)]",
        // Dark
        "dark:bg-white/[0.03] dark:from-transparent dark:to-transparent",
        "dark:border-white/[0.06] dark:shadow-none",
      ],
      variant === "highlight" && [
        // Light: copper highlight
        "bg-gradient-to-b from-[hsl(35,55%,92%)] to-[hsl(30,45%,88%)]",
        "border border-[hsl(25,55%,65%)]/40",
        "shadow-[inset_0_1px_3px_rgba(166,100,50,0.1)]",
        // Dark
        "dark:bg-[hsl(250,90%,65%)/0.08] dark:from-transparent dark:to-transparent",
        "dark:border-[hsl(250,90%,65%)/0.2] dark:shadow-none",
      ],
      variant === "warning" && [
        // Light: aged warning parchment
        "bg-gradient-to-b from-[hsl(45,70%,92%)] to-[hsl(40,60%,88%)]",
        "border border-[hsl(35,60%,60%)]/50",
        "shadow-[inset_0_1px_3px_rgba(180,130,50,0.1)]",
        // Dark
        "dark:bg-amber-500/10 dark:from-transparent dark:to-transparent",
        "dark:border-amber-500/25 dark:shadow-none",
      ],
      variant === "danger" && [
        // Light: burgundy ink warning
        "bg-gradient-to-b from-[hsl(355,50%,95%)] to-[hsl(355,45%,92%)]",
        "border border-[hsl(355,40%,65%)]/50",
        "shadow-[inset_0_1px_3px_rgba(150,50,50,0.08)]",
        // Dark
        "dark:bg-red-500/10 dark:from-transparent dark:to-transparent",
        "dark:border-red-500/25 dark:shadow-none",
      ],
      variant === "success" && [
        // Light: treasury seal green
        "bg-gradient-to-b from-[hsl(145,40%,92%)] to-[hsl(140,35%,88%)]",
        "border border-[hsl(145,35%,55%)]/40",
        "shadow-[inset_0_1px_3px_rgba(50,130,80,0.08)]",
        // Dark
        "dark:bg-emerald-500/10 dark:from-transparent dark:to-transparent",
        "dark:border-emerald-500/25 dark:shadow-none",
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
