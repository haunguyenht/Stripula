/**
 * Dashboard Controller
 * Handles dashboard endpoints for authenticated users
 * Routes: /api/dashboard/*
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 5.1, 6.1
 */
export class DashboardController {
    constructor(options = {}) {
        this.dashboardService = options.dashboardService;
        
        // Bind methods to preserve 'this' context
        this.getStats = this.getStats.bind(this);
        this.streamStats = this.streamStats.bind(this);
        this.getLeaderboard = this.getLeaderboard.bind(this);
        this.getOnlineUsers = this.getOnlineUsers.bind(this);
    }

    /**
     * Get route handlers for this controller
     * @returns {Object} Route handlers
     */
    getRoutes() {
        return {
            getStats: this.getStats,
            streamStats: this.streamStats,
            getLeaderboard: this.getLeaderboard,
            getOnlineUsers: this.getOnlineUsers
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // Dashboard Endpoints (Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 5.1, 6.1)
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/dashboard/stats
     * Get personal and global statistics
     * 
     * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2
     */
    async getStats(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                });
            }

            // Fetch personal and global stats in parallel
            const [personalStats, globalStats] = await Promise.all([
                this.dashboardService.getPersonalStats(userId),
                this.dashboardService.getGlobalStats()
            ]);

            res.json({
                status: 'OK',
                personal: personalStats,
                global: globalStats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to get dashboard stats:', error.message);

            if (error.message === 'User not found') {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch dashboard stats'
            });
        }
    }

    /**
     * GET /api/dashboard/stats/stream
     * SSE endpoint for real-time stats updates
     * 
     * Requirement: 3.3 (real-time updates via SSE)
     */
    async streamStats(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                });
            }

            // Disable request timeout for SSE (keep connection open indefinitely)
            req.setTimeout(0);
            res.setTimeout(0);

            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
            res.flushHeaders();

            // Add client to SSE clients set
            this.dashboardService.addSSEClient(res);

            // Send initial stats on connection
            try {
                const [personalStats, globalStats] = await Promise.all([
                    this.dashboardService.getPersonalStats(userId),
                    this.dashboardService.getGlobalStats()
                ]);

                const initialData = JSON.stringify({
                    type: 'initialStats',
                    personal: personalStats,
                    global: globalStats,
                    timestamp: new Date().toISOString()
                });

                res.write(`data: ${initialData}\n\n`);
            } catch (err) {
                console.error('Failed to send initial stats:', err.message);
            }

            // Set up keep-alive ping every 30 seconds
            const keepAliveInterval = setInterval(() => {
                try {
                    res.write(`: ping ${Date.now()}\n\n`);
                } catch (err) {
                    clearInterval(keepAliveInterval);
                }
            }, 30000);

            // Handle client disconnect
            req.on('close', () => {
                clearInterval(keepAliveInterval);
                this.dashboardService.removeSSEClient(res);
            });

            req.on('error', (err) => {
                console.error('SSE connection error:', err.message);
                clearInterval(keepAliveInterval);
                this.dashboardService.removeSSEClient(res);
            });
        } catch (error) {
            console.error('Failed to establish SSE connection:', error.message);
            res.status(500).json({
                status: 'ERROR',
                code: 'STREAM_FAILED',
                message: 'Failed to establish SSE connection'
            });
        }
    }

    /**
     * GET /api/dashboard/leaderboard
     * Get top users leaderboard
     * 
     * Requirement: 5.1
     */
    async getLeaderboard(req, res) {
        try {
            const limit = parseInt(req.query.limit, 10) || 5;

            // Validate limit
            if (limit < 1 || limit > 100) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_LIMIT',
                    message: 'Limit must be between 1 and 100'
                });
            }

            const leaderboard = await this.dashboardService.getLeaderboard(limit);

            res.json({
                status: 'OK',
                leaderboard,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to get leaderboard:', error.message);
            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch leaderboard'
            });
        }
    }

    /**
     * GET /api/dashboard/online-users
     * Get paginated list of online users
     * 
     * Requirement: 6.1
     */
    async getOnlineUsers(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;

            // Validate pagination params
            if (page < 1) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_PAGE',
                    message: 'Page must be at least 1'
                });
            }

            if (limit < 1 || limit > 100) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_LIMIT',
                    message: 'Limit must be between 1 and 100'
                });
            }

            const result = await this.dashboardService.getOnlineUsers(page, limit);

            res.json({
                status: 'OK',
                users: result.users,
                pagination: result.pagination,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to get online users:', error.message);
            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch online users'
            });
        }
    }
}

export default DashboardController;
