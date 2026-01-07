import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  ArrowUpRight, 
  Gift, 
  CreditCard, 
  Users, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { getGatewayLabel } from '@/components/ui/result-card-parts';

const API_BASE = '/api';
const PAGE_SIZE = 15;

/**
 * TransactionHistory - Premium Dual-Theme Transaction Ledger
 * 
 * LIGHT MODE: Vintage Banking Ledger
 * - Aged parchment rows with ink entries
 * - Copper accents and wax seal icons
 * - Ruled ledger lines with serif numbering
 * - Embossed amount typography
 * 
 * DARK MODE: Aurora Data Terminal
 * - Glass morphism rows with neon accents
 * - Holographic transaction badges
 * - Aurora gradient amounts
 * - Scan line effects on hover
 */

const transactionTypes = {
  purchase: { 
    icon: CreditCard, 
    label: 'Purchase',
    light: { color: 'hsl(145,45%,40%)', bg: 'hsl(145,40%,94%)' },
    dark: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    aurora: 'from-emerald-400 to-teal-400'
  },
  usage: { 
    icon: Zap, 
    label: 'Usage',
    light: { color: 'hsl(355,55%,50%)', bg: 'hsl(355,50%,95%)' },
    dark: { color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
    aurora: 'from-rose-400 to-pink-400'
  },
  claim: { 
    icon: Gift, 
    label: 'Claim',
    light: { color: 'hsl(270,50%,50%)', bg: 'hsl(270,45%,95%)' },
    dark: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    aurora: 'from-violet-400 to-purple-400'
  },
  bonus: { 
    icon: Sparkles, 
    label: 'Bonus',
    light: { color: 'hsl(40,70%,45%)', bg: 'hsl(45,60%,94%)' },
    dark: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    aurora: 'from-amber-400 to-yellow-400'
  },
  referral: { 
    icon: Users, 
    label: 'Referral',
    light: { color: 'hsl(200,60%,45%)', bg: 'hsl(200,55%,94%)' },
    dark: { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
    aurora: 'from-cyan-400 to-blue-400'
  },
  starter: { 
    icon: Sparkles, 
    label: 'Starter',
    light: { color: 'hsl(185,55%,42%)', bg: 'hsl(185,50%,94%)' },
    dark: { color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)' },
    aurora: 'from-teal-400 to-cyan-400'
  },
  refund: { 
    icon: ArrowUpRight, 
    label: 'Refund',
    light: { color: 'hsl(145,45%,40%)', bg: 'hsl(145,40%,94%)' },
    dark: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    aurora: 'from-emerald-400 to-green-400'
  }
};

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Premium Transaction Row
 */
function TransactionRow({ transaction, index }) {
  const typeConfig = transactionTypes[transaction.type] || transactionTypes.usage;
  const TypeIcon = typeConfig.icon;
  const isPositive = transaction.amount > 0;
  const wasStopped = transaction.was_stopped;
  const hasCardInfo = transaction.total_cards != null;

  const shortDesc = (transaction.description || '')
    .replace(/^Batch\s+[\w\s]+:\s*/i, '')
    .replace(/\s+via\s+[\w\s-]+$/i, '')
    .replace('Daily credit claim', 'Daily Claim')
    .replace('Starter credits', 'Starter Bonus')
    .replace('Referral bonus', 'Referral')
    .replace('Card validation', 'Validation');

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={cn(
        "group relative flex items-center gap-2 sm:gap-3 px-2 py-2 sm:px-3 sm:py-2.5",
        "transition-all duration-200",
        // Light: Ledger row with ruled line
        "border-b border-[hsl(35,25%,88%)]",
        "hover:bg-[hsl(40,40%,97%)]",
        // Dark: Glass row with aurora hover
        "dark:border-white/[0.04]",
        "dark:hover:bg-white/[0.03]",
        wasStopped && "bg-amber-50/50 dark:bg-amber-500/[0.05]"
      )}
    >
      {/* Ledger line number - light mode - hidden on mobile */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-6 sm:w-8 hidden sm:flex items-center justify-center",
        "border-r border-[hsl(30,20%,85%)]",
        "bg-[hsl(38,35%,96%)]",
        "dark:!hidden"
      )}>
        <span className="text-[8px] sm:text-[9px] font-serif text-[hsl(25,20%,60%)] tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      
      {/* Scan line on hover - dark mode */}
      <motion.div
        className="absolute inset-0 pointer-events-none hidden dark:group-hover:block overflow-hidden"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        <motion.div
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 0.8, ease: 'linear' }}
        />
      </motion.div>

      {/* Content wrapper - offset for ledger number in light mode on desktop only */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:ml-6 dark:ml-0">
        {/* Icon Container */}
        <div className="relative flex-shrink-0">
          {/* Icon background */}
          <div 
            className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center",
              "transition-all duration-200",
              // Light: Wax seal effect
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_3px_rgba(0,0,0,0.1)]",
              // Dark: Aurora glow on hover
              "dark:shadow-none dark:group-hover:shadow-[0_0_12px_-3px_rgba(139,92,246,0.4)]"
            )}
            style={{
              backgroundColor: wasStopped 
                ? 'hsl(45,80%,92%)' 
                : typeConfig.light.bg,
            }}
          >
            {wasStopped ? (
              <AlertTriangle 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4" 
                style={{ color: 'hsl(40,80%,45%)' }}
              />
            ) : (
              <TypeIcon 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 dark:drop-shadow-[0_0_4px_currentColor]" 
                style={{ color: typeConfig.light.color }}
              />
            )}
          </div>
          
          {/* Dark mode uses different colors */}
          <div 
            className={cn(
              "absolute inset-0 w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg hidden dark:flex items-center justify-center",
              "transition-all duration-200",
              "dark:group-hover:shadow-[0_0_12px_-3px_rgba(139,92,246,0.4)]"
            )}
            style={{ backgroundColor: wasStopped ? 'rgba(251,191,36,0.12)' : typeConfig.dark.bg }}
          >
            {wasStopped ? (
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <TypeIcon 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_4px_currentColor]" 
                style={{ color: typeConfig.dark.color }}
              />
            )}
          </div>
        </div>

        {/* Description + Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={cn(
              "text-xs sm:text-sm font-medium truncate",
              // Light: Ink text
              "text-[hsl(25,30%,25%)]",
              "[text-shadow:0_0.5px_0_rgba(255,255,255,0.5)]",
              // Dark
              "dark:text-white/90 dark:[text-shadow:none]"
            )}>
              {shortDesc || typeConfig.label}
            </span>
            
            {/* Gateway badge - hidden on very small screens */}
            {transaction.gateway_id && (
              <span className={cn(
                "hidden xs:inline-flex flex-shrink-0 text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded",
                // Light: Copper tag
                "bg-[hsl(35,40%,92%)] text-[hsl(25,35%,45%)]",
                "border border-[hsl(30,30%,85%)]",
                // Dark: Aurora glass
                "dark:bg-white/[0.06] dark:text-violet-300/80",
                "dark:border-white/[0.08]"
              )}>
                {getGatewayLabel(transaction.gateway_id)}
              </span>
            )}
          </div>
          
          {/* Cards progress + time */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
            {hasCardInfo && (
              <span className={cn(
                "text-[9px] sm:text-[10px] font-medium",
                transaction.processed_cards === transaction.total_cards
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[hsl(25,20%,55%)] dark:text-white/40"
              )}>
                {transaction.processed_cards}/{transaction.total_cards}
              </span>
            )}
            <span className={cn(
              "text-[9px] sm:text-[10px] truncate",
              "text-[hsl(25,15%,60%)] dark:text-white/30"
            )}>
              {formatFullDate(transaction.created_at)}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <div className={cn(
            "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center",
            isPositive 
              ? "bg-emerald-100 dark:bg-emerald-500/15" 
              : "bg-rose-100 dark:bg-rose-500/15"
          )}>
            {isPositive ? (
              <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          
          <span className={cn(
            "text-xs sm:text-sm font-bold tabular-nums min-w-[45px] sm:min-w-[60px] text-right",
            // Light: Embossed ink
            isPositive 
              ? "text-emerald-700 [text-shadow:0_0.5px_0_rgba(255,255,255,0.6)]" 
              : "text-rose-700 [text-shadow:0_0.5px_0_rgba(255,255,255,0.6)]",
            // Dark: Aurora glow
            isPositive
              ? "dark:text-emerald-400 dark:[text-shadow:0_0_8px_rgba(52,211,153,0.4)]"
              : "dark:text-rose-400 dark:[text-shadow:0_0_8px_rgba(251,113,133,0.4)]"
          )}>
            {isPositive ? '+' : ''}{Math.abs(transaction.amount).toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Pagination Controls
 */
function Pagination({ page, totalPages, onPrev, onNext, isLoading }) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3",
      // Light: Ledger footer
      "bg-[hsl(38,35%,96%)]",
      // Dark: Glass footer
      "dark:bg-white/[0.02]"
    )}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        disabled={page <= 1 || isLoading}
        className={cn(
          "h-6 w-6 sm:h-7 sm:w-7 rounded-md sm:rounded-lg",
          // Light
          "bg-[hsl(40,40%,94%)] border border-[hsl(30,25%,82%)]",
          "hover:bg-[hsl(40,45%,90%)]",
          // Dark
          "dark:bg-white/[0.04] dark:border-white/[0.08]",
          "dark:hover:bg-white/[0.08] dark:hover:border-violet-400/30"
        )}
      >
        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>
      
      <div className={cn(
        "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg",
        // Light: Copper badge
        "bg-[hsl(35,45%,93%)] border border-[hsl(30,30%,80%)]",
        // Dark: Aurora badge
        "dark:bg-violet-500/10 dark:border-violet-400/20"
      )}>
        <span className={cn(
          "text-[10px] sm:text-xs font-semibold tabular-nums",
          "text-[hsl(25,40%,40%)] dark:text-violet-300"
        )}>
          {page}
        </span>
        <span className="text-[10px] sm:text-xs text-[hsl(25,20%,60%)] dark:text-white/30">/</span>
        <span className={cn(
          "text-[10px] sm:text-xs tabular-nums",
          "text-[hsl(25,20%,55%)] dark:text-white/50"
        )}>
          {totalPages}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={page >= totalPages || isLoading}
        className={cn(
          "h-6 w-6 sm:h-7 sm:w-7 rounded-md sm:rounded-lg",
          "bg-[hsl(40,40%,94%)] border border-[hsl(30,25%,82%)]",
          "hover:bg-[hsl(40,45%,90%)]",
          "dark:bg-white/[0.04] dark:border-white/[0.08]",
          "dark:hover:bg-white/[0.08] dark:hover:border-violet-400/30"
        )}
      >
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>
    </div>
  );
}

