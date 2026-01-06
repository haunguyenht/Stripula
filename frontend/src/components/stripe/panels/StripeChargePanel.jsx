import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Copy, Check, Globe, Building2, Zap } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useToast } from '@/hooks/useToast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSessionStorage } from '@/hooks/useSessionStorage';
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
import { Label } from '@/components/ui/label';
import { SpeedBadge } from '@/components/ui/TierSpeedControl';
import { useSpeedConfig } from '@/hooks/useSpeedConfig';
import { GatewayMessageFormatter } from '@/utils/gatewayMessage';
import { Celebration, useCelebration } from '@/components/ui/Celebration';
import { 
  ResultCard, 
  ResultCardContent,
  ResultCardHeader,
  ResultCardDataZone,
  ResultCardResponseZone,
  ResultCardSecurityZone,
  ResultCardMessage,
  ResultCardPill,
} from '@/components/ui/result-card';
import { 
  BINDataDisplay, 
  SecurityIndicators,
  DurationDisplay, 
  CopyButton,
  CardNumber,
  GatewayBadge,
} from '@/components/ui/result-card-parts';
import { BrandIcon } from '@/components/ui/brand-icons';
import { CreditSummary, BatchConfirmDialog, BATCH_CONFIRM_THRESHOLD, BatchConfigCard } from '@/components/credits';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/lib/utils/card-helpers';

