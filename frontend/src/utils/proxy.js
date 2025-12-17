/**
 * Proxy parsing utility
 * Parses proxy strings into structured objects
 */

/**
 * Parse proxy string to object
 * Supports many formats:
 * - host:port
 * - host:port:user:pass
 * - user:pass@host:port
 * - user:pass:host:port
 * - http://host:port
 * - http://user:pass@host:port
 * - socks5://host:port
 * - socks5://user:pass@host:port
 * - host:port@user:pass
 * - IP:PORT:USER:PASS (common format)
 * - USER:PASS:IP:PORT (alternative format)
 * - USER:PASS@IP:PORT
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

    // Helper to check if string looks like an IP address
    const isIP = (str) => /^(\d{1,3}\.){3}\d{1,3}$/.test(str);
    // Helper to check if string looks like a port number
    const isPort = (str) => /^\d+$/.test(str) && parseInt(str) > 0 && parseInt(str) <= 65535;
    // Helper to check if string looks like a hostname
    const isHostname = (str) => /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(str);

    // Format: user:pass@host:port or host:port@user:pass
    if (line.includes('@')) {
        const atParts = line.split('@');
        if (atParts.length === 2) {
            const [part1, part2] = atParts;
            const left = part1.split(':');
            const right = part2.split(':');
            
            // Check if left side is host:port (host:port@user:pass)
            if (left.length === 2 && (isIP(left[0]) || isHostname(left[0])) && isPort(left[1])) {
                host = left[0];
                port = left[1];
                if (right.length >= 2) {
                    username = right[0];
                    password = right.slice(1).join(':'); // Password might contain ':'
                } else if (right.length === 1) {
                    username = right[0];
                }
            }
            // Otherwise assume user:pass@host:port
            else {
                if (left.length >= 2) {
                    username = left[0];
                    password = left.slice(1).join(':'); // Password might contain ':'
                } else if (left.length === 1) {
                    username = left[0];
                }
                if (right.length >= 2) {
                    host = right[0];
                    port = right[1];
                }
            }
        }
    }
    // Format with colons only (no @)
    else {
        const parts = line.split(':');
        
        if (parts.length === 2) {
            // host:port
            [host, port] = parts;
        } else if (parts.length === 4) {
            // Could be host:port:user:pass OR user:pass:host:port
            const [p1, p2, p3, p4] = parts;
            
            // Check if first part is IP/hostname and second is port
            if ((isIP(p1) || isHostname(p1)) && isPort(p2)) {
                // host:port:user:pass
                host = p1;
                port = p2;
                username = p3;
                password = p4;
            }
            // Check if third part is IP/hostname and fourth is port
            else if ((isIP(p3) || isHostname(p3)) && isPort(p4)) {
                // user:pass:host:port
                username = p1;
                password = p2;
                host = p3;
                port = p4;
            }
            // Default: assume host:port:user:pass
            else {
                host = p1;
                port = p2;
                username = p3;
                password = p4;
            }
        } else if (parts.length === 3) {
            // host:port:user (no password)
            if ((isIP(parts[0]) || isHostname(parts[0])) && isPort(parts[1])) {
                host = parts[0];
                port = parts[1];
                username = parts[2];
            }
        } else if (parts.length > 4) {
            // Password might contain colons: host:port:user:pass:with:colons
            const [p1, p2, p3, ...rest] = parts;
            if ((isIP(p1) || isHostname(p1)) && isPort(p2)) {
                host = p1;
                port = p2;
                username = p3;
                password = rest.join(':');
            }
        }
    }

    // Validate required fields
    if (!host || !port) return null;
    if (!isPort(port)) return null;

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

/**
 * Check if proxy host is a static IP (not rotating/residential)
 * Static IPs are typically datacenter IPs without rotation keywords
 * 
 * @param {string} proxyStr - Proxy string to check
 * @returns {boolean} - True if proxy appears to be static
 */
export function isStaticProxy(proxyStr) {
    if (!proxyStr?.trim()) return false;
    
    const line = proxyStr.toLowerCase();
    
    // Keywords that indicate rotating/residential proxies
    const rotatingKeywords = [
        'rotating', 'rotate', 'residential', 'mobile', 'isp',
        'backconnect', 'gateway', 'pool', 'random', 'session',
        'sticky', 'country-', 'state-', 'city-', 'geo',
        'smartproxy', 'brightdata', 'oxylabs', 'luminati',
        'webshare', 'proxy-cheap', 'soax', 'geosurf'
    ];
    
    // Check if any rotating keywords are present
    const hasRotatingKeyword = rotatingKeywords.some(keyword => line.includes(keyword));
    
    if (hasRotatingKeyword) {
        return false; // It's a rotating proxy
    }
    
    // Parse the proxy to check the host
    const parsed = parseProxy(proxyStr);
    if (!parsed) return false;
    
    const host = parsed.host.toLowerCase();
    
    // Check if host is a raw IP address (likely static/datacenter)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(host)) {
        return true; // Raw IP is likely static
    }
    
    // Check for common datacenter/static proxy patterns
    const staticPatterns = [
        /^dc\d*\./, // dc1.proxy.com
        /^static/, // static.proxy.com
        /^dedicated/, // dedicated.proxy.com
        /^server\d*\./, // server1.proxy.com
        /^vps\d*\./, // vps1.proxy.com
        /^node\d*\./, // node1.proxy.com
    ];
    
    return staticPatterns.some(pattern => pattern.test(host));
}

/**
 * Check proxy connectivity and type
 * @param {string} proxyStr - Proxy string to check
 * @returns {Promise<{valid: boolean, isStatic: boolean, message: string, ip?: string}>}
 */
export async function checkProxy(proxyStr) {
    if (!proxyStr?.trim()) {
        return { valid: false, isStatic: false, message: 'No proxy provided' };
    }
    
    const parsed = parseProxy(proxyStr);
    if (!parsed) {
        return { valid: false, isStatic: false, message: 'Invalid proxy format' };
    }
    
    // Check if it appears to be static based on the string
    const appearsStatic = isStaticProxy(proxyStr);
    
    try {
        const response = await fetch('/api/stripe-own/check-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proxy: parsed })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return {
                valid: true,
                isStatic: appearsStatic || data.isStatic,
                message: data.message || 'Proxy is working',
                ip: data.ip
            };
        } else {
            return {
                valid: false,
                isStatic: appearsStatic,
                message: data.message || 'Proxy check failed'
            };
        }
    } catch (err) {
        return {
            valid: false,
            isStatic: appearsStatic,
            message: `Connection error: ${err.message}`
        };
    }
}
