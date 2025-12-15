import { cn } from '../../lib/utils';

/**
 * TwoPanelLayout Component
 * Responsive two-panel layout with config (left) and results (right)
 * 
 * Desktop: Side-by-side panels with floating cards on gradient backgrounds
 * Mobile: Config in drawer, results full-width
 */
export function TwoPanelLayout({ 
    configPanel, 
    resultsPanel,
    className,
}) {
    return (
        <div className={cn(
            "h-full flex gap-3 p-3 overflow-hidden",
            "flex-col", // Mobile: stack vertically
            "md:flex-row md:gap-4 md:p-4", // Desktop: side by side
            className
        )}>
            {/* Config Panel */}
            <aside className={cn(
                "flex flex-col shrink-0 overflow-hidden",
                "w-full", // Mobile: full width, auto height
                "md:h-full md:w-[360px] lg:w-[400px]" // Desktop: full height, fixed width
            )}>
                <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)]">
                    <div className="overflow-y-auto custom-scrollbar">
                        {configPanel}
                    </div>
                </div>
            </aside>

            {/* Results Panel */}
            <main className={cn(
                "flex-1 flex flex-col overflow-hidden min-w-0",
                "min-h-[200px]" // Minimum height on mobile
            )}>
                <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)]">
                    {resultsPanel}
                </div>
            </main>
        </div>
    );
}

/**
 * ConfigSection - Wrapper for config panel sections
 */
export function ConfigSection({ 
    children, 
    className,
    noPadding = false,
}) {
    return (
        <div className={cn(!noPadding && "p-5", className)}>
            {children}
        </div>
    );
}

/**
 * ConfigDivider - Visual separator between config sections
 */
export function ConfigDivider({ className }) {
    return (
        <div className={cn(
            "h-px mx-5",
            "bg-gradient-to-r from-transparent via-orange-300/30 to-transparent",
            className
        )} />
    );
}

/**
 * ConfigLabel - Section label for config panel
 */
export function ConfigLabel({ children, className }) {
    return (
        <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest text-orange-800/50 block mb-3",
            className
        )}>
            {children}
        </span>
    );
}

/**
 * ResultsHeader - Header inside floating card (responsive)
 */
export function ResultsHeader({ 
    children, 
    className,
}) {
    return (
        <div className={cn(
            "px-3 py-2 md:px-5 md:py-4",
            "border-b border-gray-100",
            className
        )}>
            {children}
        </div>
    );
}

/**
 * ResultsContent - Scrollable content area for results (responsive)
 */
export function ResultsContent({ 
    children, 
    className,
}) {
    return (
        <div className={cn(
            "flex-1 overflow-y-auto p-3 md:p-5 custom-scrollbar",
            className
        )}>
            {children}
        </div>
    );
}

/**
 * ResultsFooter - Footer for pagination or actions
 */
export function ResultsFooter({ 
    children, 
    className,
}) {
    return (
        <div className={cn(
            "px-5 py-3 border-t border-gray-100",
            className
        )}>
            {children}
        </div>
    );
}

