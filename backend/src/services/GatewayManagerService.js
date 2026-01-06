import { EventEmitter } from 'events';
import { GatewayState } from '../domain/GatewayState.js';
import { HealthMetrics } from '../domain/HealthMetrics.js';
import { AUTH_SITES, CHARGE_SITES, SKBASED_AUTH_SITES, SKBASED_CHARGE_SITES, AUTO_SHOPIFY_API, getGatewayTypeInfo } from '../utils/constants.js';
import { classifyFailure } from '../utils/failureClassifier.js';

/**
 * GatewayManagerService
 * 
 * Central service for managing gateway states and health monitoring.
 * Provides real-time state management, health tracking, and SSE broadcasting.
 * 
 * Requirements:
 * - 1.1: Maintain registry of all gateways with type, ID, label, and state
 * - 1.2: Load gateway states from database on startup
 * - 1.3: Persist state changes to database immediately
 * - 1.4: Track states: enabled, maintenance, disabled
 * - 1.5: Store maintenance reason and timestamp
 * - 2.1: Update state within 1 second via API
 * - 2.2: Reject requests when gateway disabled
 * - 2.3: Accept requests when gateway re-enabled
 * - 2.4: Emit state change events for real-time UI updates
 * - 4.1: Track success rate, error rate, response time
 * - 4.2: Mark as degraded when error rate > 50%
 * - 4.3: Mark as offline after 5 consecutive failures
 * - 4.5: Auto-recover when gateway comes back online
 */
export class GatewayManagerService extends EventEmitter {
    constructor(options = {}) {
        super();
        this.supabase = options.supabase || null;
        this.telegramBotService = options.telegramBotService || null;
        this.registry = new Map();  // gateway_id -> GatewayState
        this.healthMetrics = new Map();  // gateway_id -> HealthMetrics
        this.sseClients = new Set();  // Connected SSE response objects
        this.initialized = false;
        
        // Alert state tracking for manual health control (Requirements 2.6, 7.1)
        this.alertState = new Map();  // gateway_id -> { inAlert: boolean, lastAlertAt: number, alertCount: number }
        this.alertCooldown = 5 * 60 * 1000;  // 5 minutes cooldown between alerts
    }

    /**
     * Initialize the service by loading states from database
     * and populating the registry with all configured gateways
     * 
     * Requirements: 1.1, 1.2
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        // First, populate registry with all configured gateways (default enabled)
        this._populateDefaultGateways();

        // Then load persisted states from database
        if (this.supabase) {
            await this._loadStatesFromDatabase();
            // Load SK/PK keys for SK-based auth gateways
            await this._loadGatewayConfigs();
        }

        this.initialized = true;

    }

    /**
     * Populate registry with default gateway configurations
     * Uses type hierarchy from constants.js
     * @private
     */
    _populateDefaultGateways() {
        // Helper to add gateway with type info
        const addGateway = (site, legacyType) => {
            const typeInfo = getGatewayTypeInfo(site.id);
            const gateway = GatewayState.createEnabled(site.id, legacyType, site.label, {
                parentType: typeInfo.parentType,
                subType: typeInfo.subType
            });
            this.registry.set(site.id, gateway);
            this.healthMetrics.set(site.id, new HealthMetrics(site.id));
        };

        // Add auth gateways (Stripe -> auth)
        for (const site of Object.values(AUTH_SITES)) {
            addGateway(site, 'auth');
        }

        // Add charge gateways (Stripe -> charge)
        for (const site of Object.values(CHARGE_SITES)) {
            addGateway(site, 'charge');
        }

        // Add Auto Shopify gateway (charge type)
        const autoShopifySite = {
            id: AUTO_SHOPIFY_API.GATEWAY_ID,
            label: AUTO_SHOPIFY_API.LABEL
        };
        addGateway(autoShopifySite, 'shopify');

        // Add SK-based auth gateways (Stripe -> skbased-auth)
        for (const site of Object.values(SKBASED_AUTH_SITES)) {
            addGateway(site, 'skbased-auth');
        }

        // Add SK-based charge gateways (Stripe -> skbased)
        for (const site of Object.values(SKBASED_CHARGE_SITES)) {
            addGateway(site, 'skbased');
        }
    }

    /**
     * Load persisted gateway states from database
     * Only UPDATES existing gateways from constants, does NOT add new ones
     * @private
     */
    async _loadStatesFromDatabase() {
        try {
            const { data, error } = await this.supabase
                .from('gateway_states')
                .select('*');

            if (error) {

                return;
            }

            if (data && data.length > 0) {
                let loadedCount = 0;
                for (const row of data) {
                    // Only update gateways that exist in registry (from constants)
                    // Don't add new gateways from database
                    if (!this.registry.has(row.gateway_id)) {
                        continue;
                    }

                    const gateway = GatewayState.fromDatabase(row);
                    this.registry.set(gateway.id, gateway);
                    loadedCount++;

                    // Restore health metrics if stored
                    if (row.metrics && Object.keys(row.metrics).length > 0) {
                        const metrics = HealthMetrics.fromJSON({
                            gatewayId: gateway.id,
                            ...row.metrics
                        });
                        this.healthMetrics.set(gateway.id, metrics);
                    }
                }

            }
        } catch (err) {

        }
    }

