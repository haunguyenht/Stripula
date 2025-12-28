import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Server,
  Loader2, 
  RefreshCw,
  AlertCircle,
  Wrench,
  Activity,
  CheckCircle2,
  XCircle,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useGatewayAdmin } from '@/hooks/useGatewayAdmin';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useToast } from '@/hooks/useToast';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { HealthConfigPanel } from './HealthConfigPanel';
import { GatewayCard } from './GatewayCard';

/**
 * AdminGatewayManagement Component
 * Admin panel for managing gateway states and viewing health metrics
 * 
 * Requirements: 3.1, 4.4, 6.1, 6.2, 6.3
 */

// Parent type configuration
const PARENT_TYPE_CONFIG = {
  stripe: {
    label: 'Stripe',
    icon: Activity,
    subTypes: {
      auth: { label: 'Auth (SetupIntent)', icon: Server },
      charge: { label: 'Charge (PK-based)', icon: Activity },
      skbased: { label: 'SK-Based Charge', icon: Activity },
      'skbased-auth': { label: 'SK Auth ($0)', icon: Server }
    }
  },
  shopify: {
    label: 'Shopify',
    icon: Server,
    subTypes: null // No sub-types
  }
};

// Legacy type labels (for backwards compatibility)
const GATEWAY_TYPE_LABELS = {
  auth: 'Auth Gateways',
  charge: 'Charge Gateways',
  skbased: 'SK-Based Charge Gateways',
  'skbased-auth': 'SK Auth Gateways',
  shopify: 'Shopify Gateways'
};

const GATEWAY_TYPE_ICONS = {
  auth: Server,
  charge: Activity,
  skbased: Activity,
  'skbased-auth': Server,
  shopify: Server
};

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Never';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * MaintenanceDialog - Modal for entering maintenance reason
 */
function MaintenanceDialog({ isOpen, onClose, onConfirm, gatewayLabel, isLoading }) {
  const [reason, setReason] = useState('');

  const handleConfirm = useCallback(() => {
    onConfirm(reason);
    setReason('');
  }, [reason, onConfirm]);

  const handleClose = useCallback(() => {
    setReason('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "relative z-10 w-full max-w-md mx-4 p-6 rounded-xl",
          "bg-card border border-border shadow-xl"
        )}
      >
        <h3 className="text-lg font-semibold mb-2">Enable Maintenance Mode</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Put <span className="font-medium">{gatewayLabel}</span> into maintenance mode.
          Users will see this gateway as unavailable.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Reason (optional)
            </label>
            <Input
              placeholder="e.g., Scheduled maintenance, API issues..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wrench className="h-4 w-4 mr-2" />
              )}
              Enable Maintenance
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


/**
 * GatewayTypeSection - Section for a specific gateway type or sub-type
 * Uses the GatewayCard component for each gateway
 */
