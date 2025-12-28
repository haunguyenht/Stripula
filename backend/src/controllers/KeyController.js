/**
 * Key Controller
 * Handles SK key validation endpoints
 * Routes: /api/keys/*
 */
export class KeyController {
    constructor(options = {}) {
        this.keyCheckerService = options.keyCheckerService;
        this.telegramBotService = options.telegramBotService;
        this.gatewayManager = options.gatewayManager;
    }

    /**
     * POST /api/keys/check
     * Check a single SK key and return account info + PK key
     * Supports proxy configuration for avoiding static IP detection
     */
    async checkKey(req, res) {
        const { skKey, useProxy = true } = req.body;

        if (!skKey) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'SK key is required'
            });
        }

        if (!skKey.startsWith('sk_live_') && !skKey.startsWith('sk_test_')) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Invalid SK key format. Must start with sk_live_ or sk_test_'
            });
        }

        try {
            // Get proxy config from gateway manager if available and useProxy is true
            let proxyConfig = null;
            if (useProxy && this.gatewayManager) {
                proxyConfig = this.gatewayManager.getProxyConfig('sk-check');
            }

            const result = await this.keyCheckerService.checkKey(skKey, proxyConfig);

            // Add static detection info to response
            if (result.isStaticError) {
                result.message = `${result.message} (Static IP detected - try rotating proxy)`;
            }

            // Send Telegram notification for live SK keys
            if (this.telegramBotService && result.status?.startsWith('LIVE')) {
                this.telegramBotService.notifyLiveSK({
                    user: req.user,
                    result: { ...result, fullKey: skKey },
                    isManualInput: true
                }).catch(() => {});
            }

            res.json(result);
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                message: 'Failed to check key'
            });
        }
    }

    /**
     * POST /api/keys/check-batch
     * Check multiple SK keys with proxy rotation
     */
    async checkKeysBatch(req, res) {
        const { keys, useProxy = true, delayMs = 500 } = req.body;

        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Keys array is required'
            });
        }

        // Limit batch size
        const maxKeys = 100;
        if (keys.length > maxKeys) {
            return res.status(400).json({
                status: 'ERROR',
                message: `Maximum ${maxKeys} keys per batch`
            });
        }

        try {
            // Get proxy config from gateway manager
            let proxyConfig = null;
            if (useProxy && this.gatewayManager) {
                proxyConfig = this.gatewayManager.getProxyConfig('sk-check');
            }

            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const { results, summary } = await this.keyCheckerService.checkKeys(keys, {
                proxyConfig,
                delayMs,
                retryOnStatic: true,
                onProgress: (progress) => {
                    res.write(`data: ${JSON.stringify({ type: 'progress', ...progress })}\n\n`);
                },
                onResult: (result) => {
                    res.write(`data: ${JSON.stringify({ type: 'result', result })}\n\n`);
                    
                    // Send Telegram notification for live SK keys
                    if (this.telegramBotService && result.status?.startsWith('LIVE')) {
                        this.telegramBotService.notifyLiveSK({
                            user: req.user,
                            result,
                            isManualInput: false
                        }).catch(() => {});
                    }
                }
            });

            // Send final summary
            res.write(`data: ${JSON.stringify({ type: 'complete', results, summary })}\n\n`);
            res.end();
        } catch (error) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to check keys' })}\n\n`);
            res.end();
        }
    }

    /**
     * Get route handlers
     * @returns {Object} Route handlers
     */
    getRoutes() {
        return {
            checkKey: this.checkKey.bind(this),
            checkKeysBatch: this.checkKeysBatch.bind(this)
        };
    }
}
