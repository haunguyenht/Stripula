import { useState } from 'react';
import { CreditCard, Trash2, Copy, Check, Loader2, Zap, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Layout
import { TwoPanelLayout, ConfigSection, ConfigDivider } from '../../layout/TwoPanelLayout';

// Components
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Badge } from '../../ui/Badge';
import { ResultCard } from '../../ui/Card';
import { Button, IconButton } from '../../ui/Button';
import { Input, Textarea, Select, RangeSlider } from '../../ui/Input';
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
            alert('Enter an SK key');
            return;
        }
        if (!settings.pkKey?.trim() || !settings.pkKey.startsWith('pk_')) {
            alert('PK Key is required for card validation');
            return;
        }
        if (settings.validationMethod === 'charge' && !settings.proxy?.trim()) {
            alert('Proxy is required for charge validation');
            return;
        }
        const cardList = cards.trim();
        if (!cardList) {
            alert('Enter at least one card');
            return;
        }

        setIsLoading(true);
        abortRef.current = false;
        setProgress({ current: 0, total: cardList.split('\n').filter(l => l.trim()).length });

        const methodLabels = { charge: 'Charge', nocharge: 'No Charge', setup: 'Setup', direct: 'Direct' };
        setCurrentItem(`Starting ${methodLabels[settings.validationMethod] || 'Charge'} validation...`);

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
            }
        }

        setIsLoading(false);
        setCurrentItem(null);
        abortControllerRef.current = null;
    };

    const handleStop = async () => {
        abortRef.current = true;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        await fetch('/api/stripe-own/stop-batch', { method: 'POST' });
        setIsLoading(false);
        setCurrentItem('Stopped');
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
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Card Header with Mode Switcher */}
                    {modeSwitcher && (
                        <div className="px-3 py-2 md:px-4 md:py-3 border-b border-gray-100 bg-gray-50/50">
                            {modeSwitcher}
                        </div>
                    )}

                    {/* Input + Buttons - Compact */}
                    <div className="p-3 md:p-4 space-y-3">
                        <div className="relative">
                            <Textarea
                                className="w-full h-16 md:h-24 text-xs md:text-[13px]"
                                placeholder="Enter cards (one per line)&#10;4111111111111111|01|2025|123"
                                value={cards}
                                onChange={(e) => setCards(e.target.value)}
                                disabled={isLoading}
                            />
                            {cardCount > 0 && (
                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-orange-100 text-[9px] text-orange-600 font-mono">
                                    {cardCount}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {isLoading ? (
                                <Button variant="destructive" className="flex-1 h-9 text-xs" onClick={handleStop}>
                                    <span className="w-2.5 h-2.5 bg-current rounded-sm" />
                                    <span>Stop</span>
                                </Button>
                            ) : (
                                <Button variant="primary" className="flex-1 h-9 text-xs" onClick={handleCheckCards}>
                                    <CreditCard size={14} />
                                    <span>Check</span>
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="icon"
                                className="w-9 h-9"
                                onClick={clearResults}
                                disabled={isLoading}
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>

                        {/* Progress */}
                        <AnimatePresence>
                            {isLoading && progress.total > 0 && (
                                <ProgressBar current={progress.current} total={progress.total} />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Settings Section - Scrollable, compact */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 md:px-4 md:pb-4 space-y-2">
                        {/* API Keys */}
                        <div className="p-2 md:p-3 rounded-lg bg-gray-50/80 border border-gray-100 space-y-2">
                            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-500 uppercase">
                                <Key size={9} />
                                Keys
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <Input
                                    placeholder="sk_live_..."
                                    value={settings?.skKey || ''}
                                    onChange={(e) => handleSettingChange('skKey', e.target.value)}
                                    disabled={isLoading}
                                    className="text-[10px] h-7 md:h-8"
                                />
                                <Input
                                    placeholder="pk_live_..."
                                    value={settings?.pkKey || ''}
                                    onChange={(e) => handleSettingChange('pkKey', e.target.value)}
                                    disabled={isLoading}
                                    className="text-[10px] h-7 md:h-8"
                                />
                            </div>
                            <Input
                                placeholder="Proxy (optional)"
                                value={settings?.proxy || ''}
                                onChange={(e) => handleSettingChange('proxy', e.target.value)}
                                disabled={isLoading}
                                className="text-[10px] h-7 md:h-8"
                            />
                        </div>

                        {/* Validation Options */}
                        <div className="p-2 md:p-3 rounded-lg bg-gray-50/80 border border-gray-100">
                            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-500 uppercase mb-2">
                                <Zap size={9} />
                                Method
                            </div>
                            
                            {/* Method pills - 2x2 grid */}
                            <div className="grid grid-cols-2 gap-1 mb-2">
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
                                            "px-2 py-1.5 rounded-md text-[10px] font-medium transition-all border",
                                            settings?.validationMethod === method.value
                                                ? "bg-orange-50 border-orange-200 text-orange-700"
                                                : "bg-white border-gray-200 text-gray-600"
                                        )}
                                    >
                                        {method.label}
                                    </button>
                                ))}
                            </div>

                            {/* Concurrency */}
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50">
                                <span className="text-[9px] text-gray-500">Threads</span>
                                <div className="flex-1">
                                    <RangeSlider
                                        min="1"
                                        max="10"
                                        value={settings?.concurrency || 3}
                                        onChange={(e) => handleSettingChange('concurrency', parseInt(e.target.value))}
                                        disabled={isLoading}
                                    />
                                </div>
                                <span className="w-5 text-center text-[10px] font-mono text-gray-700">
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
 * CardResultCard - Individual card result card
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
                <IconButton variant="ghost" onClick={onCopy}>
                    {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </IconButton>
            </div>
            <p className="text-[13px] font-mono text-gray-700">{result.card}</p>
            {result.message && (
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{result.message}</p>
            )}
            {result.binData && (
                <p className="text-[10px] text-orange-500 mt-2">
                    {result.binData.scheme} {result.binData.type} • {result.binData.bank}
                </p>
            )}
        </ResultCard>
    );
}

/**
 * CardsEmptyState
 */
function CardsEmptyState() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/50 flex items-center justify-center mb-4">
                <CreditCard size={20} className="text-rose-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No results yet</p>
            <p className="text-[11px] text-gray-400 mt-1">Enter cards to start</p>
        </motion.div>
    );
}
