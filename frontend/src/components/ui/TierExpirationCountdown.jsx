import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * Calculate time remaining from expiration date
 * Returns urgency levels: normal, notice, warning, critical, expired
 * 
 * Urgency classification (per design Property 8):
 * - 'expired': timestamp is in the past
 * - 'critical': expiring within 24 hours
 * - 'warning': expiring within 1-3 days
 * - 'notice': expiring within 4-7 days
 * - 'normal': expiring in more than 7 days
 * 
 * @param {string|Date|null} expiresAt - Expiration timestamp (null for permanent tiers)
 * @returns {Object|null} Time remaining details or null for permanent/invalid
 * 
 * Requirements: 3.3, 3.4, 3.5
 */
export function calculateTimeRemaining(expiresAt) {
  // Handle null/undefined (permanent tier)
  if (!expiresAt) return null;
  
  // Parse the date and validate
  const expDate = new Date(expiresAt);
  
  // Handle invalid dates
  if (isNaN(expDate.getTime())) return null;
  
  const now = new Date();
  const diffMs = expDate - now;
  
  // Handle expired tiers (past dates)
  if (diffMs <= 0) {
    return { 
      expired: true, 
      text: 'Expired', 
      urgency: 'expired',
      days: 0,
      hours: 0,
      minutes: 0,
      expiresAt: expDate
    };
  }
  
  // Calculate time components
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  // Determine urgency level based on Property 8 classification
  let urgency = 'normal';
  let text = '';
  
  if (totalHours < 24) {
    // Critical: expiring within 24 hours
    urgency = 'critical';
    if (hours === 0) {
      text = minutes === 1 ? '1 minute remaining' : `${minutes} minutes remaining`;
    } else if (hours === 1) {
      text = minutes > 0 ? `1h ${minutes}m remaining` : '1 hour remaining';
    } else {
      text = minutes > 0 ? `${hours}h ${minutes}m remaining` : `${hours} hours remaining`;
    }
  } else if (days <= 3) {
    // Warning: expiring within 1-3 days
    urgency = 'warning';
    text = days === 1 ? '1 day remaining' : `${days} days remaining`;
  } else if (days <= 7) {
    // Notice: expiring within 4-7 days
    urgency = 'notice';
    text = `${days} days remaining`;
  } else {
    // Normal: expiring in more than 7 days
    urgency = 'normal';
    text = `${days} days remaining`;
  }
  
  return {
    expired: false,
    text,
    urgency,
    days,
    hours,
    minutes,
    expiresAt: expDate
  };
}

/**
 * Get urgency styling
 */
function getUrgencyStyles(urgency) {
  switch (urgency) {
    case 'expired':
      return {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        border: 'border-red-500/30 dark:border-red-400/30',
        text: 'text-red-600 dark:text-red-400',
        icon: AlertTriangle,
        pulse: false
      };
    case 'critical':
      return {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        border: 'border-red-500/30 dark:border-red-400/30',
        text: 'text-red-600 dark:text-red-400',
        icon: AlertTriangle,
        pulse: true
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        border: 'border-amber-500/30 dark:border-amber-400/30',
        text: 'text-amber-600 dark:text-amber-400',
        icon: Clock,
        pulse: true
      };
    case 'notice':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        border: 'border-amber-500/30 dark:border-amber-400/30',
        text: 'text-amber-600 dark:text-amber-400',
        icon: Clock,
        pulse: false
      };
    default:
      return {
        bg: 'bg-muted/50',
        border: 'border-muted-foreground/20',
        text: 'text-muted-foreground',
        icon: Timer,
        pulse: false
      };
  }
}

/**
 * TierExpirationCountdown - Shows countdown to tier expiration
 * 
 * @param {Object} props
 * @param {string} props.expiresAt - ISO timestamp of expiration
 * @param {string} props.tier - Tier name (for display)
 * @param {string} props.variant - 'badge' | 'full' | 'compact' | 'inline'
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onExpired - Callback when tier expires
 */
