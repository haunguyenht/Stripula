import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { CreditCard, Trash2, Key, Loader2, Circle, Mail, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useToast } from '@/hooks/useToast';
import { useCardFilters } from '@/hooks/useCardFilters';
import { useCardInputLimits } from '@/hooks/useCardInputLimits';
import { useCredits } from '@/hooks/useCredits';
import { useGatewayCreditRates } from '@/hooks/useGatewayCreditRates';
import { processCardInput, getProcessingToastMessage, getTierLimitExceededMessage, validateForSubmission, getGeneratedCardsErrorMessage } from '@/lib/utils/card-parser';

// Layout
import { TwoPanelLayout } from '../../layout/TwoPanelLayout';

// Components
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  ThreeDSIndicator,
  AmountDisplay,
  CreditsBadge,
  CopyButton,
  CardNumber,
  GatewayBadge,
} from '@/components/ui/result-card-parts';
import { cn } from '@/lib/utils';

// Utils
import { parseProxy } from '@/utils/proxy';
import { handleCreditError, showCreditErrorToast } from '@/utils/creditErrors';
import { GatewayMessageFormatter } from '@/utils/gatewayMessage';
import {
  getStatusVariant,
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
  setCardStatsImmediate,
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

  // Pre-fetch speed config once at panel level to avoid re-fetching on dropdown open
  const { user } = useAuth();
  const userTier = user?.tier || 'free';
  const { config: chargeSpeedConfig } = useSpeedConfig('charge', userTier);

  // Card input limits based on user tier - Requirements: 1.1, 1.2, 1.3
  const { getLimitStatus } = useCardInputLimits();
  
  // Credit management for SK-based charge
  const {
    setBalance,
    refresh: refreshCredits
  } = useCredits({ gatewayId: 'skbased-1' });
  
  // Get pricing from database
  const { getPricing } = useGatewayCreditRates();
  const pricing = getPricing('skbased-1');
  
  // Track card count and limit status for validation
  const cardCount = useMemo(() => {
    if (!cards || typeof cards !== 'string') return 0;
    const result = processCardInput(cards);
    return result.validCount || 0;
  }, [cards]);
  
  const limitStatus = useMemo(() => {
    return getLimitStatus(cardCount);
  }, [getLimitStatus, cardCount]);

  // Check if SK key is valid (either from manual input or selected from list)
  const hasValidKey = useMemo(() => {
    const skKey = settings?.skKey?.trim() || '';
    return skKey.startsWith('sk_live_') && skKey.length >= 30;
  }, [settings?.skKey]);

  // Check if all required inputs are valid for checking
  const canCheck = useMemo(() => {
    const hasCards = typeof cards === 'string' && cards.trim().length > 0;
    const hasProxy = settings?.proxy?.trim()?.length > 0;
    const withinTierLimit = limitStatus.isWithinLimit;
    return hasValidKey && hasCards && hasProxy && withinTierLimit;
  }, [hasValidKey, cards, settings?.proxy, limitStatus.isWithinLimit]);

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
    // useBoundedResults.setResults([]) already uses immediate write internally
    setCardResults([]);
    // Use immediate setter for stats to bypass debounce
    if (setCardStatsImmediate) {
      setCardStatsImmediate({ approved: 0, live: 0, die: 0, error: 0, total: 0 });
    } else {
      setCardStats({ approved: 0, live: 0, die: 0, error: 0, total: 0 });
    }
    setPage(1);
  }, [setCardResults, setCardStats, setCardStatsImmediate]);

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

    // Process and validate cards before submission
    const parseResult = processCardInput(cardList);
    const validation = validateForSubmission(parseResult);

    // Block if no valid cards
    if (!validation.canSubmit && validation.errorType === 'no_valid_cards') {
      warning(validation.reason || 'No valid cards to process');
      return;
    }

    // Block if generated cards detected
    if (!validation.canSubmit && validation.errorType === 'generated_cards') {
      const genError = getGeneratedCardsErrorMessage(parseResult.generatedDetection);
      toastError(genError?.message || 'Generated cards not allowed');
      return;
    }

    const totalCards = parseResult.validCount;

    // Check tier limit before starting validation - Requirements: 1.2, 1.3
    if (!limitStatus.isWithinLimit) {
      const tierLimitMsg = getTierLimitExceededMessage(totalCards, limitStatus.limit, userTier);
      toastError(tierLimitMsg.message);
      return;
    }

    setIsLoading(true);
    abortRef.current = false;
    setProgress({ current: 0, total: totalCards });

    setCurrentItem(`Starting validation...`);
    info(`Starting validation for ${parseResult.validCount} cards`);

    let currentCards = cards;

    // Track batch stats for this run (start fresh, not accumulated)
    let batchStats = { approved: 0, live: 0, die: 0, error: 0, total: 0 };

    try {
      abortControllerRef.current = new AbortController();

      const proxyObj = parseProxy(settings.proxy);
      const amount = parseFloat(settings.chargeAmount) || 1;
      const currency = settings.currency || 'usd';
      
      // Convert amount to cents
      const chargeAmountCents = Math.round(amount * 100);

      const response = await fetch('/api/skbased/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skKey: settings.skKey.trim(),
          pkKey: settings.pkKey?.trim() || null,
          cards: cardList.split('\n').map(l => l.trim()).filter(l => l && l.includes('|')),
          proxy: proxyObj,
          chargeAmount: chargeAmountCents,
          currency
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

            // Process side effects immediately (celebration + balance update)
            if (r.status === 'APPROVED' || r.status === 'Charged') celebrate();
            
            // Update balance if provided in result
            if (typeof r.newBalance === 'number') {
              setBalance(r.newBalance);
            }

            // Remove processed card from input
            // Use fullCard which contains the complete card number
            if (fullCard && fullCard !== 'Unknown card') {
              const cardNumber = fullCard.split(/[|,\s]/)[0]; // Get just the card number part
              if (cardNumber && cardNumber.length >= 13) {
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

    // Refresh credits to get updated balance from server
    refreshCredits().catch(() => { });

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
          {/* Card count badge with tier limit */}
          <div className="flex items-center gap-2">
            <Badge
              variant={limitStatus.isError ? "destructive" : limitStatus.isWarning ? "warning" : "secondary"}
              className={cn(
                "text-[10px] h-6",
                limitStatus.isError && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                limitStatus.isWarning && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              )}
            >
              {cardCount}/{limitStatus.limit} cards
              {limitStatus.isWarning && <AlertTriangle className="w-3 h-3 ml-1" />}
            </Badge>
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
                      : limitStatus.isError
                        ? `Exceeds ${userTier} tier limit of ${limitStatus.limit} cards`
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

      {/* Tier limit exceeded warning */}
      {limitStatus.isError && (
        <Alert variant="destructive" className="text-xs py-2.5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {cardCount} cards but your {userTier} tier limit is {limitStatus.limit}.
            Please remove {limitStatus.excess} card{limitStatus.excess > 1 ? 's' : ''} to continue.
          </AlertDescription>
        </Alert>
      )}

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
          <div className="flex items-center gap-2">
            {/* Credit Cost Display - from database */}
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400">Approved {pricing?.approved ?? 5}</span>
              <span>|</span>
              <span className="text-blue-600 dark:text-blue-400">Live {pricing?.live ?? 3}</span>
            </div>
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
          disabled={isLoading || isCheckingProxy}
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

      {/* Settings Section - Charge Amount & Currency */}
      <div className="space-y-3 pt-4 border-t border-[rgb(230,225,223)] dark:border-white/10">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <span className="text-base">💰</span>
          Charge Amount
        </Label>

        <div className="flex gap-2">
          <Input
            id="charge-amount"
            name="charge-amount"
            type="number"
            min="0.50"
            max="50"
            step="0.01"
            value={settings?.chargeAmount || ''}
            onChange={(e) => handleSettingChange('chargeAmount', e.target.value)}
            placeholder="1.00"
            disabled={isLoading}
            className="h-9 text-xs font-mono flex-1"
          />
          <Select
            value={settings?.currency || 'usd'}
            onValueChange={(val) => handleSettingChange('currency', val)}
            disabled={isLoading}
          >
            <SelectTrigger className="h-9 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD $</SelectItem>
              <SelectItem value="gbp">GBP £</SelectItem>
              <SelectItem value="eur">EUR €</SelectItem>
              <SelectItem value="cad">CAD $</SelectItem>
              <SelectItem value="aud">AUD $</SelectItem>
              <SelectItem value="jpy">JPY ¥</SelectItem>
              <SelectItem value="chf">CHF</SelectItem>
              <SelectItem value="sek">SEK</SelectItem>
              <SelectItem value="nok">NOK</SelectItem>
              <SelectItem value="dkk">DKK</SelectItem>
              <SelectItem value="pln">PLN</SelectItem>
              <SelectItem value="inr">INR ₹</SelectItem>
              <SelectItem value="sgd">SGD $</SelectItem>
              <SelectItem value="hkd">HKD $</SelectItem>
              <SelectItem value="nzd">NZD $</SelectItem>
              <SelectItem value="mxn">MXN $</SelectItem>
              <SelectItem value="brl">BRL R$</SelectItem>
            </SelectContent>
          </Select>
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
 * Standardize decline messages for better readability
 */
/**
 * CardResultCard - Individual card result using ResultCard component
 * Supports SK-based charger response format:
 * { success, status, card, amount, risk_level, avs_check, cvc_check, brand, funding, country, threeDs, pm_id, pi_id, time_taken }
 */
const CardResultCard = React.memo(function CardResultCard({ result, copiedCard, onCopy }) {
  // Normalize status - SK-based returns "Charged", "Live", "Declined"
  const normalizedStatus = useMemo(() => {
    const s = result.status?.toUpperCase();
    if (s === 'CHARGED') return 'APPROVED';
    return s || 'UNKNOWN';
  }, [result.status]);
  
  const isFullView = normalizedStatus === 'LIVE' || normalizedStatus === 'APPROVED';
  const isDeclined = normalizedStatus === 'DECLINED' || normalizedStatus === 'DIE' || normalizedStatus === 'DEAD';
  const resultId = result.id || result.fullCard || result.card;
  const isCopied = copiedCard === resultId;
  
  // Always use fullCard (unmasked) for display, fallback to card if not available
  const displayCard = result.fullCard || result.card;

  const handleCopy = useCallback(() => {
    onCopy(result);
  }, [onCopy, result]);

  // Check for BIN data (supports both nested and flat fields)
  // SK-based returns: brand, funding, country
  const hasBinData = result.binData || result.brand || result.type || result.country || result.funding;
  
  // Check for security data - show for live/approved AND declined
  // SK-based returns: risk_level, avs_check, cvc_check (snake_case)
  const riskLevel = result.riskLevel || result.risk_level;
  const avsCheck = result.avsCheck || result.avs_check;
  const cvcCheck = result.cvcCheck || result.cvc_check;
  const threeDs = result.threeDs || result.three_ds;
  
  // Show security data for live/approved or declined with risk info
  const hasSecurityData = (isFullView || isDeclined) && (
    (riskLevel && riskLevel !== 'unknown') ||
    (avsCheck && avsCheck !== 'unknown') ||
    (cvcCheck && cvcCheck !== 'unknown') ||
    (threeDs && threeDs !== 'unknown' && threeDs !== 'none')
  );

  // Duration - SK-based returns time_taken in seconds - show for ALL results
  const duration = result.duration || (result.time_taken ? result.time_taken * 1000 : null);
  
  // Format message using centralized GatewayMessageFormatter
  const displayMessage = useMemo(() => {
    const declineCode = result.declineCode || result.decline_code || result.code;
    if (isDeclined || normalizedStatus === 'ERROR') {
      const formatted = GatewayMessageFormatter.format({
        status: normalizedStatus,
        message: result.message,
        declineCode
      });
      return formatted.message;
    }
    return formatCardMessage(result);
  }, [result, isDeclined, normalizedStatus]);

  return (
    <ResultCard status={normalizedStatus} interactive>
      <ResultCardContent>
        {/* Zone 1: Header - Status + Card Number + Duration + Actions */}
        <ResultCardHeader>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Badge variant={getStatusVariant(normalizedStatus)} className="text-[10px] font-semibold shrink-0">
              {normalizedStatus}
            </Badge>
            <CardNumber card={displayCard} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Show amount for charged cards */}
            {isFullView && result.amount && (
              <AmountDisplay 
                amount={result.amount} 
                currency={result.currency}
              />
            )}
            {/* Show credits deducted for charged cards */}
            {isFullView && result.creditsDeducted > 0 && (
              <CreditsBadge credits={result.creditsDeducted} />
            )}
            {/* Show duration for ALL results */}
            <DurationDisplay duration={duration} />
            <CopyButton 
              value={displayCard}
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
              funding={result.funding}
            />
          </ResultCardDataZone>
        )}

        {/* Zone 3: Response - Message + Gateway (for LIVE/APPROVED) */}
        {isFullView && displayMessage && (
          <ResultCardResponseZone>
            <ResultCardMessage status={normalizedStatus} className="sm:truncate flex-1">
              {displayMessage}
            </ResultCardMessage>
            <GatewayBadge gateway={result.gateway} site={result.site} />
          </ResultCardResponseZone>
        )}

        {/* Zone 4: Security - Risk, CVC, AVS, 3DS checks (for LIVE/APPROVED and DECLINED with data) */}
        {hasSecurityData && (
          <ResultCardSecurityZone>
            <SecurityIndicators
              riskLevel={riskLevel}
              riskScore={result.riskScore || result.risk_score}
              cvcCheck={cvcCheck}
              avsCheck={avsCheck}
            />
            {isFullView && <ThreeDSIndicator threeDs={threeDs} />}
          </ResultCardSecurityZone>
        )}

        {/* Declined/Error message (non-live cards) */}
        {!isFullView && displayMessage && (
          <ResultCardResponseZone>
            <ResultCardMessage status={normalizedStatus} className="sm:truncate flex-1">
              {displayMessage}
            </ResultCardMessage>
            <GatewayBadge gateway={result.gateway} site={result.site} />
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
