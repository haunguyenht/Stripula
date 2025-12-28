import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { gatewaySSE } from '@/lib/services/gatewaySSE';

/**
 * useGatewayStatus Hook
 * Connects to shared SSE service for real-time gateway status updates
 * 
 * Requirements: 7.1, 7.2, 7.4, 7.5
 * 
 * @returns {Object} - Gateway status data and connection state
 */

const API_BASE = '/api';

export function useGatewayStatus() {
  const subscriberId = useId();
  
  // State
  const [gateways, setGateways] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Handle SSE events from shared service
   */
  const handleSSEEvent = useCallback((data) => {
    switch (data.type) {
      case 'connection':
        setIsConnected(data.status === 'connected');
        if (data.status === 'disconnected') {
          setError('Connection lost');
        } else {
          setError(null);
        }
        break;
        
      case 'initial':
        setGateways(data.gateways || []);
        setLastUpdate(new Date(data.timestamp));
        break;
        
      case 'stateChange':
        setGateways(prev => {
          const updated = [...prev];
          const index = updated.findIndex(g => g.id === data.gateway.id);
          if (index >= 0) {
            updated[index] = data.gateway;
          } else {
            updated.push(data.gateway);
          }
          return updated;
        });
        setLastUpdate(new Date(data.timestamp));
        break;
        
      case 'healthUpdate':
        setGateways(prev => {
          const updated = [...prev];
          const index = updated.findIndex(g => g.id === data.gatewayId);
          if (index >= 0) {
            updated[index] = {
              ...updated[index],
              healthStatus: data.healthStatus
            };
          }
          return updated;
        });
        setLastUpdate(new Date(data.timestamp));
        break;
        
      default:
        break;
    }
  }, []);

  // Subscribe to shared SSE service
  useEffect(() => {
    const unsubscribe = gatewaySSE.subscribe(subscriberId, handleSSEEvent);
    return unsubscribe;
  }, [subscriberId, handleSSEEvent]);

  /**
   * Manually refresh gateway state (Requirement: 7.5)
   */
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/gateways`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.gateways) {
          setGateways(data.gateways);
          setLastUpdate(new Date(data.timestamp));
          setError(null);
          return { success: true };
        }
      }

      return { success: false, error: 'Failed to fetch gateways' };
    } catch (err) {

      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Get gateway by ID
   */
  const getGateway = useCallback((gatewayId) => {
    return gateways.find(g => g.id === gatewayId) || null;
  }, [gateways]);

  /**
   * Get gateways by type
   */
  const getGatewaysByType = useCallback((type) => {
    return gateways.filter(g => g.type === type);
  }, [gateways]);

  /**
   * Get available gateways by type
   */
  const getAvailableGateways = useCallback((type) => {
    return gateways.filter(g => g.type === type && g.isAvailable);
  }, [gateways]);

  /**
   * Check if a gateway is available
   */
  const isGatewayAvailable = useCallback((gatewayId) => {
    const gateway = gateways.find(g => g.id === gatewayId);
    return gateway?.isAvailable ?? false;
  }, [gateways]);

  /**
   * Check if all gateways of a type are unavailable
   */
  const areAllUnavailable = useCallback((type) => {
    const typeGateways = gateways.filter(g => g.type === type);
    if (typeGateways.length === 0) return false;
    return typeGateways.every(g => !g.isAvailable);
  }, [gateways]);

  /**
   * Check if any gateway of a type is available
   */
  const isAnyAvailable = useCallback((type) => {
    const typeGateways = gateways.filter(g => g.type === type);
    if (typeGateways.length === 0) return true;
    return typeGateways.some(g => g.isAvailable);
  }, [gateways]);

  return useMemo(() => ({
    gateways,
    isConnected,
    error,
    lastUpdate,
    getGateway,
    getGatewaysByType,
    getAvailableGateways,
    isGatewayAvailable,
    areAllUnavailable,
    isAnyAvailable,
    refresh
  }), [
    gateways,
    isConnected,
    error,
    lastUpdate,
    getGateway,
    getGatewaysByType,
    getAvailableGateways,
    isGatewayAvailable,
    areAllUnavailable,
    isAnyAvailable,
    refresh
  ]);
}

export default useGatewayStatus;
