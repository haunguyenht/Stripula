/**
 * Proxy configuration entity
 */
export class Proxy {
    static TYPES = {
        HTTP: 'http',
        HTTPS: 'https',
        SOCKS4: 'socks4',
        SOCKS5: 'socks5'
    };

    constructor({ type = 'http', host, port, username = null, password = null, id = null }) {
        this.id = id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.type = type.toLowerCase();
        this.host = host;
        this.port = parseInt(port);
        this.username = username;
        this.password = password;
        this.status = 'untested';
        this.failCount = 0;
        this.successCount = 0;
        this.lastTested = null;
        this.enabled = true;
    }

    get hasAuth() {
        return !!(this.username && this.password);
    }

    get isSocks() {
        return this.type.includes('socks');
    }

    buildUrl() {
        let protocol = this.type;
        if (protocol === 'socks') protocol = 'socks5';
        
        if (this.hasAuth) {
            return `${protocol}://${encodeURIComponent(this.username)}:${encodeURIComponent(this.password)}@${this.host}:${this.port}`;
        }
        return `${protocol}://${this.host}:${this.port}`;
    }

    toString() {
        return `${this.type}://${this.host}:${this.port}`;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            host: this.host,
            port: this.port,
            username: this.username,
            password: this.password,
            status: this.status,
            failCount: this.failCount,
            successCount: this.successCount,
            lastTested: this.lastTested,
            enabled: this.enabled
        };
    }

    /**
     * Parse proxy from string (multiple formats supported)
     */
    static fromString(proxyStr) {
        if (!proxyStr?.trim()) return null;
        
        let line = proxyStr.trim();
        let type = 'http', host, port, username, password;

        // Extract protocol
        const protocolMatch = line.match(/^(https?|socks[45]?):\/\//i);
        if (protocolMatch) {
            type = protocolMatch[1].toLowerCase();
            if (type === 'socks') type = 'socks5';
            line = line.substring(protocolMatch[0].length);
        }

        // Parse auth and host:port
        if (line.includes('@')) {
            const [auth, hostPort] = line.split('@');
            const [user, pass] = auth.split(':');
            const [h, p] = hostPort.split(':');
            username = user;
            password = pass;
            host = h;
            port = p;
        } else if (line.split(':').length === 4) {
            const parts = line.split(':');
            host = parts[0];
            port = parts[1];
            username = parts[2];
            password = parts[3];
        } else if (line.split(':').length === 2) {
            [host, port] = line.split(':');
        }

        if (!host || !port) return null;

        return new Proxy({ type, host, port: parseInt(port), username, password });
    }
}
