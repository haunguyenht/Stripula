/**
 * Gateway Controller
 * Handles gateway management endpoints for both public and admin users
 * Routes: /api/gateways/*, /api/admin/gateways/*
 * 
 * Requirements: 5.1, 6.1, 6.2, 6.3, 6.4, 7.1, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 11.1
 */
export class GatewayController {
    constructor(options = {}) {
        this.gatewayManager = options.gatewayManager;
        this.gatewayConfigService = options.gatewayConfigService;
        this.userService = options.userService;
        this.savedProxyService = options.savedProxyService;
    }

    // ═══════════════════════════════════════════════════════════════
    // Public Endpoints (Requirements: 5.1, 7.1)
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/gateways
     * List all gateways with their current status
     * 
     * Requirement: 5.1
     */
    async listGateways(req, res) {
        try {
            const gateways = this.gatewayManager.getAllGateways();
            
            // Return simplified view for public users with type hierarchy
            const gatewayList = gateways.map(gateway => ({
                id: gateway.id,
                type: gateway.type,           // Legacy: auth, charge, shopify
                parentType: gateway.parentType, // stripe or shopify
                subType: gateway.subType,       // auth, charge, or null
                label: gateway.label,
                state: gateway.state,
                healthStatus: gateway.healthStatus,
                isAvailable: gateway.isAvailable(),
                maintenanceReason: gateway.state === 'maintenance' ? gateway.maintenanceReason : null
            }));

            res.json({
                status: 'OK',
                gateways: gatewayList,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch gateways'
            });
        }
    }

