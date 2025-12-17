import React, { useState, useMemo, useRef, useCallback } from 'react';
import { CreditCard, Trash2, Copy, Check, Zap, Key, ChevronDown, Loader2, ShieldCheck, ShieldX, ShieldAlert, Clock, Building2 } from 'lucide-react';
import { VisaFlatRoundedIcon, MastercardFlatRoundedIcon, AmericanExpressFlatRoundedIcon, DiscoverFlatRoundedIcon, JCBFlatRoundedIcon, UnionPayFlatRoundedIcon, DinersClubFlatRoundedIcon, GenericFlatRoundedIcon } from 'react-svg-credit-card-payment-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../hooks/useToast';
import { useCardFilters } from '../../../hooks/useCardFilters';

// Layout
import { TwoPanelLayout } from '../../layout/TwoPanelLayout';

// Components
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Badge } from '../../ui/Badge';
import { ResultCard } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input, RangeSlider } from '../../ui/Input';
import { ProxyInput } from '../../ui/ProxyInput';
import { Celebration, useCelebration } from '../../ui/Celebration';
import { cn } from '../../../lib/utils';

// Utils
import { parseProxy } from '../../../utils/proxy.js';

/**
 * CardsValidationPanel - Two-panel layout for card validation
 * Left: Input + Settings
 * Right: Stats + Results
 */
