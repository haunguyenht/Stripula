import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Server,
  Loader2,
  Wrench,
  Activity,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Globe,
  Save,
  Trash2,
  Copy,
  Check,
  DollarSign,
  Shield,
  Wifi,
  Settings2,
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle,
  LockOpen,
  Lock,
  RotateCcw,
  Crown,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GatewayStatusIndicator, GatewayStatusBadge } from '@/components/ui/GatewayStatusIndicator';
import { useToast } from '@/hooks/useToast';
import { useConfirmation } from '@/hooks/useConfirmation';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useSavedProxies } from '@/hooks/useSavedProxies';

// Credit rate validation constants
const CREDIT_RATE_LIMITS = { MIN: 0.1, MAX: 100.0 };

// Tier configuration with colors
const TIERS = [
  { value: null, label: 'All Tiers', description: 'No restriction', icon: LockOpen, color: 'emerald' },
  { value: 'bronze', label: 'Bronze+', description: 'Bronze and above', icon: Shield, color: 'amber' },
  { value: 'silver', label: 'Silver+', description: 'Silver and above', icon: Shield, color: 'slate' },
  { value: 'gold', label: 'Gold+', description: 'Gold and above', icon: Crown, color: 'yellow' },
  { value: 'diamond', label: 'Diamond', description: 'Diamond only', icon: Crown, color: 'cyan' },
];

const TIER_COLORS = {
  diamond: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  gold: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  silver: 'bg-slate-400/20 text-slate-600 dark:text-slate-300 border-slate-400/30',
  bronze: 'bg-amber-600/20 text-amber-700 dark:text-amber-400 border-amber-600/30',
  default: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
};

// User tier multipliers for effective rate preview
const USER_TIER_MULTIPLIERS = {
  free: { multiplier: 1.0, label: 'Free' },
  bronze: { multiplier: 0.95, label: 'Bronze' },
  silver: { multiplier: 0.85, label: 'Silver' },
  gold: { multiplier: 0.70, label: 'Gold' },
  diamond: { multiplier: 0.50, label: 'Diamond' }
};

/**
 * Get gateway subType from gateway ID
 */
function getGatewaySubType(gatewayId) {
  if (!gatewayId) return 'auth';
  if (gatewayId.startsWith('auth-')) return 'auth';
  if (gatewayId.startsWith('charge-')) return 'charge';
  if (gatewayId.startsWith('skbased-auth-')) return 'skbased-auth';  // SKAuth - only APPROVED
  if (gatewayId.startsWith('sk-') || gatewayId.startsWith('skbased-')) return 'skbased';  // SKCharge - APPROVED + LIVE
  if (gatewayId.startsWith('shopify-')) return 'shopify';
  return 'auth';
}

/**
 * Get pricing field configuration based on gateway subType
 */
function getPricingConfig(subType) {
  switch (subType) {
    case 'charge':
    case 'skbased':
      return { showApproved: true, showLive: true, approvedLabel: 'CHARGED' };
    case 'skbased-auth':
      return { showApproved: true, showLive: false, approvedLabel: 'APPROVED' };
    case 'auth':
    case 'shopify':
    default:
      return { showApproved: true, showLive: false, approvedLabel: 'APPROVED' };
  }
}

/**
 * Validate credit rate value
 */
function validateCreditRate(value) {
  if (value === '' || value === null || value === undefined) {
    return { isValid: false, error: 'Required' };
  }
  const rate = parseFloat(value);
  if (isNaN(rate)) {
    return { isValid: false, error: 'Invalid number' };
  }
  if (rate < CREDIT_RATE_LIMITS.MIN || rate > CREDIT_RATE_LIMITS.MAX) {
    return { isValid: false, error: `Must be ${CREDIT_RATE_LIMITS.MIN}-${CREDIT_RATE_LIMITS.MAX}` };
  }
  return { isValid: true, error: null };
}

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

// Section configuration for the expandable panels
const SECTIONS = {
  metrics: { icon: Activity, label: 'Health Metrics' },
  proxy: { icon: Globe, label: 'Proxy' },
  pricing: { icon: DollarSign, label: 'Pricing' },
  access: { icon: Shield, label: 'Access' }
};

/**
 * StatCard - Compact stat display
 * Uses explicit colors for consistent light/dark mode theming (OrangeAI light, OPUX dark)
 */
