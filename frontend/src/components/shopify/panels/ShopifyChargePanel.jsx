import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ShoppingBag, Globe, Link } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useBoundedResults } from '@/hooks/useBoundedStorage';
import { useCredits } from '@/hooks/useCredits';
import { useGatewayStatus } from '@/hooks/useGatewayStatus';
import { useCardInputLimits } from '@/hooks/useCardInputLimits';
import { useValidation } from '@/contexts/ValidationContext';
import { useDebouncedValue } from '@/hooks/useDebouncedFilter';
import { processCardInput, getProcessingToastMessage, getTierLimitExceededMessage, validateForSubmission, getGeneratedCardsErrorMessage } from '@/lib/utils/card-parser';
import { handleCreditError, showCreditErrorToast, handleBackendError, handleTimeoutError } from '@/utils/creditErrors';

import { useSpeedConfig } from '@/hooks/useSpeedConfig';
import { GatewayUnavailableMessage, GatewayStatusIndicator } from '@/components/ui/GatewayStatusIndicator';
import { ExportButton } from '@/components/ui/ExportButton';
import { CardInputSection } from '@/components/ui/CardInputSection';

import { TwoPanelLayout } from '../../layout/TwoPanelLayout';
import { ResultsPanel, ResultItem, ProgressBar } from '../../stripe/ResultsPanel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProxyInput } from '@/components/ui/ProxyInput';
import { parseProxy } from '@/utils/proxy';
import { Celebration, useCelebration } from '@/components/ui/Celebration';
import { 
  ResultCard, 
  ResultCardContent,
  ResultCardHeader,
  ResultCardDataZone,
  ResultCardResponseZone,
  ResultCardMessage,
} from '@/components/ui/result-card';
import { 
  BINDataDisplay, 
  DurationDisplay, 
  CopyButton,
  CardNumber,
  GatewayBadge,
} from '@/components/ui/result-card-parts';
import { CreditSummary, BatchConfirmDialog, BATCH_CONFIRM_THRESHOLD, EffectiveRateBadge, BatchConfigCard } from '@/components/credits';
import { useGatewayCreditRates } from '@/hooks/useGatewayCreditRates';
import { cn } from '@/lib/utils';

