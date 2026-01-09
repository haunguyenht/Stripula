/**
 * Credit Middleware
 * Handles credit verification and deduction for validation operations
 * 
 * Requirements: 4.3, 4.4
 */
export class CreditMiddleware {
    constructor(options = {}) {
        this.creditManagerService = options.creditManagerService;
        this.userService = options.userService;
        this.gatewayConfigService = options.gatewayConfigService;
    }

    /**
     * Check if user has sufficient credits before operation
     * Also checks gateway availability
     * 
     * Requirements: 4.3, 4.4
     * 
     * @param {string} defaultGatewayId - Default gateway ID (e.g., 'auth-1', 'charge-1', 'shopify-1')
     * @returns {Function} Express middleware function
     */
    checkCredits(defaultGatewayId) {
        return async (req, res, next) => {
            try {
                // Ensure user is authenticated
                if (!req.user || !req.user.id) {
                    return res.status(401).json({
                        status: 'ERROR',
                        code: 'AUTH_REQUIRED',
                        message: 'Authentication required'
                    });
                }

                const userId = req.user.id;

                // Get card count from request body
                const cardCount = this._getCardCount(req);
                if (cardCount === 0) {
                    return res.status(400).json({
                        status: 'ERROR',
                        code: 'NO_CARDS',
                        message: 'No cards provided'
                    });
                }

                // Extract actual gateway ID from request body, fallback to default
                // Frontend sends siteId or gatewayId in request body
                const gatewayId = req.body?.siteId || req.body?.gatewayId || defaultGatewayId;

                // Check if gateway is active
                if (this.gatewayConfigService) {
                    const isActive = await this.gatewayConfigService.isGatewayActive(gatewayId);
                    if (!isActive) {
                        return res.status(400).json({
                            status: 'ERROR',
                            code: 'GATEWAY_INACTIVE',
                            message: `Gateway ${gatewayId} is currently unavailable`
                        });
                    }
                }

                // Check if user can perform operation (flagged check)
                if (this.userService) {
                    const operationCheck = await this.userService.canPerformOperation(userId, cardCount);
                    if (!operationCheck.canPerform) {
                        return res.status(403).json({
                            status: 'ERROR',
                            code: 'ACCOUNT_SUSPENDED',
                            message: operationCheck.reason || 'Account suspended'
                        });
                    }
                }

                // Check credit balance (Requirement 4.3)
                if (this.creditManagerService) {
                    const creditCheck = await this.creditManagerService.checkSufficientCredits(
                        userId,
                        gatewayId,
                        cardCount
                    );

                    // Attach credit info to request for later use
                    req.creditInfo = {
                        gatewayId,
                        cardCount,
                        currentBalance: creditCheck.currentBalance,
                        requiredCredits: creditCheck.requiredCredits,
                        effectiveRate: creditCheck.effectiveRate,
                        tier: creditCheck.tier,
                        sufficient: creditCheck.sufficient
                    };

                    // Requirement 4.4: Warn but allow if insufficient credits
                    // Credits are only deducted for LIVE cards, so we allow the operation
                    // but attach a warning
                    if (!creditCheck.sufficient) {
                        req.creditInfo.warning = 'Insufficient credits for maximum potential consumption';
                    }
                }

                next();
            } catch (error) {

                return res.status(500).json({
                    status: 'ERROR',
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to verify credits'
                });
            }
        };
    }

    /**
     * Deduct credits after batch completion
     * 
     * New pricing model (fixed per status, no tier multipliers):
     * - APPROVED cards: pricing_approved credits each
     * - LIVE cards: pricing_live credits each
     * - DEAD/ERROR/CAPTCHA: Free
     * 
     * Requirements: 4.1, 4.2, 4.6
     * 
     * @param {Object} req - Express request object
     * @param {Object|number} statusCounts - Status counts { approved: N, live: M } or legacy liveCount number
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Deduction result
     */
    async deductCreditsForLiveCards(req, statusCounts, options = {}) {
        if (!req.user?.id || !req.creditInfo?.gatewayId) {
            return { success: false, error: 'Missing user or gateway info' };
        }

        if (!this.creditManagerService) {
            return { success: false, error: 'Credit manager not configured' };
        }

        // Normalize status counts (support legacy liveCount number)
        let counts = statusCounts;
        if (typeof statusCounts === 'number') {
            // Legacy: treat as live count (backward compatibility)
            counts = { approved: 0, live: statusCounts };
        }

        const totalBillable = (counts?.approved || 0) + (counts?.live || 0);

        // No deduction for 0 billable cards (Requirement 4.2)
        if (totalBillable === 0) {
            return {
                success: true,
                creditsDeducted: 0,
                approvedCount: 0,
                liveCount: 0,
                message: 'No billable cards, no credits deducted'
            };
        }

        try {
            const result = await this.creditManagerService.deductCredits(
                req.user.id,
                req.creditInfo.gatewayId,
                counts,
                {
                    description: options.description,
                    idempotencyKey: options.idempotencyKey,
                    requestId: req.headers['x-request-id'],
                    ipAddress: req.ip,
                    // Batch tracking fields
                    totalCards: options.totalCards,
                    processedCards: options.processedCards,
                    wasStopped: options.wasStopped,
                    stopReason: options.stopReason
                }
            );

            // Update daily usage counter
            if (this.userService && result.success) {
                await this.userService.incrementDailyUsage(req.user.id, totalBillable);
            }

            return result;
        } catch (error) {

            return {
                success: false,
                error: 'CREDIT_DEDUCTION_FAILED',
                message: error.message
            };
        }
    }

    /**
     * Get card count from request body
     * Supports various formats: cards array, cardList string, etc.
     * 
     * @private
     * @param {Object} req - Express request object
     * @returns {number} Number of cards
     */
    _getCardCount(req) {
        const body = req.body || {};

        // Array of cards
        if (Array.isArray(body.cards)) {
            return body.cards.length;
        }

        // Card list as string (newline separated)
        if (typeof body.cardList === 'string') {
            return body.cardList.split('\n').filter(line => line.trim()).length;
        }

        // Single card
        if (body.card || body.cardNumber) {
            return 1;
        }

        // Count property
        if (typeof body.count === 'number') {
            return body.count;
        }

        return 0;
    }
}

export default CreditMiddleware;