    // ==================== Registry Methods ====================

    /**
     * Get a single gateway by ID
     * @param {string} gatewayId - Gateway ID
     * @returns {GatewayState|null}
     */
    getGateway(gatewayId) {
        return this.registry.get(gatewayId) || null;
    }

    /**
     * Get all gateways
     * @returns {GatewayState[]}
     */
    getAllGateways() {
        return Array.from(this.registry.values());
    }

    /**
     * Get gateways by type
     * @param {string} type - Gateway type (auth, shopify, charge)
     * @returns {GatewayState[]}
     */
    getGatewaysByType(type) {
        return Array.from(this.registry.values())
            .filter(gateway => gateway.type === type);
    }


    // ==================== State Management Methods ====================

    /**
     * Set gateway state with persistence
     * 
     * Requirements: 1.3, 2.1, 2.4, 6.5
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} state - New state (enabled, maintenance, disabled)
     * @param {Object} options - Additional options
     * @param {string} options.adminId - Admin user ID
     * @param {string} options.reason - Reason for state change
     * @param {string} options.scheduledEnd - Scheduled end time for maintenance
     * @returns {Promise<GatewayState>}
     */
    async setGatewayState(gatewayId, state, options = {}) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        const oldState = gateway.state;
        gateway.setState(state, options);

        // Persist to database (Requirement 1.3)
        await this._persistGatewayState(gateway);

        // Log audit entry (Requirement 6.5)
        await this._logAuditEntry(gatewayId, oldState, state, options.adminId, options.reason);

        // Emit state change event (Requirement 2.4)
        this.emit('stateChange', {
            gatewayId,
            oldState,
            newState: state,
            gateway: gateway.toJSON(),
            timestamp: new Date().toISOString()
        });

        // Broadcast to SSE clients
        this.broadcastStateChange(gatewayId, gateway.toJSON());

