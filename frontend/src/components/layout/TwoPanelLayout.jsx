import { useState, useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import {
  PanelCard,
  PanelCardBodyScroll,
} from './panels/PanelCard';

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
 * Responsive two-panel layout with config (left) and results (right)
 * 
 * SHADOW FIX: Outer container uses overflow-visible + padding for shadow space.
 * Scrolling happens INSIDE the panels via PanelCardBodyScroll / ScrollArea.
 */
export function TwoPanelLayout({ 
  configPanel,
  configPanelWithoutSwitcher,
  modeSwitcher,
  resultsPanel,
  className,
  drawerOpen: controlledDrawerOpen,
  onDrawerOpenChange,
}) {
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const drawerOpen = controlledDrawerOpen !== undefined ? controlledDrawerOpen : internalDrawerOpen;
  const setDrawerOpen = onDrawerOpenChange || setInternalDrawerOpen;
  
  const { isMobile } = useBreakpoint();
  const containerRef = useRef(null);
  const shouldUseMobileLayout = useContainerLayout(containerRef, isMobile);

  return (
    <>
      {/* 
        Main container:
        - h-full + min-h-0 for flex child sizing
        - NO overflow-auto/hidden here - let shadows show
        - p-5 provides space for shadows to render
      */}
      <div 
        ref={containerRef}
        className={cn(
          "h-full min-h-0 flex gap-5 p-5 relative z-0",
          shouldUseMobileLayout 
            ? "flex-col items-stretch" 
            : "flex-row items-stretch",
          className
        )}
      >
        {/* Config Panel - Desktop only */}
        {!shouldUseMobileLayout && (
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
        )}

        {/* Mobile Config Button */}
        {shouldUseMobileLayout && (
          <div className="w-full flex justify-end mb-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Config
            </Button>
          </div>
        )}

        {/* Results Panel */}
        <main 
          className={cn(
            "min-w-0 flex-1 pb-6",
            // Hybrid height: grow with content, max at viewport, then scroll
            "max-h-[calc(100vh-120px)] flex flex-col",
            shouldUseMobileLayout && "w-full"
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

      {/* Mobile Sheet */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[85%] max-w-[400px] p-0">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="sr-only">Configuration</SheetTitle>
            {modeSwitcher && (
              <div className="flex justify-center">
                {modeSwitcher}
              </div>
            )}
          </SheetHeader>
          <ScrollArea className="h-[calc(var(--app-dvh)-80px)]">
            <div className="p-4">
              {configPanelWithoutSwitcher || configPanel}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

