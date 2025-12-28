/**
 * Admin Middleware
 * Handles admin role verification for protected routes
 * 
 * Requirements: 3.6
 */
export class AdminMiddleware {
    constructor(options = {}) {
        // Options for future extensibility
    }

    /**
     * Require admin role middleware
     * Checks if req.user exists and has is_admin = true
     * Returns 403 if not admin
     * 
     * Requirement: 3.6
     * 
     * @returns {Function} Express middleware function
     */
    requireAdmin() {
        return (req, res, next) => {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'AUTH_REQUIRED',
                    message: 'Authentication required'
                });
            }

            // Check if user has admin role
            if (!req.user.is_admin) {
                return res.status(403).json({
                    status: 'ERROR',
                    code: 'ADMIN_UNAUTHORIZED',
                    message: 'Admin access required'
                });
            }

            // User is admin, proceed
            next();
        };
    }
}

export default AdminMiddleware;
