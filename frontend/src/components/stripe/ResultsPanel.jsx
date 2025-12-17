import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trash2, RefreshCw, Key, Copy } from 'lucide-react';
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
    pageSize,
    onPageSizeChange,
    
    // Actions
    onClear,
    onRefresh,
    onCopyAllSK,
    onCopyAllPK,
    onCopyAll,
    
    // State
    isLoading,
    isEmpty,
    emptyState,
    loadingState,
    
    className,
}) {
    const safeStats = Array.isArray(stats) ? stats : [];

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header - Pills | Actions */}
            <ResultsHeader>
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Filter Pills */}
                    <div className="flex-1 flex justify-start min-w-0">
                        <StatPillGroup
                            stats={safeStats}
                            activeFilter={activeFilter}
                            onFilterChange={onFilterChange}
                        />
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
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
                        {onCopyAllPK && (
                            <button
                                onClick={onCopyAllPK}
                                className="action-btn-copy-pk !px-2 !py-1.5"
                                disabled={isLoading}
                                title="Copy all PK keys"
                            >
                                <Copy size={12} />
                                <span className="text-[9px] font-semibold">PK</span>
                            </button>
                        )}
                        {onCopyAllSK && (
                            <button
                                onClick={onCopyAllSK}
                                className="action-btn-copy-sk !px-2 !py-1.5"
                                disabled={isLoading}
                                title="Copy all SK keys"
                            >
                                <Copy size={12} />
                                <span className="text-[9px] font-semibold">SK</span>
                            </button>
                        )}
                        {onCopyAll && (
                            <button
                                onClick={onCopyAll}
                                className="action-btn-glass !px-2 !py-1.5"
                                disabled={isLoading}
                                title="Copy all (filtered)"
                            >
                                <Copy size={14} />
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
            <ResultsContent className="flex-1 min-h-0">
                {isLoading && isEmpty ? (
                    loadingState || <DefaultLoadingState />
                ) : isEmpty ? (
                    emptyState || <DefaultEmptyState />
                ) : (
                    <div className="space-y-3">
                        {children}
                    </div>
                )}
            </ResultsContent>

            {/* Pagination */}
            {(totalPages > 1 || onPageSizeChange) && (
                <ResultsFooter>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        pageSize={pageSize}
                        onPageSizeChange={onPageSizeChange}
                    />
                </ResultsFooter>
            )}
        </div>
    );
}

/**
 * Pagination Component - Modern Glass Style with Page Size Selector
 */
function Pagination({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) {
    return (
        <div className="flex items-center justify-center gap-3">
            {/* Page Size Selector */}
            {onPageSizeChange && (
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="pagination-select"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            )}
            
            {/* Page Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2">
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
                    <span className="pagination-text">{totalPages || 1}</span>
                </div>
                
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="pagination-btn"
                >
                    <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                </button>
            </div>
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
 * ResultItem - Wrapper for individual result items (lightweight for performance)
 */
export const ResultItem = React.memo(React.forwardRef(function ResultItem({ children, id }, ref) {
    return (
        <div ref={ref} className="result-item-enter">
            {children}
        </div>
    );
}));

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
