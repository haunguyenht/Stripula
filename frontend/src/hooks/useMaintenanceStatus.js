import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { maintenanceSSE } from '@/lib/services/maintenanceSSE';

/**
 * useMaintenanceStatus Hook
 * Connects to SSE endpoint for real-time maintenance status updates.
 * Provides maintenance mode state with automatic reconnection.
 * 
 * Requirements:
 * - 2.4: Auto-refresh periodically to check if maintenance has ended
 * - 2.5: Automatically redirect users when maintenance ends
 * 
 * @returns {Object} - Maintenance status data and connection state
 */

const API_BASE = '/api';

export function useMaintenanceStatus() {
  const subscriberId = useId();
  
  // Maintenance state
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [reason, setReason] = useState(null);
  const [estimatedEndTime, setEstimatedEndTime] = useState(null);
  const [enabledAt, setEnabledAt] = useState(null);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Handle SSE events from shared service
   * Requirements: 2.4, 2.5 - Real-time maintenance status updates
   */
  const handleSSEEvent = useCallback((data) => {
    switch (data.type) {
      case 'connection':
        setIsConnected(data.status === 'connected');
        if (data.status === 'disconnected') {
          setError('Connection lost. Reconnecting...');
        } else {
          setError(null);
        }
        break;
        
      case 'connected':
        // Initial connection acknowledgment from server
        setIsConnected(true);
        setError(null);
        break;
        
      case 'maintenanceStatus':
        // Maintenance status update (initial or broadcast)
        setIsMaintenanceMode(data.enabled || false);
        setReason(data.reason || null);
        setEstimatedEndTime(data.estimatedEndTime || null);
        setEnabledAt(data.enabledAt || null);
        setLastUpdate(data.timestamp ? new Date(data.timestamp) : new Date());
        setIsLoading(false);
        setError(null);
        break;
        
      default:
        break;
    }
  }, []);

  // Subscribe to shared SSE service
  useEffect(() => {
    const unsubscribe = maintenanceSSE.subscribe(subscriberId, handleSSEEvent);
    return unsubscribe;
  }, [subscriberId, handleSSEEvent]);

  /**
   * Manually refresh maintenance status from API
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/system/maintenance/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.maintenance) {
          setIsMaintenanceMode(data.maintenance.enabled || false);
          setReason(data.maintenance.reason || null);
          setEstimatedEndTime(data.maintenance.estimatedEndTime || null);
          setEnabledAt(data.maintenance.enabledAt || null);
          setLastUpdate(new Date(data.timestamp));
          setError(null);
          return { success: true };
        }
      }

      setError('Failed to fetch maintenance status');
      return { success: false, error: 'Failed to fetch maintenance status' };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Force reconnect SSE connection
   * Requirement: 2.4 - Auto-reconnect on disconnect
   */
  const reconnect = useCallback(() => {
    setError(null);
    maintenanceSSE.reconnect();
  }, []);

  return useMemo(() => ({
    // Maintenance status (Requirements: 2.4, 2.5)
    isMaintenanceMode,
    reason,
    estimatedEndTime,
    enabledAt,
    
    // Connection state
    isConnected,
    error,
    lastUpdate,
    isLoading,
    
    // Methods
    refresh,
    reconnect
  }), [
    isMaintenanceMode,
    reason,
    estimatedEndTime,
    enabledAt,
    isConnected,
    error,
    lastUpdate,
    isLoading,
    refresh,
    reconnect
  ]);
}

export default useMaintenanceStatus;
