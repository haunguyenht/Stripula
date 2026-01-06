import { calculateBatchCreditCost } from '../services/CreditManagerService.js';

/**
 * Auth Controller
 * Handles SetupIntent/Auth validation flows (WooCommerce, Yogatket)
 * Routes: /api/auth/*
 * 
 * Credit Billing: Auth gateways charge pricing_live per passed card
 */
export class AuthController {
    constructor(options = {}) {
        this.authService = options.authService;
        this.creditManagerService = options.creditManagerService;
        this.telegramBotService = options.telegramBotService;
    }

    /**
     * GET /api/auth/sites
     */
    getSites(req, res) {
        const sites = this.authService.getAvailableSites();
        res.json({ status: 'OK', sites });
    }

    /**
     * POST /api/auth/site
     */
    setSite(req, res) {
        const { siteId } = req.body;
        if (!siteId) {
            return res.status(400).json({ status: 'ERROR', message: 'siteId is required' });
        }
        this.authService.setSite(siteId);
        res.json({ status: 'OK', message: `Switched to site: ${siteId}` });
    }

    /**
     * POST /api/auth/check
     */
    async checkCard(req, res) {
        try {
            const { card } = req.body;

            if (!card) {
                return res.status(400).json({ status: 'ERROR', message: 'Card data is required (format: number|mm|yy|cvv)' });
            }

            const result = await this.authService.processCard(card);
            res.json(result.toJSON ? result.toJSON() : result);
        } catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/auth/batch-stream
     * 
     * Requirements: 3.1, 3.2, 3.3, 3.4 - Uses tier-based speed limits
     */
    async checkBatchStream(req, res) {
        const { cards, cardList, concurrency = 3, siteId } = req.body;

        // Get user tier from authenticated request (Requirement 3.1)
        const tier = req.user?.tier || 'free';

        if (siteId) {
            this.authService.setSite(siteId);
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

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Track if stream is still open
        let streamClosed = false;

        // Handle client disconnect
        req.on('close', () => {
            streamClosed = true;
            this.authService?.stopBatch();
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

        // Track live deduction for real-time credit checking
        let totalCreditsDeducted = 0;
        let currentBalance = req.creditInfo?.currentBalance || 0;
        let creditExhausted = false;
        const gatewayId = req.creditInfo?.gatewayId || siteId || 'auth';
        const userId = req.user?.id;
        let approvedCount = 0;
        let liveCount = 0;
        let processedCards = 0;

        try {
            const result = await this.authService.processBatch(
                cardArray,
                {
                    concurrency: Math.min(concurrency, 5),
                    tier, // Pass tier for speed limiting (Requirement 3.1)
                    userId, // Pass userId for statistics tracking (Requirements 8.1, 8.2)
                    onProgress: (progress) => !streamClosed && sendEvent('progress', progress),
                    onResult: async (result) => {
                        if (streamClosed || creditExhausted) return;

                        processedCards++;

                        // For LIVE cards (APPROVED in auth), deduct credits in real-time
                        if (result.status === 'APPROVED' && userId && this.creditManagerService) {
                            // Auth validation: APPROVED = LIVE card
                            liveCount++;
                            
                            const deductResult = await this.creditManagerService.deductSingleCardCredit(
                                userId,
                                gatewayId,
                                'live' // Auth uses pricing_live
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
                                this.authService.stopBatch();

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
                                    gateway: siteId || 'auth',
                                    type: 'auth'
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
                    console.error('[AuthController] Failed to record batch transaction:', err.message);
                }
            }

            // Release operation lock
            if (userId && this.creditManagerService) {
                try {
                    await this.creditManagerService.releaseOperationLockByUser(userId, stopReason);
                } catch (err) {
                    // Lock release error
                }
            }

            if (!streamClosed) {
                sendEvent('complete', {
                    ...result,
                    creditsDeducted: totalCreditsDeducted,
                    newBalance: currentBalance,
                    creditExhausted
                });
            }
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
                } catch (err) {
                    // Lock release error
                }
            }
            if (!streamClosed) {
                sendEvent('error', { message: error.message });
            }
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
     * POST /api/auth/stop
     */
    async stopBatch(req, res) {
        const userId = req.user?.id;

        this.authService.stopBatch();

        // Release operation lock so user can start new validation
        if (userId && this.creditManagerService) {
            try {
                await this.creditManagerService.releaseOperationLockByUser(userId, 'cancelled');
            } catch (err) {
                // Lock release error
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
            stopBatch: this.stopBatch.bind(this)
        };
    }
}
