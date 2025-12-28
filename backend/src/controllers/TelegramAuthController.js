/**
 * Telegram Auth Controller
 * Handles Telegram SSO authentication endpoints
 * Routes: /api/auth/telegram/*
 * 
 * Requirements: 1.1, 2.4
 */
export class TelegramAuthController {
    constructor(options = {}) {
        this.telegramAuthService = options.telegramAuthService;
    }

    /**
     * POST /api/auth/telegram/callback
     * Handle Telegram login callback
     * Supports optional referral_code for new user registration
     */
    async handleCallback(req, res) {
        try {
            const { referral_code, ...authData } = req.body;

            if (!authData || !authData.id || !authData.hash) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_AUTH_DATA',
                    message: 'Invalid Telegram auth data'
                });
            }

            // Authenticate user (with optional referral code)
            const authResult = await this.telegramAuthService.authenticateUser(authData, referral_code);

            if (!authResult.success) {
                const statusCode = authResult.error.includes('expired') ? 401 : 400;
                return res.status(statusCode).json({
                    status: 'ERROR',
                    code: authResult.error.includes('expired') ? 'AUTH_EXPIRED' : 'AUTH_FAILED',
                    message: authResult.error
                });
            }

            // Create session
            const sessionResult = await this.telegramAuthService.createSession(authResult.user);

            if (!sessionResult.success) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SESSION_FAILED',
                    message: sessionResult.error
                });
            }

            // Set HTTP-only cookie with JWT token
            res.cookie('auth_token', sessionResult.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/'
            });

            // Return user data (without sensitive fields)
            const { credit_balance, ...safeUser } = authResult.user;
            
            res.json({
                status: 'OK',
                user: {
                    id: safeUser.id,
                    telegramId: safeUser.telegram_id,
                    username: safeUser.username,
                    firstName: safeUser.first_name,
                    lastName: safeUser.last_name,
                    photoUrl: safeUser.photo_url,
                    tier: safeUser.tier,
                    creditBalance: credit_balance,
                    referralCode: safeUser.referral_code,
                    isAdmin: safeUser.is_admin || false
                },
                isNewUser: authResult.isNewUser,
                expiresAt: sessionResult.expiresAt
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Authentication failed'
            });
        }
    }


    /**
     * POST /api/auth/logout
     * Logout user and invalidate session
     */
    async handleLogout(req, res) {
        try {
            // Get user from request context (set by AuthMiddleware)
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Not authenticated'
                });
            }

            // Invalidate session
            const logoutResult = await this.telegramAuthService.logout(user.id);

            if (!logoutResult.success) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'LOGOUT_FAILED',
                    message: logoutResult.error
                });
            }

            // Clear auth cookie
            res.clearCookie('auth_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });

            res.json({
                status: 'OK',
                message: 'Logged out successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Logout failed'
            });
        }
    }

    /**
     * GET /api/auth/me
     * Get current authenticated user
     */
    async getCurrentUser(req, res) {
        try {
            // Get user from request context (set by AuthMiddleware)
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Not authenticated'
                });
            }

            // Get fresh user data from database
            const freshUser = await this.telegramAuthService.getUserById(user.id);

            if (!freshUser) {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            res.json({
                status: 'OK',
                user: {
                    id: freshUser.id,
                    telegramId: freshUser.telegram_id,
                    username: freshUser.username,
                    firstName: freshUser.first_name,
                    lastName: freshUser.last_name,
                    photoUrl: freshUser.photo_url,
                    tier: freshUser.tier,
                    creditBalance: freshUser.credit_balance,
                    dailyCardsUsed: freshUser.daily_cards_used,
                    referralCode: freshUser.referral_code,
                    isAdmin: freshUser.is_admin || false,
                    createdAt: freshUser.created_at
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get user data'
            });
        }
    }

    /**
     * POST /api/auth/refresh
     * Refresh session token
     */
    async refreshToken(req, res) {
        try {
            const token = req.cookies?.auth_token;

            if (!token) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NO_TOKEN',
                    message: 'No token to refresh'
                });
            }

            const refreshResult = await this.telegramAuthService.refreshToken(token);

            if (!refreshResult.success) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'REFRESH_FAILED',
                    message: refreshResult.error
                });
            }

            // Set new cookie
            res.cookie('auth_token', refreshResult.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/'
            });

            res.json({
                status: 'OK',
                expiresAt: refreshResult.expiresAt
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Token refresh failed'
            });
        }
    }

    /**
     * Get route handlers
     */
    getRoutes() {
        return {
            handleCallback: this.handleCallback.bind(this),
            handleLogout: this.handleLogout.bind(this),
            getCurrentUser: this.getCurrentUser.bind(this),
            refreshToken: this.refreshToken.bind(this)
        };
    }
}

export default TelegramAuthController;
