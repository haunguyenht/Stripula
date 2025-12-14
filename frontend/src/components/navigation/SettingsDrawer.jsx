import { X, Zap, Settings, Key, Globe, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input, RangeSlider } from '../ui/Input';

/**
 * SettingsDrawer - Slide-over/Modal settings panel
 * Used on tablet and mobile screens
 * Glassmorphic theme 2025-2026
 */
export function SettingsDrawer({
    isOpen,
    onClose,
    skKey,
    setSkKey,
    pkKey,
    setPkKey,
    proxy,
    setProxy,
    concurrency,
    setConcurrency,
    validationMethod,
    setValidationMethod,
    selectedKeyIndex,
    keyResults,
    saveSettings,
    isMobile = false
}) {
    const handleSave = () => {
        saveSettings();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div 
                        className={cn(
                            "fixed z-50 flex flex-col glass-lg border-l border-white/10",
                            isMobile 
                                ? "inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] border-l-0 border-t border-white/10" 
                                : "right-0 top-0 bottom-0 w-96"
                        )}
                        initial={isMobile ? { y: '100%' } : { x: '100%' }}
                        animate={isMobile ? { y: 0 } : { x: 0 }}
                        exit={isMobile ? { y: '100%' } : { x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl glass-sm">
                                    <Settings size={18} className="text-primary" />
                                </div>
                                <span className="font-bold text-lg">Settings</span>
                            </div>
                            <motion.button 
                                onClick={onClose}
                                className="p-2 rounded-xl text-muted-foreground hover:text-foreground glass-sm glass-hover"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                            {/* SK Key */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                    <Key size={14} className="text-primary" />
                                    SK Key
                                </label>
                                <Input
                                    type="text"
                                    placeholder="sk_live_..."
                                    value={selectedKeyIndex >= 0 ? `Selected: ${keyResults[selectedKeyIndex]?.key}` : skKey}
                                    onChange={(e) => setSkKey(e.target.value)}
                                    disabled={selectedKeyIndex >= 0}
                                    className="text-xs"
                                />
                                {selectedKeyIndex >= 0 && (
                                    <p className="text-xs text-primary mt-2">Using selected key from results</p>
                                )}
                            </div>

                            {/* PK Key */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                    <Key size={14} className="text-accent" />
                                    PK Key
                                </label>
                                <Input
                                    type="text"
                                    placeholder="pk_live_..."
                                    value={pkKey}
                                    onChange={(e) => setPkKey(e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            {/* Proxy */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                    <Globe size={14} className="text-secondary" />
                                    Proxy
                                </label>
                                <Input
                                    type="text"
                                    placeholder="host:port or user:pass@host:port"
                                    value={proxy}
                                    onChange={(e) => setProxy(e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            {/* Divider */}
                            <div className="config-divider" />

                            {/* Concurrency */}
                            <div>
                                <label className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                    <span className="flex items-center gap-2">
                                        <Gauge size={14} className="text-warning" />
                                        Concurrency
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-sm font-mono glass-sm text-foreground">
                                        {concurrency}
                                    </span>
                                </label>
                                <RangeSlider
                                    min="1"
                                    max="10"
                                    value={concurrency}
                                    onChange={(e) => setConcurrency(parseInt(e.target.value))}
                                />
                            </div>

                            {/* Validation Method */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                    <Zap size={14} className="text-success" />
                                    Validation Method
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'charge', label: 'Charge + Refund', desc: 'Most accurate' },
                                        { value: 'nocharge', label: 'No Charge', desc: 'Setup intent' },
                                        { value: 'setup', label: 'Checkout Session', desc: '3DS support' },
                                        { value: 'direct', label: 'Direct API', desc: 'Fast check' },
                                    ].map((method) => (
                                        <motion.button
                                            key={method.value}
                                            onClick={() => setValidationMethod(method.value)}
                                            className={cn(
                                                "radio-option w-full",
                                                validationMethod === method.value && "selected"
                                            )}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <div className="radio-circle" />
                                            <div className="radio-content">
                                                <div className="radio-title">{method.label}</div>
                                                <div className="radio-desc">{method.desc}</div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Button 
                                variant="primary"
                                className="w-full"
                                onClick={handleSave}
                            >
                                <Zap size={16} />
                                Save Settings
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
