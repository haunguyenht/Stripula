/**
 * Auth Middleware
 * Handles JWT authentication from cookies
 */
export class AuthMiddleware {
    constructor(options = {}) {
        this.telegramAuthService = options.telegramAuthService;
        this.userService = options.userService;
    }

    /**
     * Authenticate request - requires valid session
     * Sets req.user if authenticated, returns 401 if not
     */
    authenticate() {
        return async (req, res, next) => {
            try {
                const token = req.cookies?.auth_token;

                if (!token) {
                    return res.status(401).json({
                        status: 'ERROR',
                        code: 'AUTH_SESSION_INVALID',
                        message: 'Authentication required'
                    });
                }

                // Validate session
                const validation = await this.telegramAuthService.validateSession(token);

                if (!validation.valid) {
                    // Clear invalid cookie
                    res.clearCookie('auth_token', {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/'
                    });

                    const errorCode = this._mapErrorToCode(validation.error);
                    const statusCode = validation.error.includes('suspended') ? 403 : 401;

                    return res.status(statusCode).json({
                        status: 'ERROR',
                        code: errorCode,
                        message: validation.error
                    });
                }

                // Set user on request context
                req.user = validation.user;
                req.session = validation.session;
                req.authMethod = 'jwt';

                next();
            } catch (error) {

                return res.status(500).json({
                    status: 'ERROR',
                    code: 'INTERNAL_ERROR',
                    message: 'Authentication failed'
                });
            }
        };
    }

    /**
     * Optional authentication - sets req.user if valid token exists
     * Does not return error if no token or invalid token
     */
    optionalAuth() {
        return async (req, res, next) => {
            try {
                const token = req.cookies?.auth_token;

                if (!token) {
                    // No token, continue without user
                    req.user = null;
                    return next();
                }

                // Validate session
                const validation = await this.telegramAuthService.validateSession(token);

                if (validation.valid) {
                    req.user = validation.user;
                    req.session = validation.session;
                    req.authMethod = 'jwt';
                } else {
                    req.user = null;
                    // Clear invalid cookie silently
                    res.clearCookie('auth_token', {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/'
                    });
                }

                next();
            } catch (error) {

                req.user = null;
                next();
            }
        };
    }

    /**
     * Map error message to error code
     * @private
     */
    _mapErrorToCode(errorMessage) {
        if (errorMessage.includes('expired')) return 'AUTH_SESSION_INVALID';
        if (errorMessage.includes('revoked')) return 'AUTH_SESSION_REVOKED';
        if (errorMessage.includes('suspended')) return 'AUTH_ACCOUNT_FLAGGED';
        if (errorMessage.includes('Invalid')) return 'AUTH_SESSION_INVALID';
        return 'AUTH_SESSION_INVALID';
    }
}

export default AuthMiddleware;
