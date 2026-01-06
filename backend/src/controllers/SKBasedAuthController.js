/**
 * SKBasedAuthController - HTTP controller for SK-based auth validation
 * 
 * Handles endpoints for SetupIntent-based $0 authorization using user-provided
 * Stripe SK/PK keys.
 * 
 * Routes:
 * - POST /api/skbased-auth/validate - Start batch validation
 * - GET /api/skbased-auth/validate/stream - SSE results stream
 * - POST /api/skbased-auth/stop - Stop batch validation
 */
export class SKBasedAuthController {
    constructor(options = {}) {
        this.skbasedAuthService = options.skbasedAuthService;
        this.gatewayManager = options.gatewayManager;
        this.telegramBotService = options.telegramBotService;
        
        // Store active SSE connections
        this.sseClients = new Map();
        this.sessionCounter = 0;
    }

    /**
     * Validate SK key format
     * @private
     */
    _validateSKKey(skKey) {
        if (!skKey) return { valid: false, error: 'SK key is required' };
        if (!skKey.startsWith('sk_live_') && !skKey.startsWith('sk_test_')) {
            return { valid: false, error: 'Invalid SK key format. Must start with sk_live_ or sk_test_' };
        }
        return { valid: true };
    }

    /**
     * Validate PK key format
     * @private
     */
    _validatePKKey(pkKey) {
        if (!pkKey) return { valid: false, error: 'PK key is required' };
        if (!pkKey.startsWith('pk_live_') && !pkKey.startsWith('pk_test_')) {
            return { valid: false, error: 'Invalid PK key format. Must start with pk_live_ or pk_test_' };
        }
        return { valid: true };
    }

    /**
     * Validate proxy configuration
     * @private
     */
    _validateProxy(proxy) {
        if (!proxy) return { valid: false, error: 'Proxy configuration is required' };
        if (!proxy.host) return { valid: false, error: 'Proxy host is required' };
        if (!proxy.port) return { valid: false, error: 'Proxy port is required' };
        
        const port = parseInt(proxy.port, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            return { valid: false, error: 'Proxy port must be between 1 and 65535' };
        }
        
        const validTypes = ['http', 'https', 'socks4', 'socks5'];
        if (proxy.type && !validTypes.includes(proxy.type)) {
            return { valid: false, error: `Proxy type must be one of: ${validTypes.join(', ')}` };
        }
        
        return { valid: true };
    }

    /**
     * Mask sensitive data for logging
     * @private
     */
    _maskKey(key) {
        if (!key || key.length < 16) return '****';
        return key.slice(0, 12) + '****' + key.slice(-4);
    }

    /**
     * POST /api/skbased-auth/validate
     * Start batch validation
     */
    async startValidation(req, res) {
        const { skKey, pkKey, cards, proxy } = req.body;
        // Get user tier from authenticated request (Requirement 3.1)
        const tier = req.user?.tier || 'free';

        // Validate SK key
        const skValidation = this._validateSKKey(skKey);
        if (!skValidation.valid) {
            return res.status(400).json({ status: 'ERROR', message: skValidation.error });
        }

        // Validate PK key
        const pkValidation = this._validatePKKey(pkKey);
        if (!pkValidation.valid) {
            return res.status(400).json({ status: 'ERROR', message: pkValidation.error });
        }

        // Validate proxy
        const proxyValidation = this._validateProxy(proxy);
        if (!proxyValidation.valid) {
            return res.status(400).json({ status: 'ERROR', message: proxyValidation.error });
        }

        // Validate cards
        if (!cards || !Array.isArray(cards) || cards.length === 0) {
            return res.status(400).json({ status: 'ERROR', message: 'No cards provided' });
        }

        // Generate session ID
        const sessionId = `skbased-auth-${++this.sessionCounter}-${Date.now()}`;
        // Normalize proxy config
        const normalizedProxy = {
            host: proxy.host,
            port: parseInt(proxy.port, 10),
            type: proxy.type || 'http',
            username: proxy.username || null,
            password: proxy.password || null
        };

        // Store user for notifications
        const user = req.user;
        const userId = req.user?.id;

        // Start batch processing (non-blocking)
        this.skbasedAuthService.processBatch(cards, {
            skKey,
            pkKey,
            proxy: normalizedProxy,
            tier,
            userId, // Pass userId for statistics tracking (Requirements 8.1, 8.2)
            onResult: (result) => {
                // Send Telegram notification for approved/live cards
                if (this.telegramBotService && (result.status === 'APPROVED' || result.status === 'LIVE')) {
                    this.telegramBotService.notifyCardApproved({
                        user,
                        result,
                        gateway: 'sk-based-auth',
                        type: 'skbased-auth'
                    }).catch(() => {});
                }

                // Send result to SSE clients
                this._broadcastToSession(sessionId, {
                    type: 'result',
                    data: result
                });
            },
            onProgress: (progress) => {
                // Send progress to SSE clients
                this._broadcastToSession(sessionId, {
                    type: 'progress',
                    data: progress
                });
            }
        }).then((batchResult) => {
            // Send completion to SSE clients
            this._broadcastToSession(sessionId, {
                type: 'complete',
                data: batchResult
            });
        }).catch((error) => {
            this._broadcastToSession(sessionId, {
                type: 'error',
                data: { message: error.message }
            });
        });

        // Return session ID immediately
        res.json({
            status: 'OK',
            sessionId,
            message: 'Validation started',
            cardCount: cards.length
        });
    }

    /**
     * GET /api/skbased-auth/validate/stream
     * SSE results stream
     */
    streamResults(req, res) {
        const sessionId = req.query.sessionId;

        if (!sessionId) {
            return res.status(400).json({ status: 'ERROR', message: 'Session ID required' });
        }

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Send initial connection event
        res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

        // Store client connection
        if (!this.sseClients.has(sessionId)) {
            this.sseClients.set(sessionId, new Set());
        }
        this.sseClients.get(sessionId).add(res);

        // Handle client disconnect
        req.on('close', () => {
            const clients = this.sseClients.get(sessionId);
            if (clients) {
                clients.delete(res);
                if (clients.size === 0) {
                    this.sseClients.delete(sessionId);
                }
            }
        });
    }

    /**
     * POST /api/skbased-auth/stop
     * Stop batch validation
     */
    async stopValidation(req, res) {
        this.skbasedAuthService.stopBatch();
        
        res.json({
            status: 'OK',
            message: 'Validation stopped'
        });
    }

    /**
     * Broadcast message to all SSE clients for a session
     * @private
     */
    _broadcastToSession(sessionId, message) {
        const clients = this.sseClients.get(sessionId);
        if (!clients) return;

        const data = JSON.stringify(message);
        for (const client of clients) {
            try {
                client.write(`data: ${data}\n\n`);
            } catch (error) {
            }
        }
    }

    /**
     * Get route handlers
     */
    getRoutes() {
        return {
            startValidation: this.startValidation.bind(this),
            streamResults: this.streamResults.bind(this),
            stopValidation: this.stopValidation.bind(this)
        };
    }
}

export default SKBasedAuthController;
