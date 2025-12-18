import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { CreditCard, Trash2, Copy, Check, Zap, Key, Loader2, ShieldCheck, ShieldX, ShieldAlert, Clock, Building2, Circle, Mail } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useToast } from '@/hooks/useToast';
import { useCardFilters } from '@/hooks/useCardFilters';

// Layout
import { TwoPanelLayout } from '../../layout/TwoPanelLayout';

// Components
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Celebration, useCelebration } from '@/components/ui/Celebration';
import { ProxyInput } from '@/components/ui/ProxyInput';
import { ResultCard, ResultCardContent } from '@/components/ui/result-card';
import { BrandIcon } from '@/components/ui/brand-icons';
import { cn } from '@/lib/utils';

// Utils
import { parseProxy } from '@/utils/proxy';
import { 
  toTitleCase, 
  getStatusVariant, 
  formatDuration, 
  formatCardMessage,
  formatCardForCopy 
} from '@/lib/utils/card-helpers';

/**
 * CardsValidationPanel - Two-panel layout for card validation
 */
export function CardsValidationPanel({
  cards,
  setCards,
  cardResults,
  setCardResults,
  cardStats,
  setCardStats,
  settings,
  onSettingsChange,
  keyResults = [],
  selectedKeyIndex,
  onKeySelect,
  isLoading,
  setIsLoading,
  setCurrentItem,
  progress,
  setProgress,
  abortRef,
  abortControllerRef,
  modeSwitcher,
  drawerOpen,
  onDrawerOpenChange,
}) {
  const [copiedCard, setCopiedCard] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFetchingPk, setIsFetchingPk] = useState(false);
  const [isCheckingProxy, setIsCheckingProxy] = useState(false);
  const pkFetchTimeoutRef = useRef(null);
  const proxyInputRef = useRef(null);
  const { success, error: toastError, info, warning } = useToast();
  const { trigger: celebrationTrigger, celebrate } = useCelebration();

  const liveKeys = useMemo(() => 
    keyResults.filter(k => k.status?.startsWith('LIVE')),
    [keyResults]
  );

  const isManualInput = selectedKeyIndex === -1 || selectedKeyIndex === 'manual';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pkFetchTimeoutRef.current) clearTimeout(pkFetchTimeoutRef.current);
      if (abortControllerRef?.current) abortControllerRef.current.abort();
    };
  }, [abortControllerRef]);

  const clearResults = useCallback(() => {
    setCardResults([]);
    setCardStats({ approved: 0, live: 0, die: 0, error: 0, total: 0 });
    setPage(1);
  }, [setCardResults, setCardStats]);

  const handleSettingChange = useCallback((key, value) => {
    onSettingsChange?.((prev) => ({ ...prev, [key]: value }));
  }, [onSettingsChange]);

  const fetchPkForSk = useCallback(async (skKey) => {
    if (!skKey || !skKey.startsWith('sk_live_') || skKey.length < 20) return;
    
    const trimmedKey = skKey.trim();
    const existingKey = keyResults.find(k => k.fullKey?.trim() === trimmedKey);
    if (existingKey) {
      if (existingKey.status === 'DEAD') {
        warning('This key is dead');
        return;
      }
      if (existingKey.pkKey) {
        onSettingsChange?.((prev) => ({ ...prev, skKey: trimmedKey, pkKey: existingKey.pkKey }));
        success(`PK key found • ${existingKey.status}`);
        return;
      }
    }
    
    setIsFetchingPk(true);
    info('Fetching PK key...');
    try {
      const response = await fetch('/api/stripe-own/check-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skKey })
      });
      const result = await response.json();
      
      if (result.pkKey) {
        onSettingsChange?.((prev) => ({ ...prev, skKey, pkKey: result.pkKey }));
        success(`PK key fetched • ${result.status}`);
      } else if (result.status === 'DEAD') {
        warning(result.message || 'Key is dead');
      } else {
        warning('Could not fetch PK key');
      }
    } catch {
      toastError('Failed to fetch PK key');
    } finally {
      setIsFetchingPk(false);
    }
  }, [keyResults, onSettingsChange, info, success, warning, toastError]);

  const handleSkKeyChange = useCallback((value) => {
    handleSettingChange('skKey', value);
    
    if (pkFetchTimeoutRef.current) clearTimeout(pkFetchTimeoutRef.current);
    
    if (value.startsWith('sk_live_') && value.length >= 30) {
      pkFetchTimeoutRef.current = setTimeout(() => fetchPkForSk(value), 500);
    }
  }, [handleSettingChange, fetchPkForSk]);

  const handleCheckCards = async () => {
    if (isLoading || isCheckingProxy) return;
    
    if (!settings.skKey?.trim()) {
      warning('Enter an SK key');
      return;
    }
    if (!settings.pkKey?.trim() || !settings.pkKey.startsWith('pk_')) {
      warning('PK Key is required for card validation');
      return;
    }
    if (settings.validationMethod === 'charge' && !settings.proxy?.trim()) {
      warning('Proxy is required for charge validation');
      return;
    }
    
    if (settings.proxy?.trim() && proxyInputRef.current) {
      setIsCheckingProxy(true);
      try {
        const proxyResult = await proxyInputRef.current.checkProxy(true);
        if (proxyResult.isStatic) {
          toastError('Static IP not supported. Please use a rotating proxy.');
          return;
        }
      } finally {
        setIsCheckingProxy(false);
      }
    }
    
    const cardList = cards.trim();
    if (!cardList) {
      warning('Enter at least one card');
      return;
    }

    setIsLoading(true);
    abortRef.current = false;
    const totalCards = cardList.split('\n').filter(l => l.trim()).length;
    setProgress({ current: 0, total: totalCards });

    const methodLabels = { charge: 'Charge', nocharge: 'No Charge', setup: 'Setup' };
    const methodLabel = methodLabels[settings.validationMethod] || 'Charge';
    setCurrentItem(`Starting ${methodLabel} validation...`);
    info(`Starting ${methodLabel} validation for ${totalCards} cards`);

    let currentCards = cards;
    
    try {
      abortControllerRef.current = new AbortController();

      const proxyObj = parseProxy(settings.proxy);
      const chargeAmountCents = settings.chargeAmount 
        ? Math.round(parseFloat(settings.chargeAmount) * 100) 
        : null;

      const response = await fetch('/api/stripe-own/validate-batch-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skKey: settings.skKey.trim(),
          pkKey: settings.pkKey.trim(),
          cardList,
          concurrency: settings.concurrency,
          proxy: proxyObj,
          validationMethod: settings.validationMethod,
          chargeAmount: chargeAmountCents
        }),
        signal: abortControllerRef.current.signal
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let newResults = [...cardResults];
      let stats = { ...cardStats };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventMatch = line.match(/^event: (\w+)/);
          const dataMatch = line.match(/data: (.+)$/m);

          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          let data;
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }

          if (event === 'start') {
            setProgress({ current: 0, total: data.total });
          } else if (event === 'progress') {
            setProgress({ current: data.current, total: data.total });
            stats = {
              approved: data.summary.approved || 0,
              live: data.summary.live || 0,
              die: data.summary.die || 0,
              error: data.summary.error || 0,
              total: data.current
            };
            setCardStats({ ...stats });
            setCurrentItem(`${data.current}/${data.total}`);
          } else if (event === 'result') {
            const r = data;
            const cardInfo = r.card || {};
            const cvv = cardInfo.cvc || cardInfo.cvv;
            const fullCard = typeof cardInfo === 'object'
              ? `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}${cvv ? '|' + cvv : ''}`
              : cardInfo;
            const resultId = `${fullCard}-${Date.now()}-${newResults.length}`;
            newResults.unshift({
              ...r,
              id: resultId,
              card: fullCard,
              fullCard: fullCard
            });
            setCardResults([...newResults]);
            
            if (r.status === 'APPROVED') celebrate();
            
            if (typeof cardInfo === 'object' && cardInfo.number) {
              const cardNumber = cardInfo.number;
              currentCards = currentCards
                .split('\n')
                .filter(line => {
                  const trimmed = line.trim();
                  if (!trimmed) return false;
                  const lineCardNumber = trimmed.split(/[|,\s]/)[0];
                  return lineCardNumber !== cardNumber;
                })
                .join('\n');
              setCards(currentCards);
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setCurrentItem(`Error: ${err.message}`);
        toastError(`Validation error: ${err.message}`);
      }
    }

    setIsLoading(false);
    setCurrentItem(null);
    abortControllerRef.current = null;
    
    if (!abortRef.current) {
      const { live = 0, die = 0, error: errCount = 0 } = cardStats;
      success(`Validation complete: ${live} live, ${die} dead, ${errCount} errors`);
    }
  };

  const handleStop = async () => {
    abortRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    await fetch('/api/stripe-own/stop-batch', { method: 'POST' });
    setIsLoading(false);
    setCurrentItem('Stopped');
    warning('Card validation stopped');
  };

  const handleCopyCard = useCallback((result) => {
    const formatted = formatCardForCopy(result);
    navigator.clipboard.writeText(formatted);
    const resultId = result.id || result.card;
    setCopiedCard(resultId);
    setTimeout(() => setCopiedCard(null), 2000);
  }, []);

  const handleFilterChange = useCallback((id) => {
    setFilter(id);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const cardCount = useMemo(() => 
    cards.split('\n').filter(l => l.trim()).length,
    [cards]
  );

  const filteredResults = useCardFilters(cardResults, filter);

  const handleCopyAllCards = useCallback(() => {
    const cardsToCopy = filteredResults
      .filter(r => r.fullCard || r.card)
      .map(r => formatCardForCopy(r))
      .join('\n');
    
    if (cardsToCopy) {
      navigator.clipboard.writeText(cardsToCopy);
      const filterLabel = filter === 'all' ? '' : ` ${filter}`;
      success(`Copied ${filteredResults.length}${filterLabel} cards`);
    } else {
      warning('No cards to copy');
    }
  }, [filteredResults, filter, success, warning]);

  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(filteredResults.length / pageSize)),
    [filteredResults.length, pageSize]
  );
  
  const paginatedResults = useMemo(() => 
    filteredResults.slice((page - 1) * pageSize, page * pageSize),
    [filteredResults, page, pageSize]
  );

  const stats = useMemo(() => [
    { id: 'all', label: 'All', value: cardStats.total, color: 'default' },
    { id: 'approved', label: 'Approved', value: cardStats.approved, color: 'coral', showDot: true },
    { id: 'live', label: 'Live', value: cardStats.live, color: 'emerald', showDot: true },
    { id: 'die', label: 'Die', value: cardStats.die, color: 'rose', showDot: true },
    { id: 'error', label: 'Error', value: cardStats.error, color: 'amber', showDot: true },
  ], [cardStats]);

  const configContent = (
    <div className="space-y-4 p-4">
      {/* Card Input with integrated action bar */}
      <div className="rounded-lg border border-border/10 dark:border-white/10 dark:bg-white/5 overflow-hidden transition-all duration-200 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 dark:focus-within:border-white/20 dark:focus-within:ring-primary/20">
        <Textarea
          id="cards-input"
          name="cards-input"
          className={cn(
            "font-mono text-xs min-h-[80px] resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "dark:bg-transparent",
            isLoading && "opacity-50"
          )}
          placeholder="Enter cards (one per line)&#10;4111111111111111|01|2025|123"
          value={cards}
          onChange={(e) => setCards(e.target.value)}
          disabled={isLoading}
        />
        
        {/* Action bar below textarea */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/10 dark:border-white/10 bg-muted/30 dark:bg-white/5">
          {/* Card count badge */}
          <div className="flex items-center gap-2">
            {cardCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-6">
                {cardCount} cards
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
              <Button size="sm" className="h-8" onClick={handleCheckCards} disabled={isCheckingProxy}>
                {isCheckingProxy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Check Cards
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

      {/* Keys Section */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <Label className="text-xs font-medium">API Keys</Label>
        </div>
        
        <Select
          value={String(selectedKeyIndex)}
          onValueChange={(val) => onKeySelect?.(val === 'manual' || val === '-1' ? -1 : parseInt(val))}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select key or manual input">
              {selectedKeyIndex >= 0 && keyResults[selectedKeyIndex] ? (
                <span className="flex items-center gap-1.5 truncate">
                  <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500 shrink-0" />
                  <span className="font-mono truncate">
                    {keyResults[selectedKeyIndex].key?.slice(0, 12)}...{keyResults[selectedKeyIndex].key?.slice(-4)}
                  </span>
                  {keyResults[selectedKeyIndex].accountEmail && keyResults[selectedKeyIndex].accountEmail !== 'N/A' && (
                    <span className="text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 shrink-0" />
                      {keyResults[selectedKeyIndex].accountEmail}
                    </span>
                  )}
                </span>
              ) : 'Manual Input'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">
              <span className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Manual Input</span>
              </span>
            </SelectItem>
            {liveKeys.map((key) => {
              const originalIdx = keyResults.indexOf(key);
              const truncatedKey = key.key ? `${key.key.slice(0, 12)}...${key.key.slice(-4)}` : 'Unknown';
              return (
                <SelectItem key={originalIdx} value={String(originalIdx)}>
                  <span className="flex items-center gap-1.5">
                    <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500 shrink-0" />
                    <span className="font-mono">{truncatedKey}</span>
                    {key.accountEmail && key.accountEmail !== 'N/A' && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        {key.accountEmail}
                      </span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Input
              id="sk-key-input"
              name="sk-key-input"
              placeholder="sk_live_..."
              value={settings?.skKey || ''}
              onChange={(e) => handleSkKeyChange(e.target.value)}
              disabled={isLoading || !isManualInput || isFetchingPk}
              className={cn("text-xs h-8", !isManualInput && "opacity-60")}
            />
            {isFetchingPk && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin" />
            )}
          </div>
          <Input
            id="pk-key-input"
            name="pk-key-input"
            placeholder="pk_live_..."
            value={settings?.pkKey || ''}
            onChange={(e) => handleSettingChange('pkKey', e.target.value)}
            disabled={isLoading || !isManualInput || isFetchingPk}
            className={cn("text-xs h-8", !isManualInput && "opacity-60")}
          />
        </div>
        
        <ProxyInput
          ref={proxyInputRef}
          placeholder="Proxy (host:port:user:pass)"
          value={settings?.proxy || ''}
          onChange={(e) => handleSettingChange('proxy', e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Method Section */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <Label className="text-xs font-medium">Validation Method</Label>
        </div>
        
        <Tabs 
          value={settings?.validationMethod || 'charge'} 
          onValueChange={(v) => handleSettingChange('validationMethod', v)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charge" disabled={isLoading}>Charge</TabsTrigger>
            <TabsTrigger value="nocharge" disabled={isLoading}>No Charge</TabsTrigger>
            <TabsTrigger value="setup" disabled={isLoading}>Checkout</TabsTrigger>
          </TabsList>
        </Tabs>

        {settings?.validationMethod === 'charge' && (
          <div className="flex items-center gap-2">
            <Label htmlFor="charge-amount" className="text-xs">Amount $</Label>
            <Input
              id="charge-amount"
              name="charge-amount"
              type="number"
              min="0.50"
              max="50"
              step="0.01"
              value={settings?.chargeAmount || ''}
              onChange={(e) => handleSettingChange('chargeAmount', e.target.value)}
              placeholder="Random"
              disabled={isLoading}
              className="flex-1 h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">0.50-50</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Label className="text-xs">Threads</Label>
          <Slider
            value={[settings?.concurrency || 3]}
            onValueChange={([v]) => handleSettingChange('concurrency', v)}
            min={1}
            max={10}
            step={1}
            disabled={isLoading}
            className="flex-1"
          />
          <span className="w-6 text-center text-xs font-mono">{settings?.concurrency || 3}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Celebration trigger={celebrationTrigger} />
      <TwoPanelLayout
        modeSwitcher={modeSwitcher}
        drawerOpen={drawerOpen}
        onDrawerOpenChange={onDrawerOpenChange}
        configPanelWithoutSwitcher={configContent}
        configPanel={
          <div className="flex flex-col">
            {modeSwitcher && (
              <div className="p-4 border-b flex justify-center">{modeSwitcher}</div>
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
              <CardResultCard 
                key={result.id || `${result.card}-${idx}`}
                result={result} 
                copiedCard={copiedCard} 
                onCopy={handleCopyCard} 
              />
            )}
            getItemKey={(result, idx) => result.id || `${result.card}-${idx}`}
            estimateItemSize={100}
            // Pagination props
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            onClear={clearResults}
            onCopyAll={filteredResults.length > 0 ? handleCopyAllCards : undefined}
            isLoading={isLoading}
            isEmpty={paginatedResults.length === 0}
            emptyState={<CardsEmptyState />}
          >
            {/* Fallback for non-virtualized rendering (small lists) */}
            {paginatedResults.map((result, idx) => {
              const key = result.id || `${result.card}-${idx}`;
              return (
                <ResultItem key={key} id={key}>
                  <CardResultCard result={result} copiedCard={copiedCard} onCopy={handleCopyCard} />
                </ResultItem>
              );
            })}
          </ResultsPanel>
        }
      />
    </>
  );
}

/**
 * CardResultCard - Individual card result using ResultCard component
 */
const CardResultCard = React.memo(function CardResultCard({ result, copiedCard, onCopy }) {
  const isFullView = result.status === 'LIVE' || result.status === 'APPROVED';
  const resultId = result.id || result.card;
  const isCopied = copiedCard === resultId;
  
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onCopy(result);
  }, [onCopy, result]);

  const message = formatCardMessage(result);

  return (
    <ResultCard status={result.status}>
      <ResultCardContent>
        {/* Row 1: Status + Card Number + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Badge variant={getStatusVariant(result.status)} className="text-[10px]">
              {result.status}
            </Badge>
            {result.chargeAmountFormatted && (
              <Badge variant="outline" className="text-[10px]">{result.chargeAmountFormatted}</Badge>
            )}
            <span className="text-xs font-mono text-muted-foreground truncate flex-1">{result.card}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {result.duration && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(result.duration)}s
              </span>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClick} title="Copy card">
              {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Row 2: Card meta info */}
        {result.binData && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {result.binData.scheme && (
              <span title={result.binData.scheme}>
                <BrandIcon scheme={result.binData.scheme} />
              </span>
            )}
            {result.binData.type && (
              <Badge variant="outline" className="text-[10px]">{result.binData.type}</Badge>
            )}
            {result.binData.category && (
              <Badge variant="outline" className="text-[10px]">{toTitleCase(result.binData.category)}</Badge>
            )}
            {result.binData.countryEmoji && (
              <span title={result.binData.country}>{result.binData.countryEmoji}</span>
            )}
            {result.binData.bank && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[120px]">
                <Building2 className="h-3 w-3" />
                {toTitleCase(result.binData.bank)}
              </span>
            )}
            {isFullView && result.riskLevel && result.riskLevel !== 'unknown' && (
              <Badge variant={result.riskLevel === 'normal' || result.riskLevel === 'low' ? 'secondary' : 'warning'} className="text-[10px]">
                <ShieldAlert className="h-3 w-3 mr-1" />
                {result.riskLevel}
              </Badge>
            )}
            {isFullView && result.avsCheck && result.avsCheck !== 'unknown' && (
              <Badge variant={result.avsCheck === 'pass' || result.avsCheck === 'match' ? 'secondary' : 'destructive'} className="text-[10px]">
                {result.avsCheck === 'pass' || result.avsCheck === 'match' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldX className="h-3 w-3 mr-1" />}
                AVS
              </Badge>
            )}
            {isFullView && result.cvcCheck && result.cvcCheck !== 'unknown' && (
              <Badge variant={result.cvcCheck === 'pass' || result.cvcCheck === 'match' ? 'secondary' : 'destructive'} className="text-[10px]">
                {result.cvcCheck === 'pass' || result.cvcCheck === 'match' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldX className="h-3 w-3 mr-1" />}
                CVC
              </Badge>
            )}
          </div>
        )}

        {/* Row 3: Message */}
        {!isFullView && message && (
          <p className={cn(
            "text-xs mt-2 truncate",
            result.status === 'DIE' ? "text-red-500" : "text-amber-500"
          )} title={message}>
            {message.length > 80 ? message.substring(0, 80) + '...' : message}
          </p>
        )}
      </ResultCardContent>
    </ResultCard>
  );
});

function CardsEmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <CreditCard className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold">No cards validated yet</p>
      <p className="text-sm text-muted-foreground mt-1">Enter cards in the left panel to start</p>
    </motion.div>
  );
}
