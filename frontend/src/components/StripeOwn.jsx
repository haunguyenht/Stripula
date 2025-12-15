import { useState, useRef, useMemo } from 'react';
import { Key, CreditCard } from 'lucide-react';

// Panels
import { KeysValidationPanel } from './stripe/panels/KeysValidationPanel';
import { CardsValidationPanel } from './stripe/panels/CardsValidationPanel';

// Hooks
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '../lib/utils';

/**
 * Transform legacy card results that stored card as object
 * Converts { card: { number, last4, expMonth, expYear } } to { card: "****1234", fullCard: "..." }
 */
function transformLegacyCardResults(results) {
    if (!Array.isArray(results)) return [];
    return results.map(r => {
        if (r.card && typeof r.card === 'object') {
            const cardInfo = r.card;
            return {
                ...r,
                card: `****${cardInfo.last4 || '****'}`,
                fullCard: cardInfo.number 
                    ? `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}`
                    : r.fullCard
            };
        }
        return r;
    });
}

/**
 * StripeOwn - Main Component
 * Two-panel layout (Config left, Results right)
 * Header removed - navigation handled by global TopTabBar
 */
export default function StripeOwn() {
    // Tab state (Keys vs Cards)
    const [activeTab, setActiveTab] = useLocalStorage('stripeOwnTab', 'keys');

    // ══════════════════════════════════════════════════════════════════
    // KEY VALIDATION STATE
    // ══════════════════════════════════════════════════════════════════
    const [skKeys, setSkKeys] = useLocalStorage('stripeOwnSkKeys', '');
    const [keyResults, setKeyResults] = useLocalStorage('stripeKeyResults', []);
    const [keyStats, setKeyStats] = useLocalStorage('stripeKeyStats', {
        live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0
    });
    const [selectedKeyIndex, setSelectedKeyIndex] = useLocalStorage('stripeOwnSelectedKey', -1);

    // ══════════════════════════════════════════════════════════════════
    // CARD VALIDATION STATE
    // ══════════════════════════════════════════════════════════════════
    const [cards, setCards] = useLocalStorage('stripeOwnCards', '');
    const [rawCardResults, setCardResults] = useLocalStorage('stripeCardResults', []);
    
    // Transform legacy card results (where card was stored as object)
    const cardResults = useMemo(() => transformLegacyCardResults(rawCardResults), [rawCardResults]);
    const [cardStats, setCardStats] = useLocalStorage('stripeCardStats', {
        approved: 0, live: 0, die: 0, error: 0, total: 0
    });

    // ══════════════════════════════════════════════════════════════════
    // SETTINGS STATE
    // ══════════════════════════════════════════════════════════════════
    const [settings, setSettings] = useLocalStorage('stripeOwnSettings', {
        skKey: '',
        pkKey: '',
        proxy: '',
        concurrency: 3,
        validationMethod: 'charge',
    });

    // ══════════════════════════════════════════════════════════════════
    // UI STATE
    // ══════════════════════════════════════════════════════════════════
    const [isLoading, setIsLoading] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // Refs
    const abortRef = useRef(false);
    const abortControllerRef = useRef(null);

    // Get active SK key
    const getActiveSkKey = () => {
        if (selectedKeyIndex >= 0 && keyResults[selectedKeyIndex]) {
            return keyResults[selectedKeyIndex].fullKey;
        }
        return settings.skKey;
    };

    // Mode switcher component to pass to panels
    const modeSwitcher = (
        <div className="flex items-center justify-between">
            {/* Mode Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 md:p-1 rounded-lg md:rounded-xl bg-gray-50 border border-gray-100">
                <ModeTab
                    active={activeTab === 'keys'}
                    onClick={() => setActiveTab('keys')}
                    icon={Key}
                    label="Keys"
                />
                <ModeTab
                    active={activeTab === 'cards'}
                    onClick={() => setActiveTab('cards')}
                    icon={CreditCard}
                    label="Cards"
                />
            </div>

            {/* Mode indicator text */}
            <span className="text-[9px] md:text-[10px] text-gray-400 font-medium hidden md:block">
                {activeTab === 'keys' ? 'SK Validation' : 'Card Check'}
            </span>
        </div>
    );

    return (
        <div className="h-full overflow-hidden">
            {activeTab === 'keys' ? (
                <KeysValidationPanel
                    skKeys={skKeys}
                    setSkKeys={setSkKeys}
                    keyResults={keyResults}
                    setKeyResults={setKeyResults}
                    keyStats={keyStats}
                    setKeyStats={setKeyStats}
                    selectedKeyIndex={selectedKeyIndex}
                    setSelectedKeyIndex={setSelectedKeyIndex}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    currentItem={currentItem}
                    setCurrentItem={setCurrentItem}
                    abortRef={abortRef}
                    modeSwitcher={modeSwitcher}
                />
            ) : (
                <CardsValidationPanel
                    cards={cards}
                    setCards={setCards}
                    cardResults={cardResults}
                    setCardResults={setCardResults}
                    cardStats={cardStats}
                    setCardStats={setCardStats}
                    settings={{ ...settings, skKey: getActiveSkKey() }}
                    onSettingsChange={setSettings}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    currentItem={currentItem}
                    setCurrentItem={setCurrentItem}
                    progress={progress}
                    setProgress={setProgress}
                    abortRef={abortRef}
                    abortControllerRef={abortControllerRef}
                    modeSwitcher={modeSwitcher}
                />
            )}
        </div>
    );
}

/**
 * ModeTab - Mode toggle with icon and label (responsive)
 */
function ModeTab({ active, onClick, icon: Icon, label }) {
    return (
        <button
            className={cn(
                "flex items-center gap-1 px-2 py-1 md:gap-1.5 md:px-3 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-xs font-semibold transition-all",
                active
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
            )}
            onClick={onClick}
        >
            <Icon size={12} className={cn("md:w-[14px] md:h-[14px]", active ? "text-orange-500" : "text-gray-400")} />
            <span>{label}</span>
        </button>
    );
}
