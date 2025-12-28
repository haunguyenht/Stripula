import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useUserNotifications Hook
 * Connects to SSE endpoint for real-time user notifications (credit/tier changes)
 * Automatically reconnects on disconnection
 */
export function useUserNotifications(options = {}) {
    const { onCreditChange, onTierChange } = options;
    const { isAuthenticated, updateCreditBalance, refreshUser } = useAuth();
    
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);
    
    // Store callbacks in refs to avoid recreating connect function
    const callbackRefs = useRef({ onCreditChange, onTierChange, updateCreditBalance, refreshUser });
    useEffect(() => {
        callbackRefs.current = { onCreditChange, onTierChange, updateCreditBalance, refreshUser };
    }, [onCreditChange, onTierChange, updateCreditBalance, refreshUser]);

    const connect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const eventSource = new EventSource('/api/user/notifications/stream', {
            withCredentials: true
        });

        eventSource.onopen = () => {
            setIsConnected(true);
            reconnectAttempts.current = 0;
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastUpdate(data);
                
                const { onCreditChange, onTierChange, updateCreditBalance, refreshUser } = callbackRefs.current;

                switch (data.type) {
                    case 'creditChange':
                        if (updateCreditBalance) {
                            updateCreditBalance(data.balance);
                        }
                        if (onCreditChange) {
                            onCreditChange(data);
                        }
                        break;

                    case 'tierChange':
                        if (refreshUser) {
                            refreshUser();
                        }
                        if (onTierChange) {
                            onTierChange(data);
                        }
                        break;

                    case 'connected':
                    case 'heartbeat':
                        break;

                    default:
                        break;
                }
            } catch (err) {
                // Ignore parse errors
            }
        };

        eventSource.onerror = () => {
            setIsConnected(false);
            eventSource.close();
            eventSourceRef.current = null;

            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            reconnectAttempts.current += 1;

            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, delay);
        };

        eventSourceRef.current = eventSource;
    }, []); // No dependencies - stable function

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsConnected(false);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [isAuthenticated]); // Only reconnect when auth changes

    return {
        isConnected,
        lastUpdate
    };
}

export default useUserNotifications;
