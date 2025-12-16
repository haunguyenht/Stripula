import { useState } from 'react';
import { Key, Trash2, Copy, Check, CheckCircle2, XCircle, Mail, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../hooks/useToast';
import { useKeyFilters } from '../../../hooks/useKeyFilters';

// Layout
import { TwoPanelLayout } from '../../layout/TwoPanelLayout';

// Components
import { ResultsPanel, ResultItem, ProgressBar } from '../ResultsPanel';
import { Badge } from '../../ui/Badge';
import { ResultCard } from '../../ui/Card';
import { Button, IconButton } from '../../ui/Button';

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
    onKeySelect,
    isLoading,
    setIsLoading,
    setCurrentItem,
    abortRef,
    modeSwitcher,
    // Drawer state lifted from parent to persist across mode switches
    drawerOpen,
    onDrawerOpenChange,
}) {
    const [copiedKey, setCopiedKey] = useState(null);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [refreshingKeys, setRefreshingKeys] = useState(new Set());
    const pageSize = 20;
    const { success, error: toastError, info, warning } = useToast();

    // ══════════════════════════════════════════════════════════════════
    // HANDLERS
    // ══════════════════════════════════════════════════════════════════

    const clearResults = () => {
        setKeyResults([]);
        setKeyStats({ live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 });
        onKeySelect(-1);
        setPage(1);
    };

    const handleCheckKeys = async () => {
        const keyLines = skKeys.split('\n').filter(l => l.trim() && l.trim().startsWith('sk_'));
        if (keyLines.length === 0) {
            warning('Enter at least one SK key');
            return;
        }

        const existingKeys = new Set(keyResults.map(r => r.fullKey));
        const uniqueKeys = keyLines.map(l => l.trim()).filter(k => !existingKeys.has(k));

        if (uniqueKeys.length === 0) {
            info('All keys already checked');
            return;
        }

        setIsLoading(true);
        abortRef.current = false;
        setProgress({ current: 0, total: uniqueKeys.length });
        info(`Starting key validation for ${uniqueKeys.length} keys`);
        const newResults = [...keyResults];
        let { live = 0, livePlus = 0, liveZero = 0, liveNeg = 0, dead = 0, error = 0 } = keyStats;
        const processedKeys = new Set(); // Track processed keys to remove from input

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
                    processedKeys.add(key);
                } else if (data.status === 'DEAD') {
                    newResults.unshift({ key: `${key.slice(0, 12)}...${key.slice(-4)}`, fullKey: key, ...data });
                    dead++;
                    processedKeys.add(key);
                }
                setKeyResults([...newResults]);
                setKeyStats({ live, livePlus, liveZero, liveNeg, dead, error, total: newResults.length });
            } catch (err) {
                error++;
                setKeyStats({ live, livePlus, liveZero, liveNeg, dead, error, total: newResults.length });
                toastError(`Error checking key: ${err.message}`);
            }

            if (i < uniqueKeys.length - 1 && !abortRef.current) {
                await new Promise(r => setTimeout(r, 500));
            }
        }
        
        // Remove processed keys from input
        if (processedKeys.size > 0) {
            const remainingKeys = skKeys
                .split('\n')
                .filter(line => {
                    const trimmed = line.trim();
                    return trimmed && !processedKeys.has(trimmed);
                })
                .join('\n');
            setSkKeys(remainingKeys);
        }
        
        setIsLoading(false);
        setCurrentItem(null);
        
        // Show completion toast if not aborted
        if (!abortRef.current) {
            success(`Key validation complete: ${live} live, ${dead} dead`);
        }
    };

    const handleStop = () => {
        abortRef.current = true;
        setIsLoading(false);
        setCurrentItem(null);
        warning('Key validation stopped');
    };

    const handleCopyKey = (key, index) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(index);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleDeleteKey = (index) => {
        const deletedResult = keyResults[index];
        const updated = keyResults.filter((_, i) => i !== index);
        setKeyResults(updated);
        
        // Update stats based on deleted result
        if (deletedResult?.status) {
            setKeyStats(prev => {
                const newStats = { ...prev };
                if (deletedResult.status === 'LIVE+') { newStats.live = Math.max(0, newStats.live - 1); newStats.livePlus = Math.max(0, newStats.livePlus - 1); }
                else if (deletedResult.status === 'LIVE0') { newStats.live = Math.max(0, newStats.live - 1); newStats.liveZero = Math.max(0, newStats.liveZero - 1); }
                else if (deletedResult.status === 'LIVE-') { newStats.live = Math.max(0, newStats.live - 1); newStats.liveNeg = Math.max(0, newStats.liveNeg - 1); }
                else if (deletedResult.status?.startsWith('LIVE')) { newStats.live = Math.max(0, newStats.live - 1); }
                else if (deletedResult.status === 'DEAD') { newStats.dead = Math.max(0, newStats.dead - 1); }
                else if (deletedResult.status === 'ERROR') { newStats.error = Math.max(0, newStats.error - 1); }
                newStats.total = Math.max(0, newStats.live + newStats.dead + (newStats.error || 0));
                return newStats;
            });
        }
        
        if (selectedKeyIndex === index) onKeySelect(-1);
        else if (selectedKeyIndex > index) onKeySelect(selectedKeyIndex - 1);
    };

    const handleRefreshKey = async (index) => {
        const result = keyResults[index];
        if (!result?.fullKey) return;
        
        const oldStatus = result.status;
        setRefreshingKeys(prev => new Set([...prev, index]));
        try {
            const response = await fetch('/api/stripe-own/check-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skKey: result.fullKey })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const text = await response.text();
            if (!text) {
                throw new Error('Empty response from server');
            }
            
            const data = JSON.parse(text);
            
            if (data.status) {
                setKeyResults(prev => {
                    const updated = [...prev];
                    updated[index] = { 
                        key: `${result.fullKey.slice(0, 12)}...${result.fullKey.slice(-4)}`, 
                        fullKey: result.fullKey, 
                        ...data 
                    };
                    return updated;
                });
                
                // Update stats if status changed
                if (oldStatus !== data.status) {
                    setKeyStats(prev => {
                        const newStats = { ...prev };
                        // Decrement old status
                        if (oldStatus === 'LIVE+') { newStats.live--; newStats.livePlus--; }
                        else if (oldStatus === 'LIVE0') { newStats.live--; newStats.liveZero--; }
                        else if (oldStatus === 'LIVE-') { newStats.live--; newStats.liveNeg--; }
                        else if (oldStatus?.startsWith('LIVE')) { newStats.live--; }
                        else if (oldStatus === 'DEAD') { newStats.dead--; }
                        else if (oldStatus === 'ERROR') { newStats.error--; }
                        
                        // Increment new status
                        if (data.status === 'LIVE+') { newStats.live++; newStats.livePlus++; }
                        else if (data.status === 'LIVE0') { newStats.live++; newStats.liveZero++; }
                        else if (data.status === 'LIVE-') { newStats.live++; newStats.liveNeg++; }
                        else if (data.status?.startsWith('LIVE')) { newStats.live++; }
                        else if (data.status === 'DEAD') { newStats.dead++; }
                        else if (data.status === 'ERROR') { newStats.error++; }
                        
                        newStats.total = newStats.live + newStats.dead + (newStats.error || 0);
                        return newStats;
                    });
                }
                
                if (data.status?.startsWith('LIVE')) {
                    success(`Key refreshed: ${data.status}`);
                } else if (data.status === 'DEAD') {
                    warning(`Key is now DEAD`);
                } else {
                    info(`Key status: ${data.status}`);
                }
            }
        } catch (err) {
            console.error('Refresh failed:', err);
            toastError(`Refresh failed: ${err.message}`);
        }
        setRefreshingKeys(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
        });
    };

    const handleRefreshAll = async () => {
        if (keyResults.length === 0 || isLoading) return;
        
        setIsLoading(true);
        setProgress({ current: 0, total: keyResults.length });
        info(`Refreshing ${keyResults.length} keys concurrently`);
        
        // Mark all keys as refreshing
        const allIndices = keyResults.map((_, i) => i);
        setRefreshingKeys(new Set(allIndices));
        
        let completedCount = 0;
        
        // Create refresh promise for each key
        const refreshPromises = keyResults.map(async (result, index) => {
            if (!result?.fullKey) {
                completedCount++;
                setProgress({ current: completedCount, total: keyResults.length });
                return null;
            }
            
            try {
                const response = await fetch('/api/stripe-own/check-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ skKey: result.fullKey })
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const text = await response.text();
                if (!text) {
                    throw new Error('Empty response from server');
                }
                
                const data = JSON.parse(text);
                
                // Remove from refreshing set
                setRefreshingKeys(prev => {
                    const next = new Set(prev);
                    next.delete(index);
                    return next;
                });
                
                completedCount++;
                setProgress({ current: completedCount, total: keyResults.length });
                setCurrentItem(`Refreshed ${completedCount}/${keyResults.length}`);
                
                if (data.status) {
                    return { index, data, fullKey: result.fullKey };
                }
                return null;
            } catch (err) {
                console.error('Refresh failed:', err);
                // Remove from refreshing set on error
                setRefreshingKeys(prev => {
                    const next = new Set(prev);
                    next.delete(index);
                    return next;
                });
                completedCount++;
                setProgress({ current: completedCount, total: keyResults.length });
                return null;
            }
        });
        
        // Wait for all to complete
        const results = await Promise.all(refreshPromises);
        
        // Update all results at once and recalculate stats
        const updatedResults = [...keyResults];
        results.forEach(r => {
            if (r) {
                updatedResults[r.index] = {
                    key: `${r.fullKey.slice(0, 12)}...${r.fullKey.slice(-4)}`,
                    fullKey: r.fullKey,
                    ...r.data
                };
            }
        });
        
        setKeyResults(updatedResults);
        
        // Recalculate stats based on updated results
        const newStats = { live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0 };
        updatedResults.forEach(result => {
            if (result.status === 'LIVE+') { newStats.live++; newStats.livePlus++; }
            else if (result.status === 'LIVE0') { newStats.live++; newStats.liveZero++; }
            else if (result.status === 'LIVE-') { newStats.live++; newStats.liveNeg++; }
            else if (result.status?.startsWith('LIVE')) { newStats.live++; }
            else if (result.status === 'DEAD') { newStats.dead++; }
            else if (result.status === 'ERROR') { newStats.error++; }
        });
        newStats.total = newStats.live + newStats.dead + newStats.error;
        setKeyStats(newStats);
        
        setRefreshingKeys(new Set());
        setIsLoading(false);
        setCurrentItem(null);
        
        success(`Refresh complete: ${newStats.live} live, ${newStats.dead} dead`);
    };

    // ══════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ══════════════════════════════════════════════════════════════════

    const keyCount = skKeys.split('\n').filter(l => l.trim() && l.trim().startsWith('sk_')).length;

    const filteredResults = useKeyFilters(keyResults, filter);

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

    // Config panel content (without mode switcher) - used in drawer body
    const configContent = (
        <div className="panel-input-section">
            {/* Combined Input Container */}
            <div className={`input-container-unified border-luma-coral-15 hover:border-luma-coral-25 transition-opacity ${isLoading ? 'input-container-loading' : ''}`}>
                <textarea
                    className={`input-textarea h-20 md:h-24 ${isLoading ? 'input-textarea-disabled' : ''}`}
                    placeholder="Enter SK keys (one per line)&#10;sk_live_xxxxx"
                    value={skKeys}
                    onChange={(e) => setSkKeys(e.target.value)}
                    disabled={isLoading}
                />
                {/* Bottom toolbar inside input */}
                <div className="input-toolbar">
                    <div className="flex items-center gap-2">
                        {keyCount > 0 && (
                            <span className="count-badge">
                                {keyCount} keys
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
                            onClick={handleCheckKeys}
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
    );

    return (
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
                    title="Key Results"
                    stats={stats}
                    activeFilter={filter}
                    onFilterChange={(id) => { setFilter(id); setPage(1); }}
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onClear={clearResults}
                    onRefresh={keyResults.length > 0 ? handleRefreshAll : undefined}
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
                                isRefreshing={refreshingKeys.has(idx)}
                                onSelect={() => onKeySelect(idx)}
                                onCopy={() => handleCopyKey(result.fullKey, idx)}
                                onDelete={() => handleDeleteKey(idx)}
                                onRefresh={() => handleRefreshKey(idx)}
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
function KeyResultCard({ result, isSelected, isCopied, isRefreshing, onSelect, onCopy, onDelete, onRefresh }) {
    const [pkCopied, setPkCopied] = useState(false);

    const handleCopyPk = (e) => {
        e.stopPropagation();
        if (result.pkKey) {
            navigator.clipboard.writeText(result.pkKey);
            setPkCopied(true);
            setTimeout(() => setPkCopied(false), 2000);
        }
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
        <ResultCard
            status={result.status?.startsWith('LIVE') ? 'live' : 'die'}
            isSelected={isSelected}
            onClick={onSelect}
            className={isRefreshing ? 'opacity-60 pointer-events-none' : ''}
        >
            {/* Loading overlay when refreshing */}
            {isRefreshing && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-xl z-10">
                    <RefreshCw size={20} className="animate-spin text-luma-coral" />
                </div>
            )}
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    {/* Status + SK Key */}
                    <div className="flex items-center gap-2 mb-1.5">
                        {result.status?.startsWith('LIVE') ? (
                            <CheckCircle2 size={14} className="status-icon-live" />
                        ) : (
                            <XCircle size={14} className="status-icon-dead" />
                        )}
                        <Badge variant={getStatusVariant(result.status)} size="sm">
                            {result.status === 'LIVE0' ? 'LIVE $0' : result.status}
                        </Badge>
                        <span className="text-mono-key text-truncate">{result.key}</span>
                    </div>

                    {/* PK Key */}
                    {result.pkKey && (
                        <div className="flex items-center gap-1.5 mb-1">
                            <Key size={10} className="text-luma-coral shrink-0" />
                            <span className="text-mono-pk text-truncate">
                                {result.pkKey.slice(0, 15)}...{result.pkKey.slice(-4)}
                            </span>
                            <button 
                                onClick={handleCopyPk}
                                className="icon-btn-sm"
                            >
                                {pkCopied ? <Check size={9} className="text-status-success" /> : <Copy size={9} className="text-luma-coral" />}
                            </button>
                        </div>
                    )}

                    {/* Email + Country Row */}
                    <div className="flex items-center gap-3 text-meta">
                        {result.accountEmail && result.accountEmail !== 'N/A' && (
                            <span className="flex items-center gap-1">
                                <Mail size={10} className="text-gray-400" />
                                <span className="truncate max-w-[150px]">{result.accountEmail}</span>
                            </span>
                        )}
                        {result.countryName && (
                            <span className="flex items-center gap-1">
                                <span>{result.countryFlag}</span>
                                <span>{result.countryName}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-0.5 shrink-0">
                    <IconButton 
                        variant="ghost" 
                        onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                        disabled={isRefreshing}
                        title="Refresh"
                    >
                        <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-luma-coral' : ''} />
                    </IconButton>
                    <IconButton variant="ghost" onClick={(e) => { e.stopPropagation(); onCopy(); }} title="Copy SK">
                        {isCopied ? <Check size={11} className="text-status-success" /> : <Copy size={11} />}
                    </IconButton>
                    <IconButton variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">
                        <Trash2 size={11} />
                    </IconButton>
                </div>
            </div>
            
            {/* Capabilities + Balance Row */}
            <div className="capabilities-row">
                {/* Capabilities */}
                <div className="flex flex-wrap gap-1">
                    <span className={`capability-badge ${result.isChargeable ? 'capability-enabled' : 'capability-disabled'}`}>
                        {result.isChargeable ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                        Chargeable
                    </span>
                    <span className={`capability-badge ${result.chargesEnabled ? 'capability-blue' : 'capability-disabled'}`}>
                        {result.chargesEnabled ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                        Charges
                    </span>
                    <span className={`capability-badge ${result.payoutsEnabled ? 'capability-purple' : 'capability-disabled'}`}>
                        {result.payoutsEnabled ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                        Payouts
                    </span>
                    <span className={`capability-badge ${result.capabilities?.transfers ? 'capability-pink' : 'capability-disabled'}`}>
                        {result.capabilities?.transfers ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                        Transfers
                    </span>
                </div>

                {/* Balance + Currency */}
                <div className="flex items-center gap-2">
                    {result.currency && (
                        <span className="currency-badge">
                            {result.currency}
                        </span>
                    )}
                    {result.availableBalance !== undefined && (
                        <div className="flex items-baseline gap-1">
                            <span className="text-balance">
                                {result.currencySymbol || '$'}{(result.availableBalance / 100).toFixed(2)}
                            </span>
                            {result.pendingBalance > 0 && (
                                <span className="text-balance-pending">
                                    +{result.currencySymbol || '$'}{(result.pendingBalance / 100).toFixed(2)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ResultCard>
    );
}

/**
 * KeysEmptyState - Empty state with warm Luma theme colors
 */
function KeysEmptyState() {
    return (
        <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="empty-state-icon">
                <Key size={28} className="text-luma-coral" />
            </div>
            <p className="empty-state-title">No keys validated yet</p>
            <p className="empty-state-subtitle">Enter SK keys in the left panel to start</p>
        </motion.div>
    );
}