export function TierExpirationCountdown({ 
  expiresAt, 
  tier = 'unknown',
  variant = 'badge',
  className,
  onExpired
}) {
  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining(expiresAt));
  
  // Update countdown every minute (or every second if critical)
  useEffect(() => {
    if (!expiresAt) return;
    
    const updateInterval = timeRemaining?.urgency === 'critical' ? 1000 : 60000;
    
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);
      
      if (remaining?.expired && onExpired) {
        onExpired();
      }
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [expiresAt, timeRemaining?.urgency, onExpired]);
  
  // Re-calculate when expiresAt changes
  useEffect(() => {
    setTimeRemaining(calculateTimeRemaining(expiresAt));
  }, [expiresAt]);
  
  if (!expiresAt || !timeRemaining) return null;
  
  const styles = getUrgencyStyles(timeRemaining.urgency);
  const Icon = styles.icon;
  
  // Badge variant - minimal
  if (variant === 'badge') {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "text-[10px] px-1.5 py-0 h-4 gap-1",
          styles.border,
          styles.text,
          styles.pulse && "animate-pulse",
          className
        )}
      >
        <Icon className="w-2.5 h-2.5" />
        {timeRemaining.text}
      </Badge>
    );
  }
  
  // Inline variant - for lists
  if (variant === 'inline') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-xs",
        styles.text,
        styles.pulse && "animate-pulse",
        className
      )}>
        <Icon className="w-3 h-3" />
        {timeRemaining.text}
      </span>
    );
  }
  
  // Compact variant - for navigation
  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs",
        styles.bg,
        styles.border,
        "border",
        styles.pulse && "animate-pulse",
        className
      )}>
        <Icon className={cn("w-3 h-3", styles.text)} />
        <span className={cn("font-medium", styles.text)}>
          {timeRemaining.days > 0 ? `${timeRemaining.days}d` : `${timeRemaining.hours}h`}
        </span>
      </div>
    );
  }
  
  // Full variant - detailed display
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border",
        styles.bg,
        styles.border,
        styles.pulse && "animate-pulse",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg",
        styles.bg
      )}>
        <Icon className={cn("w-5 h-5", styles.text)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", styles.text)}>
          {timeRemaining.expired ? 'Subscription Expired' : 'Subscription Expiring'}
        </p>
        <p className="text-xs text-muted-foreground">
          {timeRemaining.expired 
            ? `Your ${tier} tier has expired`
            : timeRemaining.text
          }
        </p>
      </div>
      
      {!timeRemaining.expired && timeRemaining.days <= 7 && (
        <div className="text-right">
          <div className={cn("text-lg font-bold tabular-nums", styles.text)}>
            {timeRemaining.days > 0 
              ? timeRemaining.days 
              : `${timeRemaining.hours}:${String(timeRemaining.minutes).padStart(2, '0')}`
            }
          </div>
          <div className="text-[10px] text-muted-foreground uppercase">
            {timeRemaining.days > 0 ? 'days' : 'hours'}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * TierExpirationBadge - Simple badge for headers/navigation
 */
export function TierExpirationBadge({ expiresAt, className }) {
  const timeRemaining = useMemo(() => calculateTimeRemaining(expiresAt), [expiresAt]);
  
  if (!expiresAt || !timeRemaining || timeRemaining.days > 7) return null;
  
  const styles = getUrgencyStyles(timeRemaining.urgency);
  const Icon = styles.icon;
  
  return (
    <div className={cn(
      "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
      styles.bg,
      styles.text,
      styles.pulse && "animate-pulse",
      className
    )}>
      <Icon className="w-2.5 h-2.5" />
      {timeRemaining.days > 0 ? `${timeRemaining.days}d` : `${timeRemaining.hours}h`}
    </div>
  );
}

/**
 * Helper: Get tier expiration status for conditional rendering
 */
export function useTierExpirationStatus(expiresAt) {
  const [status, setStatus] = useState(() => calculateTimeRemaining(expiresAt));
  
  useEffect(() => {
    if (!expiresAt) {
      setStatus(null);
      return;
    }
    
    setStatus(calculateTimeRemaining(expiresAt));
    
    const interval = setInterval(() => {
      setStatus(calculateTimeRemaining(expiresAt));
    }, 60000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  return {
    status,
    isExpired: status?.expired ?? false,
    isExpiringSoon: status ? (status.days <= 7 && !status.expired) : false,
    isUrgent: status ? ['critical', 'warning'].includes(status.urgency) : false,
    daysRemaining: status?.days ?? null
  };
}

export default TierExpirationCountdown;
