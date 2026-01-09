import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { PanelCard } from './panels/PanelCard';

/**
 * Custom hook for container width detection with hysteresis
 * Extracted for SRP and testability
 */
function useContainerLayout(containerRef, isMobile) {
  const REQUIRED_DESKTOP_WIDTH = 652;
  const HYSTERESIS_BUFFER = 50;
  
  const [containerWidth, setContainerWidth] = useState(0);
  const [shouldUseMobileLayout, setShouldUseMobileLayout] = useState(isMobile);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    let rafId;
    let timeoutId;
    
    const measureWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    const debouncedMeasure = () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(measureWidth);
      }, 150);
    };
    
    measureWidth();
    window.addEventListener('resize', debouncedMeasure);
    
    return () => {
      window.removeEventListener('resize', debouncedMeasure);
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [containerRef]);
  
  useEffect(() => {
    if (isMobile) {
      setShouldUseMobileLayout(true);
      return;
    }
    
    if (containerWidth === 0) return;
    
    setShouldUseMobileLayout(prev => {
      if (prev) {
        return containerWidth < (REQUIRED_DESKTOP_WIDTH + HYSTERESIS_BUFFER);
      } else {
        return containerWidth < REQUIRED_DESKTOP_WIDTH;
      }
    });
  }, [isMobile, containerWidth]);
  
  return shouldUseMobileLayout;
}

/**
 * TwoPanelLayout Component
 * 
 * REDESIGNED: Flattened single-page layout for mobile
 * - Mobile: Config + Results stacked vertically, single scroll
 * - Desktop: Side-by-side panels (unchanged)
 * 
 * No more button/drawer - everything visible at once!
 */
export function TwoPanelLayout({ 
  configPanel,
  configPanelWithoutSwitcher,
  resultsPanel,
  className,
}) {
  const { isMobile } = useBreakpoint();
  const containerRef = useRef(null);
  const shouldUseMobileLayout = useContainerLayout(containerRef, isMobile);
  
  // Mobile: Collapsible config section state
  const [configExpanded, setConfigExpanded] = useState(true);

  // MOBILE LAYOUT - Flattened single page
  if (shouldUseMobileLayout) {
    return (
      <ScrollArea className="h-full">
        <div 
          ref={containerRef}
          className={cn(
            "flex flex-col gap-3 p-3 pb-6",
            className
          )}
        >
          {/* Config Section - Collapsible card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={cn(
              "rounded-xl overflow-hidden relative",
              // Light: Vintage parchment
              "bg-gradient-to-b from-[hsl(40,45%,98%)] to-[hsl(38,40%,96%)]",
              "border border-[hsl(30,30%,85%)]",
              "shadow-[0_2px_8px_-2px_rgba(101,67,33,0.08)]",
              // Dark: Cyberpunk glass panel
              "dark:bg-none dark:bg-[rgba(8,12,20,0.88)]",
              "dark:border-[rgba(0,240,255,0.12)] dark:backdrop-blur-xl",
              "dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),0_0_1px_rgba(0,240,255,0.15)]"
            )}>
              {/* Cyberpunk neon edge accents - dark mode only */}
              <div className="absolute inset-x-0 top-0 h-px hidden dark:block bg-gradient-to-r from-transparent via-[rgba(0,240,255,0.35)] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-px hidden dark:block bg-gradient-to-r from-transparent via-[rgba(255,0,128,0.2)] to-transparent" />
              {/* Config Header - Clickable to toggle */}
              <button
                onClick={() => setConfigExpanded(!configExpanded)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5",
                  "transition-colors duration-200",
                  // Light
                  "hover:bg-[hsl(38,35%,94%)]",
                  // Dark
                  "dark:hover:bg-white/[0.03]"
                )}
              >
                <div className="flex items-center gap-2">
                  {/* Pulsing dot indicator */}
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    "bg-gradient-to-br from-emerald-400 to-emerald-600",
                    "shadow-[0_0_8px_rgba(52,211,153,0.5)]",
                    "animate-pulse"
                  )} />
                  <span className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    "text-[hsl(25,35%,35%)] dark:text-white/70"
                  )}>
                    Configuration
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: configExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-[hsl(25,25%,50%)] dark:text-white/40" />
                </motion.div>
              </button>
              
              {/* Config Content - Animated collapse */}
              <AnimatePresence initial={false}>
                {configExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    {/* Divider line */}
                    <div className={cn(
                      "mx-3 border-t",
                      "border-[hsl(30,25%,88%)] dark:border-white/[0.06]"
                    )} />
                    
                    {/* Config panel content */}
                    <div className="dark:bg-transparent">
                      {configPanelWithoutSwitcher || configPanel}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex-1"
          >
            <PanelCard 
              variant="elevated"
              animate={false}
              hoverLift={false}
              fitContent={true}
            >
              {resultsPanel}
            </PanelCard>
          </motion.div>
        </div>
      </ScrollArea>
    );
  }

  // DESKTOP LAYOUT - Side by side (unchanged)
  return (
    <div 
      ref={containerRef}
      className={cn(
        "h-full min-h-0 flex gap-5 p-5 relative z-0",
        "flex-row items-stretch",
        className
      )}
    >
      {/* Config Panel - Desktop */}
      <aside className="shrink-0 w-[320px] md:w-[360px] lg:w-[400px] self-start pb-6">
        <PanelCard 
          variant="elevated" 
          animate={true}
          hoverLift={true}
          fitContent={true}
        >
          {configPanel}
        </PanelCard>
      </aside>

      {/* Results Panel - Desktop */}
      <main 
        className={cn(
          "min-w-0 flex-1 pb-6",
          "max-h-[calc(100vh-120px)] flex flex-col"
        )}
      >
        <PanelCard 
          variant="elevated"
          animate={true}
          hoverLift={true}
          fitContent={true}
          className="max-h-full"
        >
          {resultsPanel}
        </PanelCard>
      </main>
    </div>
  );
}

