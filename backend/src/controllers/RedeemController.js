/**
 * Redeem Controller
 * Handles key redemption endpoints for authenticated users
 * Routes: /api/redeem
 * 
 * Requirements: 5.1, 5.8
 */
export class RedeemController {
    constructor(options = {}) {
        this.redeemKeyService = options.redeemKeyService;
    }

    /**
     * POST /api/redeem
     * Redeem a key for credits or tier upgrade
     * 
     * Requirements: 5.1, 5.8
     * 
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async redeemKey(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Authentication required'
                });
            }

            const { code } = req.body;

            if (!code) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_CODE',
                    message: 'Key code is required'
                });
            }

            // Get client IP for audit logging
            const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
                || req.socket?.remoteAddress 
                || null;

            // Attempt redemption
            const result = await this.redeemKeyService.redeemKey(user.id, code, ip);

            if (!result.success) {
                // Map error codes to HTTP status and user-friendly messages
                const errorMap = {
                    'KEY_INVALID': { status: 400, message: 'Invalid key' },
                    'KEY_EXPIRED': { status: 400, message: 'Key expired' },
                    'KEY_EXHAUSTED': { status: 400, message: 'Key already redeemed' },
                    'KEY_REVOKED': { status: 400, message: 'Key revoked' },
                    'KEY_ALREADY_USED': { status: 400, message: 'Already redeemed by you' },
                    'TIER_NOT_UPGRADE': { status: 400, message: result.message }
                };

                const errorInfo = errorMap[result.error] || { status: 400, message: result.message };

                return res.status(errorInfo.status).json({
                    status: 'ERROR',
                    code: result.error,
                    message: errorInfo.message
                });
            }

            // Success response (Requirement 5.8)
            const response = {
                status: 'OK',
                type: result.type,
                message: result.type === 'credits' 
                    ? `Successfully redeemed ${result.creditsAdded} credits!`
                    : `Successfully upgraded to ${result.newTier} tier!`
            };

            if (result.type === 'credits') {
                response.creditsAdded = result.creditsAdded;
                response.newBalance = result.newBalance;
            } else {
                response.newTier = result.newTier;
                response.previousTier = result.previousTier;
            }

            res.json(response);
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Failed to redeem key'
            });
        }
    }

    /**
     * Get route handlers
     */
    getRoutes() {
        return {
            redeemKey: this.redeemKey.bind(this)
        };
    }
}

export default RedeemController;
