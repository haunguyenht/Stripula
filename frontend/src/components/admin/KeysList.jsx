import { useState, useEffect, useCallback, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  Loader2, 
  Copy, 
  Check, 
  Coins, 
  Crown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  Clock,
  Infinity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useConfirmation } from '@/hooks/useConfirmation';

/**
 * KeysList Component
 * Admin list for viewing and managing generated keys
 * Redesigned with filter chips, status badges, and improved layout
 * 
 * Requirements: 3.1
 */

const API_BASE = '/api';

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'credits', label: 'Credits' },
  { value: 'tier', label: 'Tier' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status', icon: null },
  { value: 'active', label: 'Active', icon: CheckCircle, color: 'emerald' },
  { value: 'used', label: 'Used', icon: Check, color: 'blue' },
  { value: 'expired', label: 'Expired', icon: Clock, color: 'amber' },
  { value: 'revoked', label: 'Revoked', icon: XCircle, color: 'red' },
];

/**
 * Get key status and styling
 */
function getKeyStatus(key) {
  const isRevoked = key.revokedAt || key.revoked_at;
  const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
  const isFullyUsed = key.currentUses >= key.maxUses;

  if (isRevoked) {
    return { status: 'revoked', label: 'Revoked', variant: 'destructive', icon: XCircle, color: 'red' };
  }
  if (isExpired) {
    return { status: 'expired', label: 'Expired', variant: 'secondary', icon: Clock, color: 'amber' };
  }
  if (isFullyUsed) {
    return { status: 'used', label: 'Fully Used', variant: 'secondary', icon: Check, color: 'blue' };
  }
  return { status: 'active', label: 'Active', variant: 'default', icon: CheckCircle, color: 'emerald' };
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays} days`;
  return formatDate(dateString);
}

/**
 * Filter Chip Component
 */
function FilterChip({ label, isActive, onClick, icon: Icon, color }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
        isActive 
          ? color === 'emerald' ? "bg-emerald-500 text-white"
          : color === 'blue' ? "bg-blue-500 text-white"
          : color === 'amber' ? "bg-amber-500 text-white"
          : color === 'red' ? "bg-red-500 text-white"
          : "bg-primary text-primary-foreground"
          : "bg-[rgb(250,247,245)] dark:bg-white/5 text-muted-foreground hover:bg-[rgb(237,234,233)] dark:hover:bg-white/10"
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

/**
 * Key Card Component
 */
const KeyCard = forwardRef(function KeyCard({ keyItem, index, onCopy, onRevoke, copiedCode, isRevoking }, ref) {
  const { status, label, icon: StatusIcon, color } = getKeyStatus(keyItem);
  const isActive = status === 'active';
  const isCredits = keyItem.type === 'credits';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group p-4 rounded-xl transition-all duration-200",
        "bg-white dark:bg-white/[0.02]",
        "border border-[rgb(237,234,233)] dark:border-white/5",
        "hover:border-[rgb(255,64,23)]/20 dark:hover:border-white/10",
        "hover:shadow-sm dark:hover:bg-white/[0.04]",
        !isActive && "opacity-75"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
          isCredits ? "bg-amber-500/10" : "bg-purple-500/10"
        )}>
          {isCredits ? (
            <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          )}
        </div>

        {/* Key Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-sm font-mono tracking-wider text-[rgb(37,27,24)] dark:text-white">
              {keyItem.code}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onCopy(keyItem.code)}
            >
              {copiedCode === keyItem.code ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Value Badge */}
            <Badge variant="secondary" className="text-[10px] h-5">
              {isCredits ? `${keyItem.value} credits` : keyItem.value}
            </Badge>

            {/* Duration Badge (Tier keys only) */}
            {!isCredits && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] h-5",
                  keyItem.durationDays || keyItem.duration_days
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                )}
              >
                {keyItem.durationDays || keyItem.duration_days ? (
                  <><Clock className="h-3 w-3 mr-1" />{keyItem.durationDays || keyItem.duration_days}d</>
                ) : (
                  <><Infinity className="h-3 w-3 mr-1" />Lifetime</>
                )}
              </Badge>
            )}

            {/* Status Badge */}
            <Badge 
              variant={status === 'active' ? 'default' : 'secondary'}
              className={cn(
                "text-[10px] h-5",
                color === 'emerald' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                color === 'blue' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                color === 'amber' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                color === 'red' && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
              )}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {label}
            </Badge>

            {/* Uses */}
            <span className="text-muted-foreground">
              {keyItem.currentUses || keyItem.current_uses || 0}/{keyItem.maxUses || keyItem.max_uses || 1} uses
            </span>
          </div>
        </div>

        {/* Meta & Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatDate(keyItem.createdAt || keyItem.created_at)}
          </span>
          
          {keyItem.expiresAt && isActive && (
            <span className={cn(
              "text-xs",
              new Date(keyItem.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            )}>
              Expires: {formatRelativeTime(keyItem.expiresAt)}
            </span>
          )}

          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRevoke(keyItem)}
              disabled={isRevoking === keyItem.id}
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 rounded-lg"
            >
              {isRevoking === keyItem.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Revoke
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Note */}
      {keyItem.note && (
        <div className="mt-3 pt-3 border-t border-[rgb(237,234,233)] dark:border-white/5">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Note:</span> {keyItem.note}
          </p>
        </div>
      )}
    </motion.div>
  );
});

export function KeysList({ refreshTrigger }) {
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  
  const { success, error } = useToast();
  const confirmation = useConfirmation();
  const limit = 10;

  /**
   * Fetch keys from API
   */
  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`${API_BASE}/admin/keys?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        setKeys(data.keys || []);
        setTotal(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      }
    } catch (err) {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    fetchKeys();
  }, [page, typeFilter, statusFilter, refreshTrigger]);

  /**
   * Copy key code
   */
  const handleCopy = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      error('Failed to copy');
    }
  }, [error]);

  /**
   * Revoke a key
   */
  const handleRevoke = useCallback(async (key) => {
    const confirmed = await confirmation.confirm({
      title: 'Revoke Key',
      description: `Are you sure you want to revoke key "${key.code}"? This action cannot be undone.`,
      confirmText: 'Revoke',
      destructive: true
    });

    if (!confirmed) return;

    setRevokingId(key.id);
    
    try {
      const response = await fetch(`${API_BASE}/admin/keys/${key.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        success('Key revoked');
        fetchKeys();
      } else {
        error(data.message || 'Failed to revoke key');
      }
    } catch (err) {
      error('Network error');
    } finally {
      setRevokingId(null);
    }
  }, [fetchKeys, success, error, confirmation]);

  return (
    <>
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgb(237,234,233)] dark:border-white/10 bg-gradient-to-br from-[rgb(250,247,245)] to-transparent dark:from-white/[0.02] dark:to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(37,27,24)] dark:text-white flex items-center gap-2">
                  Redeem Keys
                  {total > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {total.toLocaleString()}
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">View and manage generated keys</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchKeys} 
              disabled={isLoading}
              className="rounded-xl"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-6 py-4 border-b border-[rgb(237,234,233)] dark:border-white/10">
          <div className="space-y-3">
            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-2">Type:</span>
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map(filter => (
                  <FilterChip
                    key={filter.value}
                    label={filter.label}
                    isActive={typeFilter === filter.value}
                    onClick={() => { setTypeFilter(filter.value); setPage(1); }}
                  />
                ))}
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-2">
              <div className="w-4" />
              <span className="text-xs text-muted-foreground mr-2">Status:</span>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(filter => (
                  <FilterChip
                    key={filter.value}
                    label={filter.label}
                    icon={filter.icon}
                    color={filter.color}
                    isActive={statusFilter === filter.value}
                    onClick={() => { setStatusFilter(filter.value); setPage(1); }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading keys...</p>
              </div>
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-[rgb(250,247,245)] dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Key className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-[rgb(37,27,24)] dark:text-white mb-1">No keys found</h3>
              <p className="text-sm text-muted-foreground">
                {typeFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Generate some keys to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {keys.map((key, index) => (
                  <KeyCard
                    key={key.id}
                    keyItem={key}
                    index={index}
                    onCopy={handleCopy}
                    onRevoke={handleRevoke}
                    copiedCode={copiedCode}
                    isRevoking={revokingId}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[rgb(237,234,233)] dark:border-white/10 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        {...confirmation.config}
      />
    </>
  );
}

export default KeysList;
