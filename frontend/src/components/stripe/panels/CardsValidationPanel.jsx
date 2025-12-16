import { useState, useMemo } from 'react';
import { CreditCard, Trash2, Copy, Check, Zap, Key, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../hooks/useToast';

// Layout
import { TwoPanelLayout } from '../../layout/TwoPanelLayout';

// Components
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Badge } from '../../ui/Badge';
import { ResultCard } from '../../ui/Card';
import { Button, IconButton } from '../../ui/Button';
import { Input, RangeSlider } from '../../ui/Input';
import { cn } from '../../../lib/utils';

// Utils
import { parseProxy } from '../../../utils/proxy';

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
    currentItem,
    setCurrentItem,
    progress,
    setProgress,
    abortRef,
    abortControllerRef,
    modeSwitcher,
}) {
    const [copiedCard, setCopiedCard] = useState(null);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const { success, error: toastError, info, warning } = useToast();

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

    const handleSettingChange = (key, value) => {
        onSettingsChange?.({ ...settings, [key]: value });
    };

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
        const cardList = cards.trim();
        if (!cardList) {
            warning('Enter at least one card');
            return;
        }

        setIsLoading(true);
        abortRef.current = false;
        const totalCards = cardList.split('\n').filter(l => l.trim()).length;
        setProgress({ current: 0, total: totalCards });

        const methodLabels = { charge: 'Charge', nocharge: 'No Charge', setup: 'Setup', direct: 'Direct' };
        const methodLabel = methodLabels[settings.validationMethod] || 'Charge';
        setCurrentItem(`Starting ${methodLabel} validation...`);
        info(`Starting ${methodLabel} validation for ${totalCards} cards`);

        try {
            abortControllerRef.current = new AbortController();

            const proxyObj = parseProxy(settings.proxy);
            const response = await fetch('/api/stripe-own/validate-batch-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skKey: settings.skKey.trim(),
                    pkKey: settings.pkKey.trim(),
                    cardList,
                    concurrency: settings.concurrency,
                    proxy: proxyObj,
                    validationMethod: settings.validationMethod
                }),
                signal: abortControllerRef.current.signal
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let newResults = [...cardResults];
            let stats = { ...cardStats };

            while (true) {
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
                            approved: data.summary.live || 0,
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
                        const cardDisplay = typeof cardInfo === 'object'
                            ? `****${cardInfo.last4 || '****'}`
                            : cardInfo;
                        const fullCard = typeof cardInfo === 'object'
                            ? `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}`
                            : cardInfo;
                        newResults.unshift({
                            ...r,
                            card: cardDisplay,
                            fullCard: fullCard
                        });
                        setCardResults([...newResults]);
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

    const handleCopyCard = (card, index) => {
        navigator.clipboard.writeText(card);
        setCopiedCard(index);
        setTimeout(() => setCopiedCard(null), 2000);
    };

    // ══════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ══════════════════════════════════════════════════════════════════

    const cardCount = cards.split('\n').filter(l => l.trim()).length;

    const filteredResults = cardResults.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'live') return r.status === 'LIVE' || r.status === 'APPROVED';
        if (filter === 'die') return r.status === 'DIE';
        if (filter === 'error') return r.status === 'ERROR' || r.status === 'RETRY';
        return true;
    });

    const totalPages = Math.ceil(filteredResults.length / pageSize);
    const paginatedResults = filteredResults.slice((page - 1) * pageSize, page * pageSize);

    const stats = [
        { id: 'all', label: 'All', value: cardStats.total, color: 'default' },
        { id: 'live', label: 'Live', value: cardStats.live, color: 'emerald', showDot: true },
        { id: 'die', label: 'Die', value: cardStats.die, color: 'rose', showDot: true },
        { id: 'error', label: 'Error', value: cardStats.error, color: 'amber', showDot: true },
    ];

    const methodLabels = {
        charge: 'Charge + Refund',
        nocharge: 'No Charge',
        setup: 'Checkout Session',
        direct: 'Direct API'
    };

    // ══════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════

    return (
        <TwoPanelLayout
            configPanel={
                <div className="flex flex-col h-full">
                    {/* Card Header with Mode Switcher */}
                    {modeSwitcher && (
                        <div className="panel-header">
                            {modeSwitcher}
                        </div>
                    )}

                    {/* Input Section with embedded buttons */}
                    <div className="p-3 md:p-4 space-y-3 bg-white dark:bg-luma-surface">
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
                                    <Key size={10} className="text-white" />
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
                                    {liveKeys.map((key, idx) => {
                                        const originalIdx = keyResults.indexOf(key);
                                        return (
                                            <option key={originalIdx} value={originalIdx}>
                                                {key.status} • {key.key} {key.accountEmail && key.accountEmail !== 'N/A' ? `• ${key.accountEmail}` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                                <Input
                                    placeholder="sk_live_..."
                                    value={settings?.skKey || ''}
                                    onChange={(e) => handleSettingChange('skKey', e.target.value)}
                                    disabled={isLoading || !isManualInput}
                                    className={cn(
                                        "text-[10px] h-7 md:h-8 border-luma-coral-15 focus:border-luma-coral-40",
                                        !isManualInput && "opacity-60 bg-gray-100 dark:bg-gray-800"
                                    )}
                                />
                                <Input
                                    placeholder="pk_live_..."
                                    value={settings?.pkKey || ''}
                                    onChange={(e) => handleSettingChange('pkKey', e.target.value)}
                                    disabled={isLoading || !isManualInput}
                                    className={cn(
                                        "text-[10px] h-7 md:h-8 border-luma-coral-15 focus:border-luma-coral-40",
                                        !isManualInput && "opacity-60 bg-gray-100 dark:bg-gray-800"
                                    )}
                                />
                            </div>
                            <Input
                                placeholder="Proxy (optional)"
                                value={settings?.proxy || ''}
                                onChange={(e) => handleSettingChange('proxy', e.target.value)}
                                disabled={isLoading}
                                className="text-[10px] h-7 md:h-8 border-[#E8836B]/15 focus:border-[#E8836B]/40"
                            />
                        </div>

                        {/* Validation Options */}
                        <div className="settings-card settings-card-inner border-luma-coral-10">
                            <div className="settings-header mb-2">
                                <div className="settings-header-icon settings-header-icon-rose">
                                    <Zap size={10} className="text-white" />
                                </div>
                                Method
                            </div>
                            
                            {/* Method pills - 2x2 grid */}
                            <div className="grid grid-cols-2 gap-1.5 mb-2">
                                {[
                                    { value: 'charge', label: 'Charge' },
                                    { value: 'nocharge', label: 'No Charge' },
                                    { value: 'setup', label: 'Checkout' },
                                    { value: 'direct', label: 'Direct' },
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
                </div>
            }
            resultsPanel={
                <ResultsPanel
                    title="Card Results"
                    subtitle={methodLabels[settings?.validationMethod] || 'Charge + Refund'}
                    stats={stats}
                    activeFilter={filter}
                    onFilterChange={(id) => { setFilter(id); setPage(1); }}
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onClear={clearResults}
                    isLoading={isLoading}
                    isEmpty={paginatedResults.length === 0}
                    emptyState={<CardsEmptyState />}
                >
                    {paginatedResults.map((result, idx) => (
                        <ResultItem key={`${result.card}-${idx}`} id={`${result.card}-${idx}`}>
                            <CardResultCard
                                result={result}
                                index={idx}
                                isCopied={copiedCard === idx}
                                onCopy={() => handleCopyCard(result.fullCard || result.card, idx)}
                            />
                        </ResultItem>
                    ))}
                </ResultsPanel>
            }
        />
    );
}

/**
 * CardResultCard - Individual card result card with warm theme styling
 * Uses centralized CSS classes for status indicators and text styling
 */
function CardResultCard({ result, isCopied, onCopy }) {
    const getStatusVariant = (status) => {
        if (status === 'APPROVED') return 'approved';
        if (status === 'LIVE') return 'live';
        if (status === 'DIE') return 'die';
        if (status === 'ERROR') return 'error';
        if (status === 'RETRY') return 'retry';
        return 'default';
    };

    const getResultStatus = (status) => {
        if (status === 'APPROVED' || status === 'LIVE') return 'live';
        if (status === 'DIE') return 'die';
        return 'error';
    };

    return (
        <ResultCard status={getResultStatus(result.status)}>
            <div className="flex items-center justify-between mb-2">
                <Badge variant={getStatusVariant(result.status)} size="sm">
                    {result.status}
                </Badge>
                <IconButton variant="ghost" onClick={onCopy} className="hover:bg-[#FEF3C7] dark:hover:bg-luma-coral-10">
                    {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-luma-muted" />}
                </IconButton>
            </div>
            <p className="text-mono-sm text-[13px] dark:text-gray-200">{result.card}</p>
            {result.message && (
                <p className="text-meta mt-1 line-clamp-2">{result.message}</p>
            )}
            {result.binData && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-luma-coral-10">
                    <span className="bin-scheme-badge">
                        {result.binData.scheme}
                    </span>
                    <span className="bin-type-badge">
                        {result.binData.type}
                    </span>
                    <span className="text-mono-sm text-luma-coral truncate">
                        {result.binData.bank}
                    </span>
                </div>
            )}
        </ResultCard>
    );
}

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
