import { useState } from 'react';
import { Key, Trash2, Copy, Check, Loader2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, StatusDot } from '../ui/Badge';
import { ResultCard } from '../ui/Card';
import { Button, IconButton } from '../ui/Button';
import { Textarea } from '../ui/Input';

/**
 * Keys Panel Component
 * Premium Glass theme 2025
 */
export function KeysPanel({
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
    abortRef
}) {
    const [copiedKey, setCopiedKey] = useState(null);

    const clearKeyResults = () => {
        setKeyResults([]);
        setKeyStats({ live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 });
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
        const newResults = [...keyResults];
        let { live = 0, livePlus = 0, liveZero = 0, liveNeg = 0, dead = 0, error = 0 } = keyStats;

        for (let i = 0; i < uniqueKeys.length; i++) {
            if (abortRef.current) break;
            const key = uniqueKeys[i];
            setCurrentItem(`${i + 1}/${uniqueKeys.length}`);

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

    const formatCurrency = (amount, currency) => {
        const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$' };
        return `${symbols[currency?.toUpperCase()] || currency || '$'}${(amount / 100).toFixed(2)}`;
    };

    const getStatusVariant = (status) => {
        if (status === 'LIVE+') return 'live_plus';
        if (status === 'LIVE0') return 'live_zero';
        if (status === 'LIVE-') return 'live_neg';
        if (status === 'LIVE') return 'live';
        if (status === 'DEAD') return 'dead';
        return 'default';
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Input Section */}
            <div className="p-5 space-y-4">
                {/* Textarea */}
                <div className="relative">
                    <Textarea
                        className="w-full h-36 text-[13px]"
                        placeholder="Enter SK keys (one per line)&#10;sk_live_xxxxx&#10;sk_live_yyyyy"
                        value={skKeys}
                        onChange={(e) => setSkKeys(e.target.value)}
                        disabled={isLoading}
                    />
                    {skKeys && (
                        <div className="absolute bottom-3 right-3 text-[10px] text-white/20 font-mono">
                            {skKeys.split('\n').filter(l => l.trim() && l.trim().startsWith('sk_')).length} keys
                        </div>
                    )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                    {isLoading ? (
                        <Button 
                            variant="destructive" 
                            className="flex-1 h-10" 
                            onClick={handleStop}
                        >
                            <Square size={14} className="fill-current" />
                            <span>Stop</span>
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            className="flex-1 h-10"
                            onClick={handleCheckKeys}
                        >
                            <Key size={14} />
                            <span>Check Keys</span>
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="icon"
                        className="w-10 h-10"
                        onClick={clearKeyResults}
                        disabled={isLoading}
                        title="Clear results"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
                
                {/* Progress */}
                <AnimatePresence>
                    {currentItem && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-2 text-[11px] text-indigo-400"
                        >
                            <Loader2 size={12} className="animate-spin" />
                            <span className="font-mono">{currentItem}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Stats */}
            <div className="px-5 pb-4">
                <div className="grid grid-cols-4 gap-2.5">
                    <div className="p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-center hover:bg-emerald-500/10 transition-colors">
                        <div className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-1.5">Live</div>
                        <div className="text-xl font-bold font-mono text-emerald-400">{keyStats.live}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-center hover:bg-emerald-500/10 transition-colors">
                        <div className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-1.5">+Balance</div>
                        <div className="text-xl font-bold font-mono text-emerald-400">{keyStats.livePlus}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/15 text-center hover:bg-amber-500/10 transition-colors">
                        <div className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider mb-1.5">Zero Bal</div>
                        <div className="text-xl font-bold font-mono text-amber-400">{keyStats.liveZero}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-rose-500/8 border border-rose-500/15 text-center hover:bg-rose-500/10 transition-colors">
                        <div className="text-[10px] font-bold text-rose-400/70 uppercase tracking-wider mb-1.5">Dead</div>
                        <div className="text-xl font-bold font-mono text-rose-400">{keyStats.dead}</div>
                    </div>
                </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {keyResults.map((result, idx) => (
                        <motion.div
                            key={`${result.fullKey}-${idx}`}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            layout
                        >
                            <ResultCard
                                status={result.status?.startsWith('LIVE') ? 'live' : 'die'}
                                className={selectedKeyIndex === idx ? 'ring-2 ring-indigo-500/40 bg-indigo-500/5' : ''}
                                onClick={() => setSelectedKeyIndex(idx)}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <Badge variant={getStatusVariant(result.status)} size="sm" animated>
                                        {result.status === 'LIVE0' ? 'LIVE $0' : result.status}
                                    </Badge>
                                    <div className="flex gap-1">
                                        <IconButton
                                            variant="ghost"
                                            onClick={(e) => { e.stopPropagation(); handleCopyKey(result.fullKey, idx); }}
                                            title="Copy key"
                                        >
                                            {copiedKey === idx ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                        </IconButton>
                                        <IconButton
                                            variant="ghost"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteKey(idx); }}
                                            title="Delete"
                                        >
                                            <Trash2 size={12} />
                                        </IconButton>
                                    </div>
                                </div>
                                
                                {/* Key */}
                                <p className="text-[13px] font-mono text-white/90 font-semibold mb-2 break-all leading-relaxed">
                                    {result.key}
                                </p>
                                
                                {/* Account */}
                                {result.accountEmail && (
                                    <p className="text-[11px] text-white/40 mb-3 font-medium">{result.accountEmail}</p>
                                )}
                                
                                {/* Balance */}
                                {result.availableBalance !== undefined && (
                                    <div className="flex items-baseline gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                                        <span className="text-lg font-bold font-mono text-emerald-400">
                                            {formatCurrency(result.availableBalance, result.currency)}
                                        </span>
                                        <span className="text-[10px] uppercase font-semibold text-white/35 tracking-wider">
                                            Available
                                        </span>
                                    </div>
                                )}
                                
                                {/* Capabilities */}
                                {result.chargesEnabled !== undefined && (
                                    <div className="flex gap-2 mt-3">
                                        <span className={`text-[10px] px-2 py-1 rounded-md font-semibold border ${
                                            result.chargesEnabled 
                                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                        }`}>
                                            {result.chargesEnabled ? '✓' : '✗'} Charges
                                        </span>
                                        <span className={`text-[10px] px-2 py-1 rounded-md font-semibold border ${
                                            result.payoutsEnabled 
                                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                        }`}>
                                            {result.payoutsEnabled ? '✓' : '✗'} Payouts
                                        </span>
                                    </div>
                                )}
                            </ResultCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {/* Empty state */}
                {keyResults.length === 0 && !isLoading && (
                    <motion.div 
                        className="flex flex-col items-center justify-center py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mb-4">
                            <Key size={20} className="text-white/15" />
                        </div>
                        <p className="text-sm font-medium text-white/30">No keys checked</p>
                        <p className="text-[11px] text-white/15 mt-1">Enter SK keys above to start</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
