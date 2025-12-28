import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Clock, 
  Loader2, 
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
 * 
 * Requirements: 1.1, 1.2, 1.6, 8.5
 */

const TIER_LABELS = {
  free: 'Free',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond'
};

const GATEWAY_LABELS = {
  auth: 'Auth Gateway',
  charge: 'Charge Gateway'
};

/**
 * SpeedConfigRow - Inline editable row for a tier's speed config
 */
function SpeedConfigRow({ gateway, tier, config, onUpdate, validateConfig }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    concurrency: config.concurrency,
    delay: config.delay
  });
  const [errors, setErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error: showError } = useToast();

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
    // Validate before saving
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
      success(`Updated ${TIER_LABELS[tier]} speed config`);
    } else {
      setErrors([result.error]);
      showError(result.error);
    }
  }, [gateway, tier, editValues, onUpdate, validateConfig, success, showError]);

  const handleInputChange = useCallback((field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
    // Clear errors on input change
    if (errors.length > 0) {
      const validation = validateConfig({ ...editValues, [field]: value });
      setErrors(validation.errors);
    }
  }, [editValues, errors.length, validateConfig]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "border-b border-border/50 last:border-0",
        "hover:bg-muted/30 transition-colors"
      )}
    >
      {/* Tier Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{TIER_LABELS[tier]}</span>
          {config.isCustom && (
            <Badge variant="secondary" className="text-xs">Custom</Badge>
          )}
        </div>
      </td>

      {/* Concurrency */}
      <td className="py-3 px-4">
        {isEditing ? (
          <Input
            type="number"
            min="1"
            max="50"
            value={editValues.concurrency}
            onChange={(e) => handleInputChange('concurrency', e.target.value)}
            className="w-20 h-8 text-sm"
          />
        ) : (
          <div className="flex items-center gap-1.5 text-sm">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>{config.concurrency}x</span>
          </div>
        )}
      </td>

      {/* Delay */}
      <td className="py-3 px-4">
        {isEditing ? (
          <Input
            type="number"
            min="100"
            max="10000"
            step="100"
            value={editValues.delay}
            onChange={(e) => handleInputChange('delay', e.target.value)}
            className="w-24 h-8 text-sm"
          />
        ) : (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span>{config.delay}ms</span>
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
        </div>
      </td>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <td colSpan={4} className="py-0 px-4">
          <div className="flex items-center gap-1.5 text-xs text-red-500 pb-2">
            <AlertCircle className="h-3 w-3" />
            {errors[0]}
          </div>
        </td>
      )}
    </motion.tr>
  );
}

/**
 * GatewaySpeedTable - Table showing all tier configs for a gateway
 */
function GatewaySpeedTable({ gateway, configs, tiers, onUpdate, validateConfig }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tier
            </th>
            <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Concurrency
            </th>
            <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Delay
            </th>
            <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map(tier => (
            <SpeedConfigRow
              key={tier}
              gateway={gateway}
              tier={tier}
              config={configs[tier]}
              onUpdate={onUpdate}
              validateConfig={validateConfig}
            />
          ))}
        </tbody>
      </table>
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
   * Handle reset to defaults - Requirements 8.3, 8.4
   */
  const handleResetAll = useCallback(async () => {
    // Show confirmation dialog
    const confirmed = await confirmation.confirm({
      title: 'Reset All Speed Configurations',
      description: 'Are you sure you want to reset all speed configurations to defaults?',
      content: (
        <div className="space-y-3 py-2">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
              This will reset:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• All gateway speed configurations</li>
              <li>• Concurrency settings for all tiers</li>
              <li>• Delay settings for all tiers</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Custom configurations will be replaced with default values.
          </p>
        </div>
      ),
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
   * Handle reset single gateway - Requirements 8.3, 8.4
   */
  const handleResetGateway = useCallback(async (gatewayId) => {
    // Show confirmation dialog
    const confirmed = await confirmation.confirm({
      title: `Reset ${GATEWAY_LABELS[gatewayId]} Configuration`,
      description: `Reset speed configuration for ${GATEWAY_LABELS[gatewayId]} to defaults?`,
      content: (
        <div className="space-y-3 py-2">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-2">This will reset:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Concurrency settings for all tiers</li>
              <li>• Delay settings for all tiers</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Only {GATEWAY_LABELS[gatewayId]} configurations will be affected.
          </p>
        </div>
      ),
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
      <Card variant="elevated">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading speed configs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="elevated">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchMatrix}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-primary" />
              Gateway Speed Configuration
            </CardTitle>
            <CardDescription className="mt-1">
              Configure concurrency and delay per tier for each gateway
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchMatrix}
              disabled={isResetting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetAll}
              disabled={isResetting}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Reset All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeGateway} onValueChange={setActiveGateway}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            {gateways.map(gateway => (
              <TabsTrigger key={gateway} value={gateway} className="capitalize">
                {gateway}
              </TabsTrigger>
            ))}
          </TabsList>

          {gateways.map(gateway => (
            <TabsContent key={gateway} value={gateway}>
              <div className="space-y-4">
                <GatewaySpeedTable
                  gateway={gateway}
                  configs={configs[gateway] || {}}
                  tiers={tiers}
                  onUpdate={updateConfig}
                  validateConfig={validateConfig}
                />
                
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetGateway(gateway)}
                    disabled={isResetting}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Reset {GATEWAY_LABELS[gateway]} to defaults
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Help text */}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
          <h4 className="text-sm font-medium mb-2">Configuration Guide</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Concurrency</strong>: Number of cards processed simultaneously (1-50)</li>
            <li>• <strong>Delay</strong>: Time between card validations in milliseconds (100-10000)</li>
            <li>• Higher tiers should have higher concurrency and lower delay</li>
            <li>• Changes apply immediately to new validation batches</li>
          </ul>
        </div>
      </CardContent>

      {/* Confirmation Dialog for speed config reset - Requirements 8.3, 8.4 */}
      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        isLoading={confirmation.isLoading}
        {...confirmation.config}
      />
    </Card>
  );
}

export default AdminSpeedConfig;
