import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * CyberGrainOverlay - Subtle grain texture for cyberpunk aesthetic
 * Very low opacity to keep content readable
 */
function CyberGrainOverlay() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden opacity-0 dark:opacity-100 transition-opacity duration-300"
      aria-hidden="true"
    >
      {/* Subtle noise texture */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.025,
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Very subtle horizontal scan lines */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.008) 2px,
            rgba(0, 255, 255, 0.008) 3px
          )`,
          backgroundSize: '100% 3px',
        }}
      />
      
      {/* Top edge neon accent line */}
      <div 
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(0, 240, 255, 0.25) 30%, rgba(0, 240, 255, 0.4) 50%, rgba(0, 240, 255, 0.25) 70%, transparent 90%)',
        }}
      />
      
      {/* Bottom edge subtle magenta accent */}
      <div 
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 15%, rgba(255, 0, 128, 0.15) 35%, rgba(255, 0, 128, 0.2) 50%, rgba(255, 0, 128, 0.15) 65%, transparent 85%)',
        }}
      />
      
      {/* Corner accents */}
      <div 
        className="absolute top-0 left-0 w-8 h-8"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, transparent 50%)',
        }}
      />
      <div 
        className="absolute top-0 right-0 w-8 h-8"
        style={{
          background: 'linear-gradient(225deg, rgba(0, 240, 255, 0.08) 0%, transparent 50%)',
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-8 h-8"
        style={{
          background: 'linear-gradient(45deg, rgba(255, 0, 128, 0.06) 0%, transparent 50%)',
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-8 h-8"
        style={{
          background: 'linear-gradient(315deg, rgba(255, 0, 128, 0.06) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}

/**
 * PanelCard - Layout-safe wrapper for main panel cards
 * 
 * Ensures shadows are visible by:
 * - NOT clipping overflow on the card itself
 * - Using min-h-0 for flex child sizing
 * - Applying strong shadow variants for visibility on gradient backgrounds
 * 
 * @param {string} variant - Card variant (default: "elevated")
 * @param {boolean} animate - Whether to apply entrance animation
 * @param {boolean} hoverLift - Whether to lift on hover
 * @param {boolean} fitContent - Whether to fit content height instead of full height
 * @param {boolean} cyberGrain - Whether to show cyberpunk grain overlay in dark mode
 */
const PanelCard = React.forwardRef(
  ({ 
    className, 
    children, 
    variant = 'elevated',
    animate = true,
    hoverLift = true,
    fitContent = false,
    cyberGrain = true,
    ...props 
  }, ref) => {
    const cardContent = (
      <Card
        ref={!animate ? ref : undefined}
        variant={variant}
        className={cn(
          // Layout-safe defaults
          'flex flex-col relative',
          // Height behavior: h-auto grows with content, max-h from className constrains it
          fitContent ? 'h-auto' : 'h-full min-h-0',
          // Clip content to rounded corners but don't clip shadow
          'overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Cyberpunk grain overlay - only in dark mode */}
        {cyberGrain && <CyberGrainOverlay />}
        
        {/* Card content with relative z-index to stay above overlay */}
        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          {children}
        </div>
      </Card>
    );

    if (!animate) {
      return cardContent;
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          "flex flex-col",
          fitContent ? "h-auto max-h-full" : "h-full min-h-0"
        )}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        whileHover={hoverLift ? { 
          y: -3,
          transition: { duration: 0.2, ease: 'easeOut' }
        } : undefined}
      >
        {cardContent}
      </motion.div>
    );
  }
);
PanelCard.displayName = 'PanelCard';

/**
 * PanelCardBodyScroll - Scrollable content area inside PanelCard
 * 
 * Wraps content in ScrollArea so the panel scrolls internally,
 * keeping the outer container overflow-visible for shadows.
 */
const PanelCardBodyScroll = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <ScrollArea
      ref={ref}
      className={cn('flex-1 min-h-0', className)}
      {...props}
    >
      {children}
    </ScrollArea>
  )
);
PanelCardBodyScroll.displayName = 'PanelCardBodyScroll';

export {
  PanelCard,
  PanelCardBodyScroll,
};

