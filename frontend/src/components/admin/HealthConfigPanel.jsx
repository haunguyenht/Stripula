import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  RefreshCw, 
  Settings2, 
  AlertTriangle, 
  CheckCircle2,
  Activity,
  Gauge,
  BarChart3,
  XCircle,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { spring } from '@/lib/motion';

/**
 * HealthConfigPanel Component
 * 
 * Admin panel for managing gateway health thresholds and resetting offline gateways.
 * Redesigned with better visual indicators and modern styling.
 * 
 * @param {Object} props
 * @param {Function} props.getHealthThresholds - Fetch current thresholds
 * @param {Function} props.updateHealthThresholds - Update thresholds
 * @param {Function} props.resetHealth - Reset a gateway's health
 * @param {Array} props.offlineGateways - List of offline gateways
 * @param {Function} props.onThresholdsUpdated - Callback when thresholds are updated
 */

/**
 * Threshold Visual Indicator
 */
function ThresholdIndicator({ value, max, color, label }) {
  const percentage = (value / max) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-[rgb(250,247,245)] dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

/**
 * Threshold Config Card
 */
function ThresholdCard({ icon: Icon, title, description, value, onChange, min, max, step = 1, color, index }) {
  const [sliderValue, setSliderValue] = useState(value);

  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  const handleSliderChange = (values) => {
    const newValue = values[0];
    setSliderValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      setSliderValue(newValue);
      onChange(newValue);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, ...spring.soft }}
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-white dark:bg-white/[0.02]",
        "border border-[rgb(237,234,233)] dark:border-white/5",
        "hover:border-[rgb(255,64,23)]/20 dark:hover:border-white/10",
        "transition-all duration-200"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center gap-3",
        "border-b border-[rgb(237,234,233)] dark:border-white/5",
        "bg-gradient-to-r from-transparent to-transparent",
        color === 'red' && "from-red-500/5",
        color === 'amber' && "from-amber-500/5",
        color === 'blue' && "from-blue-500/5"
      )}>
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center",
          color === 'red' && "bg-red-500/10",
          color === 'amber' && "bg-amber-500/10",
          color === 'blue' && "bg-blue-500/10"
        )}>
          <Icon className={cn(
            "h-4.5 w-4.5",
            color === 'red' && "text-red-500",
            color === 'amber' && "text-amber-500",
            color === 'blue' && "text-blue-500"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-[rgb(37,27,24)] dark:text-white">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Slider */}
        <Slider
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
        
        {/* Range Labels */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{min}</span>
          <span>{max}</span>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={min}
            max={max}
            value={sliderValue}
            onChange={handleInputChange}
            className="h-9 rounded-lg text-center"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {title.includes('%') ? '%' : title.includes('Window') ? 'requests' : 'failures'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Offline Gateway Card
 */
function OfflineGatewayCard({ gateway, onReset, isResetting }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-xl",
        "bg-red-500/5 border border-red-500/20",
        "hover:bg-red-500/10 transition-colors"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
          <XCircle className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-[rgb(37,27,24)] dark:text-white">
            {gateway.label || gateway.id}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">Offline</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onReset(gateway.id)}
        disabled={isResetting}
        className="h-8 rounded-lg border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400"
      >
        {isResetting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </>
        )}
      </Button>
    </motion.div>
  );
}

export function HealthConfigPanel({
  getHealthThresholds,
  updateHealthThresholds,
  resetHealth,
  offlineGateways = [],
  onThresholdsUpdated
}) {
  const [thresholds, setThresholds] = useState({
    DEGRADED_SUCCESS_RATE: 50,
    OFFLINE_CONSECUTIVE_FAILURES: 5,
    ROLLING_WINDOW_SIZE: 10
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resetLoading, setResetLoading] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalThresholds, setOriginalThresholds] = useState(null);

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = async () => {
    setIsLoading(true);
    try {
      const result = await getHealthThresholds();
      if (result.success) {
        setThresholds(result.thresholds);
        setOriginalThresholds(result.thresholds);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleThresholdChange = (key, value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setThresholds(prev => ({ ...prev, [key]: numValue }));
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateHealthThresholds(thresholds);
      if (result.success) {
        setOriginalThresholds(result.thresholds);
        setHasChanges(false);
        onThresholdsUpdated?.(result.thresholds);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalThresholds) {
      setThresholds(originalThresholds);
      setHasChanges(false);
    }
  };

  const handleResetGatewayHealth = async (gatewayId) => {
    setResetLoading(prev => ({ ...prev, [gatewayId]: true }));
    try {
      const result = await resetHealth(gatewayId);
      if (result.success) {
        onThresholdsUpdated?.();
      }
    } catch (err) {
      // Silent fail
    } finally {
      setResetLoading(prev => ({ ...prev, [gatewayId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "border border-[rgb(237,234,233)] dark:border-white/10",
        "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
      )}>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading health thresholds...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offline Gateways Alert */}
      <AnimatePresence>
        {offlineGateways.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "rounded-2xl overflow-hidden",
              "bg-white dark:bg-[rgba(30,41,59,0.5)]",
              "border border-red-200 dark:border-red-500/20",
              "dark:backdrop-blur-sm shadow-sm dark:shadow-none"
            )}
          >
            {/* Alert Header */}
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    Offline Gateways
                    <Badge variant="destructive" className="text-[10px]">
                      {offlineGateways.length}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    These gateways are offline due to consecutive failures
                  </p>
                </div>
              </div>
            </div>

            {/* Offline Gateway Cards */}
            <div className="p-4 space-y-2">
              <AnimatePresence mode="popLayout">
                {offlineGateways.map(gateway => (
                  <OfflineGatewayCard
                    key={gateway.id}
                    gateway={gateway}
                    onReset={handleResetGatewayHealth}
                    isResetting={resetLoading[gateway.id]}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Health Thresholds Config */}
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
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(37,27,24)] dark:text-white">
                  Health Thresholds
                </h2>
                <p className="text-xs text-muted-foreground">Configure gateway health monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges ? (
                <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10">
                  Unsaved changes
                </Badge>
              ) : (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Threshold Cards */}
        <div className="p-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <ThresholdCard
              icon={XCircle}
              title="Offline Threshold"
              description="Consecutive failures before offline"
              value={thresholds.OFFLINE_CONSECUTIVE_FAILURES}
              onChange={(v) => handleThresholdChange('OFFLINE_CONSECUTIVE_FAILURES', v)}
              min={1}
              max={50}
              color="red"
              index={0}
            />
            <ThresholdCard
              icon={Gauge}
              title="Degraded Rate %"
              description="Below this = degraded status"
              value={thresholds.DEGRADED_SUCCESS_RATE}
              onChange={(v) => handleThresholdChange('DEGRADED_SUCCESS_RATE', v)}
              min={0}
              max={100}
              color="amber"
              index={1}
            />
            <ThresholdCard
              icon={BarChart3}
              title="Rolling Window"
              description="Number of requests to track"
              value={thresholds.ROLLING_WINDOW_SIZE}
              onChange={(v) => handleThresholdChange('ROLLING_WINDOW_SIZE', v)}
              min={5}
              max={100}
              color="blue"
              index={2}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-[rgb(237,234,233)] dark:border-white/10">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="rounded-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>

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
                  How Health Monitoring Works
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>Online</strong>: Gateway responding normally</li>
                  <li>• <strong>Degraded</strong>: Success rate below threshold over rolling window</li>
                  <li>• <strong>Offline</strong>: Consecutive failures exceed threshold</li>
                  <li>• Reset offline gateways manually to bring them back online</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthConfigPanel;
