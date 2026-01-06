import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

/**
 * Hook to show tier expiration warnings
 * 
 * Shows toast warnings when:
 * - User logs in and tier is expiring within 7 days (Requirements: 4.1)
 * - User logs in and tier is expiring within 24 hours - urgent warning (Requirements: 4.2)
 * - User's tier expires while they're using the app (Requirements: 4.4, 4.5)
 * 
 * Only shows warning once per session to avoid spam (Requirements: 4.3)
 * 
 * @returns {Object} Expiration info for components to use
 */
export function useTierExpirationWarning() {
  const { user, tierExpiration, isAuthenticated, refreshUser } = useAuth();
  const { warning, error } = useToast();
  
  // Session-based deduplication refs (Requirements: 4.3)
  // Track if we've shown the 7-day warning this session
  const hasShown7DayWarning = useRef(false);
  // Track if we've shown the 24-hour urgent warning this session
  const hasShown24HourWarning = useRef(false);
  // Track if we've shown the expired notification this session
  const hasShownExpired = useRef(false);
  // Track the previous tier to detect expiration during session
  const previousTier = useRef(null);
  // Debounce timer
  const lastCheckTime = useRef(0);
  
  /**
   * Reset all warning flags
   * Called on logout to ensure warnings show again on next login
   */
  const resetWarningFlags = useCallback(() => {
    hasShown7DayWarning.current = false;
    hasShown24HourWarning.current = false;
    hasShownExpired.current = false;
    previousTier.current = null;
  }, []);
  
  useEffect(() => {
    // Reset flags on logout (Requirements: 4.3 - reset on logout)
    if (!isAuthenticated || !user) {
      resetWarningFlags();
      return;
    }
    
    // Store current tier for detecting expiration during session
    if (previousTier.current === null && user.tier) {
      previousTier.current = user.tier;
    }
    
    // Skip if no tier expiration info (permanent tier)
    if (!tierExpiration || tierExpiration.daysRemaining === null) {
      return;
    }
    
    const now = Date.now();
    
    // Debounce - don't check more than once per 5 seconds
    if (now - lastCheckTime.current < 5000) return;
    lastCheckTime.current = now;
    
    const { isExpired, isExpiringSoon, daysRemaining } = tierExpiration;
    
    // Calculate hours remaining for 24-hour warning
    const hoursRemaining = tierExpiration.expiresAt 
      ? Math.max(0, (new Date(tierExpiration.expiresAt) - new Date()) / (1000 * 60 * 60))
      : null;
    
    // Handle expired tier (Requirements: 4.4, 4.5)
    if (isExpired && !hasShownExpired.current) {
      hasShownExpired.current = true;
      
      // Check if tier changed during session (expired while using app)
      const tierChangedDuringSession = previousTier.current && 
        previousTier.current !== 'free' && 
        user.tier === 'free';
      
      if (tierChangedDuringSession) {
        // Tier expired during session (Requirements: 4.4)
        error(
          `Your ${previousTier.current} tier has expired. You've been downgraded to free tier.`,
          { duration: 10000 }
        );
      } else {
        // Tier was already expired on login
        error(
          `Your tier subscription has expired. You're now on the free tier.`,
          { duration: 10000 }
        );
      }
      
      // Trigger user data refresh on expiration (Requirements: 4.5)
      refreshUser();
      previousTier.current = user.tier;
      return;
    }
    
    // Handle 24-hour urgent warning (Requirements: 4.2)
    // Show urgent toast for tier expiring within 24 hours
    if (hoursRemaining !== null && hoursRemaining <= 24 && hoursRemaining > 0 && !hasShown24HourWarning.current) {
      hasShown24HourWarning.current = true;
      // Also mark 7-day as shown since 24-hour is more urgent
      hasShown7DayWarning.current = true;
      
      let urgentMessage = '';
      if (hoursRemaining < 1) {
        const minutesRemaining = Math.ceil(hoursRemaining * 60);
        urgentMessage = `⚠️ URGENT: Your ${user.tier} tier expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}!`;
      } else if (daysRemaining === 0) {
        urgentMessage = `⚠️ URGENT: Your ${user.tier} tier expires today!`;
      } else {
        const hours = Math.ceil(hoursRemaining);
        urgentMessage = `⚠️ URGENT: Your ${user.tier} tier expires in ${hours} hour${hours !== 1 ? 's' : ''}!`;
      }
      
      // Use error toast for urgent warnings (stays longer, more prominent)
      error(urgentMessage, { duration: 15000 });
      return;
    }
    
    // Handle 7-day warning (Requirements: 4.1)
    // Show toast for tier expiring within 7 days on login
    if (isExpiringSoon && !hasShown7DayWarning.current && daysRemaining > 0) {
      hasShown7DayWarning.current = true;
      
      let message = '';
      if (daysRemaining === 1) {
        message = `Your ${user.tier} tier expires tomorrow. Consider renewing soon!`;
      } else {
        message = `Your ${user.tier} tier expires in ${daysRemaining} days.`;
      }
      
      warning(message, { duration: 8000 });
    }
    
    // Update previous tier reference
    previousTier.current = user.tier;
    
  }, [isAuthenticated, user, tierExpiration, warning, error, refreshUser, resetWarningFlags]);
  
  // Return expiration info for components to use
  return {
    isExpired: tierExpiration?.isExpired ?? false,
    isExpiringSoon: tierExpiration?.isExpiringSoon ?? false,
    daysRemaining: tierExpiration?.daysRemaining ?? null,
    tierExpiresAt: user?.tierExpiresAt ?? null
  };
}

export default useTierExpirationWarning;
