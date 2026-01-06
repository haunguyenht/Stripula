import { config, reloadConfig } from '../config/index.js';

/**
 * System Controller
 * Handles system-level operations (health, config, settings, tier limits, maintenance mode, error reporting)
 * Routes: /api/system/*
 * 
 * Requirements:
 * - 1.1: Enable maintenance mode via admin panel with broadcast to all clients
 * - 1.2: Enable maintenance mode via Telegram bot command
 * - 1.5: Disable maintenance mode and notify via Telegram
 * - 6.4: POST /api/errors/report for client-side errors
 */
export class SystemController {
    constructor(options = {}) {
        this.tierLimitService = options.tierLimitService || null;
        this.maintenanceService = options.maintenanceService || null;
        this.errorReporterService = options.errorReporterService || null;
    }

    /**
     * GET /api/system/health
     */
    health(req, res) {
        res.json({
            status: 'ok',
            service: 'stripe-validator-backend',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }

    /**
     * GET /api/system/config
     */
    getConfig(req, res) {
        res.json({
            auth3Email: config.auth.auth3.email ? '***configured***' : 'not set',
            proxyEnabled: config.proxy.enabled,
            proxyUrl: config.proxy.url ? '***configured***' : 'not set',
            debug: config.debug
        });
    }

    /**
     * POST /api/system/config/reload
     */
    reloadConfig(req, res) {
        try {
            const newConfig = reloadConfig();

            res.json({ 
                status: 'OK', 
                message: 'Config reloaded',
                auth3Email: newConfig.auth.auth3.email ? '***configured***' : 'not set',
                proxyEnabled: newConfig.proxy.enabled,
                proxyUrl: newConfig.proxy.url ? '***configured***' : 'not set'
            });
        } catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/system/settings
     */
    settings(req, res) {
        const { fastMode } = req.body;
        if (typeof fastMode === 'boolean') {

            res.json({ success: true, fastMode });
        } else {
            res.status(400).json({ error: 'fastMode must be boolean' });
        }
    }

    /**
     * POST /api/system/debug-mode
     * @deprecated Browser service removed - endpoint kept for API compatibility
     */
    async debugMode(req, res) {
        res.json({
            status: 'OK',
            message: 'Debug mode endpoint deprecated - browser service removed'
        });
    }

    /**
     * GET /api/system/tier-limits
     * Get current tier limits and defaults for authenticated users
     * 
     * Requirements: 1.1 - Return current tier limits and defaults
     */
    async getTierLimits(req, res) {
        try {
            if (!this.tierLimitService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Tier limit service not available'
                });
            }

            const limitsData = await this.tierLimitService.getTierLimits();

            res.json({
                status: 'OK',
                limits: limitsData.limits,
                defaults: limitsData.defaults,
                metadata: limitsData.metadata,
                timestamp: new Date().toISOString()
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch tier limits'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Maintenance Mode Endpoints
    // Requirements: 1.1, 1.2, 1.5
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/system/maintenance/status
     * Get current maintenance mode status (public endpoint)
     * 
     * Requirement: 1.1 - Return current maintenance state
     */
    async getMaintenanceStatus(req, res) {
        try {
            if (!this.maintenanceService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Maintenance service not available'
                });
            }

            const status = this.maintenanceService.getStatus();

            res.json({
                status: 'OK',
                maintenance: status,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[SystemController] Error getting maintenance status:', error.message);
            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch maintenance status'
            });
        }
    }

    /**
     * GET /api/system/maintenance/stream
     * SSE endpoint for real-time maintenance status updates
     * 
     * Requirement: 1.1 - Broadcast to all connected clients
     */
    async streamMaintenanceStatus(req, res) {
        try {
            if (!this.maintenanceService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Maintenance service not available'
                });
            }

            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
            res.flushHeaders();

            // Add client to maintenance service
            this.maintenanceService.addClient(res);

            // Send initial connection message
            res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

            // Handle client disconnect
            req.on('close', () => {
                this.maintenanceService.removeClient(res);
            });

            // Keep connection alive with heartbeat
            const heartbeatInterval = setInterval(() => {
                if (!res.writableEnded) {
                    res.write(`: heartbeat\n\n`);
                } else {
                    clearInterval(heartbeatInterval);
                }
            }, 30000); // 30 second heartbeat

            // Clean up on close
            res.on('close', () => {
                clearInterval(heartbeatInterval);
            });

        } catch (error) {
            console.error('[SystemController] Error setting up maintenance stream:', error.message);
            if (!res.headersSent) {
                res.status(500).json({
                    status: 'ERROR',
                    code: 'STREAM_FAILED',
                    message: 'Failed to establish maintenance status stream'
                });
            }
        }
    }

    /**
     * POST /api/admin/maintenance/enable
     * Enable maintenance mode (admin only)
     * 
     * Requirements: 1.1, 1.2 - Enable maintenance mode via admin panel
     */
    async enableMaintenance(req, res) {
        try {
            if (!this.maintenanceService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Maintenance service not available'
                });
            }

            const { reason, estimatedEndTime } = req.body;
            const adminId = req.user?.id || null;
            const adminName = req.user?.first_name || req.user?.username || 'Admin';

            // Validate estimatedEndTime if provided
            if (estimatedEndTime) {
                const endDate = new Date(estimatedEndTime);
                if (isNaN(endDate.getTime())) {
                    return res.status(400).json({
                        status: 'ERROR',
                        code: 'INVALID_DATE',
                        message: 'Invalid estimatedEndTime format. Use ISO 8601 format.'
                    });
                }
                if (endDate <= new Date()) {
                    return res.status(400).json({
                        status: 'ERROR',
                        code: 'INVALID_DATE',
                        message: 'estimatedEndTime must be in the future'
                    });
                }
            }

            const result = await this.maintenanceService.setMaintenance(true, {
                reason: reason || null,
                estimatedEndTime: estimatedEndTime || null,
                adminId,
                adminName
            });

            res.json({
                status: 'OK',
                message: 'Maintenance mode enabled',
                maintenance: result.state,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[SystemController] Error enabling maintenance:', error.message);
            res.status(500).json({
                status: 'ERROR',
                code: 'ENABLE_FAILED',
                message: 'Failed to enable maintenance mode'
            });
        }
    }

    /**
     * POST /api/admin/maintenance/disable
     * Disable maintenance mode (admin only)
     * 
     * Requirement: 1.5 - Disable maintenance mode and notify via Telegram
     */
    async disableMaintenance(req, res) {
        try {
            if (!this.maintenanceService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Maintenance service not available'
                });
            }

            const adminId = req.user?.id || null;
            const adminName = req.user?.first_name || req.user?.username || 'Admin';

            const result = await this.maintenanceService.setMaintenance(false, {
                adminId,
                adminName
            });

            res.json({
                status: 'OK',
                message: 'Maintenance mode disabled',
                maintenance: result.state,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[SystemController] Error disabling maintenance:', error.message);
            res.status(500).json({
                status: 'ERROR',
                code: 'DISABLE_FAILED',
                message: 'Failed to disable maintenance mode'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Error Reporting Endpoint
    // Requirement: 6.4 - POST /api/errors/report for client-side errors
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/errors/report
     * Report client-side errors to the system
     * 
     * Requirement: 6.4 - Report client-side errors
     */
    async reportError(req, res) {
        try {
            if (!this.errorReporterService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Error reporter service not available'
                });
            }

            const { message, stack, componentStack, url, userAgent: clientUserAgent } = req.body;

            // Validate required fields
            if (!message) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_MESSAGE',
                    message: 'Error message is required'
                });
            }

            // Create error object from client data
            const clientError = new Error(message);
            clientError.name = 'ClientError';
            clientError.stack = stack || componentStack || `ClientError: ${message}\n    at ${url || 'unknown'}`;

            // Report the error
            const result = await this.errorReporterService.reportError(clientError, {
                req: {
                    ...req,
                    originalUrl: url || req.originalUrl,
                    headers: {
                        ...req.headers,
                        'user-agent': clientUserAgent || req.headers['user-agent']
                    }
                },
                user: req.user || null
            });

            res.json({
                status: 'OK',
                errorId: result.errorId,
                reported: result.reported,
                message: 'Error reported successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[SystemController] Error reporting client error:', error.message);
            res.status(500).json({
                status: 'ERROR',
                code: 'REPORT_FAILED',
                message: 'Failed to report error'
            });
        }
    }

    getRoutes() {
        return {
            health: this.health.bind(this),
            getConfig: this.getConfig.bind(this),
            reloadConfig: this.reloadConfig.bind(this),
            settings: this.settings.bind(this),
            debugMode: this.debugMode.bind(this),
            getTierLimits: this.getTierLimits.bind(this),
            // Maintenance endpoints
            getMaintenanceStatus: this.getMaintenanceStatus.bind(this),
            streamMaintenanceStatus: this.streamMaintenanceStatus.bind(this),
            enableMaintenance: this.enableMaintenance.bind(this),
            disableMaintenance: this.disableMaintenance.bind(this),
            // Error reporting endpoint
            reportError: this.reportError.bind(this)
        };
    }
}