export function StripeChargePanel({
  drawerOpen,
  onDrawerOpenChange,
}) {
  const [cards, setCards] = useLocalStorage('stripeChargeCards', '');
  const [concurrency, setConcurrency] = useLocalStorage('stripeChargeConcurrency', 1);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useLocalStorage('stripeChargeSelectedSite', 'charge-1');
  const [cardResults, setCardResults, setCardResultsImmediate] = useSessionStorage('session_chargeResults', [], { maxArrayLength: 200 });
  const [cardStats, setCardStats, setCardStatsImmediate] = useSessionStorage('session_chargeStats', { approved: 0, threeDS: 0, declined: 0, error: 0, total: 0 });
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

  // Gateway status management - Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
  const {
    getGateway,
    getGatewaysByType,
    isAnyAvailable
  } = useGatewayStatus();

  // Tier-based card input limits - Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4
  const { getLimitStatus, userTier, getCurrentUserLimit } = useCardInputLimits();

  // Pre-fetch speed config once at panel level to avoid re-fetching on dropdown open
  const { config: chargeSpeedConfig } = useSpeedConfig('charge', userTier);

  // Get status for selected gateway
  const selectedGatewayStatus = getGateway(selectedSite);

  // Check if all charge gateways are unavailable
  const allChargeGatewaysUnavailable = !isAnyAvailable('charge');

  // Validation context for app-level navigation blocking
  const validationContext = useValidation();

  // Abort callback for ValidationContext
  const handleAbort = useCallback(() => {
    abortRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    fetch('/api/charge/stop', {
      method: 'POST'
    }).catch(() => { });
    setIsLoading(false);
    setCurrentItem(null);
  }, []);

  // Register/unregister with ValidationContext when loading state changes
  useEffect(() => {
    if (isLoading && validationContext) {
      validationContext.startValidation('charge', handleAbort);
    } else if (!isLoading && validationContext) {
      validationContext.endValidation();
    }
  }, [isLoading, validationContext, handleAbort]);

  useEffect(() => {
    fetch('/api/charge/sites')
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
        fetch('/api/charge/stop', {
          method: 'POST'
        }).catch(() => { });
      }
    };
  }, []);

  const handleSiteChange = async (siteId) => {
    // Prevent selecting unavailable gateways
    const gateway = getGateway(siteId);
    if (gateway && !gateway.isAvailable) {
      warning('This gateway is currently under maintenance');
      return;
    }
    setSelectedSite(siteId);
    try {
      await fetch('/api/charge/site', {
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
    // Use immediate setters to bypass debounce - ensures storage is cleared before new validation
    setCardResultsImmediate([]);
    setCardStatsImmediate({ approved: 0, threeDS: 0, declined: 0, error: 0, total: 0 });
    setPage(1);
    setBatchComplete(false);
    resetTracking();
  }, [setCardResultsImmediate, setCardStatsImmediate, resetTracking]);

  const clearCards = useCallback(() => {
    setCards('');
  }, [setCards]);

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
    setCurrentItem('Starting charge validation...');
    info(`Starting charge validation for ${totalCards} cards`);

    let currentCards = cards;
    // Start from existing stats to accumulate
    let stats = {
      approved: cardStats.approved || 0,
      threeDS: cardStats.threeDS || 0,
      declined: cardStats.declined || 0,
      error: cardStats.error || 0,
      total: cardStats.total || 0
    };

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/charge/batch-stream', {
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

            // Check for live declines (insufficient funds, etc.)
            const isLiveDecline = r.status === 'DECLINED' && (
              r.declineCode === 'insufficient_funds' ||
              r.declineCode === 'card_velocity_exceeded' ||
              r.declineCode === 'withdrawal_count_limit_exceeded' ||
              r.isLive === true
            );

            if (r.status === 'APPROVED') {
              celebrate();
              stats.approved++;
              // Track credit consumption with pricing_approved cost (Charge gateways bill for APPROVED)
              trackLiveCard(pricing?.approved || effectiveRate);
              // Live update balance if newBalance is provided (reconciliation from server)
              if (typeof r.newBalance === 'number') {
                setBalance(r.newBalance);
              }
            } else if (r.status === '3DS_REQUIRED' || isLiveDecline) {
              celebrate(); // Celebrate for all live cards
              stats.threeDS++; // Count both 3DS and live declines as "Live"
              // Track credit consumption with pricing_live cost (Charge gateways also bill for LIVE)
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
          } else if (event === 'fatal_error') {
            // SK key error or other fatal error - stop immediately
            toastError(`Fatal Error: ${data.message}`, {
              duration: 10000,
              description: `Batch stopped at ${data.processed}/${data.total} cards`
            });
            setIsLoading(false);
            setCurrentItem(null);
            setBatchComplete(true);
          } else if (event === 'credit_exhausted') {
            // Credits exhausted - batch stopped
            setCardStats({ ...stats });
            setBatchComplete(true);
            setIsLoading(false);
            if (typeof data.balance === 'number') {
              setBalance(data.balance);
            }
            warning(`Credits exhausted! Processed ${data.processed}/${data.total} cards. Add credits to continue.`);
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
      success(`Charge complete: ${stats.approved} approved, ${stats.threeDS} live, ${stats.declined} declined, ${stats.error} errors`);
      setBatchComplete(true);
      // Show credit deduction toast if there were live cards - Requirements: 12.4
      // For charge panel, both approved and 3DS/live declines consume credits
      const totalLiveCards = stats.approved + stats.threeDS;
      if (isAuthenticated && totalLiveCards > 0) {
        const creditsUsed = Math.ceil(totalLiveCards * effectiveRate);
        info(`${creditsUsed} credits deducted for ${totalLiveCards} live card${totalLiveCards > 1 ? 's' : ''}`);
      }
      refreshCredits().catch(() => {});
    }
  };

  const handleStop = async () => {
    abortRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    await fetch('/api/charge/stop', {
      method: 'POST'
    });
    setIsLoading(false);
    setCurrentItem('Stopped');
    warning('Charge validation stopped');
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
      const declineCode = r.declineCode || r.shortCode;
      const isLiveDecline = status === 'declined' && (
        declineCode === 'insufficient_funds' ||
        declineCode === 'card_velocity_exceeded' ||
        declineCode === 'withdrawal_count_limit_exceeded' ||
        r.isLive === true
      );

      if (debouncedFilter === 'approved') return status === 'approved';
      if (debouncedFilter === 'live') return status === '3ds_required' || isLiveDecline;
      if (debouncedFilter === 'declined') return status === 'declined' && !isLiveDecline;
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
    { id: 'approved', label: 'Charged', value: cardStats.approved, color: 'emerald', showDot: true },
    { id: 'live', label: 'Live', value: cardStats.threeDS, color: 'coral', showDot: true },
    { id: 'declined', label: 'Declined', value: cardStats.declined, color: 'rose', showDot: true },
    { id: 'error', label: 'Error', value: cardStats.error, color: 'amber', showDot: true },
  ], [cardStats]);

  const configContent = (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2">
        <Zap className="h-5 w-5 text-[rgb(255,64,23)] dark:text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-[rgb(37,27,24)] dark:text-white">Charge Validation</h2>
          <p className="text-[11px] text-muted-foreground">Validate cards via charge</p>
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
        startButtonLabel="Start Charge"
        progressBar={isLoading && progress.total > 0 && (
          <ProgressBar key="progress" current={progress.current} total={progress.total} />
        )}
      />

      {/* Gateway unavailable warnings */}
      {allChargeGatewaysUnavailable && (
        <GatewayUnavailableMessage allUnavailable={true} />
      )}
      {selectedGatewayStatus && !selectedGatewayStatus.isAvailable && !allChargeGatewaysUnavailable && (
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
          speedConfig={chargeSpeedConfig}
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
        <ChargeResultItem
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
          prefix="charge_results"
        />
      }
    >
      {paginatedResults.map((result, idx) => (
        <ResultItem key={result.id} id={result.id}>
          <ChargeResultItem
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

function formatChargeMessage(result) {
  const status = result.status?.toUpperCase();
  const rawMessage = result.message || '';
  const riskLevel = result.riskLevel || result.fraudData?.riskLevel;
  const riskScore = result.riskScore || result.fraudData?.riskScore;

  // Build risk suffix for high-risk declines
  const riskSuffix = riskLevel === 'highest' || riskLevel === 'elevated'
    ? ` (Risk: ${riskLevel}${riskScore ? ` ${riskScore}` : ''})`
    : '';

  if (status === 'APPROVED') {
    if (rawMessage.includes('CHARGED')) {
      return 'Card charged successfully ($1)';
    }
    return 'Charge successful';
  }

  if (status === 'DECLINED' || status === 'DIE') {
    // High risk / fraud detection
    if (rawMessage.includes('High Risk') || rawMessage.includes('highest_risk') || riskLevel === 'highest') {
      return `High Risk - Fraud detection triggered${riskSuffix}`;
    }
    if (rawMessage.includes('insufficient_funds') || rawMessage.includes('Insufficient funds')) {
      return 'Insufficient funds';
    }
    if (rawMessage.includes('lost_card') || rawMessage.includes('Lost card')) {
      return 'Card reported lost';
    }
    if (rawMessage.includes('stolen_card') || rawMessage.includes('Stolen card')) {
      return 'Card reported stolen';
    }
    if (rawMessage.includes('expired_card') || rawMessage.includes('Expired card')) {
      return 'Card expired';
    }
    if (rawMessage.includes('incorrect_cvc') || rawMessage.includes('Incorrect CVC')) {
      return 'Invalid security code';
    }
    if (rawMessage.includes('do_not_honor') || rawMessage.includes('Do not honor')) {
      return 'Do not honor';
    }
    if (rawMessage.includes('Card declined')) {
      return 'Card declined' + riskSuffix;
    }
    // Return message with risk suffix for generic declines
    return (rawMessage || 'Card declined') + riskSuffix;
  }

  if (status === 'ERROR') {
    // Proxy/connection errors
    if (rawMessage.includes('Proxy') || rawMessage.includes('proxy') || rawMessage.includes('connection')) {
      return 'Proxy connection error - will retry';
    }
    if (rawMessage.includes('PM reuse') || rawMessage.includes('previously used')) {
      return 'Browser context issue - will retry';
    }
    if (rawMessage.includes('Page not ready') || rawMessage.includes('Browser not ready')) {
      return 'Browser not ready - will retry';
    }
    if (rawMessage.includes('timeout') || rawMessage.includes('Timeout')) {
      return 'Request timeout - slow proxy';
    }
    if (rawMessage.includes('CSRF')) {
      return 'Session expired - retry';
    }
    if (rawMessage.includes('TOKEN')) {
      return 'Token creation failed';
    }
    if (rawMessage.includes('RETRY')) {
      return 'Max retries reached';
    }
    // Handle redundant "Error" message
    if (rawMessage.toLowerCase() === 'error' || rawMessage.trim() === '') {
      return 'Validation failed';
    }
    return rawMessage || 'Validation error';
  }

  return rawMessage || status || 'Unknown';
}

const ChargeResultItem = React.memo(function ChargeResultItem({ result, index, copiedCard, onCopy }) {
  const status = result.status?.toUpperCase() || 'UNKNOWN';
  const isApproved = status === 'APPROVED';
  const is3DS = status === '3DS_REQUIRED';
  const isDeclined = status === 'DECLINED';
  const isError = status === 'ERROR';

  // Check for "live" declined cards using GatewayMessageFormatter
  // This covers ALL live decline codes: insufficient_funds, incorrect_cvc, velocity_exceeded, etc.
  const declineCode = result.declineCode || result.shortCode;
  const isLiveDecline = isDeclined && (
    result.isLive === true ||
    GatewayMessageFormatter.isLiveCard(declineCode)
  );
  const isLive = isApproved || is3DS || isLiveDecline;

  const cardDisplay = result.fullCard || result.card || 'Unknown';
  const binData = result.binData;

  // Friendly message based on status - use GatewayMessageFormatter for LIVE declines
  const friendlyMessage = useMemo(() => {
    if (is3DS) return '3DS verification required - card is valid';
    if (isLiveDecline) {
      // Get the formatted message from GatewayMessageFormatter
      const declineInfo = GatewayMessageFormatter.getDeclineInfo(declineCode);
      // Add "CCN Valid" suffix if not already present
      const msg = declineInfo.message;
      if (msg.includes('CCN Valid') || msg.includes('Card valid')) {
        return msg;
      }
      return `${msg} - CCN Valid`;
    }
    return formatChargeMessage(result);
  }, [result, is3DS, isLiveDecline, declineCode]);

  // Risk and fraud data
  const riskLevel = result.riskLevel || result.fraudData?.riskLevel;
  const riskScore = result.riskScore || result.fraudData?.riskScore;
  const avsCheck = result.avsCheck || result.fraudData?.avsCheck;
  const cvcCheck = result.cvcCheck || result.fraudData?.cvcCheck;
  const vbvStatus = result.vbvStatus || result.fraudData?.vbvStatus;
  const vbvPassed = result.vbvPassed || result.fraudData?.vbvPassed;
  const gateway = result.gateway;
  const duration = result.duration;

  const handleCopy = useCallback(() => {
    onCopy(result);
  }, [onCopy, result]);

  const isCopied = copiedCard === result.id;

  const getBadgeVariant = () => {
    if (isApproved) return 'approved';
    if (is3DS || isLiveDecline) return 'coral';
    if (isDeclined) return 'declined';
    return 'error';
  };

  const getBadgeLabel = () => {
    if (isApproved) return 'CHARGED';
    if (is3DS) return 'LIVE 3DS';
    if (isLiveDecline) return 'LIVE';
    if (isDeclined) return 'DECLINED';
    return 'ERROR';
  };

  const getEffectiveStatus = () => {
    if (isApproved) return 'approved';
    if (is3DS) return '3ds';
    if (isLiveDecline) return 'live';
    if (isDeclined) return 'declined';
    return 'error';
  };

  // Check if we have security data to show
  const hasSecurityData = isApproved && (
    (avsCheck && avsCheck !== 'unknown') || 
    (cvcCheck && cvcCheck !== 'unknown') || 
    (riskLevel && riskLevel !== 'unknown')
  );

  return (
    <ResultCard status={getEffectiveStatus()} interactive>
      <ResultCardContent>
        {/* Zone 1: Header - Status + Card Number + Actions */}
        <ResultCardHeader>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Badge variant={getBadgeVariant()} className="text-[10px] font-semibold shrink-0">
              {getBadgeLabel()}
            </Badge>
            <CardNumber card={cardDisplay} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DurationDisplay duration={duration} />
            <CopyButton 
              value={cardDisplay}
              isCopied={isCopied}
              onCopy={handleCopy}
              title="Copy card"
            />
          </div>
        </ResultCardHeader>

        {/* Zone 2: Rich Data - BIN info (only for LIVE cards) */}
        {isLive && (binData || result.brand || result.country) && (
          <ResultCardDataZone>
            <BINDataDisplay 
              binData={binData}
              brand={result.brand}
              country={result.country}
            />
          </ResultCardDataZone>
        )}

        {/* Zone 3: Response - Message + Gateway */}
        <ResultCardResponseZone>
          <ResultCardMessage status={getEffectiveStatus()} className="flex-1">
            {friendlyMessage}
          </ResultCardMessage>
          <GatewayBadge gateway={gateway} />
        </ResultCardResponseZone>

        {/* Zone 4: Security - Risk, CVC, AVS checks (only for CHARGED) */}
        {hasSecurityData && (
          <ResultCardSecurityZone>
            <SecurityIndicators
              riskLevel={riskLevel}
              riskScore={riskScore}
              cvcCheck={cvcCheck}
              avsCheck={avsCheck}
            />
          </ResultCardSecurityZone>
        )}

        {/* 3DS Status indicator */}
        {is3DS && vbvStatus && vbvStatus !== 'N/A' && (
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-neutral-100/80 dark:border-white/5">
            <ResultCardPill variant={vbvPassed ? 'success' : 'warning'}>
              3DS: {vbvPassed ? 'Passed ✓' : 'Required'}
            </ResultCardPill>
          </div>
        )}
      </ResultCardContent>
    </ResultCard>
  );
});

export default StripeChargePanel;