    /**
     * GET /api/gateways/status/stream
     * SSE endpoint for real-time gateway status updates
     * 
     * Requirement: 7.1, 7.2
     */
    async streamStatus(req, res) {
        try {
            // Disable request timeout for SSE (keep connection open indefinitely)
            req.setTimeout(0);
            res.setTimeout(0);

            // Set SSE headers (Requirement: 7.1)
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
            res.flushHeaders();

            // Add client to SSE clients set (Requirement: 7.4)
            this.gatewayManager.addSSEClient(res);

            // Send initial state on connection (Requirement: 7.2)
            this.gatewayManager.sendCurrentState(res);

            // Set up keep-alive ping every 30 seconds (Requirement: 7.1)
            const keepAliveInterval = setInterval(() => {
                try {
                    res.write(`: ping ${Date.now()}\n\n`);
                } catch (err) {
                    clearInterval(keepAliveInterval);
                }
            }, 30000);

            // Handle client disconnect (Requirement: 7.4)
            req.on('close', () => {
                clearInterval(keepAliveInterval);
                this.gatewayManager.removeSSEClient(res);
            });

            req.on('error', (err) => {

                clearInterval(keepAliveInterval);
                this.gatewayManager.removeSSEClient(res);
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'STREAM_FAILED',
                message: 'Failed to establish SSE connection'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Admin Endpoints (Requirements: 6.1, 6.2, 6.3)
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/gateways
     * List all gateways with detailed info for admins
     * 
     * Requirement: 6.1
     */
    async adminListGateways(req, res) {
        try {
            const gateways = this.gatewayManager.getAllGateways();
            
            // Return detailed view for admins including health metrics
            const gatewayList = gateways.map(gateway => {
                const metrics = this.gatewayManager.getHealthMetrics(gateway.id);
                return {
                    ...gateway.toJSON(),
                    healthMetrics: metrics
                };
            });

            res.json({
                status: 'OK',
                gateways: gatewayList,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch gateways'
            });
        }
    }

    /**
     * GET /api/admin/gateways/:id
     * Get single gateway details
     * 
     * Requirement: 6.1
     */
    async getGateway(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            const gateway = this.gatewayManager.getGateway(id);

            if (!gateway) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            const metrics = this.gatewayManager.getHealthMetrics(id);

            res.json({
                status: 'OK',
                gateway: {
                    ...gateway.toJSON(),
                    healthMetrics: metrics
                }
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch gateway'
            });
        }
    }

    /**
     * PUT /api/admin/gateways/:id/state
     * Update gateway state (enabled/maintenance/disabled)
     * 
     * Requirement: 6.2
     */
    async updateState(req, res) {
        try {
            const { id } = req.params;
            const { state, reason } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            if (!state) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_STATE',
                    message: 'State is required'
                });
            }

            const validStates = ['enabled', 'maintenance', 'disabled'];
            if (!validStates.includes(state)) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_STATE',
                    message: `Invalid state. Must be one of: ${validStates.join(', ')}`
                });
            }

            const gateway = await this.gatewayManager.setGatewayState(id, state, {
                adminId: req.user.id,
                reason: reason || null
            });

            res.json({
                status: 'OK',
                message: `Gateway state updated to ${state}`,
                gateway: gateway.toJSON()
            });
        } catch (error) {

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: 'Failed to update gateway state'
            });
        }
    }

    /**
     * POST /api/admin/gateways/:id/maintenance
     * Enable maintenance mode for a gateway
     * 
     * Requirement: 6.2
     */
    async enableMaintenance(req, res) {
        try {
            const { id } = req.params;
            const { reason, scheduledEnd } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            const gateway = await this.gatewayManager.setMaintenanceMode(
                id,
                req.user.id,
                reason || null,
                scheduledEnd || null
            );

            res.json({
                status: 'OK',
                message: 'Maintenance mode enabled',
                gateway: gateway.toJSON()
            });
        } catch (error) {

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'MAINTENANCE_FAILED',
                message: 'Failed to enable maintenance mode'
            });
        }
    }

    /**
     * DELETE /api/admin/gateways/:id/maintenance
     * Disable maintenance mode for a gateway
     * 
     * Requirement: 6.2
     */
    async disableMaintenance(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            const gateway = await this.gatewayManager.clearMaintenanceMode(id, req.user.id);

            res.json({
                status: 'OK',
                message: 'Maintenance mode disabled',
                gateway: gateway.toJSON()
            });
        } catch (error) {

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'MAINTENANCE_FAILED',
                message: 'Failed to disable maintenance mode'
            });
        }
    }

    /**
     * GET /api/admin/gateways/:id/health
     * Get detailed health metrics for a gateway
     * 
     * Requirement: 6.3
     */
    async getHealth(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            const gateway = this.gatewayManager.getGateway(id);

            if (!gateway) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            const metrics = this.gatewayManager.getHealthMetrics(id);

            res.json({
                status: 'OK',
                gatewayId: id,
                healthStatus: gateway.healthStatus,
                metrics: metrics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch health metrics'
            });
        }
    }

    /**
     * POST /api/admin/gateways/:id/health/reset
     * Reset health metrics for a gateway, bringing it back online
     */
    async resetHealth(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user?.id;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            const result = await this.gatewayManager.resetHealth(id, adminId);

            res.json({
                status: 'OK',
                message: 'Health metrics reset successfully',
                ...result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'RESET_FAILED',
                message: error.message || 'Failed to reset health metrics'
            });
        }
    }

    /**
     * GET /api/admin/gateways/health/thresholds
     * Get current health thresholds configuration
     */
    async getHealthThresholds(req, res) {
        try {
            const thresholds = this.gatewayManager.getHealthThresholds();

            res.json({
                status: 'OK',
                thresholds,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch health thresholds'
            });
        }
    }

    /**
     * PUT /api/admin/gateways/health/thresholds
     * Update health thresholds configuration
     */
    async updateHealthThresholds(req, res) {
        try {
            const thresholds = req.body;

            if (!thresholds || typeof thresholds !== 'object') {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_BODY',
                    message: 'Thresholds object is required'
                });
            }

            const updated = this.gatewayManager.setHealthThresholds(thresholds);

            res.json({
                status: 'OK',
                message: 'Health thresholds updated successfully',
                thresholds: updated,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: error.message || 'Failed to update health thresholds'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Manual Health Status Control Endpoints (Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5)
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/admin/gateways/:id/health-status
     * Manually set gateway health status
     * 
     * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6
     * - Validate gateway ID and status
     * - Call gatewayManager.setManualHealthStatus()
     * - Return success response with old/new status
     */
    async setHealthStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;

            // Validate gateway ID (Requirement 4.1)
            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            // Validate status (Requirement 4.2, 4.3)
            const validStatuses = ['online', 'degraded', 'offline'];
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_STATUS',
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            // Call gatewayManager.setManualHealthStatus() (Requirements 4.2, 4.5, 4.6)
            const result = await this.gatewayManager.setManualHealthStatus(id, status, {
                adminId: req.user.id,
                reason: reason || `Manual change via admin panel`
            });

            res.json({
                status: 'OK',
                message: `Gateway health status updated to ${status}`,
                ...result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            if (error.message.includes('Invalid health status')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_STATUS',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: error.message || 'Failed to update health status'
            });
        }
    }

    /**
     * POST /api/admin/gateways/:id/reset-metrics
     * Reset health metrics without changing status
     * 
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
     * - Validate gateway ID
     * - Call metrics.reset() without changing health_status
     * - Log audit entry
     * - Return success response
     */
    async resetMetrics(req, res) {
        try {
            const { id } = req.params;

            // Validate gateway ID (Requirement 5.1)
            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            // Get metrics for the gateway
            const metrics = this.gatewayManager.healthMetrics.get(id);
            if (!metrics) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            // Get gateway to retrieve current health status
            const gateway = this.gatewayManager.getGateway(id);
            const currentStatus = gateway ? gateway.healthStatus : 'unknown';

            // Reset metrics without changing health_status (Requirements 5.2, 5.3)
            metrics.reset();

            // Log audit entry (Requirement 5.5)
            await this.gatewayManager._logAuditEntry(
                id, 
                'metrics_reset', 
                'metrics_reset', 
                req.user.id, 
                'Health metrics reset by admin'
            );

            res.json({
                status: 'OK',
                message: 'Health metrics reset successfully',
                gatewayId: id,
                healthStatus: currentStatus, // Status unchanged (Requirement 5.3)
                metrics: metrics.toJSON(),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            // Non-admin user check (Requirement 5.4 - handled by AdminMiddleware)
            res.status(500).json({
                status: 'ERROR',
                code: 'RESET_FAILED',
                message: error.message || 'Failed to reset metrics'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Proxy Configuration Endpoints (Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6)
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/gateways/:id/proxy
     * Get proxy configuration for a gateway (with masked password)
     * 
     * Requirements: 7.1, 7.5, 7.6
     */
    async getProxyConfig(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            const gateway = this.gatewayManager.getGateway(id);

            if (!gateway) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            const proxyConfig = gateway.getProxyConfig();

            res.json({
                status: 'OK',
                gatewayId: id,
                proxyConfig: proxyConfig || null,
                hasProxy: gateway.hasProxy()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch proxy configuration'
            });
        }
    }

    /**
     * PUT /api/admin/gateways/:id/proxy
     * Update proxy configuration for a gateway
     * 
     * Requirements: 7.2, 7.5
     */
    async setProxyConfig(req, res) {
        try {
            const { id } = req.params;
            const { host, port, type, username, password } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            // Validate proxy type if provided
            const validTypes = ['http', 'https', 'socks4', 'socks5'];
            if (type && !validTypes.includes(type)) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_PROXY_TYPE',
                    message: `Invalid proxy type. Must be one of: ${validTypes.join(', ')}`
                });
            }

            // Validate port range
            if (port !== undefined && port !== null) {
                const portNum = parseInt(port, 10);
                if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
                    return res.status(400).json({
                        status: 'ERROR',
                        code: 'INVALID_PORT',
                        message: 'Port must be a number between 1 and 65535'
                    });
                }
            }

            // Build proxy config object
            const proxyConfig = {
                host: host || null,
                port: port ? parseInt(port, 10) : null,
                type: type || 'http',
                username: username || null,
                password: password || null
            };

            // Check if any field is set - if so, host and port are required
            const hasAnyField = proxyConfig.host || proxyConfig.port || 
                               proxyConfig.username || proxyConfig.password;
            if (hasAnyField && (!proxyConfig.host || !proxyConfig.port)) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INCOMPLETE_CONFIG',
                    message: 'Proxy configuration requires both host and port'
                });
            }

            const gateway = await this.gatewayManager.setProxyConfig(
                id, 
                hasAnyField ? proxyConfig : null,
                req.user.id
            );

            res.json({
                status: 'OK',
                message: 'Proxy configuration updated',
                gatewayId: id,
                hasProxy: gateway.hasProxy()
            });
        } catch (error) {

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            if (error.message.includes('requires both host and port')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INCOMPLETE_CONFIG',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: 'Failed to update proxy configuration'
            });
        }
    }

    /**
     * DELETE /api/admin/gateways/:id/proxy
     * Clear proxy configuration for a gateway
     * 
     * Requirements: 7.3, 7.5
     */
    async clearProxyConfig(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            const gateway = await this.gatewayManager.clearProxyConfig(id, req.user.id);

            res.json({
                status: 'OK',
                message: 'Proxy configuration cleared',
                gatewayId: id,
                hasProxy: gateway.hasProxy()
            });
        } catch (error) {

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'CLEAR_FAILED',
                message: 'Failed to clear proxy configuration'
            });
        }
    }

    /**
     * POST /api/admin/gateways/:id/proxy/test
     * Test proxy connection without affecting health metrics
     * 
     * Requirements: 7.4, 7.5
     */
    async testProxyConnection(req, res) {
        try {
            const { id } = req.params;
            const { host, port, type, username, password } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            // Verify gateway exists
            const gateway = this.gatewayManager.getGateway(id);
            if (!gateway) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            // Validate proxy type if provided
            const validTypes = ['http', 'https', 'socks4', 'socks5'];
            if (type && !validTypes.includes(type)) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_PROXY_TYPE',
                    message: `Invalid proxy type. Must be one of: ${validTypes.join(', ')}`
                });
            }

            // Validate port range
            if (port !== undefined && port !== null) {
                const portNum = parseInt(port, 10);
                if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
                    return res.status(400).json({
                        status: 'ERROR',
                        code: 'INVALID_PORT',
                        message: 'Port must be a number between 1 and 65535'
                    });
                }
            }

            // Build proxy config for testing
            const proxyConfig = {
                host: host || null,
                port: port ? parseInt(port, 10) : null,
                type: type || 'http',
                username: username || null,
                password: password || null
            };

            // Validate required fields
            if (!proxyConfig.host || !proxyConfig.port) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INCOMPLETE_CONFIG',
                    message: 'Proxy test requires both host and port'
                });
            }

            // Test the proxy connection (does NOT affect health metrics - Requirement 5.5)
            const result = await this.gatewayManager.testProxyConnection(proxyConfig);

            res.json({
                status: 'OK',
                gatewayId: id,
                testResult: result
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'TEST_FAILED',
                message: 'Failed to test proxy connection'
            });
        }
    }

    /**
     * GET /api/admin/gateways/:id/audit
     * Get audit logs for a specific gateway
     * 
     * Requirement: 6.5
     */
    async getAuditLogs(req, res) {
        try {
            const { id } = req.params;
            const { limit = 50 } = req.query;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            const gateway = this.gatewayManager.getGateway(id);

            if (!gateway) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            const logs = await this.gatewayManager.getAuditLogs(id, parseInt(limit, 10));

            res.json({
                status: 'OK',
                gatewayId: id,
                auditLogs: logs,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch audit logs'
            });
        }
    }

    /**
     * GET /api/admin/gateways/audit
     * Get all audit logs (across all gateways)
     * 
     * Requirement: 6.5
     */
    async getAllAuditLogs(req, res) {
        try {
            const { limit = 50 } = req.query;

            const logs = await this.gatewayManager.getAuditLogs(null, parseInt(limit, 10));

            res.json({
                status: 'OK',
                auditLogs: logs,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch audit logs'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Credit Rate Configuration Endpoints (Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6)
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/gateways/:id/credit-rate
     * Get credit rate for a specific gateway
     * 
     * Requirements: 9.1, 9.4, 9.5, 9.6
     * - Return current rate with isCustom flag
     * - Include default rate for comparison
     * - Require admin authentication
     */
    async getCreditRate(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            // Check if gateway exists (Requirement 9.6)
            const gateway = this.gatewayManager.getGateway(id);
            if (!gateway) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            // Check if gatewayConfigService is available
            if (!this.gatewayConfigService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Gateway config service not available'
                });
            }

            // Get credit rate with metadata
            const rateInfo = await this.gatewayConfigService.getCreditRate(id);

            // Determine billing type based on gateway type
            // auth/shopify = uses pricing_live, charge = uses pricing_approved
            const gatewayType = gateway.type || this._getGatewayType(id);
            const billingType = (gatewayType === 'charge') ? 'approved' : 'live';

            res.json({
                status: 'OK',
                gatewayId: id,
                gatewayName: gateway.label,
                gatewayType: gatewayType,
                billingType,
                // Legacy single rate (backward compat)
                rate: billingType === 'approved' ? rateInfo.pricing.approved : rateInfo.pricing.live,
                defaultRate: billingType === 'approved' ? 5 : 3,
                // New pricing object with both values
                pricing: rateInfo.pricing,
                defaultPricing: { approved: 5, live: 3 },
                isCustom: rateInfo.isCustom,
                updatedAt: rateInfo.updatedAt,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch credit rate'
            });
        }
    }

    /**
     * PUT /api/admin/gateways/:id/credit-rate
     * Update credit rate for a specific gateway
     * 
     * Requirements: 9.2, 9.4, 9.5, 9.6
     * Accepts either:
     * - Legacy: { rate: number } - updates the relevant field based on gateway type
     * - New: { pricing: { approved: number, live: number } } - updates both fields
     */
    async setCreditRate(req, res) {
        try {
            const { id } = req.params;
            const { rate, pricing } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            // Check if gateway exists (Requirement 9.6)
            const gateway = this.gatewayManager.getGateway(id);
            if (!gateway) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            // Check if gatewayConfigService is available
            if (!this.gatewayConfigService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Gateway config service not available'
                });
            }

            // Determine gateway billing type
            const gatewayType = gateway.type || this._getGatewayType(id);
            const billingType = (gatewayType === 'charge') ? 'approved' : 'live';

            // Build updates object
            const updates = {};
            
            if (pricing && typeof pricing === 'object') {
                // New format: { pricing: { approved: number, live: number } }
                if (pricing.approved !== undefined) {
                    const approvedRate = parseFloat(pricing.approved);
                    if (isNaN(approvedRate) || approvedRate < 0.1 || approvedRate > 100.0) {
                        return res.status(400).json({
                            status: 'ERROR',
                            code: 'INVALID_RATE_RANGE',
                            message: 'pricing_approved must be between 0.1 and 100.0'
                        });
                    }
                    updates.pricing_approved = approvedRate;
                }
                if (pricing.live !== undefined) {
                    const liveRate = parseFloat(pricing.live);
                    if (isNaN(liveRate) || liveRate < 0.1 || liveRate > 100.0) {
                        return res.status(400).json({
                            status: 'ERROR',
                            code: 'INVALID_RATE_RANGE',
                            message: 'pricing_live must be between 0.1 and 100.0'
                        });
                    }
                    updates.pricing_live = liveRate;
                }
            } else if (rate !== undefined && rate !== null) {
                // Legacy format: { rate: number } - update based on billing type
                const rateNum = parseFloat(rate);
                if (isNaN(rateNum) || rateNum < 0.1 || rateNum > 100.0) {
                    return res.status(400).json({
                        status: 'ERROR',
                        code: 'INVALID_RATE_RANGE',
                        message: 'Credit rate must be between 0.1 and 100.0'
                    });
                }
                if (billingType === 'approved') {
                    updates.pricing_approved = rateNum;
                } else {
                    updates.pricing_live = rateNum;
                }
            } else {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_RATE',
                    message: 'Credit rate or pricing is required'
                });
            }

            // Update gateway config
            const updated = await this.gatewayConfigService.updateGateway(id, updates);

            // Get updated pricing info
            const rateInfo = await this.gatewayConfigService.getCreditRate(id);

            res.json({
                status: 'OK',
                message: 'Credit rate updated successfully',
                gatewayId: id,
                gatewayName: gateway.label,
                billingType,
                pricing: rateInfo.pricing,
                defaultPricing: { approved: 5, live: 3 },
                isCustom: rateInfo.isCustom,
                updatedAt: updated.updated_at,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            if (error.message.includes('must be between') || error.message.includes('non-negative')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_RATE_RANGE',
                    message: error.message
                });
            }

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: 'Failed to update credit rate'
            });
        }
    }

    /**
     * Helper to get gateway type from ID prefix
     * @private
     */
    _getGatewayType(gatewayId) {
        if (!gatewayId) return 'unknown';
        if (gatewayId.startsWith('auth-') || gatewayId === 'auth') return 'auth';
        if (gatewayId.startsWith('charge-') || gatewayId === 'charge') return 'charge';
        if (gatewayId.startsWith('shopify-') || gatewayId === 'shopify') return 'shopify';
        return 'unknown';
    }

    /**
     * DELETE /api/admin/gateways/:id/credit-rate
     * Reset credit rate to default for a specific gateway
     * 
     * Requirements: 9.3, 9.4, 9.5, 9.6
     * - Reset rate to default
     * - Return default rate
     */
    async resetCreditRate(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Gateway ID is required'
                });
            }

            // Check if gateway exists (Requirement 9.6)
            const gateway = this.gatewayManager.getGateway(id);
            if (!gateway) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            // Check if gatewayConfigService is available
            if (!this.gatewayConfigService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Gateway config service not available'
                });
            }

            // Reset credit rate (includes audit logging and SSE broadcast)
            const result = await this.gatewayConfigService.resetCreditRate(id, req.user.id);

            res.json({
                status: 'OK',
                message: 'Credit rate reset to default',
                gatewayId: id,
                gatewayName: gateway.label,
                oldRate: result.oldRate,
                newRate: result.newRate,
                defaultRate: result.defaultRate,
                isCustom: false,
                updatedAt: result.updatedAt,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'RESET_FAILED',
                message: 'Failed to reset credit rate'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PRICING ENDPOINTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * PUT /api/admin/gateways/:id/pricing
     * Set pricing for a gateway (approved and live rates)
     * 
     * Body: { approved: number, live: number }
     */
    async setPricing(req, res) {
        try {
            const { id } = req.params;
            const { approved, live } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_GATEWAY_ID',
                    message: 'Gateway ID is required'
                });
            }

            if (approved === undefined && live === undefined) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_PRICING',
                    message: 'At least one pricing value (approved or live) is required'
                });
            }

            if (!this.gatewayConfigService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Gateway config service not available'
                });
            }

            const result = await this.gatewayConfigService.setPricing(
                id, 
                { approved, live }, 
                req.user?.id
            );

            res.json({
                status: 'OK',
                message: 'Pricing updated successfully',
                ...result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            res.status(400).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: error.message
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TIER RESTRICTION ENDPOINTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/gateways/:id/tier-restriction
     * Get tier restriction for a gateway
     */
    async getTierRestriction(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_GATEWAY_ID',
                    message: 'Gateway ID is required'
                });
            }

            if (!this.gatewayConfigService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Gateway config service not available'
                });
            }

            const result = await this.gatewayConfigService.getTierRestriction(id);

            res.json({
                status: 'OK',
                ...result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch tier restriction'
            });
        }
    }

    /**
     * PUT /api/admin/gateways/:id/tier-restriction
     * Set tier restriction for a gateway
     * 
     * Body: { minTier: 'bronze' | 'silver' | 'gold' | 'diamond' | null }
     */
    async setTierRestriction(req, res) {
        try {
            const { id } = req.params;
            const { minTier } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_GATEWAY_ID',
                    message: 'Gateway ID is required'
                });
            }

            if (!this.gatewayConfigService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Gateway config service not available'
                });
            }

            const result = await this.gatewayConfigService.setTierRestriction(id, minTier, req.user?.id);

            res.json({
                status: 'OK',
                message: minTier 
                    ? `Gateway restricted to ${minTier}+ tiers` 
                    : 'Tier restriction removed',
                ...result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            if (error.message.includes('Invalid tier')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_TIER',
                    message: error.message
                });
            }

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: 'Failed to update tier restriction'
            });
        }
    }

    /**
     * DELETE /api/admin/gateways/:id/tier-restriction
     * Clear tier restriction for a gateway (allow all tiers)
     */
    async clearTierRestriction(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_GATEWAY_ID',
                    message: 'Gateway ID is required'
                });
            }

            if (!this.gatewayConfigService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Gateway config service not available'
                });
            }

            const result = await this.gatewayConfigService.clearTierRestriction(id, req.user?.id);

            res.json({
                status: 'OK',
                message: 'Tier restriction cleared - all tiers allowed',
                ...result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'GATEWAY_NOT_FOUND',
                    message: 'Gateway not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'CLEAR_FAILED',
                message: 'Failed to clear tier restriction'
            });
        }
    }

    /**
     * GET /api/gateways/tier-restrictions
     * Get all tier restrictions (for authenticated users)
     * Includes check if user can access each gateway
     */
    async getAllTierRestrictions(req, res) {
        try {
            if (!this.gatewayConfigService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Gateway config service not available'
                });
            }

            const userTier = req.user?.tier || 'free';
            const restrictions = await this.gatewayConfigService.getAllTierRestrictions();

            // Add canAccess for each gateway
            const restrictionsWithAccess = await Promise.all(
                restrictions.map(async (r) => {
                    const accessCheck = await this.gatewayConfigService.canUserAccessGateway(r.gatewayId, userTier);
                    return {
                        ...r,
                        canAccess: accessCheck.canAccess,
                        userTier
                    };
                })
            );

            res.json({
                status: 'OK',
                restrictions: restrictionsWithAccess,
                userTier,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch tier restrictions'
            });
        }
    }

    /**
     * GET /api/gateways/credit-rates
     * Get all gateway credit rates for authenticated users
     * 
     * Requirement: 11.1
     * - Return all gateway rates for authenticated users
     * - Include effective rates for user's tier
     */
    async getAllCreditRates(req, res) {
        try {
            // Check if gatewayConfigService is available
            if (!this.gatewayConfigService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Gateway config service not available'
                });
            }

            // Get user's tier (no longer affects pricing - all tiers pay same rate)
            const userTier = req.user?.tier || 'free';

            // Get all credit rates
            const rates = await this.gatewayConfigService.getAllCreditRates();

            // Effective rate = base rate (no tier multiplier)
            const ratesWithEffective = rates.map(rate => ({
                ...rate,
                effectiveRate: rate.rate, // Same rate for all tiers
                userTier
            }));

            res.json({
                status: 'OK',
                rates: ratesWithEffective,
                userTier,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch credit rates'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Saved Proxies Endpoints
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/proxies
     * List all saved proxies
     */
    async listSavedProxies(req, res) {
        try {
            if (!this.savedProxyService) {
                return res.status(501).json({
                    status: 'ERROR',
                    code: 'NOT_IMPLEMENTED',
                    message: 'Saved proxies feature not available'
                });
            }

            const proxies = await this.savedProxyService.getAll();
            const formatted = proxies.map(p => this.savedProxyService.formatProxy(p));

            res.json({
                status: 'OK',
                proxies: formatted,
                count: formatted.length
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: error.message || 'Failed to fetch saved proxies'
            });
        }
    }

    /**
     * POST /api/admin/proxies
     * Save a new proxy configuration
     */
    async saveSavedProxy(req, res) {
        try {
            if (!this.savedProxyService) {
                return res.status(501).json({
                    status: 'ERROR',
                    code: 'NOT_IMPLEMENTED',
                    message: 'Saved proxies feature not available'
                });
            }

            const { host, port, type, username, password, label } = req.body;
            const adminId = req.user?.id;

            if (!host || !port) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_CONFIG',
                    message: 'Host and port are required'
                });
            }

            const saved = await this.savedProxyService.save(
                { host, port, type, username, password, label },
                adminId
            );

            res.json({
                status: 'OK',
                message: 'Proxy saved successfully',
                proxy: this.savedProxyService.formatProxy(saved)
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'SAVE_FAILED',
                message: error.message || 'Failed to save proxy'
            });
        }
    }

    /**
     * DELETE /api/admin/proxies/:id
     * Delete a saved proxy
     */
    async deleteSavedProxy(req, res) {
        try {
            if (!this.savedProxyService) {
                return res.status(501).json({
                    status: 'ERROR',
                    code: 'NOT_IMPLEMENTED',
                    message: 'Saved proxies feature not available'
                });
            }

            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Proxy ID is required'
                });
            }

            await this.savedProxyService.delete(id);

            res.json({
                status: 'OK',
                message: 'Proxy deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'DELETE_FAILED',
                message: error.message || 'Failed to delete proxy'
            });
        }
    }

    /**
     * Get route handlers
     */
    getRoutes() {
        return {
            // Public endpoints
            listGateways: this.listGateways.bind(this),
            streamStatus: this.streamStatus.bind(this),
            // Admin endpoints
            adminListGateways: this.adminListGateways.bind(this),
            getGateway: this.getGateway.bind(this),
            updateState: this.updateState.bind(this),
            enableMaintenance: this.enableMaintenance.bind(this),
            disableMaintenance: this.disableMaintenance.bind(this),
            getHealth: this.getHealth.bind(this),
            resetHealth: this.resetHealth.bind(this),
            getHealthThresholds: this.getHealthThresholds.bind(this),
            updateHealthThresholds: this.updateHealthThresholds.bind(this),
            // Manual health status control endpoints (Requirements: 4.1, 5.1)
            setHealthStatus: this.setHealthStatus.bind(this),
            resetMetrics: this.resetMetrics.bind(this),
            getAuditLogs: this.getAuditLogs.bind(this),
            getAllAuditLogs: this.getAllAuditLogs.bind(this),
            // Proxy configuration endpoints (Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6)
            getProxyConfig: this.getProxyConfig.bind(this),
            setProxyConfig: this.setProxyConfig.bind(this),
            clearProxyConfig: this.clearProxyConfig.bind(this),
            testProxyConnection: this.testProxyConnection.bind(this),
            // Saved proxies endpoints
            listSavedProxies: this.listSavedProxies.bind(this),
            saveSavedProxy: this.saveSavedProxy.bind(this),
            deleteSavedProxy: this.deleteSavedProxy.bind(this),
            // Credit rate configuration endpoints (Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 11.1)
            getCreditRate: this.getCreditRate.bind(this),
            setCreditRate: this.setCreditRate.bind(this),
            resetCreditRate: this.resetCreditRate.bind(this),
            getAllCreditRates: this.getAllCreditRates.bind(this),
            // Pricing endpoints
            setPricing: this.setPricing.bind(this),
            // Tier restriction endpoints
            getTierRestriction: this.getTierRestriction.bind(this),
            setTierRestriction: this.setTierRestriction.bind(this),
            clearTierRestriction: this.clearTierRestriction.bind(this),
            getAllTierRestrictions: this.getAllTierRestrictions.bind(this)
        };
    }
}


export default GatewayController;
