import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Trash2, RefreshCw, Copy, CreditCard } from 'lucide-react';
import { ResultsHeader, ResultsContent, ResultsFooter } from '../layout/panels/ResultsPanelSections';
import { StatPillGroup } from '@/components/ui/stat-pill';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VirtualResultsList, useVirtualization } from '@/components/ui/virtual-list';
import { cn } from '@/lib/utils';

// Threshold for enabling virtualization (Requirements 3.1)
const VIRTUALIZATION_THRESHOLD = 50;

/**
 * ResultsPanel - Results panel with stats bar, list, and pagination
 * Supports virtual scrolling for large result sets
 */
export function ResultsPanel({
  stats,
  activeFilter,
  onFilterChange,
  children,
  // Virtual list props (optional - for large lists)
  items,
  renderItem,
  getItemKey,
  estimateItemSize = 120,
  // Pagination props
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  onClear,
  onRefresh,
  onCopyAllSK,
  onCopyAllPK,
  onCopyAll,
  isLoading,
  isEmpty,
  emptyState,
  loadingState,
  className,
  // Custom header actions (e.g., ExportButton)
  headerActions,
}) {
  const safeStats = Array.isArray(stats) ? stats : [];
  
  // Determine if we should use virtualization (Requirements 3.1)
  const shouldVirtualize = useVirtualization(items?.length || 0, VIRTUALIZATION_THRESHOLD);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ResultsHeader>
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          {/* Stats - wraps on mobile, scrollable on overflow */}
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none order-1">
            <StatPillGroup
              stats={safeStats}
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
              className="flex-nowrap gap-0.5 sm:gap-1"
            />
          </div>

          {/* Actions - moves to second row on very small screens */}
          <div className="flex items-center gap-0 sm:gap-0.5 shrink-0 order-2">
            {/* Custom header actions (e.g., ExportButton) */}
            {headerActions}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7"
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh all"
              >
                <RefreshCw className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", isLoading && "animate-spin")} />
              </Button>
            )}
            {onCopyAllPK && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7"
                onClick={onCopyAllPK}
                disabled={isLoading}
                title="Copy all PK keys"
              >
                <span className="text-[9px] sm:text-[10px] font-semibold">PK</span>
              </Button>
            )}
            {onCopyAllSK && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7"
                onClick={onCopyAllSK}
                disabled={isLoading}
                title="Copy all SK keys"
              >
                <span className="text-[9px] sm:text-[10px] font-semibold">SK</span>
              </Button>
            )}
            {onCopyAll && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7"
                onClick={onCopyAll}
                disabled={isLoading}
                title="Copy all (filtered)"
              >
                <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            )}
            {onClear && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7"
                onClick={onClear}
                disabled={isLoading}
                title="Clear results"
              >
                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </ResultsHeader>

      {shouldVirtualize && items && renderItem ? (
        // Virtual list needs its own scroll container
        <div className="flex-1 min-h-0 overflow-auto p-4">
          {isLoading && isEmpty ? (
            loadingState || <DefaultLoadingState />
          ) : isEmpty ? (
            emptyState || <DefaultEmptyState />
          ) : (
            <VirtualResultsList
              items={items}
              renderItem={renderItem}
              getItemKey={getItemKey}
              estimateSize={estimateItemSize}
              overscan={5}
            />
          )}
        </div>
      ) : (
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
      )}

      {/* Show pagination when there are multiple pages OR items exceed minimum page size */}
      {(totalPages > 1 || (items?.length > 10 && onPageSizeChange)) && (
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

function Pagination({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) {
  return (
    <div className="flex items-center justify-center gap-4">
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium">{currentPage}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{totalPages || 1}</span>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DefaultEmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border border-dashed border-muted-foreground/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full border border-dashed border-muted-foreground/10" />
      </div>
      
      <motion.div 
        className="relative mb-6"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Glow behind icon */}
        <div className="absolute inset-0 rounded-2xl bg-primary/10 dark:bg-[#AB726F]/20 blur-xl scale-150" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgb(248,247,247)] to-white dark:from-white/10 dark:to-white/5 border border-[rgb(237,234,233)] dark:border-white/10">
          <CreditCard className="h-7 w-7 text-muted-foreground" />
        </div>
      </motion.div>
      <p className="text-base font-semibold text-foreground">No results yet</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
        Enter cards and start validation to see results
      </p>
    </motion.div>
  );
}

function DefaultLoadingState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Decorative background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
        <motion.div
          className="h-32 w-32 rounded-full bg-primary/10 dark:bg-[#AB726F]/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      
      {/* Card icon with orbit spinner */}
      <div className="relative mb-6">
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/10 dark:to-white/5"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CreditCard className="h-7 w-7 text-primary dark:text-white/70" />
        </motion.div>
        {/* Orbiting dot */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-primary dark:bg-[#AB726F] shadow-lg shadow-primary/50 dark:shadow-[#AB726F]/50" />
        </motion.div>
      </div>
      
      <motion.p 
        className="text-sm font-medium text-foreground"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        Processing cards...
      </motion.p>
      <p className="text-xs text-muted-foreground mt-1">
        Results will appear as they complete
      </p>
    </motion.div>
  );
}

/**
 * ResultItem - Wrapper for individual result items
 */
export const ResultItem = React.memo(React.forwardRef(function ResultItem({ children }, ref) {
  return (
    <div ref={ref}>
      {children}
    </div>
  );
}));

/**
 * ProgressBar - Progress indicator for batch operations
 * OPUX styled with glass effect in dark mode
 */
export function ProgressBar({ current, total, className }) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("space-y-2 py-1", className)}
    >
      {/* Progress track */}
      <div className="h-2 rounded-full overflow-hidden bg-muted dark:bg-white/10 relative">
        {/* Animated fill */}
        <motion.div
          className="h-full rounded-full bg-primary dark:bg-gradient-to-r dark:from-primary dark:to-primary/70"
          style={{ width: `${percent}%` }}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.2, ease: "linear" }}
        />
        {/* Glow effect overlay */}
        <div 
          className="absolute inset-0 rounded-full dark:shadow-[inset_0_0_8px_hsl(var(--primary)/0.3)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      {/* Progress text */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground dark:text-white/60 font-mono tabular-nums">
          {current} / {total}
        </span>
        <span className="font-medium dark:text-white/90 tabular-nums">
          {Math.round(percent)}%
        </span>
      </div>
    </motion.div>
  );
}
