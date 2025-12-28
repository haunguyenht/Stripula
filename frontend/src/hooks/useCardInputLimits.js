import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gatewaySSE } from '@/lib/services/gatewaySSE';

/**
 * useCardInputLimits Hook
 * 
 * Fetches tier-based card input limits from backend and subscribes to shared SSE
 * for real-time updates.
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @returns {Object} - Tier limits data and methods
 */

const API_BASE = '/api';

// Default tier limits (fallback if API unavailable)
const DEFAULT_TIER_LIMITS = {
  free: 500,
  bronze: 1000,
  silver: 1500,
  gold: 2000,
  diamond: 3000
};

// Warning threshold (80% of limit)
const WARNING_THRESHOLD = 0.8;

export function useCardInputLimits() {
  const subscriberId = useId();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [limits, setLimits] = useState(DEFAULT_TIER_LIMITS);
  const [defaults, setDefaults] = useState(DEFAULT_TIER_LIMITS);
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
   */
  const fetchLimits = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
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
          setDefaults(data.defaults || DEFAULT_TIER_LIMITS);
          setMetadata(data.metadata || {});
          setLastUpdate(new Date(data.timestamp));
          setError(null);
        }
      } else {
        setError('Failed to fetch tier limits');
        setLimits(DEFAULT_TIER_LIMITS);
        setDefaults(DEFAULT_TIER_LIMITS);
      }
    } catch (err) {

      setError('Network error');
      setLimits(DEFAULT_TIER_LIMITS);
      setDefaults(DEFAULT_TIER_LIMITS);
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
   */
  const getUserLimit = useCallback((tier) => {
    const normalizedTier = (tier || 'free').toLowerCase();
    return limits[normalizedTier] || DEFAULT_TIER_LIMITS[normalizedTier] || DEFAULT_TIER_LIMITS.free;
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
   */
  const getLimitStatus = useCallback((cardCount, tier) => {
    const targetTier = tier || userTier;
    const limit = getUserLimit(targetTier);
    const withinLimit = cardCount <= limit;
    const excess = withinLimit ? 0 : cardCount - limit;
    const percentage = limit > 0 ? (cardCount / limit) * 100 : 0;
    const isWarning = percentage >= WARNING_THRESHOLD * 100 && withinLimit;
    const isError = !withinLimit;

    return {
      isWithinLimit: withinLimit,
      limit,
      cardCount,
      excess,
      percentage: Math.min(percentage, 100),
      remaining: Math.max(0, limit - cardCount),
      isWarning,
      isError,
      tier: targetTier
    };
  }, [getUserLimit, userTier]);

  /**
   * Get default limit for a tier
   */
  const getDefaultLimit = useCallback((tier) => {
    const normalizedTier = (tier || 'free').toLowerCase();
    return defaults[normalizedTier] || DEFAULT_TIER_LIMITS[normalizedTier] || DEFAULT_TIER_LIMITS.free;
  }, [defaults]);

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
    defaults,
    metadata,
    isLoading,
    error,
    lastUpdate,
    userTier,
    getUserLimit,
    getCurrentUserLimit,
    isWithinLimit,
    getLimitStatus,
    getDefaultLimit,
    isCustomLimit,
    refresh
  }), [
    limits,
    defaults,
    metadata,
    isLoading,
    error,
    lastUpdate,
    userTier,
    getUserLimit,
    getCurrentUserLimit,
    isWithinLimit,
    getLimitStatus,
    getDefaultLimit,
    isCustomLimit,
    refresh
  ]);
}

export default useCardInputLimits;
