import { config, reloadConfig } from '../config/index.js';

/**
 * System Controller
 * Handles system-level operations (health, config, settings, tier limits)
 * Routes: /api/system/*
 */
export class SystemController {
    constructor(options = {}) {
        this.tierLimitService = options.tierLimitService || null;
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

    getRoutes() {
        return {
            health: this.health.bind(this),
            getConfig: this.getConfig.bind(this),
            reloadConfig: this.reloadConfig.bind(this),
            settings: this.settings.bind(this),
            debugMode: this.debugMode.bind(this),
            getTierLimits: this.getTierLimits.bind(this)
        };
    }
}
