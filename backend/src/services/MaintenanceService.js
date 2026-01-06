import { EventEmitter } from 'events';

/**
 * MaintenanceService
 * 
 * Manages global maintenance mode state with persistence and SSE broadcasting.
 * Allows administrators to toggle maintenance mode via admin panel or Telegram bot.
 * 
 * Requirements:
 * - 1.1: Enable maintenance mode via admin panel with broadcast to all clients
 * - 1.2: Enable maintenance mode via Telegram bot command
 * - 1.3: Allow only administrators to access during maintenance
 * - 1.5: Disable maintenance mode and notify via Telegram
 * - 1.6: Persist maintenance mode state across server restarts
 */
export class MaintenanceService extends EventEmitter {
    constructor(options = {}) {
        super();
        this.supabase = options.supabase || null;
        this.telegramBotService = options.telegramBotService || null;
        this.sseClients = new Set();
        this.state = {
            enabled: false,
            reason: null,
            estimatedEndTime: null,
            enabledAt: null,
            enabledBy: null
        };
        this.initialized = false;
    }

    /**
     * Initialize the service by loading state from database
     * 
     * Requirement: 1.6 - Persist maintenance mode state across server restarts
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        await this.loadState();
        this.initialized = true;
    }

    // ==================== State Management Methods ====================

    /**
     * Get current maintenance status
     * 
     * Requirement: 1.1, 1.2 - Return current maintenance state
     * 
     * @returns {Object} Current maintenance state
     */
    getStatus() {
        return {
            enabled: this.state.enabled,
            reason: this.state.reason,
            estimatedEndTime: this.state.estimatedEndTime,
            enabledAt: this.state.enabledAt
        };
    }

    /**
     * Enable or disable maintenance mode
     * 
     * Requirements: 1.1, 1.2, 1.5, 1.6
     * 
     * @param {boolean} enabled - Whether to enable or disable maintenance
     * @param {Object} options - Additional options
     * @param {string} options.reason - Reason for maintenance
     * @param {string} options.estimatedEndTime - ISO timestamp for estimated end
     * @param {string} options.adminId - Admin user ID
     * @param {string} options.adminName - Admin display name (for notifications)
     * @returns {Promise<Object>} Result with success status and state
     */
    async setMaintenance(enabled, options = {}) {
        const { reason = null, estimatedEndTime = null, adminId = null, adminName = null } = options;
        
        const previousState = { ...this.state };
        const timestamp = new Date().toISOString();

        if (enabled) {
            this.state = {
                enabled: true,
                reason: reason,
                estimatedEndTime: estimatedEndTime,
                enabledAt: timestamp,
                enabledBy: adminId
            };
        } else {
            this.state = {
                enabled: false,
                reason: null,
                estimatedEndTime: null,
                enabledAt: null,
                enabledBy: null
            };
        }

        // Persist to database (Requirement 1.6)
        await this.saveState();

        // Emit state change event
        this.emit('maintenanceChange', {
            enabled: this.state.enabled,
            previousEnabled: previousState.enabled,
            state: this.getStatus(),
            timestamp
        });

        // Broadcast to all SSE clients (Requirement 1.1)
        this.broadcastStatus();

        // Notify via Telegram (Requirements 1.2, 1.5)
        if (this.telegramBotService) {
            try {
                await this.telegramBotService.notifyMaintenanceChange({
                    enabled: this.state.enabled,
                    reason: this.state.reason,
                    adminName: adminName || 'Admin',
                    timestamp
                });
            } catch (err) {
                console.error('[MaintenanceService] Failed to send Telegram notification:', err.message);
            }
        }

        return {
            success: true,
            state: this.getStatus()
        };
    }

    /**
     * Check if a user can bypass maintenance mode
     * 
     * Requirement: 1.3 - Allow only administrators to access during maintenance
     * 
     * @param {Object} user - User object with is_admin property
     * @returns {boolean} True if user can bypass maintenance
     */
    canBypass(user) {
        // If maintenance is not enabled, everyone can access
        if (!this.state.enabled) {
            return true;
        }

        // Only admins can bypass maintenance mode
        if (user && user.is_admin === true) {
            return true;
        }

        return false;
    }

