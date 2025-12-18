import * as React from 'react';
import { cn } from '@/lib/utils';
import { CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * ResultsHeader - Header section for results panel
 * 
 * Typically contains stats bar and action buttons.
 * Uses shrink-0 to prevent flex shrinking.
 * OPUX styled with subtle border in dark mode.
 */
export function ResultsHeader({ children, className }) {
  return (
    <CardHeader className={cn(
      "shrink-0 px-4 py-3 border-b border-border/40",
      "dark:border-white/10",
      className
    )}>
      {children}
    </CardHeader>
  );
}

/**
 * ResultsContent - Scrollable content area for results
 * 
 * Wraps content in ScrollArea so the results list scrolls internally.
 * Uses flex-1 + min-h-0 to take remaining space and enable scrolling.
 */
export function ResultsContent({ children, className }) {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <CardContent className={cn("p-4", className)}>
        {children}
      </CardContent>
    </ScrollArea>
  );
}

/**
 * ResultsFooter - Footer section for results panel
 * 
 * Typically contains pagination controls.
 * Uses shrink-0 to prevent flex shrinking.
 * OPUX styled with subtle border in dark mode.
 */
export function ResultsFooter({ children, className }) {
  return (
    <div className={cn(
      "shrink-0 px-4 py-3 border-t border-border/40",
      "dark:border-white/10",
      className
    )}>
      {children}
    </div>
  );
}



