/**
 * Shared Maintenance SSE Service
 * Singleton service that manages a single SSE connection for maintenance status updates.
 * Prevents multiple connections to the same endpoint which causes connection conflicts.
 * 
 * Requirements:
 * - 2.4: Auto-refresh periodically to check if maintenance has ended
 * - 2.5: Automatically redirect users when maintenance ends
 */

const API_BASE = '/api';

// Reconnection settings
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const BACKOFF_MULTIPLIER = 2;

class MaintenanceSSEService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.retryDelay = INITIAL_RETRY_DELAY;
    this.retryTimeout = null;
    this.subscriberCount = 0;
    this.lastData = null;
  }

  /**
   * Subscribe to SSE events
   * @param {string} id - Unique subscriber ID
   * @param {Function} callback - Callback function for events
   * @returns {Function} Unsubscribe function
   */
  subscribe(id, callback) {
    this.listeners.set(id, callback);
    this.subscriberCount++;

    // Connect if this is the first subscriber
    if (this.subscriberCount === 1) {
      this.connect();
    } else if (this.lastData) {
      // Send last known data to new subscriber immediately
      callback({ type: 'maintenanceStatus', ...this.lastData });
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(id);
      this.subscriberCount--;

      // Disconnect if no subscribers
      if (this.subscriberCount === 0) {
        this.disconnect();
      }
    };
  }

  /**
   * Broadcast event to all listeners
   */
  broadcast(data) {
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        // Ignore callback errors
      }
    });
  }

  /**
   * Connect to SSE endpoint
   * Requirement: 2.4 - Auto-refresh periodically
   */
  connect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    try {
      const eventSource = new EventSource(`${API_BASE}/system/maintenance/stream`, {
        withCredentials: true
      });

      this.eventSource = eventSource;

      eventSource.onopen = () => {
        this.isConnected = true;
        this.retryDelay = INITIAL_RETRY_DELAY;
        this.broadcast({ type: 'connection', status: 'connected' });
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Cache maintenance status for new subscribers
          if (data.type === 'maintenanceStatus') {
            this.lastData = {
              enabled: data.enabled,
              reason: data.reason,
              estimatedEndTime: data.estimatedEndTime,
              enabledAt: data.enabledAt,
              timestamp: data.timestamp
            };
          }
          
          this.broadcast(data);
        } catch (err) {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        this.isConnected = false;
        this.broadcast({ type: 'connection', status: 'disconnected' });

        eventSource.close();
        this.eventSource = null;

        // Only retry if we still have subscribers
        // Requirement: 2.4 - Auto-reconnect on disconnect
        if (this.subscriberCount > 0) {
          const delay = this.retryDelay;
          this.retryDelay = Math.min(this.retryDelay * BACKOFF_MULTIPLIER, MAX_RETRY_DELAY);

          this.retryTimeout = setTimeout(() => {
            if (this.subscriberCount > 0) {
              this.connect();
            }
          }, delay);
        }
      };
    } catch (err) {
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from SSE endpoint
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.isConnected = false;
    this.lastData = null;
  }

  /**
   * Force reconnect (reset retry delay)
   */
  reconnect() {
    this.retryDelay = INITIAL_RETRY_DELAY;
    this.connect();
  }

  /**
   * Check if connected
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get last known maintenance status
   */
  getLastStatus() {
    return this.lastData;
  }
}

// Singleton instance
export const maintenanceSSE = new MaintenanceSSEService();

export default maintenanceSSE;
