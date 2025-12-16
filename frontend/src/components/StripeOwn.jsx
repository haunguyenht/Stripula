import { useState, useRef, useMemo } from 'react';
import { Key, CreditCard } from 'lucide-react';

// Panels
import { KeysValidationPanel } from './stripe/panels/KeysValidationPanel';
import { CardsValidationPanel } from './stripe/panels/CardsValidationPanel';

// Hooks
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '../lib/utils';

// Utils
import { transformLegacyCardResults } from '../utils/stripe';

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
    
    // Mobile drawer state - lifted here to persist across mode switches
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // Refs
    const abortRef = useRef(false);
    const abortControllerRef = useRef(null);

    // Get active SK key (used by child components via settings)
    const _getActiveSkKey = () => {
        if (selectedKeyIndex >= 0 && keyResults[selectedKeyIndex]) {
            return keyResults[selectedKeyIndex].fullKey;
        }
        return settings.skKey;
    };
    // Suppress unused warning - function available for future use
    void _getActiveSkKey;

    // Handle key selection - auto-update settings with selected key's SK and PK
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
            // Manual input - clear the fields
            setSettings(prev => ({
                ...prev,
                skKey: '',
                pkKey: '',
            }));
        }
    };

    // Mode switcher component to pass to panels
    const modeSwitcher = (
        <div className="flex items-center justify-center gap-4">
            {/* Mode Toggle - Liquid Glass */}
            <div className="liquid-tab-container liquid-blur">
                <ModeTab
                    active={activeTab === 'keys'}
                    onClick={() => setActiveTab('keys')}
                    icon={Key}
                    label="Keys"
                    iconColor={activeTab === 'keys' ? "mode-icon-keys" : undefined}
                />
                <ModeTab
                    active={activeTab === 'cards'}
                    onClick={() => setActiveTab('cards')}
                    icon={CreditCard}
                    label="Cards"
                    iconColor={activeTab === 'cards' ? "mode-icon-cards" : undefined}
                />
            </div>

            {/* Mode indicator text */}
            <span className="mode-indicator">
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
                    onKeySelect={handleKeySelect}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    currentItem={currentItem}
                    setCurrentItem={setCurrentItem}
                    abortRef={abortRef}
                    modeSwitcher={modeSwitcher}
                    // Pass drawer state to persist across mode switches
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
                    // Pass drawer state to persist across mode switches
                    drawerOpen={mobileDrawerOpen}
                    onDrawerOpenChange={setMobileDrawerOpen}
                />
            )}
        </div>
    );
}

/**
 * ModeTab - Compact liquid glass tab using centralized CSS
 * Uses mode-icon-* classes from index.css
 */
function ModeTab({ active, onClick, icon: Icon, label, iconColor }) {
    const defaultIconColor = active ? "mode-icon-cards" : undefined;
    
    return (
        <button
            className={cn("liquid-tab", active && "liquid-tab-active")}
            onClick={onClick}
        >
            <Icon className={cn("liquid-tab-icon", iconColor || defaultIconColor)} />
            <span className="liquid-tab-label">{label}</span>
        </button>
    );
}

