import { useState } from 'react';
import { Key, Trash2, Copy, Check, Loader2, Shield, Info, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Layout
import { TwoPanelLayout, ConfigSection, ConfigDivider } from '../../layout/TwoPanelLayout';

// Components
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Badge } from '../../ui/Badge';
import { ResultCard } from '../../ui/Card';
import { Button, IconButton } from '../../ui/Button';
import { Textarea, Input } from '../../ui/Input';
import { cn } from '../../../lib/utils';

/**
 * KeysValidationPanel - Two-panel layout for key validation
 * Left: Input + Settings + Info
 * Right: Stats + Results
 */
export function KeysValidationPanel({
    skKeys,
    setSkKeys,
    keyResults,
    setKeyResults,
    keyStats,
    setKeyStats,
    selectedKeyIndex,
    setSelectedKeyIndex,
    isLoading,
    setIsLoading,
    currentItem,
    setCurrentItem,
    abortRef,
    modeSwitcher,
}) {
    const [copiedKey, setCopiedKey] = useState(null);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const pageSize = 20;

    // ══════════════════════════════════════════════════════════════════
    // HANDLERS
    // ══════════════════════════════════════════════════════════════════

    const clearResults = () => {
        setKeyResults([]);
        setKeyStats({ live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 });
        setSelectedKeyIndex(-1);
        setPage(1);
    };

    const handleCheckKeys = async () => {
        const keyLines = skKeys.split('\n').filter(l => l.trim() && l.trim().startsWith('sk_'));
        if (keyLines.length === 0) {
            alert('Enter at least one SK key');
            return;
        }

        const existingKeys = new Set(keyResults.map(r => r.fullKey));
        const uniqueKeys = keyLines.map(l => l.trim()).filter(k => !existingKeys.has(k));

        if (uniqueKeys.length === 0) {
            alert('All keys already checked');
            return;
        }

        setIsLoading(true);
        abortRef.current = false;
        setProgress({ current: 0, total: uniqueKeys.length });
        const newResults = [...keyResults];
        let { live = 0, livePlus = 0, liveZero = 0, liveNeg = 0, dead = 0, error = 0 } = keyStats;

        for (let i = 0; i < uniqueKeys.length; i++) {
            if (abortRef.current) break;
            const key = uniqueKeys[i];
            setCurrentItem(`Checking key ${i + 1}/${uniqueKeys.length}`);
            setProgress({ current: i + 1, total: uniqueKeys.length });

            try {
                const response = await fetch('/api/stripe-own/check-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ skKey: key })
                });
                const data = await response.json();

                if (data.status?.startsWith('LIVE')) {
                    newResults.unshift({ key: `${key.slice(0, 12)}...${key.slice(-4)}`, fullKey: key, ...data });
                    if (data.status === 'LIVE+') { live++; livePlus++; }
                    else if (data.status === 'LIVE0') { live++; liveZero++; }
                    else if (data.status === 'LIVE-') { live++; liveNeg++; }
                    else { live++; }
                    setKeyResults([...newResults]);
                } else if (data.status === 'DEAD') {
                    dead++;
                }
                setKeyStats({ live, livePlus, liveZero, liveNeg, dead, error, total: live + dead + error });
            } catch (err) {
                error++;
                setKeyStats({ live, livePlus, liveZero, liveNeg, dead, error, total: live + dead + error });
            }

            if (i < uniqueKeys.length - 1 && !abortRef.current) {
                await new Promise(r => setTimeout(r, 500));
            }
        }
        setIsLoading(false);
        setCurrentItem(null);
    };

    const handleStop = () => {
        abortRef.current = true;
        setIsLoading(false);
        setCurrentItem(null);
    };

    const handleCopyKey = (key, index) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(index);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleDeleteKey = (index) => {
        const updated = keyResults.filter((_, i) => i !== index);
        setKeyResults(updated);
        if (selectedKeyIndex === index) setSelectedKeyIndex(-1);
        else if (selectedKeyIndex > index) setSelectedKeyIndex(selectedKeyIndex - 1);
    };

    // ══════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ══════════════════════════════════════════════════════════════════

    const keyCount = skKeys.split('\n').filter(l => l.trim() && l.trim().startsWith('sk_')).length;

    const filteredResults = keyResults.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'live') return r.status?.startsWith('LIVE');
        if (filter === 'dead') return r.status === 'DEAD';
        return true;
    });

    const totalPages = Math.ceil(filteredResults.length / pageSize);
    const paginatedResults = filteredResults.slice((page - 1) * pageSize, page * pageSize);

    const stats = [
        { id: 'all', label: 'All', value: keyStats.total, color: 'default' },
        { id: 'live', label: 'Live', value: keyStats.live, color: 'emerald', showDot: true },
        { id: 'dead', label: 'Dead', value: keyStats.dead, color: 'rose', showDot: true },
    ];

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

                    {/* Input Section - Compact on mobile */}
                    <div className="p-3 md:p-4 space-y-3 flex-1 flex flex-col">
                        <div className="relative">
                            <Textarea
                                className="w-full h-20 md:h-28 text-xs md:text-[13px]"
                                placeholder="Enter SK keys (one per line)&#10;sk_live_xxxxx"
                                value={skKeys}
                                onChange={(e) => setSkKeys(e.target.value)}
                                disabled={isLoading}
                            />
                            {keyCount > 0 && (
                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-orange-100 text-[9px] text-orange-600 font-mono">
                                    {keyCount}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons - Compact */}
                        <div className="flex gap-2">
                            {isLoading ? (
                                <Button variant="destructive" className="flex-1 h-9 text-xs" onClick={handleStop}>
                                    <span className="w-2.5 h-2.5 bg-current rounded-sm" />
                                    <span>Stop</span>
                                </Button>
                            ) : (
                                <Button variant="primary" className="flex-1 h-9 text-xs" onClick={handleCheckKeys}>
                                    <Shield size={14} />
                                    <span>Validate</span>
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

                        {/* Status Guide - Desktop only, at bottom */}
                        <div className="hidden md:block mt-auto pt-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 size={10} className="text-emerald-500" />
                                        <Badge variant="live_plus" size="xs">LIVE+</Badge>
                                        <Badge variant="live_zero" size="xs">LIVE0</Badge>
                                        <Badge variant="live_neg" size="xs">LIVE-</Badge>
                                    </div>
                                    <div className="w-px h-3 bg-gray-300" />
                                    <div className="flex items-center gap-1.5">
                                        <XCircle size={10} className="text-rose-500" />
                                        <Badge variant="dead" size="xs">DEAD</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
            resultsPanel={
                <ResultsPanel
                    title="Key Results"
                    stats={stats}
                    activeFilter={filter}
                    onFilterChange={(id) => { setFilter(id); setPage(1); }}
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onClear={clearResults}
                    isLoading={isLoading}
                    isEmpty={paginatedResults.length === 0}
                    emptyState={<KeysEmptyState />}
                >
                    {paginatedResults.map((result, idx) => (
                        <ResultItem key={`${result.fullKey}-${idx}`} id={`${result.fullKey}-${idx}`}>
                            <KeyResultCard
                                result={result}
                                index={idx}
                                isSelected={selectedKeyIndex === idx}
                                isCopied={copiedKey === idx}
                                onSelect={() => setSelectedKeyIndex(idx)}
                                onCopy={() => handleCopyKey(result.fullKey, idx)}
                                onDelete={() => handleDeleteKey(idx)}
                            />
                        </ResultItem>
                    ))}
                </ResultsPanel>
            }
        />
    );
}

/**
 * KeyResultCard - Individual key result card
 */
function KeyResultCard({ result, isSelected, isCopied, onSelect, onCopy, onDelete }) {
    const getStatusVariant = (status) => {
        if (status === 'LIVE+') return 'live_plus';
        if (status === 'LIVE0') return 'live_zero';
        if (status === 'LIVE-') return 'live_neg';
        if (status === 'LIVE') return 'live';
        if (status === 'DEAD') return 'dead';
        return 'default';
    };

    const formatCurrency = (amount, currency) => {
        const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$' };
        return `${symbols[currency?.toUpperCase()] || currency || '$'}${(amount / 100).toFixed(2)}`;
    };

    return (
        <ResultCard
            status={result.status?.startsWith('LIVE') ? 'live' : 'die'}
            className={isSelected ? 'ring-2 ring-orange-400/40 bg-orange-50' : ''}
            onClick={onSelect}
        >
            <div className="flex items-center justify-between mb-2">
                <Badge variant={getStatusVariant(result.status)} size="sm">
                    {result.status === 'LIVE0' ? 'LIVE $0' : result.status}
                </Badge>
                <div className="flex gap-1">
                    <IconButton variant="ghost" onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                        {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </IconButton>
                    <IconButton variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                        <Trash2 size={12} />
                    </IconButton>
                </div>
            </div>
            
            {/* Key */}
            <div className="flex items-center gap-2 mb-1">
                <Key size={12} className="text-gray-400" />
                <p className="text-[13px] font-mono text-gray-700">{result.key}</p>
            </div>
            
            {/* Email */}
            {result.accountEmail && (
                <div className="flex items-center gap-2 mb-1">
                    <Mail size={12} className="text-gray-400" />
                    <p className="text-[11px] text-gray-500">{result.accountEmail}</p>
                </div>
            )}
            
            {/* Balance */}
            {result.availableBalance !== undefined && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-orange-200/40">
                    <DollarSign size={14} className="text-emerald-500" />
                    <span className="text-lg font-bold font-mono text-emerald-600">
                        {formatCurrency(result.availableBalance, result.currency)}
                    </span>
                    <span className="text-[10px] text-gray-400">available</span>
                </div>
            )}
        </ResultCard>
    );
}

/**
 * KeysEmptyState
 */
function KeysEmptyState() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200/50 flex items-center justify-center mb-5">
                <Key size={28} className="text-orange-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">No keys validated yet</p>
            <p className="text-[11px] text-gray-400">Enter SK keys in the left panel to start</p>
        </motion.div>
    );
}
