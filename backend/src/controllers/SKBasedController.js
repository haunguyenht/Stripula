/**
 * SK-Based Controller
 * Handles SK-based charge validation flows using user-provided Stripe SK/PK keys
 * Routes: /api/skbased/*
 * 
 * Requirements: 3.1-3.3
 * - Accept SK key, PK key, cards array, and proxy config in request body
 * - Validate SK/PK key formats before processing
 * - Validate proxy configuration is provided
 * - Deduct credits for APPROVED/LIVE cards
 */
import { GATEWAY_IDS } from '../utils/constants.js';

export class SKBasedController {
    constructor(options = {}) {
        this.skbasedService = options.skbasedService;
        this.telegramBotService = options.telegramBotService;
        this.creditManagerService = options.creditManagerService;
        this.activeStreams = new Map(); // Track active SSE streams by session ID
    }

    /**
     * Validate SK key format
     * @param {string} key - SK key to validate
     * @returns {boolean} True if valid format
     */
    _validateSKKey(key) {
        if (!key || typeof key !== 'string') return false;
        return key.startsWith('sk_live_') || key.startsWith('sk_test_');
    }

    /**
     * Validate PK key format
     * @param {string} key - PK key to validate
     * @returns {boolean} True if valid format
     */
    _validatePKKey(key) {
        if (!key || typeof key !== 'string') return false;
        return key.startsWith('pk_live_') || key.startsWith('pk_test_');
    }

    /**
     * Validate proxy configuration
     * @param {Object} proxy - Proxy configuration
     * @returns {{valid: boolean, error?: string}} Validation result
     */
    _validateProxy(proxy) {
        if (!proxy) {
            return { valid: false, error: 'Proxy configuration is required' };
        }

        if (!proxy.host || typeof proxy.host !== 'string' || proxy.host.trim() === '') {
            return { valid: false, error: 'Proxy host is required' };
        }

        if (!proxy.port) {
            return { valid: false, error: 'Proxy port is required' };
        }

        const port = parseInt(proxy.port, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            return { valid: false, error: 'Proxy port must be between 1 and 65535' };
        }

        return { valid: true };
    }

    /**
     * Mask SK key for logging (show only first 12 and last 4 chars)
     * Requirement: 10.1
     * @param {string} key - SK key to mask
     * @returns {string} Masked key
     */
    _maskSKKey(key) {
        if (!key || key.length < 20) return '***';
        return `${key.slice(0, 12)}...${key.slice(-4)}`;
    }