export function ShopifyChargePanel() {
  const [cards, setCards] = useLocalStorage('shopifyChargeCards', '');
  const [shopifyUrl, setShopifyUrl] = useLocalStorage('shopifyChargeUrl', '');
  const [proxyString, setProxyString] = useLocalStorage('shopifyChargeProxy', '');
  const { 
    results: cardResults, 
    setResults: setCardResults 
  } = useBoundedResults('session_shopifyResults', []);
  const [cardStats, setCardStats, setCardStatsImmediate] = useSessionStorage('session_shopifyStats', { approved: 0, declined: 0, error: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentItem, setCurrentItem] = useState(null);
  const [copiedCard, setCopiedCard] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [batchComplete, setBatchComplete] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [batchConfirmResolve, setBatchConfirmResolve] = useState(null);
  const [pendingBatchInfo, setPendingBatchInfo] = useState(null);

  const abortRef = useRef(false);
  const abortControllerRef = useRef(null);
  const proxyInputRef = useRef(null);
  const [isCheckingProxy, setIsCheckingProxy] = useState(false);
  const { success, error: toastError, info, warning } = useToast();
  const { trigger: celebrationTrigger, celebrate } = useCelebration();

  const {
    balance,
    effectiveRate,
    isAuthenticated,
    creditsConsumed,
    liveCardsCount,
    trackLiveCard,
    resetTracking,
    setBalance,
    refresh: refreshCredits
  } = useCredits({ gatewayId: 'auto-shopify-1' });

  const { getGateway, isGatewayAvailable } = useGatewayStatus();
  const { getLimitStatus, userTier, getCurrentUserLimit } = useCardInputLimits();
  const { config: shopifySpeedConfig } = useSpeedConfig('charge', userTier);
  
  // Gateway credit rates for displaying pricing
  const { getPricing } = useGatewayCreditRates();
  const pricing = useMemo(() => getPricing('auto-shopify-1'), [getPricing]);

  const gatewayStatus = useMemo(() => getGateway('auto-shopify-1'), [getGateway]);
  const isGatewayReady = gatewayStatus?.isAvailable !== false;

  const validationContext = useValidation();

  const handleAbort = useCallback(() => {
    abortRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    fetch('/api/shopify/stop', { method: 'POST' }).catch(() => {});
    setIsLoading(false);
    setCurrentItem(null);
  }, []);

  // Cleanup on unmount - abort client request AND stop backend processing
  useEffect(() => {
    return () => {
      if (abortControllerRef?.current) {
        abortControllerRef.current.abort();
        fetch('/api/shopify/stop', { method: 'POST' }).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading && validationContext) {
      validationContext.startValidation('shopify', handleAbort);
    } else if (!isLoading && validationContext) {
      validationContext.endValidation();
    }
  }, [isLoading, validationContext, handleAbort]);

  const handleStop = useCallback(() => {
    handleAbort();
    info('Validation stopped');
  }, [handleAbort, info]);

  const clearCards = useCallback(() => {
    setCards('');
  }, [setCards]);

  const clearResults = useCallback(() => {
    setCardResults([]);
    setCardStatsImmediate({ approved: 0, declined: 0, error: 0, total: 0 });
    setBatchComplete(false);
    resetTracking();
    refreshCredits();
  }, [setCardResults, setCardStatsImmediate, resetTracking, refreshCredits]);

  // Sync stats with actual results on mount (fixes stale stats after refresh)
  useEffect(() => {
    if (cardResults.length > 0 && !isLoading) {
      const recalculatedStats = cardResults.reduce((acc, r) => {
        const status = r.status?.toUpperCase();
        if (status === 'APPROVED') acc.approved++;
        else if (status === 'DECLINED') acc.declined++;
        else acc.error++;
        acc.total++;
        return acc;
      }, { approved: 0, declined: 0, error: 0, total: 0 });

      if (recalculatedStats.total !== cardStats.total ||
        recalculatedStats.approved !== cardStats.approved) {
        setCardStats(recalculatedStats);
      }
    }
  }, []);

  const handleCopyCard = useCallback((card) => {
    navigator.clipboard.writeText(card);
    setCopiedCard(card);
    setTimeout(() => setCopiedCard(null), 2000);
  }, []);

  const handleFilterChange = useCallback((f) => {
    setFilter(f);
    setPage(1);
  }, []);

  const needsBatchConfirmation = useCallback((count) => count > BATCH_CONFIRM_THRESHOLD, []);

  const handleBatchConfirm = useCallback(() => {
    if (batchConfirmResolve) batchConfirmResolve(true);
    setShowBatchConfirm(false);
    setBatchConfirmResolve(null);
    setPendingBatchInfo(null);
  }, [batchConfirmResolve]);

  const handleBatchCancel = useCallback(() => {
    if (batchConfirmResolve) batchConfirmResolve(false);
    setShowBatchConfirm(false);
    setBatchConfirmResolve(null);
    setPendingBatchInfo(null);
  }, [batchConfirmResolve]);

  // Validate Shopify URL
  const isValidShopifyUrl = useMemo(() => {
    if (!shopifyUrl.trim()) return false;
    try {
      const url = new URL(shopifyUrl);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, [shopifyUrl]);

  // Validate proxy (required) - check format with parseProxy
  const hasValidProxy = useMemo(() => {
    if (!proxyString.trim()) return false;
    const parsed = parseProxy(proxyString);
    return parsed !== null;
  }, [proxyString]);

  const handleCheckCards = async () => {
    if (isLoading || isCheckingProxy) return;

    const cardList = cards.trim();
    if (!cardList) {
      warning('Enter at least one card');
      return;
    }

    if (!isValidShopifyUrl) {
      warning('Enter a valid Shopify URL');
      return;
    }

    if (!hasValidProxy) {
      warning('Proxy is required for Auto Shopify API');
      return;
    }

    // Check proxy before validation (same as SKBased)
    if (proxyInputRef.current) {
      setIsCheckingProxy(true);
      try {
        const proxyResult = await proxyInputRef.current.checkProxy(true);
        if (!proxyResult.valid) {
          return;
        }

        if (proxyResult.isStatic) {
          warning('Static IP detected - results may be affected. Rotating proxy recommended.');
        }
      } finally {
        setIsCheckingProxy(false);
      }
    }

    const processResult = processCardInput(cardList);
    const validation = validateForSubmission(processResult);

    if (!validation.canSubmit && validation.errorType === 'no_valid_cards') {
      warning(validation.reason || 'No valid cards to process');
      return;
    }

    if (!validation.canSubmit && validation.errorType === 'generated_cards') {
      const genError = getGeneratedCardsErrorMessage(processResult.generatedDetection);
      toastError(genError?.message || 'Generated cards not allowed');
      return;
    }

    const totalCards = processResult.validCount;

    if (!limitStatus.isWithinLimit) {
      const tierLimitMsg = getTierLimitExceededMessage(totalCards, limitStatus.limit, userTier);
      toastError(tierLimitMsg.message);
      return;
    }

    if (isAuthenticated && needsBatchConfirmation(totalCards)) {
      const confirmed = await new Promise((resolve) => {
        setPendingBatchInfo({
          cardCount: totalCards,
          balance,
          effectiveRate,
          gatewayName: 'Auto Shopify'
        });
        setBatchConfirmResolve(() => resolve);
        setShowBatchConfirm(true);
      });

      if (!confirmed) return;
    }

    setIsLoading(true);
    setBatchComplete(false);
    resetTracking();
    abortRef.current = false;
    setProgress({ current: 0, total: totalCards });
    setCurrentItem('Starting Shopify validation...');
    info(`Starting Shopify validation for ${totalCards} cards`);

    // Track batch stats for this run
    let batchStats = { approved: 0, declined: 0, error: 0, total: 0 };
    const initialStats = {
      approved: cardStats.approved || 0,
      declined: cardStats.declined || 0,
      error: cardStats.error || 0,
      total: cardStats.total || 0
    };
    let currentCards = cards;

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/shopify/batch-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardList,
          concurrency: 1,
          shopifyUrl: shopifyUrl.trim(),
          proxy: proxyString.trim()
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const creditError = await handleCreditError(response);
        if (creditError) {
          showCreditErrorToast({ error: toastError, warning, info }, creditError);
          setIsLoading(false);
          setCurrentItem(null);
          return;
        }

        const backendError = await handleBackendError(response);
        if (backendError) {
          showCreditErrorToast({ error: toastError, warning, info }, backendError);
          setIsLoading(false);
          setCurrentItem(null);
          return;
        }

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
      // Use refs for batched processing (same as Auth panel)
      const pendingResultsRef = { current: [] };
      let lastUIUpdate = Date.now();
      const UI_UPDATE_INTERVAL = 50; // ms - batch UI updates

      // Helper to flush pending results to UI
      const flushPendingResults = () => {
        if (pendingResultsRef.current.length > 0) {
          newResults = [...pendingResultsRef.current, ...newResults];
          pendingResultsRef.current = [];
          setCardResults([...newResults]);
          setCardStats({
            approved: initialStats.approved + batchStats.approved,
            declined: initialStats.declined + batchStats.declined,
            error: initialStats.error + batchStats.error,
            total: initialStats.total + batchStats.total
          });
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
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
            setProgress({ current: data.processed, total: data.total });
            setCurrentItem(`${data.processed}/${data.total}`);
          } else if (event === 'result') {
            const r = data;
            const resultId = `${r.card}-${Date.now()}-${newResults.length + pendingResultsRef.current.length}`;
            const resultObj = {
              ...r,
              id: resultId,
              fullCard: r.card
            };
            
            // Add to pending batch instead of immediate UI update
            pendingResultsRef.current.unshift(resultObj);

            // Process side effects immediately (celebration, stats, credit tracking)
            if (r.status === 'APPROVED') {
              celebrate();
              batchStats.approved++;
              trackLiveCard(pricing?.approved || effectiveRate);
              if (typeof r.newBalance === 'number') {
                setBalance(r.newBalance);
              }
            } else if (r.status === 'DECLINED') {
              batchStats.declined++;
            } else if (r.status === 'SITE_DEAD') {
              batchStats.error++;
              // Show site dead warning once per batch and stop message
              if (!batchStats.siteDeadWarningShown) {
                batchStats.siteDeadWarningShown = true;
                toastError('Site is dead or blocked. Batch stopped - please change to a different Shopify site URL.');
              }
            } else if (r.status === 'CAPTCHA') {
              batchStats.error++;
              // Show captcha warning once per batch and stop message
              if (!batchStats.captchaWarningShown) {
                batchStats.captchaWarningShown = true;
                toastError('CAPTCHA detected after 3 retries. Batch stopped - please change site or use different proxies.');
              }
            } else {
              batchStats.error++;
              // Show error message once per batch
              if (!batchStats.errorWarningShown) {
                batchStats.errorWarningShown = true;
                const errorMsg = r.message || 'Validation error';
                if (errorMsg.toLowerCase().includes('timeout')) {
                  toastError('Request timeout. Site may be slow or down - try a different site.');
                } else {
                  toastError(`Error: ${errorMsg}`);
                }
              }
            }
            batchStats.total++;

            // Remove processed card from input
            if (r.card) {
              const cardNumber = r.card.split(/[|:,\s]/)[0];
              currentCards = currentCards
                .split('\n')
                .filter(line => {
                  const trimmed = line.trim();
                  if (!trimmed) return false;
                  const lineCardNumber = trimmed.split(/[|:,\s]/)[0];
                  return lineCardNumber !== cardNumber;
                })
                .join('\n');
              setCards(currentCards);
            }

            // Batch UI updates - flush when batch is full (10) or timeout (50ms)
            const now = Date.now();
            if (pendingResultsRef.current.length >= 10 || (now - lastUIUpdate) >= UI_UPDATE_INTERVAL) {
              flushPendingResults();
              lastUIUpdate = now;
            }
          } else if (event === 'credit_exhausted') {
            flushPendingResults();
            setCardStats({
              approved: initialStats.approved + batchStats.approved,
              declined: initialStats.declined + batchStats.declined,
              error: initialStats.error + batchStats.error,
              total: initialStats.total + batchStats.total
            });
            setBatchComplete(true);
            setIsLoading(false);
            if (typeof data.balance === 'number') {
              setBalance(data.balance);
            }
            warning(`Credits exhausted! Processed ${data.processed}/${data.total} cards. Add credits to continue.`);
          } else if (event === 'complete') {
            flushPendingResults();
            setCardStats({
              approved: initialStats.approved + batchStats.approved,
              declined: initialStats.declined + batchStats.declined,
              error: initialStats.error + batchStats.error,
              total: initialStats.total + batchStats.total
            });
            setBatchComplete(true);
            if (typeof data.newBalance === 'number') {
              setBalance(data.newBalance);
            }
          } else if (event === 'error') {
            flushPendingResults();
            toastError(data.message || 'Validation error');
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        const timeoutError = handleTimeoutError(err);
        if (timeoutError) {
          showCreditErrorToast({ error: toastError, warning, info }, timeoutError);
        } else {
          toastError(err.message || 'Connection error');
        }
      }
    }

    setIsLoading(false);
    setCurrentItem(null);
    abortControllerRef.current = null;

    if (!abortRef.current) {
      const { approved = 0, declined = 0, error: errCount = 0 } = batchStats;
      success(`Shopify complete: ${approved} approved, ${declined} declined, ${errCount} errors`);
      setBatchComplete(true);
      // Show credit deduction toast if there were live cards
      if (isAuthenticated && approved > 0) {
        const creditsUsed = Math.ceil(approved * effectiveRate);
        info(`${creditsUsed} credits deducted for ${approved} live card${approved > 1 ? 's' : ''}`);
      }
      refreshCredits().catch(() => {});
    }
  };

  const cardValidation = useMemo(() => {
    if (!cards.trim()) {
      return { validCount: 0, isGenerated: false, generatedDetection: null };
    }
    const result = processCardInput(cards, { detectGenerated: true });
    return {
      validCount: result.validCount,
      isGenerated: result.isGenerated,
      generatedDetection: result.generatedDetection,
    };
  }, [cards]);

  const cardCount = cardValidation.validCount;
  const limitStatus = useMemo(() => getLimitStatus(cardCount), [getLimitStatus, cardCount]);

  const handleCardsBlur = useCallback(() => {
    if (!cards.trim() || isLoading) return;

    const result = processCardInput(cards);
    if (result.hasChanges) {
      setCards(result.cleanedInput);
      const toastMsg = getProcessingToastMessage(result);
      if (toastMsg) info(toastMsg.message);
    }
  }, [cards, isLoading, setCards, info]);

  const handleImport = useCallback((importedCards, stats, rawInput) => {
    setCards(rawInput);
    clearResults();
  }, [setCards, clearResults]);

  const debouncedFilter = useDebouncedValue(filter);

  const filteredResults = useMemo(() => {
    if (debouncedFilter === 'all') return cardResults;
    return cardResults.filter(r => {
      const status = r.status?.toLowerCase();
      if (debouncedFilter === 'approved') return status === 'approved';
      if (debouncedFilter === 'declined') return status === 'declined';
      if (debouncedFilter === 'error') return status === 'error';
      return true;
    });
  }, [cardResults, debouncedFilter]);

  const handleCopyAllCards = useCallback(() => {
    const cardsToCopy = filteredResults
      .filter(r => r.fullCard || r.card)
      .map(r => r.fullCard || r.card)
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
    { id: 'approved', label: 'Approved', value: cardStats.approved, color: 'emerald', showDot: true },
    { id: 'declined', label: 'Declined', value: cardStats.declined, color: 'rose', showDot: true },
    { id: 'error', label: 'Error', value: cardStats.error, color: 'amber', showDot: true },
  ], [cardStats]);

  const configContent = (
    <div className="space-y-3 sm:space-y-4 p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-1.5 sm:gap-2 pb-1 sm:pb-2">
        <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-semibold text-[rgb(37,27,24)] dark:text-white truncate">Shopify Charge</h2>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Auto Shopify API validation</p>
        </div>
      </div>

      {/* Shopify URL Input */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="shopify-url" className="text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5">
          <Link className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Shopify URL
        </Label>
        <Input
          id="shopify-url"
          type="url"
          placeholder="https://example.myshopify.com"
          value={shopifyUrl}
          onChange={(e) => setShopifyUrl(e.target.value)}
          disabled={isLoading}
          className={cn(
            "font-mono text-[10px] sm:text-xs h-7 sm:h-9",
            !isValidShopifyUrl && shopifyUrl.trim() && "border-red-500/50"
          )}
        />
        {!isValidShopifyUrl && shopifyUrl.trim() && (
          <p className="text-[9px] sm:text-[10px] text-red-500">Enter a valid URL (https://...)</p>
        )}
      </div>

      {/* Proxy Input (Required) - Same as SKBased */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="proxy-input" className="text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5">
          <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Proxy <span className="text-red-500">*</span>
        </Label>
        <ProxyInput
          ref={proxyInputRef}
          value={proxyString}
          onChange={(e) => setProxyString(e.target.value)}
          disabled={isLoading || isCheckingProxy}
          placeholder="host:port:user:pass"
          className={cn(
            "h-7 sm:h-9",
            !hasValidProxy && proxyString.trim() && "border-red-500/50"
          )}
        />
        {!hasValidProxy && proxyString.trim() && (
          <p className="text-[9px] sm:text-[10px] text-red-500">Invalid proxy format. Use: host:port:user:pass</p>
        )}
      </div>

      {/* Card Input */}
      <CardInputSection
        cards={cards}
        onCardsChange={setCards}
        onCardsBlur={handleCardsBlur}
        onImport={handleImport}
        onClear={clearCards}
        onStart={handleCheckCards}
        onStop={handleStop}
        isLoading={isLoading}
        cardCount={cardCount}
        limitStatus={limitStatus}
        cardValidation={cardValidation}
        userTier={userTier}
        isGatewayAvailable={isGatewayReady}
        isStartDisabled={isCheckingProxy || limitStatus.isError || cardCount === 0 || cardValidation.isGenerated || !isValidShopifyUrl || !hasValidProxy || !isGatewayReady}
        startButtonTitle={
          !isValidShopifyUrl
            ? 'Enter a valid Shopify URL'
            : !hasValidProxy
              ? 'Proxy is required'
              : !isGatewayReady
                ? 'Gateway is unavailable'
                : cardValidation.isGenerated 
                  ? 'Generated cards not allowed' 
                  : limitStatus.isError 
                    ? `Exceeds ${userTier} tier limit of ${limitStatus.limit} cards` 
                    : undefined
        }
        startButtonLabel="Start Check"
        progressBar={isLoading && progress.total > 0 && (
          <ProgressBar key="progress" current={progress.current} total={progress.total} />
        )}
      />

      {/* Gateway unavailable warning */}
      {gatewayStatus && !gatewayStatus.isAvailable && (
        <GatewayUnavailableMessage gateway={gatewayStatus} />
      )}

      {/* Unified Gateway + Cost Card (same styling as Auth panel via BatchConfigCard) */}
      {batchComplete && liveCardsCount > 0 ? (
        <CreditSummary
          liveCardsCount={liveCardsCount}
          creditsConsumed={creditsConsumed}
          newBalance={balance}
        />
      ) : (
        <BatchConfigCard
          sites={[{ id: 'auto-shopify-1', label: 'Auto Shopify' }]}
          selectedSite="auto-shopify-1"
          onSiteChange={() => {}} // No-op since only one gateway
          getGateway={getGateway}
          isLoading={isLoading}
          speedConfig={{ concurrency: 1, delay: 5500 }}
          cardCount={cardCount}
          balance={balance}
          effectiveRate={effectiveRate}
          isAuthenticated={isAuthenticated}
          pricing={pricing}
        />
      )}
    </div>
  );

  const resultsContent = (
    <ResultsPanel
      stats={stats}
      activeFilter={filter}
      onFilterChange={handleFilterChange}
      items={paginatedResults}
      renderItem={(result, idx) => (
        <ShopifyResultItem
          key={result.id}
          result={result}
          index={idx}
          copiedCard={copiedCard}
          onCopy={handleCopyCard}
        />
      )}
      getItemKey={(result) => result.id}
      estimateItemSize={80}
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
      pageSize={pageSize}
      onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      onCopyAll={filteredResults.length > 0 ? handleCopyAllCards : undefined}
      onClear={clearResults}
      isLoading={isLoading}
      isEmpty={paginatedResults.length === 0}
      headerActions={
        <ExportButton
          results={cardResults}
          filter={filter}
          disabled={isLoading || cardResults.length === 0}
          variant="ghost"
          size="sm"
          showLabel={false}
          prefix="shopify_results"
        />
      }
    >
      {paginatedResults.map((result, idx) => (
        <ResultItem key={result.id} id={result.id}>
          <ShopifyResultItem
            result={result}
            index={idx}
            copiedCard={copiedCard}
            onCopy={handleCopyCard}
          />
        </ResultItem>
      ))}
    </ResultsPanel>
  );

  return (
    <>
      <Celebration trigger={celebrationTrigger} />
      <BatchConfirmDialog
        open={showBatchConfirm}
        onOpenChange={setShowBatchConfirm}
        cardCount={pendingBatchInfo?.cardCount || 0}
        balance={pendingBatchInfo?.balance || balance}
        effectiveRate={pendingBatchInfo?.effectiveRate || effectiveRate}
        gatewayName={pendingBatchInfo?.gatewayName || 'Auto Shopify'}
        onConfirm={handleBatchConfirm}
        onCancel={handleBatchCancel}
      />
      <TwoPanelLayout
        configPanel={configContent}
        resultsPanel={resultsContent}
      />
    </>
  );
}

function ShopifyResultItem({ result, index, copiedCard, onCopy }) {
  const status = result.status?.toUpperCase();
  const isApproved = status === 'APPROVED';
  const isDeclined = status === 'DECLINED';
  const isError = status === 'ERROR';

  const statusVariant = isApproved ? 'live' : isDeclined ? 'declined' : 'error';
  const badgeVariant = isApproved ? 'live' : isDeclined ? 'dead' : 'error';

  const formatMessage = (r) => {
    const rawMessage = r.message || '';
    if (isApproved) return rawMessage || 'Order completed';
    if (isDeclined) {
      if (rawMessage.includes('insufficient_funds')) return 'Insufficient funds';
      if (rawMessage.includes('lost_card')) return 'Card reported lost';
      if (rawMessage.includes('stolen_card')) return 'Card reported stolen';
      if (rawMessage.includes('expired_card')) return 'Card expired';
      if (rawMessage.includes('incorrect_cvc')) return 'Invalid security code';
      if (rawMessage.includes('do_not_honor')) return 'Do not honor';
      if (rawMessage.includes('CARD_DECLINED')) return 'Card declined';
      return rawMessage || 'Card declined';
    }
    // Handle redundant "Error" message
    if (rawMessage.toLowerCase() === 'error' || rawMessage.trim() === '') {
      return 'Validation failed';
    }
    return rawMessage || 'Validation error';
  };

  const cardDisplay = result.fullCard || result.card;
  const hasBinData = result.binData && (result.binData.brand || result.binData.type || result.binData.country);

  return (
    <ResultCard status={statusVariant}>
      <ResultCardContent>
        {/* Zone 1: Header - Status Badge + Card Number + Duration + Copy */}
        <ResultCardHeader>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Badge variant={badgeVariant} className="text-[10px] font-semibold shrink-0">
              {status}
            </Badge>
            <CardNumber card={cardDisplay} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {result.duration && <DurationDisplay duration={result.duration} />}
            <CopyButton 
              value={cardDisplay} 
              onCopy={onCopy}
              isCopied={copiedCard === cardDisplay}
            />
          </div>
        </ResultCardHeader>

        {/* Zone 2: Rich Data - BIN info (only when available) */}
        {hasBinData && (
          <ResultCardDataZone>
            <BINDataDisplay binData={result.binData} />
          </ResultCardDataZone>
        )}

        {/* Zone 3: Response - Message + Price + Gateway */}
        <ResultCardResponseZone>
          <ResultCardMessage status={statusVariant} className="flex-1 sm:truncate">
            {formatMessage(result)}
          </ResultCardMessage>
          {result.price && (
            <Badge variant="outline" className="text-[10px] h-5 shrink-0">
              ${result.price}
            </Badge>
          )}
          {result.gateway && (
            <GatewayBadge gateway={result.gateway} />
          )}
        </ResultCardResponseZone>
      </ResultCardContent>
    </ResultCard>
  );
}
