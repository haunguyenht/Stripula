import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Trash2, Copy, Check, ShoppingBag, Globe, Building2, CreditCard, AlertTriangle, ShieldX } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useToast } from '@/hooks/useToast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useBoundedResults } from '@/hooks/useBoundedStorage';
import { useCredits } from '@/hooks/useCredits';
import { useGatewayStatus } from '@/hooks/useGatewayStatus';
import { useGatewayCreditRates } from '@/hooks/useGatewayCreditRates';
import { useCardInputLimits } from '@/hooks/useCardInputLimits';
import { useValidation } from '@/contexts/ValidationContext';
import { useDebouncedValue } from '@/hooks/useDebouncedFilter';
import { processCardInput, getProcessingToastMessage, getTierLimitExceededMessage, validateForSubmission, getGeneratedCardsErrorMessage } from '@/lib/utils/card-parser';
import { handleCreditError, showCreditErrorToast, handleBackendError, handleTimeoutError } from '@/utils/creditErrors';
import { SpeedBadge } from '@/components/ui/TierSpeedControl';
import { useSpeedConfig } from '@/hooks/useSpeedConfig';
import { GatewayStatusIndicator, GatewayUnavailableMessage } from '@/components/ui/GatewayStatusIndicator';
import { GatewayInfoSummary } from '@/components/ui/GatewayInfoSummary';
import { ImportButton } from '@/components/ui/ImportButton';
import { ExportButton } from '@/components/ui/ExportButton';

import { TwoPanelLayout } from '../../layout/TwoPanelLayout';
import { ResultsPanel, ResultItem, ProgressBar } from '../../stripe/ResultsPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Celebration, useCelebration } from '@/components/ui/Celebration';
import { ResultCard, ResultCardContent } from '@/components/ui/result-card';
import { BrandIcon } from '@/components/ui/brand-icons';
import { CreditInfo, CreditSummary, EffectiveRateBadge, BatchConfirmDialog, BATCH_CONFIRM_THRESHOLD } from '@/components/credits';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/utils/card-helpers';

