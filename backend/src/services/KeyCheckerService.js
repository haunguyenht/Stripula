/**
 * Key Checker Service
 * Handles Stripe API key validation with proxy rotation support
 */
export class KeyCheckerService {
    constructor(options = {}) {
        this.stripeClient = options.stripeClient;
        this.gatewayManager = options.gatewayManager || null;
    }

    /**
     * Check a single SK key
     * @param {string} skKey - Stripe secret key
     * @param {Object} proxy - Optional proxy configuration
     * @returns {Promise<Object>}
     */
    async checkKey(skKey, proxy = null) {
        if (!skKey || !skKey.startsWith('sk_')) {
            return { status: 'ERROR', message: 'Invalid SK key format' };
        }

        try {
            const result = await this.stripeClient.checkKey(skKey, proxy);
            return result;

        } catch (error) {
            const message = error.response?.data?.error?.message || error.message;
            
            // Detect static IP / blocked errors
            const staticPatterns = [
                'static',
                'suspicious',
                'blocked',
                'too many requests',
                'rate limit',
                'access denied',
                'ip restricted',
                'api_key_expired',
                'invalid_request_error'
            ];
            
            const isStaticError = staticPatterns.some(p => 
                message.toLowerCase().includes(p.toLowerCase())
            );
            
            if (isStaticError) {
                return { 
                    status: 'ERROR', 
                    message: message,
                    isStaticError: true,
                    requiresProxyRotation: true
                };
            }
            
            return { status: 'DEAD', message };
        }
    }

    /**
     * Get proxy configuration from gateway manager or options
     * Rotates through available proxies for each request
     * @param {Object} options - Options with optional proxyConfig
     * @returns {Object|null} Proxy configuration
     */
    _getRotatingProxy(options = {}) {
        // If explicit proxy config provided, use it
        if (options.proxyConfig) {
            return options.proxyConfig;
        }
        
        // Try to get proxy from gateway manager (for sk-based gateway)
        if (this.gatewayManager) {
            const proxyConfig = this.gatewayManager.getProxyConfig('sk-check');
            if (proxyConfig) {
                return proxyConfig;
            }
        }
        
        return null;
    }

    /**
     * Check multiple SK keys with proxy rotation
     * @param {string[]} keys - Array of SK keys
     * @param {Object} options - { onProgress, onResult, delayMs, proxyConfig, retryOnStatic }
     * @returns {Promise<Object>}
     */
    async checkKeys(keys, options = {}) {
        const { 
            onProgress = null, 
            onResult = null, 
            delayMs = 500,
            proxyConfig = null,
            retryOnStatic = true,
            maxRetries = 2
        } = options;

        const results = [];
        const summary = { live: 0, livePlus: 0, liveZero: 0, liveNeg: 0, dead: 0, error: 0, total: 0, staticErrors: 0 };

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i].trim();
            if (!key.startsWith('sk_')) continue;

            // Get proxy for this request (rotates if using rotating proxy)
            const proxy = proxyConfig || this._getRotatingProxy(options);
            
            let result = await this.checkKey(key, proxy);
            
            // Retry with delay if static error detected
            if (retryOnStatic && result.isStaticError && maxRetries > 0) {
                summary.staticErrors++;
                
                for (let retry = 0; retry < maxRetries; retry++) {
                    // Wait longer before retry (exponential backoff)
                    await new Promise(r => setTimeout(r, (retry + 1) * 2000));
                    
                    // Try again with same proxy (residential proxies rotate on each request)
                    result = await this.checkKey(key, proxy);
                    
                    if (!result.isStaticError) {
                        break;
                    }
                }
            }
            
            result.key = key;
            result.fullKey = key;

            if (result.status?.startsWith('LIVE')) {
                results.push(result);
                summary.live++;
                if (result.status === 'LIVE+') summary.livePlus++;
                else if (result.status === 'LIVE0') summary.liveZero++;
                else if (result.status === 'LIVE-') summary.liveNeg++;
            } else if (result.status === 'DEAD') {
                summary.dead++;
            } else {
                summary.error++;
            }

            summary.total = summary.live + summary.dead + summary.error;

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: keys.length,
                    percentage: Math.round(((i + 1) / keys.length) * 100),
                    summary
                });
            }

            if (onResult) {
                onResult(result);
            }

            // Delay between requests
            if (i < keys.length - 1 && delayMs > 0) {
                await new Promise(r => setTimeout(r, delayMs));
            }
        }

        return { results, summary };
    }
}
