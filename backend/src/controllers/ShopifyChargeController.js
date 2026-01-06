/**
 * Shopify Charge Controller
 * Handles Shopify checkout card validation via Auto Shopify API
 * User provides the Shopify site URL for validation
 * 
 * API: https://autoshopi.up.railway.app/?cc=cc&url=site&proxy=proxy
 */
export class ShopifyChargeController {
    constructor(options = {}) {
        this.shopifyChargeService = options.shopifyChargeService;
        this.creditManagerService = options.creditManagerService;
        this.telegramBotService = options.telegramBotService;
    }

    /**
     * POST /api/shopify/check
     * Check a single card via Shopify checkout
     */
    async checkCard(req, res) {
        try {
            const { card, shopifyUrl } = req.body;

            if (!card) {
                return res.status(400).json({ status: 'ERROR', message: 'Card data is required (format: number|mm|yy|cvv)' });
            }

            if (!shopifyUrl) {
                return res.status(400).json({ status: 'ERROR', message: 'Shopify URL is required' });
            }

            this.shopifyChargeService.setShopifyUrl(shopifyUrl);
            const result = await this.shopifyChargeService.processCard(card);
            res.json(result.toJSON ? result.toJSON() : result);
        } catch (error) {
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/shopify/batch-stream
     * Check multiple cards with SSE progress
     */
    async checkBatchStream(req, res) {
        const { cards, cardList, concurrency = 2, shopifyUrl, proxy } = req.body;
        const tier = req.user?.tier || 'free';

        if (!shopifyUrl) {
            return res.status(400).json({ status: 'ERROR', message: 'Shopify URL is required' });
        }

        if (!proxy) {
            return res.status(400).json({ status: 'ERROR', message: 'Proxy is required for Auto Shopify API' });
        }

        // Set the Shopify URL and proxy
        this.shopifyChargeService.setShopifyUrl(shopifyUrl);
        this.shopifyChargeService.setProxy(proxy);

        let cardArray = cards;
        if (!cardArray && cardList) {
            cardArray = cardList.split('\n')
                .map(line => line.trim())
                .filter(line => line && line.includes('|'));
        }

        if (!cardArray || cardArray.length === 0) {
            return res.status(400).json({ status: 'ERROR', message: 'No valid cards provided' });
        }

        // Setup SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        
        let streamClosed = false;
        
        req.on('close', () => {
            streamClosed = true;
            this.shopifyChargeService?.stopBatch();
        });
        
        req.on('error', () => {
            streamClosed = true;
        });
        
        res.on('error', () => {
            streamClosed = true;
        });
        
        res.flushHeaders();

        let resultCount = 0;
        const sendEvent = (event, data) => {
            if (streamClosed) return;
            try {
                if (event === 'result') resultCount++;
                res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            } catch (e) {
                streamClosed = true;
            }
        };

        sendEvent('start', { total: cardArray.length, concurrency, tier, shopifyUrl });

        const userId = req.user?.id;
        const gatewayId = 'auto-shopify-1';
        
        let totalCreditsDeducted = 0;
        let currentBalance = req.creditInfo?.currentBalance || 0;
        let creditExhausted = false;
        let approvedCount = 0;
        let liveCount = 0;
        let processedCards = 0;

        try {
            const result = await this.shopifyChargeService.processBatch(
                cardArray,
                {
                    concurrency: Math.min(concurrency, 5),
                    tier,
                    shopifyUrl,
                    userId, // Pass userId for statistics tracking (Requirements 8.1, 8.2)
                    onProgress: (progress) => sendEvent('progress', progress),
                    onResult: async (result) => {
                        if (streamClosed || creditExhausted) return;
                        
                        processedCards++;
                        
                        // For APPROVED cards (charge), deduct credits
                        if (result.status === 'APPROVED' && userId && this.creditManagerService) {
                            liveCount++;
                            
                            const deductResult = await this.creditManagerService.deductSingleCardCredit(
                                userId,
                                gatewayId,
                                'live'
                            );
                            
                            if (deductResult.success) {
                                totalCreditsDeducted += deductResult.creditsDeducted;
                                currentBalance = deductResult.newBalance;
                                result.newBalance = deductResult.newBalance;
                                result.creditsDeducted = deductResult.creditsDeducted;
                            } else if (deductResult.shouldStop) {
                                creditExhausted = true;
                                currentBalance = deductResult.currentBalance;
                                this.shopifyChargeService.stopBatch();
                                
                                sendEvent('credit_exhausted', {
                                    message: 'Credits exhausted - batch stopped',
                                    balance: currentBalance,
                                    processed: resultCount,
                                    total: cardArray.length
                                });
                            }

                            // Telegram notification for approved cards
                            if (this.telegramBotService && result.status === 'APPROVED') {
                                this.telegramBotService.notifyCardApproved({
                                    user: req.user,
                                    result,
                                    gateway: 'auto-shopify',
                                    type: 'shopify'
                                }).catch(() => {});
                            }
                        }
                        
                        sendEvent('result', result);
                    }
                }
            );

            const wasUserStopped = result.aborted === true;
            const wasStopped = creditExhausted || wasUserStopped;
            let stopReason = null;
            if (creditExhausted) stopReason = 'credit_exhausted';
            else if (wasUserStopped) stopReason = 'user_cancelled';

            // Record batch transaction (only when credits were deducted)
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
                    console.error('[ShopifyChargeController] Failed to record batch transaction:', err.message);
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
            } catch (e) {}
        }
    }

    /**
     * POST /api/shopify/stop
     * Stop ongoing batch
     */
    async stopBatch(req, res) {
        const userId = req.user?.id;

        this.shopifyChargeService.stopBatch();

        if (userId && this.creditManagerService) {
            try {
                await this.creditManagerService.releaseOperationLockByUser(userId, 'cancelled');
            } catch (err) {}
        }

        res.json({ status: 'OK', message: 'Stop signal sent' });
    }

    /**
     * Get Express router handlers
     */
    getRoutes() {
        return {
            checkCard: this.checkCard.bind(this),
            checkBatchStream: this.checkBatchStream.bind(this),
            stopBatch: this.stopBatch.bind(this)
        };
    }
}
