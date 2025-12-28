import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Settings2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * HealthConfigPanel Component
 * 
 * Admin panel for managing gateway health thresholds and resetting offline gateways.
 * 
 * @param {Object} props
 * @param {Function} props.getHealthThresholds - Fetch current thresholds
 * @param {Function} props.updateHealthThresholds - Update thresholds
 * @param {Function} props.resetHealth - Reset a gateway's health
 * @param {Array} props.offlineGateways - List of offline gateways
 * @param {Function} props.onThresholdsUpdated - Callback when thresholds are updated
 */
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

    } finally {
      setResetLoading(prev => ({ ...prev, [gatewayId]: false }));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offline Gateways Alert */}
      {offlineGateways.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Offline Gateways ({offlineGateways.length})
            </CardTitle>
            <CardDescription>
              These gateways are offline due to consecutive failures. Reset to bring them back online.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {offlineGateways.map(gateway => (
                <Button
                  key={gateway.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetGatewayHealth(gateway.id)}
                  disabled={resetLoading[gateway.id]}
                  className="border-red-500/30 hover:bg-red-500/10"
                >
                  {resetLoading[gateway.id] ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Reset {gateway.label || gateway.id}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Thresholds Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Health Thresholds
          </CardTitle>
          <CardDescription>
            Configure when gateways are marked as degraded or offline based on error rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Offline Threshold */}
            <div className="space-y-2">
              <Label htmlFor="offline-threshold">
                Offline After Failures
              </Label>
              <Input
                id="offline-threshold"
                type="number"
                min={1}
                max={50}
                value={thresholds.OFFLINE_CONSECUTIVE_FAILURES}
                onChange={(e) => handleThresholdChange('OFFLINE_CONSECUTIVE_FAILURES', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Consecutive failures before going offline
              </p>
            </div>

            {/* Degraded Threshold */}
            <div className="space-y-2">
              <Label htmlFor="degraded-threshold">
                Degraded Success Rate (%)
              </Label>
              <Input
                id="degraded-threshold"
                type="number"
                min={0}
                max={100}
                value={thresholds.DEGRADED_SUCCESS_RATE}
                onChange={(e) => handleThresholdChange('DEGRADED_SUCCESS_RATE', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Below this rate = degraded status
              </p>
            </div>

            {/* Rolling Window */}
            <div className="space-y-2">
              <Label htmlFor="window-size">
                Rolling Window Size
              </Label>
              <Input
                id="window-size"
                type="number"
                min={5}
                max={100}
                value={thresholds.ROLLING_WINDOW_SIZE}
                onChange={(e) => handleThresholdChange('ROLLING_WINDOW_SIZE', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Number of requests to track
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasChanges ? (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600/30">
                  Unsaved changes
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-600/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthConfigPanel;