/**
 * Empty State
 */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center"
    >
      <div className={cn(
        "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4",
        // Light: Vintage book
        "bg-gradient-to-br from-[hsl(38,40%,94%)] to-[hsl(35,35%,90%)]",
        "border border-[hsl(30,30%,82%)]",
        "shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_2px_8px_rgba(101,67,33,0.1)]",
        // Dark: Aurora glass (bg-none resets light gradient)
        "dark:bg-none dark:bg-white/[0.04] dark:border-white/[0.08]"
      )}>
        <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-[hsl(25,25%,55%)] dark:text-white/30" />
      </div>
      <p className={cn(
        "text-xs sm:text-sm font-medium",
        "text-[hsl(25,25%,45%)] dark:text-white/50"
      )}>
        No transactions yet
      </p>
      <p className={cn(
        "text-[10px] sm:text-xs mt-1",
        "text-[hsl(25,20%,60%)] dark:text-white/30"
      )}>
        Your credit history will appear here
      </p>
    </motion.div>
  );
}

/**
 * Loading State
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8 sm:py-12">
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className={cn(
            "w-5 h-5 sm:w-6 sm:h-6",
            "text-[hsl(28,50%,50%)] dark:text-violet-400"
          )} />
        </motion.div>
        <span className="text-[10px] sm:text-xs text-[hsl(25,20%,55%)] dark:text-white/40">
          Loading history...
        </span>
      </div>
    </div>
  );
}

/**
 * TransactionHistory Component
 * 
 * @param maxHeight - Set to enable internal scrolling. Leave undefined to let parent handle scroll.
 */
