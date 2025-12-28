/**
 * Credit Middleware
 * Handles credit verification, locking, and deduction for validation operations
 * 
 * Requirements: 4.3, 4.4, 13.4, 13.5
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
     * Acquire operation lock before starting batch operation
     * Prevents concurrent operations from the same user
     * 
     * Requirements: 13.4, 13.5
     * 
     * @returns {Function} Express middleware function
     */
    acquireLock() {
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
                const operationType = req.creditInfo?.gatewayId || 'unknown';
                const cardCount = req.creditInfo?.cardCount || this._getCardCount(req);

                if (!this.creditManagerService) {
                    // No credit manager, skip locking
                    return next();
                }

                // Try to acquire lock
                const lockResult = await this.creditManagerService.acquireOperationLock(
                    userId,
                    operationType,
                    { cardCount }
                );

                if (!lockResult.success) {
                    const statusCode = this._getLockErrorStatusCode(lockResult.error);
                    return res.status(statusCode).json({
                        status: 'ERROR',
                        code: lockResult.error,
                        message: lockResult.message,
                        existingOperationId: lockResult.existingOperationId,
                        existingOperationType: lockResult.existingOperationType
                    });
                }

                // Attach lock info to request for cleanup
                req.operationLock = {
                    operationId: lockResult.operationId,
                    lockKey: lockResult.lockKey
                };

                next();
            } catch (error) {

                return res.status(500).json({
                    status: 'ERROR',
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to acquire operation lock'
                });
            }
        };
    }

    /**
     * Release operation lock after batch completion
     * Should be called in finally block or response handler
     * 
     * @param {string} status - Final status ('completed' or 'failed')
     * @returns {Function} Express middleware function
     */
    releaseLock(status = 'completed') {
        return async (req, res, next) => {
            try {
                if (!req.operationLock || !req.user?.id) {
                    return next();
                }

                if (!this.creditManagerService) {
                    return next();
                }

                await this.creditManagerService.releaseOperationLock(
                    req.user.id,
                    req.operationLock.operationId,
                    status
                );

                // Clear lock info
                req.operationLock = null;

                next();
            } catch (error) {

                // Don't fail the request, just log the error
                next();
            }
        };
    }

    /**
     * Create a lock release function for use in controllers
     * Returns a function that can be called to release the lock
     * 
     * @param {Object} req - Express request object
     * @returns {Function} Async function to release lock
     */
    createLockReleaser(req) {
        return async (status = 'completed') => {
            if (!req.operationLock || !req.user?.id) {
                return;
            }

            if (!this.creditManagerService) {
                return;
            }

            try {
                await this.creditManagerService.releaseOperationLock(
                    req.user.id,
                    req.operationLock.operationId,
                    status
                );
                req.operationLock = null;
            } catch (error) {

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
                    operationId: req.operationLock?.operationId,
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
     * Create a batch completion handler that handles credit deduction
     * This is used by controllers to wire credit deduction into batch completion
     * 
     * Pricing model:
     * - Charge gateways (charge-*): passed cards → pricing_approved
     * - Auth gateways (auth-*, shopify-*): passed cards → pricing_live
     * 
     * Requirements: 4.1, 4.2, 4.6
     * 
     * @param {Object} req - Express request object
     * @param {Object} options - Handler options
     * @param {string} options.billingType - 'approved' for charge gateways, 'live' for auth gateways
     * @returns {Function} Handler function for batchComplete event
     */
    createBatchCompleteHandler(req, options = {}) {
        const { onComplete, onError, billingType = 'live' } = options;

        return async (batchResult) => {
            const { liveCount = 0, stats, gatewayId, aborted, totalCards, processedCards, stopReason } = batchResult;

            // Determine if batch was stopped early
            const wasStopped = aborted || (totalCards && processedCards && processedCards < totalCards);

            // Skip credit deduction if aborted with no cards processed or no user
            if (!req.user?.id) {
                if (onComplete) {
                    onComplete(batchResult, null);
                }
                return;
            }

            try {
                // Build status counts based on gateway billing type
                // Charge gateways: passed cards are APPROVED (higher cost)
                // Auth gateways: passed cards are LIVE (lower cost)
                const statusCounts = billingType === 'approved' 
                    ? { approved: liveCount, live: 0 }
                    : { approved: 0, live: liveCount };

                const deductionResult = await this.deductCreditsForLiveCards(req, statusCounts, {
                    description: `Batch validation: ${liveCount} ${billingType.toUpperCase()} cards via ${gatewayId || req.creditInfo?.gatewayId}${wasStopped ? ` (stopped at ${processedCards}/${totalCards})` : ''}`,
                    totalCards: totalCards || stats?.total,
                    processedCards: processedCards || stats?.processed,
                    wasStopped,
                    stopReason: stopReason || (aborted ? 'user_cancelled' : null)
                });

                // Release operation lock
                const releaseLock = this.createLockReleaser(req);
                await releaseLock('completed');

                if (onComplete) {
                    onComplete(batchResult, deductionResult);
                }
            } catch (error) {

                // Still release lock on error
                const releaseLock = this.createLockReleaser(req);
                await releaseLock('failed');

                if (onError) {
                    onError(error);
                }
            }
        };
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

    /**
     * Get HTTP status code for lock errors
     * 
     * @private
     * @param {string} errorCode - Error code from lock result
     * @returns {number} HTTP status code
     */
    _getLockErrorStatusCode(errorCode) {
        switch (errorCode) {
            case 'CREDIT_OPERATION_LOCKED':
                return 409; // Conflict
            case 'CREDIT_LOCK_TIMEOUT':
                return 503; // Service Unavailable
            default:
                return 400;
        }
    }
}

export default CreditMiddleware;
