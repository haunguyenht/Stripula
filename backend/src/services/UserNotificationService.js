import { EventEmitter } from 'events';

/**
 * UserNotificationService
 * 
 * Manages user-specific SSE connections for real-time updates.
 * Broadcasts credit balance and tier changes to affected users immediately.
 */
export class UserNotificationService extends EventEmitter {
    constructor() {
        super();
        this.userClients = new Map();
    }

    /**
     * Add an SSE client for a specific user
     * @param {string} userId - User UUID
     * @param {Object} res - Express response object
     */
    addClient(userId, res) {
        if (!this.userClients.has(userId)) {
            this.userClients.set(userId, new Set());
        }
        this.userClients.get(userId).add(res);
    }

    /**
     * Remove an SSE client for a specific user
     * @param {string} userId - User UUID
     * @param {Object} res - Express response object
     */
    removeClient(userId, res) {
        const clients = this.userClients.get(userId);
        if (clients) {
            clients.delete(res);
            if (clients.size === 0) {
                this.userClients.delete(userId);
            }
        }
    }

    /**
     * Send a message to a specific user
     * @param {string} userId - User UUID
     * @param {Object} data - Data to send
     */
    sendToUser(userId, data) {
        const clients = this.userClients.get(userId);
        if (!clients || clients.size === 0) {
            return;
        }

        const message = JSON.stringify(data);
        const disconnectedClients = [];

        for (const client of clients) {
            try {
                client.write(`data: ${message}\n\n`);
            } catch (err) {
                disconnectedClients.push(client);
            }
        }

        for (const client of disconnectedClients) {
            clients.delete(client);
        }

        if (clients.size === 0) {
            this.userClients.delete(userId);
        }
    }

    /**
     * Notify user of credit balance change
     * @param {string} userId - User UUID
     * @param {number} newBalance - New credit balance
     * @param {number} previousBalance - Previous credit balance
     * @param {string} reason - Reason for the change
     */
    notifyCreditChange(userId, newBalance, previousBalance, reason) {
        this.sendToUser(userId, {
            type: 'creditChange',
            balance: newBalance,
            previousBalance,
            change: newBalance - previousBalance,
            reason,
            timestamp: new Date().toISOString()
        });
        this.emit('creditChange', { userId, newBalance, previousBalance, reason });
    }

    /**
     * Notify user of tier change
     * @param {string} userId - User UUID
     * @param {string} newTier - New tier
     * @param {string} previousTier - Previous tier
     * @param {string|null} tierExpiresAt - Tier expiration date (ISO string or null for permanent)
     */
    notifyTierChange(userId, newTier, previousTier, tierExpiresAt = null) {
        this.sendToUser(userId, {
            type: 'tierChange',
            tier: newTier,
            previousTier,
            tierExpiresAt,
            timestamp: new Date().toISOString()
        });
        this.emit('tierChange', { userId, newTier, previousTier, tierExpiresAt });
    }

    /**
     * Notify user of tier extension
     * @param {string} userId - User UUID
     * @param {string} tier - Current tier
     * @param {string|null} previousExpiresAt - Previous expiration date
     * @param {string} newExpiresAt - New expiration date
     * @param {number} daysAdded - Number of days added
     */
    notifyTierExtension(userId, tier, previousExpiresAt, newExpiresAt, daysAdded) {
        this.sendToUser(userId, {
            type: 'tierExtension',
            tier,
            previousExpiresAt,
            newExpiresAt,
            daysAdded,
            timestamp: new Date().toISOString()
        });
        this.emit('tierExtension', { userId, tier, previousExpiresAt, newExpiresAt, daysAdded });
    }

    /**
     * Send heartbeat to keep connection alive
     * @param {string} userId - User UUID
     */
    sendHeartbeat(userId) {
        this.sendToUser(userId, {
            type: 'heartbeat',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get number of connected clients for a user
     * @param {string} userId - User UUID
     * @returns {number} Number of connected clients
     */
    getClientCount(userId) {
        const clients = this.userClients.get(userId);
        return clients ? clients.size : 0;
    }

    /**
     * Get total number of connected users
     * @returns {number} Number of users with active connections
     */
    getTotalConnectedUsers() {
        return this.userClients.size;
    }
}

export default UserNotificationService;