export function CardsValidationPanel({
    cards,
    setCards,
    cardResults,
    setCardResults,
    cardStats,
    setCardStats,
    settings,
    onSettingsChange,
    keyResults = [],
    selectedKeyIndex,
    onKeySelect,
    isLoading,
    setIsLoading,
    // currentItem - received but not displayed in this panel
    setCurrentItem,
    progress,
    setProgress,
    abortRef,
    abortControllerRef,
    modeSwitcher,
    // Drawer state lifted from parent to persist across mode switches
    drawerOpen,
    onDrawerOpenChange,
}) {
    const [copiedCard, setCopiedCard] = useState(null);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isFetchingPk, setIsFetchingPk] = useState(false);
    const pkFetchTimeoutRef = useRef(null);
    const proxyInputRef = useRef(null);
    const { success, error: toastError, info, warning } = useToast();
    const { trigger: celebrationTrigger, celebrate } = useCelebration();

    // Filter live keys for dropdown
    const liveKeys = useMemo(() => 
        keyResults.filter(k => k.status?.startsWith('LIVE')),
        [keyResults]
    );

    // Check if using manual input (selectedKeyIndex is -1 or "manual")
    const isManualInput = selectedKeyIndex === -1 || selectedKeyIndex === 'manual';

    // ══════════════════════════════════════════════════════════════════
    // HANDLERS
    // ══════════════════════════════════════════════════════════════════

    const clearResults = () => {
        setCardResults([]);
        setCardStats({ approved: 0, live: 0, die: 0, error: 0, total: 0 });
        setPage(1);
    };

    const handleSettingChange = useCallback((key, value) => {
        onSettingsChange?.((prev) => ({ ...prev, [key]: value }));
    }, [onSettingsChange]);

    const fetchPkForSk = useCallback(async (skKey) => {
        if (!skKey || !skKey.startsWith('sk_live_') || skKey.length < 20) return;
        
        const trimmedKey = skKey.trim();
        const existingKey = keyResults.find(k => k.fullKey?.trim() === trimmedKey);
        if (existingKey) {
            if (existingKey.status === 'DEAD') {
                warning('This key is dead');
                return;
            }
            if (existingKey.pkKey) {
                onSettingsChange?.((prev) => ({ ...prev, skKey: trimmedKey, pkKey: existingKey.pkKey }));
                success(`PK key found • ${existingKey.status}`);
                return;
            }
        }
        
        setIsFetchingPk(true);
        info('Fetching PK key...');
        try {
            const response = await fetch('/api/stripe-own/check-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skKey })
            });
            const result = await response.json();
            
            if (result.pkKey) {
                onSettingsChange?.((prev) => ({ ...prev, skKey, pkKey: result.pkKey }));
                success(`PK key fetched • ${result.status}`);
            } else if (result.status === 'DEAD') {
                warning(result.message || 'Key is dead');
            } else {
                warning('Could not fetch PK key');
            }
        } catch (err) {
            console.error('Failed to fetch PK:', err);
            toastError('Failed to fetch PK key');
        } finally {
            setIsFetchingPk(false);
        }
    }, [keyResults, onSettingsChange, info, success, warning, toastError]);

    const handlePkKeyChange = useCallback((value) => {
        const currentSk = settings?.skKey?.trim();
        const existingKey = currentSk ? keyResults.find(k => k.fullKey?.trim() === currentSk) : null;
        
        if (existingKey?.pkKey && value.trim() !== existingKey.pkKey) {
            toastError('PK key does not match this SK key');
        }
        
        handleSettingChange('pkKey', value);
    }, [settings?.skKey, keyResults, handleSettingChange, toastError]);

    const handleSkKeyChange = useCallback((value) => {
        handleSettingChange('skKey', value);
        
        if (pkFetchTimeoutRef.current) {
            clearTimeout(pkFetchTimeoutRef.current);
        }
        
        if (value.startsWith('sk_live_') && value.length >= 30) {
            pkFetchTimeoutRef.current = setTimeout(() => {
                fetchPkForSk(value);
            }, 500);
        }
    }, [handleSettingChange, fetchPkForSk]);

    const handleCheckCards = async () => {
        if (!settings.skKey?.trim()) {
            warning('Enter an SK key');
            return;
        }
        if (!settings.pkKey?.trim() || !settings.pkKey.startsWith('pk_')) {
            warning('PK Key is required for card validation');
            return;
        }
        if (settings.validationMethod === 'charge' && !settings.proxy?.trim()) {
            warning('Proxy is required for charge validation');
            return;
        }
        // Auto-check proxy and block if static IP detected
        if (settings.proxy?.trim() && proxyInputRef.current) {
            const proxyResult = await proxyInputRef.current.checkProxy(true);
            if (proxyResult.isStatic) {
                toastError('Static IP not supported. Please use a rotating proxy to continue.');
                return;
            }
        }
        const cardList = cards.trim();
        if (!cardList) {
            warning('Enter at least one card');
            return;
        }

        setIsLoading(true);
        abortRef.current = false;
        const totalCards = cardList.split('\n').filter(l => l.trim()).length;
        setProgress({ current: 0, total: totalCards });

        const methodLabels = { charge: 'Charge', nocharge: 'No Charge', setup: 'Setup' };
        const methodLabel = methodLabels[settings.validationMethod] || 'Charge';
        setCurrentItem(`Starting ${methodLabel} validation...`);
        info(`Starting ${methodLabel} validation for ${totalCards} cards`);

        let currentCards = cards; // Track current cards for real-time removal
        
        try {
            abortControllerRef.current = new AbortController();

            const proxyObj = parseProxy(settings.proxy);
            // Parse charge amount - convert dollars to cents
            const chargeAmountCents = settings.chargeAmount 
                ? Math.round(parseFloat(settings.chargeAmount) * 100) 
                : null;

            const response = await fetch('/api/stripe-own/validate-batch-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skKey: settings.skKey.trim(),
                    pkKey: settings.pkKey.trim(),
                    cardList,
                    concurrency: settings.concurrency,
                    proxy: proxyObj,
                    validationMethod: settings.validationMethod,
                    chargeAmount: chargeAmountCents
                }),
                signal: abortControllerRef.current.signal
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let newResults = [...cardResults];
            let stats = { ...cardStats };

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
                        setProgress({ current: data.current, total: data.total });
                        stats = {
                            approved: data.summary.approved || 0,
                            live: data.summary.live || 0,
                            die: data.summary.die || 0,
                            error: data.summary.error || 0,
                            total: data.current
                        };
                        setCardStats({ ...stats });
                        setCurrentItem(`${data.current}/${data.total}`);
                    } else if (event === 'result') {
                        const r = data;
                        const cardInfo = r.card || {};
                        // Build full card string with CVV if available
                        const cvv = cardInfo.cvc || cardInfo.cvv;
                        const fullCard = typeof cardInfo === 'object'
                            ? `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}${cvv ? '|' + cvv : ''}`
                            : cardInfo;
                        // Generate stable unique id for this result
                        const resultId = `${fullCard}-${Date.now()}-${newResults.length}`;
                        newResults.unshift({
                            ...r,
                            id: resultId,
                            card: fullCard,
                            fullCard: fullCard
                        });
                        setCardResults([...newResults]);
                        
                        // Trigger celebration for APPROVED cards
                        if (r.status === 'APPROVED') {
                            celebrate();
                        }
                        
                        // Remove processed card from input immediately
                        if (typeof cardInfo === 'object' && cardInfo.number) {
                            const cardNumber = cardInfo.number;
                            currentCards = currentCards
                                .split('\n')
                                .filter(line => {
                                    const trimmed = line.trim();
                                    if (!trimmed) return false;
                                    const lineCardNumber = trimmed.split(/[|,\s]/)[0];
                                    return lineCardNumber !== cardNumber;
                                })
                                .join('\n');
                            setCards(currentCards);
                        }
                    }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setCurrentItem(`Error: ${err.message}`);
                toastError(`Validation error: ${err.message}`);
            }
        }

        setIsLoading(false);
        setCurrentItem(null);
        abortControllerRef.current = null;
        
        // Show completion toast if not aborted
        if (!abortRef.current) {
            const { live = 0, die = 0, error: errCount = 0 } = cardStats;
            success(`Validation complete: ${live} live, ${die} dead, ${errCount} errors`);
        }
    };

    const handleStop = async () => {
        abortRef.current = true;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        await fetch('/api/stripe-own/stop-batch', { method: 'POST' });
        setIsLoading(false);
        setCurrentItem('Stopped');
        warning('Card validation stopped');
    };

    const handleCopyCard = useCallback((card, id) => {
        navigator.clipboard.writeText(card);
        setCopiedCard(id);
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

    // ══════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ══════════════════════════════════════════════════════════════════

    const cardCount = useMemo(() => 
        cards.split('\n').filter(l => l.trim()).length,
        [cards]
    );

    const filteredResults = useCardFilters(cardResults, filter);

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
        { id: 'approved', label: 'Approved', value: cardStats.approved, color: 'coral', showDot: true },
        { id: 'live', label: 'Live', value: cardStats.live, color: 'emerald', showDot: true },
        { id: 'die', label: 'Die', value: cardStats.die, color: 'rose', showDot: true },
        { id: 'error', label: 'Error', value: cardStats.error, color: 'amber', showDot: true },
    ], [cardStats]);


    // ══════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════

    // Config panel content (without mode switcher) - used in drawer body
    const configContent = (
        <>
            {/* Input Section with embedded buttons */}
            <div className="panel-input-section">
                {/* Combined Input Container */}
                <div className={`input-container-unified border-luma-coral-15 hover:border-luma-coral-25 ${isLoading ? 'input-container-loading' : ''}`}>
                    <textarea
                        className={`input-textarea h-16 md:h-20 ${isLoading ? 'input-textarea-disabled' : ''}`}
                        placeholder="Enter cards (one per line)&#10;4111111111111111|01|2025|123"
                        value={cards}
                        onChange={(e) => setCards(e.target.value)}
                        disabled={isLoading}
                    />
                    {/* Bottom toolbar inside input */}
                    <div className="input-toolbar">
                        <div className="flex items-center gap-2">
                            {cardCount > 0 && (
                                <span className="count-badge">
                                    {cardCount} cards
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-full hover:bg-luma-coral-10"
                                onClick={clearResults}
                                disabled={isLoading}
                                title="Clear"
                            >
                                <Trash2 size={14} className="text-gray-400 dark:text-gray-500" />
                            </Button>
                        </div>
                        {isLoading ? (
                            <button 
                                className="input-action-btn input-action-btn-stop"
                                onClick={handleStop}
                            >
                                <span className="w-2.5 h-2.5 bg-white rounded-sm" />
                            </button>
                        ) : (
                            <button 
                                className="input-action-btn input-action-btn-primary"
                                onClick={handleCheckCards}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress */}
                <AnimatePresence>
                    {isLoading && progress.total > 0 && (
                        <ProgressBar current={progress.current} total={progress.total} />
                    )}
                </AnimatePresence>
            </div>

            {/* Settings Section - Scrollable, compact */}
            <div className="settings-section">
                {/* API Keys */}
                <div className="settings-card settings-card-inner border-luma-coral-10">
                    <div className="settings-header">
                        <div className="settings-header-icon settings-header-icon-amber">
                            <Key size={12} className="text-white" />
                        </div>
                        Keys
                    </div>
                    
                    {/* Key Selection Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedKeyIndex}
                            onChange={(e) => {
                                const val = e.target.value;
                                onKeySelect?.(val === 'manual' ? -1 : parseInt(val));
                            }}
                            disabled={isLoading}
                            className="w-full h-8 px-3 pr-8 text-[10px] font-medium bg-white dark:bg-luma-surface border border-luma-coral/20 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-luma-coral/40 focus:ring-2 focus:ring-luma-coral/10 text-gray-700 dark:text-gray-200"
                        >
                            <option value="manual">Manual Input</option>
                            {liveKeys.map((key) => {
                                const originalIdx = keyResults.indexOf(key);
                                return (
                                    <option key={originalIdx} value={originalIdx}>
                                        🟢 {key.key} {key.accountEmail && key.accountEmail !== 'N/A' ? `• ${key.accountEmail}` : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                        <div className="relative">
                            <Input
                                placeholder="sk_live_..."
                                value={settings?.skKey || ''}
                                onChange={(e) => handleSkKeyChange(e.target.value)}
                                disabled={isLoading || !isManualInput || isFetchingPk}
                                className={cn(
                                    "text-[10px] h-7 md:h-8 border-luma-coral-15 focus:border-luma-coral-40",
                                    !isManualInput && "opacity-60 bg-gray-100 dark:bg-gray-800",
                                    isFetchingPk && "pr-8"
                                )}
                            />
                            {isFetchingPk && (
                                <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-luma-coral" />
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                placeholder="pk_live_..."
                                value={settings?.pkKey || ''}
                                onChange={(e) => handlePkKeyChange(e.target.value)}
                                disabled={isLoading || !isManualInput || isFetchingPk}
                                className={cn(
                                    "text-[10px] h-7 md:h-8 border-luma-coral-15 focus:border-luma-coral-40",
                                    !isManualInput && "opacity-60 bg-gray-100 dark:bg-gray-800",
                                    isFetchingPk && "pr-8"
                                )}
                            />
                            {isFetchingPk && (
                                <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-luma-coral" />
                            )}
                        </div>
                    </div>
                    <ProxyInput
                        ref={proxyInputRef}
                        placeholder="Proxy (host:port:user:pass)"
                        value={settings?.proxy || ''}
                        onChange={(e) => handleSettingChange('proxy', e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* Validation Options */}
                <div className="settings-card settings-card-inner border-luma-coral-10">
                    <div className="settings-header mb-2">
                        <div className="settings-header-icon settings-header-icon-rose">
                            <Zap size={12} className="text-white" />
                        </div>
                        Method
                    </div>
                    
                    {/* Method pills - 3 columns */}
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                        {[
                            { value: 'charge', label: 'Charge' },
                            { value: 'nocharge', label: 'No Charge' },
                            { value: 'setup', label: 'Checkout' },
                        ].map((method) => (
                            <button
                                key={method.value}
                                onClick={() => handleSettingChange('validationMethod', method.value)}
                                disabled={isLoading}
                                className={cn(
                                    "method-pill px-2 py-1.5 text-[10px]",
                                    settings?.validationMethod === method.value && "active"
                                )}
                            >
                                {method.label}
                            </button>
                        ))}
                    </div>

                    {/* Charge Amount - only show when charge method is selected */}
                    {settings?.validationMethod === 'charge' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-luma-coral-10 mb-2">
                            <span className="settings-label">Amount $</span>
                            <input
                                type="number"
                                min="0.50"
                                max="50"
                                step="0.01"
                                value={settings?.chargeAmount || ''}
                                onChange={(e) => handleSettingChange('chargeAmount', e.target.value)}
                                placeholder="Random"
                                disabled={isLoading}
                                className="settings-inline-input flex-1 px-2 py-1 text-[11px] text-center"
                            />
                            <span className="settings-hint">0.50-50</span>
                        </div>
                    )}

                    {/* Concurrency */}
                    <div className="flex items-center gap-2 pt-2 border-t border-luma-coral-10">
                        <span className="text-[9px] text-gray-500 dark:text-gray-400">Threads</span>
                        <div className="flex-1">
                            <RangeSlider
                                min="1"
                                max="10"
                                value={settings?.concurrency || 3}
                                onChange={(e) => handleSettingChange('concurrency', parseInt(e.target.value))}
                                disabled={isLoading}
                            />
                        </div>
                        <span className="w-5 text-center text-[10px] font-mono text-gray-800 dark:text-gray-200">
                            {settings?.concurrency || 3}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
        <Celebration trigger={celebrationTrigger} />
        <TwoPanelLayout
            modeSwitcher={modeSwitcher}
            drawerOpen={drawerOpen}
            onDrawerOpenChange={onDrawerOpenChange}
            configPanelWithoutSwitcher={
                <div className="flex flex-col">
                    {configContent}
                </div>
            }
            configPanel={
                <div className="flex flex-col h-full">
                    {/* Card Header with Mode Switcher */}
                    {modeSwitcher && (
                        <div className="panel-header">
                            {modeSwitcher}
                        </div>
                    )}
                    {configContent}
                </div>
            }
            resultsPanel={
                <ResultsPanel
                    stats={stats}
                    activeFilter={filter}
                    onFilterChange={handleFilterChange}
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    onClear={clearResults}
                    onCopyAll={filteredResults.length > 0 ? handleCopyAllCards : undefined}
                    isLoading={isLoading}
                    isEmpty={paginatedResults.length === 0}
                    emptyState={<CardsEmptyState />}
                >
                    {paginatedResults.map((result) => (
                        <ResultItem key={result.id} id={result.id}>
                            <CardResultCard
                                result={result}
                                isCopied={copiedCard === result.id}
                                onCopy={() => handleCopyCard(result.fullCard || result.card, result.id)}
                            />
                        </ResultItem>
                    ))}
                </ResultsPanel>
            }
        />
        </>
    );
}

// ══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (extracted for performance - avoid recreation on each render)
// ══════════════════════════════════════════════════════════════════

function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function getStatusVariant(status) {
    if (status === 'APPROVED') return 'approved';
    if (status === 'LIVE') return 'live';
    if (status === 'DIE') return 'die';
    if (status === 'ERROR') return 'error';
    if (status === 'RETRY') return 'retry';
    return 'default';
}

function getResultStatus(status) {
    if (status === 'APPROVED' || status === 'LIVE') return 'live';
    if (status === 'DIE') return 'die';
    return 'error';
}

function formatDuration(ms) {
    if (!ms) return null;
    return (ms / 1000).toFixed(1);
}

const BRAND_ICON_PROPS = { width: 28, height: 18 };

function renderBrandIcon(scheme) {
    const s = scheme?.toLowerCase() || '';
    if (s === 'visa') return <VisaFlatRoundedIcon {...BRAND_ICON_PROPS} />;
    if (s === 'mastercard') return <MastercardFlatRoundedIcon {...BRAND_ICON_PROPS} />;
    if (s === 'amex' || s === 'american express') return <AmericanExpressFlatRoundedIcon {...BRAND_ICON_PROPS} />;
    if (s === 'discover') return <DiscoverFlatRoundedIcon {...BRAND_ICON_PROPS} />;
    if (s === 'jcb') return <JCBFlatRoundedIcon {...BRAND_ICON_PROPS} />;
    if (s === 'unionpay' || s === 'union pay') return <UnionPayFlatRoundedIcon {...BRAND_ICON_PROPS} />;
    if (s === 'diners' || s === 'diners club') return <DinersClubFlatRoundedIcon {...BRAND_ICON_PROPS} />;
    return <GenericFlatRoundedIcon {...BRAND_ICON_PROPS} />;
}

function getCategoryPillClass(category) {
    if (!category) return null;
    const c = category.toLowerCase();
    if (c.includes('platinum')) return 'category-pill category-pill-platinum';
    if (c.includes('gold')) return 'category-pill category-pill-gold';
    if (c.includes('business')) return 'category-pill category-pill-business';
    if (c.includes('corporate')) return 'category-pill category-pill-corporate';
    if (c.includes('world')) return 'category-pill category-pill-world';
    if (c.includes('signature')) return 'category-pill category-pill-signature';
    if (c.includes('infinite')) return 'category-pill category-pill-infinite';
    if (c.includes('enhanced')) return 'category-pill category-pill-enhanced';
    if (c.includes('classic')) return 'category-pill category-pill-classic';
    return 'category-pill category-pill-standard';
}

function getTypePillClass(type) {
    const t = type?.toLowerCase() || '';
    if (t === 'credit') return 'type-pill type-pill-credit';
    if (t === 'debit') return 'type-pill type-pill-debit';
    if (t === 'prepaid') return 'type-pill type-pill-prepaid';
    return 'type-pill';
}

function getRiskIconClass(level) {
    if (!level || level === 'unknown') return null;
    if (level === 'normal' || level === 'low') return 'risk-icon risk-icon-low';
    if (level === 'elevated' || level === 'medium') return 'risk-icon risk-icon-elevated';
    return 'risk-icon risk-icon-high';
}

function getCheckIconClass(check) {
    if (!check || check === 'unknown' || check === 'unavailable') return 'check-icon check-icon-unknown';
    if (check === 'pass' || check === 'match') return 'check-icon check-icon-pass';
    return 'check-icon check-icon-fail';
}

function getCardMessage(result) {
    if (!result.message) return null;
    if (result.status === 'APPROVED') {
        return result.chargeAmountFormatted ? `Charged ${result.chargeAmountFormatted}` : 'Payment successful';
    }
    if (result.status === 'LIVE') return result.message;
    if (result.status === 'DIE') return result.message.replace(/^Declined:\s*/i, '').replace(/_/g, ' ');
    return result.message.replace(/^(Error:|Tokenization failed:)\s*/i, '');
}

/**
 * CardResultCard - Compact card result with icon-based design
 * Memoized for performance during mass card checking
 */
const CardResultCard = React.memo(function CardResultCard({ result, isCopied, onCopy }) {
    const isFullView = result.status === 'LIVE' || result.status === 'APPROVED';
    const message = getCardMessage(result);

    return (
        <ResultCard status={getResultStatus(result.status)} className="card-result-compact">
            {/* Row 1: Status + Card Number + Actions */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant={getStatusVariant(result.status)} size="xs">
                        {result.status}
                    </Badge>
                    {result.chargeAmountFormatted && (
                        <span className="amount-badge">{result.chargeAmountFormatted}</span>
                    )}
                    <span className="card-number-compact truncate flex-1">{result.card}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {result.duration && (
                        <span className="duration-compact flex items-center gap-1">
                            <Clock size={10} />
                            {formatDuration(result.duration)}s
                        </span>
                    )}
                    <button 
                        onClick={onCopy} 
                        className="p-1 rounded hover:bg-luma-coral-10 transition-colors"
                        title="Copy card"
                    >
                        {isCopied ? <Check size={12} className="text-luma-success" /> : <Copy size={12} className="text-luma-muted" />}
                    </button>
                </div>
            </div>

            {/* Row 2: Message (only for non-live) or Meta info (for live) */}
            {isFullView ? (
                <div className="card-meta-row">
                    {/* Brand Icon */}
                    {result.binData?.scheme && (
                        <span className="brand-icon-wrapper" title={result.binData.scheme}>
                            {renderBrandIcon(result.binData.scheme)}
                        </span>
                    )}
                    {/* Type */}
                    {result.binData?.type && (
                        <span className={getTypePillClass(result.binData.type)}>
                            {result.binData.type}
                        </span>
                    )}
                    {/* Category */}
                    {result.binData?.category && (
                        <span className={getCategoryPillClass(result.binData.category)} title={result.binData.category}>
                            {toTitleCase(result.binData.category)}
                        </span>
                    )}
                    {/* Risk */}
                    {result.riskLevel && result.riskLevel !== 'unknown' && (
                        <span className={getRiskIconClass(result.riskLevel)} title={`Risk: ${result.riskLevel}`}>
                            <ShieldAlert size={10} />
                            {result.riskLevel}
                        </span>
                    )}
                    {/* AVS */}
                    {result.avsCheck && result.avsCheck !== 'unknown' && (
                        <span className={getCheckIconClass(result.avsCheck)} title={`AVS: ${result.avsCheck}`}>
                            {result.avsCheck === 'pass' || result.avsCheck === 'match' ? <ShieldCheck size={10} /> : <ShieldX size={10} />}
                            AVS
                        </span>
                    )}
                    {/* CVC */}
                    {result.cvcCheck && result.cvcCheck !== 'unknown' && (
                        <span className={getCheckIconClass(result.cvcCheck)} title={`CVC: ${result.cvcCheck}`}>
                            {result.cvcCheck === 'pass' || result.cvcCheck === 'match' ? <ShieldCheck size={10} /> : <ShieldX size={10} />}
                            CVC
                        </span>
                    )}
                    {/* Country Flag */}
                    {result.binData?.countryEmoji && (
                        <span className="country-flag" title={result.binData.country}>
                            {result.binData.countryEmoji}
                        </span>
                    )}
                    {/* Bank (truncated) */}
                    {result.binData?.bank && (
                        <span className="bank-name" title={result.binData.bank}>
                            <Building2 size={10} />
                            {toTitleCase(result.binData.bank)}
                        </span>
                    )}
                </div>
            ) : (
                message && (
                    <p className={`card-message-inline ${result.status === 'DIE' ? 'card-message-die' : 'card-message-error'}`} title={message}>
                        {message.length > 80 ? message.substring(0, 80) + '...' : message}
                    </p>
                )
            )}
        </ResultCard>
    );
});

/**
 * CardsEmptyState - Empty state with warm Luma theme colors
 * Uses centralized .empty-state classes for consistent styling
 */
function CardsEmptyState() {
    return (
        <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="empty-state-icon">
                <CreditCard size={28} className="text-luma-coral" />
            </div>
            <p className="empty-state-title">No cards validated yet</p>
            <p className="empty-state-subtitle">Enter cards in the left panel to start</p>
        </motion.div>
    );
}
