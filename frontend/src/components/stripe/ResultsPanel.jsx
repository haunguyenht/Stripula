import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Trash2, RefreshCw, Key, Copy } from 'lucide-react';
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
import { VirtualResultsList } from '@/components/ui/virtual-list';
import { cn } from '@/lib/utils';

// Threshold for enabling virtualization
const VIRTUALIZATION_THRESHOLD = 30;

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
}) {
  const safeStats = Array.isArray(stats) ? stats : [];
  
  // Determine if we should use virtualization
  const useVirtualization = useMemo(() => {
    return items && items.length > VIRTUALIZATION_THRESHOLD;
  }, [items]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ResultsHeader>
        <div className="flex items-center justify-between gap-2">
          {/* Stats - scrollable on overflow */}
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
            <StatPillGroup
              stats={safeStats}
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
              className="flex-nowrap"
            />
          </div>

          {/* Actions - always icon only for consistency */}
          <div className="flex items-center gap-0.5 shrink-0">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh all"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </Button>
            )}
            {onCopyAllPK && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onCopyAllPK}
                disabled={isLoading}
                title="Copy all PK keys"
              >
                <span className="text-[10px] font-semibold">PK</span>
              </Button>
            )}
            {onCopyAllSK && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onCopyAllSK}
                disabled={isLoading}
                title="Copy all SK keys"
              >
                <span className="text-[10px] font-semibold">SK</span>
              </Button>
            )}
            {onCopyAll && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onCopyAll}
                disabled={isLoading}
                title="Copy all (filtered)"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            {onClear && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClear}
                disabled={isLoading}
                title="Clear results"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </ResultsHeader>

      <ResultsContent className="flex-1 min-h-0">
        {isLoading && isEmpty ? (
          loadingState || <DefaultLoadingState />
        ) : isEmpty ? (
          emptyState || <DefaultEmptyState />
        ) : useVirtualization && items && renderItem ? (
          <VirtualResultsList
            items={items}
            renderItem={renderItem}
            getItemKey={getItemKey}
            estimateSize={estimateItemSize}
            overscan={5}
          />
        ) : (
          <div className="space-y-3">
            {children}
          </div>
        )}
      </ResultsContent>

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
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div 
        className="relative mb-6"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Key className="h-8 w-8 text-muted-foreground" />
        </div>
      </motion.div>
      <p className="text-lg font-semibold">No results yet</p>
      <p className="text-sm text-muted-foreground mt-1">Results will appear here</p>
    </motion.div>
  );
}

function DefaultLoadingState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.p 
        className="text-sm text-muted-foreground"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Processing...
      </motion.p>
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