    // ==================== SSE Client Management ====================

    /**
     * Add an SSE client for real-time maintenance status updates
     * 
     * @param {Object} res - Express response object
     */
    addClient(res) {
        this.sseClients.add(res);

        // Send current status immediately to new client
        this._sendToClient(res, {
            type: 'maintenanceStatus',
            ...this.getStatus(),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Remove an SSE client
     * 
     * @param {Object} res - Express response object
     */
    removeClient(res) {
        this.sseClients.delete(res);
    }

    /**
     * Broadcast current maintenance status to all connected SSE clients
     * 
     * Requirement: 1.1 - Broadcast to all connected clients
     */
    broadcastStatus() {
        if (this.sseClients.size === 0) {
            return;
        }

        const message = {
            type: 'maintenanceStatus',
            ...this.getStatus(),
            timestamp: new Date().toISOString()
        };

        const deadClients = [];

        for (const client of this.sseClients) {
            try {
                this._sendToClient(client, message);
            } catch (err) {
                console.error('[MaintenanceService] Failed to send to SSE client:', err.message);
                deadClients.push(client);
            }
        }

        // Clean up dead clients
        for (const client of deadClients) {
            this.sseClients.delete(client);
        }
    }

    /**
     * Send a message to a single SSE client
     * @private
     * @param {Object} res - Express response object
     * @param {Object} data - Data to send
     */
    _sendToClient(res, data) {
        if (!res || res.writableEnded) {
            return;
        }

        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (err) {
            // Client disconnected
            this.sseClients.delete(res);
        }
    }

    // ==================== Persistence Methods ====================

    /**
     * Load maintenance state from database
     * 
     * Requirement: 1.6 - Persist maintenance mode state across server restarts
     */
    async loadState() {
        if (!this.supabase) {
            return;
        }

        try {
            const { data, error } = await this.supabase
                .from('system_settings')
                .select('value, updated_at, updated_by')
                .eq('key', 'maintenance_mode')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No row found, use defaults
                    return;
                }
                console.error('[MaintenanceService] Error loading state:', error.message);
                return;
            }

            if (data && data.value) {
                this.state = {
                    enabled: data.value.enabled || false,
                    reason: data.value.reason || null,
                    estimatedEndTime: data.value.estimatedEndTime || null,
                    enabledAt: data.value.enabledAt || null,
                    enabledBy: data.value.enabledBy || null
                };
            }
        } catch (err) {
            console.error('[MaintenanceService] Failed to load state:', err.message);
        }
    }

    /**
     * Save maintenance state to database
     * 
     * Requirement: 1.6 - Persist maintenance mode state across server restarts
     */
    async saveState() {
        if (!this.supabase) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('system_settings')
                .upsert({
                    key: 'maintenance_mode',
                    value: {
                        enabled: this.state.enabled,
                        reason: this.state.reason,
                        estimatedEndTime: this.state.estimatedEndTime,
                        enabledAt: this.state.enabledAt,
                        enabledBy: this.state.enabledBy
                    },
                    updated_by: this.state.enabledBy
                }, { onConflict: 'key' });

            if (error) {
                console.error('[MaintenanceService] Error saving state:', error.message);
            }
        } catch (err) {
            console.error('[MaintenanceService] Failed to save state:', err.message);
        }
    }

    // ==================== Utility Methods ====================

    /**
     * Get the number of connected SSE clients
     * @returns {number} Number of connected clients
     */
    getClientCount() {
        return this.sseClients.size;
    }

    /**
     * Check if maintenance mode is currently enabled
     * @returns {boolean} True if maintenance is enabled
     */
    isEnabled() {
        return this.state.enabled;
    }
}

export default MaintenanceService;
