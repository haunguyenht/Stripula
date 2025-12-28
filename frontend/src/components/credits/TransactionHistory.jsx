import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Gift, 
  CreditCard, 
  Users, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertTriangle,
  StopCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { spring } from '@/lib/motion';

/**
 * TransactionHistory Component
 * Displays paginated transaction list with batch tracking info
 * 
 * Design: OrangeAI (light) + OPUX glass (dark)
 */

const API_BASE = '/api';
const PAGE_SIZE = 10;

// Transaction type configurations with theme-aware gradient colors
const transactionTypes = {
  purchase: {
    icon: CreditCard,
    label: 'Purchase',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30',
    badge: 'success'
  },
  usage: {
    icon: Zap,
    label: 'Validation',
    color: 'text-primary dark:text-primary',
    bgColor: 'bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10',
    borderColor: 'border-primary/20 dark:border-primary/30',
    badge: 'destructive'
  },
  claim: {
    icon: Gift,
    label: 'Daily Claim',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-gradient-to-br from-violet-100 to-purple-50 dark:from-violet-500/20 dark:to-purple-500/10',
    borderColor: 'border-violet-200 dark:border-violet-500/30',
    badge: 'default'
  },
  bonus: {
    icon: Sparkles,
    label: 'Bonus',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/20 dark:to-amber-500/10',
    borderColor: 'border-amber-200 dark:border-amber-500/30',
    badge: 'warning'
  },
  referral: {
    icon: Users,
    label: 'Referral',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-500/10',
    borderColor: 'border-blue-200 dark:border-blue-500/30',
    badge: 'live'
  },
  starter: {
    icon: Sparkles,
    label: 'Starter',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-500/20 dark:to-cyan-500/10',
    borderColor: 'border-cyan-200 dark:border-cyan-500/30',
    badge: 'live'
  },
  refund: {
    icon: ArrowUpRight,
    label: 'Refund',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30',
    badge: 'success'
  }
};

/**
 * Format relative time
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Stop reason display labels and colors
 */
const stopReasonConfig = {
  user_cancelled: { 
    label: 'Cancelled', 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-500/20'
  },
  credit_exhausted: { 
    label: 'No credits', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-500/20'
  },
  error: { 
    label: 'Error', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-500/20'
  },
  gateway_unavailable: { 
    label: 'Gateway down', 
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-500/20'
  }
};

/**
 * Progress bar for batch processing
 */
function BatchProgress({ processed, total, wasStopped }) {
  const percentage = total > 0 ? (processed / total) * 100 : 0;
  const isComplete = processed === total && !wasStopped;
  
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className={cn(
        "flex-1 h-1.5 rounded-full overflow-hidden",
        "bg-gray-200 dark:bg-white/10"
      )}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={spring.gentle}
          className={cn(
            "h-full rounded-full",
            isComplete 
              ? "bg-emerald-500 dark:bg-emerald-400" 
              : wasStopped 
                ? "bg-amber-500 dark:bg-amber-400"
                : "bg-primary"
          )}
        />
      </div>
      <span className={cn(
        "text-[10px] font-medium tabular-nums min-w-[3.5rem] text-right",
        isComplete 
          ? "text-emerald-600 dark:text-emerald-400"
          : wasStopped 
            ? "text-amber-600 dark:text-amber-400"
            : "text-muted-foreground"
      )}>
        {processed}/{total}
      </span>
    </div>
  );
}

/**
 * Transaction Item Component
 */
