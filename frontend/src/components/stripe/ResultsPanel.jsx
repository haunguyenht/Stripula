import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Trash2, RefreshCw, LayoutGrid, Key } from 'lucide-react';
import { ResultsHeader, ResultsContent, ResultsFooter } from '../layout/TwoPanelLayout';
import { StatPillGroup } from '../ui/StatPill';
import { cn } from '../../lib/utils';

/**
 * ResultsPanel - Results panel with gallery header, stats bar, list, and pagination
 * Uses dynamic width detection to hide title when space is limited
 */
export function ResultsPanel({
    // Stats configuration
    stats,
    activeFilter,
    onFilterChange,
    
    // Results
    children,
    
    // Pagination
    currentPage,
    totalPages,
    onPageChange,
    
    // Actions
    onClear,
    onRefresh,
    
    // State
    isLoading,
    isEmpty,
    emptyState,
    loadingState,
    
    // Title
    title = 'Results',
    className,
}) {
    const safeStats = Array.isArray(stats) ? stats : [];
    const allStat = safeStats.find(stat => stat.id === 'all');
    const totalCount = allStat ? Number(allStat.value) || 0 : safeStats.reduce((sum, stat) => sum + (Number(stat.value) || 0), 0);
    const isChecking = Boolean(isLoading);

    // Dynamic width detection for showing/hiding title
    const headerRef = useRef(null);
    const titleRef = useRef(null);
    const pillsRef = useRef(null);
    const actionsRef = useRef(null);
    const [showTitle, setShowTitle] = useState(true);
    const measuredWidthsRef = useRef({ title: 0, pills: 0, actions: 0 });
    
    // Measure actual content widths once title is visible
    useEffect(() => {
        if (!showTitle) return;
        
        // Measure after render
        const measureTimeout = setTimeout(() => {
            if (titleRef.current) {
                measuredWidthsRef.current.title = titleRef.current.offsetWidth;
            }
            if (pillsRef.current) {
                measuredWidthsRef.current.pills = pillsRef.current.offsetWidth;
            }
            if (actionsRef.current) {
                measuredWidthsRef.current.actions = actionsRef.current.offsetWidth;
            }
        }, 50);
        
        return () => clearTimeout(measureTimeout);
    }, [showTitle, safeStats]); // Re-measure when stats change
    
    useEffect(() => {
        if (!headerRef.current) return;
        
        let rafId;
        let timeoutId;
        
        const checkWidth = () => {
            if (!headerRef.current) return;
            
            const containerWidth = headerRef.current.offsetWidth;
            const { title, pills, actions } = measuredWidthsRef.current;
            
            // Calculate required width: measured widths + gaps (16px between each element)
            const GAP = 16;
            const PADDING = 8; // Extra breathing room
            const requiredWidth = title + pills + actions + (GAP * 2) + PADDING;
            
            // Hysteresis: need 40px more space to show title again
            const HYSTERESIS = 40;
            
            setShowTitle(prev => {
                if (prev) {
                    // Currently showing - hide if container is smaller than required
                    return containerWidth >= requiredWidth;
                } else {
                    // Currently hidden - show only if significantly wider
                    // Use measured pills + actions + estimated title width for comparison
                    const estimatedRequired = (title || 180) + pills + actions + (GAP * 2) + PADDING;
                    return containerWidth >= estimatedRequired + HYSTERESIS;
                }
            });
        };
        
        const debouncedCheck = () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                rafId = requestAnimationFrame(checkWidth);
            }, 100);
        };
        
        // Initial check after a short delay to allow measurement
        const initialTimeout = setTimeout(checkWidth, 100);
        
        // Observe resize
        const resizeObserver = new ResizeObserver(debouncedCheck);
        resizeObserver.observe(headerRef.current);
        
        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
            clearTimeout(initialTimeout);
        };
    }, [safeStats]); // Re-run when stats change as pills width may change

    return (
        <div className={cn("flex flex-col", className)}>
            {/* Header - Single row: Title (dynamic) | Pills | Actions */}
            <ResultsHeader>
                <div ref={headerRef} className="flex items-center justify-between gap-4">
                    {/* Left: Icon + Title - dynamically hidden based on available width */}
                    {showTitle && (
                        <div ref={titleRef} className="flex items-center gap-2 min-w-0 shrink-0">
                            <div className="results-header-icon shrink-0">
                                <LayoutGrid size={18} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="results-title truncate text-sm whitespace-nowrap">{title}</h2>
                                {isChecking ? (
                                    <p className="results-processing">
                                        <Loader2 size={10} className="animate-spin" />
                                        <span className="text-[10px]">Processing...</span>
                                    </p>
                                ) : (
                                    <p className="results-subtitle text-[10px] whitespace-nowrap">{totalCount} results</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Center: Filter Pills - centered in available space */}
                    <div 
                        ref={pillsRef}
                        className="flex-1 flex justify-center min-w-0"
                    >
                        <StatPillGroup
                            stats={safeStats}
                            activeFilter={activeFilter}
                            onFilterChange={onFilterChange}
                        />
                    </div>

                    {/* Right: Actions */}
                    <div ref={actionsRef} className="flex items-center gap-1 shrink-0">
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className={cn(
                                    "action-btn-glass action-btn-refresh",
                                    "!px-2 !py-1.5",
                                    isLoading && "loading"
                                )}
                                disabled={isLoading}
                                title="Refresh all"
                            >
                                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                            </button>
                        )}
                        {onClear && (
                            <button
                                onClick={onClear}
                                className={cn(
                                    "action-btn-glass action-btn-clear",
                                    "!px-2 !py-1.5",
                                    isLoading && "loading"
                                )}
                                disabled={isLoading}
                                title="Clear results"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </ResultsHeader>

            {/* Results List */}
            <ResultsContent>
                {isLoading && isEmpty ? (
                    loadingState || <DefaultLoadingState />
                ) : isEmpty ? (
                    emptyState || <DefaultEmptyState />
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {children}
                        </AnimatePresence>
                    </div>
                )}
            </ResultsContent>

            {/* Pagination */}
            {totalPages > 1 && (
                <ResultsFooter>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                </ResultsFooter>
            )}
        </div>
    );
}

/**
 * Pagination Component - Modern Glass Style
 */
function Pagination({ currentPage, totalPages, onPageChange }) {
    return (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
            >
                <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            </button>
            
            <div className="pagination-info">
                <span className="pagination-text pagination-text-current">{currentPage}</span>
                <span className="pagination-text pagination-text-divider">/</span>
                <span className="pagination-text">{totalPages}</span>
            </div>
            
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
            >
                <ChevronRight size={14} className="sm:w-4 sm:h-4" />
            </button>
        </div>
    );
}

/**
 * Default Empty State - Modern Glass Style
 * Uses centralized .empty-state classes from index.css
 */
function DefaultEmptyState() {
    return (
        <motion.div
            className="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <motion.div 
                className="relative mb-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="absolute inset-0 rounded-3xl bg-luma-coral-20 blur-xl" />
                <div className="empty-state-icon empty-state-icon-lg relative surface-glass-strong">
                    <Key size={32} className="text-luma-coral" />
                </div>
            </motion.div>
            <motion.p 
                className="empty-state-title text-base font-semibold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                No results yet
            </motion.p>
            <motion.p 
                className="empty-state-subtitle text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                Results will appear here
            </motion.p>
        </motion.div>
    );
}

/**
 * Default Loading State - Modern Animated Style
 */
function DefaultLoadingState() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.div 
                className="loading-spinner mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
                <div className="loading-spinner-track" />
                <div className="loading-spinner-fill" />
            </motion.div>
            <motion.p 
                className="loading-text"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                Processing...
            </motion.p>
        </motion.div>
    );
}

/**
 * ResultItem - Wrapper for individual result items with animation
 */
export const ResultItem = React.forwardRef(function ResultItem({ children, id }, ref) {
    return (
        <motion.div
            ref={ref}
            key={id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
        >
            {children}
        </motion.div>
    );
});

/**
 * ProgressBar - Progress indicator for batch operations
 * Warm Luma theme with orange gradient fill
 */
export function ProgressBar({ current, total, className }) {
    const percent = total > 0 ? (current / total) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn("space-y-2", className)}
        >
            {/* Progress track - warm gray background */}
            <div className="h-1.5 rounded-full overflow-hidden bg-gray-200/70 dark:bg-gray-700/70">
                {/* Progress fill - coral gradient using CSS variables */}
                <motion.div
                    className="h-full rounded-full progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.2 }}
                />
            </div>
            <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400 font-mono">{current} / {total}</span>
                <span className="text-luma-coral font-medium">{Math.round(percent)}%</span>
            </div>
        </motion.div>
    );
}
