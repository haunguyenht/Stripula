import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Trash2, Key, LayoutGrid } from 'lucide-react';
import { ResultsHeader, ResultsContent, ResultsFooter } from '../layout/TwoPanelLayout';
import { StatPillGroup } from '../ui/StatPill';
import { cn } from '../../lib/utils';

/**
 * ResultsPanel - Results panel with gallery header, stats bar, list, and pagination
 * Matches the reference layout: Title + Mode Badge + Clear + Stats bar (sticky) + Results grid + Pagination
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
    
    // State
    isLoading,
    isEmpty,
    emptyState,
    loadingState,
    
    // Title
    title = 'Results',
    subtitle,
    
    className,
}) {
    const safeStats = Array.isArray(stats) ? stats : [];
    const totalCount = safeStats.reduce((sum, stat) => sum + (Number(stat.value) || 0), 0);
    const isChecking = Boolean(isLoading);

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header - Compact on mobile */}
            <ResultsHeader>
                {/* Title Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="flex h-7 w-7 md:h-9 md:w-9 items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100">
                            <LayoutGrid size={14} className="text-rose-400 md:w-4 md:h-4" />
                        </div>
                        <div>
                            <h2 className="text-xs md:text-sm font-semibold text-gray-800">{title}</h2>
                            {isChecking && (
                                <p className="flex items-center gap-1 text-[9px] md:text-[10px] text-amber-600 mt-0.5">
                                    <Loader2 size={8} className="animate-spin md:w-[10px] md:h-[10px]" />
                                    <span>Processing...</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {onClear && (
                        <button
                            onClick={onClear}
                            className="flex items-center gap-1 text-[10px] md:text-[12px] font-medium text-rose-400 hover:text-rose-500 transition-colors"
                            disabled={isLoading}
                        >
                            <Trash2 size={12} className="md:w-[14px] md:h-[14px]" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 md:gap-2 mt-2 md:mt-4 overflow-x-auto">
                    <StatPillGroup
                        stats={safeStats}
                        activeFilter={activeFilter}
                        onFilterChange={onFilterChange}
                    />
                </div>
            </ResultsHeader>

            {/* Results List */}
            <ResultsContent>
                {isLoading && isEmpty ? (
                    loadingState || <DefaultLoadingState />
                ) : isEmpty ? (
                    emptyState || <DefaultEmptyState />
                ) : (
                    <div className="space-y-2">
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
 * Pagination Component
 */
function Pagination({ currentPage, totalPages, onPageChange }) {
    return (
        <div className="flex items-center justify-center gap-3">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    "bg-white/60 border border-rose-200/50 text-gray-500 hover:text-gray-700 hover:bg-white",
                    currentPage === 1 && 'opacity-30 cursor-not-allowed'
                )}
            >
                <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-mono text-gray-500 min-w-[60px] text-center">
                {currentPage} / {totalPages}
            </span>
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    "bg-white/60 border border-rose-200/50 text-gray-500 hover:text-gray-700 hover:bg-white",
                    currentPage === totalPages && 'opacity-30 cursor-not-allowed'
                )}
            >
                <ChevronRight size={14} />
            </button>
        </div>
    );
}

/**
 * Default Empty State - Gallery style like reference (warm theme)
 */
function DefaultEmptyState() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-rose-50 border border-rose-200/50 flex items-center justify-center mb-5">
                <Key size={28} className="text-rose-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">No results yet</p>
            <p className="text-[11px] text-gray-400">Results will appear here</p>
        </motion.div>
    );
}

/**
 * Default Loading State
 */
function DefaultLoadingState() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <Loader2 size={24} className="text-orange-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-gray-500">Processing...</p>
        </motion.div>
    );
}

/**
 * ResultItem - Wrapper for individual result items with animation
 */
export function ResultItem({ children, id }) {
    return (
        <motion.div
            key={id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            layout
        >
            {children}
        </motion.div>
    );
}

/**
 * ProgressBar - Progress indicator for batch operations
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
            <div className="h-1.5 rounded-full overflow-hidden bg-orange-200/50">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.2 }}
                />
            </div>
            <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400 font-mono">{current} / {total}</span>
                <span className="text-orange-500 font-medium">{Math.round(percent)}%</span>
            </div>
        </motion.div>
    );
}
