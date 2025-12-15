/**
 * Proxy parsing utility
 * Parses proxy strings into structured objects
 */

/**
 * Parse proxy string to object
 * Supports formats:
 * - host:port
 * - host:port:user:pass
 * - user:pass@host:port
 * - http://host:port
 * - http://user:pass@host:port
 * - socks5://host:port
 * 
 * @param {string} proxyStr - Proxy string to parse
 * @returns {object|null} - Parsed proxy object or null
 */
export function parseProxy(proxyStr) {
    if (!proxyStr?.trim()) return null;
    
    let line = proxyStr.trim();
    let type = 'http';
    let host, port, username, password;

    // Check for protocol prefix
    const protocolMatch = line.match(/^(https?|socks[45]?):\/\//i);
    if (protocolMatch) {
        type = protocolMatch[1].toLowerCase();
        if (type === 'socks') type = 'socks5';
        line = line.substring(protocolMatch[0].length);
    }

    // Parse auth and host
    if (line.includes('@')) {
        // Format: user:pass@host:port
        const [auth, hostPort] = line.split('@');
        [username, password] = auth.split(':');
        [host, port] = hostPort.split(':');
    } else if (line.split(':').length === 4) {
        // Format: host:port:user:pass
        [host, port, username, password] = line.split(':');
    } else {
        // Format: host:port
        [host, port] = line.split(':');
    }

    if (!host || !port) return null;

    return {
        type,
        host,
        port: parseInt(port),
        username: username || undefined,
        password: password || undefined,
    };
}

/**
 * Format proxy object to string
 * @param {object} proxy - Proxy object
 * @returns {string} - Formatted proxy string
 */
export function formatProxy(proxy) {
    if (!proxy) return '';
    
    const { type, host, port, username, password } = proxy;
    
    let str = '';
    if (type && type !== 'http') {
        str += `${type}://`;
    }
    
    if (username && password) {
        str += `${username}:${password}@`;
    }
    
    str += `${host}:${port}`;
    
    return str;
}

/**
 * Validate proxy string
 * @param {string} proxyStr - Proxy string to validate
 * @returns {boolean} - Whether the proxy string is valid
 */
export function isValidProxy(proxyStr) {
    const parsed = parseProxy(proxyStr);
    return parsed !== null && parsed.host && parsed.port;
}

