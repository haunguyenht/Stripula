/**
 * User Controller
 * Handles user profile endpoints
 * Routes: /api/user/*
 * 
 * Requirements: 3.2, 9.3
 */
export class UserController {
    constructor(options = {}) {
        this.userService = options.userService;
        this.userNotificationService = options.userNotificationService;
    }

    /**
     * GET /api/user/profile
     * Get user profile with tier info
     * 
     * Requirement: 3.2
     */
    async getProfile(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Not authenticated'
                });
            }

            // Get fresh user data and check for expired tier
            const { expired, user: freshUser } = await this.userService.checkAndResetExpiredTier(user.id);

            if (!freshUser) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            // Get tier configuration (use updated tier if it was reset)
            const tierConfig = this.userService.getTierConfig(freshUser.tier);

            // Get daily usage stats
            const dailyUsage = await this.userService.getDailyUsage(user.id);

            res.json({
                status: 'OK',
                profile: {
                    id: freshUser.id,
                    telegramId: freshUser.telegram_id,
                    username: freshUser.username,
                    firstName: freshUser.first_name,
                    lastName: freshUser.last_name,
                    photoUrl: freshUser.photo_url,
                    createdAt: freshUser.created_at,
                    totalCardsChecked: freshUser.total_cards_checked || 0,
                    totalHits: freshUser.total_hits || 0
                },
                tier: {
                    name: freshUser.tier,
                    multiplier: tierConfig.multiplier,
                    dailyClaim: tierConfig.dailyClaim,
                    expiresAt: freshUser.tier_expires_at || null
                },
                credits: {
                    balance: parseFloat(freshUser.credit_balance)
                },
                dailyUsage: {
                    cardsUsed: dailyUsage.cardsUsed
                },
                flags: {
                    isFlagged: freshUser.is_flagged || false
                }
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get profile'
            });
        }
    }

    /**
     * GET /api/user/referral
     * Get referral code and stats
     * 
     * Requirement: 9.3
     */
    async getReferral(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Not authenticated'
                });
            }

            const referralStats = await this.userService.getReferralStats(user.id);

            res.json({
                status: 'OK',
                referral: {
                    code: referralStats.referralCode,
                    referralCount: referralStats.referralCount,
                    creditsEarned: referralStats.creditsEarned,
                    maxReferrals: referralStats.maxReferrals,
                    remainingReferrals: referralStats.remainingReferrals,
                    canEarnMore: referralStats.canEarnMore
                }
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get referral info'
            });
        }
    }

    /**
     * GET /api/user/notifications/stream
     * SSE endpoint for real-time user notifications (credit/tier changes)
     */
    async notificationStream(req, res) {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                status: 'ERROR',
                code: 'NOT_AUTHENTICATED',
                message: 'Not authenticated'
            });
        }

        if (!this.userNotificationService) {
            return res.status(503).json({
                status: 'ERROR',
                code: 'SERVICE_UNAVAILABLE',
                message: 'Notification service not available'
            });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        this.userNotificationService.addClient(user.id, res);

        res.write(`data: ${JSON.stringify({ type: 'connected', userId: user.id, timestamp: new Date().toISOString() })}\n\n`);

        const heartbeatInterval = setInterval(() => {
            try {
                res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
            } catch (err) {
                clearInterval(heartbeatInterval);
            }
        }, 30000);

        req.on('close', () => {
            clearInterval(heartbeatInterval);
            this.userNotificationService.removeClient(user.id, res);
        });
    }

    /**
     * Get route handlers
     */
    getRoutes() {
        return {
            getProfile: this.getProfile.bind(this),
            getReferral: this.getReferral.bind(this),
            notificationStream: this.notificationStream.bind(this)
        };
    }
}

export default UserController;
