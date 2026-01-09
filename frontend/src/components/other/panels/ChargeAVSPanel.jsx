import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MapPin } from 'lucide-react';
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
import { ResultsPanel, ResultItem, ProgressBar } from '../../stripe/ResultsPanel';
import { Badge } from '@/components/ui/badge';
import { useSpeedConfig } from '@/hooks/useSpeedConfig';
import { GatewayMessageFormatter } from '@/utils/gatewayMessage';
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
import { CreditSummary, BatchConfigCard } from '@/components/credits';

export function ChargeAVSPanel() {
  const [cards, setCards] = useLocalStorage('chargeAVSCards', '');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useLocalStorage('chargeAVSSelectedSite', 'charge-avs-1');
  const [cardResults, setCardResults, setCardResultsImmediate] = useSessionStorage('session_chargeAVSResults', [], { maxArrayLength: 200 });
  const [cardStats, setCardStats, setCardStatsImmediate] = useSessionStorage('session_chargeAVSStats', { approved: 0, threeDS: 0, declined: 0, error: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [copiedCard, setCopiedCard] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [batchComplete, setBatchComplete] = useState(false);

  const abortRef = useRef(false);
  const abortControllerRef = useRef(null);
  const { success, error: toastError, info, warning } = useToast();
  const { trigger: celebrationTrigger, celebrate } = useCelebration();

  const {
    balance,
    effectiveRate,
    isAuthenticated,
    creditsConsumed,
    liveCardsCount,
    approvedCardsCount,
    trackLiveCard,
    trackApprovedCard,
    resetTracking,
    setBalance,
    refresh: refreshCredits
  } = useCredits({ gatewayId: selectedSite });

  const { getPricing } = useGatewayCreditRates();
  const pricing = useMemo(() => getPricing(selectedSite), [getPricing, selectedSite]);

  const { getGateway, isAnyAvailable } = useGatewayStatus();
  const { getLimitStatus, userTier } = useCardInputLimits();
  const { config: chargeSpeedConfig } = useSpeedConfig('charge', userTier);

  const selectedGatewayStatus = getGateway(selectedSite);
  const allGatewaysUnavailable = !isAnyAvailable('avs');

  const validationContext = useValidation();

  const handleAbort = useCallback(() => {
    abortRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    fetch('/api/charge-avs/stop', { method: 'POST' }).catch(() => {});
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading && validationContext) {
      validationContext.startValidation('charge-avs', handleAbort);
    } else if (!isLoading && validationContext) {
      validationContext.endValidation();
    }
  }, [isLoading, validationContext, handleAbort]);

  useEffect(() => {
    fetch('/api/charge-avs/sites')
      .then(res => res.json())
      .then(data => {
        if (data.sites) setSites(data.sites);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        fetch('/api/charge-avs/stop', { method: 'POST' }).catch(() => {});
      }
    };
  }, []);

  const handleSiteChange = async (siteId) => {
    const gateway = getGateway(siteId);
    if (gateway && !gateway.isAvailable) {
      warning('This gateway is currently under maintenance');
      return;
    }
    setSelectedSite(siteId);
    try {
      await fetch('/api/charge-avs/site', {
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
    setCardResultsImmediate([]);
    setCardStatsImmediate({ approved: 0, threeDS: 0, declined: 0, error: 0, total: 0 });
    setPage(1);
    setBatchComplete(false);
    resetTracking();
  }, [setCardResultsImmediate, setCardStatsImmediate, resetTracking]);

  const clearCards = useCallback(() => {
    setCards('');
  }, [setCards]);

  const handleCheckCards = async () => {
    if (isLoading) return;

    const cardList = cards.trim();
    if (!cardList) {
      warning('Enter at least one card (format: cc|mm|yy|cvv|zip)');
      return;
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

    setIsLoading(true);
    setBatchComplete(false);
    resetTracking();
    abortRef.current = false;
    setProgress({ current: 0, total: totalCards });
    info(`Starting AVS validation for ${totalCards} cards`);

    let currentCards = cards;
    let stats = {
      approved: cardStats.approved || 0,
      threeDS: cardStats.threeDS || 0,
      declined: cardStats.declined || 0,
      error: cardStats.error || 0,
      total: cardStats.total || 0
    };

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/charge-avs/batch-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardList, siteId: selectedSite }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const creditError = await handleCreditError(response);
        if (creditError) {
          showCreditErrorToast({ error: toastError, warning, info }, creditError);
          setIsLoading(false);
          return;
        }
        const backendError = await handleBackendError(response);
        if (backendError) {
          showCreditErrorToast({ error: toastError, warning, info }, backendError);
          setIsLoading(false);
          return;
        }
        toastError(`Request failed with status ${response.status}`);
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let newResults = [...cardResults];

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
            setProgress({ current: data.processed, total: data.total });
          } else if (event === 'result') {
            const r = data;
            const resultId = `${r.card}-${Date.now()}-${newResults.length}`;
            newResults.unshift({ ...r, id: resultId, fullCard: r.card });
            setCardResults([...newResults]);

            const isLiveDecline = r.status === 'DECLINED' && (
              r.declineCode === 'insufficient_funds' ||
              r.declineCode === 'card_velocity_exceeded' ||
              r.isLive === true
            );

            if (r.status === 'APPROVED') {
              celebrate();
              stats.approved++;
              trackApprovedCard(pricing?.approved || effectiveRate);
              if (typeof r.newBalance === 'number') setBalance(r.newBalance);
            } else if (r.status === '3DS_REQUIRED' || isLiveDecline) {
              celebrate();
              stats.threeDS++;
              trackLiveCard(pricing?.live || effectiveRate);
              if (typeof r.newBalance === 'number') setBalance(r.newBalance);
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
            if (typeof data.newBalance === 'number') {
              setBalance(data.newBalance);
            } else {
              refreshCredits().catch(() => {});
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        const timeoutError = handleTimeoutError(err);
        if (timeoutError) {
          showCreditErrorToast({ error: toastError, warning, info }, timeoutError);
        } else {
          toastError(`Validation error: ${err.message}`);
        }
      }
    }

    setIsLoading(false);
    abortControllerRef.current = null;

    if (!abortRef.current) {
      success(`AVS complete: ${stats.approved} approved, ${stats.threeDS} live, ${stats.declined} declined, ${stats.error} errors`);
      setBatchComplete(true);
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
    await fetch('/api/charge-avs/stop', { method: 'POST' });
    setIsLoading(false);
    warning('AVS validation stopped');
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

  const handleImport = useCallback((_, __, rawInput) => {
    setCards(rawInput);
    clearResults();
  }, [setCards, clearResults]);

  const debouncedFilter = useDebouncedValue(filter);

  const filteredResults = useMemo(() => {
    if (debouncedFilter === 'all') return cardResults;
    return cardResults.filter(r => {
      const status = r.status?.toLowerCase();
      const declineCode = r.declineCode || r.shortCode;
      const isLiveDecline = status === 'declined' && (
        declineCode === 'insufficient_funds' ||
        declineCode === 'card_velocity_exceeded' ||
        r.isLive === true
      );

      if (debouncedFilter === 'approved') return status === 'approved';
      if (debouncedFilter === 'live') return status === '3ds_required' || isLiveDecline;
      if (debouncedFilter === 'declined') return status === 'declined' && !isLiveDecline;
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
    { id: 'approved', label: 'Charged', value: cardStats.approved, color: 'emerald', showDot: true },
    { id: 'live', label: 'Live', value: cardStats.threeDS, color: 'coral', showDot: true },
    { id: 'declined', label: 'Declined', value: cardStats.declined, color: 'rose', showDot: true },
    { id: 'error', label: 'Error', value: cardStats.error, color: 'amber', showDot: true },
  ], [cardStats]);

  const configContent = (
    <div className="space-y-3 sm:space-y-4 p-2 sm:p-4">
      <div className="flex items-center gap-1.5 sm:gap-2 pb-1 sm:pb-2">
        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[rgb(255,64,23)] dark:text-primary shrink-0" />
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-semibold text-[rgb(37,27,24)] dark:text-white truncate">Charge AVS</h2>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Format: cc|mm|yy|cvv|zip</p>
        </div>
      </div>

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
        startButtonLabel="Start AVS"
        placeholder="4111111111111111|12|25|123|10001"
        progressBar={isLoading && progress.total > 0 && (
          <ProgressBar key="progress" current={progress.current} total={progress.total} />
        )}
      />

      {allGatewaysUnavailable && (
        <GatewayUnavailableMessage allUnavailable={true} />
      )}
      {selectedGatewayStatus && !selectedGatewayStatus.isAvailable && !allGatewaysUnavailable && (
        <GatewayUnavailableMessage gateway={selectedGatewayStatus} />
      )}

      {batchComplete && (liveCardsCount > 0 || approvedCardsCount > 0) ? (
        <CreditSummary
          liveCardsCount={liveCardsCount}
          approvedCardsCount={approvedCardsCount}
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
      renderItem={(result) => (
        <ChargeAVSResultItem
          key={result.id}
          result={result}
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
      headerActions={
        <ExportButton
          results={cardResults}
          filter={filter}
          disabled={isLoading || cardResults.length === 0}
          variant="ghost"
          size="sm"
          showLabel={false}
          prefix="charge_avs_results"
        />
      }
    >
      {paginatedResults.map((result) => (
        <ResultItem key={result.id} id={result.id}>
          <ChargeAVSResultItem
            result={result}
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
      <TwoPanelLayout
        configPanel={configContent}
        resultsPanel={resultsContent}
      />
    </>
  );
}

const ChargeAVSResultItem = React.memo(function ChargeAVSResultItem({ result, copiedCard, onCopy }) {
  const status = result.status?.toUpperCase() || 'UNKNOWN';
  const isApproved = status === 'APPROVED';
  const is3DS = status === '3DS_REQUIRED';
  const isDeclined = status === 'DECLINED';

  const declineCode = result.declineCode || result.shortCode;
  const isLiveDecline = isDeclined && (
    result.isLive === true ||
    GatewayMessageFormatter.isLiveCard(declineCode)
  );
  const isLive = isApproved || is3DS || isLiveDecline;

  const cardDisplay = result.fullCard || result.card || 'Unknown';
  const binData = result.binData;
  const chargeAmount = result.chargeAmount;

  const friendlyMessage = useMemo(() => {
    if (is3DS) return '3DS verification required - card is valid';
    if (isLiveDecline) {
      const declineInfo = GatewayMessageFormatter.getDeclineInfo(declineCode);
      const msg = declineInfo.message;
      if (msg.includes('CCN Valid') || msg.includes('Card valid')) return msg;
      return `${msg} - CCN Valid`;
    }
    return result.message || status;
  }, [result, is3DS, isLiveDecline, declineCode, status]);

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
    if (isApproved) return chargeAmount ? `CHARGED ${chargeAmount}` : 'CHARGED';
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

  return (
    <ResultCard status={getEffectiveStatus()} interactive>
      <ResultCardContent>
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

        {isLive && (binData || result.brand || result.country) && (
          <ResultCardDataZone>
            <BINDataDisplay 
              binData={binData}
              brand={result.brand}
              country={result.country}
            />
          </ResultCardDataZone>
        )}

        <ResultCardResponseZone>
          <ResultCardMessage status={getEffectiveStatus()} className="flex-1">
            {friendlyMessage}
          </ResultCardMessage>
          <GatewayBadge gateway={gateway} />
        </ResultCardResponseZone>
      </ResultCardContent>
    </ResultCard>
  );
});

export default ChargeAVSPanel;
