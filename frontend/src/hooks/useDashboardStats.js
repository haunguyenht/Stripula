import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { dashboardSSE } from '@/lib/services/dashboardSSE';

/**
 * useDashboardStats Hook
 * Connects to shared SSE service for real-time dashboard statistics updates.
 * Provides personal and global stats with automatic reconnection.
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 9.1
 * 
 * @returns {Object} - Dashboard stats data and connection state
 */

const API_BASE = '/api';

export function useDashboardStats() {
  const subscriberId = useId();
  
  // Personal stats state (Requirements: 1.1, 1.2)
  const [personalStats, setPersonalStats] = useState({
    totalCards: 0,
    totalHits: 0
  });

  // Global stats state (Requirements: 2.1, 2.2, 3.1, 3.2)
  const [globalStats, setGlobalStats] = useState({
    totalMembers: 0,
    onlineCount: 0,
    totalCards: 0,
    totalHits: 0
  });

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Handle SSE events from shared service
   * Requirement: 3.3 - Real-time updates via SSE
   */
  const handleSSEEvent = useCallback((data) => {
    switch (data.type) {
      case 'connection':
        setIsConnected(data.status === 'connected');
        if (data.status === 'disconnected') {
          setError('Connection lost. Reconnecting...');
        } else if (data.status === 'error') {
          // Requirement 9.6: Display connection error after max attempts
          setError(data.message || 'Connection failed');
        } else {
          setError(null);
        }
        break;
        
      case 'initialStats':
        // Initial stats from SSE connection
        if (data.personal) {
          setPersonalStats(data.personal);
        }
        if (data.global) {
          setGlobalStats(data.global);
        }
        setLastUpdate(new Date(data.timestamp));
        setIsLoading(false);
        setError(null);
        break;
        
      case 'userStatsUpdate':
        // Personal stats update for current user
        if (data.personal) {
          setPersonalStats(data.personal);
        }
        setLastUpdate(new Date(data.timestamp));
        break;
        
      case 'globalStatsUpdate':
        // Global stats update (Requirements: 2.1, 2.2, 3.1, 3.2)
        if (data.global) {
          setGlobalStats(data.global);
        }
        setLastUpdate(new Date(data.timestamp));
        break;
        
      default:
        break;
    }
  }, []);

  // Subscribe to shared SSE service
  useEffect(() => {
    const unsubscribe = dashboardSSE.subscribe(subscriberId, handleSSEEvent);
    return unsubscribe;
  }, [subscriberId, handleSSEEvent]);

  /**
   * Manually refresh stats from API
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/dashboard/stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          if (data.personal) {
            setPersonalStats(data.personal);
          }
          if (data.global) {
            setGlobalStats(data.global);
          }
          setLastUpdate(new Date(data.timestamp));
          setError(null);
          return { success: true };
        }
      }

      setError('Failed to fetch stats');
      return { success: false, error: 'Failed to fetch stats' };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Force reconnect SSE connection
   * Requirement: 9.5 - Auto-reconnect
   */
  const reconnect = useCallback(() => {
    setError(null);
    dashboardSSE.reconnect();
  }, []);

  return useMemo(() => ({
    // Personal stats (Requirements: 1.1, 1.2)
    personalStats,
    
    // Global stats (Requirements: 2.1, 2.2, 3.1, 3.2)
    globalStats,
    
    // Connection state
    isConnected,
    error,
    lastUpdate,
    isLoading,
    
    // Methods
    refresh,
    reconnect
  }), [
    personalStats,
    globalStats,
    isConnected,
    error,
    lastUpdate,
    isLoading,
    refresh,
    reconnect
  ]);
}

export default useDashboardStats;
