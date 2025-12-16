import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Trash2, RefreshCw, LayoutGrid, Key } from 'lucide-react';
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
    // Use the "all" stat value for total count, or find the first stat with id "all"
    const allStat = safeStats.find(stat => stat.id === 'all');
    const totalCount = allStat ? Number(allStat.value) || 0 : safeStats.reduce((sum, stat) => sum + (Number(stat.value) || 0), 0);
    const isChecking = Boolean(isLoading);

    return (
        <div className={cn("flex flex-col", className)}>
            {/* Header - Modern Glass Style */}
            <ResultsHeader>
                {/* Title Row */}
                <div className="flex items-center justify-between mb-5">
                    <motion.div 
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <motion.div 
                            className="results-header-icon"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                            <LayoutGrid size={22} className="text-white" />
                        </motion.div>
                        <div>
                            <h2 className="results-title">{title}</h2>
                            {isChecking ? (
                                <motion.p 
                                    className="results-processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Processing...</span>
                                </motion.p>
                            ) : (
                                <p className="results-subtitle">{totalCount} total results</p>
                            )}
                        </div>
                    </motion.div>

                    <motion.div 
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        {onRefresh && (
                            <motion.button
                                onClick={onRefresh}
                                className={cn("action-btn-glass action-btn-refresh", isLoading && "loading")}
                                disabled={isLoading}
                                title={isLoading ? "Refreshing..." : "Refresh all"}
                                whileHover={!isLoading ? { scale: 1.02 } : {}}
                                whileTap={!isLoading ? { scale: 0.98 } : {}}
                            >
                                <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
                                <span className="hidden sm:inline">{isLoading ? "Refreshing..." : "Refresh"}</span>
                            </motion.button>
                        )}
                        {onClear && (
                            <motion.button
                                onClick={onClear}
                                className={cn("action-btn-glass action-btn-clear", isLoading && "loading")}
                                disabled={isLoading}
                                whileHover={!isLoading ? { scale: 1.02 } : {}}
                                whileTap={!isLoading ? { scale: 0.98 } : {}}
                            >
                                <Trash2 size={15} />
                                <span className="hidden sm:inline">Clear</span>
                            </motion.button>
                        )}
                    </motion.div>
                </div>

                {/* Filter Pills - Modern Glass Style */}
                <StatPillGroup
                    stats={safeStats}
                    activeFilter={activeFilter}
                    onFilterChange={onFilterChange}
                />
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
        <motion.div 
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <motion.button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <ChevronLeft size={16} />
            </motion.button>
            
            <div className="pagination-info">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{currentPage}</span>
                <span className="text-sm text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{totalPages}</span>
            </div>
            
            <motion.button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <ChevronRight size={16} />
            </motion.button>
        </motion.div>
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
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-luma-coral/20 to-luma-coral-dark/10 blur-xl" />
                <div className="empty-state-icon empty-state-icon-lg relative bg-gradient-to-br from-white to-gray-50 dark:from-luma-surface dark:to-luma-surface-muted border-white/60 dark:border-white/10 shadow-lg">
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
            layout
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
