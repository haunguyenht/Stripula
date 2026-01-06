import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Server, CreditCard, ShoppingBag, ChevronDown, Activity, 
  CheckCircle2, AlertTriangle, XCircle, Wifi, WifiOff,
  Zap, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const PARENT_TYPE_CONFIG = {
  stripe: { 
    icon: CreditCard, 
    label: 'Stripe', 
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'violet'
  },
  shopify: { 
    icon: ShoppingBag, 
    label: 'Shopify', 
    gradient: 'from-emerald-500 to-green-600',
    glowColor: 'emerald'
  },
  braintree: { 
    icon: CreditCard, 
    label: 'Braintree', 
    gradient: 'from-blue-500 to-indigo-600',
    glowColor: 'blue'
  },
  paypal: { 
    icon: CreditCard, 
    label: 'PayPal', 
    gradient: 'from-sky-500 to-blue-600',
    glowColor: 'sky'
  },
  other: { 
    icon: Server, 
    label: 'Other', 
    gradient: 'from-slate-500 to-zinc-600',
    glowColor: 'slate'
  }
};

const SUB_TYPE_LABELS = {
  auth: 'Auth',
  charge: 'Charge',
  'skbased-auth': 'SK Auth',
  'skbased': 'SK Charge',
  default: 'General'
};

function groupGatewaysByType(gateways) {
  if (!gateways || !Array.isArray(gateways)) return {};
  return gateways.reduce((acc, gateway) => {
    const parentType = gateway.parentType || 'other';
    const subType = gateway.subType || 'default';
    if (!acc[parentType]) acc[parentType] = {};
    if (!acc[parentType][subType]) acc[parentType][subType] = [];
    acc[parentType][subType].push(gateway);
    return acc;
  }, {});
}

/**
 * Enhanced status indicator with glow effect
 */
function StatusIndicator({ status, size = 'md' }) {
  const sizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  };

  const statusConfig = {
    online: {
      color: 'bg-emerald-500',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]',
      ping: true
    },
    maintenance: {
      color: 'bg-amber-500',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      ping: false,
      pulse: true
    },
    degraded: {
      color: 'bg-orange-500',
      glow: 'shadow-[0_0_6px_rgba(249,115,22,0.5)]',
      ping: false
    },
    disabled: {
      color: 'bg-slate-400 dark:bg-slate-600',
      glow: '',
      ping: false
    },
    offline: {
      color: 'bg-red-500',
      glow: 'shadow-[0_0_6px_rgba(239,68,68,0.5)]',
      ping: false
    }
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <span className={cn("relative flex", sizes[size])}>
      {config.ping && (
        <span className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
          config.color
        )} />
      )}
      {config.pulse && (
        <span className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-60 animate-pulse",
          config.color
        )} />
      )}
      <span className={cn(
        "relative inline-flex rounded-full",
        sizes[size],
        config.color,
        config.glow
      )} />
    </span>
  );
}

/**
 * Premium gateway chip with glass morphism
 */
