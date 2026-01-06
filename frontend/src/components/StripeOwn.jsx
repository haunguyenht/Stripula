import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import { Key, CreditCard, Loader2 } from 'lucide-react';

// Hooks
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useBoundedResults } from '@/hooks/useBoundedStorage';

// UI Components
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/alert-dialog';

// Utils
import { calculateCardStats } from '@/utils/statistics';

// Lazy-loaded panels for code-splitting (reduces initial bundle)
const KeysValidationPanel = lazy(() => 
  import('./stripe/panels/KeysValidationPanel').then(m => ({ default: m.KeysValidationPanel }))
);
const CardsValidationPanel = lazy(() => 
  import('./stripe/panels/CardsValidationPanel').then(m => ({ default: m.CardsValidationPanel }))
);

// Loading fallback component
function PanelLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-sm">Loading panel...</span>
      </div>
    </div>
  );
}

/**
 * StripeOwn - Main Component
 * Two-panel layout (Config left, Results right)
 * @param {Object} props
 * @param {string} [props.initialTab] - Optional initial tab ('keys' or 'cards')
 */
export default function StripeOwn({ initialTab }) {
  const [activeTab, setActiveTab] = useLocalStorage('stripeOwnTab', initialTab || 'keys');

  // Sync activeTab when initialTab prop changes (e.g., navigating from SKBased to SK Key Check)
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ══════════════════════════════════════════════════════════════════
  // KEY VALIDATION STATE
  // Results use sessionStorage - survives refresh/crash, clears on browser close
  // ══════════════════════════════════════════════════════════════════
  const [skKeys, setSkKeys] = useLocalStorage('stripeOwnSkKeys', '');
  const { 
    results: keyResults, 
    setResults: setKeyResults 
  } = useBoundedResults('session_keyResults', []);
  const [keyStats, setKeyStats, setKeyStatsImmediate] = useSessionStorage('session_keyStats', {
    live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0
  });
  const [selectedKeyIndex, setSelectedKeyIndex] = useLocalStorage('stripeOwnSelectedKey', -1);

  // ══════════════════════════════════════════════════════════════════
  // CARD VALIDATION STATE  
  // Results use bounded storage - survives refresh/crash, clears on browser close
  // FIFO limit of 5000 results to prevent memory bloat (Requirements: 4.1, 4.2)
  // ══════════════════════════════════════════════════════════════════
  const [cards, setCards] = useLocalStorage('stripeOwnCards', '');
  const { 
    results: rawCardResults, 
    setResults: setCardResults 
  } = useBoundedResults('session_cardResults', []);
  
  const cardResults = rawCardResults;
  const [cardStats, setCardStats, setCardStatsImmediate] = useSessionStorage('session_cardStats', {
    approved: 0, live: 0, die: 0, error: 0, total: 0
  });

  // Sync stats with actual results on mount (fixes mismatch when results were trimmed)
  useEffect(() => {
    if (cardResults.length > 0) {
      const actualStats = calculateCardStats(cardResults);
      setCardStats(actualStats);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // SETTINGS STATE
  // ══════════════════════════════════════════════════════════════════
  const [settings, setSettings] = useLocalStorage('stripeOwnSettings', {
    skKey: '',
    pkKey: '',
    proxy: '',
    concurrency: 3,
    validationMethod: 'direct_api',
    chargeAmount: '1',
    currency: 'usd',
  });

  // ══════════════════════════════════════════════════════════════════
  // UI STATE
  // ══════════════════════════════════════════════════════════════════
  const [isLoading, setIsLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Confirmation dialog state for tab switching during loading
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  // Refs
  const abortRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Clear card settings if selected key becomes DEAD
  useEffect(() => {
    if (selectedKeyIndex >= 0 && keyResults[selectedKeyIndex]) {
      const selectedKey = keyResults[selectedKeyIndex];
      if (selectedKey.status === 'DEAD') {
        // Key is now dead, clear selection and settings
        setSelectedKeyIndex(-1);
        setSettings(prev => ({
          ...prev,
          skKey: '',
          pkKey: '',
        }));
      }
    }
  }, [keyResults, selectedKeyIndex, setSelectedKeyIndex, setSettings]);

  const handleKeySelect = (index) => {
    setSelectedKeyIndex(index);
    if (index >= 0 && keyResults[index]) {
      const selectedResult = keyResults[index];
      setSettings(prev => ({
        ...prev,
        skKey: selectedResult.fullKey || '',
        pkKey: selectedResult.pkKey || '',
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        skKey: '',
        pkKey: '',
      }));
    }
  };

  // Handle tab change with confirmation if loading
  const handleTabChange = useCallback((newTab) => {
    if (isLoading) {
      // Show confirmation dialog
      setPendingTab(newTab);
      setShowStopConfirm(true);
    } else {
      setActiveTab(newTab);
    }
  }, [isLoading, setActiveTab]);

  // Confirm stop and switch tab
  const handleConfirmStop = useCallback(() => {
    // Abort the current request
    abortRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Stop backend processing (only cards tab has backend processing)
    if (activeTab === 'cards') {
      fetch('/api/skbased/stop', { method: 'POST' }).catch(() => {});
    }
    // Keys validation is client-side only, no backend stop needed
    setIsLoading(false);
    setCurrentItem(null);
    // Switch to pending tab
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }, [activeTab, pendingTab, setActiveTab]);

  // Cancel tab switch
  const handleCancelStop = useCallback(() => {
    setPendingTab(null);
  }, []);

  // Mode switcher using shadcn Tabs
  const modeSwitcher = (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
      <TabsList>
        <TabsTrigger value="keys" className="gap-2">
          <Key className="h-4 w-4" />
          Keys
        </TabsTrigger>
        <TabsTrigger value="cards" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Cards
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Confirmation dialog for stopping validation */}
      <ConfirmDialog
        open={showStopConfirm}
        onOpenChange={setShowStopConfirm}
        title="Stop validation?"
        description="Validation is still in progress. Are you sure you want to stop and switch tabs? Any pending cards will not be processed."
        confirmLabel="Stop & Switch"
        cancelLabel="Continue Validation"
        onConfirm={handleConfirmStop}
        onCancel={handleCancelStop}
      />
      
      <Suspense fallback={<PanelLoadingFallback />}>
        {activeTab === 'keys' ? (
          <KeysValidationPanel
            skKeys={skKeys}
            setSkKeys={setSkKeys}
            keyResults={keyResults}
            setKeyResults={setKeyResults}
            keyStats={keyStats}
            setKeyStats={setKeyStats}
            setKeyStatsImmediate={setKeyStatsImmediate}
            selectedKeyIndex={selectedKeyIndex}
            onKeySelect={handleKeySelect}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            currentItem={currentItem}
            setCurrentItem={setCurrentItem}
            abortRef={abortRef}
            modeSwitcher={modeSwitcher}
            drawerOpen={mobileDrawerOpen}
            onDrawerOpenChange={setMobileDrawerOpen}
          />
        ) : (
          <CardsValidationPanel
            cards={cards}
            setCards={setCards}
            cardResults={cardResults}
            setCardResults={setCardResults}
            cardStats={cardStats}
            setCardStats={setCardStats}
            setCardStatsImmediate={setCardStatsImmediate}
            settings={settings}
            onSettingsChange={setSettings}
            keyResults={keyResults}
            selectedKeyIndex={selectedKeyIndex}
            onKeySelect={handleKeySelect}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            currentItem={currentItem}
            setCurrentItem={setCurrentItem}
            progress={progress}
            setProgress={setProgress}
            abortRef={abortRef}
            abortControllerRef={abortControllerRef}
            modeSwitcher={modeSwitcher}
            drawerOpen={mobileDrawerOpen}
            onDrawerOpenChange={setMobileDrawerOpen}
          />
        )}
      </Suspense>
    </div>
  );
}
