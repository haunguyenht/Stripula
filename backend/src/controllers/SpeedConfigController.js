/**
 * Speed Config Controller
 * Handles speed configuration endpoints for gateway speed limits
 * 
 * Routes:
 * - GET /api/speed-config/:gatewayId - get configs for gateway
 * - GET /api/speed-config/:gatewayId/:tier - get specific config
 * - GET /api/speed-config - get all configs (admin matrix)
 * - GET /api/speed-config/comparison/:gatewayId - get tier comparison
 * - PATCH /api/admin/speed-config/:gatewayId/:tier - update config (admin)
 * - POST /api/admin/speed-config/reset - reset to defaults (admin)
 * 
 * Requirements: 1.1, 1.2, 1.6, 3.6, 4.1, 4.2
 */
export class SpeedConfigController {
    constructor(options = {}) {
        this.speedConfigService = options.speedConfigService;
        this.speedManager = options.speedManager;

        if (!this.speedConfigService) {
            throw new Error('SpeedConfigController requires speedConfigService');
        }
        if (!this.speedManager) {
            throw new Error('SpeedConfigController requires speedManager');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Public Endpoints (Authenticated Users)
    // Requirements: 3.6, 4.1, 4.2
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/speed-config/:gatewayId
     * Get speed configs for a gateway (all tiers)
     * 
     * Requirements: 4.1, 4.2
     */
    async getGatewayConfigs(req, res) {
        try {
            const { gatewayId } = req.params;

            if (!gatewayId) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_GATEWAY_ID',
                    message: 'Gateway ID is required'
                });
            }

            const configs = await this.speedConfigService.getGatewaySpeedConfigs(gatewayId);

            res.json({
                status: 'OK',
                gatewayId,
                configs
            });
        } catch (error) {
            if (error.message.includes('Invalid gateway')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_GATEWAY',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch speed configs'
            });
        }
    }

    /**
     * GET /api/speed-config/:gatewayId/:tier
     * Get speed config for specific gateway and tier
     * 
     * Requirements: 4.1, 4.2
     */
    async getSpeedConfig(req, res) {
        try {
            const { gatewayId, tier } = req.params;

            if (!gatewayId) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_GATEWAY_ID',
                    message: 'Gateway ID is required'
                });
            }

            if (!tier) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_TIER',
                    message: 'Tier is required'
                });
            }

            const config = await this.speedConfigService.getSpeedConfig(gatewayId, tier);

            res.json({
                status: 'OK',
                config
            });
        } catch (error) {
            if (error.message.includes('Invalid gateway')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_GATEWAY',
                    message: error.message
                });
            }

            if (error.message.includes('Invalid tier')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_TIER',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch speed config'
            });
        }
    }

    /**
     * GET /api/speed-config
     * Get all speed configs in matrix format (admin view)
     * 
     * Requirement: 1.6
     */
    async getAllConfigs(req, res) {
        try {
            const matrix = await this.speedConfigService.getAllSpeedConfigs();

            res.json({
                status: 'OK',
                ...matrix
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch speed config matrix'
            });
        }
    }

    /**
     * GET /api/speed-config/comparison/:gatewayId
     * Get speed comparison across all tiers for a gateway
     * 
     * Requirements: 3.6, 4.1, 4.2
     */
    async getSpeedComparison(req, res) {
        try {
            const { gatewayId } = req.params;

            if (!gatewayId) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_GATEWAY_ID',
                    message: 'Gateway ID is required'
                });
            }

            const comparison = await this.speedManager.getSpeedComparison(gatewayId);

            res.json({
                status: 'OK',
                gatewayId,
                comparison
            });
        } catch (error) {
            if (error.message.includes('Invalid gateway')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_GATEWAY',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch speed comparison'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Admin Endpoints (Admin Role Required)
    // Requirements: 1.1, 1.2, 1.6
    // ═══════════════════════════════════════════════════════════════

    /**
     * PATCH /api/admin/speed-config/:gatewayId/:tier
     * Update speed config for gateway and tier (admin only)
     * 
     * Requirements: 1.1, 1.2
     */
    async updateSpeedConfig(req, res) {
        try {
            const { gatewayId, tier } = req.params;
            const { concurrency, delay } = req.body;

            if (!gatewayId) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_GATEWAY_ID',
                    message: 'Gateway ID is required'
                });
            }

            if (!tier) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_TIER',
                    message: 'Tier is required'
                });
            }

            // Build config update object
            const configUpdate = {};
            if (concurrency !== undefined) {
                configUpdate.concurrency = parseInt(concurrency, 10);
            }
            if (delay !== undefined) {
                configUpdate.delay = parseInt(delay, 10);
            }

            // Validate that at least one field is provided
            if (Object.keys(configUpdate).length === 0) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_CONFIG',
                    message: 'At least one of concurrency or delay must be provided'
                });
            }

            const updated = await this.speedConfigService.updateSpeedConfig(gatewayId, tier, configUpdate);

            res.json({
                status: 'OK',
                message: `Speed config updated for ${gatewayId}/${tier}`,
                config: updated
            });
        } catch (error) {
            if (error.message.includes('Invalid gateway')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_GATEWAY',
                    message: error.message
                });
            }

            if (error.message.includes('Invalid tier')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_TIER',
                    message: error.message
                });
            }

            if (error.message.includes('Concurrency must be') || 
                error.message.includes('Delay must be') ||
                error.message.includes('must have concurrency') ||
                error.message.includes('must have delay')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_CONFIG',
                    message: error.message
                });
            }

            if (error.message.includes('Database not configured')) {
                return res.status(503).json({
                    status: 'ERROR',
                    code: 'DATABASE_UNAVAILABLE',
                    message: 'Database is not configured'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: 'Failed to update speed config'
            });
        }
    }

    /**
     * POST /api/admin/speed-config/reset
     * Reset speed configs to defaults (admin only)
     * 
     * Requirements: 1.1, 1.2
     */
    async resetToDefaults(req, res) {
        try {
            const { gatewayId } = req.body;

            // gatewayId is optional - if not provided, reset all gateways
            await this.speedConfigService.resetToDefaults(gatewayId || null);

            const message = gatewayId 
                ? `Speed configs reset to defaults for ${gatewayId}`
                : 'All speed configs reset to defaults';

            res.json({
                status: 'OK',
                message
            });
        } catch (error) {
            if (error.message.includes('Invalid gateway')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_GATEWAY',
                    message: error.message
                });
            }

            if (error.message.includes('Database not configured')) {
                return res.status(503).json({
                    status: 'ERROR',
                    code: 'DATABASE_UNAVAILABLE',
                    message: 'Database is not configured'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'RESET_FAILED',
                message: 'Failed to reset speed configs'
            });
        }
    }

    /**
     * Get route handlers
     */
    getRoutes() {
        return {
            // Public routes (authenticated)
            getGatewayConfigs: this.getGatewayConfigs.bind(this),
            getSpeedConfig: this.getSpeedConfig.bind(this),
            getAllConfigs: this.getAllConfigs.bind(this),
            getSpeedComparison: this.getSpeedComparison.bind(this),
            // Admin routes
            updateSpeedConfig: this.updateSpeedConfig.bind(this),
            resetToDefaults: this.resetToDefaults.bind(this)
        };
    }
}

export default SpeedConfigController;