    /**
     * POST /api/skbased/validate
     * Start SK-based batch validation with SSE streaming
     * 
     * Requirements: 3.1-3.3
     */
    async startValidation(req, res) {
        const requestId = `skbased_${Date.now()}`;
        const { skKey, pkKey, cards, cardList, proxy, chargeAmount = 100, currency = 'gbp' } = req.body;

        // Get user tier from authenticated request
        const tier = req.user?.tier || 'free';
        const userId = req.user?.id;

        // Validate SK key format (Requirement 3.2)
        if (!this._validateSKKey(skKey)) {
            return res.status(400).json({
                status: 'ERROR',
                code: 'INVALID_SK_KEY',
                message: 'Invalid SK key format. Must start with sk_live_ or sk_test_'
            });
        }

        // Validate PK key format (Requirement 3.2)
        if (!this._validatePKKey(pkKey)) {
            return res.status(400).json({
                status: 'ERROR',
                code: 'INVALID_PK_KEY',
                message: 'Invalid PK key format. Must start with pk_live_ or pk_test_'
            });
        }

        // Validate proxy configuration (Requirement 2.7)
        const proxyValidation = this._validateProxy(proxy);
        if (!proxyValidation.valid) {
            return res.status(400).json({
                status: 'ERROR',
                code: 'INVALID_PROXY',
                message: proxyValidation.error
            });
        }

        // Parse cards
        let cardArray = cards;
        if (!cardArray && cardList) {
            cardArray = cardList.split('\n')
                .map(line => line.trim())
                .filter(line => line && line.includes('|'));
        }

        if (!cardArray || cardArray.length === 0) {
            return res.status(400).json({
                status: 'ERROR',
                code: 'NO_CARDS',
                message: 'No valid cards provided'
            });
        }

        // Setup SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        let streamClosed = false;

        // Handle client disconnect
        req.on('close', () => {
            streamClosed = true;
            this.skbasedService?.stopBatch();
        });

        req.on('error', (err) => {
            streamClosed = true;
        });

        res.on('error', (err) => {
            streamClosed = true;
        });

        res.flushHeaders();

        let resultCount = 0;
        const sendEvent = (event, data) => {
            if (streamClosed) {
                return;
            }
            try {
                if (event === 'result') {
                    resultCount++;
                }
                res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            } catch (e) {
                streamClosed = true;
            }
        };

        sendEvent('start', { total: cardArray.length, tier, requestId });

        const gatewayId = GATEWAY_IDS.SKBASED_CHARGE_1;
        
        // Track credits deducted for this batch
        let totalCreditsDeducted = 0;
        let liveCount = 0;
        let approvedCount = 0;
        let stopReason = 'completed';

        try {
            const result = await this.skbasedService.processBatch(
                cardArray,
                {
                    skKey,
                    pkKey,
                    proxy,
                    chargeAmount,
                    currency,
                    tier,
                    userId, // Pass userId for statistics tracking (Requirements 8.1, 8.2)
                    onProgress: (progress) => {
                        // Transform progress to match frontend expectations
                        // FE expects: { current, total, summary: { approved, live, die, error } }
                        const transformedProgress = {
                            current: progress.processed,
                            total: progress.total,
                            summary: {
                                approved: progress.approved || 0,
                                live: progress.live || 0,
                                die: progress.declined || 0,
                                error: progress.errors || 0
                            }
                        };
                        sendEvent('progress', transformedProgress);
                    },
                    onResult: async (result) => {
                        if (streamClosed) return;

                        // Deduct credits for APPROVED/LIVE cards
                        const isBillable = result.status === 'APPROVED' || result.status === 'LIVE';
                        
                        if (isBillable && userId && this.creditManagerService) {
                            // APPROVED = charged, LIVE = 3DS required
                            const statusType = result.status === 'APPROVED' ? 'approved' : 'live';
                            
                            if (result.status === 'APPROVED') approvedCount++;
                            liveCount++;
                            
                            const deductResult = await this.creditManagerService.deductSingleCardCredit(
                                userId,
                                gatewayId,
                                statusType
                            );
                            
                            if (deductResult.success) {
                                totalCreditsDeducted += deductResult.creditsDeducted;
                                // Add credit info to result for FE display
                                result.creditsDeducted = deductResult.creditsDeducted;
                                result.newBalance = deductResult.newBalance;
                            }
                        }

                        // Send Telegram notification for approved/live cards
                        if (this.telegramBotService && isBillable) {
                            this.telegramBotService.notifyCardApproved({
                                user: req.user,
                                result,
                                gateway: 'sk-based-charge',
                                type: 'skbased'
                            }).catch(() => { });
                        }

                        sendEvent('result', result);
                    }
                }
            );

            // Handle gateway unavailable case
            if (result.unavailable) {
                const reason = result.unavailableReason?.message || 'Gateway is currently unavailable';
                stopReason = 'unavailable';

                sendEvent('error', {
                    message: reason,
                    code: 'GATEWAY_UNAVAILABLE',
                    gatewayId
                });

                // Release lock
                if (userId && this.creditManagerService) {
                    try {
                        await this.creditManagerService.releaseOperationLockByUser(userId, stopReason);
                    } catch {}
                }

                if (!streamClosed) {
                    try { res.end(); } catch { }
                }
                return;
            }

            // Record batch transaction to history (only when credits were deducted)
            if (userId && this.creditManagerService && totalCreditsDeducted > 0) {
                try {
                    await this.creditManagerService.recordBatchTransaction(userId, gatewayId, {
                        totalCreditsDeducted,
                        approvedCount,
                        liveCount,
                        totalCards: cardArray.length,
                        declinedCount: result.stats?.declined || 0,
                        errorCount: result.stats?.errors || 0
                    });
                } catch {}
            }

            // Release operation lock
            if (userId && this.creditManagerService) {
                try {
                    await this.creditManagerService.releaseOperationLockByUser(userId, stopReason);
                } catch {}
            }

            sendEvent('complete', {
                ...result,
                totalCreditsDeducted,
                liveCount,
                approvedCount
            });
        } catch (error) {
            // Record transaction on error if any credits were deducted
            if (userId && this.creditManagerService && totalCreditsDeducted > 0) {
                try {
                    await this.creditManagerService.recordBatchTransaction(userId, gatewayId, {
                        totalCreditsDeducted,
                        approvedCount,
                        liveCount,
                        totalCards: cardArray.length,
                        declinedCount: 0,
                        errorCount: 1
                    });
                } catch {}
            }
            
            // Release lock on error
            if (userId && this.creditManagerService) {
                try {
                    await this.creditManagerService.releaseOperationLockByUser(userId, 'failed');
                } catch {}
            }

            sendEvent('error', { message: error.message });
        }

        if (!streamClosed) {
            try {
                res.end();
            } catch (e) {
                // Stream end error
            }
        }
    }

    /**
     * POST /api/skbased/stop
     * Stop the current batch validation
     */
    async stopBatch(req, res) {
        const userId = req.user?.id;
        
        this.skbasedService.stopBatch();
        
        // Release operation lock so user can start new validation
        if (userId && this.creditManagerService) {
            try {
                await this.creditManagerService.releaseOperationLockByUser(userId, 'cancelled');
            } catch (err) {
                // Lock release error - ignore
            }
        }
        
        res.json({ status: 'OK', message: 'Stop signal sent' });
    }

    /**
     * GET /api/skbased/health
     * Health check endpoint for SK-based validation service
     */
    getHealth(req, res) {
        try {
            const serviceHealth = {
                isProcessing: this.skbasedService?.abortFlag === false,
                hasSpeedManager: !!this.skbasedService?.speedManager,
                hasGatewayManager: !!this.skbasedService?.gatewayManager
            };

            res.json({
                status: 'OK',
                health: {
                    overall: 'healthy',
                    service: serviceHealth
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                code: 'HEALTH_CHECK_FAILED',
                message: 'Failed to get health status'
            });
        }
    }

    /**
     * Get route handlers
     * @returns {Object} Route handlers
     */
    getRoutes() {
        return {
            startValidation: this.startValidation.bind(this),
            stopBatch: this.stopBatch.bind(this),
            getHealth: this.getHealth.bind(this)
        };
    }
}

