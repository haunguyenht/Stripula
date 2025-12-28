/**
 * Admin Controller
 * Handles admin endpoints for key management, user management, and tier limits
 * Routes: /api/admin/*
 * 
 * Requirements: 3.1, 3.2, 3.5, 4.1, 4.7, 4.8, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export class AdminController {
    constructor(options = {}) {
        this.redeemKeyService = options.redeemKeyService;
        this.adminService = options.adminService;
        this.tierLimitService = options.tierLimitService;
        this.userNotificationService = options.userNotificationService;
    }

    // ═══════════════════════════════════════════════════════════════
    // Key Management Endpoints (Requirements: 4.1, 4.7, 4.8)
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/admin/keys/generate
     * Generate redeem keys (admin only)
     * 
     * Requirement: 4.1
     */
    async generateKeys(req, res) {
        try {
            const { type, value, quantity, maxUses, expiresAt, note } = req.body;

            // Validate required fields
            if (!type) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_TYPE',
                    message: 'Key type is required'
                });
            }

            if (value === undefined || value === null || value === '') {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_VALUE',
                    message: 'Key value is required'
                });
            }

            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_QUANTITY',
                    message: 'Quantity must be at least 1'
                });
            }

            const result = await this.redeemKeyService.generateKeys({
                type,
                value,
                quantity: parseInt(quantity, 10),
                maxUses: maxUses ? parseInt(maxUses, 10) : 1,
                expiresAt: expiresAt || null,
                note: note || null,
                createdBy: req.user.id
            });

            res.json({
                status: 'OK',
                message: `Generated ${result.count} keys`,
                count: result.count,
                keys: result.keys
            });
        } catch (error) {
            res.status(400).json({
                status: 'ERROR',
                code: 'GENERATION_FAILED',
                message: error.message
            });
        }
    }

    /**
     * GET /api/admin/keys
     * List keys with filters (admin only)
     * 
     * Requirement: 4.7
     */
    async getKeys(req, res) {
        try {
            const { type, status, createdBy, page, limit } = req.query;

            const result = await this.redeemKeyService.getKeys(
                { type, status, createdBy },
                { page: parseInt(page, 10) || 1, limit: parseInt(limit, 10) || 50 }
            );

            res.json({
                status: 'OK',
                ...result
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch keys'
            });
        }
    }

    /**
     * DELETE /api/admin/keys/:id
     * Revoke a key (admin only)
     * 
     * Requirement: 4.8
     */
    async revokeKey(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'Key ID is required'
                });
            }

            const result = await this.redeemKeyService.revokeKey(id);

            if (!result.success) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: result.error,
                    message: result.message
                });
            }

            res.json({
                status: 'OK',
                message: result.message,
                keyId: result.keyId,
                code: result.code
            });
        } catch (error) {
            if (error.message === 'Key not found') {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'KEY_NOT_FOUND',
                    message: 'Key not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'REVOKE_FAILED',
                message: 'Failed to revoke key'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // User Management Endpoints (Requirements: 3.1, 3.2, 3.5)
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/users
     * List users with filters (admin only)
     * 
     * Requirement: 3.1
     */
    async getUsers(req, res) {
        try {
            const { search, tier, flagged, page, limit } = req.query;

            const result = await this.adminService.getUsers(
                { 
                    search, 
                    tier, 
                    flagged: flagged === 'true' ? true : flagged === 'false' ? false : undefined 
                },
                { page: parseInt(page, 10) || 1, limit: parseInt(limit, 10) || 50 }
            );

            res.json({
                status: 'OK',
                ...result
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch users'
            });
        }
    }

    /**
     * PATCH /api/admin/users/:id/tier
     * Update user tier (admin only)
     * 
     * Requirement: 3.2
     */
    async updateUserTier(req, res) {
        try {
            const { id } = req.params;
            const { tier } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'User ID is required'
                });
            }

            if (!tier) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_TIER',
                    message: 'Tier is required'
                });
            }

            const result = await this.adminService.updateUserTier(id, tier);

            if (this.userNotificationService && result.success) {
                this.userNotificationService.notifyTierChange(
                    id,
                    result.user.newTier,
                    result.user.previousTier
                );
            }

            res.json({
                status: 'OK',
                message: `User tier updated to ${tier}`,
                ...result
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            if (error.message.includes('Invalid tier')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_TIER',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: 'Failed to update user tier'
            });
        }
    }

    /**
     * PATCH /api/admin/users/:id/credits
     * Adjust user credits (admin only)
     * 
     * Requirement: 3.2
     */
    async updateUserCredits(req, res) {
        try {
            const { id } = req.params;
            const { amount, reason } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'User ID is required'
                });
            }

            if (amount === undefined || amount === null) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_AMOUNT',
                    message: 'Amount is required'
                });
            }

            if (!reason) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_REASON',
                    message: 'Reason is required for credit adjustments'
                });
            }

            const result = await this.adminService.updateUserCredits(
                id, 
                parseFloat(amount), 
                reason
            );

            if (this.userNotificationService && result.success) {
                this.userNotificationService.notifyCreditChange(
                    id,
                    result.user.newBalance,
                    result.user.previousBalance,
                    reason
                );
            }

            res.json({
                status: 'OK',
                message: `Credits adjusted by ${amount}`,
                ...result
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            if (error.message.includes('Cannot reduce balance')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INSUFFICIENT_BALANCE',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: 'Failed to update user credits'
            });
        }
    }

    /**
     * POST /api/admin/users/:id/flag
     * Flag user account (admin only)
     * 
     * Requirement: 3.5
     */
    async flagUser(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'User ID is required'
                });
            }

            if (!reason) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_REASON',
                    message: 'Reason is required for flagging a user'
                });
            }

            // Pass admin user ID to prevent self-flagging
            const result = await this.adminService.flagUser(id, reason, req.user.id);

            if (!result.success) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: result.error,
                    message: result.message
                });
            }

            res.json({
                status: 'OK',
                message: 'User flagged successfully',
                ...result
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'FLAG_FAILED',
                message: 'Failed to flag user'
            });
        }
    }

    /**
     * DELETE /api/admin/users/:id/flag
     * Unflag user account (admin only)
     * 
     * Requirement: 3.5
     */
    async unflagUser(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_ID',
                    message: 'User ID is required'
                });
            }

            const result = await this.adminService.unflagUser(id);

            if (!result.success) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: result.error,
                    message: result.message
                });
            }

            res.json({
                status: 'OK',
                message: 'User unflagged successfully',
                ...result
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({
                    status: 'ERROR',
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UNFLAG_FAILED',
                message: 'Failed to unflag user'
            });
        }
    }

    /**
     * GET /api/admin/analytics
     * Get system analytics (admin only)
     * 
     * Requirement: 3.4
     */
    async getAnalytics(req, res) {
        try {
            const { startDate, endDate } = req.query;

            const result = await this.adminService.getAnalytics({
                startDate: startDate || null,
                endDate: endDate || null
            });

            res.json({
                status: 'OK',
                analytics: result
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch analytics'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Tier Limit Management Endpoints (Requirements: 7.2, 7.3, 7.4, 7.5, 7.6)
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/tier-limits
     * Get all tier limits with metadata (admin only)
     * 
     * Requirement: 7.2
     */
    async getTierLimits(req, res) {
        try {
            if (!this.tierLimitService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Tier limit service not available'
                });
            }

            const limitsData = await this.tierLimitService.getTierLimits();

            res.json({
                status: 'OK',
                limits: limitsData.limits,
                defaults: limitsData.defaults,
                metadata: limitsData.metadata,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'FETCH_FAILED',
                message: 'Failed to fetch tier limits'
            });
        }
    }

    /**
     * PUT /api/admin/tier-limits
     * Update tier limits (admin only)
     * 
     * Requirements: 7.2, 7.3, 7.4, 7.6
     * - Validate admin role
     * - Validate limit bounds (100-10000)
     * - Persist to database
     * - Broadcast via SSE
     */
    async updateTierLimits(req, res) {
        try {
            if (!this.tierLimitService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Tier limit service not available'
                });
            }

            const { limits } = req.body;

            if (!limits || typeof limits !== 'object') {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_BODY',
                    message: 'Limits object is required'
                });
            }

            const results = [];
            const errors = [];

            // Update each tier limit
            for (const [tier, limit] of Object.entries(limits)) {
                try {
                    // Validate limit before updating
                    const validation = this.tierLimitService.validateLimit(limit);
                    if (!validation.valid) {
                        errors.push({ tier, error: validation.error });
                        continue;
                    }

                    const result = await this.tierLimitService.updateTierLimit(
                        tier,
                        limit,
                        req.user.id
                    );
                    results.push(result);
                } catch (err) {
                    errors.push({ tier, error: err.message });
                }
            }

            if (errors.length > 0 && results.length === 0) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'UPDATE_FAILED',
                    message: 'Failed to update tier limits',
                    errors
                });
            }

            // Get updated limits
            const updatedLimits = await this.tierLimitService.getTierLimits();

            res.json({
                status: 'OK',
                message: `Updated ${results.length} tier limit(s)`,
                results,
                errors: errors.length > 0 ? errors : undefined,
                limits: updatedLimits.limits,
                defaults: updatedLimits.defaults,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: 'Failed to update tier limits'
            });
        }
    }

    /**
     * PUT /api/admin/tier-limits/:tier
     * Update a single tier limit (admin only)
     * 
     * Requirements: 7.2, 7.3, 7.4, 7.6
     */
    async updateSingleTierLimit(req, res) {
        try {
            if (!this.tierLimitService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Tier limit service not available'
                });
            }

            const { tier } = req.params;
            const { limit } = req.body;

            if (!tier) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_TIER',
                    message: 'Tier is required'
                });
            }

            if (limit === undefined || limit === null) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'MISSING_LIMIT',
                    message: 'Limit is required'
                });
            }

            // Validate limit
            const validation = this.tierLimitService.validateLimit(limit);
            if (!validation.valid) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_LIMIT',
                    message: validation.error
                });
            }

            const result = await this.tierLimitService.updateTierLimit(
                tier,
                limit,
                req.user.id
            );

            res.json({
                status: 'OK',
                message: `Tier limit updated for ${tier}`,
                ...result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error.message.includes('Invalid tier')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_TIER',
                    message: error.message
                });
            }

            if (error.message.includes('must be between')) {
                return res.status(400).json({
                    status: 'ERROR',
                    code: 'INVALID_LIMIT',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'ERROR',
                code: 'UPDATE_FAILED',
                message: 'Failed to update tier limit'
            });
        }
    }

    /**
     * POST /api/admin/tier-limits/reset
     * Reset all tier limits to defaults (admin only)
     * 
     * Requirement: 7.5
     */
    async resetTierLimits(req, res) {
        try {
            if (!this.tierLimitService) {
                return res.status(500).json({
                    status: 'ERROR',
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Tier limit service not available'
                });
            }

            const result = await this.tierLimitService.resetToDefaults(req.user.id);

            res.json({
                status: 'OK',
                message: 'Tier limits reset to defaults',
                ...result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'RESET_FAILED',
                message: 'Failed to reset tier limits'
            });
        }
    }

    /**
     * Get route handlers
     */
    getRoutes() {
        return {
            // Key management
            generateKeys: this.generateKeys.bind(this),
            getKeys: this.getKeys.bind(this),
            revokeKey: this.revokeKey.bind(this),
            // User management
            getUsers: this.getUsers.bind(this),
            updateUserTier: this.updateUserTier.bind(this),
            updateUserCredits: this.updateUserCredits.bind(this),
            flagUser: this.flagUser.bind(this),
            unflagUser: this.unflagUser.bind(this),
            // Analytics
            getAnalytics: this.getAnalytics.bind(this),
            // Tier limits
            getTierLimits: this.getTierLimits.bind(this),
            updateTierLimits: this.updateTierLimits.bind(this),
            updateSingleTierLimit: this.updateSingleTierLimit.bind(this),
            resetTierLimits: this.resetTierLimits.bind(this)
        };
    }
}

export default AdminController;
