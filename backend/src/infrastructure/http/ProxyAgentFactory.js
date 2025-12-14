import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

/**
 * Factory for creating proxy agents
 * Eliminates duplicated proxy creation logic across services
 */
export class ProxyAgentFactory {
    /**
     * Create a proxy agent from proxy configuration
     * @param {Object|Proxy} proxy - Proxy config {type, host, port, username?, password?}
     * @returns {HttpsProxyAgent|SocksProxyAgent|null}
     */
    create(proxy) {
        if (!proxy) return null;

        const url = this.buildUrl(proxy);
        
        if (this.isSocksProxy(proxy.type)) {
            return new SocksProxyAgent(url);
        }
        return new HttpsProxyAgent(url);
    }

    /**
     * Build proxy URL from configuration
     * @param {Object} proxy - Proxy configuration
     * @returns {string}
     */
    buildUrl(proxy) {
        const { type, host, port, username, password } = proxy;
        let protocol = type;
        
        // Normalize socks protocol
        if (protocol === 'socks') {
            protocol = 'socks5';
        }

        if (username && password) {
            return `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
        }
        return `${protocol}://${host}:${port}`;
    }

    /**
     * Check if proxy type is SOCKS
     * @param {string} type - Proxy type
     * @returns {boolean}
     */
    isSocksProxy(type) {
        const lowerType = type?.toLowerCase() || '';
        return lowerType === 'socks' || lowerType === 'socks4' || lowerType === 'socks5';
    }

    /**
     * Create axios config with proxy agent
     * @param {Object|null} proxy - Proxy configuration
     * @param {Object} baseConfig - Base axios config to extend
     * @returns {Object} Axios config with proxy agent
     */
    createAxiosConfig(proxy, baseConfig = {}) {
        const config = { ...baseConfig };
        
        if (proxy) {
            const agent = this.create(proxy);
            if (agent) {
                config.httpsAgent = agent;
                config.httpAgent = agent;
                config.proxy = false; // Disable axios built-in proxy
            }
        }
        
        return config;
    }
}

// Export singleton for convenience
export const proxyAgentFactory = new ProxyAgentFactory();
