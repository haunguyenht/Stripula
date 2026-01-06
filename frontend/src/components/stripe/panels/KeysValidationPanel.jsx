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
  ResultCardLoadingOverlay,
  ResultCardHeader,
  ResultCardDataZone,
  ResultCardPill,
} from '@/components/ui/result-card';
import { DurationDisplay, CopyButton } from '@/components/ui/result-card-parts';
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
  setKeyStatsImmediate,
  selectedKeyIndex,
  onKeySelect,
  isLoading,
  setIsLoading,
  setCurrentItem,
  abortRef,
  modeSwitcher,
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [refreshingKeys, setRefreshingKeys] = useState(new Set());
  const pageSize = 10;
  const { success, error: toastError, info, warning } = useToast();

  // Check if there are valid SK keys to check
  const hasValidKeys = useMemo(() => {
    const keyLines = skKeys?.split('\n').filter(l => l.trim() && l.trim().startsWith('sk_')) || [];
    return keyLines.length > 0;
  }, [skKeys]);

  const clearResults = useCallback(() => {
    // useBoundedResults.setResults([]) already uses immediate write internally
    setKeyResults([]);
    // Use immediate setter for stats to bypass debounce
    if (setKeyStatsImmediate) {
      setKeyStatsImmediate({ live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 });
    } else {
      setKeyStats({ live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 });
    }
    onKeySelect(-1);
    setPage(1);
  }, [setKeyResults, setKeyStats, setKeyStatsImmediate, onKeySelect]);

  const clearKeys = useCallback(() => {
    setSkKeys('');
  }, [setSkKeys]);

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
        const response = await fetch('/api/keys/check', {
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

  const handleCopyAllSK = useCallback((resultsToUse) => {
    const allSK = resultsToUse.filter(r => r.fullKey).map(r => r.fullKey).join('\n');
    if (allSK) {
      navigator.clipboard.writeText(allSK);
      success(`Copied ${resultsToUse.filter(r => r.fullKey).length} SK keys`);
    }
  }, [success]);

  const handleCopyAllPK = useCallback((resultsToUse) => {
    const allPK = resultsToUse.filter(r => r.pkKey).map(r => r.pkKey).join('\n');
    if (allPK) {
      navigator.clipboard.writeText(allPK);
      success(`Copied ${resultsToUse.filter(r => r.pkKey).length} PK keys`);
    }
  }, [success]);

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
      const response = await fetch('/api/keys/check', {
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
        const response = await fetch('/api/keys/check', {
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
    <div className="space-y-2 sm:space-y-4 p-2 sm:p-4">
      {/* Input with integrated action bar */}
      <div className="rounded-lg border border-[rgb(230,225,223)] dark:border-white/10 bg-white dark:bg-white/5 shadow-sm dark:shadow-none overflow-hidden transition-all duration-200 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 dark:focus-within:border-white/20 dark:focus-within:ring-primary/20">
        <Textarea
          id="sk-keys-input"
          name="sk-keys-input"
          className={cn(
            "font-mono text-[10px] sm:text-xs min-h-[60px] sm:min-h-[100px] resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "dark:bg-transparent p-2 sm:p-3",
            isLoading && "opacity-50"
          )}
          placeholder="Enter SK keys (one per line)&#10;sk_live_xxxxx"
          value={skKeys}
          onChange={(e) => setSkKeys(e.target.value)}
          disabled={isLoading}
        />
        
        {/* Action bar below textarea */}
        <div className="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 border-t border-[rgb(230,225,223)] dark:border-white/10 bg-[rgb(250,249,249)] dark:bg-white/5">
          {/* Key count badge */}
          <div className="flex items-center gap-1 sm:gap-2">
            {keyCount > 0 && (
              <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-5 sm:h-6 px-1.5 sm:px-2">
                {keyCount}
              </Badge>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-8 sm:w-8"
              onClick={clearKeys}
              disabled={isLoading}
              title="Clear keys"
            >
              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
            {isLoading ? (
              <Button variant="destructive" size="sm" className="h-6 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs" onClick={handleStop}>
                Stop
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="h-6 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs" 
                onClick={handleCheckKeys}
                disabled={!hasValidKeys}
                title={!hasValidKeys ? 'Enter at least one SK key (sk_...)' : undefined}
              >
                <span className="hidden xs:inline">Check Keys</span>
                <span className="xs:hidden">Check</span>
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
      configPanelWithoutSwitcher={configContent}
      configPanel={
        <div className="flex flex-col">
          {modeSwitcher && (
          <div className="p-2 sm:p-4 border-b border-[rgb(230,225,223)] dark:border-white/10 flex justify-center">
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
          renderItem={(result, idx) => {
            const originalIndex = keyResults.findIndex(r => r.fullKey === result.fullKey);
            return (
              <KeyResultCard
                key={`${result.fullKey}-${idx}`}
                result={result}
                index={originalIndex}
                isSelected={selectedKeyIndex === originalIndex}
                isCopied={copiedKey === originalIndex}
                isRefreshing={refreshingKeys.has(originalIndex)}
                onSelect={() => onKeySelect(originalIndex)}
                onCopy={() => handleCopyKey(result.fullKey, originalIndex)}
                onDelete={() => handleDeleteKey(originalIndex)}
                onRefresh={() => handleRefreshKey(originalIndex)}
              />
            );
          }}
          getItemKey={(result, idx) => `${result.fullKey}-${idx}`}
          estimateItemSize={140}
          // Pagination props
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onClear={clearResults}
          onRefresh={keyResults.length > 0 ? handleRefreshAll : undefined}
          onCopyAllSK={filteredResults.length > 0 ? () => handleCopyAllSK(filteredResults) : undefined}
          onCopyAllPK={filteredResults.length > 0 ? () => handleCopyAllPK(filteredResults) : undefined}
          isLoading={isLoading}
          isEmpty={paginatedResults.length === 0}
          emptyState={<KeysEmptyState />}
        >
          {/* Fallback for non-virtualized rendering (small lists) */}
          {paginatedResults.map((result, idx) => {
            const originalIndex = keyResults.findIndex(r => r.fullKey === result.fullKey);
            return (
              <ResultItem key={`${result.fullKey}-${idx}`} id={`${result.fullKey}-${idx}`}>
                <KeyResultCard
                  result={result}
                  index={originalIndex}
                  isSelected={selectedKeyIndex === originalIndex}
                  isCopied={copiedKey === originalIndex}
                  isRefreshing={refreshingKeys.has(originalIndex)}
                  onSelect={() => onKeySelect(originalIndex)}
                  onCopy={() => handleCopyKey(result.fullKey, originalIndex)}
                  onDelete={() => handleDeleteKey(originalIndex)}
                  onRefresh={() => handleRefreshKey(originalIndex)}
                />
              </ResultItem>
            );
          })}
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
  const [isSelecting, setIsSelecting] = useState(false);
  const { warning, success } = useToast();

  const handleCopyPk = useCallback(() => {
    if (result.pkKey) {
      navigator.clipboard.writeText(result.pkKey);
      setPkCopied(true);
      setTimeout(() => setPkCopied(false), 2000);
    }
  }, [result.pkKey]);

  const handleCopySk = useCallback(() => {
    onCopy();
  }, [onCopy]);

  const isLive = result.status?.startsWith('LIVE');
  const isDead = result.status === 'DEAD';
  const skKey = result.fullKey || result.key;

  // Handle click - prevent selection for dead keys, show toast for live keys
  // Debounce to prevent multiple rapid clicks
  const handleClick = useCallback(() => {
    if (isDead) {
      warning('Dead keys cannot be used for card validation');
      return;
    }
    if (isSelecting || isSelected) return; // Prevent multiple clicks or re-selecting same key
    
    setIsSelecting(true);
    onSelect();
    const accountName = result.accountName && result.accountName !== 'N/A' ? result.accountName : 'Unknown';
    success(`Key selected • ${accountName}`);
    
    // Reset after short delay to allow re-selection if needed
    setTimeout(() => setIsSelecting(false), 500);
  }, [isDead, isSelecting, isSelected, onSelect, warning, success, result.accountName]);

  const availableBalance = ((result.availableBalance || 0) / 100).toFixed(2);
  const pendingBalance = ((result.pendingBalance || 0) / 100).toFixed(2);
  const symbol = result.currencySymbol || '$';
  
  // Truncate key to show prefix...last4
  const truncateKey = useCallback((key) => {
    if (!key || key.length < 20) return key;
    const prefix = key.substring(0, 12);
    const suffix = key.slice(-4);
    return `${prefix}...${suffix}`;
  }, []);
  
  // Map status for ResultCard
  const cardStatus = isLive ? 'live' : 'dead';
  
  return (
    <ResultCard
      status={cardStatus}
      isSelected={isSelected}
      isLoading={isRefreshing}
      onClick={handleClick}
      className={cn(
        "group relative w-full max-w-full",
        isDead && "cursor-not-allowed opacity-70"
      )}
    >
      <ResultCardContent>
        {/* Zone 1: Header - Status + Account Identity + Balance */}
        <ResultCardHeader>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Status indicator with glow */}
            <div className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0 transition-shadow",
              isLive 
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
                : "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]"
            )} />
            
            {/* Account name */}
            <span className="font-semibold text-sm text-neutral-800 dark:text-white/90 truncate min-w-0">
              {result.accountName && result.accountName !== 'N/A' 
                ? result.accountName 
                : 'Unknown'}
            </span>

            {/* Balance display - next to name */}
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              {symbol}{availableBalance}
            </span>
            {parseFloat(pendingBalance) > 0 && (
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
                +{symbol}{pendingBalance}
              </span>
            )}
          </div>

          {/* Duration display */}
          <div className="flex items-center gap-2 shrink-0">
            <DurationDisplay duration={result.duration} showIcon={false} />
          </div>
        </ResultCardHeader>

        {/* Zone 2: Account metadata */}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-500 dark:text-white/50 flex-wrap">
          {result.accountEmail && result.accountEmail !== 'N/A' && (
            <span className="truncate max-w-[180px]">{result.accountEmail}</span>
          )}
          {result.countryFlag && (
            <span className="shrink-0">{result.countryFlag} {result.currency}</span>
          )}
          {result.chargeableVerified && (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium shrink-0">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          )}
        </div>

        {/* Zone 3: Capabilities */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          {result.isChargeable && (
            <ResultCardPill variant="success">
              Chargeable
            </ResultCardPill>
          )}
          {result.chargesEnabled && (
            <ResultCardPill>Charges</ResultCardPill>
          )}
          {result.payoutsEnabled && (
            <ResultCardPill>Payouts</ResultCardPill>
          )}
          {result.capabilities?.cardPayments && (
            <ResultCardPill>Cards</ResultCardPill>
          )}
        </div>

        {/* Zone 4: Keys section */}
        <ResultCardDataZone className="mt-3 pt-3">
          {/* SK Key */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-[9px] font-semibold text-neutral-400 dark:text-white/40 shrink-0 w-5 uppercase">SK</span>
            <code 
              className="text-[10px] font-mono text-neutral-600 dark:text-white/70 flex-1 min-w-0 truncate"
              title={skKey}
            >
              {truncateKey(skKey)}
            </code>
            <CopyButton
              value={skKey}
              isCopied={isCopied}
              onCopy={handleCopySk}
              title="Copy SK key"
              size="sm"
            />
          </div>
          
          {/* PK Key */}
          {result.pkKey && (
            <div className="flex items-center gap-2 w-full mt-1.5">
              <span className="text-[9px] font-semibold text-neutral-400 dark:text-white/40 shrink-0 w-5 uppercase">PK</span>
              <code 
                className="text-[10px] font-mono text-neutral-600 dark:text-white/70 flex-1 min-w-0 truncate"
                title={result.pkKey}
              >
                {truncateKey(result.pkKey)}
              </code>
              <CopyButton
                value={result.pkKey}
                isCopied={pkCopied}
                onCopy={handleCopyPk}
                title="Copy PK key"
                size="sm"
              />
            </div>
          )}
        </ResultCardDataZone>
      </ResultCardContent>

      {/* Action buttons (top right, visible on hover) */}
      <ResultCardActions>
        <button
          onClick={(e) => { e.stopPropagation(); onRefresh(); }}
          className={cn(
            "p-1.5 rounded-lg transition-all",
            "text-neutral-400 hover:text-neutral-600",
            "dark:text-white/40 dark:hover:text-white/70",
            "hover:bg-neutral-100 dark:hover:bg-white/10"
          )}
          title="Refresh"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={cn(
            "p-1.5 rounded-lg transition-all",
            "text-neutral-400 hover:text-rose-500",
            "dark:text-white/40 dark:hover:text-rose-400",
            "hover:bg-rose-50 dark:hover:bg-rose-500/10"
          )}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </ResultCardActions>

      {/* Refreshing overlay */}
      {isRefreshing && (
        <ResultCardLoadingOverlay>
          <RefreshCw className="h-5 w-5 animate-spin text-neutral-500 dark:text-white/60" />
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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(248,247,247)] dark:bg-white/10 mb-4">
        <Key className="h-8 w-8 text-[rgb(145,134,131)] dark:text-white/50" />
      </div>
      <p className="text-lg font-semibold text-[rgb(37,27,24)] dark:text-white">No keys validated yet</p>
      <p className="text-sm text-[rgb(145,134,131)] dark:text-white/50 mt-1">Enter SK keys in the left panel to start</p>
    </motion.div>
  );
}
