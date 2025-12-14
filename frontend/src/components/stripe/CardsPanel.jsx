import { useState } from 'react';
import { CreditCard, Trash2, Copy, ChevronLeft, ChevronRight, Check, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, StatusDot } from '../ui/Badge';
import { ResultCard } from '../ui/Card';
import { Button, IconButton } from '../ui/Button';
import { Textarea } from '../ui/Input';

/**
 * Cards Panel Component
 * Premium Glass theme 2025
 */
export function CardsPanel({
    cards,
    setCards,
    cardResults,
    setCardResults,
    cardStats,
    setCardStats,
    skKey,
    pkKey,
    proxy,
    concurrency,
    validationMethod,
    isLoading,
    setIsLoading,
    currentItem,
    setCurrentItem,
    progress,
    setProgress,
    abortRef,
    abortControllerRef
}) {
    const [cardFilter, setCardFilter] = useState('all');
    const [cardPage, setCardPage] = useState(1);
    const [cardPageSize] = useState(20);
    const [copiedCard, setCopiedCard] = useState(null);

    const clearCardResults = () => {
        setCardResults([]);
        setCardStats({ approved: 0, live: 0, die: 0, error: 0, total: 0 });
        setCardPage(1);
    };

    const handleCheckCards = async () => {
        if (!skKey?.trim()) {
            alert('Enter an SK key');
            return;
        }
        if (!pkKey?.trim() || !pkKey.startsWith('pk_')) {
            alert('PK Key is required for card validation');
            return;
        }
        if (validationMethod === 'charge' && !proxy?.trim()) {
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
        setCurrentItem(`Starting ${methodLabels[validationMethod] || 'Charge'} validation...`);

        try {
            abortControllerRef.current = new AbortController();

            const proxyObj = parseProxy(proxy);
            const response = await fetch('/api/stripe-own/validate-batch-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skKey: skKey.trim(),
                    pkKey: pkKey.trim(),
                    cardList,
                    concurrency,
                    proxy: proxyObj,
                    validationMethod
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
                    } else if (event === 'complete') {
                        console.log('Validation complete:', data);
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

    // Filter results
    const filteredResults = cardResults.filter(r => {
        if (cardFilter === 'all') return true;
        if (cardFilter === 'live') return r.status === 'LIVE' || r.status === 'APPROVED';
        if (cardFilter === 'die') return r.status === 'DIE';
        if (cardFilter === 'error') return r.status === 'ERROR' || r.status === 'RETRY';
        return true;
    });

    // Paginate
    const totalPages = Math.ceil(filteredResults.length / cardPageSize);
    const paginatedResults = filteredResults.slice((cardPage - 1) * cardPageSize, cardPage * cardPageSize);

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

    const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

    const filters = [
        { id: 'all', label: 'All', count: cardStats.total },
        { id: 'live', label: 'Live', count: cardStats.live },
        { id: 'die', label: 'Die', count: cardStats.die },
        { id: 'error', label: 'Error', count: cardStats.error },
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Input Section */}
            <div className="p-5 space-y-4">
                {/* Textarea */}
                <div className="relative">
                    <Textarea
                        className="w-full h-36 text-[13px]"
                        placeholder="Enter cards (one per line)&#10;4111111111111111|01|2025|123"
                        value={cards}
                        onChange={(e) => setCards(e.target.value)}
                        disabled={isLoading}
                    />
                    {cards && (
                        <div className="absolute bottom-3 right-3 text-[10px] text-white/20 font-mono">
                            {cards.split('\n').filter(l => l.trim()).length} cards
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
                            onClick={handleCheckCards}
                        >
                            <CreditCard size={14} />
                            <span>Check Cards</span>
                        </Button>
                    )}
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="w-10 h-10"
                        onClick={clearCardResults} 
                        disabled={isLoading}
                        title="Clear results"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
                
                {/* Progress */}
                <AnimatePresence>
                    {isLoading && progress.total > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                        >
                            {/* Progress Bar */}
                            <div className="h-1 rounded-full overflow-hidden bg-white/[0.04]">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                            
                            {/* Progress Text */}
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-white/30 font-mono">
                                    {progress.current} / {progress.total}
                                </span>
                                <span className="text-indigo-400 font-medium">
                                    {Math.round(progressPercent)}%
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 pb-4">
                <div className="flex gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    {filters.map(filter => (
                        <button
                            key={filter.id}
                            className={`
                                flex-1 px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-200
                                ${cardFilter === filter.id 
                                    ? 'text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/15 border border-indigo-500/20' 
                                    : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
                                }
                            `}
                            onClick={() => { setCardFilter(filter.id); setCardPage(1); }}
                        >
                            {filter.label}
                            <span className={`ml-1.5 ${cardFilter === filter.id ? 'text-white/60' : 'text-white/25'}`}>
                                {filter.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {paginatedResults.map((result, idx) => (
                        <motion.div
                            key={`${result.card}-${idx}`}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            layout
                        >
                            <ResultCard status={getResultStatus(result.status)}>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant={getStatusVariant(result.status)} size="sm" animated>
                                        {result.status}
                                    </Badge>
                                    <IconButton
                                        variant="ghost"
                                        onClick={() => handleCopyCard(result.fullCard || result.card, idx)}
                                        title="Copy card"
                                    >
                                        {copiedCard === idx 
                                            ? <Check size={12} className="text-emerald-400" /> 
                                            : <Copy size={12} />
                                        }
                                    </IconButton>
                                </div>
                                
                                {/* Card number */}
                                <p className="text-[13px] font-mono text-white/80 tracking-wide">
                                    {result.card}
                                </p>
                                
                                {/* Message */}
                                {result.message && (
                                    <p className="text-[11px] text-white/35 mt-1.5 line-clamp-2">
                                        {result.message}
                                    </p>
                                )}
                                
                                {/* BIN data */}
                                {result.binData && (
                                    <p className="text-[10px] text-indigo-400/70 mt-2 font-medium">
                                        {result.binData.scheme} {result.binData.type} • {result.binData.bank}
                                    </p>
                                )}
                                
                                {/* Risk pills */}
                                {(result.riskLevel || result.cvcCheck) && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {result.riskLevel && result.riskLevel !== 'unknown' && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                                result.riskLevel === 'normal' 
                                                    ? 'text-emerald-400/80 bg-emerald-500/10' 
                                                    : result.riskLevel === 'elevated' 
                                                        ? 'text-amber-400/80 bg-amber-500/10' 
                                                        : 'text-rose-400/80 bg-rose-500/10'
                                            }`}>
                                                {result.riskLevel}
                                            </span>
                                        )}
                                        {result.cvcCheck && result.cvcCheck !== 'unknown' && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                                result.cvcCheck === 'pass' 
                                                    ? 'text-emerald-400/80 bg-emerald-500/10' 
                                                    : 'text-rose-400/80 bg-rose-500/10'
                                            }`}>
                                                CVC {result.cvcCheck}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </ResultCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {/* Empty state */}
                {paginatedResults.length === 0 && !isLoading && (
                    <motion.div 
                        className="flex flex-col items-center justify-center py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mb-4">
                            <CreditCard size={20} className="text-white/15" />
                        </div>
                        <p className="text-sm font-medium text-white/30">No results yet</p>
                        <p className="text-[11px] text-white/15 mt-1">Enter cards above to start checking</p>
                    </motion.div>
                )}
                
                {/* Loading state */}
                {isLoading && paginatedResults.length === 0 && (
                    <motion.div 
                        className="flex flex-col items-center justify-center py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Loader2 size={24} className="text-indigo-400 animate-spin mb-4" />
                        <p className="text-sm font-medium text-white/40">Processing cards...</p>
                    </motion.div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 p-4 border-t border-white/[0.04]">
                    <IconButton
                        variant="glass"
                        onClick={() => setCardPage(p => Math.max(1, p - 1))}
                        disabled={cardPage === 1}
                        className={cardPage === 1 ? 'opacity-30' : ''}
                    >
                        <ChevronLeft size={14} />
                    </IconButton>
                    <span className="text-[11px] font-mono text-white/40 min-w-[60px] text-center">
                        {cardPage} / {totalPages}
                    </span>
                    <IconButton
                        variant="glass"
                        onClick={() => setCardPage(p => Math.min(totalPages, p + 1))}
                        disabled={cardPage === totalPages}
                        className={cardPage === totalPages ? 'opacity-30' : ''}
                    >
                        <ChevronRight size={14} />
                    </IconButton>
                </div>
            )}
        </div>
    );
}

// Helper to parse proxy string
function parseProxy(proxyStr) {
    if (!proxyStr?.trim()) return null;
    let line = proxyStr.trim();
    let type = 'http', host, port, username, password;

    const protocolMatch = line.match(/^(https?|socks[45]?):\/\//i);
    if (protocolMatch) {
        type = protocolMatch[1].toLowerCase();
        if (type === 'socks') type = 'socks5';
        line = line.substring(protocolMatch[0].length);
    }

    if (line.includes('@')) {
        const [auth, hostPort] = line.split('@');
        [username, password] = auth.split(':');
        [host, port] = hostPort.split(':');
    } else if (line.split(':').length === 4) {
        [host, port, username, password] = line.split(':');
    } else {
        [host, port] = line.split(':');
    }

    if (!host || !port) return null;
    return { type, host, port: parseInt(port), username, password };
}
