import { Settings, Zap, Key, Globe, Gauge, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input, Select, RangeSlider } from '../ui/Input';

/**
 * Settings Sidebar Component
 * Premium Glass theme 2025
 */
export function SettingsSidebar({
    activeTab,
    setActiveTab,
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
    saveSettings
}) {
    return (
        <motion.div 
            className="w-72 flex flex-col my-3 mr-3 z-20"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-[rgba(12,12,20,0.9)] border border-white/[0.04]">
                {/* Header */}
                <div className="h-14 flex items-center px-5 border-b border-white/[0.04]">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/15 mr-3">
                        <Settings size={14} className="text-indigo-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">Settings</span>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    {/* SK Key */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                            <Key size={12} className="text-indigo-400" />
                            SK Key
                        </label>
                        <Input
                            type="text"
                            placeholder="sk_live_..."
                            value={selectedKeyIndex >= 0 ? `Selected: ${keyResults[selectedKeyIndex]?.key}` : skKey}
                            onChange={(e) => setSkKey(e.target.value)}
                            disabled={selectedKeyIndex >= 0}
                            className="text-[12px] h-11"
                        />
                        {selectedKeyIndex >= 0 && (
                            <p className="text-[10px] text-indigo-400/70 mt-1.5 font-medium">
                                Using selected key from results
                            </p>
                        )}
                    </div>

                    {/* PK Key */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                            <Key size={12} className="text-purple-400" />
                            PK Key
                        </label>
                        <Input
                            type="text"
                            placeholder="pk_live_..."
                            value={pkKey}
                            onChange={(e) => setPkKey(e.target.value)}
                            className="text-[12px] h-11"
                        />
                    </div>

                    {/* Proxy */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                            <Globe size={12} className="text-cyan-400" />
                            Proxy
                        </label>
                        <Input
                            type="text"
                            placeholder="host:port or user:pass@host:port"
                            value={proxy}
                            onChange={(e) => setProxy(e.target.value)}
                            className="text-[12px] h-11"
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent my-2" />

                    {/* Concurrency */}
                    <div className="space-y-3">
                        <label className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-wider">
                            <span className="flex items-center gap-2">
                                <Gauge size={12} className="text-amber-400" />
                                Threads
                            </span>
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono text-white/90 bg-white/[0.06] border border-white/[0.08]">
                                {concurrency}
                            </span>
                        </label>
                        <RangeSlider
                            min="1"
                            max="10"
                            value={concurrency}
                            onChange={(e) => setConcurrency(parseInt(e.target.value))}
                        />
                        <div className="flex justify-between text-[10px] text-white/25 px-1">
                            <span>Slow</span>
                            <span>Fast</span>
                        </div>
                    </div>

                    {/* Validation Method */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                            <Zap size={12} className="text-emerald-400" />
                            Method
                        </label>
                        <Select
                            value={validationMethod}
                            onChange={(e) => setValidationMethod(e.target.value)}
                            className="text-[12px] h-11"
                        >
                            <option value="charge">Charge + Refund</option>
                            <option value="nocharge">No Charge</option>
                            <option value="setup">Checkout Session</option>
                            <option value="direct">Direct API</option>
                        </Select>
                        
                        {/* Description */}
                        <motion.div 
                            className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                            key={validationMethod}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-[10px] text-white/35 leading-relaxed">
                                {validationMethod === 'charge' && 'Charges $0.50-$50, refunds. Full Radar data.'}
                                {validationMethod === 'nocharge' && 'SetupIntent only. Validates CVC.'}
                                {validationMethod === 'setup' && 'Browser automation. Supports 3DS.'}
                                {validationMethod === 'direct' && 'Direct API. Fastest method.'}
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="p-5 border-t border-white/[0.04]">
                    <Button
                        variant="primary"
                        className="w-full h-11 text-sm font-semibold"
                        onClick={saveSettings}
                    >
                        <Check size={16} />
                        Save Configuration
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