function GatewayTypeSection({ 
  type, 
  typeLabel, // Optional custom label
  gateways, 
  onToggle, 
  onMaintenance, 
  onDisableMaintenance,
  onProxyOperations,
  onCreditRateOperations,
  onTierRestrictionOperations,
  isGatewayLoading 
}) {
  const Icon = GATEWAY_TYPE_ICONS[type] || Server;
  const label = typeLabel || GATEWAY_TYPE_LABELS[type] || `${type} Gateways`;
  
  const availableCount = gateways.filter(g => g.isAvailable).length;
  const totalCount = gateways.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Section Header - Redesigned */}
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[rgb(250,247,245)] dark:bg-white/5 border border-[rgb(237,234,233)] dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-[rgb(237,234,233)] dark:bg-white/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-[rgb(120,113,108)] dark:text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-[rgb(37,27,24)] dark:text-white">{label}</h3>
        </div>
        <Badge 
          variant={availableCount === totalCount ? "success" : "secondary"}
          className="text-[10px] px-2"
        >
          {availableCount}/{totalCount}
        </Badge>
      </div>
      
      {/* Gateway Cards */}
      <div className="space-y-3">
        {gateways.map((gateway, index) => (
          <motion.div
            key={gateway.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GatewayCard
              gateway={gateway}
              onToggle={onToggle}
              onMaintenance={onMaintenance}
              onDisableMaintenance={onDisableMaintenance}
              // Proxy operations
              onGetProxyConfig={onProxyOperations?.save?.getConfig}
              onSaveProxy={onProxyOperations?.save?.save}
              onClearProxy={onProxyOperations?.clear}
              onTestProxy={onProxyOperations?.test}
              // Pricing operations
              onGetPricing={onCreditRateOperations?.get}
              onSavePricing={onCreditRateOperations?.set}
              onResetPricing={onCreditRateOperations?.reset}
              // Tier restriction operations
              onGetTierRestriction={onTierRestrictionOperations?.get}
              onSetTierRestriction={onTierRestrictionOperations?.set}
              onClearTierRestriction={onTierRestrictionOperations?.clear}
              isLoading={isGatewayLoading(gateway.id)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Main AdminGatewayManagement Component
 */
export function AdminGatewayManagement() {
  const { 
    gateways,
    gatewaysByType,
    gatewaysByHierarchy,
    isLoading, 
    error,
    fetchGateways,
    updateGatewayState,
    enableMaintenance,
    disableMaintenance,
    isGatewayLoading,
    // Proxy operations
    getProxyConfig,
    setProxyConfig,
    clearProxyConfig,
    testProxyConnection,
    // Credit rate operations (Requirements: 9.1, 9.2, 9.3)
    getCreditRate,
    setCreditRate,
    resetCreditRate,
    // Tier restriction operations
    getTierRestriction,
    setTierRestriction,
    clearTierRestriction,
    // Health operations
    resetHealth,
    getHealthThresholds,
    updateHealthThresholds
  } = useGatewayAdmin();

  const { success, error: showError } = useToast();
  
  // Maintenance dialog state
  const [maintenanceDialog, setMaintenanceDialog] = useState({
    isOpen: false,
    gateway: null
  });
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('all');

  /**
   * Proxy operations object to pass to child components
   * Requirements: 7.1, 7.2, 7.3, 7.4
   */
  const proxyOperations = useMemo(() => ({
    save: {
      getConfig: getProxyConfig,
      save: setProxyConfig
    },
    clear: clearProxyConfig,
    test: testProxyConnection
  }), [getProxyConfig, setProxyConfig, clearProxyConfig, testProxyConnection]);

  /**
   * Credit rate operations object to pass to child components
   * Requirements: 9.1, 9.2, 9.3
   */
  const creditRateOperations = useMemo(() => ({
    get: getCreditRate,
    set: setCreditRate,
    reset: resetCreditRate
  }), [getCreditRate, setCreditRate, resetCreditRate]);

  /**
   * Tier restriction operations object to pass to child components
   */
  const tierRestrictionOperations = useMemo(() => ({
    get: getTierRestriction,
    set: setTierRestriction,
    clear: clearTierRestriction
  }), [getTierRestriction, setTierRestriction, clearTierRestriction]);

  // Fetch gateways on mount
  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  // Admin notifications for SSE events - Requirements: 15.1, 15.2, 15.3, 15.4
  // Subscribe to SSE and show notifications when other admins make changes
  useAdminNotifications({
    batchWindowMs: 3000,
    onCreditRateChange: (data) => {
      // Refresh gateway data when credit rate changes from another admin
      fetchGateways();
    },
    onStateChange: (data) => {
      // Refresh gateway data when state changes from another admin
      fetchGateways();
    }
  });

  /**
   * Handle gateway toggle (enable/disable)
   */
  const handleToggle = useCallback(async (gatewayId, state) => {
    const result = await updateGatewayState(gatewayId, state);
    
    if (result.success) {
      success(`Gateway ${state === 'enabled' ? 'enabled' : 'disabled'}`);
    } else {
      showError(result.error || 'Failed to update gateway');
    }
  }, [updateGatewayState, success, showError]);

  /**
   * Open maintenance dialog
   */
  const handleOpenMaintenance = useCallback((gateway) => {
    setMaintenanceDialog({ isOpen: true, gateway });
  }, []);

  /**
   * Confirm maintenance mode
   */
  const handleConfirmMaintenance = useCallback(async (reason) => {
    if (!maintenanceDialog.gateway) return;
    
    setIsMaintenanceLoading(true);
    const result = await enableMaintenance(maintenanceDialog.gateway.id, reason);
    setIsMaintenanceLoading(false);
    
    if (result.success) {
      success('Maintenance mode enabled');
      setMaintenanceDialog({ isOpen: false, gateway: null });
    } else {
      showError(result.error || 'Failed to enable maintenance mode');
    }
  }, [maintenanceDialog.gateway, enableMaintenance, success, showError]);

  /**
   * Disable maintenance mode
   */
  const handleDisableMaintenance = useCallback(async (gatewayId) => {
    const result = await disableMaintenance(gatewayId);
    
    if (result.success) {
      success('Maintenance mode disabled');
    } else {
      showError(result.error || 'Failed to disable maintenance mode');
    }
  }, [disableMaintenance, success, showError]);

  /**
   * Close maintenance dialog
   */
  const handleCloseMaintenance = useCallback(() => {
    setMaintenanceDialog({ isOpen: false, gateway: null });
  }, []);

  // Get gateway types (legacy)
  const gatewayTypes = Object.keys(gatewaysByType).sort();
  
  // Get parent types for hierarchy display
  const parentTypes = Object.keys(gatewaysByHierarchy).sort((a, b) => {
    // Stripe first, then shopify, then others
    const order = { stripe: 0, shopify: 1 };
    return (order[a] ?? 99) - (order[b] ?? 99);
  });

  // Loading state
  if (isLoading && gateways.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card dark:bg-card/50 overflow-hidden">
        <div className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Loading gateways...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && gateways.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 overflow-hidden">
        <div className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchGateways} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (gateways.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card dark:bg-card/50 overflow-hidden">
        <div className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 dark:bg-white/5 flex items-center justify-center mb-4">
              <Server className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No gateways configured</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const onlineCount = gateways.filter(g => g.state === 'enabled' && g.healthStatus === 'online').length;
  const maintenanceCount = gateways.filter(g => g.state === 'maintenance').length;
  const disabledCount = gateways.filter(g => g.state === 'disabled').length;
  const offlineCount = gateways.filter(g => g.healthStatus === 'offline').length;
  const degradedCount = gateways.filter(g => g.healthStatus === 'degraded').length;

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="rounded-2xl border border-[rgb(237,234,233)] dark:border-white/10 bg-white dark:bg-[rgba(30,41,59,0.5)] dark:backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-none">
          {/* Gradient Header */}
          <div className="relative px-6 py-5 bg-gradient-to-br from-[rgb(255,64,23)]/5 via-[rgb(255,64,23)]/3 to-transparent dark:from-primary/10 dark:via-primary/5 dark:to-transparent border-b border-[rgb(237,234,233)] dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Gateway Management</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Control availability, health metrics, and configurations
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchGateways}
                disabled={isLoading}
                className="h-9 px-4 rounded-xl"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Online */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="gateway-status-card gateway-status-online"
              >
                <div className="absolute top-2 right-2">
                  <div className="status-dot status-dot-online status-dot-pulse" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 status-text" />
                  <span className="text-xs font-medium status-text uppercase tracking-wide">Online</span>
                </div>
                <div className="text-3xl font-bold status-text">
                  {onlineCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  of {gateways.length} gateways
                </div>
              </motion.div>

              {/* Maintenance */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="gateway-status-card gateway-status-maintenance"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4 status-text" />
                  <span className="text-xs font-medium status-text uppercase tracking-wide">Maintenance</span>
                </div>
                <div className="text-3xl font-bold status-text">
                  {maintenanceCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  temporarily paused
                </div>
              </motion.div>

              {/* Disabled */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="gateway-status-card gateway-status-disabled"
              >
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 status-text" />
                  <span className="text-xs font-medium status-text uppercase tracking-wide">Disabled</span>
                </div>
                <div className="text-3xl font-bold status-text">
                  {disabledCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  turned off
                </div>
              </motion.div>

              {/* Degraded */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={cn(
                  "gateway-status-card",
                  degradedCount > 0 ? "gateway-status-degraded" : "surface-subtle border border-border/50"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className={cn("h-4 w-4", degradedCount > 0 ? "status-text" : "text-muted-foreground")} />
                  <span className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    degradedCount > 0 ? "status-text" : "text-muted-foreground"
                  )}>Degraded</span>
                </div>
                <div className={cn(
                  "text-3xl font-bold",
                  degradedCount > 0 ? "status-text" : "text-muted-foreground"
                )}>
                  {degradedCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  high error rate
                </div>
              </motion.div>

              {/* Offline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "gateway-status-card",
                  offlineCount > 0 ? "gateway-status-offline" : "surface-subtle border border-border/50"
                )}
              >
                {offlineCount > 0 && (
                  <div className="absolute top-2 right-2">
                    <div className="status-dot status-dot-offline status-dot-pulse" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Activity className={cn("h-4 w-4", offlineCount > 0 ? "status-text" : "text-muted-foreground")} />
                  <span className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    offlineCount > 0 ? "status-text" : "text-muted-foreground"
                  )}>Offline</span>
                </div>
                <div className={cn(
                  "text-3xl font-bold",
                  offlineCount > 0 ? "status-text" : "text-muted-foreground"
                )}>
                  {offlineCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  not responding
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="rounded-2xl border border-[rgb(237,234,233)] dark:border-white/10 bg-white dark:bg-[rgba(30,41,59,0.5)] dark:backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-none">
          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 pt-4 pb-0">
              <TabsList className={cn(
                "inline-flex h-11 items-center justify-start rounded-xl bg-[rgb(250,247,245)] dark:bg-white/5 p-1 gap-1 border border-[rgb(237,234,233)] dark:border-white/10",
                "w-full sm:w-auto"
              )}>
                <TabsTrigger 
                  value="all" 
                  className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Server className="h-4 w-4 mr-2" />
                  All
                </TabsTrigger>
                {parentTypes.map(parentType => {
                  const config = PARENT_TYPE_CONFIG[parentType];
                  const ParentIcon = config?.icon || Server;
                  return (
                    <TabsTrigger 
                      key={parentType} 
                      value={parentType} 
                      className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm capitalize"
                    >
                      <ParentIcon className="h-4 w-4 mr-2" />
                      {config?.label || parentType}
                    </TabsTrigger>
                  );
                })}
                <TabsTrigger 
                  value="health" 
                  className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Health
                  {offlineCount > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px]">
                      {offlineCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* All gateways tab - shows hierarchy */}
            <TabsContent value="all" className="p-4 pt-6">
              <div className="space-y-8">
                {parentTypes.map(parentType => {
                  const config = PARENT_TYPE_CONFIG[parentType];
                  const subTypes = gatewaysByHierarchy[parentType] || {};
                  const subTypeKeys = Object.keys(subTypes).sort();
                  const ParentIcon = config?.icon || Server;
                  const totalGateways = subTypeKeys.reduce((acc, st) => acc + (subTypes[st]?.length || 0), 0);
                  const availableGateways = subTypeKeys.reduce((acc, st) => {
                    const gws = subTypes[st] || [];
                    return acc + gws.filter(g => g.isAvailable).length;
                  }, 0);
                  
                  return (
                    <motion.div 
                      key={parentType} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Parent type header - redesigned */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[rgb(250,247,245)] to-white dark:from-white/5 dark:to-transparent border border-[rgb(237,234,233)] dark:border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[rgb(255,64,23)]/10 dark:bg-primary/20 flex items-center justify-center">
                            <ParentIcon className="h-5 w-5 text-[rgb(255,64,23)] dark:text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold capitalize">
                              {config?.label || parentType}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {subTypeKeys.length > 1 ? `${subTypeKeys.length} categories` : 'Gateway group'}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={availableGateways === totalGateways ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {availableGateways}/{totalGateways} available
                        </Badge>
                      </div>
                      
                      {/* Sub-types or direct gateways */}
                      <div className="space-y-6 pl-2 sm:pl-4">
                        {subTypeKeys.map(subType => {
                          const gws = subTypes[subType] || [];
                          const subConfig = config?.subTypes?.[subType];
                          const displayLabel = subConfig?.label || 
                            (subType === '_gateways' ? 'Gateways' : subType);
                          
                          return (
                            <GatewayTypeSection
                              key={`${parentType}-${subType}`}
                              type={subType === '_gateways' ? parentType : subType}
                              typeLabel={displayLabel}
                              gateways={gws}
                              onToggle={handleToggle}
                              onMaintenance={handleOpenMaintenance}
                              onDisableMaintenance={handleDisableMaintenance}
                              onProxyOperations={proxyOperations}
                              onCreditRateOperations={creditRateOperations}
                              onTierRestrictionOperations={tierRestrictionOperations}
                              isGatewayLoading={isGatewayLoading}
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Individual parent type tabs */}
            {parentTypes.map(parentType => {
              const config = PARENT_TYPE_CONFIG[parentType];
              const subTypes = gatewaysByHierarchy[parentType] || {};
              const subTypeKeys = Object.keys(subTypes).sort();
              
              return (
                <TabsContent key={parentType} value={parentType} className="p-4 pt-6">
                  <div className="space-y-6">
                    {subTypeKeys.map(subType => {
                      const gws = subTypes[subType] || [];
                      const subConfig = config?.subTypes?.[subType];
                      const displayLabel = subConfig?.label || 
                        (subType === '_gateways' ? 'Gateways' : subType);
                      
                      return (
                        <GatewayTypeSection
                          key={`${parentType}-${subType}`}
                          type={subType === '_gateways' ? parentType : subType}
                          typeLabel={displayLabel}
                          gateways={gws}
                          onToggle={handleToggle}
                          onMaintenance={handleOpenMaintenance}
                          onDisableMaintenance={handleDisableMaintenance}
                          onProxyOperations={proxyOperations}
                          onCreditRateOperations={creditRateOperations}
                          onTierRestrictionOperations={tierRestrictionOperations}
                          isGatewayLoading={isGatewayLoading}
                        />
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}

            {/* Health tab */}
            <TabsContent value="health" className="p-4 pt-6">
              <HealthConfigPanel
                getHealthThresholds={getHealthThresholds}
                updateHealthThresholds={updateHealthThresholds}
                resetHealth={resetHealth}
                offlineGateways={gateways.filter(g => g.healthStatus === 'offline')}
                onThresholdsUpdated={fetchGateways}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Maintenance Dialog */}
      <MaintenanceDialog
        isOpen={maintenanceDialog.isOpen}
        onClose={handleCloseMaintenance}
        onConfirm={handleConfirmMaintenance}
        gatewayLabel={maintenanceDialog.gateway?.label || maintenanceDialog.gateway?.id}
        isLoading={isMaintenanceLoading}
      />
    </>
  );
}

export default AdminGatewayManagement;
