/**
 * ProxyRotationHelper
 * 
 * Utility module for rotating proxy session management.
 * Different proxy providers use different session ID formats to assign new IPs.
 * This helper centralizes the logic for session rotation.
 * 
 * Supported Providers and their session formats:
 * - SquidProxies: user-USERNAME-session-SESSIONID (note the 'user-' prefix!)
 * - BrightData: username-session-SESSIONID
 * - SmartProxy: user-SESSIONID
 * - Oxylabs: user-sessid-SESSIONID
 * - Webshare: username_session-SESSIONID
 * - SOAX: user-session-SESSIONID
 * 
 * Default format: username-session-SESSIONID (works with most providers)
 */

// Known rotating proxy providers
const ROTATING_PROXY_HOSTS = [
    'squidproxies',
    'brightdata',
    'smartproxy',
    'oxylabs',
    'webshare',
    'soax',
    'residential',
    'rotating',
    'luminati',  // BrightData's old name
    'geonode',
    'packetstream',
    'infatica',
    'shifter',
    'proxyrack',
    'iproyal',
    'proxy-seller',
    'storm',
    'rayobyte'
];

/**
 * Check if a host is a known rotating proxy provider
 * @param {string} host - Proxy host
 * @returns {boolean}
 */
export function isRotatingProxy(host) {
    if (!host) return false;
    const lowerHost = host.toLowerCase();
    return ROTATING_PROXY_HOSTS.some(provider => lowerHost.includes(provider));
}

/**
 * Generate a unique session ID
 * @param {number} length - Length of session ID (default 8)
 * @returns {string}
 */
export function generateSessionId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Apply session rotation to proxy username
 * 
 * @param {string} username - Original proxy username
 * @param {string} host - Proxy host (used to detect provider)
 * @param {string} sessionId - Session ID to use (generated if not provided)
 * @returns {string} Username with session rotation applied
 */
export function rotateProxyUsername(username, host, sessionId = null) {
    if (!username) return username;
    if (!isRotatingProxy(host)) return username;

    const sid = sessionId || generateSessionId();

    // Different providers may use different formats
    const lowerHost = (host || '').toLowerCase();

    // SquidProxies uses: user-USERNAME-session-SESSIONID
    if (lowerHost.includes('squidproxies')) {
        return `user-${username}-session-${sid}`;
    }

    if (lowerHost.includes('smartproxy')) {
        // SmartProxy uses: user-SESSIONID
        return `${username}-${sid}`;
    }

    if (lowerHost.includes('oxylabs')) {
        // Oxylabs uses: user-sessid-SESSIONID  
        return `${username}-sessid-${sid}`;
    }

    if (lowerHost.includes('webshare')) {
        // Webshare uses: username_session-SESSIONID
        return `${username}_session-${sid}`;
    }

    // Default format: username-session-SESSIONID
    // Works with: BrightData/Luminati, SOAX, and most others
    return `${username}-session-${sid}`;
}

/**
 * Create a gateway proxy manager with session rotation support
 * 
 * @param {Object} proxyConfig - Base proxy configuration
 * @param {string} proxyConfig.host - Proxy host
 * @param {number} proxyConfig.port - Proxy port
 * @param {string} proxyConfig.username - Proxy username
 * @param {string} proxyConfig.password - Proxy password
 * @param {string} proxyConfig.type - Proxy type (http, https, socks5)
 * @returns {Object|null} Proxy manager object with getNextProxy method
 */
export function createRotatingProxyManager(proxyConfig) {
    if (!proxyConfig) return null;

    return {
        isEnabled: () => true,
        getNextProxy: async () => {
            // Generate new session ID for each request
            const sessionId = generateSessionId();
            const rotatedUsername = rotateProxyUsername(
                proxyConfig.username,
                proxyConfig.host,
                sessionId
            );

            return {
                type: proxyConfig.type || 'http',
                host: proxyConfig.host,
                port: proxyConfig.port,
                username: rotatedUsername,
                password: proxyConfig.password
            };
        }
    };
}

/**
 * Format proxy config to a single-line string for APIs
 * Format: host:port:username:password
 * 
 * @param {Object} proxyConfig - Proxy configuration
 * @param {boolean} rotate - Whether to apply session rotation
 * @returns {string} Formatted proxy string
 */
export function formatProxyString(proxyConfig, rotate = true) {
    if (!proxyConfig?.host || !proxyConfig?.port) return '';

    let username = proxyConfig.username;
    if (rotate && username) {
        username = rotateProxyUsername(username, proxyConfig.host);
    }

    if (username && proxyConfig.password) {
        return `${proxyConfig.host}:${proxyConfig.port}:${username}:${proxyConfig.password}`;
    }

    return `${proxyConfig.host}:${proxyConfig.port}`;
}

export default {
    isRotatingProxy,
    generateSessionId,
    rotateProxyUsername,
    createRotatingProxyManager,
    formatProxyString,
    ROTATING_PROXY_HOSTS
};
