import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';

/**
 * Health Controller
 * Handles health check endpoints for monitoring
 * Routes: /api/health, /api/health/detailed
 * 
 * Requirements: 7.3
 */
export class HealthController {
    constructor(options = {}) {
        this.startTime = Date.now();
    }

    /**
     * GET /api/health
     * Basic health check
     * 
     * Requirement: 7.3
     */
    async health(req, res) {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * GET /api/health/detailed
     * Detailed health check with database status
     * 
     * Requirement: 7.3
     */
    async healthDetailed(req, res) {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            database: {
                status: 'unknown',
                configured: isSupabaseConfigured()
            }
        };

        // Check database connectivity
        if (isSupabaseConfigured()) {
            try {
                const start = Date.now();
                const { error } = await supabase
                    .from('users')
                    .select('id')
                    .limit(1);

                const latency = Date.now() - start;

                if (error) {
                    health.database.status = 'error';
                    health.database.error = error.message;
                    health.status = 'degraded';
                } else {
                    health.database.status = 'ok';
                    health.database.latencyMs = latency;
                }
            } catch (error) {
                health.database.status = 'error';
                health.database.error = error.message;
                health.status = 'degraded';
            }
        } else {
            health.database.status = 'not_configured';
            health.status = 'degraded';
        }

        // Return appropriate status code
        const statusCode = health.status === 'ok' ? 200 : 503;
        res.status(statusCode).json(health);
    }

    /**
     * Get route handlers
     */
    getRoutes() {
        return {
            health: this.health.bind(this),
            healthDetailed: this.healthDetailed.bind(this)
        };
    }
}

export default HealthController;