export function ShopifyChargePanel({
  drawerOpen,
  onDrawerOpenChange,
}) {
  const [cards, setCards] = useLocalStorage('shopifyChargeCards', '');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useLocalStorage('shopifyChargeSelectedSite', 'shopify-1');
  // Results use bounded storage - survives refresh/crash, clears on browser close
  // FIFO limit of 5000 results to prevent memory bloat (Requirements: 4.1, 4.2)
  const { 
    results: cardResults, 
    setResults: setCardResults 
  } = useBoundedResults('session_shopifyResults', []);
  const [cardStats, setCardStats] = useSessionStorage('session_shopifyStats', { approved: 0, declined: 0, error: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentItem, setCurrentItem] = useState(null);
  const [copiedCard, setCopiedCard] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [batchComplete, setBatchComplete] = useState(false);
  // Batch confirmation dialog state - Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [batchConfirmResolve, setBatchConfirmResolve] = useState(null);
  const [pendingBatchInfo, setPendingBatchInfo] = useState(null);

  const abortRef = useRef(false);
  const abortControllerRef = useRef(null);
  const { success, error: toastError, info, warning } = useToast();
  const { trigger: celebrationTrigger, celebrate } = useCelebration();

  // Credit management - Requirements: 4.3, 4.4, 4.6, 11.1, 11.2, 11.3
  const {
    balance,
    effectiveRate,
    baseRate,
    isCustomRate,
    isAuthenticated,
    creditsConsumed,
    liveCardsCount,
    trackLiveCard,
    resetTracking,
    setBalance,
    refresh: refreshCredits
  } = useCredits({ gatewayId: selectedSite });

  // Gateway credit rates for displaying in selector - Requirements: 11.1, 14.2
  const { getPricing } = useGatewayCreditRates();

  // Get pricing config for selected gateway
  const pricing = useMemo(() => getPricing(selectedSite), [getPricing, selectedSite]);

  // Gateway status - Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1
  const {
    getGateway,
    getGatewaysByType,
    isGatewayAvailable,
    areAllUnavailable
  } = useGatewayStatus();

  // Tier-based card input limits - Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4
  const { getLimitStatus, userTier, getCurrentUserLimit } = useCardInputLimits();

  // Pre-fetch speed config once at panel level to avoid re-fetching on dropdown open
  const { config: shopifySpeedConfig } = useSpeedConfig('shopify', userTier);

  // Get gateway status for selected site
  const selectedGatewayStatus = useMemo(() => {
    return getGateway(selectedSite);
  }, [getGateway, selectedSite]);

  // Check if all shopify gateways are unavailable
  const allShopifyGatewaysUnavailable = useMemo(() => {
    return areAllUnavailable('shopify');
  }, [areAllUnavailable]);

  // Validation context for app-level navigation blocking
  const validationContext = useValidation();

  // Abort callback for ValidationContext
  const handleAbort = useCallback(() => {
    abortRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    fetch('/api/shopify/stop', {
      method: 'POST'
    }).catch(() => { });
    setIsLoading(false);
    setCurrentItem(null);
  }, []);

  // Register/unregister with ValidationContext when loading state changes
  useEffect(() => {
    if (isLoading && validationContext) {
      validationContext.startValidation('shopify', handleAbort);
    } else if (!isLoading && validationContext) {
      validationContext.endValidation();
    }
  }, [isLoading, validationContext, handleAbort]);

  useEffect(() => {
    fetch('/api/shopify/all-sites')
      .then(res => res.json())
      .then(data => {
        if (data.sites) setSites(data.sites);
      })
      .catch(() => { });
  }, []);

  // Cleanup on unmount - abort client request AND stop backend processing
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        // Stop backend processing when component unmounts during loading
        fetch('/api/shopify/stop', {
          method: 'POST'
        }).catch(() => { });
      }
    };
  }, []);

  const handleSiteChange = async (siteId) => {
    setSelectedSite(siteId);
    try {
      await fetch('/api/shopify/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });
      info(`Switched to ${sites.find(s => s.id === siteId)?.label || siteId}`);
    } catch {
      toastError('Failed to switch site');
    }
  };

  const clearResults = useCallback(() => {
    setCardResults([]);
    setCardStats({ approved: 0, declined: 0, error: 0, total: 0 });
    setPage(1);
    setBatchComplete(false);
    resetTracking();
  }, [setCardResults, setCardStats, resetTracking]);

  // Helper to check if batch confirmation is needed - Requirements: 13.1
  const needsBatchConfirmation = useCallback((count) => {
    return count > BATCH_CONFIRM_THRESHOLD;
  }, []);

  // Handle batch confirmation dialog confirm - Requirements: 13.4
  const handleBatchConfirm = useCallback(() => {
    if (batchConfirmResolve) {
      batchConfirmResolve(true);
    }
    setShowBatchConfirm(false);
    setBatchConfirmResolve(null);
    setPendingBatchInfo(null);
  }, [batchConfirmResolve]);

  // Handle batch confirmation dialog cancel - Requirements: 13.5
  const handleBatchCancel = useCallback(() => {
    if (batchConfirmResolve) {
      batchConfirmResolve(false);
    }
    setShowBatchConfirm(false);
    setBatchConfirmResolve(null);
    setPendingBatchInfo(null);
  }, [batchConfirmResolve]);

  const handleCheckCards = async () => {
    if (isLoading) return;

    const cardList = cards.trim();
    if (!cardList) {
      warning('Enter at least one card');
      return;
    }

    // Process and validate cards before submission
    const processResult = processCardInput(cardList);
    const validation = validateForSubmission(processResult);

    // Block if no valid cards
    if (!validation.canSubmit && validation.errorType === 'no_valid_cards') {
      warning(validation.reason || 'No valid cards to process');
      return;
    }

    // Block if generated cards detected
    if (!validation.canSubmit && validation.errorType === 'generated_cards') {
      const genError = getGeneratedCardsErrorMessage(processResult.generatedDetection);
      toastError(genError?.message || 'Generated cards not allowed');
      return;
    }

    const totalCards = processResult.validCount;

    // Check tier limit before starting validation - Requirements: 1.2, 1.3, 8.7
    if (!limitStatus.isWithinLimit) {
      const tierLimitMsg = getTierLimitExceededMessage(totalCards, limitStatus.limit, userTier);
      toastError(tierLimitMsg.message);
      return;
    }

    // Show batch confirmation dialog for large batches - Requirements: 13.1, 13.4, 13.5
    if (isAuthenticated && needsBatchConfirmation(totalCards)) {
      const gatewayLabel = sites.find(s => s.id === selectedSite)?.label || selectedSite;

      // Show dialog and wait for user response
      const confirmed = await new Promise((resolve) => {
        setPendingBatchInfo({
          cardCount: totalCards,
          balance,
          effectiveRate,
          gatewayName: gatewayLabel
        });
        setBatchConfirmResolve(() => resolve);
        setShowBatchConfirm(true);
      });

      if (!confirmed) {
        return; // User cancelled
      }
    }

    setIsLoading(true);
    setBatchComplete(false);
    resetTracking(); // Reset credit tracking for new batch
    abortRef.current = false;
    setProgress({ current: 0, total: totalCards });
    setCurrentItem('Starting Shopify validation...');
    info(`Starting Shopify validation for ${totalCards} cards`);

    let currentCards = cards;
    let stats = {
      approved: cardStats.approved || 0,
      declined: cardStats.declined || 0,
      error: cardStats.error || 0,
      total: cardStats.total || 0
    };

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/shopify/batch-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardList,
          concurrency: 1,
          siteId: selectedSite
        }),
        signal: abortControllerRef.current.signal
      });

      // Handle credit-related errors (429, 402, 409) and backend errors (413, 500, 504)
      // Requirements: 6.1, 6.2, 6.5
      if (!response.ok) {
        const creditError = await handleCreditError(response);
        if (creditError) {
          showCreditErrorToast({ error: toastError, warning, info }, creditError);
          setIsLoading(false);
          setCurrentItem(null);
          return;
        }

        // Handle backend batch processing errors (413, 500, 504)
        const backendError = await handleBackendError(response);
        if (backendError) {
          showCreditErrorToast({ error: toastError, warning, info }, backendError);
          setIsLoading(false);
          setCurrentItem(null);
          // For 500 errors, preserve any results that were already processed
          if (!backendError.preserveResults) {
            // Only clear results for non-recoverable errors
          }
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

      for (; ;) {
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
            setProgress({ current: data.processed, total: data.total });
            setCurrentItem(`${data.processed}/${data.total}`);
          } else if (event === 'result') {
            const r = data;
            const resultId = `${r.card}-${Date.now()}-${newResults.length}`;
            newResults.unshift({
              ...r,
              id: resultId,
              fullCard: r.card
            });
            setCardResults([...newResults]);

            if (r.status === 'APPROVED') {
              celebrate();
              stats.approved++;
              // Track credit consumption with pricing_live cost (Shopify Auth gateways bill for LIVE)
              trackLiveCard(pricing?.live || effectiveRate);
              // Live update balance if newBalance is provided (reconciliation from server)
              if (typeof r.newBalance === 'number') {
                setBalance(r.newBalance);
              }
            } else if (r.status === 'DECLINED') {
              stats.declined++;
            } else {
              stats.error++;
            }
            stats.total++;
            setCardStats({ ...stats });

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
          } else if (event === 'complete') {
            setCardStats({ ...stats });
            setBatchComplete(true);
            // Update balance from complete event if provided
            if (typeof data.newBalance === 'number') {
              setBalance(data.newBalance);
            } else {
              // Fallback: Refresh credits to get updated balance from server
              refreshCredits().catch(() => {});
            }
            // Show warning if batch was stopped due to credit exhaustion
            if (data.creditExhausted) {
              warning('Batch stopped early due to insufficient credits');
            }
          } else if (event === 'credit_exhausted') {
            // Credits exhausted - batch stopped
            setCardStats({ ...stats });
            setBatchComplete(true);
            setIsLoading(false);
            if (typeof data.balance === 'number') {
              setBalance(data.balance);
            }
            warning(`Credits exhausted! Processed ${data.processed}/${data.total} cards. Add credits to continue.`);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        // Handle timeout and connection errors - Requirements: 6.5
        const timeoutError = handleTimeoutError(err);
        if (timeoutError) {
          showCreditErrorToast({ error: toastError, warning, info }, timeoutError);
          // Preserve any results that were processed before the error
        } else {
          setCurrentItem(`Error: ${err.message}`);
          toastError(`Validation error: ${err.message}`);
        }
      }
    }

    setIsLoading(false);
    setCurrentItem(null);
    abortControllerRef.current = null;

    if (!abortRef.current) {
      success(`Shopify complete: ${stats.approved} approved, ${stats.declined} declined, ${stats.error} errors`);
      setBatchComplete(true);
      // Show credit deduction toast if there were live cards - Requirements: 12.4
      if (isAuthenticated && stats.approved > 0) {
        const creditsUsed = Math.ceil(stats.approved * effectiveRate);
        info(`${creditsUsed} credits deducted for ${stats.approved} live card${stats.approved > 1 ? 's' : ''}`);
      }
      refreshCredits().catch(() => {});
    }
  };

  const handleStop = async () => {
    abortRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    await fetch('/api/shopify/stop', {
      method: 'POST'
    });
    setIsLoading(false);
    setCurrentItem('Stopped');
    warning('Shopify validation stopped');
  };

  const handleCopyCard = useCallback((result) => {
    const formatted = result.fullCard || result.card;
    navigator.clipboard.writeText(formatted);
    setCopiedCard(result.id);
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

  // Process cards to get valid count and generation detection
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

  // Get tier limit status for current card count - Requirements: 1.2, 1.3, 5.3, 5.4
  const limitStatus = useMemo(() => 
    getLimitStatus(cardCount),
    [getLimitStatus, cardCount]
  );

  const handleCardsBlur = useCallback(() => {
    if (!cards.trim() || isLoading) return;

    const result = processCardInput(cards);
    if (result.hasChanges) {
      setCards(result.cleanedInput);
      const toastMsg = getProcessingToastMessage(result);
      if (toastMsg) {
        info(toastMsg.message);
      }
    }
  }, [cards, isLoading, setCards, info]);

  // Handle import from file - Requirements: 1.4
  const handleImport = useCallback((importedCards, stats, rawInput) => {
    // Populate textarea with imported cards
    setCards(rawInput);
    // Clear previous results when importing new cards
    clearResults();
  }, [setCards, clearResults]);

  // Debounce filter value for performance (Requirements 3.5)
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
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2">
        <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-400" />
        <div>
          <h2 className="text-sm font-semibold text-[rgb(37,27,24)] dark:text-white">Shopify Checkout</h2>
          <p className="text-[11px] text-muted-foreground">Validate cards via Shopify stores</p>
        </div>
      </div>

      {/* Card Input */}
      <div className={cn(
        "rounded-xl overflow-hidden transition-all duration-200",
        "bg-white border border-[rgb(230,225,223)] shadow-sm",
        "focus-within:border-green-500/40 focus-within:ring-2 focus-within:ring-green-500/10",
        "dark:bg-white/5 dark:border-white/10 dark:shadow-none",
        "dark:focus-within:border-white/20 dark:focus-within:ring-green-500/20"
      )}>
        <Textarea
          id="shopify-cards-input"
          name="shopify-cards-input"
          className={cn(
            "font-mono text-xs min-h-[80px] resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "bg-transparent",
            isLoading && "opacity-50"
          )}
          placeholder="Enter cards (one per line)&#10;4111111111111111|01|25|123"
          value={cards}
          onChange={(e) => setCards(e.target.value)}
          onBlur={handleCardsBlur}
          disabled={isLoading}
        />

        <div className="flex items-center justify-between px-3 py-2 border-t border-[rgb(237,234,233)] dark:border-white/10 bg-[rgb(250,249,249)] dark:bg-white/5">
          <div className="flex items-center gap-2">
            {/* Card count with tier limit - Requirements: 1.4, 5.1, 5.2, 5.3, 5.4 */}
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

          <div className="flex items-center gap-1.5">
            {/* Import Button - Requirements: 1.1, 1.4 */}
            <ImportButton
              onImport={handleImport}
              disabled={isLoading}
              variant="ghost"
              size="icon"
              showLabel={false}
              className="h-8 w-8"
            />
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
              <Button 
                size="sm" 
                className="h-8" 
                onClick={handleCheckCards}
                disabled={limitStatus.isError || cardCount === 0 || cardValidation.isGenerated || !selectedGatewayStatus?.isAvailable}
                title={
                  !selectedGatewayStatus?.isAvailable
                    ? 'Gateway is unavailable'
                    : cardValidation.isGenerated 
                      ? 'Generated cards not allowed' 
                      : limitStatus.isError 
                        ? `Exceeds ${userTier} tier limit of ${limitStatus.limit} cards` 
                        : undefined
                }
              >
                Start Check
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Generated cards warning */}
      {cardValidation.isGenerated && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
          <ShieldX className="w-4 h-4 flex-shrink-0" />
          <span>
            Generated cards detected ({cardValidation.generatedDetection?.confidence}% confidence). 
            BIN-generated cards are not allowed.
          </span>
        </div>
      )}

      {/* Tier limit exceeded warning - Requirements: 1.2, 1.3 */}
      {limitStatus.isError && !cardValidation.isGenerated && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            You have {cardCount} cards but your {userTier} tier limit is {limitStatus.limit}. 
            Please remove {limitStatus.excess} card{limitStatus.excess > 1 ? 's' : ''} to continue.
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isLoading && progress.total > 0 && (
          <ProgressBar key="progress" current={progress.current} total={progress.total} />
        )}
      </AnimatePresence>

      {/* Store Selection */}
      {sites.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[rgb(230,225,223)] dark:border-white/10">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            Shopify Store
          </Label>

          {/* Show warning if all gateways unavailable - Requirement: 5.5 */}
          {allShopifyGatewaysUnavailable && (
            <GatewayUnavailableMessage allUnavailable={true} />
          )}

          {/* Show warning for selected unavailable gateway - Requirement: 5.4 */}
          {selectedGatewayStatus && !selectedGatewayStatus.isAvailable && !allShopifyGatewaysUnavailable && (
            <GatewayUnavailableMessage gateway={selectedGatewayStatus} />
          )}

          <div className="flex items-center gap-2">
            <Select value={selectedSite} onValueChange={handleSiteChange} disabled={isLoading}>
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {sites.map(site => {
                  const gatewayStatus = getGateway(site.id);
                  const isAvailable = gatewayStatus?.isAvailable ?? true;
                  const sitePricing = getPricing(site.id);

                  return (
                    <SelectItem
                      key={site.id}
                      value={site.id}
                      className={cn(!isAvailable && "opacity-60")}
                    >
                      <div className="flex items-center gap-2">
                        {/* Status indicator - Requirement: 5.1, 5.3 */}
                        {gatewayStatus && (
                          <GatewayStatusIndicator
                            state={gatewayStatus.state}
                            healthStatus={gatewayStatus.healthStatus}
                            reason={gatewayStatus.maintenanceReason}
                            size="sm"
                          />
                        )}
                        <span>{site.label}</span>
                        {site.configured ? (
                          <span className="text-muted-foreground ml-1 text-xs">({site.domain})</span>
                        ) : (
                          <span className="text-amber-500 ml-1 text-xs">(not configured)</span>
                        )}
                        {/* Show maintenance indicator - Requirement: 5.2 */}
                        {gatewayStatus?.state === 'maintenance' && (
                          <span className="text-amber-500 text-xs">(maintenance)</span>
                        )}
                        {gatewayStatus?.healthStatus === 'offline' && gatewayStatus?.state !== 'maintenance' && (
                          <span className="text-red-500 text-xs">(offline)</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {/* Gateway speed info summary */}
          <GatewayInfoSummary 
            speedConfig={shopifySpeedConfig} 
            className="mt-2"
          />
        </div>
      )}

      {/* Credit Info - Requirements: 4.3, 4.4, 4.6, 11.1, 11.2 */}
      {isAuthenticated && (
        <div className="pt-4 border-t border-[rgb(230,225,223)] dark:border-white/10">
          {batchComplete && liveCardsCount > 0 ? (
            <CreditSummary
              liveCardsCount={liveCardsCount}
              creditsConsumed={creditsConsumed}
              newBalance={balance}
            />
          ) : (
            <CreditInfo
              cardCount={cardCount}
              balance={balance}
              effectiveRate={effectiveRate}
              creditsConsumed={creditsConsumed}
              liveCardsCount={liveCardsCount}
              isLoading={isLoading}
              showConsumed={false}
              pricing={pricing}
              gatewayType="shopify"
            />
          )}
        </div>
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
      onPageSizeChange={handlePageSizeChange}
      onCopyAll={filteredResults.length > 0 ? handleCopyAllCards : undefined}
      onClear={clearResults}
      isLoading={isLoading}
      isEmpty={paginatedResults.length === 0}
      // Export Button - Requirements: 3.1, 3.6
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
      {/* Batch Confirmation Dialog - Requirements: 13.1, 13.2, 13.3, 13.4, 13.5 */}
      <BatchConfirmDialog
        open={showBatchConfirm}
        onOpenChange={setShowBatchConfirm}
        cardCount={pendingBatchInfo?.cardCount || 0}
        balance={pendingBatchInfo?.balance || balance}
        effectiveRate={pendingBatchInfo?.effectiveRate || effectiveRate}
        gatewayName={pendingBatchInfo?.gatewayName || 'Gateway'}
        onConfirm={handleBatchConfirm}
        onCancel={handleBatchCancel}
      />
      <TwoPanelLayout
        configPanel={configContent}
        resultsPanel={resultsContent}
        drawerOpen={drawerOpen}
        onDrawerOpenChange={onDrawerOpenChange}
      />
    </>
  );
}

function formatShopifyMessage(result) {
  const status = result.status?.toUpperCase();
  const rawMessage = result.message || '';

  if (status === 'APPROVED') {
    return 'Card accepted';
  }

  if (status === 'DECLINED') {
    if (rawMessage.includes('insufficient_funds')) return 'Insufficient funds';
    if (rawMessage.includes('lost_card')) return 'Card reported lost';
    if (rawMessage.includes('stolen_card')) return 'Card reported stolen';
    if (rawMessage.includes('expired_card')) return 'Card expired';
    if (rawMessage.includes('incorrect_cvc')) return 'Invalid security code';
    if (rawMessage.includes('do_not_honor')) return 'Do not honor';
    if (rawMessage.includes('card_declined')) return 'Card declined';
    return rawMessage || 'Card declined';
  }

  if (status === 'ERROR') {
    if (rawMessage.includes('not configured')) return 'Site not configured';
    if (rawMessage.includes('Product ID')) return 'Product not found';
    if (rawMessage.includes('out of stock')) return 'Item out of stock';
    if (rawMessage.includes('Access denied')) return 'Access denied';
    return rawMessage || 'Validation error';
  }

  return rawMessage || status || 'Unknown';
}

const ShopifyResultItem = React.memo(function ShopifyResultItem({ result, index, copiedCard, onCopy }) {
  const status = result.status?.toUpperCase() || 'UNKNOWN';
  const isApproved = status === 'APPROVED';
  const isDeclined = status === 'DECLINED';
  const isError = status === 'ERROR';

  const cardDisplay = result.fullCard || result.card || 'Unknown';
  const friendlyMessage = formatShopifyMessage(result);
  const binData = result.binData;
  const supportedBrands = result.supportedBrands || [];

  const handleCopy = useCallback((e) => {
    e.stopPropagation();
    onCopy(result);
  }, [onCopy, result]);

  const getBadgeVariant = () => {
    if (isApproved) return 'live';
    if (isDeclined) return 'declined';
    return 'error';
  };

  return (
    <ResultCard status={status} interactive>
      <ResultCardContent className="py-2.5 px-3">
        {/* Row 1: Status + Card Number + Copy */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Badge variant={getBadgeVariant()} className="text-[10px] font-semibold shrink-0">
              {status}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground truncate">{cardDisplay}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleCopy}
          >
            {copiedCard === result.id ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Row 2: BIN Data badges - only show for approved cards */}
        {isApproved && binData && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {binData.scheme && (
              <span title={toTitleCase(binData.scheme)}>
                <BrandIcon scheme={binData.scheme} />
              </span>
            )}
            {binData.type && (
              <Badge variant="outline" className="text-[9px] h-5">
                {toTitleCase(binData.type)}
              </Badge>
            )}
            {(binData.countryEmoji || binData.countryCode) && (
              <span className="text-sm" title={binData.country || binData.countryCode}>
                {binData.countryEmoji || binData.countryCode}
              </span>
            )}
            {binData.bank && binData.bank.toLowerCase() !== 'unknown' && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {toTitleCase(binData.bank)}
              </span>
            )}
          </div>
        )}

        {/* Row 3: Supported brands for approved */}
        {isApproved && supportedBrands.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <CreditCard className="h-3 w-3 text-muted-foreground" />
            {supportedBrands.map((brand, i) => (
              <Badge key={i} variant="outline" className="text-[9px] h-5">
                {brand}
              </Badge>
            ))}
          </div>
        )}

        {/* Row 4: Message + Domain */}
        <p className={cn(
          "text-[10px] mt-1.5 truncate",
          isApproved ? "text-emerald-600 dark:text-emerald-400" :
            isDeclined ? "text-rose-500 dark:text-rose-400" : "text-amber-500 dark:text-amber-400"
        )}>
          {friendlyMessage}
          {result.domain && (
            <span className="text-muted-foreground"> • {result.domain}</span>
          )}
          {result.price && (
            <span className="text-muted-foreground"> • {result.price}</span>
          )}
        </p>
      </ResultCardContent>
    </ResultCard>
  );
});

export default ShopifyChargePanel;
