/**
 * GatewayState domain class
 * Represents the state and availability of a gateway
 */
export class GatewayState {
    static STATE = {
        ENABLED: 'enabled',
        MAINTENANCE: 'maintenance',
        DISABLED: 'disabled'
    };

    static HEALTH = {
        ONLINE: 'online',
        DEGRADED: 'degraded',
        OFFLINE: 'offline'
    };

    static PROXY_TYPES = ['http', 'https', 'socks4', 'socks5'];

    constructor(data = {}) {
        this.id = data.gateway_id || data.id;
        this.type = data.gateway_type || data.type;  // Legacy: 'auth' | 'charge' | 'shopify'
        this.parentType = data.parent_type || data.parentType || this._inferParentType(this.type);
        this.subType = data.sub_type || data.subType || this._inferSubType(this.type);
        this.label = data.gateway_label || data.label;
        this.state = data.state || GatewayState.STATE.ENABLED;
        this.healthStatus = data.health_status || data.healthStatus || GatewayState.HEALTH.ONLINE;
        this.maintenanceReason = data.maintenance_reason || data.maintenanceReason || null;
        this.maintenanceStartedAt = data.maintenance_started_at || data.maintenanceStartedAt || null;
        this.maintenanceScheduledEnd = data.maintenance_scheduled_end || data.maintenanceScheduledEnd || null;
        this.updatedBy = data.updated_by || data.updatedBy || null;
        this.updatedAt = data.updated_at || data.updatedAt || null;
        this.createdAt = data.created_at || data.createdAt || null;
        this.metrics = data.metrics || {};
        
        // Parse proxy config from database or direct assignment
        this.proxyConfig = this._parseProxyConfig(data.proxy_config || data.proxyConfig);
    }

    /**
     * Infer parent type from legacy type field
     * @private
     */
    _inferParentType(type) {
        if (['auth', 'charge'].includes(type)) return 'stripe';
        if (type === 'shopify') return 'shopify';
        return 'unknown';
    }

    /**
     * Infer sub type from legacy type field
     * @private
     */
    _inferSubType(type) {
        if (['auth', 'charge'].includes(type)) return type;
        return null; // Shopify has no sub-type
    }

    /**
     * Parse proxy configuration from various input formats
     * @param {Object|string|null} config - Proxy config data
     * @returns {Object|null} Parsed proxy config or null
     * @private
     */
    _parseProxyConfig(config) {
        if (!config) return null;
        
        // If it's a string (from database JSONB), parse it
        if (typeof config === 'string') {
            try {
                config = JSON.parse(config);
            } catch {
                return null;
            }
        }
        
        // Validate required fields if any field is set
        if (config && typeof config === 'object') {
            const hasAnyField = config.host || config.port || config.type || 
                               config.username || config.password;
            
            if (hasAnyField) {
                // Require host and port if any field is set
                if (!config.host || !config.port) {
                    return null;
                }
                
                return {
                    host: config.host,
                    port: parseInt(config.port, 10),
                    type: GatewayState.PROXY_TYPES.includes(config.type) ? config.type : 'http',
                    username: config.username || null,
                    password: config.password || null
                };
            }
        }
        
        return null;
    }

