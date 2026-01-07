import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

/**
 * Dialog Component - Premium Dual Theme Design System
 * 
 * ═══════════════════════════════════════════════════════════════════
 * LIGHT THEME: "Art Deco Treasury"
 * Inspired by 1920s bank vaults and luxury certificates
 * - Warm ivory/cream canvas with subtle linen texture
 * - Gold leaf accents with geometric art deco patterns
 * - Elegant serif typography feel
 * - Decorative corner flourishes
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ═══════════════════════════════════════════════════════════════════
 * DARK THEME: "Obsidian Nebula"
 * Deep space glass morphism with cosmic aurora effects
 * - Ultra-deep obsidian base with star-field depth
 * - Prismatic aurora borders that shift colors
 * - Floating particle effects and nebula gradients
 * - Crystalline glass with extreme depth
 * ═══════════════════════════════════════════════════════════════════
 */

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

// ═══════════════════════════════════════════════════════════════════
// OVERLAY - The backdrop behind the dialog
// ═══════════════════════════════════════════════════════════════════
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      // Light: Warm sepia vignette - like looking into a vault
      "bg-gradient-radial from-[hsl(35,30%,85%)]/60 via-[hsl(30,25%,40%)]/70 to-[hsl(25,20%,15%)]/85",
      // Dark: Deep cosmic void with subtle purple tint
      "dark:from-[hsl(260,30%,8%)]/70 dark:via-[hsl(250,25%,5%)]/85 dark:to-[hsl(240,20%,2%)]/95",
      // Enhanced backdrop blur
      "backdrop-blur-md dark:backdrop-blur-xl",
      // Animations
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "duration-400",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// ═══════════════════════════════════════════════════════════════════
// CONTENT - The main dialog panel
// ═══════════════════════════════════════════════════════════════════
const DialogContent = React.forwardRef(({ 
  className, 
  children, 
  hideCloseButton = false,
  size = "default",
  ...props 
}, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      aria-describedby={undefined}
      className={cn(
        // ═════ POSITIONING ═════
        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
        
        // ═════ RESPONSIVE SIZING ═════
        "w-[calc(100vw-1.5rem)] xs:w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)]",
        size === "sm" && "max-w-sm",
        size === "default" && "max-w-md sm:max-w-lg",
        size === "lg" && "max-w-lg sm:max-w-xl md:max-w-2xl",
        size === "xl" && "max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl",
        size === "full" && "max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)]",
        
        // ═════ MAX HEIGHT & SCROLL ═════
        "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]",
        "overflow-hidden",
        
        // ═════ LAYOUT ═════
        "grid",
        
        // ═════ PADDING (responsive) ═════
        "p-4 xs:p-5 sm:p-6 md:p-8",
        
        // ═════ BORDER RADIUS (responsive) ═════
        "rounded-2xl sm:rounded-3xl",
        
        // ═══════════════════════════════════════════════════════════
        // LIGHT MODE: Art Deco Treasury
        // ═══════════════════════════════════════════════════════════
        // Base: Warm ivory canvas
        "bg-gradient-to-b from-[hsl(42,45%,97%)] via-[hsl(40,40%,95%)] to-[hsl(38,35%,92%)]",
        // Art deco gold border with double-line effect
        "border-2 border-[hsl(38,50%,65%)]",
        "ring-1 ring-inset ring-[hsl(42,60%,85%)]",
        // Layered shadow: inner glow + outer vault shadow
        "shadow-[inset_0_2px_0_rgba(255,248,230,0.8),inset_0_-2px_4px_rgba(139,109,66,0.08),0_25px_80px_-12px_rgba(80,50,20,0.35),0_12px_30px_-8px_rgba(100,70,30,0.2)]",
        
        // ═══════════════════════════════════════════════════════════
        // DARK MODE: Obsidian Nebula
        // ═══════════════════════════════════════════════════════════
        // Reset gradient, deep obsidian glass
        "dark:bg-none dark:bg-[rgba(8,10,18,0.97)]",
        // Extreme glass effect
        "dark:backdrop-blur-[120px] dark:backdrop-saturate-[200%]",
        // Prismatic aurora border
        "dark:border-0 dark:ring-1 dark:ring-white/[0.08]",
        // Multi-layer cosmic shadow with aurora glow
        "dark:shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_0_80px_-10px_rgba(139,92,246,0.2),0_0_50px_-5px_rgba(34,211,238,0.15),0_0_30px_-5px_rgba(236,72,153,0.1),0_50px_120px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(139,92,246,0.1)]",
        
        // ═════ ANIMATIONS ═════
        "duration-400 ease-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        
        className
      )}
      {...props}
    >
      {/* ═══════════════════════════════════════════════════════════
          LIGHT MODE DECORATIONS
          ═══════════════════════════════════════════════════════════ */}
      
      {/* Linen texture overlay */}
      <div 
        className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none dark:hidden opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}
      />
      
      {/* Art Deco corner flourishes - responsive sizing */}
      <div className="absolute top-2 left-2 xs:top-3 xs:left-3 sm:top-4 sm:left-4 pointer-events-none dark:hidden">
        <svg className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-[hsl(38,55%,55%)]" viewBox="0 0 32 32" fill="none">
          <path d="M0 16 L0 2 Q0 0 2 0 L16 0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M4 12 L4 4 L12 4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
          <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.6"/>
        </svg>
      </div>
      <div className="absolute top-2 right-2 xs:top-3 xs:right-3 sm:top-4 sm:right-4 pointer-events-none dark:hidden">
        <svg className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-[hsl(38,55%,55%)] rotate-90" viewBox="0 0 32 32" fill="none">
          <path d="M0 16 L0 2 Q0 0 2 0 L16 0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M4 12 L4 4 L12 4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
          <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.6"/>
        </svg>
      </div>
      <div className="absolute bottom-2 left-2 xs:bottom-3 xs:left-3 sm:bottom-4 sm:left-4 pointer-events-none dark:hidden">
        <svg className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-[hsl(38,55%,55%)] -rotate-90" viewBox="0 0 32 32" fill="none">
          <path d="M0 16 L0 2 Q0 0 2 0 L16 0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M4 12 L4 4 L12 4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
          <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.6"/>
        </svg>
      </div>
      <div className="absolute bottom-2 right-2 xs:bottom-3 xs:right-3 sm:bottom-4 sm:right-4 pointer-events-none dark:hidden">
        <svg className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-[hsl(38,55%,55%)] rotate-180" viewBox="0 0 32 32" fill="none">
          <path d="M0 16 L0 2 Q0 0 2 0 L16 0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M4 12 L4 4 L12 4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
          <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.6"/>
        </svg>
      </div>
      
      {/* Top gold accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 xs:w-20 sm:w-24 h-0.5 bg-gradient-to-r from-transparent via-[hsl(42,70%,55%)] to-transparent pointer-events-none dark:hidden" />
      
      {/* ═══════════════════════════════════════════════════════════
          DARK MODE DECORATIONS
          ═══════════════════════════════════════════════════════════ */}
      
      {/* Nebula gradient overlay */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none hidden dark:block">
        {/* Top specular highlight */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent" />
        
        {/* Aurora nebula gradients */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-[hsl(260,80%,60%)]/[0.08] rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-[hsl(185,90%,50%)]/[0.06] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[hsl(320,70%,55%)]/[0.04] rounded-full blur-2xl" />
        
        {/* Prismatic top border line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[hsl(260,80%,65%)]/50 to-transparent" />
        
        {/* Subtle star particles */}
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute top-[25%] right-[15%] w-0.5 h-0.5 bg-cyan-400/40 rounded-full" />
        <div className="absolute bottom-[20%] left-[30%] w-0.5 h-0.5 bg-violet-400/40 rounded-full" />
        <div className="absolute bottom-[30%] right-[25%] w-1 h-1 bg-white/20 rounded-full" />
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          CONTENT WRAPPER
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 overflow-y-auto max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-[hsl(38,40%,70%)] dark:scrollbar-thumb-white/20 scrollbar-track-transparent">
        {children}
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          CLOSE BUTTON
          ═══════════════════════════════════════════════════════════ */}
      {!hideCloseButton && (
        <DialogPrimitive.Close 
          className={cn(
            "absolute z-20",
            // Responsive positioning
            "right-2 top-2 xs:right-3 xs:top-3 sm:right-4 sm:top-4",
            "flex items-center justify-center",
            // Responsive sizing
            "h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9",
            "rounded-lg sm:rounded-xl",
            // Light mode: Gold accent button
            "text-[hsl(38,40%,45%)] hover:text-[hsl(38,50%,35%)]",
            "bg-transparent hover:bg-gradient-to-b hover:from-[hsl(42,50%,94%)] hover:to-[hsl(38,45%,88%)]",
            "hover:shadow-[inset_0_1px_0_rgba(255,250,240,0.8),0_2px_8px_rgba(139,109,66,0.15)]",
            "hover:ring-1 hover:ring-[hsl(42,60%,70%)]",
            // Dark mode: Aurora glow button
            "dark:text-white/40 dark:hover:text-white",
            "dark:hover:bg-white/[0.08]",
            "dark:hover:shadow-[0_0_20px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]",
            "dark:hover:ring-1 dark:hover:ring-violet-500/30",
            // Focus states
            "focus:outline-none focus-visible:ring-2",
            "focus-visible:ring-[hsl(42,60%,55%)]/50 dark:focus-visible:ring-violet-500/50",
            // Transitions
            "transition-all duration-200"
          )}
        >
          <X className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// ═══════════════════════════════════════════════════════════════════
// HEADER - Title and description container
// ═══════════════════════════════════════════════════════════════════
const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col gap-1.5 xs:gap-2",
      // Responsive text alignment
      "text-center sm:text-left",
      // Add bottom spacing
      "pb-2 xs:pb-3 sm:pb-4",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

// ═══════════════════════════════════════════════════════════════════
// FOOTER - Action buttons container
// ═══════════════════════════════════════════════════════════════════
const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      // Responsive layout
      "flex flex-col-reverse gap-2 xs:gap-2.5 sm:flex-row sm:justify-end sm:gap-3",
      // Top border separator
      "pt-3 xs:pt-4 sm:pt-5",
      "mt-2 xs:mt-3 sm:mt-4",
      "border-t",
      // Light mode border
      "border-[hsl(38,35%,82%)]",
      // Dark mode border
      "dark:border-white/[0.08]",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

// ═══════════════════════════════════════════════════════════════════
// TITLE - Main heading
// ═══════════════════════════════════════════════════════════════════
const DialogTitle = React.forwardRef(({ className, icon: Icon, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "flex items-center gap-2 xs:gap-2.5 sm:gap-3",
      // Responsive text size
      "text-base xs:text-lg sm:text-xl",
      "font-semibold leading-tight tracking-tight",
      // Light mode: Deep warm brown
      "text-[hsl(30,35%,18%)]",
      // Dark mode: Bright white with subtle glow
      "dark:text-white",
      className
    )}
    {...props}
  >
    {Icon && (
      <span className={cn(
        "flex items-center justify-center shrink-0",
        "h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9",
        "rounded-lg sm:rounded-xl",
        // Light mode: Gold accent container
        "bg-gradient-to-br from-[hsl(42,55%,90%)] to-[hsl(38,45%,85%)]",
        "ring-1 ring-[hsl(42,50%,75%)]",
        "shadow-[inset_0_1px_0_rgba(255,250,240,0.8),0_2px_4px_rgba(139,109,66,0.1)]",
        "text-[hsl(38,55%,40%)]",
        // Dark mode: Aurora glass container
        "dark:bg-gradient-to-br dark:from-violet-500/20 dark:to-cyan-500/10",
        "dark:ring-white/10",
        "dark:shadow-[0_0_20px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]",
        "dark:text-violet-400"
      )}>
        <Icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4.5 sm:w-4.5" />
      </span>
    )}
    {props.children}
  </DialogPrimitive.Title>
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

// ═══════════════════════════════════════════════════════════════════
// DESCRIPTION - Subtitle/description text
// ═══════════════════════════════════════════════════════════════════
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      // Responsive text size
      "text-xs xs:text-sm sm:text-[15px]",
      "leading-relaxed",
      // Light mode: Warm muted brown
      "text-[hsl(30,20%,45%)]",
      // Dark mode: Soft white
      "dark:text-white/60",
      className
    )}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// ═══════════════════════════════════════════════════════════════════
// BODY - Main content area
// ═══════════════════════════════════════════════════════════════════
const DialogBody = ({ className, ...props }) => (
  <div
    className={cn(
      // Responsive text size
      "text-sm sm:text-[15px]",
      "leading-relaxed",
      // Light mode
      "text-[hsl(30,15%,35%)]",
      // Dark mode
      "dark:text-white/70",
      className
    )}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

// ═══════════════════════════════════════════════════════════════════
// SECTION - Highlighted content section
// ═══════════════════════════════════════════════════════════════════
const DialogSection = ({ className, variant = "default", ...props }) => (
  <div
    className={cn(
      // Responsive padding and radius
      "rounded-lg xs:rounded-xl sm:rounded-2xl",
      "p-3 xs:p-4 sm:p-5",
      
      // ═════ DEFAULT VARIANT ═════
      variant === "default" && [
        // Light: Subtle inset panel
        "bg-gradient-to-b from-[hsl(40,35%,94%)] to-[hsl(38,30%,91%)]",
        "ring-1 ring-inset ring-[hsl(38,30%,82%)]",
        "shadow-[inset_0_2px_4px_rgba(139,109,66,0.06)]",
        // Dark: Glass panel
        "dark:bg-white/[0.03] dark:from-transparent dark:to-transparent",
        "dark:ring-white/[0.06]",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
      ],
      
      // ═════ HIGHLIGHT VARIANT ═════
      variant === "highlight" && [
        // Light: Gold accent panel
        "bg-gradient-to-br from-[hsl(45,60%,93%)] via-[hsl(42,50%,90%)] to-[hsl(38,45%,88%)]",
        "ring-1 ring-inset ring-[hsl(42,55%,70%)]",
        "shadow-[inset_0_2px_4px_rgba(180,140,60,0.08),0_1px_2px_rgba(139,109,66,0.06)]",
        // Dark: Violet aurora panel
        "dark:bg-gradient-to-br dark:from-violet-500/[0.12] dark:via-violet-500/[0.06] dark:to-transparent",
        "dark:ring-violet-500/20",
        "dark:shadow-[0_0_30px_-10px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
      ],
      
      // ═════ WARNING VARIANT ═════
      variant === "warning" && [
        // Light: Amber warning panel
        "bg-gradient-to-br from-[hsl(48,80%,93%)] via-[hsl(45,70%,90%)] to-[hsl(42,60%,87%)]",
        "ring-1 ring-inset ring-[hsl(45,65%,65%)]",
        "shadow-[inset_0_2px_4px_rgba(200,150,50,0.08)]",
        // Dark: Amber glow panel
        "dark:bg-gradient-to-br dark:from-amber-500/[0.12] dark:via-amber-500/[0.06] dark:to-transparent",
        "dark:ring-amber-500/25",
        "dark:shadow-[0_0_25px_-10px_rgba(251,191,36,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
      ],
      
      // ═════ DANGER VARIANT ═════
      variant === "danger" && [
        // Light: Rose danger panel
        "bg-gradient-to-br from-[hsl(355,70%,96%)] via-[hsl(355,60%,93%)] to-[hsl(355,50%,90%)]",
        "ring-1 ring-inset ring-[hsl(355,50%,75%)]",
        "shadow-[inset_0_2px_4px_rgba(180,60,60,0.06)]",
        // Dark: Rose glow panel
        "dark:bg-gradient-to-br dark:from-rose-500/[0.12] dark:via-rose-500/[0.06] dark:to-transparent",
        "dark:ring-rose-500/25",
        "dark:shadow-[0_0_25px_-10px_rgba(244,63,94,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
      ],
      
      // ═════ SUCCESS VARIANT ═════
      variant === "success" && [
        // Light: Emerald success panel
        "bg-gradient-to-br from-[hsl(150,50%,94%)] via-[hsl(148,45%,91%)] to-[hsl(145,40%,88%)]",
        "ring-1 ring-inset ring-[hsl(150,40%,70%)]",
        "shadow-[inset_0_2px_4px_rgba(60,150,100,0.06)]",
        // Dark: Emerald glow panel
        "dark:bg-gradient-to-br dark:from-emerald-500/[0.12] dark:via-emerald-500/[0.06] dark:to-transparent",
        "dark:ring-emerald-500/25",
        "dark:shadow-[0_0_25px_-10px_rgba(52,211,153,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
      ],
      
      // ═════ INFO VARIANT (NEW) ═════
      variant === "info" && [
        // Light: Sky blue info panel
        "bg-gradient-to-br from-[hsl(200,60%,95%)] via-[hsl(200,50%,92%)] to-[hsl(200,45%,89%)]",
        "ring-1 ring-inset ring-[hsl(200,50%,75%)]",
        "shadow-[inset_0_2px_4px_rgba(60,130,180,0.06)]",
        // Dark: Cyan glow panel
        "dark:bg-gradient-to-br dark:from-cyan-500/[0.12] dark:via-cyan-500/[0.06] dark:to-transparent",
        "dark:ring-cyan-500/25",
        "dark:shadow-[0_0_25px_-10px_rgba(34,211,238,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
      ],
      
      className
    )}
    {...props}
  />
)
DialogSection.displayName = "DialogSection"

// ═══════════════════════════════════════════════════════════════════
// DIVIDER - Horizontal separator
// ═══════════════════════════════════════════════════════════════════
const DialogDivider = ({ className, ...props }) => (
  <div
    className={cn(
      "h-px my-3 xs:my-4 sm:my-5",
      // Light mode: Gold gradient divider
      "bg-gradient-to-r from-transparent via-[hsl(42,50%,75%)] to-transparent",
      // Dark mode: Aurora gradient divider
      "dark:via-white/10",
      className
    )}
    {...props}
  />
)
DialogDivider.displayName = "DialogDivider"

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
  DialogDivider,
}