function GatewayChip({ gateway, delay = 0 }) {
  const { id, label, state, healthStatus, maintenanceReason } = gateway;
  
  const status = state === 'maintenance' ? 'maintenance' : 
    state === 'disabled' ? 'disabled' :
    (state === 'enabled' && healthStatus === 'online') ? 'online' : 
    (state === 'enabled' && healthStatus === 'degraded') ? 'degraded' : 'offline';

  const isOnline = status === 'online';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            delay, 
            type: "spring", 
            stiffness: 400, 
            damping: 25 
          }}
          whileHover={{ scale: 1.03, y: -2 }}
          className={cn(
            "group relative inline-flex items-center gap-2.5 px-4 py-2",
            "text-xs font-semibold rounded-xl cursor-default select-none",
            "transition-all duration-300",
            // Light mode
            "bg-white/90 hover:bg-white",
            "border shadow-sm",
            // Dark mode - glass
            "dark:bg-white/[0.06] dark:hover:bg-white/[0.1]",
            "dark:backdrop-blur-md",
            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
            // Status borders
            isOnline && [
              "border-emerald-500/40 dark:border-emerald-500/30",
              "hover:border-emerald-500/60 dark:hover:border-emerald-500/50",
              "dark:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]"
            ],
            status === 'maintenance' && "border-amber-500/40 dark:border-amber-500/30",
            status === 'degraded' && "border-orange-500/40 dark:border-orange-500/30",
            status === 'offline' && "border-red-500/30 dark:border-red-500/20",
            status === 'disabled' && "border-border/30 dark:border-white/[0.06] opacity-50"
          )}
        >
          {/* Subtle gradient overlay for online */}
          {isOnline && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/[0.03] to-transparent pointer-events-none" />
          )}
          
          <StatusIndicator status={status} size="md" />
          
          <span className={cn(
            "relative text-foreground/90 tracking-wide",
            status === 'disabled' && "line-through opacity-60"
          )}>
            {label || id}
          </span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className={cn(
          "px-3 py-2 text-xs",
          "bg-popover/95 backdrop-blur-sm",
          "border border-border/50"
        )}
      >
        <div className="flex items-center gap-2 font-medium">
          <StatusIndicator status={status} size="sm" />
          <span className="capitalize">{status}</span>
        </div>
        {maintenanceReason && (
          <p className="text-muted-foreground mt-1.5 text-[10px] max-w-[200px] leading-relaxed">
            {maintenanceReason}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Collapsible type section with enhanced styling
 */
function TypeSection({ parentType, subGroups, delay = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = PARENT_TYPE_CONFIG[parentType] || PARENT_TYPE_CONFIG.other;
  const Icon = config.icon;
  
  const allGateways = Object.values(subGroups).flat();
  
  // Count each status
  const counts = allGateways.reduce((acc, g) => {
    if (g.state === 'maintenance') acc.maintenance++;
    else if (g.state === 'disabled') acc.disabled++;
    else if (g.state === 'enabled' && g.healthStatus === 'online') acc.online++;
    else if (g.state === 'enabled' && g.healthStatus === 'degraded') acc.degraded++;
    else acc.offline++; // enabled but offline, or any other state
    return acc;
  }, { online: 0, offline: 0, degraded: 0, maintenance: 0, disabled: 0 });
  
  const totalCount = allGateways.length;
  const allOnline = counts.online === totalCount;
  const allOffline = counts.online === 0;
  
  // Build status summary - show issues first, then online
  const statusParts = [];
  if (counts.offline > 0) statusParts.push({ count: counts.offline, label: 'offline', color: 'text-red-600 dark:text-red-400', icon: '🔴' });
  if (counts.degraded > 0) statusParts.push({ count: counts.degraded, label: 'degraded', color: 'text-orange-600 dark:text-orange-400', icon: '🟠' });
  if (counts.maintenance > 0) statusParts.push({ count: counts.maintenance, label: 'maintenance', color: 'text-amber-600 dark:text-amber-400', icon: '🟡' });
  if (counts.disabled > 0) statusParts.push({ count: counts.disabled, label: 'disabled', color: 'text-muted-foreground', icon: '⚫' });
  if (counts.online > 0) statusParts.push({ count: counts.online, label: 'online', color: 'text-emerald-600 dark:text-emerald-400', icon: '🟢' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        // Light mode
        "bg-gradient-to-br from-white/80 to-white/40",
        "border border-border/50",
        "shadow-[0_4px_20px_rgba(0,0,0,0.04)]",
        // Dark mode - glass
        "dark:from-white/[0.04] dark:to-white/[0.02]",
        "dark:border-white/[0.08]",
        "dark:backdrop-blur-lg",
        "dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]"
      )}
    >
      {/* Gradient accent line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        "bg-gradient-to-b",
        config.gradient
      )} />
      
      {/* Decorative glow */}
      <div className={cn(
        "absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none",
        "bg-gradient-to-br",
        config.gradient
      )} />
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-full flex items-center gap-4 pl-6 pr-5 py-4",
          "transition-colors duration-200",
          "hover:bg-accent/30 dark:hover:bg-white/[0.03]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
        )}
      >
        {/* Icon with gradient */}
        <motion.div 
          className={cn(
            "flex items-center justify-center w-11 h-11 rounded-xl",
            "bg-gradient-to-br shadow-lg",
            config.gradient
          )}
          whileHover={{ scale: 1.05, rotate: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
        </motion.div>
        
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm font-bold text-foreground tracking-wide">
            {config.label}
          </span>
          {/* Status summary */}
          <p className="text-[10px] mt-0.5 flex items-center gap-1 flex-wrap">
            {statusParts.map((part, i) => (
              <span key={part.label} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-muted-foreground/50 mx-0.5">•</span>}
                <span className={cn("font-bold tabular-nums", part.color)}>{part.count}</span>
                <span className="text-muted-foreground">{part.label}</span>
              </span>
            ))}
          </p>
        </div>
        
        {/* Status badge */}
        <motion.div 
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold",
            "transition-colors duration-200",
            allOnline && [
              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              "border border-emerald-500/20"
            ],
            allOffline && [
              "bg-red-500/10 text-red-600 dark:text-red-400",
              "border border-red-500/20"
            ],
            !allOnline && !allOffline && [
              "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              "border border-amber-500/20"
            ]
          )}
          whileHover={{ scale: 1.02 }}
        >
          {allOnline ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : allOffline ? (
            <XCircle className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          <span className="tabular-nums">{counts.online}/{totalCount}</span>
        </motion.div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted-foreground ml-1"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pl-6 pr-5 pb-5 pt-1 space-y-5">
              {Object.entries(subGroups).map(([subType, gateways], subIndex) => (
                <div key={subType}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-md",
                      "bg-muted/50 dark:bg-white/[0.06]"
                    )}>
                      <Zap className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                      {SUB_TYPE_LABELS[subType] || subType}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent dark:from-white/[0.06]" />
                    <span className="text-[10px] font-semibold text-muted-foreground/60 tabular-nums">
                      {gateways.filter(g => g.state === 'enabled' && g.healthStatus === 'online').length}/{gateways.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {gateways.map((gateway, index) => (
                      <GatewayChip 
                        key={gateway.id} 
                        gateway={gateway}
                        delay={(subIndex * 0.04) + (index * 0.025)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Status legend with refined styling
 */
function StatusLegend() {
  const items = [
    { status: 'online', label: 'Online', icon: Wifi },
    { status: 'maintenance', label: 'Maintenance', icon: Shield },
    { status: 'degraded', label: 'Degraded', icon: AlertTriangle },
    { status: 'offline', label: 'Offline', icon: WifiOff }
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-muted-foreground">
      {items.map(({ status, label, icon: ItemIcon }) => (
        <div key={status} className="flex items-center gap-2">
          <StatusIndicator status={status} size="sm" />
          <span className="tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * GatewayOverview - Premium gateway status monitor with glass morphism
 */
function GatewayOverviewComponent({ gateways, isLoading = false, className }) {
  const grouped = useMemo(() => groupGatewaysByType(gateways), [gateways]);
  
  const typeOrder = ['stripe', 'shopify', 'braintree', 'paypal', 'other'];
  const sortedTypes = Object.keys(grouped).sort((a, b) => {
    const aIndex = typeOrder.indexOf(a);
    const bIndex = typeOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  const totalGateways = gateways?.length || 0;
  const onlineGateways = gateways?.filter(g => g.state === 'enabled' && g.healthStatus === 'online').length || 0;

  return (
    <div className={cn(
      "relative rounded-3xl overflow-hidden",
      // Light mode
      "bg-card/80 backdrop-blur-sm",
      "border border-border/60",
      "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
      // Dark mode - OPUX glass
      "dark:bg-white/[0.03] dark:backdrop-blur-xl",
      "dark:border-white/[0.08]",
      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",
      className
    )}>
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-0 dark:opacity-[0.15] pointer-events-none bg-[image:var(--noise-pattern-subtle)] bg-repeat" />
      
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-2xl",
                "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
                "dark:from-primary/30 dark:via-primary/15 dark:to-transparent",
                "border border-primary/20 dark:border-primary/30",
                "shadow-lg shadow-primary/10"
              )}
              animate={{ 
                scale: [1, 1.03, 1],
                rotate: [0, 1, -1, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Activity className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Gateway Status
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time health monitor • <span className="font-semibold text-foreground">{onlineGateways}</span>/{totalGateways} online
              </p>
            </div>
          </div>
          <StatusLegend />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative px-6 pb-6 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div 
                key={i} 
                className={cn(
                  "h-20 rounded-2xl overflow-hidden",
                  "bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40",
                  "dark:from-white/[0.04] dark:via-white/[0.02] dark:to-white/[0.04]"
                )}
              >
                <motion.div
                  className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ))}
          </div>
        ) : sortedTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <motion.div 
              className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center mb-5",
                "bg-gradient-to-br from-muted/60 to-muted/30",
                "dark:from-white/[0.06] dark:to-white/[0.02]",
                "border border-border/30 dark:border-white/[0.06]"
              )}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Server className="w-10 h-10 text-muted-foreground/40" />
            </motion.div>
            <p className="text-sm font-semibold text-muted-foreground">No gateways configured</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Gateways will appear here when added</p>
          </div>
        ) : (
          sortedTypes.map((parentType, index) => (
            <TypeSection
              key={parentType}
              parentType={parentType}
              subGroups={grouped[parentType]}
              delay={index * 0.08}
            />
          ))
        )}
      </div>
    </div>
  );
}

export const GatewayOverview = memo(GatewayOverviewComponent);
export { groupGatewaysByType };
export default GatewayOverview;
