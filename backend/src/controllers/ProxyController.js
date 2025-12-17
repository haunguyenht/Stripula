/**
 * Proxy Controller
 * Handles proxy testing operations
 */
import { Proxy } from '../domain/Proxy.js';
import axios from 'axios';

export class ProxyController {
    constructor(options = {}) {
        this.proxyManager = options.proxyManager;
    }

    /**
     * POST /api/stripe-own/check-proxy
     * Test if a proxy is working by making an actual request through it
     * Also detects if proxy is static by making 2 requests and comparing IPs
     */
    async checkProxy(req, res) {
        try {
            const { proxy } = req.body;

            if (!proxy) {
                return res.status(400).json({ success: false, message: 'Proxy is required' });
            }

            // Create Proxy entity from the parsed proxy object
            const proxyEntity = new Proxy({
                type: proxy.type || 'http',
                host: proxy.host,
                port: proxy.port,
                username: proxy.username,
                password: proxy.password
            });

            // Actually test the proxy
            const result = await this.proxyManager.testProxy(proxyEntity);

            if (result.success) {
                // Get IP twice to detect if rotating
                const { ip, isStatic } = await this.detectStaticProxy(proxyEntity);

                res.json({ 
                    success: true, 
                    message: isStatic 
                        ? `Static proxy detected (${result.responseTime})` 
                        : `Proxy working (${result.responseTime})`,
                    responseTime: result.responseTime,
                    ip,
                    isStatic
                });
            } else {
                res.json({ 
                    success: false, 
                    message: result.error || 'Proxy connection failed'
                });
            }

        } catch (error) {
            console.error('[ProxyController] Error:', error.message);
            res.json({ success: false, message: error.message });
        }
    }

    /**
     * Detect if proxy is static by making 2 requests and comparing IPs
     * If both IPs are the same, it's a static proxy
     */
    async detectStaticProxy(proxy) {
        const agent = this.proxyManager.proxyFactory.create(proxy);
        if (!agent) return { ip: null, isStatic: false };

        try {
            // Make first request
            const response1 = await axios.get('https://api.ipify.org?format=json', {
                httpAgent: agent,
                httpsAgent: agent,
                proxy: false,
                timeout: 5000
            });
            const ip1 = response1.data?.ip;

            // Small delay to allow rotation
            await new Promise(resolve => setTimeout(resolve, 500));

            // Make second request
            const response2 = await axios.get('https://api.ipify.org?format=json', {
                httpAgent: agent,
                httpsAgent: agent,
                proxy: false,
                timeout: 5000
            });
            const ip2 = response2.data?.ip;

            // If both IPs are the same, it's static
            const isStatic = ip1 === ip2;

            return { ip: ip1, isStatic };
        } catch {
            return { ip: null, isStatic: false };
        }
    }

    /**
     * Get Express router handlers
     */
    getRoutes() {
        return {
            checkProxy: this.checkProxy.bind(this)
        };
    }
}
