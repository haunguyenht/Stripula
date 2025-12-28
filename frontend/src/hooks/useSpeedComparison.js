import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useSpeedComparison Hook
 * Fetches tier comparison data for speed display
 * 
 * Requirements: 6.1, 6.5
 * 
 * @param {string} gatewayId - Gateway ID (e.g., 'auth', 'charge', 'shopify')
 * @returns {Object} - Speed comparison data and state
 */

const API_BASE = '/api';

// Default speed limits (fallback if API unavailable)
const DEFAULT_SPEED_LIMITS = {
  free: { concurrency: 1, delay: 2000 },
  bronze: { concurrency: 2, delay: 1500 },
  silver: { concurrency: 3, delay: 1000 },
  gold: { concurrency: 5, delay: 500 },
  diamond: { concurrency: 10, delay: 200 }
};

const TIER_ORDER = ['free', 'bronze', 'silver', 'gold', 'diamond'];

/**
 * Calculate effective speed (cards per second)
 * @param {number} concurrency - Concurrent tasks
 * @param {number} delay - Delay between completions in ms
 * @returns {number} Effective cards per second
 */
function calculateEffectiveSpeed(concurrency, delay) {
  const avgTaskTimeMs = 500;
  const effectiveTimePerCard = (avgTaskTimeMs + delay) / concurrency;
  return effectiveTimePerCard > 0 ? 1000 / effectiveTimePerCard : 0;
}

/**
 * Estimate time to process N cards
 * @param {number} cardCount - Number of cards
 * @param {number} concurrency - Concurrent tasks
 * @param {number} delay - Delay between completions in ms
 * @returns {number} Estimated time in seconds
 */
function estimateTimeForCards(cardCount, concurrency, delay) {
  if (cardCount <= 0 || concurrency <= 0) return 0;
  
  const avgTaskTimeMs = 500;
  const batches = Math.ceil(cardCount / concurrency);
  const timePerBatch = avgTaskTimeMs + delay;
  const totalTimeMs = (batches - 1) * timePerBatch + avgTaskTimeMs;
  
  return totalTimeMs / 1000;
}

/**
 * Generate default comparison data
 * @returns {Array} Default tier comparisons
 */
function getDefaultComparison() {
  const freeDefaults = DEFAULT_SPEED_LIMITS.free;
  const baselineSpeed = calculateEffectiveSpeed(freeDefaults.concurrency, freeDefaults.delay);

  return TIER_ORDER.map(tier => {
    const defaults = DEFAULT_SPEED_LIMITS[tier];
    const effectiveSpeed = calculateEffectiveSpeed(defaults.concurrency, defaults.delay);
    const speedMultiplier = baselineSpeed > 0 ? effectiveSpeed / baselineSpeed : 1;
    const estimatedTimeFor100Cards = estimateTimeForCards(100, defaults.concurrency, defaults.delay);

    return {
      tier,
      concurrency: defaults.concurrency,
      delay: defaults.delay,
      speedMultiplier: Math.round(speedMultiplier * 10) / 10,
      estimatedTimeFor100Cards: Math.round(estimatedTimeFor100Cards),
      isCustom: false
    };
  });
}

export function useSpeedComparison(gatewayId = 'auth') {
  const { isAuthenticated } = useAuth();
  
  const [data, setData] = useState({
    comparison: getDefaultComparison(),
    isLoading: true,
    error: null
  });

  /**
   * Fetch speed comparison data from backend
   */
  const fetchComparison = useCallback(async () => {
    if (!gatewayId) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/speed-config/comparison/${gatewayId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'OK' && result.comparison) {
          setData({
            comparison: result.comparison,
            isLoading: false,
            error: null
          });
          return;
        }
      }

      // Fallback to defaults on error
      setData({
        comparison: getDefaultComparison(),
        isLoading: false,
        error: 'Failed to load speed comparison'
      });
    } catch (err) {
      setData({
        comparison: getDefaultComparison(),
        isLoading: false,
        error: 'Network error'
      });
    }
  }, [gatewayId]);

  // Fetch on mount and when gatewayId changes
  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  /**
   * Calculate time savings between current tier and target tier
   * @param {string} currentTier - Current user tier
   * @param {string} targetTier - Target tier to compare
   * @returns {Object} Time savings info
   */
  const getTimeSavings = useCallback((currentTier, targetTier) => {
    const current = data.comparison.find(c => c.tier === currentTier);
    const target = data.comparison.find(c => c.tier === targetTier);
    
    if (!current || !target) {
      return { timeSaved: 0, percentFaster: 0 };
    }

    const timeSaved = current.estimatedTimeFor100Cards - target.estimatedTimeFor100Cards;
    const percentFaster = current.estimatedTimeFor100Cards > 0 
      ? Math.round((timeSaved / current.estimatedTimeFor100Cards) * 100)
      : 0;

    return { timeSaved: Math.round(timeSaved), percentFaster };
  }, [data.comparison]);

  /**
   * Get speed multiplier relative to free tier
   * @param {string} tier - Tier to check
   * @returns {number} Speed multiplier
   */
  const getSpeedMultiplier = useCallback((tier) => {
    const tierData = data.comparison.find(c => c.tier === tier);
    return tierData?.speedMultiplier || 1;
  }, [data.comparison]);

  /**
   * Get estimated time for a specific card count
   * @param {string} tier - Tier to calculate for
   * @param {number} cardCount - Number of cards
   * @returns {number} Estimated time in seconds
   */
  const getEstimatedTime = useCallback((tier, cardCount) => {
    const tierData = data.comparison.find(c => c.tier === tier);
    if (!tierData) return 0;
    
    return estimateTimeForCards(cardCount, tierData.concurrency, tierData.delay);
  }, [data.comparison]);

  /**
   * Refresh comparison data
   */
  const refresh = useCallback(() => {
    setData(prev => ({ ...prev, isLoading: true }));
    fetchComparison();
  }, [fetchComparison]);

  return useMemo(() => ({
    // Data
    comparison: data.comparison,
    isLoading: data.isLoading,
    error: data.error,
    
    // Methods
    getTimeSavings,
    getSpeedMultiplier,
    getEstimatedTime,
    refresh,
    
    // Auth state
    isAuthenticated
  }), [
    data,
    getTimeSavings,
    getSpeedMultiplier,
    getEstimatedTime,
    refresh,
    isAuthenticated
  ]);
}

export default useSpeedComparison;
