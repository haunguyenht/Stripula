import React, { useState, useCallback, useMemo } from 'react';
import { Key, Trash2, Copy, Check, RefreshCw, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/hooks/useToast';
import { useKeyFilters } from '@/hooks/useKeyFilters';

// Layout
import { TwoPanelLayout } from '../../layout/TwoPanelLayout';

// Components
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  ResultCard, 
  ResultCardContent, 
  ResultCardActions, 
  ResultCardLoadingOverlay 
} from '@/components/ui/result-card';
import { cn } from '@/lib/utils';

/**
 * KeysValidationPanel - Two-panel layout for key validation
 */
export function KeysValidationPanel({
  skKeys,
  setSkKeys,
  keyResults,
  setKeyResults,
  keyStats,
  setKeyStats,
  selectedKeyIndex,
  onKeySelect,
  isLoading,
  setIsLoading,
  setCurrentItem,
  abortRef,
  modeSwitcher,
  drawerOpen,
  onDrawerOpenChange,
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [refreshingKeys, setRefreshingKeys] = useState(new Set());
  const pageSize = 10;
  const { success, error: toastError, info, warning } = useToast();

  const clearResults = useCallback(() => {
    setKeyResults([]);
    setKeyStats({ live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 });
    onKeySelect(-1);
    setPage(1);
  }, [setKeyResults, setKeyStats, onKeySelect]);

  const handleCheckKeys = async () => {
    const keyLines = skKeys.split('\n').filter(l => l.trim() && l.trim().startsWith('sk_'));
    if (keyLines.length === 0) {
      warning('Enter at least one SK key');
      return;
    }

    const existingKeys = new Set(keyResults.map(r => r.fullKey));
    const uniqueKeys = keyLines.map(l => l.trim()).filter(k => !existingKeys.has(k));

    if (uniqueKeys.length === 0) {
      info('All keys already checked');
      return;
    }

    setIsLoading(true);
    abortRef.current = false;
    setProgress({ current: 0, total: uniqueKeys.length });
    info(`Starting key validation for ${uniqueKeys.length} keys`);
    const newResults = [...keyResults];
    let { live = 0, livePlus = 0, liveZero = 0, liveNeg = 0, dead = 0, error = 0 } = keyStats;
    let currentKeys = skKeys;

    for (let i = 0; i < uniqueKeys.length; i++) {
      if (abortRef.current) break;
      const key = uniqueKeys[i];
      setCurrentItem(`Checking key ${i + 1}/${uniqueKeys.length}`);
      setProgress({ current: i + 1, total: uniqueKeys.length });

      try {
        const response = await fetch('/api/stripe-own/check-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skKey: key })
        });
        const data = await response.json();

        if (data.status?.startsWith('LIVE')) {
          newResults.unshift({ key: key, fullKey: key, ...data });
          if (data.status === 'LIVE+') { live++; livePlus++; }
          else if (data.status === 'LIVE0') { live++; liveZero++; }
          else if (data.status === 'LIVE-') { live++; liveNeg++; }
          else { live++; }
        } else if (data.status === 'DEAD') {
          newResults.unshift({ key: key, fullKey: key, ...data });
          dead++;
        }
        
        currentKeys = currentKeys
          .split('\n')
          .filter(line => line.trim() !== key)
          .join('\n');
        setSkKeys(currentKeys);
        setKeyResults([...newResults]);
        setKeyStats({ live, livePlus, liveZero, liveNeg, dead, error, total: newResults.length });
      } catch (err) {
        error++;
        setKeyStats({ live, livePlus, liveZero, liveNeg, dead, error, total: newResults.length });
        toastError(`Error checking key: ${err.message}`);
      }

      if (i < uniqueKeys.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    setIsLoading(false);
    setCurrentItem(null);
    
    if (!abortRef.current) {
      success(`Key validation complete: ${live} live, ${dead} dead`);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsLoading(false);
    setCurrentItem(null);
    warning('Key validation stopped');
  };

  const handleCopyKey = useCallback((key, index) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(index);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const handleCopyAllSK = useCallback(() => {
    const allSK = keyResults.filter(r => r.fullKey).map(r => r.fullKey).join('\n');
    if (allSK) {
      navigator.clipboard.writeText(allSK);
      success(`Copied ${keyResults.filter(r => r.fullKey).length} SK keys`);
    }
  }, [keyResults, success]);

  const handleCopyAllPK = useCallback(() => {
    const allPK = keyResults.filter(r => r.pkKey).map(r => r.pkKey).join('\n');
    if (allPK) {
      navigator.clipboard.writeText(allPK);
      success(`Copied ${keyResults.filter(r => r.pkKey).length} PK keys`);
    }
  }, [keyResults, success]);

  const handleDeleteKey = useCallback((index) => {
    const deletedResult = keyResults[index];
    const updated = keyResults.filter((_, i) => i !== index);
    setKeyResults(updated);
    
    if (deletedResult?.status) {
      setKeyStats(prev => {
        const newStats = { ...prev };
        if (deletedResult.status === 'LIVE+') { newStats.live = Math.max(0, newStats.live - 1); newStats.livePlus = Math.max(0, newStats.livePlus - 1); }
        else if (deletedResult.status === 'LIVE0') { newStats.live = Math.max(0, newStats.live - 1); newStats.liveZero = Math.max(0, newStats.liveZero - 1); }
        else if (deletedResult.status === 'LIVE-') { newStats.live = Math.max(0, newStats.live - 1); newStats.liveNeg = Math.max(0, newStats.liveNeg - 1); }
        else if (deletedResult.status?.startsWith('LIVE')) { newStats.live = Math.max(0, newStats.live - 1); }
        else if (deletedResult.status === 'DEAD') { newStats.dead = Math.max(0, newStats.dead - 1); }
        else if (deletedResult.status === 'ERROR') { newStats.error = Math.max(0, newStats.error - 1); }
        newStats.total = Math.max(0, newStats.live + newStats.dead + (newStats.error || 0));
        return newStats;
      });
    }
    
    if (selectedKeyIndex === index) onKeySelect(-1);
    else if (selectedKeyIndex > index) onKeySelect(selectedKeyIndex - 1);
  }, [keyResults, setKeyResults, setKeyStats, selectedKeyIndex, onKeySelect]);

  const handleRefreshKey = useCallback(async (index) => {
    const result = keyResults[index];
    if (!result?.fullKey) return;
    
    setRefreshingKeys(prev => new Set([...prev, index]));
    try {
      const response = await fetch('/api/stripe-own/check-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skKey: result.fullKey })
      });
      
      const data = await response.json();
      
      if (data.status) {
        setKeyResults(prev => {
          const updated = [...prev];
          updated[index] = { key: result.fullKey, fullKey: result.fullKey, ...data };
          return updated;
        });
        
        if (data.status?.startsWith('LIVE')) {
          success(`Key refreshed: ${data.status}`);
        } else if (data.status === 'DEAD') {
          warning(`Key is now DEAD`);
        }
      }
    } catch (err) {
      toastError(`Refresh failed: ${err.message}`);
    }
    setRefreshingKeys(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, [keyResults, setKeyResults, success, warning, toastError]);

  const handleRefreshAll = useCallback(async () => {
    if (keyResults.length === 0 || isLoading) return;
    
    setIsLoading(true);
    setProgress({ current: 0, total: keyResults.length });
    info(`Refreshing ${keyResults.length} keys`);
    
    const allIndices = keyResults.map((_, i) => i);
    setRefreshingKeys(new Set(allIndices));
    
    let completedCount = 0;
    
    const refreshPromises = keyResults.map(async (result, index) => {
      if (!result?.fullKey) {
        completedCount++;
        setProgress({ current: completedCount, total: keyResults.length });
        return null;
      }
      
      try {
        const response = await fetch('/api/stripe-own/check-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skKey: result.fullKey })
        });
        
        const data = await response.json();
        
        setRefreshingKeys(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        
        completedCount++;
        setProgress({ current: completedCount, total: keyResults.length });
        
        if (data.status) {
          return { index, data, fullKey: result.fullKey };
        }
        return null;
      } catch (err) {
        setRefreshingKeys(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        completedCount++;
        setProgress({ current: completedCount, total: keyResults.length });
        return null;
      }
    });
    
    const results = await Promise.all(refreshPromises);
    
    const updatedResults = [...keyResults];
    results.forEach(r => {
      if (r) {
        updatedResults[r.index] = { key: r.fullKey, fullKey: r.fullKey, ...r.data };
      }
    });
    
    setKeyResults(updatedResults);
    
    const newStats = { live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 };
    updatedResults.forEach(result => {
      if (result.status === 'LIVE+') { newStats.live++; newStats.livePlus++; }
      else if (result.status === 'LIVE0') { newStats.live++; newStats.liveZero++; }
      else if (result.status === 'LIVE-') { newStats.live++; newStats.liveNeg++; }
      else if (result.status?.startsWith('LIVE')) { newStats.live++; }
      else if (result.status === 'DEAD') { newStats.dead++; }
      else if (result.status === 'ERROR') { newStats.error++; }
    });
    newStats.total = newStats.live + newStats.dead + newStats.error;
    setKeyStats(newStats);
    
    setRefreshingKeys(new Set());
    setIsLoading(false);
    setCurrentItem(null);
    
    success(`Refresh complete: ${newStats.live} live, ${newStats.dead} dead`);
  }, [keyResults, isLoading, setIsLoading, setCurrentItem, setKeyResults, setKeyStats, info, success]);

  const keyCount = useMemo(() => 
    skKeys.split('\n').filter(l => l.trim() && l.trim().startsWith('sk_')).length,
    [skKeys]
  );
  
  const filteredResults = useKeyFilters(keyResults, filter);
  
  const totalPages = useMemo(() => 
    Math.ceil(filteredResults.length / pageSize),
    [filteredResults.length, pageSize]
  );
  
  const paginatedResults = useMemo(() => 
    filteredResults.slice((page - 1) * pageSize, page * pageSize),
    [filteredResults, page, pageSize]
  );

  const stats = useMemo(() => [
    { id: 'all', label: 'All', value: keyStats.total, color: 'default' },
    { id: 'live', label: 'Live', value: keyStats.live, color: 'emerald', showDot: true },
    { id: 'dead', label: 'Dead', value: keyStats.dead, color: 'rose', showDot: true },
  ], [keyStats.total, keyStats.live, keyStats.dead]);
  
  const handleFilterChange = useCallback((id) => {
    setFilter(id);
    setPage(1);
  }, []);

  const configContent = (
    <div className="space-y-4 p-4">
      {/* Input with integrated action bar */}
      <div className="rounded-lg border border-border/10 dark:border-white/10 dark:bg-white/5 overflow-hidden transition-all duration-200 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 dark:focus-within:border-white/20 dark:focus-within:ring-primary/20">
        <Textarea
          id="sk-keys-input"
          name="sk-keys-input"
          className={cn(
            "font-mono text-xs min-h-[100px] resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "dark:bg-transparent",
            isLoading && "opacity-50"
          )}
          placeholder="Enter SK keys (one per line)&#10;sk_live_xxxxx"
          value={skKeys}
          onChange={(e) => setSkKeys(e.target.value)}
          disabled={isLoading}
        />
        
        {/* Action bar below textarea */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/10 dark:border-white/10 bg-muted/30 dark:bg-white/5">
          {/* Key count badge */}
          <div className="flex items-center gap-2">
            {keyCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-6">
                {keyCount} keys
              </Badge>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearResults}
              disabled={isLoading}
              title="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            {isLoading ? (
              <Button variant="destructive" size="sm" className="h-8" onClick={handleStop}>
                Stop
              </Button>
            ) : (
              <Button size="sm" className="h-8" onClick={handleCheckKeys}>
                Check Keys
              </Button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading && progress.total > 0 && (
          <ProgressBar key="progress" current={progress.current} total={progress.total} />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <TwoPanelLayout
      modeSwitcher={modeSwitcher}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={onDrawerOpenChange}
      configPanelWithoutSwitcher={configContent}
      configPanel={
        <div className="flex flex-col">
          {modeSwitcher && (
            <div className="p-4 border-b flex justify-center">
              {modeSwitcher}
            </div>
          )}
          {configContent}
        </div>
      }
      resultsPanel={
        <ResultsPanel
          stats={stats}
          activeFilter={filter}
          onFilterChange={handleFilterChange}
          // Virtual list props for large result sets
          items={paginatedResults}
          renderItem={(result, idx) => (
            <KeyResultCard
              key={`${result.fullKey}-${idx}`}
              result={result}
              index={idx}
              isSelected={selectedKeyIndex === idx}
              isCopied={copiedKey === idx}
              isRefreshing={refreshingKeys.has(idx)}
              onSelect={() => onKeySelect(idx)}
              onCopy={() => handleCopyKey(result.fullKey, idx)}
              onDelete={() => handleDeleteKey(idx)}
              onRefresh={() => handleRefreshKey(idx)}
            />
          )}
          getItemKey={(result, idx) => `${result.fullKey}-${idx}`}
          estimateItemSize={140}
          // Pagination props
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onClear={clearResults}
          onRefresh={keyResults.length > 0 ? handleRefreshAll : undefined}
          onCopyAllSK={keyResults.length > 0 ? handleCopyAllSK : undefined}
          onCopyAllPK={keyResults.length > 0 ? handleCopyAllPK : undefined}
          isLoading={isLoading}
          isEmpty={paginatedResults.length === 0}
          emptyState={<KeysEmptyState />}
        >
          {/* Fallback for non-virtualized rendering (small lists) */}
          {paginatedResults.map((result, idx) => (
            <ResultItem key={`${result.fullKey}-${idx}`} id={`${result.fullKey}-${idx}`}>
              <KeyResultCard
                result={result}
                index={idx}
                isSelected={selectedKeyIndex === idx}
                isCopied={copiedKey === idx}
                isRefreshing={refreshingKeys.has(idx)}
                onSelect={() => onKeySelect(idx)}
                onCopy={() => handleCopyKey(result.fullKey, idx)}
                onDelete={() => handleDeleteKey(idx)}
                onRefresh={() => handleRefreshKey(idx)}
              />
            </ResultItem>
          ))}
        </ResultsPanel>
      }
    />
  );
}

/**
 * KeyResultCard - Individual key result card using ResultCard component
 * Memoized to prevent unnecessary re-renders during mass validation
 */
const KeyResultCard = React.memo(function KeyResultCard({ result, isSelected, isCopied, isRefreshing, onSelect, onCopy, onDelete, onRefresh }) {
  const [pkCopied, setPkCopied] = useState(false);

  const handleCopyPk = useCallback((e) => {
    e.stopPropagation();
    if (result.pkKey) {
      navigator.clipboard.writeText(result.pkKey);
      setPkCopied(true);
      setTimeout(() => setPkCopied(false), 2000);
    }
  }, [result.pkKey]);

  const isLive = result.status?.startsWith('LIVE');
  const skKey = result.fullKey || result.key;
  const availableBalance = ((result.availableBalance || 0) / 100).toFixed(2);
  const pendingBalance = ((result.pendingBalance || 0) / 100).toFixed(2);
  const symbol = result.currencySymbol || '$';
  
  // Truncate key to show prefix...last4
  const truncateKey = useCallback((key) => {
    if (!key || key.length < 20) return key;
    const prefix = key.substring(0, 12); // e.g., "sk_live_51QF"
    const suffix = key.slice(-4);
    return `${prefix}...${suffix}`;
  }, []);
  
  // Map status for ResultCard
  const cardStatus = isLive ? 'LIVE' : result.status;
  
  return (
    <ResultCard
      status={cardStatus}
      isSelected={isSelected}
      isLoading={isRefreshing}
      onClick={onSelect}
      className="group relative w-full max-w-full overflow-hidden"
    >
      <ResultCardContent className="space-y-1.5 w-full overflow-hidden">
        {/* Row 1: Status + Account name + Balance + Pending */}
        <div className="flex items-center gap-2 w-full min-w-0 flex-wrap">
          {/* Status dot */}
          <div className={cn(
            "w-2 h-2 rounded-full shrink-0",
            isLive ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-red-500"
          )} />
          
          {/* Account name */}
          <span className="font-medium text-sm truncate min-w-0 max-w-[50%]">
            {result.accountName && result.accountName !== 'N/A' 
              ? result.accountName 
              : 'Unknown'}
          </span>

          {/* Balance + Pending (right after name) */}
          <span className="text-xs font-semibold text-emerald-500 shrink-0">
            {symbol}{availableBalance}
          </span>
          {parseFloat(pendingBalance) > 0 && (
            <span className="text-[10px] text-amber-500 shrink-0">
              +{symbol}{pendingBalance}
            </span>
          )}
        </div>

        {/* Row 2: Email + Country/Currency + Verified */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground w-full min-w-0 flex-wrap">
          {result.accountEmail && result.accountEmail !== 'N/A' && (
            <span className="truncate min-w-0 max-w-[50%]">{result.accountEmail}</span>
          )}
          {result.countryFlag && (
            <span className="shrink-0">{result.countryFlag} {result.currency}</span>
          )}
          {result.chargeableVerified && (
            <span className="text-emerald-500 flex items-center gap-0.5 shrink-0">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>

        {/* Row 3: Capabilities */}
        <div className="flex items-center gap-1 flex-wrap">
          {result.isChargeable && (
            <Badge variant="outline" className="h-4 text-[9px] px-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Chargeable
            </Badge>
          )}
          {result.chargesEnabled && (
            <Badge variant="outline" className="h-4 text-[9px] px-1">Charges</Badge>
          )}
          {result.payoutsEnabled && (
            <Badge variant="outline" className="h-4 text-[9px] px-1">Payouts</Badge>
          )}
          {result.capabilities?.cardPayments && (
            <Badge variant="outline" className="h-4 text-[9px] px-1">Cards</Badge>
          )}
        </div>

        {/* Row 4: Keys (truncated for cleaner display) */}
        <div className="pt-2 border-t border-border/30 dark:border-white/10 space-y-1 w-full overflow-hidden">
          {/* SK */}
          <div className="flex items-center gap-1.5 w-full">
            <span className="text-[9px] text-muted-foreground shrink-0 w-4">SK</span>
            <code 
              className="text-[10px] font-mono text-foreground/80 dark:text-white/70 flex-1 min-w-0"
              title={skKey}
            >
              {truncateKey(skKey)}
            </code>
            <button
              onClick={(e) => { e.stopPropagation(); onCopy(); }}
              className="text-muted-foreground hover:text-foreground dark:hover:text-white p-0.5 shrink-0"
              title="Copy full SK key"
            >
              {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          
          {/* PK */}
          {result.pkKey && (
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-[9px] text-muted-foreground shrink-0 w-4">PK</span>
              <code 
                className="text-[10px] font-mono text-foreground/80 dark:text-white/70 flex-1 min-w-0"
                title={result.pkKey}
              >
                {truncateKey(result.pkKey)}
              </code>
              <button
                onClick={handleCopyPk}
                className="text-muted-foreground hover:text-foreground dark:hover:text-white p-0.5 shrink-0"
                title="Copy full PK key"
              >
                {pkCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>
      </ResultCardContent>

      {/* Action buttons (top right, visible on hover) */}
      <ResultCardActions>
        <button
          onClick={(e) => { e.stopPropagation(); onRefresh(); }}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </ResultCardActions>

      {/* Refreshing overlay */}
      {isRefreshing && (
        <ResultCardLoadingOverlay>
          <RefreshCw className="h-4 w-4 animate-spin" />
        </ResultCardLoadingOverlay>
      )}
    </ResultCard>
  );
});

function KeysEmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Key className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold">No keys validated yet</p>
      <p className="text-sm text-muted-foreground mt-1">Enter SK keys in the left panel to start</p>
    </motion.div>
  );
}