export function TransactionHistory({ className, maxHeight }) {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, hasMore: false });

  const fetchHistory = useCallback(async (page = 1) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * PAGE_SIZE;
      const response = await fetch(
        `${API_BASE}/credits/history?limit=${PAGE_SIZE}&offset=${offset}`,
        { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          setTransactions(data.transactions || []);
          setPagination({ page, total: data.total || 0, hasMore: data.hasMore || false });
        }
      } else {
        setError('Failed to load history');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  if (!isAuthenticated) return null;

  const totalPages = Math.ceil(pagination.total / PAGE_SIZE);

  return (
    <div className={cn(
      "rounded-xl sm:rounded-2xl overflow-hidden",
      // Light: Vintage ledger book
      "bg-gradient-to-b from-[hsl(40,45%,97%)] to-[hsl(38,40%,95%)]",
      "border sm:border-2 border-[hsl(30,35%,78%)]",
      "shadow-[inset_0_0_0_1px_hsl(38,40%,94%),0_4px_20px_rgba(101,67,33,0.12)]",
      // Dark: Aurora glass panel
      "dark:bg-none dark:bg-[rgba(15,20,30,0.6)]",
      "dark:border dark:border-white/[0.08]",
      "dark:shadow-[0_0_40px_-10px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3",
        // Light: Ledger header with ruled line
        "bg-gradient-to-r from-[hsl(38,40%,94%)] via-[hsl(40,45%,96%)] to-[hsl(38,40%,94%)]",
        "border-b sm:border-b-2 border-[hsl(30,30%,80%)]",
        // Dark: Aurora header
        "dark:bg-gradient-to-r dark:from-violet-500/[0.08] dark:via-transparent dark:to-cyan-500/[0.05]",
        "dark:border-b dark:border-white/[0.08]"
      )}>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Icon container */}
          <div className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center",
            // Light: Copper wax seal
            "bg-gradient-to-br from-[hsl(28,55%,55%)] to-[hsl(25,50%,45%)]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(166,100,50,0.3)]",
            // Dark: Aurora glow
            "dark:bg-gradient-to-br dark:from-violet-500/20 dark:to-cyan-500/10",
            "dark:border dark:border-violet-400/30",
            "dark:shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          )}>
            <History className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white dark:text-violet-300" />
          </div>
          
          <div>
            <h3 className={cn(
              "text-xs sm:text-sm font-bold",
              // Light: Embossed ink
              "text-[hsl(25,35%,25%)]",
              "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
              // Dark
              "dark:text-white dark:[text-shadow:none]"
            )}>
              Transaction History
            </h3>
            <p className="text-[9px] sm:text-[10px] text-[hsl(25,20%,55%)] dark:text-white/40">
              {pagination.total} total entries
            </p>
          </div>
        </div>
        
        {/* Refresh button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchHistory(pagination.page)}
          disabled={isLoading}
          className={cn(
            "h-7 w-7 sm:h-8 sm:w-8 rounded-lg",
            // Light
            "bg-[hsl(40,40%,94%)] border border-[hsl(30,25%,82%)]",
            "hover:bg-[hsl(40,45%,90%)]",
            // Dark
            "dark:bg-white/[0.04] dark:border-white/[0.08]",
            "dark:hover:bg-violet-500/10 dark:hover:border-violet-400/30"
          )}
        >
          <RefreshCw className={cn(
            "w-3 h-3 sm:w-3.5 sm:h-3.5",
            isLoading && "animate-spin",
            "text-[hsl(25,35%,45%)] dark:text-violet-400"
          )} />
        </Button>
      </div>

      {/* Content - Conditionally scrollable */}
      {maxHeight ? (
        // With maxHeight: use internal ScrollArea
        <div className="overflow-hidden" style={{ maxHeight }}>
          <ScrollArea className="h-full">
            <AnimatePresence mode="wait">
              {isLoading && transactions.length === 0 ? (
                <LoadingState />
              ) : transactions.length === 0 ? (
                <EmptyState />
              ) : (
                <div>
                  {transactions.map((tx, index) => (
                    <TransactionRow key={tx.id} transaction={tx} index={index} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>
      ) : (
        // Without maxHeight: let parent handle scroll
        <AnimatePresence mode="wait">
          {isLoading && transactions.length === 0 ? (
            <LoadingState />
          ) : transactions.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {transactions.map((tx, index) => (
                <TransactionRow key={tx.id} transaction={tx} index={index} />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t-2 border-[hsl(30,30%,85%)] dark:border-white/[0.06]">
          <Pagination
            page={pagination.page}
            totalPages={totalPages}
            onPrev={() => fetchHistory(pagination.page - 1)}
            onNext={() => fetchHistory(pagination.page + 1)}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mx-2 mb-2 sm:mx-3 sm:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs text-center",
            // Light
            "bg-[hsl(355,50%,95%)] border border-[hsl(355,40%,85%)]",
            "text-[hsl(355,50%,40%)]",
            // Dark
            "dark:bg-rose-500/10 dark:border-rose-400/20",
            "dark:text-rose-400"
          )}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}

export default TransactionHistory;
