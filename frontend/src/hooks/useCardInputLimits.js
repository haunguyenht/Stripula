import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gatewaySSE } from '@/lib/services/gatewaySSE';

/**
 * useCardInputLimits Hook
 * 
 * Fetches tier-based card input limits from backend and subscribes to shared SSE
 * for real-time updates. No fallback defaults - database values are required.
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @returns {Object} - Tier limits data and methods
 */

const API_BASE = '/api';

// Warning threshold (80% of limit)
const WARNING_THRESHOLD = 0.8;

export function useCardInputLimits() {
  const subscriberId = useId();
  const { user, isAuthenticated } = useAuth();
  
  // State - start with null/empty to indicate no data loaded
  const [limits, setLimits] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Get user's tier
  const userTier = useMemo(() => {
    return user?.tier || 'free';
  }, [user]);

  /**
   * Fetch tier limits from API
   * No fallback defaults - database values are required
   */
  const fetchLimits = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/system/tier-limits`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.limits) {
          setLimits(data.limits);
          setMetadata(data.metadata || {});
          setLastUpdate(new Date(data.timestamp));
          setError(null);
        } else {
          setError(data.error?.message || 'Failed to fetch tier limits');
          setLimits(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error?.message || 'Failed to fetch tier limits');
        setLimits(null);
      }
    } catch (err) {
      setError('Network error - tier limits unavailable');
      setLimits(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Handle SSE events from shared service
   */
  const handleSSEEvent = useCallback((data) => {
    // Handle single tier limit change
    if (data.type === 'tierLimitChange') {
      setLimits(prev => ({
        ...prev,
        [data.tier]: data.newLimit
      }));
      setMetadata(prev => ({
        ...prev,
        [data.tier]: {
          ...prev[data.tier],
          isCustom: data.isCustom,
          updatedAt: data.timestamp
        }
      }));
      setLastUpdate(new Date(data.timestamp));
    }
    
    // Handle tier limits reset
    if (data.type === 'tierLimitsReset') {
      setLimits(data.newLimits);
      const resetMetadata = {};
      Object.keys(data.newLimits).forEach(tier => {
        resetMetadata[tier] = {
          isCustom: false,
          updatedAt: data.timestamp
        };
      });
      setMetadata(resetMetadata);
      setLastUpdate(new Date(data.timestamp));
    }
  }, []);

  // Fetch limits on mount and when auth changes
  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // Subscribe to shared SSE service
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const unsubscribe = gatewaySSE.subscribe(`limits-${subscriberId}`, handleSSEEvent);
    return unsubscribe;
  }, [subscriberId, isAuthenticated, handleSSEEvent]);

  /**
   * Get limit for a specific tier
   * Returns null if limits not loaded or tier not found
   */
  const getUserLimit = useCallback((tier) => {
    if (!limits) return null;
    const normalizedTier = (tier || 'free').toLowerCase();
    const limit = limits[normalizedTier];
    return limit !== undefined ? limit : null;
  }, [limits]);

  /**
   * Get limit for the current user's tier
   */
  const getCurrentUserLimit = useCallback(() => {
    return getUserLimit(userTier);
  }, [getUserLimit, userTier]);

  /**
   * Check if card count is within the tier limit
   */
  const isWithinLimit = useCallback((cardCount, tier) => {
    const targetTier = tier || userTier;
    const limit = getUserLimit(targetTier);
    return cardCount <= limit;
  }, [getUserLimit, userTier]);

  /**
   * Get detailed limit status for a card count
   * Returns error status if limits not loaded
   */
  const getLimitStatus = useCallback((cardCount, tier) => {
    const targetTier = tier || userTier;
    const limit = getUserLimit(targetTier);
    
    // If limit is null (not loaded), return error status
    if (limit === null) {
      return {
        isWithinLimit: false,
        limit: null,
        cardCount,
        excess: 0,
        percentage: 0,
        remaining: 0,
        isWarning: false,
        isError: true,
        tier: targetTier,
        unavailable: true,
        errorMessage: 'Tier limits not loaded'
      };
    }

    const withinLimit = cardCount <= limit;
    const excess = withinLimit ? 0 : cardCount - limit;
    const percentage = limit > 0 ? (cardCount / limit) * 100 : 0;
    const isWarning = percentage >= WARNING_THRESHOLD * 100 && withinLimit;
    const isErrorStatus = !withinLimit;

    return {
      isWithinLimit: withinLimit,
      limit,
      cardCount,
      excess,
      percentage: Math.min(percentage, 100),
      remaining: Math.max(0, limit - cardCount),
      isWarning,
      isError: isErrorStatus,
      tier: targetTier,
      unavailable: false
    };
  }, [getUserLimit, userTier]);

  /**
   * Check if limits data is available
   */
  const isAvailable = useMemo(() => {
    return limits !== null && !error;
  }, [limits, error]);

  /**
   * Check if a tier has a custom limit
   */
  const isCustomLimit = useCallback((tier) => {
    const normalizedTier = (tier || 'free').toLowerCase();
    return metadata[normalizedTier]?.isCustom || false;
  }, [metadata]);

  /**
   * Refresh limits from server
   */
  const refresh = useCallback(async () => {
    await fetchLimits();
  }, [fetchLimits]);

  return useMemo(() => ({
    limits,
    metadata,
    isLoading,
    error,
    lastUpdate,
    userTier,
    isAvailable,
    getUserLimit,
    getCurrentUserLimit,
    isWithinLimit,
    getLimitStatus,
    isCustomLimit,
    refresh
  }), [
    limits,
    metadata,
    isLoading,
    error,
    lastUpdate,
    userTier,
    isAvailable,
    getUserLimit,
    getCurrentUserLimit,
    isWithinLimit,
    getLimitStatus,
    isCustomLimit,
    refresh
  ]);
}

export default useCardInputLimits;
