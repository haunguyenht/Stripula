import { useState, useRef, useEffect } from 'react';
import { Settings, Key, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeysPanel } from './stripe/KeysPanel';
import { CardsPanel } from './stripe/CardsPanel';
import { SettingsSidebar } from './stripe/SettingsSidebar';
import { SettingsDrawer } from './navigation/SettingsDrawer';
import { useBreakpoint } from '../hooks/useMediaQuery';
import { StatusDot } from './ui/Badge';

/**
 * StripeOwn - Main Component
 * Premium Glass theme 2025
 */
export default function StripeOwn() {
    const { isMobile, isTablet, isDesktop } = useBreakpoint();

    // Tab state
    const [activeTab, setActiveTab] = useState(() =>
        localStorage.getItem('stripeOwnTab') || 'keys'
    );

    // Settings drawer state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Key management state
    const [skKeys, setSkKeys] = useState(() =>
        localStorage.getItem('stripeOwnSkKeys') || ''
    );
    const [keyResults, setKeyResults] = useState(() => {
        try { return JSON.parse(localStorage.getItem('stripeKeyResults') || '[]'); }
        catch { return []; }
    });
    const [keyStats, setKeyStats] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('stripeKeyStats')) ||
                { live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 };
        }
        catch { return { live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 }; }
    });
    const [selectedKeyIndex, setSelectedKeyIndex] = useState(() =>
        parseInt(localStorage.getItem('stripeOwnSelectedKey') || '-1')
    );

    // Card management state
    const [cards, setCards] = useState(() =>
        localStorage.getItem('stripeOwnCards') || ''
    );
    const [cardResults, setCardResults] = useState(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('stripeCardResults') || '[]');
            return stored.map(r => {
                if (r.card && typeof r.card === 'object') {
                    const cardInfo = r.card;
                    return {
                        ...r,
                        card: `****${cardInfo.last4 || '****'}`,
                        fullCard: `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}`
                    };
                }
                return r;
            });
        }
        catch { return []; }
    });
    const [cardStats, setCardStats] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('stripeCardStats')) ||
                { approved: 0, live: 0, die: 0, error: 0, total: 0 };
        }
        catch { return { approved: 0, live: 0, die: 0, error: 0, total: 0 }; }
    });

    // Settings state
    const [skKey, setSkKey] = useState(localStorage.getItem('stripeOwnSk') || '');
    const [pkKey, setPkKey] = useState(localStorage.getItem('stripeOwnPk') || '');
    const [proxy, setProxy] = useState(localStorage.getItem('stripeOwnProxy') || '');
    const [concurrency, setConcurrency] = useState(() =>
        parseInt(localStorage.getItem('stripeOwnConcurrency') || '3')
    );
    const [validationMethod, setValidationMethod] = useState(() =>
        localStorage.getItem('stripeOwnValidationMethod') || 'charge'
    );

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // Refs
    const abortRef = useRef(false);
    const abortControllerRef = useRef(null);

    // Persist state to localStorage
    useEffect(() => { localStorage.setItem('stripeOwnTab', activeTab); }, [activeTab]);
    useEffect(() => { localStorage.setItem('stripeOwnSkKeys', skKeys); }, [skKeys]);
    useEffect(() => { localStorage.setItem('stripeKeyResults', JSON.stringify(keyResults)); }, [keyResults]);
    useEffect(() => { localStorage.setItem('stripeKeyStats', JSON.stringify(keyStats)); }, [keyStats]);
    useEffect(() => { localStorage.setItem('stripeOwnSelectedKey', selectedKeyIndex.toString()); }, [selectedKeyIndex]);
    useEffect(() => { localStorage.setItem('stripeOwnCards', cards); }, [cards]);
    useEffect(() => { localStorage.setItem('stripeCardResults', JSON.stringify(cardResults)); }, [cardResults]);
    useEffect(() => { localStorage.setItem('stripeCardStats', JSON.stringify(cardStats)); }, [cardStats]);
    useEffect(() => { localStorage.setItem('stripeOwnConcurrency', concurrency.toString()); }, [concurrency]);
    useEffect(() => { localStorage.setItem('stripeOwnValidationMethod', validationMethod); }, [validationMethod]);

    // Save settings
    const saveSettings = () => {
        localStorage.setItem('stripeOwnSk', skKey);
        localStorage.setItem('stripeOwnPk', pkKey);
        localStorage.setItem('stripeOwnProxy', proxy);
    };

    // Get active SK key
    const getActiveSkKey = () => {
        if (selectedKeyIndex >= 0 && keyResults[selectedKeyIndex]) {
            return keyResults[selectedKeyIndex].fullKey;
        }
        return skKey;
    };

    // Settings props
    const settingsProps = {
        skKey, setSkKey,
        pkKey, setPkKey,
        proxy, setProxy,
        concurrency, setConcurrency,
        validationMethod, setValidationMethod,
        selectedKeyIndex, keyResults,
        saveSettings
    };

    return (
        <div className="h-full flex flex-col lg:flex-row overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[rgba(10,10,16,0.95)] backdrop-blur-sm">
                    <div className="flex items-center gap-5">
                        {/* Tab Switcher */}
                        <div className="flex gap-1.5 p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <motion.button
                                className={`
                                    flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
                                    ${activeTab === 'keys' 
                                        ? 'text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/15 border border-indigo-500/20 shadow-[0_2px_12px_rgba(99,102,241,0.15)]' 
                                        : 'text-white/45 hover:text-white/70 hover:bg-white/[0.04]'
                                    }
                                `}
                                onClick={() => setActiveTab('keys')}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Key size={16} className={activeTab === 'keys' ? 'text-indigo-400' : 'text-white/40'} />
                                <span className="hidden sm:inline">Keys</span>
                            </motion.button>
                            <motion.button
                                className={`
                                    flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
                                    ${activeTab === 'cards' 
                                        ? 'text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/15 border border-indigo-500/20 shadow-[0_2px_12px_rgba(99,102,241,0.15)]' 
                                        : 'text-white/45 hover:text-white/70 hover:bg-white/[0.04]'
                                    }
                                `}
                                onClick={() => setActiveTab('cards')}
                                whileTap={{ scale: 0.98 }}
                            >
                                <CreditCard size={16} className={activeTab === 'cards' ? 'text-indigo-400' : 'text-white/40'} />
                                <span className="hidden sm:inline">Cards</span>
                            </motion.button>
                        </div>
                        
                        {/* Title */}
                        <span className="hidden xl:inline text-xs font-semibold text-white/30 tracking-wider uppercase">
                            Stripe Validator
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Stats */}
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15 hover:bg-emerald-500/10 transition-colors">
                                <StatusDot status="live" size="sm" pulse />
                                <span className="text-xs font-bold font-mono text-emerald-400">
                                    {activeTab === 'keys' ? keyStats.live : cardStats.live}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/8 border border-rose-500/15 hover:bg-rose-500/10 transition-colors">
                                <StatusDot status="die" size="sm" />
                                <span className="text-xs font-bold font-mono text-rose-400">
                                    {activeTab === 'keys' ? keyStats.dead : cardStats.die}
                                </span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/15 hover:bg-amber-500/10 transition-colors">
                                <span className="text-xs font-bold font-mono text-amber-400">
                                    {activeTab === 'keys' ? (keyStats.error || 0) : cardStats.error}
                                </span>
                            </div>
                        </div>

                        {/* Settings button for mobile/tablet */}
                        <motion.button
                            onClick={() => setIsSettingsOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-white/35 hover:text-white/60 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all"
                            whileTap={{ scale: 0.95 }}
                        >
                            <Settings size={16} />
                        </motion.button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'keys' ? (
                            <motion.div
                                key="keys"
                                className="h-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <KeysPanel
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
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="cards"
                                className="h-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <CardsPanel
                                    cards={cards}
                                    setCards={setCards}
                                    cardResults={cardResults}
                                    setCardResults={setCardResults}
                                    cardStats={cardStats}
                                    setCardStats={setCardStats}
                                    skKey={getActiveSkKey()}
                                    pkKey={pkKey}
                                    proxy={proxy}
                                    concurrency={concurrency}
                                    validationMethod={validationMethod}
                                    isLoading={isLoading}
                                    setIsLoading={setIsLoading}
                                    currentItem={currentItem}
                                    setCurrentItem={setCurrentItem}
                                    progress={progress}
                                    setProgress={setProgress}
                                    abortRef={abortRef}
                                    abortControllerRef={abortControllerRef}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Settings Sidebar - Desktop */}
            <div className="hidden lg:block">
                <SettingsSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    {...settingsProps}
                />
            </div>

            {/* Settings Drawer - Mobile/Tablet */}
            <SettingsDrawer
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isMobile={isMobile}
                {...settingsProps}
            />
        </div>
    );
}
