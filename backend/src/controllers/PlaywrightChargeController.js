/**
 * Playwright Charge Controller
 * 
 * API endpoint for Stripe Elements-based charging with proxy support
 * Routes: /api/playwright/*
 */

import { PlaywrightElementsClient } from '../infrastructure/charge/PlaywrightElementsClient.js';

export class PlaywrightChargeController {
    constructor() {
        this.activeSessions = new Map();
    }

    /**
     * POST /api/playwright/charge
     * 
     * Request body:
     * {
     *   card: { number, exp_month, exp_year, cvc },
     *   account: { pk, sk, currency?, amount? },
     *   proxy?: "host:port:username:password" | "http://user:pass@host:port"
     * }
     */
    async chargeCard(req, res) {
        try {
            const { card, account, proxy } = req.body;

            if (!card || !card.number || !card.exp_month || !card.exp_year || !card.cvc) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing card details (number, exp_month, exp_year, cvc)'
                });
            }

            if (!account || !account.pk || !account.sk) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing account details (pk, sk)'
                });
            }

            // Parse proxy if provided
            const proxyConfig = proxy ? PlaywrightElementsClient.parseProxy(proxy) : null;

            // Create client
            const client = new PlaywrightElementsClient({
                pkKey: account.pk,
                skKey: account.sk,
                currency: account.currency || 'gbp',
                amount: account.amount || 100,
                proxy: proxyConfig,
                headless: true,
                debug: process.env.DEBUG === 'true'
            });

            // Charge card
            const result = await client.chargeCard(card);

            // Close browser
            await client.close();

            return res.json({
                success: result.status === 'Charged',
                ...result
            });

        } catch (error) {
            console.error('PlaywrightChargeController error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * POST /api/playwright/batch
     * 
     * Stream-based batch charging with SSE
     * 
     * Request body:
     * {
     *   cards: ["number|mm|yy|cvc", ...],
     *   account: { pk, sk, currency?, amount? },
     *   proxy?: "host:port:username:password"
     * }
     */
    async chargeBatch(req, res) {
        try {
            const { cards, account, proxy } = req.body;

            if (!cards || !Array.isArray(cards) || cards.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing or empty cards array'
                });
            }

            if (!account || !account.pk || !account.sk) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing account details (pk, sk)'
                });
            }

            // Setup SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            const sendEvent = (event, data) => {
                res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            };

            // Parse proxy if provided
            const proxyConfig = proxy ? PlaywrightElementsClient.parseProxy(proxy) : null;

            // Create client
            const client = new PlaywrightElementsClient({
                pkKey: account.pk,
                skKey: account.sk,
                currency: account.currency || 'gbp',
                amount: account.amount || 100,
                proxy: proxyConfig,
                headless: true,
                debug: process.env.DEBUG === 'true'
            });

            sendEvent('start', { total: cards.length });

            const results = {
                charged: [],
                live: [],
                declined: [],
                errors: []
            };

            // Process each card
            for (let i = 0; i < cards.length; i++) {
                const cardLine = cards[i];
                const parts = cardLine.split('|');

                if (parts.length < 4) {
                    const result = { card: cardLine, status: 'Error', error: 'Invalid format' };
                    results.errors.push(result);
                    sendEvent('result', { index: i, ...result });
                    continue;
                }

                const [number, exp_month, exp_year, cvc] = parts;
                const cardData = {
                    number: number.trim(),
                    exp_month: exp_month.trim(),
                    exp_year: exp_year.trim().length === 2 ? '20' + exp_year.trim() : exp_year.trim(),
                    cvc: cvc.trim()
                };

                sendEvent('progress', {
                    index: i,
                    total: cards.length,
                    card: `${number.slice(0, 6)}****${number.slice(-4)}`
                });

                try {
                    const result = await client.chargeCard(cardData);

                    if (result.status === 'Charged') {
                        results.charged.push(result);
                    } else if (result.status === 'Live') {
                        results.live.push(result);
                    } else {
                        results.declined.push(result);
                    }

                    sendEvent('result', { index: i, ...result });

                } catch (error) {
                    const result = { card: cardLine, status: 'Error', error: error.message };
                    results.errors.push(result);
                    sendEvent('result', { index: i, ...result });
                }

                // Small delay between cards
                await new Promise(r => setTimeout(r, 1000));
            }

            // Close browser
            await client.close();

            // Send summary
            sendEvent('complete', {
                total: cards.length,
                charged: results.charged.length,
                live: results.live.length,
                declined: results.declined.length,
                errors: results.errors.length,
                chargedCards: results.charged.map(r => r.card),
                liveCards: results.live.map(r => r.card)
            });

            res.end();

        } catch (error) {
            console.error('PlaywrightChargeController batch error:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }

    /**
     * POST /api/playwright/test-proxy
     * 
     * Test proxy connectivity
     */
    async testProxy(req, res) {
        try {
            const { proxy } = req.body;

            if (!proxy) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing proxy string'
                });
            }

            const proxyConfig = PlaywrightElementsClient.parseProxy(proxy);

            if (!proxyConfig) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid proxy format. Use host:port:user:pass or http://user:pass@host:port'
                });
            }

            // Test proxy with a simple request
            const { HttpsProxyAgent } = await import('https-proxy-agent');
            const https = await import('https');

            const proxyUrl = `http://${proxyConfig.username}:${proxyConfig.password}@${proxyConfig.host}:${proxyConfig.port}`;
            const agent = new HttpsProxyAgent(proxyUrl);

            const result = await new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: 'api.ipify.org',
                    path: '/?format=json',
                    method: 'GET',
                    agent,
                    timeout: 10000
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch {
                            resolve({ ip: data.trim() });
                        }
                    });
                });
                req.on('error', reject);
                req.on('timeout', () => reject(new Error('Timeout')));
                req.end();
            });

            return res.json({
                success: true,
                proxy: `${proxyConfig.host}:${proxyConfig.port}`,
                ip: result.ip
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    getRoutes() {
        return [
            { method: 'POST', path: '/api/playwright/charge', handler: this.chargeCard.bind(this) },
            { method: 'POST', path: '/api/playwright/batch', handler: this.chargeBatch.bind(this) },
            { method: 'POST', path: '/api/playwright/test-proxy', handler: this.testProxy.bind(this) }
        ];
    }
}

export default PlaywrightChargeController;
