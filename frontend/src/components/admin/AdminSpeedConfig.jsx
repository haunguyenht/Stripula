import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Clock, 
  Loader2, 
  RefreshCw,
  Check,
  AlertCircle,
  Settings2,
  Shield,
  Award,
  Crown,
  Gem,
  User,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useSpeedConfigMatrix } from '@/hooks/useSpeedConfigMatrix';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useToast } from '@/hooks/useToast';

const TIER_CONFIG = {
  free: { icon: User, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Free' },
  bronze: { icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Bronze' },
  silver: { icon: Award, color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'Silver' },
  gold: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Gold' },
  diamond: { icon: Gem, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Diamond' }
};

function TierRow({ gateway, tier, config, onUpdate, validateConfig, index }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ concurrency: config.concurrency, delay: config.delay });
  const [isSaving, setIsSaving] = useState(false);
  const { success, error: showError } = useToast();

  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const TierIcon = tierConfig.icon;

  const handleSave = useCallback(async () => {
    const validation = validateConfig(editValues);
    if (!validation.valid) {
      showError(validation.errors[0]);
      return;
    }
    setIsSaving(true);
    const result = await onUpdate(gateway, tier, {
      concurrency: parseInt(editValues.concurrency, 10),
      delay: parseInt(editValues.delay, 10)
    });
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
      success(`Updated ${tierConfig.label}`);
    } else {
      showError(result.error);
    }
  }, [gateway, tier, editValues, onUpdate, validateConfig, success, showError, tierConfig.label]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
        "hover:bg-[rgb(250,247,245)] dark:hover:bg-white/[0.03]",
        isEditing && "bg-[rgb(250,247,245)] dark:bg-white/[0.03]"
      )}
    >
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", tierConfig.bg)}>
        <TierIcon className={cn("h-3.5 w-3.5", tierConfig.color)} />
      </div>
      
      <span className={cn("w-16 text-xs font-medium shrink-0", tierConfig.color)}>
        {tierConfig.label}
      </span>

      {isEditing ? (
        <>
          <div className="flex items-center gap-1.5 flex-1">
            <Zap className="h-3 w-3 text-amber-500 shrink-0" />
            <Input
              type="number"
              min="1"
              max="50"
              value={editValues.concurrency}
              onChange={(e) => setEditValues(prev => ({ ...prev, concurrency: e.target.value }))}
              className="h-7 w-16 text-xs rounded-md px-2"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <Clock className="h-3 w-3 text-blue-500 shrink-0" />
            <Input
              type="number"
              min="100"
              max="10000"
              step="100"
              value={editValues.delay}
              onChange={(e) => setEditValues(prev => ({ ...prev, delay: e.target.value }))}
              className="h-7 w-20 text-xs rounded-md px-2"
            />
            <span className="text-[10px] text-muted-foreground">ms</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-emerald-500" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(false)}>
              <span className="text-xs text-muted-foreground">✕</span>
            </Button>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => { setEditValues({ concurrency: config.concurrency, delay: config.delay }); setIsEditing(true); }}
            className="flex items-center gap-4 flex-1 text-left hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">{config.concurrency}x</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-blue-500" />
              <span className="text-sm font-semibold text-foreground">{config.delay}ms</span>
            </div>
          </button>
          {config.isCustom && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">Custom</Badge>
          )}
        </>
      )}
    </motion.div>
  );
}

export function AdminSpeedConfig() {
  const { 
    gateways, 
    tiers, 
    configs,
    isLoading, 
    error,
    fetchMatrix,
    updateConfig,
    resetToDefaults,
    validateConfig
  } = useSpeedConfigMatrix();

  const [activeGateway, setActiveGateway] = useState('auth');
  const [isResetting, setIsResetting] = useState(false);
  const { success, error: showError } = useToast();
  const confirmation = useConfirmation();

  const handleResetAll = useCallback(async () => {
    const confirmed = await confirmation.confirm({
      title: 'Reset Speed Configs',
      description: 'Reset all configurations to defaults?',
      confirmText: 'Reset',
      destructive: true
    });
    if (!confirmed) return;
    setIsResetting(true);
    const result = await resetToDefaults();
    setIsResetting(false);
    if (result.success) success('Configs reset');
    else showError(result.error || 'Failed');
  }, [resetToDefaults, confirmation, success, showError]);

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-2xl p-8 flex items-center justify-center",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10"
      )}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "rounded-2xl p-6 text-center",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10"
      )}>
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchMatrix} className="rounded-lg">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm"
      )}>
        <div className="px-4 py-3 border-b border-[rgb(237,234,233)] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Speed Config</h3>
              <p className="text-[10px] text-muted-foreground">Concurrency & delay per tier</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchMatrix} disabled={isResetting}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={handleResetAll}
              disabled={isResetting}
            >
              {isResetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <div className="p-3">
          <Tabs value={activeGateway} onValueChange={setActiveGateway}>
            <TabsList className={cn(
              "inline-flex h-8 items-center rounded-lg p-0.5 gap-0.5 mb-3",
              "bg-[rgb(250,247,245)] dark:bg-white/5"
            )}>
              {gateways.map(gateway => (
                <TabsTrigger 
                  key={gateway} 
                  value={gateway}
                  className="px-3 py-1.5 rounded-md text-xs font-medium capitalize data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm"
                >
                  {gateway}
                </TabsTrigger>
              ))}
            </TabsList>

            {gateways.map(gateway => (
              <TabsContent key={gateway} value={gateway} className="m-0 space-y-1">
                {tiers.map((tier, index) => (
                  <TierRow
                    key={tier}
                    gateway={gateway}
                    tier={tier}
                    config={configs[gateway]?.[tier] || { concurrency: 1, delay: 2000 }}
                    onUpdate={updateConfig}
                    validateConfig={validateConfig}
                    index={index}
                  />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        isLoading={confirmation.isLoading}
        {...confirmation.config}
      />
    </>
  );
}

export default AdminSpeedConfig;
