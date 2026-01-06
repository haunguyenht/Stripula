import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Copy, Check, ShieldCheck, ShieldAlert, Globe, Building2 } from 'lucide-react';
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
import { GatewayUnavailableMessage } from '@/components/ui/GatewayStatusIndicator';
import { ExportButton } from '@/components/ui/ExportButton';
import { CardInputSection } from '@/components/ui/CardInputSection';

import { TwoPanelLayout } from '../../layout/TwoPanelLayout';
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { SpeedBadge } from '@/components/ui/TierSpeedControl';
import { useSpeedConfig } from '@/hooks/useSpeedConfig';
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
import { BrandIcon } from '@/components/ui/brand-icons';
import { CreditSummary, BatchConfirmDialog, BATCH_CONFIRM_THRESHOLD, BatchConfigCard } from '@/components/credits';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/utils/card-helpers';

export function StripeAuthPanel() {
  const [cards, setCards] = useLocalStorage('stripeAuthCards', '');
  const [concurrency, setConcurrency] = useLocalStorage('stripeAuthConcurrency', 1);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useLocalStorage('stripeAuthSelectedSite', 'skbased-auth-1');
  // Results use bounded storage - survives refresh/crash, clears on browser close
  // FIFO limit of 5000 results to prevent memory bloat (Requirements: 4.1, 4.2)
  const { 
    results: cardResults, 
    setResults: setCardResults 
  } = useBoundedResults('session_authResults', []);
  const [cardStats, setCardStats, setCardStatsImmediate] = useSessionStorage('session_authStats', { approved: 0, declined: 0, error: 0, total: 0 });
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
  const { config: authSpeedConfig } = useSpeedConfig('auth', userTier);

  // Get gateway status for selected site
  const selectedGatewayStatus = useMemo(() => {
    return getGateway(selectedSite);
  }, [getGateway, selectedSite]);

  // Check if all auth gateways are unavailable (both 'auth' and 'skbased-auth' types)
  const allAuthGatewaysUnavailable = useMemo(() => {
    return areAllUnavailable('auth') && areAllUnavailable('skbased-auth');
  }, [areAllUnavailable]);

  // Auto-select available gateway ONLY on mount if current selection is unavailable
  // This should NOT run when user manually selects a gateway
  const hasAutoSelectedRef = useRef(false);
  
  useEffect(() => {
    // Only run auto-selection once on mount, not on every selectedSite change
    if (hasAutoSelectedRef.current) return;
    
    // Get both 'auth' (WooCommerce) and 'skbased-auth' (SK-based) gateways
    const authGateways = [...getGatewaysByType('auth'), ...getGatewaysByType('skbased-auth')];
    if (authGateways.length === 0) return;

    // Helper to check if gateway is fully active (enabled + online)
    const isFullyActive = (g) => 
      g.state === 'enabled' && 
      g.healthStatus === 'online' && 
      g.isAvailable;

    const currentGateway = authGateways.find(g => g.id === selectedSite);
    
    // If current gateway is fully active OR not found in status list yet, keep it
    // (Don't override user selection just because status hasn't loaded)
    if (!currentGateway || isFullyActive(currentGateway)) {
      hasAutoSelectedRef.current = true;
      return;
    }

    // Current gateway exists but is NOT fully active - find an alternative
    const activeGateways = authGateways.filter(isFullyActive);
    if (activeGateways.length === 0) {
      // Fallback: try to find any available gateway even if degraded
      const availableGateways = authGateways.filter(g => g.isAvailable);
      if (availableGateways.length === 0) {
        hasAutoSelectedRef.current = true;
        return;
      }
      const fallbackGateway = availableGateways[Math.floor(Math.random() * availableGateways.length)];
      setSelectedSite(fallbackGateway.id);
      hasAutoSelectedRef.current = true;
      return;
    }

    // Pick a random fully active gateway
    const randomGateway = activeGateways[Math.floor(Math.random() * activeGateways.length)];
    setSelectedSite(randomGateway.id);
    hasAutoSelectedRef.current = true;
  }, [getGatewaysByType, selectedSite, setSelectedSite]);

  // Validation context for app-level navigation blocking
  const validationContext = useValidation();

  // Abort callback for ValidationContext
  const handleAbort = useCallback(() => {
    abortRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    fetch('/api/auth/stop', {
      method: 'POST'
    }).catch(() => { });
    setIsLoading(false);
    setCurrentItem(null);
  }, []);

  // Register/unregister with ValidationContext when loading state changes
  useEffect(() => {
    if (isLoading && validationContext) {
      validationContext.startValidation('auth', handleAbort);
    } else if (!isLoading && validationContext) {
      validationContext.endValidation();
    }
  }, [isLoading, validationContext, handleAbort]);

  useEffect(() => {
    fetch('/api/auth/sites')
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
        fetch('/api/auth/stop', {
          method: 'POST'
        }).catch(() => { });
      }
    };
  }, []);

  const handleSiteChange = async (siteId) => {
    // Prevent selecting unavailable gateways
    if (!isGatewayAvailable(siteId)) {
      warning('This gateway is currently under maintenance');
      return;
    }
    setSelectedSite(siteId);
    try {
      await fetch('/api/auth/site', {
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
    // useBoundedResults.clearResults already uses immediate write
    setCardResults([]);
    // Use immediate setter for stats to bypass debounce
    setCardStatsImmediate({ approved: 0, declined: 0, error: 0, total: 0 });
    setPage(1);
    setBatchComplete(false);
    resetTracking();
  }, [setCardResults, setCardStatsImmediate, resetTracking]);

  const clearCards = useCallback(() => {
    setCards('');
  }, [setCards]);

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

      // Only update if stats don't match
      if (recalculatedStats.total !== cardStats.total ||
        recalculatedStats.approved !== cardStats.approved) {
        setCardStats(recalculatedStats);
      }
    }
  }, []);

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
    setCurrentItem('Starting auth validation...');
    info(`Starting auth validation for ${totalCards} cards`);

    let currentCards = cards;
    // Start from existing stats to accumulate
    let stats = {
      approved: cardStats.approved || 0,
      declined: cardStats.declined || 0,
      error: cardStats.error || 0,
      total: cardStats.total || 0
    };

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/auth/batch-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardList,
          concurrency,
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
          setCardStats({ ...stats });
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
            setProgress({ current: data.processed, total: data.total });
            // Don't override stats from progress event - use result event stats
            // which properly accumulate with existing localStorage stats
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
              stats.approved++;
              // Track credit consumption with pricing_live cost (Auth gateways bill for LIVE)
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

            // Remove card from input - match by card number (first part before delimiter)
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
            // Requirements: 6.2 - SSE event batching
            const now = Date.now();
            if (pendingResultsRef.current.length >= 10 || (now - lastUIUpdate) >= UI_UPDATE_INTERVAL) {
              flushPendingResults();
              lastUIUpdate = now;
            }
          } else if (event === 'credit_exhausted') {
            // Flush pending results before handling credit exhaustion
            flushPendingResults();
            // Credits exhausted - batch stopped
            setCardStats({ ...stats });
            setBatchComplete(true);
            setIsLoading(false);
            if (typeof data.balance === 'number') {
              setBalance(data.balance);
            }
            warning(`Credits exhausted! Processed ${data.processed}/${data.total} cards. Add credits to continue.`);
          } else if (event === 'complete') {
            // Flush pending results before completing
            flushPendingResults();
            // Use our accumulated stats, not server stats
            setCardStats({ ...stats });
            setBatchComplete(true);
            // Update balance from complete event if provided
            if (typeof data.newBalance === 'number') {
              setBalance(data.newBalance);
            } else {
              // Fallback: Refresh credits to get updated balance from server
              refreshCredits().catch(() => { });
            }
            // Show warning if batch was stopped due to credit exhaustion
            if (data.creditExhausted) {
              warning('Batch stopped early due to insufficient credits');
            }
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
      success(`Auth complete: ${stats.approved} approved, ${stats.declined} declined, ${stats.error} errors`);
      setBatchComplete(true);
      // Show credit deduction toast if there were live cards - Requirements: 12.4
      if (isAuthenticated && stats.approved > 0) {
        const creditsUsed = Math.ceil(stats.approved * effectiveRate);
        info(`${creditsUsed} credits deducted for ${stats.approved} live card${stats.approved > 1 ? 's' : ''}`);
      }
      refreshCredits().catch(() => { });
    }
  };

  const handleStop = async () => {
    abortRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    await fetch('/api/auth/stop', {
      method: 'POST'
    });
    setIsLoading(false);
    setCurrentItem('Stopped');
    warning('Auth validation stopped');
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

  // Process cards on blur - remove duplicates and expired cards
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
      if (debouncedFilter === 'error') return status === 'error' || status === 'stripe_error';
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
    <div className="space-y-3 sm:space-y-4 p-2 sm:p-4 bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-1.5 sm:gap-2 pb-1 sm:pb-2">
        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[rgb(255,64,23)] dark:text-primary shrink-0" />
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-semibold text-[rgb(37,27,24)] dark:text-white truncate">Authorization Check</h2>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Validate cards via payment gateways</p>
        </div>
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
        isGatewayAvailable={selectedGatewayStatus?.isAvailable}
        startButtonLabel="Start Check"
        progressBar={isLoading && progress.total > 0 && (
          <ProgressBar key="progress" current={progress.current} total={progress.total} />
        )}
      />

      {/* Gateway unavailable warnings */}
      {allAuthGatewaysUnavailable && (
        <GatewayUnavailableMessage allUnavailable={true} />
      )}
      {selectedGatewayStatus && !selectedGatewayStatus.isAvailable && !allAuthGatewaysUnavailable && (
        <GatewayUnavailableMessage gateway={selectedGatewayStatus} />
      )}

      {/* Unified Gateway + Cost Card */}
      {batchComplete && liveCardsCount > 0 ? (
        <CreditSummary
          liveCardsCount={liveCardsCount}
          creditsConsumed={creditsConsumed}
          newBalance={balance}
        />
      ) : (
        <BatchConfigCard
          sites={sites}
          selectedSite={selectedSite}
          onSiteChange={handleSiteChange}
          getGateway={getGateway}
          isLoading={isLoading}
          speedConfig={authSpeedConfig}
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
        <AuthResultItem
          key={result.id}
          result={result}
          index={idx}
          copiedCard={copiedCard}
          onCopy={handleCopyCard}
        />
      )}
      getItemKey={(result) => result.id}
      estimateItemSize={130}
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
          prefix="auth_results"
        />
      }
    >
      {/* Fallback for non-virtualized rendering (small lists) */}
      {paginatedResults.map((result, idx) => (
        <ResultItem key={result.id} id={result.id}>
          <AuthResultItem
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
      />
    </>
  );
}

/**
 * Format auth message for user-friendly display
 */
function formatAuthMessage(result) {
  const status = result.status?.toUpperCase();
  const rawMessage = result.message || '';

  // Handle approved status
  if (status === 'APPROVED') {
    if (rawMessage.includes('CARD_ADDED') || rawMessage.includes('card_added')) {
      return 'Card authenticated successfully';
    }
    return 'Authentication successful';
  }

  // Handle declined status
  if (status === 'DECLINED') {
    // Clean up common decline messages
    if (rawMessage.includes('Your card was declined')) {
      return 'Card declined by issuer';
    }
    if (rawMessage.includes('insufficient_funds')) {
      return 'Insufficient funds';
    }
    if (rawMessage.includes('lost_card')) {
      return 'Card reported lost';
    }
    if (rawMessage.includes('stolen_card')) {
      return 'Card reported stolen';
    }
    if (rawMessage.includes('expired_card')) {
      return 'Card expired';
    }
    if (rawMessage.includes('incorrect_cvc')) {
      return 'Invalid security code';
    }
    if (rawMessage.includes('processing_error')) {
      return 'Processing error';
    }
    if (rawMessage.includes('do_not_honor')) {
      return 'Do not honor';
    }
    // Generic decline
    return rawMessage.replace(/^(Your card was declined\.?\s*)/i, '') || 'Card declined';
  }

  // Handle error status
  if (status === 'ERROR' || status === 'STRIPE_ERROR') {
    if (rawMessage.includes('rate_limit')) {
      return 'Rate limited - try again';
    }
    if (rawMessage.includes('invalid_number')) {
      return 'Invalid card number';
    }
    if (rawMessage.includes('invalid_expiry')) {
      return 'Invalid expiry date';
    }
    // Clean up error prefix and handle redundant "Error" message
    const cleanedMessage = rawMessage.replace(/^(Error:|Stripe error:)\s*/i, '');
    if (cleanedMessage.toLowerCase() === 'error' || cleanedMessage.trim() === '') {
      return 'Validation failed';
    }
    return cleanedMessage || 'Validation error';
  }

  // Fallback
  return rawMessage || status || 'Unknown';
}

const AuthResultItem = React.memo(function AuthResultItem({ result, index, copiedCard, onCopy }) {
  const status = result.status?.toUpperCase() || 'UNKNOWN';
  const isApproved = status === 'APPROVED';
  const isDeclined = status === 'DECLINED';
  const isError = status === 'ERROR' || status === 'STRIPE_ERROR';

  const cardDisplay = result.fullCard || result.card || 'Unknown';
  const friendlyMessage = formatAuthMessage(result);
  const binData = result.binData;
  const isCopied = copiedCard === result.id;

  const handleCopy = useCallback(() => {
    onCopy(result);
  }, [onCopy, result]);

  // Get badge variant based on status
  const getBadgeVariant = () => {
    if (isApproved) return 'live';
    if (isDeclined) return 'declined';
    return 'error';
  };

  // Get effective status for card styling
  const getEffectiveStatus = () => {
    if (isApproved) return 'approved';
    if (isDeclined) return 'declined';
    return 'error';
  };

  return (
    <ResultCard status={getEffectiveStatus()} interactive>
      <ResultCardContent>
        {/* Zone 1: Header - Status + Card Number + Actions */}
        <ResultCardHeader>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Badge variant={getBadgeVariant()} className="text-[10px] font-semibold shrink-0">
              {status}
            </Badge>
            <CardNumber card={cardDisplay} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DurationDisplay duration={result.duration} />
            <CopyButton 
              value={cardDisplay}
              isCopied={isCopied}
              onCopy={handleCopy}
              title="Copy card"
            />
          </div>
        </ResultCardHeader>

        {/* Zone 2: Rich Data - BIN info (only for approved) */}
        {isApproved && binData && (
          <ResultCardDataZone>
            <BINDataDisplay binData={binData} />
          </ResultCardDataZone>
        )}

        {/* Zone 3: Response - Message + Gateway */}
        <ResultCardResponseZone>
          <ResultCardMessage status={status} className="sm:truncate flex-1">
            {friendlyMessage}
          </ResultCardMessage>
          <GatewayBadge gateway={result.gateway} site={result.site} />
        </ResultCardResponseZone>
      </ResultCardContent>
    </ResultCard>
  );
});

export default StripeAuthPanel;