    /**
     * Set proxy configuration for this gateway
     * @param {Object|null} config - Proxy config { host, port, type, username, password } or null to clear
     * @throws {Error} If config is invalid
     */
    setProxyConfig(config) {
        if (config === null) {
            this.proxyConfig = null;
            this.updatedAt = new Date().toISOString();
            return;
        }
        
        // Validate config
        if (!config.host || !config.port) {
            throw new Error('Proxy configuration requires host and port');
        }
        
        const port = parseInt(config.port, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            throw new Error('Invalid port number. Must be between 1 and 65535');
        }
        
        if (config.type && !GatewayState.PROXY_TYPES.includes(config.type)) {
            throw new Error(`Invalid proxy type: ${config.type}. Must be one of: ${GatewayState.PROXY_TYPES.join(', ')}`);
        }
        
        this.proxyConfig = {
            host: config.host,
            port: port,
            type: config.type || 'http',
            username: config.username || null,
            password: config.password || null
        };
        
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get proxy configuration for this gateway
     * @returns {Object|null} Proxy config or null if not configured
     */
    getProxyConfig() {
        return this.proxyConfig;
    }

    /**
     * Check if this gateway has a proxy configured
     * @returns {boolean}
     */
    hasProxy() {
        return this.proxyConfig !== null;
    }

    /**
     * Check if the gateway is available for use
     * A gateway is available if it's enabled AND not offline
     * @returns {boolean}
     */
    isAvailable() {
        return this.state === GatewayState.STATE.ENABLED && 
               this.healthStatus !== GatewayState.HEALTH.OFFLINE;
    }

    /**
     * Check if the gateway is in maintenance mode
     * @returns {boolean}
     */
    isInMaintenance() {
        return this.state === GatewayState.STATE.MAINTENANCE;
    }

    /**
     * Check if the gateway is disabled
     * @returns {boolean}
     */
    isDisabled() {
        return this.state === GatewayState.STATE.DISABLED;
    }

    /**
     * Check if the gateway is healthy (online or degraded)
     * @returns {boolean}
     */
    isHealthy() {
        return this.healthStatus !== GatewayState.HEALTH.OFFLINE;
    }

    /**
     * Update the state of the gateway
     * @param {string} newState - The new state
     * @param {Object} options - Additional options
     */
    setState(newState, options = {}) {
        if (!Object.values(GatewayState.STATE).includes(newState)) {
            throw new Error(`Invalid state: ${newState}. Must be one of: ${Object.values(GatewayState.STATE).join(', ')}`);
        }
        
        this.state = newState;
        this.updatedAt = new Date().toISOString();
        
        if (options.adminId) {
            this.updatedBy = options.adminId;
        }
        
        // Handle maintenance mode specific fields
        if (newState === GatewayState.STATE.MAINTENANCE) {
            this.maintenanceReason = options.reason || null;
            this.maintenanceStartedAt = new Date().toISOString();
            this.maintenanceScheduledEnd = options.scheduledEnd || null;
        } else {
            // Clear maintenance fields when not in maintenance
            this.maintenanceReason = null;
            this.maintenanceStartedAt = null;
            this.maintenanceScheduledEnd = null;
        }
    }

    /**
     * Update the health status of the gateway
     * @param {string} newHealth - The new health status
     */
    setHealthStatus(newHealth) {
        if (!Object.values(GatewayState.HEALTH).includes(newHealth)) {
            throw new Error(`Invalid health status: ${newHealth}. Must be one of: ${Object.values(GatewayState.HEALTH).join(', ')}`);
        }
        
        this.healthStatus = newHealth;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Convert to JSON for API responses
     * @param {Object} options - Options for serialization
     * @param {boolean} options.maskPassword - Whether to mask the proxy password (default: true)
     * @returns {Object}
     */
    toJSON(options = {}) {
        const { maskPassword = false } = options;
        
        let proxyConfig = null;
        if (this.proxyConfig) {
            proxyConfig = {
                host: this.proxyConfig.host,
                port: this.proxyConfig.port,
                type: this.proxyConfig.type,
                username: this.proxyConfig.username,
                password: maskPassword && this.proxyConfig.password ? '********' : this.proxyConfig.password
            };
        }
        
        return {
            id: this.id,
            type: this.type,
            parentType: this.parentType,
            subType: this.subType,
            label: this.label,
            state: this.state,
            healthStatus: this.healthStatus,
            maintenanceReason: this.maintenanceReason,
            maintenanceStartedAt: this.maintenanceStartedAt,
            maintenanceScheduledEnd: this.maintenanceScheduledEnd,
            isAvailable: this.isAvailable(),
            updatedAt: this.updatedAt,
            proxyConfig: proxyConfig,
            hasProxy: this.hasProxy()
        };
    }

    /**
     * Convert to database format for persistence
     * @returns {Object}
     */
    toDatabase() {
        return {
            gateway_id: this.id,
            gateway_type: this.type,
            parent_type: this.parentType,
            sub_type: this.subType,
            gateway_label: this.label,
            state: this.state,
            health_status: this.healthStatus,
            maintenance_reason: this.maintenanceReason,
            maintenance_started_at: this.maintenanceStartedAt,
            maintenance_scheduled_end: this.maintenanceScheduledEnd,
            updated_by: this.updatedBy,
            updated_at: this.updatedAt,
            metrics: this.metrics,
            proxy_config: this.proxyConfig
        };
    }

    /**
     * Create a GatewayState from database row
     * @param {Object} row - Database row
     * @returns {GatewayState}
     */
    static fromDatabase(row) {
        return new GatewayState(row);
    }

    /**
     * Create a new enabled gateway state
     * @param {string} id - Gateway ID
     * @param {string} type - Gateway type (legacy: auth, charge, shopify)
     * @param {string} label - Gateway label
     * @param {Object} options - Additional options
     * @param {string} options.parentType - Parent type (stripe, shopify)
     * @param {string} options.subType - Sub type (auth, charge, null)
     * @returns {GatewayState}
     */
    static createEnabled(id, type, label, options = {}) {
        return new GatewayState({
            gateway_id: id,
            gateway_type: type,
            parent_type: options.parentType,
            sub_type: options.subType,
            gateway_label: label,
            state: GatewayState.STATE.ENABLED,
            health_status: GatewayState.HEALTH.ONLINE
        });
    }
}
