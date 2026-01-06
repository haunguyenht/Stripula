import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { dashboardSSE } from '@/lib/services/dashboardSSE';

/**
 * useLeaderboard Hook
 * Fetches and maintains the top users leaderboard with real-time SSE updates.
 * 
 * Requirements: 5.1, 5.5, 9.3
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Number of users to fetch (default 5)
 * @returns {Object} - Leaderboard data and state
 */

const API_BASE = '/api';

export function useLeaderboard(options = {}) {
  const { limit = 5 } = options;
  const subscriberId = useId();
  
  // Leaderboard state (Requirement: 5.1)
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Fetch leaderboard from API
   */
  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/dashboard/leaderboard?limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          setLeaderboard(data.leaderboard || []);
          setLastUpdate(new Date(data.timestamp));
          setError(null);
          return { success: true };
        }
      }

      setError('Failed to fetch leaderboard');
      return { success: false, error: 'Failed to fetch leaderboard' };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  /**
   * Handle SSE events for leaderboard updates
   * Requirement: 5.5, 9.3 - Real-time leaderboard updates
   */
  const handleSSEEvent = useCallback((data) => {
    switch (data.type) {
      case 'leaderboardUpdate':
        // Requirement: 5.5 - Update rankings in real-time
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
          setLastUpdate(new Date(data.timestamp));
        }
        break;
        
      case 'userStatsUpdate':
        // When user stats change, leaderboard might need refresh
        // The backend will broadcast leaderboardUpdate if rankings change
        break;
        
      default:
        break;
    }
  }, []);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    const unsubscribe = dashboardSSE.subscribe(subscriberId, handleSSEEvent);
    return unsubscribe;
  }, [subscriberId, handleSSEEvent]);

  // Fetch initial leaderboard on mount
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  /**
   * Check if a user is in the leaderboard
   * Requirement: 5.4 - Highlight current user
   */
  const isUserInLeaderboard = useCallback((userId) => {
    return leaderboard.some(entry => entry.userId === userId);
  }, [leaderboard]);

  /**
   * Get user's rank if in leaderboard
   */
  const getUserRank = useCallback((userId) => {
    const entry = leaderboard.find(e => e.userId === userId);
    return entry?.rank || null;
  }, [leaderboard]);

  /**
   * Manually refresh leaderboard
   */
  const refresh = useCallback(async () => {
    return fetchLeaderboard();
  }, [fetchLeaderboard]);

  return useMemo(() => ({
    // Leaderboard data (Requirement: 5.1)
    leaderboard,
    
    // State
    isLoading,
    error,
    lastUpdate,
    
    // Helper methods (Requirement: 5.4)
    isUserInLeaderboard,
    getUserRank,
    
    // Actions
    refresh
  }), [
    leaderboard,
    isLoading,
    error,
    lastUpdate,
    isUserInLeaderboard,
    getUserRank,
    refresh
  ]);
}

export default useLeaderboard;
