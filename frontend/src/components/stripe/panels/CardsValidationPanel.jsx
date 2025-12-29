import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { CreditCard, Trash2, Copy, Check, Key, Loader2, ShieldCheck, ShieldX, ShieldAlert, Clock, Building2, Circle, Mail } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useToast } from '@/hooks/useToast';
import { useCardFilters } from '@/hooks/useCardFilters';
import { processCardInput, getProcessingToastMessage } from '@/lib/utils/card-parser';

// Layout
import { TwoPanelLayout } from '../../layout/TwoPanelLayout';

// Components
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SpeedBadge } from '@/components/ui/TierSpeedControl';
import { useSpeedConfig } from '@/hooks/useSpeedConfig';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Celebration, useCelebration } from '@/components/ui/Celebration';
import { ProxyInput } from '@/components/ui/ProxyInput';
import { 
  ResultCard, 
  ResultCardContent,
  ResultCardHeader,
  ResultCardDataZone,
  ResultCardResponseZone,
  ResultCardSecurityZone,
  ResultCardMessage,
} from '@/components/ui/result-card';
import { 
  BINDataDisplay, 
  SecurityIndicators,
  DurationDisplay, 
  CopyButton,
  CardNumber,
} from '@/components/ui/result-card-parts';
import { BrandIcon } from '@/components/ui/brand-icons';
import { cn } from '@/lib/utils';

// Utils
import { parseProxy } from '@/utils/proxy';
import { handleCreditError, showCreditErrorToast } from '@/utils/creditErrors';
import {
  toTitleCase,
  getStatusVariant,
  formatDuration,
  formatCardMessage,
  formatCardForCopy
} from '@/lib/utils/card-helpers';

