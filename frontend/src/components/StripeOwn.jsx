import { useState, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
import { Key, CreditCard, Loader2 } from 'lucide-react';

// Hooks
import { useLocalStorage } from '@/hooks/useLocalStorage';

// UI Components
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Utils
import { transformLegacyCardResults } from '@/utils/stripe';

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
 */
export default function StripeOwn() {
  const [activeTab, setActiveTab] = useLocalStorage('stripeOwnTab', 'keys');

  // ══════════════════════════════════════════════════════════════════
  // KEY VALIDATION STATE
  // ══════════════════════════════════════════════════════════════════
  const [skKeys, setSkKeys] = useLocalStorage('stripeOwnSkKeys', '');
  const [keyResults, setKeyResults] = useLocalStorage('stripeKeyResults', [], { debounceMs: 1000, maxArrayLength: 500 });
  const [keyStats, setKeyStats] = useLocalStorage('stripeKeyStats', {
    live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0
  }, { debounceMs: 1000 });
  const [selectedKeyIndex, setSelectedKeyIndex] = useLocalStorage('stripeOwnSelectedKey', -1);

  // ══════════════════════════════════════════════════════════════════
  // CARD VALIDATION STATE
  // ══════════════════════════════════════════════════════════════════
  const [cards, setCards] = useLocalStorage('stripeOwnCards', '');
  const [rawCardResults, setCardResults] = useLocalStorage('stripeCardResults', [], { debounceMs: 1000, maxArrayLength: 500 });
  
  const cardResults = useMemo(() => transformLegacyCardResults(rawCardResults), [rawCardResults]);
  const [cardStats, setCardStats] = useLocalStorage('stripeCardStats', {
    approved: 0, live: 0, die: 0, error: 0, total: 0
  }, { debounceMs: 1000 });

  // Recalculate card stats when cardResults change (e.g., on page load from localStorage)
  useEffect(() => {
    if (cardResults.length > 0) {
      const recalculated = {
        approved: cardResults.filter(r => r.status === 'APPROVED').length,
        live: cardResults.filter(r => r.status === 'LIVE').length,
        die: cardResults.filter(r => r.status === 'DIE').length,
        error: cardResults.filter(r => r.status === 'ERROR' || r.status === 'RETRY').length,
        total: cardResults.length
      };
      setCardStats(recalculated);
    }
  }, [cardResults, setCardStats]);

  // ══════════════════════════════════════════════════════════════════
  // SETTINGS STATE
  // ══════════════════════════════════════════════════════════════════
  const [settings, setSettings] = useLocalStorage('stripeOwnSettings', {
    skKey: '',
    pkKey: '',
    proxy: '',
    concurrency: 1,
    validationMethod: 'charge',
  });

  // ══════════════════════════════════════════════════════════════════
  // UI STATE
  // ══════════════════════════════════════════════════════════════════
  const [isLoading, setIsLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Refs
  const abortRef = useRef(false);
  const abortControllerRef = useRef(null);

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

  // Mode switcher using shadcn Tabs
  const modeSwitcher = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
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
      <Suspense fallback={<PanelLoadingFallback />}>
        {activeTab === 'keys' ? (
          <KeysValidationPanel
            skKeys={skKeys}
            setSkKeys={setSkKeys}
            keyResults={keyResults}
            setKeyResults={setKeyResults}
            keyStats={keyStats}
            setKeyStats={setKeyStats}
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
