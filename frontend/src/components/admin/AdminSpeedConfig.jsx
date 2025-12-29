import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Clock, 
  Loader2, 
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Settings2,
  Shield,
  Award,
  Crown,
  Gem,
  User,
  Edit2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info
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
import { spring } from '@/lib/motion';

/**
 * AdminSpeedConfig Component
 * Admin panel for configuring speed limits per gateway and tier
 * Redesigned with card-based tier display and visual indicators
 * 
 * Requirements: 1.1, 1.2, 1.6, 8.5
 */

const TIER_CONFIG = {
  free: { icon: User, color: 'slate', label: 'Free', gradient: 'from-slate-500 to-slate-600' },
  bronze: { icon: Shield, color: 'amber', label: 'Bronze', gradient: 'from-amber-500 to-amber-600' },
  silver: { icon: Award, color: 'slate', label: 'Silver', gradient: 'from-slate-400 to-slate-500' },
  gold: { icon: Crown, color: 'yellow', label: 'Gold', gradient: 'from-yellow-500 to-amber-500' },
  diamond: { icon: Gem, color: 'cyan', label: 'Diamond', gradient: 'from-cyan-400 to-blue-500' }
};

const GATEWAY_LABELS = {
  auth: 'Auth Gateway',
  charge: 'Charge Gateway'
};

/**
 * Speed Visual Indicator
 */
function SpeedIndicator({ concurrency, delay }) {
  // Calculate speed score (higher concurrency + lower delay = faster)
  const speedScore = Math.min(100, (concurrency * 10) + ((10000 - delay) / 100));
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[rgb(250,247,245)] dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${speedScore}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            "h-full rounded-full",
            speedScore > 70 ? "bg-emerald-500" :
            speedScore > 40 ? "bg-amber-500" :
            "bg-slate-400"
          )}
        />
      </div>
      <span className="text-[10px] text-muted-foreground w-8">
        {speedScore.toFixed(0)}%
      </span>
    </div>
  );
}

/**
 * TierSpeedCard - Card-based display for a tier's speed config
 */
function TierSpeedCard({ gateway, tier, config, onUpdate, validateConfig, index }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    concurrency: config.concurrency,
    delay: config.delay
  });
  const [errors, setErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error: showError } = useToast();

  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const TierIcon = tierConfig.icon;

  const handleEdit = useCallback(() => {
    setEditValues({
      concurrency: config.concurrency,
      delay: config.delay
    });
    setErrors([]);
    setIsEditing(true);
  }, [config]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setErrors([]);
  }, []);

  const handleSave = useCallback(async () => {
    const validation = validateConfig(editValues);
    if (!validation.valid) {
      setErrors(validation.errors);
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
      setErrors([]);
      success(`Updated ${tierConfig.label} speed config`);
    } else {
      setErrors([result.error]);
      showError(result.error);
    }
  }, [gateway, tier, editValues, onUpdate, validateConfig, success, showError, tierConfig.label]);

  const handleInputChange = useCallback((field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      const validation = validateConfig({ ...editValues, [field]: value });
      setErrors(validation.errors);
    }
  }, [editValues, errors.length, validateConfig]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ...spring.soft }}
      className={cn(
        "group relative rounded-xl overflow-hidden transition-all duration-200",
        "bg-white dark:bg-white/[0.02]",
        "border border-[rgb(237,234,233)] dark:border-white/5",
        "hover:border-[rgb(255,64,23)]/20 dark:hover:border-white/10",
        "hover:shadow-sm dark:hover:bg-white/[0.04]"
      )}
    >
      {/* Tier Header */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        "border-b border-[rgb(237,234,233)] dark:border-white/5",
        "bg-gradient-to-r",
        `${tierConfig.gradient}/5`
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center",
            `bg-${tierConfig.color}-500/10`
          )}>
            <TierIcon className={cn("h-4.5 w-4.5", `text-${tierConfig.color}-500`)} />
          </div>
          <div>
            <h4 className="font-semibold text-[rgb(37,27,24)] dark:text-white text-sm">
              {tierConfig.label}
            </h4>
            <SpeedIndicator concurrency={config.concurrency} delay={config.delay} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config.isCustom && (
            <Badge variant="secondary" className="text-[10px] h-5">Custom</Badge>
          )}
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleEdit}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Config Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Concurrency Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Concurrency
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={editValues.concurrency}
                  onChange={(e) => handleInputChange('concurrency', e.target.value)}
                  className="h-9 rounded-lg"
                />
              </div>

              {/* Delay Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  Delay (ms)
                </label>
                <Input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={editValues.delay}
                  onChange={(e) => handleInputChange('delay', e.target.value)}
                  className="h-9 rounded-lg"
                />
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors[0]}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 h-8 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 h-8 rounded-lg"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              {/* Concurrency Display */}
              <div className={cn(
                "p-3 rounded-lg",
                "bg-[rgb(250,247,245)] dark:bg-white/5",
                "border border-[rgb(237,234,233)] dark:border-white/10"
              )}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Concurrency</span>
                </div>
                <p className="text-lg font-bold text-[rgb(37,27,24)] dark:text-white">
                  {config.concurrency}x
                </p>
              </div>

              {/* Delay Display */}
              <div className={cn(
                "p-3 rounded-lg",
                "bg-[rgb(250,247,245)] dark:bg-white/5",
                "border border-[rgb(237,234,233)] dark:border-white/10"
              )}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Delay</span>
                </div>
                <p className="text-lg font-bold text-[rgb(37,27,24)] dark:text-white">
                  {config.delay}ms
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * GatewaySection - Section for a gateway's tier configs
 */