function StatCard({ label, value, variant = 'default', icon: Icon }) {
  // Light mode: OrangeAI warm backgrounds
  // Dark mode: OPUX glass-like backgrounds
  const variants = {
    default: 'bg-[rgb(250,247,245)] dark:bg-white/[0.05] border-[rgb(237,234,233)] dark:border-white/10',
    success: 'bg-emerald-50 dark:bg-emerald-400/15 border-emerald-200 dark:border-emerald-400/25',
    warning: 'bg-amber-50 dark:bg-amber-400/15 border-amber-200 dark:border-amber-400/25',
    danger: 'bg-red-50 dark:bg-red-400/15 border-red-200 dark:border-red-400/25'
  };

  const textVariants = {
    default: 'text-[rgb(37,27,24)] dark:text-white',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400'
  };

  return (
    <div className={cn(
      "p-3 rounded-xl border",
      variants[variant]
    )}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-[rgb(120,113,108)] dark:text-slate-400" />}
        <span className="text-[11px] font-medium text-[rgb(120,113,108)] dark:text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={cn("text-xl font-bold", textVariants[variant])}>
        {value}
      </div>
    </div>
  );
}

/**
 * SectionTab - Tab button for section navigation
 * Uses explicit colors for consistent light/dark mode theming (OrangeAI light, OPUX dark)
 */
function SectionTab({ section, isActive, onClick, hasConfig }) {
  const config = SECTIONS[section];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        "text-[rgb(120,113,108)] dark:text-slate-400",
        "hover:bg-[rgb(237,234,233)] dark:hover:bg-white/[0.08]",
        isActive && "bg-[rgb(255,64,23)]/10 text-[rgb(255,64,23)] dark:bg-primary/20 dark:text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{config.label}</span>
      {hasConfig && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      )}
    </button>
  );
}

/**
 * HealthMetricsPanel - Redesigned health metrics display
 */