/**
 * CardsValidationPanel - Two-panel layout for card validation
 * NOTE: SK-Based gateways do NOT deduct credits - users provide their own keys
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
  const [isCheckingConversion, setIsCheckingConversion] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);
  const pkFetchTimeoutRef = useRef(null);
  const proxyInputRef = useRef(null);
  const { success, error: toastError, info, warning } = useToast();
  const { trigger: celebrationTrigger, celebrate } = useCelebration();

  const liveKeys = useMemo(() =>
    keyResults.filter(k => k.status?.startsWith('LIVE')),
    [keyResults]
  );

  const isManualInput = selectedKeyIndex === -1 || selectedKeyIndex === 'manual';

  // Pre-fetch speed config once at panel level to avoid re-fetching on dropdown open
  const { user } = useAuth();
  const userTier = user?.tier || 'free';
  const { config: chargeSpeedConfig } = useSpeedConfig('charge', userTier);

  // Check if SK key is valid (either from manual input or selected from list)
  const hasValidKey = useMemo(() => {
    const skKey = settings?.skKey?.trim() || '';
    return skKey.startsWith('sk_live_') && skKey.length >= 30;
  }, [settings?.skKey]);

  // Check if all required inputs are valid for checking
  const canCheck = useMemo(() => {
    const hasCards = typeof cards === 'string' && cards.trim().length > 0;
    const hasProxy = settings?.proxy?.trim()?.length > 0;
    return hasValidKey && hasCards && hasProxy;
  }, [hasValidKey, cards, settings?.proxy]);

  // Cleanup on unmount - abort client request AND stop backend processing
  useEffect(() => {
    return () => {
      if (pkFetchTimeoutRef.current) clearTimeout(pkFetchTimeoutRef.current);
      if (abortControllerRef?.current) {
        abortControllerRef.current.abort();
        // Stop backend processing when component unmounts during loading
        fetch('/api/skbased/stop', {
          method: 'POST'
        }).catch(() => { });
      }
    };
  }, [abortControllerRef]);

  const clearResults = useCallback(() => {
    setCardResults([]);
    setCardStats({ approved: 0, live: 0, die: 0, error: 0, total: 0 });
    setPage(1);
  }, [setCardResults, setCardStats]);

  const clearCards = useCallback(() => {
    setCards('');
    // Also clear from localStorage directly to ensure it's cleared
    try {
      localStorage.removeItem('stripeOwnCards');
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [setCards]);

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
      const response = await fetch('/api/keys/check', {
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

  // Check currency conversion rate
  const handleCheckConversion = useCallback(async () => {
    const currency = settings?.currency || 'USD';
    const amount = parseFloat(settings?.chargeAmount) || 1;

    if (currency === 'USD') {
      setConversionResult({
        from: currency,
        to: 'USD',
        amount,
        converted: amount,
        rate: 1
      });
      return;
    }

    setIsCheckingConversion(true);
    try {
      // Use free exchange rate API
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
      if (!response.ok) throw new Error('Failed to fetch exchange rate');

      const data = await response.json();
      const rate = data.rates?.USD || 1;
      const converted = amount * rate;

      setConversionResult({
        from: currency,
        to: 'USD',
        amount,
        converted: converted.toFixed(2),
        rate
      });
      success(`${amount} ${currency} = ${converted.toFixed(2)} USD`);
    } catch (err) {
      toastError('Failed to fetch exchange rate');
      setConversionResult(null);
    } finally {
      setIsCheckingConversion(false);
    }
  }, [settings?.currency, settings?.chargeAmount, success, toastError]);

  // Clear conversion result when currency or amount changes
  useEffect(() => {
    setConversionResult(null);
  }, [settings?.currency, settings?.chargeAmount]);

  const handleCheckCards = async () => {
    if (isLoading || isCheckingProxy) return;

    if (!settings.skKey?.trim()) {
      warning('Enter an SK key');
      return;
    }
    // PK key is no longer required - we use Playwright with Stripe's hosted checkout
    if (!settings.proxy?.trim()) {
      warning('Proxy is required for validation');
      return;
    }

    if (proxyInputRef.current) {
      setIsCheckingProxy(true);
      try {
        // Step 1: Check if proxy is working
        const proxyResult = await proxyInputRef.current.checkProxy(true);
        if (!proxyResult.valid) {
          // Proxy check failed - allow user to retry or fix proxy
          return;
        }

        // Warn about static proxy but don't block
        if (proxyResult.isStatic) {
          warning('Static IP detected - results may be affected. Rotating proxy recommended.');
        }

        // Step 2: Check if proxy can reach Stripe API (warning only, don't block)
        info('Checking Stripe API access...');
        const stripeResult = await proxyInputRef.current.checkStripeAccess(false);
        if (!stripeResult.canAccessStripe) {
          // Just warn, don't block - let user try anyway
          if (stripeResult.blocked) {
            warning('Proxy may be blocked from Stripe. Validation might fail.');
          } else {
            warning('Could not verify Stripe access. Validation might fail.');
          }
        } else {
          success('Stripe API accessible');
        }
      } finally {
        setIsCheckingProxy(false);
      }
    }

    const cardStr = typeof cards === 'string' ? cards : '';
    const cardList = cardStr.trim();
    if (!cardList) {
      warning('Enter at least one card');
      return;
    }

    const parseResult = processCardInput(cardList);
    if (parseResult.validCount === 0) {
      toastError('No valid cards found. Use format: number|mm|yy|cvv');
      return;
    }

    setIsLoading(true);
    abortRef.current = false;
    setProgress({ current: 0, total: parseResult.validCount });

    setCurrentItem(`Starting validation...`);
    info(`Starting validation for ${parseResult.validCount} cards`);

    let currentCards = cards;

    // Track batch stats for this run (start fresh, not accumulated)
    let batchStats = { approved: 0, live: 0, die: 0, error: 0, total: 0 };

    try {
      abortControllerRef.current = new AbortController();

      const proxyObj = parseProxy(settings.proxy);
      const chargeAmountCents = settings.chargeAmount
        ? Math.round(parseFloat(settings.chargeAmount) * 100)
        : null;

      const response = await fetch('/api/skbased/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skKey: settings.skKey.trim(),
          pkKey: settings.pkKey?.trim() || null, // Pass PK to avoid re-fetching
          cards: cardList.split('\n').map(l => l.trim()).filter(l => l && l.includes('|')),
          proxy: proxyObj,
          chargeAmount: chargeAmountCents,
          currency: (settings.currency || 'USD').toLowerCase()
        }),
        signal: abortControllerRef.current.signal
      });

      // Handle credit-related errors (429, 402, 409)
      if (!response.ok) {
        const creditError = await handleCreditError(response);
        if (creditError) {
          showCreditErrorToast({ error: toastError, warning, info }, creditError);
          setIsLoading(false);
          setCurrentItem(null);
          return;
        }
        // For other errors, try to get error message
        try {
          const errorData = await response.json();
          toastError(errorData.message || `Request failed: ${response.status}`);
        } catch {
          toastError(`Request failed with status ${response.status}`);
        }
        setIsLoading(false);
        setCurrentItem(null);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let newResults = [...cardResults];
      // Store initial stats for accumulation (UI display)
      const initialStats = {
        approved: cardStats.approved || 0,
        live: cardStats.live || 0,
        die: cardStats.die || 0,
        error: cardStats.error || 0,
        total: cardStats.total || 0
      };
      // Use refs for batched processing - Requirements: 6.2
      const pendingResultsRef = { current: [] };
      let lastUIUpdate = Date.now();
      const UI_UPDATE_INTERVAL = 50; // ms - batch UI updates

      // Helper to flush pending results to UI
      const flushPendingResults = () => {
        if (pendingResultsRef.current.length > 0) {
          newResults = [...pendingResultsRef.current, ...newResults];
          pendingResultsRef.current = [];
          setCardResults([...newResults]);
        }
      };

      for (; ;) {
        const { done, value } = await reader.read();
        if (done) {
          // Flush any remaining pending results
          flushPendingResults();
          break;
        }

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
            // Track batch stats for this run (for toast message)
            batchStats = {
              approved: data.summary.approved || 0,
              live: data.summary.live || 0,
              die: data.summary.die || 0,
              error: data.summary.error || 0,
              total: data.current
            };
            // Add current batch stats to initial accumulated stats (for UI display)
            setCardStats({
              approved: initialStats.approved + batchStats.approved,
              live: initialStats.live + batchStats.live,
              die: initialStats.die + batchStats.die,
              error: initialStats.error + batchStats.error,
              total: initialStats.total + batchStats.total
            });
            setCurrentItem(`${data.current}/${data.total}`);
          } else if (event === 'result') {
            const r = data;
            const cardInfo = r.card || {};
            const cvv = cardInfo.cvc || cardInfo.cvv || '';
            let fullCard;
            if (typeof cardInfo === 'object' && cardInfo.number) {
              fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}${cvv ? '|' + cvv : ''}`;
            } else if (typeof cardInfo === 'string') {
              fullCard = cardInfo;
            } else {
              fullCard = 'Unknown card';
            }
            const resultId = `${fullCard}-${Date.now()}-${newResults.length + pendingResultsRef.current.length}`;
            const resultToAdd = {
              ...r,
              id: resultId,
              card: fullCard,
              fullCard: fullCard
            };
            
            // Add to pending batch instead of immediate UI update
            pendingResultsRef.current.unshift(resultToAdd);

            // Process side effects immediately (celebration)
            if (r.status === 'APPROVED') celebrate();

            // Remove card from input
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

            // Batch UI updates - flush when batch is full (10) or timeout (50ms)
            // Requirements: 6.2 - SSE event batching
            const now = Date.now();
            if (pendingResultsRef.current.length >= 10 || (now - lastUIUpdate) >= UI_UPDATE_INTERVAL) {
              flushPendingResults();
              lastUIUpdate = now;
            }
          } else if (event === 'error') {
            // Flush pending results before handling error
            flushPendingResults();
            toastError(data.message || 'Validation error');
            setIsLoading(false);
            return;
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
      // Use batchStats from this run (not accumulated cardStats)
      const { approved = 0, live = 0, die = 0, error: errCount = 0 } = batchStats;
      success(`Validation complete: ${approved} approved, ${live} live, ${die} die, ${errCount} errors`);
    }
  };

  const handleStop = async () => {
    abortRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null; // Reset so next start creates fresh controller
    }
    await fetch('/api/skbased/stop', {
      method: 'POST'
    }).catch(() => { }); // Ignore errors
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

  const cardCount = useMemo(() => {
    const cardStr = typeof cards === 'string' ? cards : '';
    return cardStr.split('\n').filter(l => l.trim()).length;
  }, [cards]);

  // Process cards on blur - remove duplicates and expired cards
  const handleCardsBlur = useCallback(() => {
    const cardStr = typeof cards === 'string' ? cards : '';
    if (!cardStr.trim() || isLoading) return;

    const result = processCardInput(cardStr);
    if (result.hasChanges) {
      setCards(result.cleanedInput);
      const toastMsg = getProcessingToastMessage(result);
      if (toastMsg) {
        info(toastMsg.message);
      }
    }
  }, [cards, isLoading, setCards, info]);

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
      <div className={cn(
        "rounded-lg overflow-hidden transition-all duration-200",
        // Light mode - visible container
        "bg-white border border-[rgb(230,225,223)] shadow-sm",
        // Dark mode
        "dark:bg-white/5 dark:border-white/10 dark:shadow-none",
        // Focus states
        "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
        "dark:focus-within:border-white/20 dark:focus-within:ring-primary/20"
      )}>
        <Textarea
          id="cards-input"
          name="cards-input"
          className={cn(
            "font-mono text-xs min-h-[80px] resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "bg-transparent dark:bg-transparent",
            isLoading && "opacity-50"
          )}
          placeholder="Enter cards (one per line)&#10;4111111111111111|01|2025|123"
          value={cards}
          onChange={(e) => setCards(e.target.value)}
          onBlur={handleCardsBlur}
          disabled={isLoading}
        />

        {/* Action bar below textarea */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[rgb(230,225,223)] bg-[rgb(250,249,249)] dark:border-white/10 dark:bg-white/5">
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
              onClick={clearCards}
              disabled={isLoading || cardCount === 0}
              title="Clear cards"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            {isLoading ? (
              <Button variant="destructive" size="sm" className="h-8" onClick={handleStop}>
                Stop
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="h-8" 
                onClick={handleCheckCards} 
                disabled={isCheckingProxy || !canCheck}
                title={
                  !hasValidKey
                    ? 'Enter a valid SK key (sk_live_...)'
                    : !settings?.proxy?.trim()
                      ? 'Proxy is required'
                      : undefined
                }
              >
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
      <div className="space-y-3 pt-4 border-t border-[rgb(230,225,223)] dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <Label className="text-xs font-medium">API Keys</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <SpeedBadge gatewayId="charge" config={chargeSpeedConfig} disabled={isLoading} />
          </div>
        </div>

        <Select
          value={String(selectedKeyIndex)}
          onValueChange={(val) => {
            const index = val === 'manual' || val === '-1' ? -1 : parseInt(val);
            onKeySelect?.(index);
            if (index >= 0 && keyResults[index]) {
              const accountName = keyResults[index].accountName && keyResults[index].accountName !== 'N/A'
                ? keyResults[index].accountName
                : 'Unknown';
              success(`Key selected • ${accountName}`);
            } else if (index === -1) {
              info('Switched to manual input');
            }
          }}
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

        <ProxyInput
          ref={proxyInputRef}
          placeholder="Proxy (host:port:user:pass)"
          value={settings?.proxy || ''}
          onChange={(e) => handleSettingChange('proxy', e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Settings Section - Currency & Amount */}
      <div className="space-y-3 pt-4 border-t border-[rgb(230,225,223)] dark:border-white/10">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">💰 Currency & Amount</Label>
        </div>

        {/* Currency Selection */}
        <div className="flex items-center gap-2">
          <Label className="text-xs w-16">Currency</Label>
          <Select
            value={settings?.currency || 'USD'}
            onValueChange={(val) => handleSettingChange('currency', val)}
            disabled={isLoading}
          >
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
              <SelectItem value="INR">INR - Indian Rupee</SelectItem>
              <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
              <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
              <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input with Check Button */}
        <div className="flex items-center gap-2">
          <Label htmlFor="charge-amount" className="text-xs w-16">Amount</Label>
          <Input
            id="charge-amount"
            name="charge-amount"
            type="number"
            min="0.50"
            max="50"
            step="0.01"
            value={settings?.chargeAmount || ''}
            onChange={(e) => handleSettingChange('chargeAmount', e.target.value)}
            placeholder="1"
            disabled={isLoading}
            className="flex-1 h-8 text-xs"
          />
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs px-3"
            onClick={handleCheckConversion}
            disabled={isLoading || isCheckingConversion}
          >
            {isCheckingConversion ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Check'}
          </Button>
        </div>

        {/* Conversion Result Display */}
        {conversionResult && (
          <div className="relative rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <button
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              onClick={() => setConversionResult(null)}
            >
              ×
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              Conversion Result
            </div>
            <div className="mt-2 text-sm font-semibold">
              {conversionResult.amount} {conversionResult.from} → <span className="text-emerald-600 dark:text-emerald-400">{conversionResult.converted} USD</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Rate: 1 {conversionResult.from} = {conversionResult.rate} USD
            </div>
          </div>
        )}

        {/* Tip about currency matching */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/50 rounded-md p-2">
          <span>💡</span>
          <span>Match currency to SK account's default to reduce Radar risk</span>
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
              <div className="p-4 border-b border-[rgb(230,225,223)] dark:border-white/10 flex justify-center">{modeSwitcher}</div>
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

  const handleCopy = useCallback(() => {
    onCopy(result);
  }, [onCopy, result]);

  const message = formatCardMessage(result);

  // Check for BIN data (supports both nested and flat fields)
  const hasBinData = result.binData || result.brand || result.type || result.country;
  
  // Check for security data
  const hasSecurityData = isFullView && (
    (result.riskLevel && result.riskLevel !== 'unknown') ||
    (result.avsCheck && result.avsCheck !== 'unknown') ||
    (result.cvcCheck && result.cvcCheck !== 'unknown')
  );

  return (
    <ResultCard status={result.status} interactive>
      <ResultCardContent>
        {/* Zone 1: Header - Status + Card Number + Actions */}
        <ResultCardHeader>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Badge variant={getStatusVariant(result.status)} className="text-[10px] font-semibold shrink-0">
              {result.status}
            </Badge>
            <CardNumber card={result.card} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DurationDisplay duration={result.duration} />
            <CopyButton 
              value={result.card}
              isCopied={isCopied}
              onCopy={handleCopy}
              title="Copy card"
            />
          </div>
        </ResultCardHeader>

        {/* Zone 2: Rich Data - BIN info (only for LIVE/APPROVED) */}
        {isFullView && hasBinData && (
          <ResultCardDataZone>
            <BINDataDisplay 
              binData={result.binData}
              brand={result.brand}
              type={result.type}
              category={result.category}
              country={result.country}
              countryFlag={result.countryFlag}
              bank={result.bank}
            />
          </ResultCardDataZone>
        )}

        {/* Zone 3: Response - Message (for LIVE/APPROVED or errors) */}
        {(isFullView && result.message) && (
          <ResultCardResponseZone>
            <ResultCardMessage status={result.status} className="truncate flex-1">
              {result.message}
            </ResultCardMessage>
          </ResultCardResponseZone>
        )}

        {/* Zone 4: Security - Risk, CVC, AVS checks (only for LIVE/APPROVED with data) */}
        {hasSecurityData && (
          <ResultCardSecurityZone>
            <SecurityIndicators
              riskLevel={result.riskLevel}
              riskScore={result.riskScore}
              cvcCheck={result.cvcCheck}
              avsCheck={result.avsCheck}
            />
          </ResultCardSecurityZone>
        )}

        {/* Error/Declined message (non-live cards) */}
        {!isFullView && message && (
          <ResultCardResponseZone>
            <ResultCardMessage status={result.status} className="truncate">
              {message.length > 80 ? message.substring(0, 80) + '...' : message}
            </ResultCardMessage>
          </ResultCardResponseZone>
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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(248,247,247)] dark:bg-white/10 mb-4">
        <CreditCard className="h-8 w-8 text-[rgb(145,134,131)] dark:text-white/50" />
      </div>
      <p className="text-lg font-semibold text-[rgb(37,27,24)] dark:text-white">No cards validated yet</p>
      <p className="text-sm text-[rgb(145,134,131)] dark:text-white/50 mt-1">Enter cards in the left panel to start</p>
    </motion.div>
  );
}