function TransactionItem({ transaction, index }) {
  const typeConfig = transactionTypes[transaction.type] || transactionTypes.usage;
  const TypeIcon = typeConfig.icon;
  const isPositive = transaction.amount > 0;
  const wasStopped = transaction.was_stopped;
  const hasCardInfo = transaction.total_cards != null;
  const stopConfig = stopReasonConfig[transaction.stop_reason];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.gentle, delay: index * 0.03 }}
      className={cn(
        "group relative p-3 rounded-xl transition-all duration-200",
        // Light mode: warm white with subtle shadow
        "bg-white border border-gray-100 shadow-sm",
        "hover:shadow-md hover:border-gray-200",
        // Dark mode: glass morphism
        "dark:bg-white/[0.03] dark:border-white/[0.06]",
        "dark:hover:bg-white/[0.05] dark:hover:border-white/[0.1]",
        // Stopped indicator
        wasStopped && "ring-1 ring-amber-400/30 dark:ring-amber-500/20"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border",
          wasStopped 
            ? "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200 dark:from-amber-500/20 dark:to-amber-500/10 dark:border-amber-500/30" 
            : cn(typeConfig.bgColor, typeConfig.borderColor)
        )}>
          {wasStopped ? (
            <StopCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">
              {transaction.description || typeConfig.label}
            </span>
            {transaction.gateway_id && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] px-1.5 py-0 font-medium",
                  "border-gray-200 dark:border-white/10"
                )}
              >
                {transaction.gateway_id}
              </Badge>
            )}
          </div>
          
          {/* Time and stop reason */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(transaction.created_at)}
            </span>
            {wasStopped && stopConfig && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                stopConfig.bgColor, stopConfig.color
              )}>
                <AlertTriangle className="h-2.5 w-2.5" />
                {stopConfig.label}
              </span>
            )}
          </div>

          {/* Batch progress bar */}
          {hasCardInfo && (
            <BatchProgress 
              processed={transaction.processed_cards} 
              total={transaction.total_cards}
              wasStopped={wasStopped}
            />
          )}
        </div>

        {/* Amount */}
        <div className="flex flex-col items-end">
          <span className={cn(
            "font-bold text-sm tabular-nums",
            isPositive 
              ? "text-emerald-600 dark:text-emerald-400" 
              : "text-red-600 dark:text-red-400"
          )}>
            {isPositive ? '+' : ''}{Math.abs(transaction.amount).toLocaleString()}
          </span>
          <span className={cn(
            "text-[10px] tabular-nums",
            "text-muted-foreground/70"
          )}>
            → {transaction.balance_after?.toLocaleString() ?? '—'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function TransactionHistory({ className, maxHeight = '400px' }) {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false
  });

  /**
   * Fetch transaction history
   */
  const fetchHistory = useCallback(async (page = 1) => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * PAGE_SIZE;
      const response = await fetch(
        `${API_BASE}/credits/history?limit=${PAGE_SIZE}&offset=${offset}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          setTransactions(data.transactions || []);
          setPagination({
            page,
            total: data.total || 0,
            hasMore: data.hasMore || false
          });
        }
      } else {
        setError('Failed to load transaction history');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch on mount
  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const totalPages = Math.ceil(pagination.total / PAGE_SIZE);

  return (
    <Card 
      variant="elevated" 
      className={cn(
        "overflow-hidden",
        // Light: warm card style
        "bg-white border-gray-200",
        // Dark: glass morphism
        "dark:bg-white/[0.02] dark:border-white/[0.06]",
        className
      )}
    >
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-xl border",
              "bg-gradient-to-br from-primary/10 to-primary/5",
              "dark:from-primary/20 dark:to-primary/10",
              "border-primary/20 dark:border-primary/30"
            )}>
              <History className="h-4 w-4 text-primary" />
            </div>
            Transaction History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchHistory(pagination.page)}
            disabled={isLoading}
            className={cn(
              "h-8 w-8 p-0 rounded-lg",
              "hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Transaction list */}
        <ScrollArea style={{ maxHeight }} className="px-3 py-3">
          {isLoading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-12 text-center rounded-xl",
              "bg-gray-50 dark:bg-white/[0.02]"
            )}>
              <div className={cn(
                "p-3 rounded-full mb-3",
                "bg-gray-100 dark:bg-white/[0.05]"
              )}>
                <History className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Your credit activity will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, index) => (
                <TransactionItem key={tx.id} transaction={tx} index={index} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={cn(
            "flex items-center justify-between px-4 py-3",
            "border-t border-gray-100 dark:border-white/[0.06]",
            "bg-gray-50/50 dark:bg-white/[0.01]"
          )}>
            <span className="text-xs text-muted-foreground font-medium">
              Page {pagination.page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchHistory(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg",
                  "hover:bg-gray-200 dark:hover:bg-white/[0.08]",
                  "disabled:opacity-30"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchHistory(pagination.page + 1)}
                disabled={pagination.page >= totalPages || isLoading}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg",
                  "hover:bg-gray-200 dark:hover:bg-white/[0.08]",
                  "disabled:opacity-30"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className={cn(
            "mx-3 mb-3 px-3 py-2 rounded-lg",
            "bg-red-50 dark:bg-red-500/10",
            "border border-red-200 dark:border-red-500/20"
          )}>
            <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium">
              {error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TransactionHistory;
