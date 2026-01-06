/**
 * MaintenanceMiddleware
 * 
 * Checks maintenance status and blocks non-admin users during maintenance mode.
 * Admin users can bypass maintenance mode to manage the system.
 * Provides separate middleware for HTML and JSON (API) responses.
 * 
 * Requirements:
 * - 1.3: Display maintenance page to non-admin users during maintenance
 * - 1.4: Allow admin users to bypass maintenance mode
 */
export class MaintenanceMiddleware {
    constructor(options = {}) {
        this.maintenanceService = options.maintenanceService || null;
        this.telegramAuthService = options.telegramAuthService || null;
    }

    /**
     * Extract user from JWT token in cookies
     * @private
     * @param {Object} req - Express request object
     * @returns {Object|null} User object or null if not authenticated
     */
    async _extractUserFromToken(req) {
        try {
            // Check if telegramAuthService is available
            if (!this.telegramAuthService) {
                return null;
            }

            // Get token from cookies
            const token = req.cookies?.auth_token;
            if (!token) {
                return null;
            }

            // Validate session and get user
            const result = await this.telegramAuthService.validateSession(token);
            if (result && result.user) {
                return result.user;
            }

            return null;
        } catch (error) {
            // Token validation failed - user is not authenticated
            return null;
        }
    }

    /**
     * Middleware that checks maintenance status for HTML responses
     * Returns 503 with maintenance page content for non-admin users
     * Admin users bypass maintenance mode
     * 
     * Requirements: 1.3, 1.4
     * 
     * @returns {Function} Express middleware function
     */
    check() {
        return async (req, res, next) => {
            // If no maintenance service configured, skip check
            if (!this.maintenanceService) {
                return next();
            }

            // Check if maintenance mode is enabled
            if (!this.maintenanceService.isEnabled()) {
                return next();
            }

            // Try to extract user from token for admin bypass
            const user = await this._extractUserFromToken(req);
            
            // Admin users can bypass maintenance mode
            if (user && user.is_admin) {
                req.user = user; // Set user on request for downstream middleware
                return next();
            }

            // Get maintenance status for response
            const status = this.maintenanceService.getStatus();

            // Return 503 Service Unavailable with maintenance info
            // For HTML responses, return a simple HTML page
            res.status(503);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Retry-After', '300'); // Suggest retry after 5 minutes

            const html = this._generateMaintenanceHTML(status);
            res.send(html);
        };
    }

    /**
     * API-specific middleware that returns JSON for maintenance mode
     * Returns 503 with JSON response for non-admin users
     * Admin users bypass maintenance mode
     * 
     * Requirements: 1.3, 1.4
     * 
     * @returns {Function} Express middleware function
     */
    checkAPI() {
        return async (req, res, next) => {
            // If no maintenance service configured, skip check
            if (!this.maintenanceService) {
                return next();
            }

            // Check if maintenance mode is enabled
            if (!this.maintenanceService.isEnabled()) {
                return next();
            }

            // Try to extract user from token for admin bypass
            const user = await this._extractUserFromToken(req);
            
            // Admin users can bypass maintenance mode
            if (user && user.is_admin) {
                req.user = user; // Set user on request for downstream middleware
                return next();
            }

            // Get maintenance status for response
            const status = this.maintenanceService.getStatus();

            // Return 503 Service Unavailable with JSON response
            res.status(503);
            res.setHeader('Retry-After', '300'); // Suggest retry after 5 minutes

            return res.json({
                status: 'ERROR',
                code: 'SERVICE_UNAVAILABLE',
                message: 'System is currently under maintenance',
                maintenance: {
                    enabled: true,
                    reason: status.reason || 'Scheduled maintenance',
                    estimatedEndTime: status.estimatedEndTime || null
                }
            });
        };
    }

    /**
     * Generate a simple maintenance HTML page
     * @private
     * @param {Object} status - Maintenance status object
     * @returns {string} HTML content
     */
    _generateMaintenanceHTML(status) {
        const reason = status.reason || 'We are currently performing scheduled maintenance.';
        const estimatedEnd = status.estimatedEndTime 
            ? new Date(status.estimatedEndTime).toLocaleString()
            : null;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="30">
    <title>Maintenance Mode</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a2332 0%, #0d1520 100%);
            color: #e5e7eb;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 500px;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #f9fafb;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #9ca3af;
            margin-bottom: 24px;
        }
        .estimated-time {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .estimated-time .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            margin-bottom: 4px;
        }
        .estimated-time .time {
            font-size: 18px;
            color: #f9fafb;
        }
        .refresh-note {
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>Under Maintenance</h1>
        <p class="message">${this._escapeHtml(reason)}</p>
        ${estimatedEnd ? `
        <div class="estimated-time">
            <div class="label">Estimated Return</div>
            <div class="time">${this._escapeHtml(estimatedEnd)}</div>
        </div>
        ` : ''}
        <p class="refresh-note">This page will automatically refresh every 30 seconds.</p>
    </div>
</body>
</html>`;
    }

    /**
     * Escape HTML special characters to prevent XSS
     * @private
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    _escapeHtml(text) {
        if (!text) return '';
        const htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return String(text).replace(/[&<>"']/g, char => htmlEntities[char]);
    }
}

export default MaintenanceMiddleware;
