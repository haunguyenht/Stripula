import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./tooltip";

/**
 * GatewayStatusIndicator Component
 * Shows colored dot/badge based on gateway status with tooltip
 * 
 * Requirements: 5.1, 5.2, 5.3
 * 
 * @param {Object} props
 * @param {string} props.status - Gateway status: 'online' | 'degraded' | 'offline' | 'maintenance'
 * @param {string} props.state - Gateway state: 'enabled' | 'maintenance' | 'disabled'
 * @param {string} props.reason - Maintenance reason (optional)
 * @param {boolean} props.showLabel - Whether to show status label text
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg'
 * @param {string} props.className - Additional CSS classes
 */

// Status configuration
const STATUS_CONFIG = {
  online: {
    color: 'bg-emerald-500',
    pulseColor: 'bg-emerald-400',
    label: 'Online',
    badgeVariant: 'success',
    description: 'Gateway is operational'
  },
  degraded: {
    color: 'bg-amber-500',
    pulseColor: 'bg-amber-400',
    label: 'Degraded',
    badgeVariant: 'warning',
    description: 'Gateway is experiencing issues'
  },
  offline: {
    color: 'bg-red-500',
    pulseColor: 'bg-red-400',
    label: 'Offline',
    badgeVariant: 'destructive',
    description: 'Gateway is not responding'
  },
  maintenance: {
    color: 'bg-slate-400 dark:bg-slate-500',
    pulseColor: null, // No pulse for maintenance
    label: 'Maintenance',
    badgeVariant: 'secondary',
    description: 'Gateway is under maintenance'
  },
  disabled: {
    color: 'bg-slate-300 dark:bg-slate-600',
    pulseColor: null,
    label: 'Disabled',
    badgeVariant: 'outline',
    description: 'Gateway is disabled'
  }
};

// Size configuration
const SIZE_CONFIG = {
  sm: {
    dot: 'h-2 w-2',
    pulse: 'h-2 w-2',
    text: 'text-xs'
  },
  md: {
    dot: 'h-2.5 w-2.5',
    pulse: 'h-2.5 w-2.5',
    text: 'text-sm'
  },
  lg: {
    dot: 'h-3 w-3',
    pulse: 'h-3 w-3',
    text: 'text-base'
  }
};

/**
 * Determine effective status from state and health
 */
function getEffectiveStatus(state, healthStatus) {
  // State takes precedence
  if (state === 'maintenance') return 'maintenance';
  if (state === 'disabled') return 'disabled';
  
  // Then health status
  if (healthStatus === 'offline') return 'offline';
  if (healthStatus === 'degraded') return 'degraded';
  
  return 'online';
}

/**
 * Status Dot Component
 * Colored dot with optional pulse animation
 */
function StatusDot({ status, size = 'md', className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.online;
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  
  return (
    <span className={cn("relative flex", className)}>
      {/* Pulse animation for active statuses */}
      {config.pulseColor && (
        <span
          className={cn(
            "absolute inline-flex rounded-full opacity-75 animate-ping",
            config.pulseColor,
            sizeConfig.pulse
          )}
        />
      )}
      {/* Solid dot */}
      <span
        className={cn(
          "relative inline-flex rounded-full",
          config.color,
          sizeConfig.dot
        )}
      />
    </span>
  );
}

/**
 * Main GatewayStatusIndicator Component
 * @param {boolean} showTooltip - Whether to show tooltip (disable in dropdowns)
 */
export function GatewayStatusIndicator({
  status,
  state,
  healthStatus,
  reason,
  showLabel = false,
  showTooltip = false,
  size = 'md',
  className
}) {
  // Determine effective status
  const effectiveStatus = status || getEffectiveStatus(state, healthStatus);
  const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.online;
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  
  // Status dot content
  const statusContent = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        className
      )}
    >
      <StatusDot status={effectiveStatus} size={size} />
      {showLabel && (
        <span className={cn("text-muted-foreground", sizeConfig.text)}>
          {config.label}
        </span>
      )}
    </span>
  );

  // Don't show tooltip inside dropdowns - causes positioning issues
  if (!showTooltip) {
    return statusContent;
  }
  
  // Build tooltip content
  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">{config.label}</div>
      <div className="text-muted-foreground">{config.description}</div>
      {reason && effectiveStatus === 'maintenance' && (
        <div className="pt-1 border-t border-border/50">
          <span className="text-muted-foreground">Reason: </span>
          <span>{reason}</span>
        </div>
      )}
    </div>
  );

  // Render with tooltip
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {statusContent}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * GatewayStatusBadge Component
 * Badge variant showing status with label
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
export function GatewayStatusBadge({
  status,
  state,
  healthStatus,
  reason,
  className
}) {
  const effectiveStatus = status || getEffectiveStatus(state, healthStatus);
  const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.online;
  
  // Build tooltip content for maintenance reason
  const badgeContent = (
    <Badge variant={config.badgeVariant} className={cn("gap-1.5", className)}>
      <StatusDot status={effectiveStatus} size="sm" />
      {config.label}
    </Badge>
  );

  // If there's a maintenance reason, wrap in tooltip
  if (reason && effectiveStatus === 'maintenance') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div>
            <span className="text-muted-foreground">Reason: </span>
            <span>{reason}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badgeContent;
}

/**
 * GatewayUnavailableMessage Component
 * Message shown when gateway is unavailable
 * 
 * Requirement: 5.4, 5.5
 */
export function GatewayUnavailableMessage({
  gateway,
  allUnavailable = false,
  className
}) {
  if (allUnavailable) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg",
        "bg-amber-500/10 border border-amber-500/20",
        "text-amber-700 dark:text-amber-400",
        className
      )}>
        <StatusDot status="offline" size="md" />
        <span className="text-sm">
          All gateways of this type are currently unavailable. Please try again later.
        </span>
      </div>
    );
  }

  if (!gateway) return null;

  const effectiveStatus = getEffectiveStatus(gateway.state, gateway.healthStatus);
  const config = STATUS_CONFIG[effectiveStatus];

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg",
      "bg-amber-500/10 border border-amber-500/20",
      "text-amber-700 dark:text-amber-400",
      className
    )}>
      <StatusDot status={effectiveStatus} size="md" />
      <div className="flex-1 text-sm">
        <span className="font-medium">{gateway.label || gateway.id}</span>
        <span> is currently {config.label.toLowerCase()}.</span>
        {gateway.maintenanceReason && (
          <span className="block text-muted-foreground mt-0.5">
            {gateway.maintenanceReason}
          </span>
        )}
      </div>
    </div>
  );
}

export default GatewayStatusIndicator;
