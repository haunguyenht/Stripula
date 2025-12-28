import { useState, useEffect, useCallback, useRef, useMemo, useId } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { gatewaySSE } from '@/lib/services/gatewaySSE';

/**
 * useAdminNotifications Hook
 * 
 * Subscribes to shared SSE service and shows notifications when other admins make changes.
 * Batches rapid notifications to prevent spam.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4
 */

// Default batch window for notifications (3 seconds)
const DEFAULT_BATCH_WINDOW_MS = 3000;

// Change type labels for notifications
const CHANGE_TYPE_LABELS = {
  creditRateChange: 'Credit rate',
  stateChange: 'Gateway state',
  healthChange: 'Health status',
  proxyChange: 'Proxy config'
};

export function useAdminNotifications(options = {}) {
  const subscriberId = useId();
  const { user, isAuthenticated } = useAuth();
  const { info } = useToast();
  
  const {
    batchWindowMs = DEFAULT_BATCH_WINDOW_MS,
    onCreditRateChange,
    onStateChange,
    onHealthChange
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState([]);

  // Refs
  const isMountedRef = useRef(true);
  const batchTimeoutRef = useRef(null);
  const pendingChangesRef = useRef([]);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.is_admin === true;
  }, [user]);

  /**
   * Format notification message for batched changes
   */
  const formatBatchedNotification = useCallback((changes) => {
    if (changes.length === 0) return null;

    if (changes.length === 1) {
      const change = changes[0];
      const typeLabel = CHANGE_TYPE_LABELS[change.type] || 'Configuration';
      return `${typeLabel} updated for ${change.gatewayLabel || change.gatewayId}`;
    }

    const byType = changes.reduce((acc, change) => {
      const type = change.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(change);
      return acc;
    }, {});

    const parts = [];
    for (const [type, typeChanges] of Object.entries(byType)) {
      const typeLabel = CHANGE_TYPE_LABELS[type] || 'Configuration';
      if (typeChanges.length === 1) {
        parts.push(`${typeLabel}: ${typeChanges[0].gatewayLabel || typeChanges[0].gatewayId}`);
      } else {
        parts.push(`${typeLabel}: ${typeChanges.length} gateways`);
      }
    }

    return `Admin changes: ${parts.join(', ')}`;
  }, []);

  /**
   * Flush pending notifications as a batched toast
   */
  const flushNotifications = useCallback(() => {
    if (pendingChangesRef.current.length === 0) return;

    const changes = [...pendingChangesRef.current];
    pendingChangesRef.current = [];

    const message = formatBatchedNotification(changes);
    if (message) {
      info(message);
    }

    setPendingNotifications([]);
  }, [formatBatchedNotification, info]);

  /**
   * Queue a notification for batching
   */
  const queueNotification = useCallback((change) => {
    pendingChangesRef.current.push(change);
    setPendingNotifications([...pendingChangesRef.current]);

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      flushNotifications();
    }, batchWindowMs);
  }, [batchWindowMs, flushNotifications]);

  /**
   * Handle SSE events from shared service
   */
  const handleSSEEvent = useCallback((data) => {
    if (!isMountedRef.current) return;

    // Handle connection status
    if (data.type === 'connection') {
      setIsConnected(data.status === 'connected');
      return;
    }

    // Skip initial state messages
    if (data.type === 'initial') return;

    // Handle credit rate change
    if (data.type === 'creditRateChange') {
      if (onCreditRateChange) {
        onCreditRateChange(data);
      }

      if (isAdmin) {
        queueNotification({
          type: 'creditRateChange',
          gatewayId: data.gatewayId,
          gatewayLabel: data.gatewayLabel,
          oldRate: data.oldRate,
          newRate: data.newRate,
          isCustom: data.isCustom,
          timestamp: data.timestamp
        });
      }
    }

    // Handle state change
    if (data.type === 'stateChange') {
      if (onStateChange) {
        onStateChange(data);
      }

      if (isAdmin) {
        queueNotification({
          type: 'stateChange',
          gatewayId: data.gatewayId,
          gatewayLabel: data.gateway?.label,
          oldState: data.oldState,
          newState: data.newState,
          timestamp: data.timestamp
        });
      }
    }

    // Handle health change
    if (data.type === 'healthChange') {
      if (onHealthChange) {
        onHealthChange(data);
      }
    }
  }, [isAdmin, onCreditRateChange, onStateChange, onHealthChange, queueNotification]);

  // Subscribe to shared SSE service
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!isAuthenticated || !isAdmin) return;
    
    const unsubscribe = gatewaySSE.subscribe(`admin-${subscriberId}`, handleSSEEvent);
    
    return () => {
      isMountedRef.current = false;
      unsubscribe();
      
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
      
      // Flush any pending notifications on unmount
      if (pendingChangesRef.current.length > 0) {
        flushNotifications();
      }
    };
  }, [subscriberId, isAuthenticated, isAdmin, handleSSEEvent, flushNotifications]);

  /**
   * Clear all pending notifications
   */
  const clearPending = useCallback(() => {
    pendingChangesRef.current = [];
    setPendingNotifications([]);
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  return useMemo(() => ({
    isConnected,
    pendingNotifications,
    isAdmin,
    clearPending,
    flushNotifications
  }), [
    isConnected,
    pendingNotifications,
    isAdmin,
    clearPending,
    flushNotifications
  ]);
}

export default useAdminNotifications;
