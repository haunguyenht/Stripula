import { Card } from '../domain/Card.js';
import { Proxy } from '../domain/Proxy.js';

/**
 * Card Controller
 * Handles card validation operations
 */
export class CardController {
    constructor(options = {}) {
        this.validationFacade = options.validationFacade;
        this.browserService = options.browserService;
    }

    /**
     * POST /api/stripe-own/validate
     * Validate a single card
     */
    async validate(req, res) {
        try {
            const { skKey, pkKey, card, proxy, usePlaywright = true } = req.body;

            if (!skKey) {
                return res.status(400).json({ status: 'ERROR', message: 'Stripe secret key (skKey) is required' });
            }

            if (!card || !card.number || !card.expMonth || !card.expYear || !card.cvv) {
                return res.status(400).json({ status: 'ERROR', message: 'Card data (number, expMonth, expYear, cvv) is required' });
            }

            const mode = usePlaywright && pkKey ? 'Playwright' : 'API';
            console.log(`[CardController] Validating ${card.number} | Mode: ${mode}`);

            const result = await this.validationFacade.validateCard({
                card,
                skKey,
                pkKey,
                proxy,
                method: usePlaywright ? 'charge' : 'direct'
            });

            res.json(result.toJSON ? result.toJSON() : result);

        } catch (error) {
            console.error('[CardController] Error:', error.message);
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/stripe-own/validate-nocharge
     * Validate card without charging
     */
    async validateNoCharge(req, res) {
        try {
            const { skKey, pkKey, card, proxy } = req.body;

            if (!skKey || !pkKey) {
                return res.status(400).json({ status: 'ERROR', message: 'Both skKey and pkKey are required' });
            }

            if (!card || !card.number || !card.expMonth || !card.expYear || !card.cvv) {
                return res.status(400).json({ status: 'ERROR', message: 'Card data is required' });
            }

            console.log(`[CardController] NoCharge validation: ${card.number}`);

            const result = await this.validationFacade.validateCard({
                card,
                skKey,
                pkKey,
                proxy,
                method: 'nocharge'
            });

            res.json(result.toJSON ? result.toJSON() : result);

        } catch (error) {
            console.error('[CardController] NoCharge error:', error.message);
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/stripe-own/validate-batch
     * Validate multiple cards (JSON response)
     */
    async validateBatch(req, res) {
        try {
            const { skKey, pkKey, cards, cardList, concurrency = 3, proxy } = req.body;

            if (!skKey || !pkKey) {
                return res.status(400).json({ status: 'ERROR', message: 'Both skKey and pkKey are required' });
            }

            const result = await this.validationFacade.validateBatch({
                cards,
                cardList,
                skKey,
                pkKey,
                proxy,
                concurrency: Math.min(concurrency, 10)
            });

            res.json({ status: 'OK', ...result });

        } catch (error) {
            console.error('[CardController] Batch error:', error.message);
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/stripe-own/validate-batch-stream
     * Validate multiple cards with SSE progress
     */
    async validateBatchStream(req, res) {
        const { skKey, pkKey, cards, cardList, concurrency = 3, proxy, validationMethod = 'charge', chargeAmount } = req.body;

        if (!skKey || !pkKey) {
            return res.status(400).json({ status: 'ERROR', message: 'Both skKey and pkKey are required' });
        }

        // Parse cards
        let cardArray = cards;
        if (!cardArray && cardList) {
            cardArray = Card.parseList(cardList);
        }

        if (!cardArray || cardArray.length === 0) {
            return res.status(400).json({ status: 'ERROR', message: 'No valid cards provided' });
        }

        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const sendEvent = (event, data) => {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        const methodLabels = { nocharge: 'No Charge', setup: 'Setup Page', charge: 'Charge', direct: 'Direct API' };
        console.log(`[CardController] Batch stream: ${cardArray.length} cards | Method: ${methodLabels[validationMethod] || 'Charge'}`);

        sendEvent('start', { total: cardArray.length, concurrency, validationMethod });

        try {
            const result = await this.validationFacade.validateBatch({
                cards: cardArray,
                skKey,
                pkKey,
                proxy,
                concurrency: Math.min(concurrency, 10),
                method: validationMethod,
                chargeAmount: chargeAmount || null,
                onProgress: (progress) => sendEvent('progress', progress),
                onResult: (result) => sendEvent('result', result.toJSON ? result.toJSON() : result)
            });

            sendEvent('complete', result);
            res.end();

        } catch (error) {
            sendEvent('error', { message: error.message });
            res.end();
        }
    }

    /**
     * POST /api/stripe-own/stop-batch
     * Stop ongoing batch validation
     */
    stopBatch(req, res) {
        this.validationFacade.stopBatch();
        res.json({ status: 'OK', message: 'Stop signal sent' });
    }

    /**
     * POST /api/stripe-own/parse-cards
     * Parse card list text
     */
    parseCards(req, res) {
        const { cardList } = req.body;

        if (!cardList) {
            return res.status(400).json({ status: 'ERROR', message: 'cardList is required' });
        }

        const cards = Card.parseList(cardList);
        res.json({
            status: 'OK',
            count: cards.length,
            cards: cards.map(c => ({
                number: c.number,
                expMonth: c.expMonth,
                expYear: c.expYear,
                bin: c.bin
            }))
        });
    }

    /**
     * POST /api/stripe-own/pay
     * Process a real payment
     */
    async pay(req, res) {
        try {
            const { skKey, pkKey, card, amount, currency = 'usd', proxy } = req.body;

            if (!skKey || !pkKey) {
                return res.status(400).json({ status: 'ERROR', message: 'Both skKey and pkKey are required' });
            }

            if (!card || !card.number || !card.expMonth || !card.expYear || !card.cvv) {
                return res.status(400).json({ status: 'ERROR', message: 'Card data is required' });
            }

            if (!amount || amount <= 0) {
                return res.status(400).json({ status: 'ERROR', message: 'Valid amount is required' });
            }

            console.log(`[CardController] Payment: $${amount} ${currency.toUpperCase()} | ${card.number}`);

            // Use charge validator but without refund for actual payment
            // For now, return error - payment should be implemented separately
            res.status(501).json({ status: 'ERROR', message: 'Payment endpoint not implemented in refactored version' });

        } catch (error) {
            console.error('[CardController] Payment error:', error.message);
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * POST /api/stripe-own/tokenize
     * Tokenize a card (get PaymentMethod ID)
     */
    async tokenize(req, res) {
        try {
            const { pkKey, card, proxy } = req.body;

            if (!pkKey) {
                return res.status(400).json({ status: 'ERROR', message: 'pkKey is required' });
            }

            if (!card || !card.number || !card.expMonth || !card.expYear || !card.cvv) {
                return res.status(400).json({ status: 'ERROR', message: 'Card data is required' });
            }

            console.log(`[CardController] Tokenizing ${card.number}`);

            const cardEntity = new Card(card);
            const result = await this.browserService.createPaymentMethod(pkKey, cardEntity);

            if (result.success) {
                res.json({
                    status: 'SUCCESS',
                    message: `Tokenized: ${result.paymentMethodId}`,
                    success: true,
                    paymentMethodId: result.paymentMethodId,
                    card: result.card
                });
            } else {
                res.json({ status: 'ERROR', message: result.error, success: false });
            }

        } catch (error) {
            console.error('[CardController] Tokenize error:', error.message);
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * Get Express router handlers
     */
    getRoutes() {
        return {
            validate: this.validate.bind(this),
            validateNoCharge: this.validateNoCharge.bind(this),
            validateBatch: this.validateBatch.bind(this),
            validateBatchStream: this.validateBatchStream.bind(this),
            stopBatch: this.stopBatch.bind(this),
            parseCards: this.parseCards.bind(this),
            pay: this.pay.bind(this),
            tokenize: this.tokenize.bind(this)
        };
    }
}
