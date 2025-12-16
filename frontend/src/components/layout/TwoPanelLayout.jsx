import { cn } from '../../lib/utils';

/**
 * TwoPanelLayout Component
 * Responsive two-panel layout with config (left) and results (right)
 * 
 * Desktop (≥768px): Side-by-side panels with floating cards
 * Mobile (<768px): Stacked vertically (config above results)
 * 
 * Uses Luma theme with white/cream backgrounds and warm-toned borders
 * The results panel scales based on content - shrinks when few results, expands when many
 */
export function TwoPanelLayout({ 
    configPanel, 
    resultsPanel,
    className,
}) {
    return (
        <div className={cn(
            // Base layout - uses Luma background
            "h-full flex gap-3 p-3 overflow-auto bg-luma",
            // Mobile (<768px): stack vertically, align to top
            "flex-col items-start",
            // Desktop (≥768px): side by side, align to top
            "md:flex-row md:items-start md:gap-4 md:p-4",
            className
        )}>
            {/* Config Panel - Apple style card */}
            <aside className={cn(
                "flex flex-col shrink-0",
                "w-full", // Mobile: full width, auto height
                "md:w-[360px] lg:w-[400px]" // Desktop: fixed width, auto height
            )}>
                <div className={cn(
                    "flex flex-col floating-panel",
                    "bg-luma-surface"
                )}>
                    <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-120px)]">
                        {configPanel}
                    </div>
                </div>
            </aside>

            {/* Results Panel - Apple style card */}
            <main className={cn(
                "flex flex-col min-w-0 w-full",
                "min-h-[200px] max-h-full", // Min height, but cap at container
                "md:flex-1" // On desktop, can grow to fill space if needed
            )}>
                <div className={cn(
                    "flex flex-col floating-panel h-fit max-h-full",
                    "bg-luma-surface"
                )}>
                    {resultsPanel}
                </div>
            </main>
        </div>
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
            "px-5 py-4 md:px-6 md:py-5",
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
            "overflow-y-auto px-4 py-3 md:px-6 md:py-4 custom-scrollbar",
            "max-h-[60vh] md:max-h-[calc(100vh-280px)]", // Cap height, allow scrolling when needed
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

