import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

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
 */
const PanelCard = React.forwardRef(
  ({ 
    className, 
    children, 
    variant = 'elevated',
    animate = true,
    hoverLift = true,
    fitContent = false,
    ...props 
  }, ref) => {
    const cardContent = (
      <Card
        ref={!animate ? ref : undefined}
        variant={variant}
        className={cn(
          // Layout-safe defaults
          'flex flex-col',
          // Height behavior
          fitContent ? 'h-auto' : 'h-full min-h-0',
          // No overflow clipping on the card wrapper - let shadow show
          'overflow-visible',
          className
        )}
        {...props}
      >
        {children}
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
          fitContent ? "h-auto" : "h-full min-h-0"
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

