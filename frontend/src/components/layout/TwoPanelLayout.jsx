import { useState, useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { useBreakpoint } from '../../hooks/useMediaQuery';

/**
 * TwoPanelLayout Component
 * Responsive two-panel layout with config (left) and results (right)
 * 
 * Uses dynamic content-aware detection to switch between:
 * - Desktop: Side-by-side panels with floating cards
 * - Mobile: Results first, Config opens as drawer
 * 
 * Uses Luma theme with white/cream backgrounds and warm-toned borders
 * The results panel scales based on content - shrinks when few results, expands when many
 */
export function TwoPanelLayout({ 
    configPanel,
    configPanelWithoutSwitcher, // Config panel content without the mode switcher (for drawer body)
    modeSwitcher, // Mode switcher component (Keys/Cards tabs) - shown in drawer header on mobile
    resultsPanel,
    className,
    // Controlled drawer state (lifted from parent to persist across mode switches)
    drawerOpen: controlledDrawerOpen,
    onDrawerOpenChange,
}) {
    // Use controlled state if provided, otherwise use internal state
    const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
    const drawerOpen = controlledDrawerOpen !== undefined ? controlledDrawerOpen : internalDrawerOpen;
    const setDrawerOpen = onDrawerOpenChange || setInternalDrawerOpen;
    
    // Use breakpoint hook for responsive detection
    const { isMobile } = useBreakpoint();
    
    // Dynamic layout detection with hysteresis to prevent feedback loops
    // Minimum width needed for side-by-side: config (320px) + results (300px min) + gaps (32px)
    const REQUIRED_DESKTOP_WIDTH = 652;
    const HYSTERESIS_BUFFER = 50; // Extra buffer before switching back to desktop
    
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [shouldUseMobileLayout, setShouldUseMobileLayout] = useState(isMobile);
    
    // Track container width with debounce
    useEffect(() => {
        if (!containerRef.current) return;
        
        let rafId;
        let timeoutId;
        
        const measureWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        
        // Debounced measurement to prevent rapid updates
        const debouncedMeasure = () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                rafId = requestAnimationFrame(measureWidth);
            }, 150); // 150ms debounce
        };
        
        // Initial measurement
        measureWidth();
        
        window.addEventListener('resize', debouncedMeasure);
        
        return () => {
            window.removeEventListener('resize', debouncedMeasure);
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
        };
    }, []);
    
    // Determine layout mode with hysteresis
    useEffect(() => {
        if (isMobile) {
            setShouldUseMobileLayout(true);
            return;
        }
        
        if (containerWidth === 0) return;
        
        setShouldUseMobileLayout(prev => {
            if (prev) {
                // Currently mobile - only switch to desktop if significantly larger
                return containerWidth < (REQUIRED_DESKTOP_WIDTH + HYSTERESIS_BUFFER);
            } else {
                // Currently desktop - switch to mobile if too small
                return containerWidth < REQUIRED_DESKTOP_WIDTH;
            }
        });
    }, [isMobile, containerWidth]);

    return (
        <>
            <div 
                ref={containerRef}
                className={cn(
                    // Base layout - uses Luma background
                    "h-full flex gap-3 p-3 overflow-auto bg-luma",
                    // Dynamic layout based on content fit
                    shouldUseMobileLayout 
                        ? "flex-col items-start" 
                        : "flex-row items-start gap-4 p-4",
                    className
                )}
            >
                {/* Config Panel - hidden when using mobile layout */}
                {!shouldUseMobileLayout && (
                    <aside className="flex flex-col shrink-0 w-[320px] md:w-[360px] lg:w-[400px]">
                        <div className={cn(
                            "flex flex-col floating-panel",
                            "bg-luma-surface"
                        )}>
                            <div className="panel-scroll custom-scrollbar">
                                {configPanel}
                            </div>
                        </div>
                    </aside>
                )}

                {/* Mobile Config Button - only shown when using mobile layout */}
                {shouldUseMobileLayout && (
                    <div className="w-full flex justify-end mb-2 shrink-0">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDrawerOpen(true)}
                            className="surface-glass gap-2"
                            aria-label="Open settings"
                        >
                            <Settings size={16} />
                            Config
                        </Button>
                    </div>
                )}

                {/* Results Panel - Apple style card */}
                <main className={cn(
                    "flex flex-col min-w-0 w-full",
                    "min-h-[200px]",
                    !shouldUseMobileLayout && "flex-1"
                )} style={{ maxHeight: 'var(--app-dvh)' }}>
                    <div className={cn(
                        "flex flex-col floating-panel h-fit",
                        "bg-luma-surface"
                    )} style={{ maxHeight: 'var(--app-dvh)' }}>
                        {resultsPanel}
                    </div>
                </main>
            </div>

            {/* Drawer for config on mobile - mode switcher in header */}
            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                headerContent={modeSwitcher}
                position="right"
            >
                <div className="min-h-0 flex flex-col">
                    {configPanelWithoutSwitcher || configPanel}
                </div>
            </Drawer>
        </>
    );
}

/**
 * ConfigSection - Wrapper for config panel sections
 * Uses white/cream background from Luma theme
 */
export function ConfigSection({ 
    children, 
    className,
    noPadding = false,
}) {
    return (
        <div className={cn(
            "bg-luma-surface",
            !noPadding && "p-5",
            className
        )}>
            {children}
        </div>
    );
}

/**
 * ConfigDivider - Visual separator between config sections
 * Apple-style thin divider
 */
export function ConfigDivider({ className }) {
    return (
        <div className={cn(
            "h-px mx-5",
            "bg-black/5 dark:bg-white/10",
            className
        )} />
    );
}

/**
 * ConfigLabel - Section label for config panel
 * Uses warm muted text color from Luma theme
 */
export function ConfigLabel({ children, className }) {
    return (
        <span className={cn(
            "text-[10px] font-apple-semibold uppercase tracking-widest text-luma-muted block mb-3",
            className
        )}>
            {children}
        </span>
    );
}

/**
 * ResultsHeader - Header inside floating card (responsive)
 * Apple-style clean header
 */
export function ResultsHeader({ 
    children, 
    className,
}) {
    return (
        <div className={cn(
            "px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5",
            "border-b border-black/5 dark:border-white/5",
            "bg-white/50 dark:bg-white/5",
            className
        )}>
            {children}
        </div>
    );
}

/**
 * ResultsContent - Scrollable content area for results (responsive)
 * Scales based on content - shrinks when few results, scrolls when many
 * Uses white/cream background from Luma theme
 */
export function ResultsContent({ 
    children, 
    className,
}) {
    return (
        <div className={cn(
            "results-scroll px-4 py-3 md:px-6 md:py-4 custom-scrollbar",
            "bg-luma-surface rounded-3xl",
            className
        )}>
            {children}
        </div>
    );
}

/**
 * ResultsFooter - Footer for pagination or actions
 * Uses warm border color from Luma theme
 */
export function ResultsFooter({ 
    children, 
    className,
}) {
    return (
        <div className={cn(
            "px-5 py-3 border-t border-luma bg-luma-surface",
            className
        )}>
            {children}
        </div>
    );
}