        return gateway;
    }

    /**
     * Enable a gateway
     * 
     * Requirements: 2.3
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} adminId - Admin user ID
     * @returns {Promise<GatewayState>}
     */
    async enableGateway(gatewayId, adminId) {
        return this.setGatewayState(gatewayId, GatewayState.STATE.ENABLED, { adminId });
    }

    /**
     * Disable a gateway
     * 
     * Requirements: 2.2
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} adminId - Admin user ID
     * @param {string} reason - Reason for disabling
     * @returns {Promise<GatewayState>}
     */
    async disableGateway(gatewayId, adminId, reason = null) {
        return this.setGatewayState(gatewayId, GatewayState.STATE.DISABLED, { adminId, reason });
    }

    /**
     * Set maintenance mode for a gateway
     * 
     * Requirements: 1.5, 3.3, 3.4
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} adminId - Admin user ID
     * @param {string} reason - Maintenance reason
     * @param {string} scheduledEnd - Optional scheduled end time
     * @returns {Promise<GatewayState>}
     */
    async setMaintenanceMode(gatewayId, adminId, reason = null, scheduledEnd = null) {
        return this.setGatewayState(gatewayId, GatewayState.STATE.MAINTENANCE, {
            adminId,
            reason,
            scheduledEnd
        });
    }

    /**
     * Clear maintenance mode for a gateway
     * 
     * Requirements: 3.4
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} adminId - Admin user ID
     * @returns {Promise<GatewayState>}
     */
    async clearMaintenanceMode(gatewayId, adminId) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        // Maintenance duration tracking removed for logging cleanup
        return this.enableGateway(gatewayId, adminId);
    }

    /**
     * Persist gateway state to database
     * @private
     * @param {GatewayState} gateway - Gateway state to persist
     */
    async _persistGatewayState(gateway) {
        if (!this.supabase) {
            return;
        }

        try {
            const dbData = gateway.toDatabase();

            // Include current health metrics in persistence
            const metrics = this.healthMetrics.get(gateway.id);
            if (metrics) {
                dbData.metrics = metrics.toJSON();
            }

            const { error } = await this.supabase
                .from('gateway_states')
                .upsert(dbData, { onConflict: 'gateway_id' });

            if (error) {

            }
        } catch (err) {

        }
    }

    /**
     * Log an audit entry for gateway state changes
     * 
     * Requirement: 6.5 - Log all gateway state changes with admin ID, timestamp, and reason
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @param {string} oldState - Previous state
     * @param {string} newState - New state
     * @param {string} adminId - Admin user ID who made the change
     * @param {string} reason - Optional reason for the change
     */
    async _logAuditEntry(gatewayId, oldState, newState, adminId = null, reason = null) {
        if (!this.supabase) {
            return;
        }

        try {
            const auditEntry = {
                gateway_id: gatewayId,
                old_state: oldState,
                new_state: newState,
                admin_id: adminId || null,
                reason: reason || null
            };

            const { error } = await this.supabase
                .from('gateway_audit_logs')
                .insert(auditEntry);

            if (error) {

            } else {

            }
        } catch (err) {

        }
    }

    /**
     * Get audit logs for a gateway
     * 
     * Requirement: 6.5 - Support retrieving audit history
     * 
     * @param {string} gatewayId - Gateway ID (optional, if null returns all logs)
     * @param {number} limit - Maximum number of logs to return (default 50)
     * @returns {Promise<Array>} Array of audit log entries
     */
    async getAuditLogs(gatewayId = null, limit = 50) {
        if (!this.supabase) {
            return [];
        }

        try {
            let query = this.supabase
                .from('gateway_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (gatewayId) {
                query = query.eq('gateway_id', gatewayId);
            }

            const { data, error } = await query;

            if (error) {

                return [];
            }

            return data || [];
        } catch (err) {

            return [];
        }
    }

    // ==================== Health Monitoring Methods ====================

    /**
     * Record a successful request for a gateway
     * 
     * Requirements: 1.3, 2.3, 4.1
     * NOTE: No longer automatically changes health status - only tracks metrics and sends recovery notifications
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {number} latencyMs - Response time in milliseconds
     */
    recordSuccess(gatewayId, latencyMs = 0) {
        const metrics = this.healthMetrics.get(gatewayId);
        if (!metrics) {
            return;
        }

        // Record success in metrics (no automatic status change - Requirement 1.3)
        metrics.recordSuccess(latencyMs);

        // Check recovery threshold and send notification if needed (no auto status change)
        this._checkAndSendRecovery(gatewayId, metrics);
    }

    /**
     * Record a failed request for a gateway
     * 
     * Requirements: 1.1, 1.2, 4.1, 6.1
     * NOTE: No longer automatically changes health status - only tracks metrics and sends alerts
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string|Error|Object} errorType - Type of error or error object
     * @param {string} category - Optional failure category (proxy_error, gateway_error, timeout, network_error)
     */
    recordFailure(gatewayId, errorType = null, category = null) {
        const metrics = this.healthMetrics.get(gatewayId);
        if (!metrics) {
            return;
        }

        // Auto-classify if category not provided (Requirement 6.1)
        const failureCategory = category || classifyFailure(errorType);

        // Record failure in metrics (no automatic status change - Requirement 1.1, 1.2)
        metrics.recordFailure(errorType, failureCategory);

        // Check alert thresholds and send notification if needed (no auto status change)
        this._checkAndSendAlert(gatewayId, metrics);
    }

    /**
     * Update gateway health status if it changed
     * @private
     */
    _updateHealthStatus(gatewayId, oldHealth, newHealth) {
        if (oldHealth === newHealth) {
            return;
        }

        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            return;
        }

        gateway.setHealthStatus(newHealth);

        // Emit health change event
        this.emit('healthChange', {
            gatewayId,
            oldHealth,
            newHealth,
            gateway: gateway.toJSON(),
            timestamp: new Date().toISOString()
        });

        // Broadcast to SSE clients using dedicated health change method
        this.broadcastHealthChange(gatewayId, oldHealth, newHealth, gateway.toJSON());

        // Send Telegram notification for significant health changes (Requirements 7.1, 7.2, 7.3)
        if (this.telegramBotService) {
            const timestamp = new Date().toISOString();
            
            if (newHealth === HealthMetrics.HEALTH.OFFLINE || newHealth === HealthMetrics.HEALTH.DEGRADED) {
                // Notify on offline or degraded status (Requirements 7.1, 7.2)
                this.telegramBotService.notifyGatewayHealth({
                    gatewayId,
                    gatewayLabel: gateway.label,
                    previousStatus: oldHealth,
                    newStatus: newHealth,
                    timestamp,
                    isRecovery: false
                }).catch(err => {
                    console.error(`[GatewayManager] Failed to send health notification for ${gatewayId}:`, err.message);
                });
            } else if (oldHealth !== HealthMetrics.HEALTH.ONLINE && newHealth === HealthMetrics.HEALTH.ONLINE) {
                // Recovery notification (Requirement 7.3)
                this.telegramBotService.notifyGatewayHealth({
                    gatewayId,
                    gatewayLabel: gateway.label,
                    previousStatus: oldHealth,
                    newStatus: newHealth,
                    timestamp,
                    isRecovery: true
                }).catch(err => {
                    console.error(`[GatewayManager] Failed to send recovery notification for ${gatewayId}:`, err.message);
                });
            }
        }
    }

    /**
     * Check alert thresholds and send Telegram alert with inline buttons if conditions met
     * Does NOT automatically change health status - only sends notification
     * 
     * Requirements: 2.1, 2.2, 2.6, 7.1
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @param {HealthMetrics} metrics - Health metrics for the gateway
     */
    async _checkAndSendAlert(gatewayId, metrics) {
        // Check if alert thresholds are exceeded
        const alertInfo = metrics.shouldTriggerAlert();
        if (!alertInfo.shouldAlert) {
            return;
        }

        // Check cooldown (Requirement 2.6)
        const alertState = this.alertState.get(gatewayId) || { inAlert: false, lastAlertAt: 0, alertCount: 0 };
        const now = Date.now();
        
        if (now - alertState.lastAlertAt < this.alertCooldown) {
            // Still in cooldown period, don't send another alert
            return;
        }

        // Send alert with inline buttons via Telegram
        if (this.telegramBotService && typeof this.telegramBotService.sendHealthAlert === 'function') {
            const gateway = this.registry.get(gatewayId);
            
            try {
                await this.telegramBotService.sendHealthAlert({
                    gatewayId,
                    gatewayLabel: gateway?.label || gatewayId,
                    currentStatus: gateway?.healthStatus || 'unknown',
                    metrics: alertInfo.metrics,
                    reason: alertInfo.reason
                });
            } catch (err) {
                console.error(`[GatewayManager] Failed to send health alert for ${gatewayId}:`, err.message);
            }
        }

        // Update alert state (Requirement 7.1)
        this.alertState.set(gatewayId, {
            inAlert: true,
            lastAlertAt: now,
            alertCount: alertState.alertCount + 1
        });
    }

    /**
     * Check if gateway has recovered and send recovery notification
     * Does NOT automatically change health status - only sends notification
     * 
     * Requirements: 2.3, 7.2, 7.3
     * 
     * @private
     * @param {string} gatewayId - Gateway ID
     * @param {HealthMetrics} metrics - Health metrics for the gateway
     */
    async _checkAndSendRecovery(gatewayId, metrics) {
        // Check if gateway is in alert state
        const alertState = this.alertState.get(gatewayId);
        if (!alertState?.inAlert) {
            return;
        }

        // Check if recovery threshold is met (5 consecutive successes)
        if (!metrics.shouldTriggerRecovery()) {
            return;
        }

        // Send recovery notification via Telegram
        if (this.telegramBotService && typeof this.telegramBotService.sendRecoveryNotification === 'function') {
            const gateway = this.registry.get(gatewayId);
            
            try {
                await this.telegramBotService.sendRecoveryNotification({
                    gatewayId,
                    gatewayLabel: gateway?.label || gatewayId,
                    currentStatus: gateway?.healthStatus || 'online'
                });
            } catch (err) {
                console.error(`[GatewayManager] Failed to send recovery notification for ${gatewayId}:`, err.message);
            }
        }

        // Clear alert state (Requirement 7.3)
        this.alertState.delete(gatewayId);
    }

    /**
     * Clear alert state for a gateway
     * Called when admin dismisses alert or changes status via Telegram button
     * 
     * Requirements: 3.4, 7.4
     * 
     * @param {string} gatewayId - Gateway ID
     */
    clearAlertState(gatewayId) {
        this.alertState.delete(gatewayId);
    }

    /**
     * Get alert state for a gateway
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Object|null} Alert state or null if not in alert
     */
    getAlertState(gatewayId) {
        return this.alertState.get(gatewayId) || null;
    }

    /**
     * Check if a gateway is currently in alert state
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {boolean} True if gateway is in alert state
     */
    isInAlertState(gatewayId) {
        const alertState = this.alertState.get(gatewayId);
        return alertState?.inAlert === true;
    }

    /**
     * Get health status for a gateway
     * @param {string} gatewayId - Gateway ID
     * @returns {string|null} Health status
     */
    getHealthStatus(gatewayId) {
        const metrics = this.healthMetrics.get(gatewayId);
        return metrics ? metrics.getHealthStatus() : null;
    }

    /**
     * Get health metrics for a gateway
     * @param {string} gatewayId - Gateway ID
     * @returns {Object|null} Health metrics
     */
    getHealthMetrics(gatewayId) {
        const metrics = this.healthMetrics.get(gatewayId);
        return metrics ? metrics.toJSON() : null;
    }

    /**
     * Reset health metrics for a gateway, bringing it back online
     * @param {string} gatewayId - Gateway ID
     * @param {string} adminId - Admin user ID making the change
     * @returns {Promise<Object>} Result with new health status
     */
    async resetHealth(gatewayId, adminId = null) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        const metrics = this.healthMetrics.get(gatewayId);
        const oldHealth = metrics ? metrics.getHealthStatus() : 'unknown';

        if (metrics) {
            metrics.reset();
        }

        // Update gateway health status
        gateway.healthStatus = HealthMetrics.HEALTH.ONLINE;

        // Persist to database
        await this._persistGatewayState(gateway);

        // Log audit entry
        await this._logAuditEntry(gatewayId, oldHealth, 'online', adminId, 'Health metrics reset by admin');

        // Broadcast state change
        this.broadcastStateChange(gatewayId, gateway.toJSON());

        return {
            gatewayId,
            oldHealth,
            newHealth: 'online',
            metrics: metrics ? metrics.toJSON() : null
        };
    }

    /**
     * Manually set gateway health status
     * 
     * Requirements: 1.4, 3.2, 3.3, 4.2, 4.5, 4.6
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} status - New health status (online, degraded, offline)
     * @param {Object} options - Additional options
     * @param {string} options.adminId - Admin user ID making the change
     * @param {string} options.reason - Reason for status change
     * @returns {Promise<Object>} Result with old and new health status
     * @throws {Error} If gateway not found or status invalid
     */
    async setManualHealthStatus(gatewayId, status, options = {}) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        // Validate status (Requirement 4.3)
        const validStatuses = ['online', 'degraded', 'offline'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid health status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
        }

        const oldHealth = gateway.healthStatus;
        
        // Update gateway health status
        gateway.setHealthStatus(status);
        
        // Update metrics stored health status as well
        const metrics = this.healthMetrics.get(gatewayId);
        if (metrics) {
            metrics.setHealthStatus(status);
        }

        // Clear alert state for this gateway (Requirement 7.4)
        this.alertState.delete(gatewayId);

        // Persist to database (Requirement 4.5)
        await this._persistGatewayState(gateway);

        // Log audit entry (Requirement 4.5)
        await this._logAuditEntry(
            gatewayId, 
            oldHealth, 
            status, 
            options.adminId, 
            options.reason || `Manual health status change to ${status}`
        );

        // Broadcast SSE update (Requirement 4.6)
        this.broadcastHealthChange(gatewayId, oldHealth, status, gateway.toJSON());

        // Emit health change event
        this.emit('healthChange', {
            gatewayId,
            oldHealth,
            newHealth: status,
            gateway: gateway.toJSON(),
            manual: true,
            adminId: options.adminId,
            timestamp: new Date().toISOString()
        });

        return { 
            gatewayId, 
            oldHealth, 
            newHealth: status 
        };
    }

    /**
     * Get current alert thresholds (for notifications, not auto status changes)
     * @returns {Object} Current alert thresholds
     */
    getHealthThresholds() {
        return { ...HealthMetrics.ALERT_THRESHOLDS };
    }

    /**
     * Update alert thresholds (runtime only, not persisted)
     * NOTE: These thresholds are for ALERTS only, not automatic status changes
     * @param {Object} thresholds - New thresholds
     * @returns {Object} Updated thresholds
     */
    setHealthThresholds(thresholds) {
        if (thresholds.CONSECUTIVE_FAILURES !== undefined) {
            const failures = parseInt(thresholds.CONSECUTIVE_FAILURES, 10);
            if (failures >= 1 && failures <= 100) {
                HealthMetrics.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES = failures;
            }
        }
        if (thresholds.SUCCESS_RATE_PERCENT !== undefined) {
            const rate = parseInt(thresholds.SUCCESS_RATE_PERCENT, 10);
            if (rate >= 0 && rate <= 100) {
                HealthMetrics.ALERT_THRESHOLDS.SUCCESS_RATE_PERCENT = rate;
            }
        }
        if (thresholds.ROLLING_WINDOW_SIZE !== undefined) {
            const size = parseInt(thresholds.ROLLING_WINDOW_SIZE, 10);
            if (size >= 1 && size <= 100) {
                HealthMetrics.ALERT_THRESHOLDS.ROLLING_WINDOW_SIZE = size;
            }
        }
        if (thresholds.RECOVERY_CONSECUTIVE !== undefined) {
            const recovery = parseInt(thresholds.RECOVERY_CONSECUTIVE, 10);
            if (recovery >= 1 && recovery <= 50) {
                HealthMetrics.ALERT_THRESHOLDS.RECOVERY_CONSECUTIVE = recovery;
            }
        }

        return this.getHealthThresholds();
    }

    // ==================== Availability Check Methods ====================

    /**
     * Check if a gateway is available for use
     * 
     * Requirements: 2.2, 2.3
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {boolean}
     */
    isAvailable(gatewayId) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            return false;
        }
        return gateway.isAvailable();
    }

    /**
     * Get available gateways of a specific type
     * 
     * Requirements: 2.2, 2.3
     * 
     * @param {string} type - Gateway type (auth, shopify, charge)
     * @returns {GatewayState[]}
     */
    getAvailableGateways(type) {
        return this.getGatewaysByType(type)
            .filter(gateway => gateway.isAvailable());
    }

    /**
     * Get unavailability reason for a gateway
     * @param {string} gatewayId - Gateway ID
     * @returns {Object|null} Reason object with type and message
     */
    getUnavailabilityReason(gatewayId) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            return { type: 'not_found', message: 'Gateway not found' };
        }

        if (gateway.isAvailable()) {
            return null;
        }

        if (gateway.state === GatewayState.STATE.MAINTENANCE) {
            return {
                type: 'maintenance',
                message: gateway.maintenanceReason || 'Gateway is under maintenance',
                startedAt: gateway.maintenanceStartedAt,
                scheduledEnd: gateway.maintenanceScheduledEnd
            };
        }

        if (gateway.state === GatewayState.STATE.DISABLED) {
            return {
                type: 'disabled',
                message: 'Gateway is disabled'
            };
        }

        if (gateway.healthStatus === GatewayState.HEALTH.OFFLINE) {
            return {
                type: 'offline',
                message: 'Gateway is offline due to health issues'
            };
        }

        return { type: 'unknown', message: 'Gateway is unavailable' };
    }

    // ==================== Proxy Configuration Methods ====================
    // Requirements: 1.3, 2.3, 2.4, 3.1, 5.1-5.5

    /**
     * Get proxy configuration for a gateway
     * 
     * Requirement: 3.1 - Retrieve proxy configuration from Gateway_Manager
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Object|null} Proxy config or null if not configured
     */
    getProxyConfig(gatewayId) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            return null;
        }
        return gateway.getProxyConfig();
    }

    /**
     * Set proxy configuration for a gateway
     * 
     * Requirements: 1.3, 2.3 - Validate and persist proxy config
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {Object} config - Proxy config { host, port, type, username, password }
     * @param {string} adminId - Admin user ID making the change
     * @returns {Promise<GatewayState>}
     * @throws {Error} If gateway not found or config invalid
     */
    async setProxyConfig(gatewayId, config, adminId = null) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        // Validate config - host and port required if any field is set
        if (config) {
            const hasAnyField = config.host || config.port || config.type ||
                config.username || config.password;
            if (hasAnyField && (!config.host || !config.port)) {
                throw new Error('Proxy configuration requires both host and port');
            }
        }

        // Set proxy config on gateway (validates internally)
        gateway.setProxyConfig(config);

        if (adminId) {
            gateway.updatedBy = adminId;
        }

        // Auto-reset health metrics when proxy changes to bring gateway back online
        // This prevents "gateway inactive" errors when switching proxies
        const metrics = this.healthMetrics.get(gatewayId);
        if (metrics) {
            const oldHealth = metrics.getHealthStatus();
            metrics.reset();
            gateway.healthStatus = HealthMetrics.HEALTH.ONLINE;
            
            // Broadcast health change if it was offline/degraded
            if (oldHealth !== HealthMetrics.HEALTH.ONLINE) {
                this.broadcastHealthChange(gatewayId, oldHealth, HealthMetrics.HEALTH.ONLINE, gateway.toJSON());
            }
        }

        // Persist to database (Requirement 1.3)
        await this._persistGatewayState(gateway);

        // Log audit entry
        await this._logAuditEntry(gatewayId, 'proxy_updated', 'proxy_updated', adminId,
            config ? `Proxy set to ${config.host}:${config.port}` : 'Proxy cleared');

        // Emit proxy change event
        this.emit('proxyChange', {
            gatewayId,
            hasProxy: gateway.hasProxy(),
            gateway: gateway.toJSON(),
            timestamp: new Date().toISOString()
        });

        // Broadcast to SSE clients
        this.broadcastStateChange(gatewayId, gateway.toJSON());

        return gateway;
    }

    /**
     * Clear proxy configuration for a gateway
     * 
     * Requirement: 2.4 - Allow clearing proxy config
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} adminId - Admin user ID making the change
     * @returns {Promise<GatewayState>}
     */
    async clearProxyConfig(gatewayId, adminId = null) {
        return this.setProxyConfig(gatewayId, null, adminId);
    }

    /**
     * Test proxy connection without affecting health metrics
     * 
     * Requirements: 5.1-5.5 - Test proxy connection with timeout
     * 
     * @param {Object} config - Proxy config to test { host, port, type, username, password }
     * @returns {Promise<Object>} { success: boolean, latencyMs?: number, error?: string }
     */
    async testProxyConnection(config) {
        if (!config || !config.host || !config.port) {
            return { success: false, error: 'Invalid proxy configuration: host and port required' };
        }

        const startTime = Date.now();
        const timeout = 10000; // 10 second timeout (Requirement 5.4)

        try {
            // Build proxy URL based on type
            const proxyType = config.type || 'http';
            let proxyUrl;

            if (config.username && config.password) {
                proxyUrl = `${proxyType}://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}`;
            } else {
                proxyUrl = `${proxyType}://${config.host}:${config.port}`;
            }

            // Create appropriate agent based on proxy type
            let agent;
            if (proxyType === 'socks4' || proxyType === 'socks5') {
                const { SocksProxyAgent } = await import('socks-proxy-agent');
                agent = new SocksProxyAgent(proxyUrl);
            } else {
                const { HttpsProxyAgent } = await import('https-proxy-agent');
                agent = new HttpsProxyAgent(proxyUrl);
            }

            // Test connection using got (already in dependencies)
            const got = (await import('got')).default;

            const response = await got('https://httpbin.org/ip', {
                agent: { https: agent },
                timeout: { request: timeout },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                throwHttpErrors: false
            });

            const latencyMs = Date.now() - startTime;

            if (response.statusCode >= 200 && response.statusCode < 300) {
                return {
                    success: true,
                    latencyMs,
                    message: `Proxy connection successful (${latencyMs}ms)`
                };
            } else {
                return {
                    success: false,
                    error: `Proxy returned HTTP ${response.statusCode}`,
                    latencyMs
                };
            }
        } catch (err) {
            const latencyMs = Date.now() - startTime;

            // Classify the error
            let errorMessage;
            if (err.code === 'ETIMEDOUT' || err.name === 'TimeoutError' || err.message?.includes('timeout')) {
                errorMessage = 'Connection timeout';
            } else if (err.code === 'ECONNREFUSED') {
                errorMessage = 'Connection refused';
            } else if (err.code === 'ENOTFOUND') {
                errorMessage = 'DNS resolution failed';
            } else if (err.message?.includes('407') || err.message?.includes('auth') || err.message?.includes('Proxy')) {
                errorMessage = 'Authentication failed';
            } else if (err.code === 'ENETUNREACH') {
                errorMessage = 'Network unreachable';
            } else {
                errorMessage = err.message || 'Unknown error';
            }

            return {
                success: false,
                error: errorMessage,
                latencyMs
            };
        }
    }

    // ==================== SSE Methods ====================
    // Requirements: 7.1, 7.4

    /**
     * Add an SSE client for real-time updates
     * 
     * Requirement: 7.1 - Support real-time status updates via SSE
     * 
     * @param {Object} res - Express response object
     */
    addSSEClient(res) {
        this.sseClients.add(res);

    }

    /**
     * Remove an SSE client
     * 
     * Requirement: 7.4 - Handle client disconnection cleanup
     * 
     * @param {Object} res - Express response object
     */
    removeSSEClient(res) {
        const deleted = this.sseClients.delete(res);
        if (deleted) {

        }
    }

    /**
     * Broadcast state change to all SSE clients
     * 
     * Requirement: 7.1 - Broadcast changes to all connected clients
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {Object} gateway - Gateway state object
     */
    broadcastStateChange(gatewayId, gateway) {
        if (this.sseClients.size === 0) {
            return;
        }

        const message = JSON.stringify({
            type: 'stateChange',
            gatewayId,
            gateway,
            timestamp: new Date().toISOString()
        });

        const disconnectedClients = [];

        for (const client of this.sseClients) {
            try {
                client.write(`data: ${message}\n\n`);
            } catch (err) {
                // Client disconnected, mark for removal
                disconnectedClients.push(client);
            }
        }

        // Clean up disconnected clients
        for (const client of disconnectedClients) {
            this.sseClients.delete(client);
        }

        if (disconnectedClients.length > 0) {

        }
    }

    /**
     * Broadcast health change to all SSE clients
     * 
     * Requirement: 7.1 - Broadcast health changes to all connected clients
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string} oldHealth - Previous health status
     * @param {string} newHealth - New health status
     * @param {Object} gateway - Gateway state object
     */
    broadcastHealthChange(gatewayId, oldHealth, newHealth, gateway) {
        if (this.sseClients.size === 0) {
            return;
        }

        const message = JSON.stringify({
            type: 'healthChange',
            gatewayId,
            oldHealth,
            newHealth,
            state: gateway,
            timestamp: new Date().toISOString()
        });

        const disconnectedClients = [];

        for (const client of this.sseClients) {
            try {
                client.write(`data: ${message}\n\n`);
            } catch (err) {
                disconnectedClients.push(client);
            }
        }

        // Clean up disconnected clients
        for (const client of disconnectedClients) {
            this.sseClients.delete(client);
        }
    }

    /**
     * Send current state to a specific SSE client
     * 
     * Requirement: 7.4 - Support reconnection and state sync
     * 
     * @param {Object} res - Express response object
     */
    sendCurrentState(res) {
        const gateways = this.getAllGateways().map(g => g.toJSON());
        const message = JSON.stringify({
            type: 'initial',
            gateways,
            timestamp: new Date().toISOString()
        });

        try {
            res.write(`data: ${message}\n\n`);
        } catch (err) {

            // Remove client if we can't send initial state
            this.sseClients.delete(res);
        }
    }

    /**
     * Broadcast credit rate change to all SSE clients
     * 
     * Requirement: 14.1 - Broadcast credit rate changes via SSE
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {number} oldRate - Previous credit rate
     * @param {number} newRate - New credit rate
     * @param {boolean} isCustom - Whether the new rate is custom
     */
    broadcastCreditRateChange(gatewayId, oldRate, newRate, isCustom) {
        if (this.sseClients.size === 0) {
            return;
        }

        const message = JSON.stringify({
            type: 'creditRateChange',
            gatewayId,
            oldRate,
            newRate,
            isCustom,
            timestamp: new Date().toISOString()
        });

        const disconnectedClients = [];

        for (const client of this.sseClients) {
            try {
                client.write(`data: ${message}\n\n`);
            } catch (err) {
                // Client disconnected, mark for removal
                disconnectedClients.push(client);
            }
        }

        // Clean up disconnected clients
        for (const client of disconnectedClients) {
            this.sseClients.delete(client);
        }

        if (disconnectedClients.length > 0) {

        }

    }

    /**
     * Broadcast tier restriction change via SSE
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {string|null} oldTier - Previous tier restriction
     * @param {string|null} newTier - New tier restriction
     */
    broadcastTierRestrictionChange(gatewayId, oldTier, newTier) {
        if (this.sseClients.size === 0) {
            return;
        }

        const message = JSON.stringify({
            type: 'tierRestrictionChange',
            gatewayId,
            oldTier,
            newTier,
            timestamp: new Date().toISOString()
        });

        const disconnectedClients = [];

        for (const client of this.sseClients) {
            try {
                client.write(`data: ${message}\n\n`);
            } catch (err) {
                disconnectedClients.push(client);
            }
        }

        for (const client of disconnectedClients) {
            this.sseClients.delete(client);
        }

    }

    /**
     * Get the number of connected SSE clients
     * @returns {number}
     */
    getSSEClientCount() {
        return this.sseClients.size;
    }

    /**
     * Generic broadcast method for any data to all SSE clients
     * 
     * Used by other services (e.g., TierLimitService) to broadcast events
     * 
     * @param {Object} data - Data object to broadcast (must include 'type' field)
     */
    broadcast(data) {
        if (this.sseClients.size === 0) {
            return;
        }

        const message = JSON.stringify({
            ...data,
            timestamp: data.timestamp || new Date().toISOString()
        });

        const disconnectedClients = [];

        for (const client of this.sseClients) {
            try {
                client.write(`data: ${message}\n\n`);
            } catch (err) {
                disconnectedClients.push(client);
            }
        }

        // Clean up disconnected clients
        for (const client of disconnectedClients) {
            this.sseClients.delete(client);
        }

        if (disconnectedClients.length > 0) {

        }

    }

    /**
     * Get gateway configuration (SK/PK keys) for SK-based auth gateways
     * 
     * @param {string} gatewayId - Gateway ID
     * @returns {Object|null} Config with skKey and pkKey, or null if not found
     */
    getGatewayConfig(gatewayId) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            return null;
        }
        return {
            skKey: gateway.skKey || null,
            pkKey: gateway.pkKey || null
        };
    }

    /**
     * Set gateway configuration (SK/PK keys) for SK-based auth gateways
     * 
     * @param {string} gatewayId - Gateway ID
     * @param {Object} config - Config with skKey and pkKey
     * @param {string} adminId - Admin user ID making the change
     * @returns {Promise<GatewayState>}
     */
    async setGatewayConfig(gatewayId, config, adminId = null) {
        const gateway = this.registry.get(gatewayId);
        if (!gateway) {
            throw new Error(`Gateway not found: ${gatewayId}`);
        }

        // Update gateway with SK/PK keys
        if (config.skKey !== undefined) {
            gateway.skKey = config.skKey;
        }
        if (config.pkKey !== undefined) {
            gateway.pkKey = config.pkKey;
        }

        if (adminId) {
            gateway.updatedBy = adminId;
        }

        // Persist to database
        await this._persistGatewayConfig(gateway);

        // Log audit entry
        await this._logAuditEntry(gatewayId, 'config_updated', 'config_updated', adminId,
            'SK/PK keys updated');

        return gateway;
    }

    /**
     * Persist gateway config (SK/PK keys) to database
     * @private
     */
    async _persistGatewayConfig(gateway) {
        if (!this.supabase) {

            return;
        }

        try {
            const { error } = await this.supabase
                .from('gateway_configs')
                .upsert({
                    gateway_id: gateway.id,
                    gateway_name: gateway.label,
                    sk_key: gateway.skKey,
                    pk_key: gateway.pkKey,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'gateway_id'
                });

            if (error) {

            }
        } catch (err) {

        }
    }

    /**
     * Load gateway config (SK/PK keys) from database
     * @private
     */
    async _loadGatewayConfigs() {
        if (!this.supabase) {
            return;
        }

        try {
            // First check if sk_key column exists (migration may not have run)
            const { data, error } = await this.supabase
                .from('gateway_configs')
                .select('gateway_id, sk_key, pk_key')
                .limit(1);

            // If column doesn't exist, skip loading (migration not run yet)
            if (error && error.message?.includes('does not exist')) {
                return;
            }

            if (error) {
                return;
            }

            // Now load all configs
            const { data: allConfigs, error: allError } = await this.supabase
                .from('gateway_configs')
                .select('gateway_id, sk_key, pk_key');

            if (allError) {
                return;
            }

            let loadedCount = 0;
            for (const config of allConfigs || []) {
                const gateway = this.registry.get(config.gateway_id);
                if (gateway && (config.sk_key || config.pk_key)) {
                    gateway.skKey = config.sk_key;
                    gateway.pkKey = config.pk_key;
                    loadedCount++;
                }
            }
        } catch (err) {
            // Gracefully handle missing columns
            if (err.message?.includes('does not exist')) {
                return;
            }
        }
    }
}
