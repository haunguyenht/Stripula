/**
 * Shopify Charge Controller
 * Handles Shopify checkout card validation
 * Site configs are server-side - client just selects which gateway
 * 
 * Credit Billing: Shopify charge gateways use pricing_live per passed card
 */
export class ShopifyChargeController {
    constructor(options = {}) {
        this.shopifyChargeService = options.shopifyChargeService;
        this.creditManagerService = options.creditManagerService;
        this.telegramBotService = options.telegramBotService;
    }

    /**
     * GET /api/shopify/sites
     * Get available Shopify sites (only configured ones)
     */
    getSites(req, res) {
        const sites = this.shopifyChargeService.getAvailableSites();
        res.json({ status: 'OK', sites });
    }

    /**
     * GET /api/shopify/all-sites
     * Get all Shopify sites (including unconfigured)
     */
    getAllSites(req, res) {
        const sites = this.shopifyChargeService.getAllSites();
        res.json({ status: 'OK', sites });
    }

    /**
     * POST /api/shopify/site
     * Set active Shopify site
     */
    setSite(req, res) {
        const { siteId } = req.body;
        if (!siteId) {
            return res.status(400).json({ status: 'ERROR', message: 'siteId is required' });
        }
        const success = this.shopifyChargeService.setSite(siteId);
        if (!success) {
            return res.status(404).json({ status: 'ERROR', message: `Site not found: ${siteId}` });
        }
        res.json({ status: 'OK', message: `Switched to site: ${siteId}` });
    }

    /**
     * POST /api/shopify/update-site
     * Update site configuration (hot reload)
     */
    updateSite(req, res) {
        const { siteId, config } = req.body;
        if (!siteId || !config) {
            return res.status(400).json({ status: 'ERROR', message: 'siteId and config are required' });
        }

        const allowedFields = ['domain', 'prodUrl', 'prodId', 'label', 'customAddress'];
        const filteredConfig = {};
        for (const field of allowedFields) {
            if (config[field] !== undefined) {
                filteredConfig[field] = config[field];
            }
        }

        const success = this.shopifyChargeService.updateSiteConfig(siteId, filteredConfig);
        if (!success) {
            return res.status(404).json({ status: 'ERROR', message: `Site not found: ${siteId}` });
        }

        res.json({ status: 'OK', message: `Site ${siteId} updated`, config: filteredConfig });
    }

    /**
     * POST /api/shopify/check
     * Check a single card via Shopify checkout
     */
    async checkCard(req, res) {
        try {
            const { card } = req.body;

            if (!card) {
                return res.status(400).json({ status: 'ERROR', message: 'Card data is required (format: number|mm|yy|cvv)' });
            }

            const result = await this.shopifyChargeService.processCard(card);
            res.json(result.toJSON ? result.toJSON() : result);
        } catch (error) {

            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/shopify/batch
     * Check multiple cards via Shopify checkout
     * 
     * Requirements: 3.1, 3.2, 3.3, 3.4 - Uses tier-based speed limits
     */
    async checkBatch(req, res) {
        try {
            const { cards, cardList, concurrency = 2 } = req.body;
            
            // Get user tier from authenticated request (Requirement 3.1)
            const tier = req.user?.tier || 'free';

            let cardArray = cards;
            if (!cardArray && cardList) {
                cardArray = cardList.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && line.includes('|'));
            }

            if (!cardArray || cardArray.length === 0) {
                return res.status(400).json({ status: 'ERROR', message: 'No valid cards provided' });
            }

            const result = await this.shopifyChargeService.processBatch(
                cardArray,
                { 
                    concurrency: Math.min(concurrency, 3), // Lower max concurrency for Shopify
                    tier // Pass tier for speed limiting (Requirement 3.1)
                }
            );

            res.json({ status: 'OK', ...result });
        } catch (error) {

            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/shopify/batch-stream
     * Check multiple cards with SSE progress
     * 
     * Requirements: 3.1, 3.2, 3.3, 3.4 - Uses tier-based speed limits
     */
    async checkBatchStream(req, res) {
        const requestId = `shopify_${Date.now()}`;
        const { cards, cardList, concurrency = 2, siteId } = req.body;
        
        // Get user tier from authenticated request (Requirement 3.1)
        const tier = req.user?.tier || 'free';

        // Set site if provided
        if (siteId) {
            this.shopifyChargeService.setSite(siteId);
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
            this.shopifyChargeService?.stopBatch();
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
        const gatewayId = req.creditInfo?.gatewayId || siteId || 'shopify';
        
        // Track live deduction for real-time credit checking
        let totalCreditsDeducted = 0;
        let currentBalance = req.creditInfo?.currentBalance || 0;
        let creditExhausted = false;

        try {
            const result = await this.shopifyChargeService.processBatch(
                cardArray,
                {
                    concurrency: Math.min(concurrency, 3),
                    tier, // Pass tier for speed limiting (Requirement 3.1)
                    onProgress: (progress) => sendEvent('progress', progress),
                    onResult: async (result) => {
                        if (streamClosed || creditExhausted) return;
                        
                        // For LIVE cards (APPROVED in shopify auth), deduct credits in real-time
                        if (result.status === 'APPROVED' && userId && this.creditManagerService) {
                            const deductResult = await this.creditManagerService.deductSingleCardCredit(
                                userId,
                                gatewayId,
                                'live' // Shopify Auth uses pricing_live
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
                                this.shopifyChargeService.stopBatch();
                                
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
                                    gateway: siteId || 'shopify',
                                    type: 'shopify'
                                }).catch(() => {});
                            }
                        }
                        
                        sendEvent('result', result);
                    }
                }
            );

            const liveCount = result.stats?.approved || 0;

            // Credits already deducted per-card in real-time, no batch deduction needed
            if (totalCreditsDeducted > 0) {

            }

            // Release operation lock
            if (userId && this.creditManagerService) {
                try {
                    await this.creditManagerService.releaseOperationLockByUser(userId, creditExhausted ? 'credit_exhausted' : 'completed');
                } catch {}
            }

            sendEvent('complete', { 
                ...result, 
                creditsDeducted: totalCreditsDeducted,
                newBalance: currentBalance,
                creditExhausted
            });
        } catch (error) {
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
     * POST /api/shopify/stop
     * Stop ongoing batch
     */
    async stopBatch(req, res) {
        const userId = req.user?.id;

        this.shopifyChargeService.stopBatch();

        // Release operation lock so user can start new validation
        if (userId && this.creditManagerService) {
            try {
                await this.creditManagerService.releaseOperationLockByUser(userId, 'cancelled');

            } catch (err) {

            }
        }

        res.json({ status: 'OK', message: 'Stop signal sent' });
    }

    /**
     * Get Express router handlers
     */
    getRoutes() {
        return {
            getSites: this.getSites.bind(this),
            getAllSites: this.getAllSites.bind(this),
            setSite: this.setSite.bind(this),
            updateSite: this.updateSite.bind(this),
            checkCard: this.checkCard.bind(this),
            checkBatch: this.checkBatch.bind(this),
            checkBatchStream: this.checkBatchStream.bind(this),
            stopBatch: this.stopBatch.bind(this)
        };
    }
}
