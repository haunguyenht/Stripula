/**
 * Shared Dashboard SSE Service
 * Singleton service that manages a single SSE connection for all dashboard-related hooks.
 * Prevents multiple connections to the same endpoint which causes connection conflicts.
 * 
 * Requirements: 9.1, 9.5, 9.6 - Real-time dashboard updates via SSE
 */

const API_BASE = '/api';

// Reconnection settings
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const BACKOFF_MULTIPLIER = 2;
const MAX_RETRY_ATTEMPTS = 3;

class DashboardSSEService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.retryDelay = INITIAL_RETRY_DELAY;
    this.retryTimeout = null;
    this.retryAttempts = 0;
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
      callback({ type: 'initialStats', ...this.lastData });
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
      const eventSource = new EventSource(`${API_BASE}/dashboard/stats/stream`, {
        withCredentials: true
      });

      this.eventSource = eventSource;

      eventSource.onopen = () => {
        this.isConnected = true;
        this.retryDelay = INITIAL_RETRY_DELAY;
        this.retryAttempts = 0;
        this.broadcast({ type: 'connection', status: 'connected' });
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Cache initial/full state for new subscribers
          if (data.type === 'initialStats') {
            this.lastData = data;
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

        // Only retry if we still have subscribers and haven't exceeded max attempts
        if (this.subscriberCount > 0) {
          this.retryAttempts++;
          
          if (this.retryAttempts >= MAX_RETRY_ATTEMPTS) {
            // Requirement 9.6: Display connection error after max attempts
            this.broadcast({ 
              type: 'connection', 
              status: 'error',
              message: 'Failed to connect after multiple attempts'
            });
            return;
          }

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
    this.retryAttempts = 0;
  }

  /**
   * Force reconnect (reset retry attempts)
   */
  reconnect() {
    this.retryAttempts = 0;
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
   * Check if in error state (max retries exceeded)
   */
  isInErrorState() {
    return this.retryAttempts >= MAX_RETRY_ATTEMPTS;
  }
}

// Singleton instance
export const dashboardSSE = new DashboardSSEService();

export default dashboardSSE;
