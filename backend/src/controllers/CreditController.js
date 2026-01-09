/**
 * Credit Controller
 * Handles credit-related endpoints
 * Routes: /api/credits/*
 * 
 * Requirements: 3.2, 3.4, 7.1, 7.5, 14.12
 */
export class CreditController {
    constructor(options = {}) {
        this.creditManagerService = options.creditManagerService;
    }

    /**
     * GET /api/credits/balance
     * Get current credit balance
     * 
     * Requirement: 3.2
     */
    async getBalance(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Not authenticated'
                });
            }

            const balance = await this.creditManagerService.getBalance(user.id);

            res.json({
                status: 'OK',
                balance: balance
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get balance'
            });
        }
    }

    /**
     * GET /api/credits/history
     * Get transaction history
     * 
     * Requirement: 3.4
     */
    async getHistory(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Not authenticated'
                });
            }

            const { limit = 50, offset = 0, type, startDate, endDate } = req.query;

            const history = await this.creditManagerService.getTransactionHistory(user.id, {
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                type: type || null,
                startDate: startDate || null,
                endDate: endDate || null
            });

            res.json({
                status: 'OK',
                ...history
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get transaction history'
            });
        }
    }

    /**
     * POST /api/credits/claim-daily
     * Claim daily free credits (free tier only)
     * 
     * Requirements: 7.1, 7.5
     */
    async claimDaily(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Not authenticated'
                });
            }

            const result = await this.creditManagerService.claimDailyCredits(user.id);

            if (!result.success) {
                // Map error codes to HTTP status codes
                const statusCode = result.error === 'CREDIT_NOT_FREE_TIER' ? 400 : 400;
                
                return res.status(statusCode).json({
                    status: 'ERROR',
                    code: result.error,
                    message: result.message,
                    nextClaimAvailable: result.nextClaimAvailable || null,
                    timeUntilNextClaim: result.timeUntilNextClaim || null
                });
            }

            res.json({
                status: 'OK',
                amount: result.amount,
                previousBalance: result.previousBalance,
                newBalance: result.newBalance,
                claimedAt: result.claimedAt,
                nextClaimAvailable: result.nextClaimAvailable,
                timeUntilNextClaim: result.timeUntilNextClaim
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Failed to claim daily credits'
            });
        }
    }

    /**
     * GET /api/credits/claim-status
     * Get daily claim eligibility status
     * 
     * Requirement: 7.5
     */
    async getClaimStatus(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Not authenticated'
                });
            }

            const status = await this.creditManagerService.getDailyClaimStatus(user.id);

            res.json({
                status: 'OK',
                ...status
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get claim status'
            });
        }
    }

    /**
     * GET /api/credits/summary
     * Get credit summary with balance and recent activity
     */
    async getSummary(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    status: 'ERROR',
                    code: 'NOT_AUTHENTICATED',
                    message: 'Not authenticated'
                });
            }

            const summary = await this.creditManagerService.getCreditSummary(user.id);

            res.json({
                status: 'OK',
                ...summary
            });
        } catch (error) {

            res.status(500).json({
                status: 'ERROR',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get credit summary'
            });
        }
    }

    /**
     * Get route handlers
     */
    getRoutes() {
        return {
            getBalance: this.getBalance.bind(this),
            getHistory: this.getHistory.bind(this),
            claimDaily: this.claimDaily.bind(this),
            getClaimStatus: this.getClaimStatus.bind(this),
            getSummary: this.getSummary.bind(this)
        };
    }
}

export default CreditController;
