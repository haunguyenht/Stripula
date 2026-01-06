import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  Loader2, 
  Copy, 
  Check, 
  Coins, 
  Crown,
  Sparkles,
  Calendar,
  Hash,
  Users,
  AlertCircle,
  ClipboardList,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { spring } from '@/lib/motion';

/**
 * KeyGenerator Component
 * Form for generating redeemable keys
 * Redesigned with split layout, visual type selectors
 * 
 * Requirements: 3.1
 */

const API_BASE = '/api';

const KEY_TYPES = [
  { 
    value: 'credits', 
    label: 'Credits', 
    icon: Coins, 
    description: 'Add credits to user balance',
    color: 'amber'
  },
  { 
    value: 'tier', 
    label: 'Tier Upgrade', 
    icon: Crown, 
    description: 'Upgrade user tier level',
    color: 'purple'
  },
];

const TIER_OPTIONS = [
  { value: 'bronze', label: 'Bronze', color: 'amber' },
  { value: 'silver', label: 'Silver', color: 'slate' },
  { value: 'gold', label: 'Gold', color: 'yellow' },
  { value: 'diamond', label: 'Diamond', color: 'cyan' },
];

const CREDIT_PRESETS = [50, 100, 250, 500, 1000];

const DURATION_PRESETS = [
  { value: null, label: 'Lifetime', icon: '∞' },
  { value: 7, label: '7 days', icon: '7d' },
  { value: 30, label: '30 days', icon: '30d' },
  { value: 90, label: '90 days', icon: '90d' },
  { value: 180, label: '180 days', icon: '180d' },
  { value: 365, label: '1 year', icon: '1y' },
];

