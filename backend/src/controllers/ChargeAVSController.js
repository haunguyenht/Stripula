import { Router } from 'express';

/**
 * Charge AVS Controller
 * Handles HTTP endpoints for Qgiv AVS card validation
 * Requires card format: number|mm|yy|cvv|zip
 */
export class ChargeAVSController {
    constructor(options = {}) {
        this.chargeAVSService = options.chargeAVSService;
        this.creditManager = options.creditManager;
        this.gatewayConfigService = options.gatewayConfigService;
        this.telegramBotService = options.telegramBotService;
        this.router = Router();
    }

    getRoutes() {
        // Get available sites
        this.router.get('/sites', (req, res) => {
            const sites = this.chargeAVSService.getAvailableSites();
            res.json({ sites });
        });

        // Set active site
        this.router.post('/site', (req, res) => {
            const { siteId } = req.body;
            this.chargeAVSService.setSite(siteId);
            res.json({ status: 'OK', siteId });
        });

        // Stop validation
        this.router.post('/stop', (req, res) => {
            this.chargeAVSService.stop();
            res.json({ status: 'OK', message: 'Stopped' });
        });

        // Batch validation with SSE streaming
        this.router.post('/batch-stream', async (req, res) => {
            const { cardList, concurrency = 1, siteId } = req.body;

            if (!cardList || typeof cardList !== 'string') {
                return res.status(400).json({ status: 'ERROR', message: 'cardList is required' });
            }

            // Parse cards - support both 4-part and 5-part formats
            const cards = cardList
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean)
                .map(line => {
                    const parts = line.split('|');
                    if (parts.length < 4) return null;
                    
                    let [number, expMonth, expYear, cvc, zip] = parts.map(p => (p || '').trim());
                    number = number.replace(/\s/g, '');
                    
                    if (number.length < 13) return null;
                    
                    expYear = expYear.length === 4 ? expYear.slice(-2) : expYear;
                    expMonth = expMonth.padStart(2, '0');
                    
                    const result = { number, expMonth, expYear, cvc };
                    if (zip) {
                        result.zip = zip;
                    }
                    return result;
                })
                .filter(Boolean);

            if (cards.length === 0) {
                return res.status(400).json({ status: 'ERROR', message: 'No valid cards found' });
            }

            // Set up SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            const sendEvent = (event, data) => {
                res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            };

            // Get user info for credits
            const userId = req.user?.id;
            const userTier = req.user?.tier || 'free';

            sendEvent('start', { total: cards.length });

            let processed = 0;
            let liveCount = 0;
            let approvedCount = 0;

            try {
                await this.chargeAVSService.processBatch(cards, {
                    concurrency,
                    siteId,
                    userId,
                    userTier,
                    onResult: async (result) => {
                        processed++;

                        // Track live/approved for credits
                        const isLive = result.status === '3DS_REQUIRED' || 
                            (result.status === 'DECLINED' && result.isLive);
                        const isApproved = result.status === 'APPROVED';

                        if (isApproved) {
                            approvedCount++;
                            // Send Telegram notification for approved cards
                            if (this.telegramBotService && req.user) {
                                this.telegramBotService.notifyCardApproved({
                                    user: req.user,
                                    result,
                                    gateway: siteId || 'charge-avs-1',
                                    type: 'charge-avs'
                                }).catch(() => {});
                            }
                        }
                        if (isLive) {
                            liveCount++;
                        }

                        // Deduct credits for approved/live cards
                        if (this.creditManager && userId && (isApproved || isLive)) {
                            try {
                                const gatewayId = siteId || 'charge-avs-1';
                                let creditCost = 1;
                                
                                if (this.gatewayConfigService) {
                                    const pricing = await this.gatewayConfigService.getPricing(gatewayId);
                                    creditCost = isApproved ? (pricing?.approved || 1) : (pricing?.live || 1);
                                }
                                
                                await this.creditManager.deductCredits(userId, creditCost, {
                                    reason: isApproved ? 'charge_avs_approved' : 'charge_avs_live',
                                    gatewayId,
                                    cardLast4: result.card?.slice(-4)
                                });
                                
                                const newBalance = await this.creditManager.getBalance(userId);
                                result.newBalance = newBalance;
                            } catch (e) {
                                // Continue even if credit deduction fails
                            }
                        }

                        sendEvent('result', result);
                    },
                    onProgress: (progress) => {
                        sendEvent('progress', progress);
                    }
                });

                sendEvent('complete', { 
                    processed, 
                    liveCount, 
                    approvedCount,
                    total: cards.length 
                });
            } catch (error) {
                sendEvent('error', { message: error.message });
            }

            res.end();
        });

        return this.router;
    }
}

export default ChargeAVSController;