function HealthMetricsPanel({ metrics }) {
  if (!metrics) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No health data available yet
      </div>
    );
  }

  const successRate = metrics.successRate ?? 100;
  const getSuccessVariant = () => {
    if (successRate >= 80) return 'success';
    if (successRate >= 50) return 'warning';
    return 'danger';
  };

  const getFailureVariant = () => {
    const fails = metrics.consecutiveFailures ?? 0;
    if (fails >= 5) return 'danger';
    if (fails >= 3) return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          variant={getSuccessVariant()}
          icon={TrendingUp}
        />
        <StatCard
          label="Avg Latency"
          value={`${metrics.avgLatencyMs ?? 0}ms`}
          icon={Clock}
        />
        <StatCard
          label="Total Requests"
          value={metrics.totalRequests ?? 0}
          icon={Zap}
        />
        <StatCard
          label="Consecutive Fails"
          value={metrics.consecutiveFailures ?? 0}
          variant={getFailureVariant()}
          icon={AlertTriangle}
        />
      </div>

      {/* Timeline */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-400/15 border border-emerald-200 dark:border-emerald-400/25">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
          <span className="text-[rgb(120,113,108)] dark:text-slate-400">Last success:</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {formatRelativeTime(metrics.lastSuccessAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-400/15 border border-red-200 dark:border-red-400/25">
          <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-500" />
          <span className="text-[rgb(120,113,108)] dark:text-slate-400">Last failure:</span>
          <span className="font-medium text-red-600 dark:text-red-400">
            {formatRelativeTime(metrics.lastFailureAt)}
          </span>
        </div>
      </div>

      {/* Failure Breakdown */}
      {metrics.failuresByCategory && Object.keys(metrics.failuresByCategory).length > 0 && (
        <div className="pt-3 border-t border-[rgb(237,234,233)] dark:border-white/10">
          <h5 className="text-xs font-medium text-[rgb(120,113,108)] dark:text-slate-400 mb-3">Failure Breakdown</h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(metrics.failuresByCategory).map(([category, count]) => (
              <div
                key={category}
                className="flex items-center justify-between p-2 rounded-lg bg-[rgb(250,247,245)] dark:bg-white/[0.05] border border-[rgb(237,234,233)] dark:border-white/10"
              >
                <span className="text-xs text-[rgb(120,113,108)] dark:text-slate-400 capitalize">
                  {category.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-semibold text-[rgb(37,27,24)] dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ProxyPanel - Redesigned proxy configuration
 */
function ProxyPanel({ 
  gateway, 
  onGetConfig,
  onSave, 
  onClear, 
  onTest,
  isLoading 
}) {
  const [proxyConfig, setProxyConfig] = useState(null);
  const [formData, setFormData] = useState({
    host: '',
    port: '',
    type: 'http',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testingProxyId, setTestingProxyId] = useState(null); // Track which proxy is being tested
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const { savedProxies, saveProxy, deleteProxy } = useSavedProxies();
  const { success, error: showError } = useToast();
  const confirmation = useConfirmation();

  // Load proxy config on mount
  useEffect(() => {
    const loadConfig = async () => {
      if (!onGetConfig) {
        setIsLoadingConfig(false);
        return;
      }
      setIsLoadingConfig(true);
      try {
        const result = await onGetConfig(gateway.id);
        if (result.success && result.proxyConfig) {
          setProxyConfig(result.proxyConfig);
          setFormData({
            host: result.proxyConfig.host || '',
            port: result.proxyConfig.port?.toString() || '',
            type: result.proxyConfig.type || 'http',
            username: result.proxyConfig.username || '',
            password: result.proxyConfig.password || ''
          });
        }
      } catch (err) {
        // Silent fail
      } finally {
        setIsLoadingConfig(false);
      }
    };
    loadConfig();
  }, [gateway.id, onGetConfig]);

  const handleTest = async () => {
    if (!formData.host || !formData.port) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(gateway.id, {
        ...formData,
        port: parseInt(formData.port)
      });
      setTestResult(result);
      if (result.success) {
        success(`Connected in ${result.latencyMs}ms`);
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.host || !formData.port) return;
    setIsSaving(true);
    const config = {
      ...formData,
      port: parseInt(formData.port)
    };
    try {
      const result = await onSave(gateway.id, config);
      if (result.success) {
        success('Proxy saved');
        setProxyConfig(config);
        saveProxy(config);
      } else {
        showError(result.error || 'Failed to save');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    // Show confirmation dialog
    const confirmed = await confirmation.confirm({
      title: 'Clear Proxy Configuration',
      description: `Clear the proxy for ${gateway.label || gateway.id}?`,
      confirmText: 'Clear',
      cancelText: 'Cancel',
      destructive: true
    });
    if (!confirmed) return;

    const result = await onClear(gateway.id);
    if (result.success) {
      success('Proxy cleared');
      setProxyConfig(null);
      setFormData({ host: '', port: '', type: 'http', username: '', password: '' });
    } else {
      showError(result.error || 'Failed to clear');
    }
  };

  const handleCopyProxy = async () => {
    if (!proxyConfig) return;
    const str = `${proxyConfig.type}://${proxyConfig.username ? `${proxyConfig.username}:${proxyConfig.password}@` : ''}${proxyConfig.host}:${proxyConfig.port}`;
    await navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Select saved proxy and auto-test
  const handleSelectSaved = async (proxyId) => {
    const proxy = savedProxies.find(p => p.id === proxyId);
    if (!proxy) return;
    
    setFormData({
      host: proxy.host,
      port: proxy.port?.toString() || '',
      type: proxy.type || 'http',
      username: proxy.username || '',
      password: proxy.password || ''
    });
    
    // Auto-test the selected proxy
    setIsTesting(true);
    setTestingProxyId(proxyId);
    setTestResult(null);
    try {
      const result = await onTest(gateway.id, proxy);
      setTestResult(result);
      if (result.success) {
        success(`Proxy test passed (${result.latencyMs}ms). Click "Save" to apply.`);
      } else {
        showError(`Proxy test failed: ${result.error}`);
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
      setTestingProxyId(null);
    }
  };

  const isConfigured = !!proxyConfig?.host;
  const canSave = formData.host && formData.port;
  const isOperationInProgress = isLoading || isSaving || isTesting;

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Current Config Display */}
      {isConfigured && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Active Proxy
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleCopyProxy}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <code className="text-sm font-mono text-[rgb(37,27,24)] dark:text-white">
            <span className="text-[rgb(120,113,108)] dark:text-slate-400">{proxyConfig.type}://</span>
            {proxyConfig.username && (
              <span className="text-blue-600 dark:text-blue-400">
                {proxyConfig.username}:{proxyConfig.password}@
              </span>
            )}
            <span className="text-[rgb(37,27,24)] dark:text-white">{proxyConfig.host}:{proxyConfig.port}</span>
          </code>
        </div>
      )}

      {/* Saved Proxies Dropdown */}
      {savedProxies.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-[rgb(120,113,108)] dark:text-slate-400">
            Saved Proxies
          </Label>
          <Select
            onValueChange={handleSelectSaved}
            disabled={isTesting}
          >
            <SelectTrigger className="h-9 bg-[rgb(250,247,245)] dark:bg-white/5 border-[rgb(237,234,233)] dark:border-white/10">
              <div className="flex items-center gap-2">
                {isTesting && testingProxyId ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[rgb(255,64,23)]" />
                    <span className="text-sm">Testing proxy...</span>
                  </>
                ) : (
                  <span className="text-sm text-[rgb(120,113,108)] dark:text-slate-400">
                    Select a saved proxy to test
                  </span>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              {savedProxies.map((proxy) => {
                const isActive = proxyConfig?.host === proxy.host && 
                                 proxyConfig?.port === proxy.port;
                return (
                  <SelectItem 
                    key={proxy.id} 
                    value={proxy.id}
                    className="py-2"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      {testingProxyId === proxy.id && (
                        <Loader2 className="h-3 w-3 animate-spin text-[rgb(255,64,23)] shrink-0" />
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                        {proxy.type?.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-xs truncate">
                        {proxy.host}:{proxy.port}
                      </span>
                      {isActive && (
                        <Badge variant="outline" className="text-[10px] ml-auto bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30">
                          Active
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {/* Delete saved proxies */}
          <div className="flex items-center gap-1 flex-wrap mt-2">
            {savedProxies.map((proxy) => (
              <button
                key={proxy.id}
                onClick={() => deleteProxy(proxy.id)}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-[rgb(250,247,245)] dark:bg-white/5 border border-[rgb(237,234,233)] dark:border-white/10 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:border-red-500/30 text-[rgb(120,113,108)] dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-2.5 w-2.5" />
                <span className="font-mono">{proxy.host}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="proxy-host" className="text-xs">Host</Label>
            <Input
              id="proxy-host"
              placeholder="proxy.example.com"
              value={formData.host}
              onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proxy-port" className="text-xs">Port</Label>
            <Input
              id="proxy-port"
              type="number"
              placeholder="8080"
              value={formData.port}
              onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="proxy-type" className="text-xs">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="https">HTTPS</SelectItem>
              <SelectItem value="socks4">SOCKS4</SelectItem>
              <SelectItem value="socks5">SOCKS5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="proxy-user" className="text-xs">
              Username <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="proxy-user"
              placeholder="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="h-9"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proxy-pass" className="text-xs">
              Password <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <Input
                id="proxy-pass"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="h-9 pr-9"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={cn(
          "p-3 rounded-lg text-sm",
          testResult.success
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
        )}>
          {testResult.success
            ? `✓ Connected successfully (${testResult.latencyMs}ms)`
            : `✗ ${testResult.error}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={isOperationInProgress || !canSave}
          className="flex-1"
        >
          {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wifi className="h-4 w-4 mr-2" />}
          Test
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isOperationInProgress || !canSave}
          className="flex-1"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
        {isConfigured && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isOperationInProgress}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        {...confirmation.config}
      />
    </div>
  );
}

/**
 * PricingPanel - Redesigned credit pricing configuration
 */
function PricingPanel({ 
  gateway, 
  onGetPricing,
  onSavePricing, 
  onResetPricing,
  isLoading 
}) {
  const [pricingInfo, setPricingInfo] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [approvedValue, setApprovedValue] = useState('');
  const [liveValue, setLiveValue] = useState('');
  const [approvedError, setApprovedError] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const { success, error: showError } = useToast();
  const confirmation = useConfirmation();

  // Get gateway type config
  const subType = getGatewaySubType(gateway?.id);
  const pricingConfig = getPricingConfig(subType);

  // Load pricing on mount
  useEffect(() => {
    const loadPricing = async () => {
      if (!onGetPricing) {
        setIsLoadingConfig(false);
        return;
      }
      setIsLoadingConfig(true);
      try {
        const result = await onGetPricing(gateway.id);
        if (result.success) {
          setPricingInfo({
            pricing: result.pricing,
            defaultPricing: result.defaultPricing,
            billingType: result.billingType,
            isCustom: result.isCustom
          });
          // Only set values if API returned them - no hardcoded fallbacks
          setApprovedValue(result.pricing?.approved != null ? result.pricing.approved.toFixed(2) : '');
          setLiveValue(result.pricing?.live != null ? result.pricing.live.toFixed(2) : '');
        }
      } catch (err) {
        // Silent fail
      } finally {
        setIsLoadingConfig(false);
      }
    };
    loadPricing();
  }, [gateway.id, onGetPricing]);

  const handleApprovedChange = (e) => {
    const value = e.target.value;
    setApprovedValue(value);
    setApprovedError(validateCreditRate(value).error);
  };

  const handleLiveChange = (e) => {
    const value = e.target.value;
    setLiveValue(value);
    setLiveError(validateCreditRate(value).error);
  };

  const handleSave = async () => {
    // Validate
    if (pricingConfig.showApproved && !validateCreditRate(approvedValue).isValid) return;
    if (pricingConfig.showLive && !validateCreditRate(liveValue).isValid) return;

    const newPricing = {
      approved: parseFloat(approvedValue),
      live: parseFloat(liveValue)
    };

    const confirmed = await confirmation.confirm({
      title: 'Update Pricing',
      description: `Update credit pricing for ${gateway.label}?`,
      confirmText: 'Update',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setIsSaving(true);
    try {
      const result = await onSavePricing(gateway.id, newPricing);
      if (result.success) {
        success('Pricing updated');
        setPricingInfo(prev => ({
          ...prev,
          pricing: result.pricing || newPricing,
          isCustom: result.isCustom ?? true
        }));
      } else {
        showError(result.error || 'Failed to update');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await confirmation.confirm({
      title: 'Reset to Default',
      description: `Reset pricing for ${gateway.label} to default values?`,
      confirmText: 'Reset',
      cancelText: 'Cancel',
      destructive: true
    });

    if (!confirmed) return;

    setIsSaving(true);
    try {
      const result = await onResetPricing(gateway.id);
      if (result.success) {
        success('Pricing reset to default');
        // Use API response values - fallback to previously loaded defaultPricing if API doesn't return new values
        const defaultPricing = result.pricing || result.defaultPricing || pricingInfo?.defaultPricing;
        setPricingInfo(prev => ({
          ...prev,
          pricing: defaultPricing,
          isCustom: false
        }));
        // Only set values if we have them from API
        if (defaultPricing) {
          setApprovedValue(defaultPricing.approved != null ? defaultPricing.approved.toFixed(2) : '');
          setLiveValue(defaultPricing.live != null ? defaultPricing.live.toFixed(2) : '');
        }
      } else {
        showError(result.error || 'Failed to reset');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const pricing = pricingInfo?.pricing;
  const defaultPricing = pricingInfo?.defaultPricing;
  const isCustom = pricingInfo?.isCustom;
  const hasChanges = 
    (pricingConfig.showApproved && parseFloat(approvedValue) !== pricing?.approved) ||
    (pricingConfig.showLive && parseFloat(liveValue) !== pricing?.live);
  const hasError = approvedError || liveError;
  const isOperationInProgress = isLoading || isSaving;

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Billing Type Info */}
      <div className={cn(
        "p-4 rounded-xl border",
        subType === 'auth' || subType === 'shopify'
          ? "bg-blue-500/5 border-blue-500/20" 
          : "bg-emerald-500/5 border-emerald-500/20"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <div className={cn(
            "h-2 w-2 rounded-full",
            subType === 'auth' || subType === 'shopify' ? "bg-blue-500" : "bg-emerald-500"
          )} />
          <span className={cn(
            "text-sm font-medium",
            subType === 'auth' || subType === 'shopify' 
              ? "text-blue-700 dark:text-blue-400" 
              : "text-emerald-700 dark:text-emerald-400"
          )}>
            {subType === 'auth' && 'Auth Gateway'}
            {subType === 'shopify' && 'Shopify Gateway'}
            {subType === 'charge' && 'Charge Gateway'}
            {subType === 'skbased' && 'SK-Based Gateway'}
          </span>
          {isCustom && (
            <Badge variant="outline" className="text-[10px] ml-auto bg-amber-500/10 text-amber-600 border-amber-500/30">
              Custom
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {(subType === 'auth' || subType === 'shopify') && 'Bills for APPROVED cards only (validates without charging)'}
          {subType === 'charge' && 'Bills for both APPROVED and LIVE cards'}
          {subType === 'skbased' && 'Bills for both CHARGED and LIVE cards'}
        </p>
      </div>

      {/* Rate Inputs */}
      <div className={cn("grid gap-4", pricingConfig.showLive ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        {/* APPROVED Rate */}
        {pricingConfig.showApproved && (
          <div className={cn(
            "p-4 rounded-xl border transition-all",
            "bg-emerald-500/5 border-emerald-500/20"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <Label className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {pricingConfig.approvedLabel} Rate
                </Label>
              </div>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Active
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                step="0.1"
                min={CREDIT_RATE_LIMITS.MIN}
                max={CREDIT_RATE_LIMITS.MAX}
                value={approvedValue}
                onChange={handleApprovedChange}
                disabled={isOperationInProgress}
                className={cn("h-10 text-lg font-semibold w-24", approvedError && "border-red-500")}
              />
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
            {approvedError && <p className="text-xs text-red-500 mt-1">{approvedError}</p>}
            <p className="text-[11px] text-muted-foreground mt-2">
              Default: {defaultPricing?.approved ?? '—'} credits
            </p>
          </div>
        )}

        {/* LIVE Rate */}
        {pricingConfig.showLive && (
          <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-blue-500" />
                <Label className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  LIVE Rate
                </Label>
              </div>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                Active
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                step="0.1"
                min={CREDIT_RATE_LIMITS.MIN}
                max={CREDIT_RATE_LIMITS.MAX}
                value={liveValue}
                onChange={handleLiveChange}
                disabled={isOperationInProgress}
                className={cn("h-10 text-lg font-semibold w-24", liveError && "border-red-500")}
              />
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
            {liveError && <p className="text-xs text-red-500 mt-1">{liveError}</p>}
            <p className="text-[11px] text-muted-foreground mt-2">
              Default: {defaultPricing?.live ?? '—'} credits
            </p>
          </div>
        )}
      </div>

      {/* Pricing Summary */}
      <div className="p-4 rounded-xl bg-muted/30 dark:bg-white/5 border border-border/50">
        <h5 className="text-xs font-medium text-muted-foreground mb-3">Pricing Summary</h5>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/10">
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">
              {pricingConfig.approvedLabel}
            </div>
            <div className="text-xl font-bold text-foreground">
              {approvedValue || '—'}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10 dark:bg-blue-500/10">
            <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-1">
              Live
            </div>
            <div className="text-xl font-bold text-foreground">
              {pricingConfig.showLive ? (liveValue || '—') : 'N/A'}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 dark:bg-white/5">
            <div className="text-[11px] font-medium text-muted-foreground mb-1">
              Dead/Error
            </div>
            <div className="text-xl font-bold text-muted-foreground">
              Free
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isOperationInProgress || !hasChanges || hasError}
          className="flex-1"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Pricing
        </Button>
        {isCustom && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isOperationInProgress}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        {...confirmation.config}
      />
    </div>
  );
}

/**
 * AccessPanel - Tier restriction configuration
 */
function AccessPanel({ 
  gateway, 
  onGetTierRestriction,
  onSetTierRestriction, 
  onClearTierRestriction,
  isLoading 
}) {
  const [currentTier, setCurrentTier] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error: showError } = useToast();
  const confirmation = useConfirmation();

  // Load tier restriction on mount
  useEffect(() => {
    const loadTierRestriction = async () => {
      if (!onGetTierRestriction) {
        setIsLoadingConfig(false);
        return;
      }
      setIsLoadingConfig(true);
      try {
        const result = await onGetTierRestriction(gateway.id);
        if (result.success) {
          setCurrentTier(result.minTier);
          setSelectedTier(result.minTier);
        }
      } catch (err) {
        // Silent fail
      } finally {
        setIsLoadingConfig(false);
      }
    };
    loadTierRestriction();
  }, [gateway.id, onGetTierRestriction]);

  const handleSave = async () => {
    const tierInfo = TIERS.find(t => t.value === selectedTier);
    
    const confirmed = await confirmation.confirm({
      title: selectedTier ? 'Set Tier Restriction' : 'Remove Tier Restriction',
      description: selectedTier 
        ? `Restrict ${gateway.label} to ${tierInfo?.label || selectedTier}+ users?`
        : `Allow all tiers to access ${gateway.label}?`,
      confirmText: selectedTier ? 'Set Restriction' : 'Remove Restriction',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setIsSaving(true);
    try {
      const result = selectedTier 
        ? await onSetTierRestriction(gateway.id, selectedTier)
        : await onClearTierRestriction(gateway.id);
      
      if (result.success) {
        setCurrentTier(selectedTier);
        success(selectedTier ? 'Tier restriction set' : 'Tier restriction removed');
      } else {
        showError(result.error || 'Failed to update');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = selectedTier !== currentTier;
  const isRestricted = currentTier && currentTier !== 'all';
  const isOperationInProgress = isLoading || isSaving;

  // Get allowed tiers based on selection
  const getAllowedTiers = () => {
    if (!selectedTier) return [];
    const tierIndex = TIERS.findIndex(t => t.value === selectedTier);
    return TIERS.filter((t, i) => t.value && i >= tierIndex);
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Current Status */}
      <div className={cn(
        "p-4 rounded-xl border",
        isRestricted 
          ? "bg-amber-500/5 border-amber-500/20" 
          : "bg-emerald-500/5 border-emerald-500/20"
      )}>
        <div className="flex items-center gap-2">
          {isRestricted ? (
            <Lock className="h-4 w-4 text-amber-500" />
          ) : (
            <LockOpen className="h-4 w-4 text-emerald-500" />
          )}
          <span className={cn(
            "text-sm font-medium",
            isRestricted ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
          )}>
            {isRestricted ? `Restricted to ${currentTier}+ tiers` : 'Open to all users'}
          </span>
          {isRestricted && (
            <Badge variant="outline" className={cn("text-[10px] ml-auto", TIER_COLORS[currentTier] || TIER_COLORS.default)}>
              {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}+ only
            </Badge>
          )}
        </div>
      </div>

      {/* Tier Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Minimum Tier Required</Label>
        <Select 
          value={selectedTier || 'all'} 
          onValueChange={(value) => setSelectedTier(value === 'all' ? null : value)}
          disabled={isOperationInProgress}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <SelectItem key={tier.value || 'all'} value={tier.value || 'all'}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      "h-4 w-4",
                      tier.value ? "text-amber-500" : "text-emerald-500"
                    )} />
                    <span>{tier.label}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      — {tier.description}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Allowed Tiers Preview */}
      {selectedTier && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
        >
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Allowed tiers:</p>
          <div className="flex flex-wrap gap-1.5">
            {getAllowedTiers().map(t => (
              <Badge 
                key={t.value} 
                variant="outline" 
                className={cn("text-xs", TIER_COLORS[t.value] || TIER_COLORS.default)}
              >
                {t.value.charAt(0).toUpperCase() + t.value.slice(1)}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {!selectedTier && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            All users can access this gateway (no tier restriction)
          </p>
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleSave}
            disabled={isOperationInProgress}
            className="w-full"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Access Settings
          </Button>
        </motion.div>
      )}

      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        {...confirmation.config}
      />
    </div>
  );
}

/**
 * GatewayCard - Main gateway card component for admin management
 */
export function GatewayCard({
  gateway,
  onToggle,
  onMaintenance,
  onDisableMaintenance,
  // Proxy operations
  onGetProxyConfig,
  onSaveProxy,
  onClearProxy,
  onTestProxy,
  // Pricing operations
  onGetPricing,
  onSavePricing,
  onResetPricing,
  // Tier restriction operations
  onGetTierRestriction,
  onSetTierRestriction,
  onClearTierRestriction,
  isLoading
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('metrics');
  const confirmation = useConfirmation();
  const { success, error: showError } = useToast();

  const isEnabled = gateway.state === 'enabled';
  const isMaintenance = gateway.state === 'maintenance';
  const isDisabled = gateway.state === 'disabled';
  const isSKBased = gateway.id?.startsWith('skbased');

  // Handle toggle with confirmation for disable
  const handleToggle = useCallback(async (checked) => {
    if (checked) {
      onToggle(gateway.id, 'enabled');
    } else {
      const confirmed = await confirmation.confirm({
        title: 'Disable Gateway',
        description: `Disable ${gateway.label}? Users won't be able to use this gateway.`,
        confirmText: 'Disable',
        cancelText: 'Cancel',
        destructive: true
      });
      if (confirmed) {
        onToggle(gateway.id, 'disabled');
      }
    }
  }, [gateway.id, gateway.label, onToggle, confirmation]);

  const handleMaintenanceClick = useCallback(() => {
    if (isMaintenance) {
      onDisableMaintenance(gateway.id);
    } else {
      onMaintenance(gateway);
    }
  }, [gateway, isMaintenance, onMaintenance, onDisableMaintenance]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300",
        // Light mode: white card with warm border (OrangeAI style)
        // Dark mode: glass card effect (OPUX style)
        "bg-white dark:bg-[rgba(30,41,59,0.5)]",
        "dark:backdrop-blur-sm",
        // State-specific styling
        isEnabled && "border-[rgb(237,234,233)] dark:border-white/10 shadow-sm",
        isMaintenance && "border-amber-400/50 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30",
        isDisabled && "border-[rgb(237,234,233)]/60 dark:border-white/5 bg-gray-50 dark:bg-white/5 opacity-75"
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Gateway Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <GatewayStatusIndicator
              state={gateway.state}
              healthStatus={gateway.healthStatus}
              reason={gateway.maintenanceReason}
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate text-[rgb(37,27,24)] dark:text-white">{gateway.label || gateway.id}</h3>
              </div>
              <div className="text-xs text-[rgb(120,113,108)] dark:text-slate-400 flex items-center gap-2">
                <code className="font-mono">{gateway.id}</code>
                {isMaintenance && gateway.maintenanceReason && (
                  <span className="text-amber-600 dark:text-amber-400 truncate max-w-[150px]">
                    • {gateway.maintenanceReason}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge (Desktop) */}
          <div className="hidden sm:block">
            <GatewayStatusBadge
              state={gateway.state}
              healthStatus={gateway.healthStatus}
              reason={gateway.maintenanceReason}
            />
          </div>

          {/* Quick Stats (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            {gateway.healthMetrics && (
              <>
                <div className="text-center px-3">
                  <div className={cn(
                    "text-lg font-bold",
                    (gateway.healthMetrics.successRate ?? 100) >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                    (gateway.healthMetrics.successRate ?? 100) >= 50 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-600 dark:text-red-400"
                  )}>
                    {gateway.healthMetrics.successRate ?? 100}%
                  </div>
                  <div className="text-[10px] text-[rgb(120,113,108)] dark:text-slate-400">Success</div>
                </div>
                <div className="h-8 w-px bg-[rgb(237,234,233)] dark:bg-white/10" />
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={isMaintenance ? "default" : "outline"}
              size="sm"
              onClick={handleMaintenanceClick}
              disabled={isLoading || isDisabled}
              className={cn(
                "h-8",
                isMaintenance && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
              )}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1.5">
                {isMaintenance ? 'End' : 'Maint.'}
              </span>
            </Button>

            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isLoading || isMaintenance}
            />

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </Button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-[rgb(237,234,233)] dark:border-white/10">
              {/* Section Tabs */}
              <div className="flex items-center gap-1 p-2 bg-[rgb(250,247,245)] dark:bg-white/[0.05] border-b border-[rgb(237,234,233)] dark:border-white/10">
                <SectionTab
                  section="metrics"
                  isActive={activeSection === 'metrics'}
                  onClick={() => setActiveSection('metrics')}
                />
                <SectionTab
                  section="proxy"
                  isActive={activeSection === 'proxy'}
                  onClick={() => setActiveSection('proxy')}
                />
                <SectionTab
                  section="pricing"
                  isActive={activeSection === 'pricing'}
                  onClick={() => setActiveSection('pricing')}
                />
                <SectionTab
                  section="access"
                  isActive={activeSection === 'access'}
                  onClick={() => setActiveSection('access')}
                />
              </div>

              {/* Section Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {activeSection === 'metrics' && (
                    <motion.div
                      key="metrics"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <HealthMetricsPanel metrics={gateway.healthMetrics} />
                    </motion.div>
                  )}

                  {activeSection === 'proxy' && (
                    <motion.div
                      key="proxy"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProxyPanel
                        gateway={gateway}
                        onGetConfig={onGetProxyConfig}
                        onSave={onSaveProxy}
                        onClear={onClearProxy}
                        onTest={onTestProxy}
                        isLoading={isLoading}
                      />
                    </motion.div>
                  )}

                  {activeSection === 'pricing' && (
                    <motion.div
                      key="pricing"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <PricingPanel
                        gateway={gateway}
                        onGetPricing={onGetPricing}
                        onSavePricing={onSavePricing}
                        onResetPricing={onResetPricing}
                        isLoading={isLoading}
                      />
                    </motion.div>
                  )}

                  {activeSection === 'access' && (
                    <motion.div
                      key="access"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AccessPanel
                        gateway={gateway}
                        onGetTierRestriction={onGetTierRestriction}
                        onSetTierRestriction={onSetTierRestriction}
                        onClearTierRestriction={onClearTierRestriction}
                        isLoading={isLoading}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setOpen}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        {...confirmation.config}
      />
    </motion.div>
  );
}

export default GatewayCard;