export function KeyGenerator({ onKeysGenerated }) {
  const [type, setType] = useState('credits');
  const [creditAmount, setCreditAmount] = useState('100');
  const [tierValue, setTierValue] = useState('bronze');
  const [durationDays, setDurationDays] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [maxUses, setMaxUses] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const { success, error } = useToast();

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/admin/keys/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          value: type === 'credits' ? parseInt(creditAmount, 10) : tierValue,
          quantity: parseInt(quantity, 10),
          maxUses: parseInt(maxUses, 10),
          expiresAt: expiresAt || null,
          durationDays: type === 'tier' ? durationDays : null,
          note: note.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        setGeneratedKeys(data.keys || []);
        success(`Generated ${data.keys?.length || 0} keys`);
        if (onKeysGenerated) onKeysGenerated();
      } else {
        error(data.message || 'Failed to generate keys');
      }
    } catch (err) {
      error('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [type, creditAmount, tierValue, durationDays, quantity, maxUses, expiresAt, note, success, error, onKeysGenerated]);

  const handleCopyKey = useCallback(async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      error('Failed to copy');
    }
  }, [error]);

  const handleCopyAll = useCallback(async () => {
    try {
      const allCodes = generatedKeys.map(k => k.code).join('\n');
      await navigator.clipboard.writeText(allCodes);
      success('All keys copied!');
    } catch (err) {
      error('Failed to copy');
    }
  }, [generatedKeys, success, error]);

  const handleReset = useCallback(() => {
    setGeneratedKeys([]);
    setNote('');
    setExpiresAt('');
  }, []);

  const selectedType = KEY_TYPES.find(t => t.value === type);

  return (
    <div className={cn(
      "rounded-2xl overflow-hidden",
      "bg-white dark:bg-[rgba(30,41,59,0.5)]",
      "border border-[rgb(237,234,233)] dark:border-white/10",
      "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
    )}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-[rgb(237,234,233)] dark:border-white/10 bg-gradient-to-br from-[rgb(250,247,245)] to-transparent dark:from-white/[0.02] dark:to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(37,27,24)] dark:text-white">
              Generate Keys
            </h2>
            <p className="text-xs text-muted-foreground">Create redeemable keys for credits or tier upgrades</p>
          </div>
        </div>
      </div>

      {/* Content - Split Layout */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[rgb(237,234,233)] dark:divide-white/10">
        {/* Left: Form */}
        <div className="p-6 space-y-6">
          {/* Type Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Key Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {KEY_TYPES.map((keyType) => {
                const Icon = keyType.icon;
                const isSelected = type === keyType.value;
                return (
                  <button
                    key={keyType.value}
                    onClick={() => setType(keyType.value)}
                    className={cn(
                      "relative p-4 rounded-xl text-left transition-all duration-200",
                      "border-2",
                      isSelected 
                        ? keyType.color === 'amber'
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-purple-500 bg-purple-500/10"
                        : "border-[rgb(237,234,233)] dark:border-white/10 hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center mb-3",
                      keyType.color === 'amber' 
                        ? "bg-amber-500/20" 
                        : "bg-purple-500/20"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        keyType.color === 'amber' 
                          ? "text-amber-600 dark:text-amber-400" 
                          : "text-purple-600 dark:text-purple-400"
                      )} />
                    </div>
                    <p className="font-semibold text-[rgb(37,27,24)] dark:text-white text-sm">{keyType.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{keyType.description}</p>
                    {isSelected && (
                      <motion.div
                        layoutId="selected-type"
                        className={cn(
                          "absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center",
                          keyType.color === 'amber' ? "bg-amber-500" : "bg-purple-500"
                        )}
                        transition={spring.soft}
                      >
                        <Check className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value Input */}
          <div className="space-y-3">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {type === 'credits' ? 'Credit Amount' : 'Target Tier'}
            </Label>
            
            {type === 'credits' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {CREDIT_PRESETS.map(preset => (
                    <button
                      key={preset}
                      onClick={() => setCreditAmount(String(preset))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        creditAmount === String(preset)
                          ? "bg-amber-500 text-white"
                          : "bg-[rgb(250,247,245)] dark:bg-white/5 hover:bg-amber-500/10 text-muted-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Custom amount"
                  min="1"
                  className="rounded-xl"
                />
              </div>
            ) : (
              <Select value={tierValue} onValueChange={setTierValue}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map(tier => (
                    <SelectItem key={tier.value} value={tier.value}>
                      <span className="capitalize">{tier.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Duration (Tier only) */}
          {type === 'tier' && (
            <div className="space-y-3">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Subscription Duration
              </Label>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map(preset => (
                  <button
                    key={preset.value ?? 'permanent'}
                    onClick={() => setDurationDays(preset.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      durationDays === preset.value
                        ? "bg-purple-500 text-white"
                        : "bg-[rgb(250,247,245)] dark:bg-white/5 hover:bg-purple-500/10 text-muted-foreground"
                    )}
                  >
                    {preset.icon}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={durationDays === null ? '' : durationDays}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === '0') {
                    setDurationDays(null);
                  } else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 1 && num <= 365) {
                      setDurationDays(num);
                    }
                  }
                }}
                placeholder="Custom days (1-365) or empty for lifetime"
                min="1"
                max="365"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                {durationDays === null 
                  ? 'Tier upgrade is lifetime (never expires)'
                  : `Tier will expire after ${durationDays} day${durationDays !== 1 ? 's' : ''}`}
              </p>
            </div>
          )}

          {/* Quantity & Max Uses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Quantity
              </Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max="100"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Max Uses
              </Label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Expiration Date (Optional)
            </Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="rounded-xl"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Note (Optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note for this batch..."
              maxLength={200}
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Keys
              </>
            )}
          </Button>
        </div>

        {/* Right: Generated Keys Preview */}
        <div className="p-6 bg-[rgb(250,247,245)] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Generated Keys
              </Label>
            </div>
            {generatedKeys.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                  className="h-8 rounded-lg text-xs"
                >
                  <Copy className="h-3 w-3 mr-1.5" />
                  Copy All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 rounded-lg text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {generatedKeys.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-white dark:bg-white/5 border border-[rgb(237,234,233)] dark:border-white/10 flex items-center justify-center mb-4">
                  <Key className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No keys generated yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Configure and click Generate
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2 max-h-[400px] overflow-y-auto pr-1"
              >
                {generatedKeys.map((key, index) => (
                  <motion.div
                    key={key.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl",
                      "bg-white dark:bg-white/5",
                      "border border-[rgb(237,234,233)] dark:border-white/10",
                      "hover:border-primary/30 transition-colors"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        type === 'credits' ? "bg-amber-500/10" : "bg-purple-500/10"
                      )}>
                        {type === 'credits' ? (
                          <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <code className="text-sm font-mono tracking-wider text-[rgb(37,27,24)] dark:text-white block truncate">
                          {key.code}
                        </code>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {type === 'credits' ? `${creditAmount} credits` : tierValue}
                          </Badge>
                          {type === 'tier' && durationDays && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              {durationDays}d
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-lg"
                      onClick={() => handleCopyKey(key.code, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                ))}

                {/* Summary */}
                <div className={cn(
                  "mt-4 p-3 rounded-xl",
                  "bg-emerald-500/10 border border-emerald-500/20"
                )}>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {generatedKeys.length} key{generatedKeys.length !== 1 ? 's' : ''} generated
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default KeyGenerator;