function GatewaySection({ gateway, configs, tiers, onUpdate, validateConfig, onReset, isResetting }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-[rgb(37,27,24)] dark:text-white hover:text-primary transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {GATEWAY_LABELS[gateway]}
          <Badge variant="secondary" className="text-[10px]">
            {tiers.length} tiers
          </Badge>
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReset(gateway)}
          disabled={isResetting}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      </div>

      {/* Tier Cards Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {tiers.map((tier, index) => (
              <TierSpeedCard
                key={tier}
                gateway={gateway}
                tier={tier}
                config={configs[tier] || { concurrency: 1, delay: 2000 }}
                onUpdate={onUpdate}
                validateConfig={validateConfig}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminSpeedConfig() {
  const { 
    matrix, 
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

  /**
   * Handle reset to defaults
   */
  const handleResetAll = useCallback(async () => {
    const confirmed = await confirmation.confirm({
      title: 'Reset All Speed Configurations',
      description: 'Are you sure you want to reset all speed configurations to defaults? This will affect all gateways and tiers.',
      confirmText: 'Reset All',
      cancelText: 'Cancel',
      destructive: true
    });

    if (!confirmed) return;

    setIsResetting(true);
    const result = await resetToDefaults();
    setIsResetting(false);

    if (result.success) {
      success('All speed configs reset to defaults');
    } else {
      showError(result.error || 'Failed to reset configs');
    }
  }, [resetToDefaults, confirmation, success, showError]);

  /**
   * Handle reset single gateway
   */
  const handleResetGateway = useCallback(async (gatewayId) => {
    const confirmed = await confirmation.confirm({
      title: `Reset ${GATEWAY_LABELS[gatewayId]}`,
      description: `Reset all tier speed configurations for ${GATEWAY_LABELS[gatewayId]} to defaults?`,
      confirmText: 'Reset',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setIsResetting(true);
    const result = await resetToDefaults(gatewayId);
    setIsResetting(false);

    if (result.success) {
      success(`${GATEWAY_LABELS[gatewayId]} configs reset to defaults`);
    } else {
      showError(result.error || 'Failed to reset configs');
    }
  }, [resetToDefaults, confirmation, success, showError]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading speed configs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchMatrix} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgb(237,234,233)] dark:border-white/10 bg-gradient-to-br from-[rgb(250,247,245)] to-transparent dark:from-white/[0.02] dark:to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(37,27,24)] dark:text-white">
                  Speed Configuration
                </h2>
                <p className="text-xs text-muted-foreground">Configure concurrency and delay per tier</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchMatrix}
                disabled={isResetting}
                className="rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetAll}
                disabled={isResetting}
                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-500/20"
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reset All
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeGateway} onValueChange={setActiveGateway}>
            <TabsList className={cn(
              "inline-flex h-10 items-center justify-start rounded-xl p-1 gap-1",
              "bg-[rgb(250,247,245)] dark:bg-white/5",
              "border border-[rgb(237,234,233)] dark:border-white/10",
              "mb-6"
            )}>
              {gateways.map(gateway => (
                <TabsTrigger 
                  key={gateway} 
                  value={gateway}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium capitalize",
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-white/10",
                    "data-[state=active]:shadow-sm"
                  )}
                >
                  {gateway}
                </TabsTrigger>
              ))}
            </TabsList>

            {gateways.map(gateway => (
              <TabsContent key={gateway} value={gateway} className="m-0">
                <GatewaySection
                  gateway={gateway}
                  configs={configs[gateway] || {}}
                  tiers={tiers}
                  onUpdate={updateConfig}
                  validateConfig={validateConfig}
                  onReset={handleResetGateway}
                  isResetting={isResetting}
                />
              </TabsContent>
            ))}
          </Tabs>

          {/* Help Info */}
          <div className={cn(
            "mt-6 p-4 rounded-xl",
            "bg-[rgb(250,247,245)] dark:bg-white/5",
            "border border-[rgb(237,234,233)] dark:border-white/10"
          )}>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-[rgb(37,27,24)] dark:text-white mb-2">
                  Configuration Guide
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>Concurrency</strong>: Number of cards processed simultaneously (1-50)</li>
                  <li>• <strong>Delay</strong>: Time between card validations in milliseconds (100-10000)</li>
                  <li>• Higher tiers should have higher concurrency and lower delay</li>
                  <li>• Changes apply immediately to new validation batches</li>
                </ul>
              </div>
            </div>
          </div>
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
