/**
 * Security Middleware
 * Validates requests and blocks potential security threats
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7
 * - Block path traversal patterns
 * - Block sensitive file extensions
 * - Block SQL injection patterns
 * - Block XSS attack patterns
 * - Log security events
 * - Do not reveal specific security rules in error responses
 */

// Default blocked patterns for various attack types
const DEFAULT_BLOCKED_PATTERNS = [
    // Path traversal patterns
    /\.\.\//,                    // ../
    /\.\.\\/,                    // ..\
    /%2e%2e/i,                   // URL encoded ..
    /%252e%252e/i,               // Double URL encoded ..
    /\.\.%2f/i,                  // Mixed encoding
    /\.\.%5c/i,                  // Mixed encoding backslash
];

const DEFAULT_XSS_PATTERNS = [
    /<script/i,                  // Script tags
    /javascript:/i,              // JavaScript protocol
    /on\w+\s*=/i,                // Event handlers (onclick=, onerror=, etc.)
    /data:\s*text\/html/i,       // Data URI with HTML
    /<iframe/i,                  // Iframe injection
    /<object/i,                  // Object tag injection
    /<embed/i,                   // Embed tag injection
    /expression\s*\(/i,          // CSS expression
    /vbscript:/i,                // VBScript protocol
];

const DEFAULT_SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/i,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,           // OR 1=1
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,          // AND 1=1
    /(\bOR\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/i,  // OR 'a'='a'
    /(--\s*$|#\s*$)/,                       // SQL comments at end
    /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/i,  // Stacked queries
    /'\s*(OR|AND)\s+/i,                     // Quote followed by OR/AND
    /WAITFOR\s+DELAY/i,                     // Time-based injection
    /BENCHMARK\s*\(/i,                      // MySQL benchmark
    /SLEEP\s*\(/i,                          // MySQL sleep
];

const DEFAULT_BLOCKED_EXTENSIONS = [
    '.env',
    '.git',
    '.gitignore',
    '.sql',
    '.log',
    '.bak',
    '.backup',
    '.config',
    '.htaccess',
    '.htpasswd',
    '.ini',
    '.sh',
    '.bash',
    '.bashrc',
    '.zshrc',
    '.npmrc',
    '.dockerignore',
    '.docker',
    '.yml',
    '.yaml',
    '.pem',
    '.key',
    '.crt',
    '.p12',
    '.pfx',
];

// Attack type constants
const ATTACK_TYPES = {
    PATH_TRAVERSAL: 'path_traversal',
    SENSITIVE_FILE: 'sensitive_file',
    SQL_INJECTION: 'sql_injection',
    XSS: 'xss',
};

export class SecurityMiddleware {
    constructor(options = {}) {
        this.blockedPatterns = options.blockedPatterns || DEFAULT_BLOCKED_PATTERNS;
        this.blockedExtensions = options.blockedExtensions || DEFAULT_BLOCKED_EXTENSIONS;
        this.xssPatterns = options.xssPatterns || DEFAULT_XSS_PATTERNS;
        this.sqlPatterns = options.sqlPatterns || DEFAULT_SQL_PATTERNS;
        this.supabase = options.supabase || null;
        this.enableLogging = options.enableLogging !== false;
    }

    /**
     * Main middleware function that protects against security threats
     * Returns 403 with generic message for any detected attack
     * 
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.7
     */
    protect() {
        return async (req, res, next) => {
            const path = req.path || req.url || '';
            const query = req.query || {};
            const body = req.body || {};

            // Check for path traversal (Requirement 5.1)
            if (this._hasPathTraversal(path)) {
                await this._logSecurityEvent(req, ATTACK_TYPES.PATH_TRAVERSAL);
                return this._sendForbidden(res);
            }

            // Check for sensitive file extensions (Requirement 5.2)
            if (this._hasSensitiveExtension(path)) {
                await this._logSecurityEvent(req, ATTACK_TYPES.SENSITIVE_FILE);
                return this._sendForbidden(res);
            }

            // Check for SQL injection in query params and body (Requirement 5.3)
            if (this._hasSQLInjection(query) || this._hasSQLInjection(body)) {
                await this._logSecurityEvent(req, ATTACK_TYPES.SQL_INJECTION);
                return this._sendForbidden(res);
            }

            // Check for XSS patterns in query params and body (Requirement 5.4)
            if (this._hasXSSPattern(query) || this._hasXSSPattern(body)) {
                await this._logSecurityEvent(req, ATTACK_TYPES.XSS);
                return this._sendForbidden(res);
            }

            next();
        };
    }

    /**
     * Check if path contains path traversal patterns
     * Requirement 5.1: Block ../, ..\, and URL encoded variants
     * 
     * @param {string} path - Request path to check
     * @returns {boolean} True if path traversal detected
     */
    _hasPathTraversal(path) {
        if (!path || typeof path !== 'string') return false;

        // Decode URL to catch encoded attacks
        let decodedPath;
        try {
            decodedPath = decodeURIComponent(path);
            // Double decode to catch double-encoded attacks
            decodedPath = decodeURIComponent(decodedPath);
        } catch {
            // If decoding fails, use original path
            decodedPath = path;
        }

        // Check against blocked patterns
        for (const pattern of this.blockedPatterns) {
            if (pattern.test(path) || pattern.test(decodedPath)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if path attempts to access sensitive file extensions
     * Requirement 5.2: Block .env, .git, .sql, .log, .bak, etc.
     * 
     * @param {string} path - Request path to check
     * @returns {boolean} True if sensitive extension detected
     */
    _hasSensitiveExtension(path) {
        if (!path || typeof path !== 'string') return false;

        // Normalize path to lowercase for comparison
        const normalizedPath = path.toLowerCase();

        // Check if path ends with or contains sensitive extensions
        for (const ext of this.blockedExtensions) {
            // Check if path ends with extension
            if (normalizedPath.endsWith(ext)) {
                return true;
            }
            // Check if path contains extension followed by / or end
            // This catches paths like /.git/config
            if (normalizedPath.includes(ext + '/') || normalizedPath.includes(ext + '\\')) {
                return true;
            }
            // Check for exact match in path segments
            const segments = normalizedPath.split(/[/\\]/);
            if (segments.some(seg => seg === ext.substring(1) || seg === ext)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if params contain SQL injection patterns
     * Requirement 5.3: Block SQL injection attempts
     * 
     * @param {object} params - Query params or body to check
     * @returns {boolean} True if SQL injection detected
     */
    _hasSQLInjection(params) {
        if (!params || typeof params !== 'object') return false;

        const values = this._extractValues(params);

        for (const value of values) {
            if (typeof value !== 'string') continue;

            for (const pattern of this.sqlPatterns) {
                if (pattern.test(value)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if params contain XSS attack patterns
     * Requirement 5.4: Block XSS attempts
     * 
     * @param {object} params - Query params or body to check
     * @returns {boolean} True if XSS pattern detected
     */
    _hasXSSPattern(params) {
        if (!params || typeof params !== 'object') return false;

        const values = this._extractValues(params);

        for (const value of values) {
            if (typeof value !== 'string') continue;

            // Decode HTML entities and URL encoding
            let decodedValue;
            try {
                decodedValue = decodeURIComponent(value);
            } catch {
                decodedValue = value;
            }

            for (const pattern of this.xssPatterns) {
                if (pattern.test(value) || pattern.test(decodedValue)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Extract all string values from an object recursively
     * @private
     * @param {object} obj - Object to extract values from
     * @param {number} depth - Current recursion depth
     * @returns {string[]} Array of string values
     */
    _extractValues(obj, depth = 0) {
        // Prevent infinite recursion
        if (depth > 5) return [];

        const values = [];

        if (typeof obj === 'string') {
            values.push(obj);
        } else if (Array.isArray(obj)) {
            for (const item of obj) {
                values.push(...this._extractValues(item, depth + 1));
            }
        } else if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                // Also check keys for injection
                if (typeof key === 'string') {
                    values.push(key);
                }
                values.push(...this._extractValues(obj[key], depth + 1));
            }
        }

        return values;
    }

    /**
     * Log security event to database
     * Requirement 5.6: Log blocked requests with IP, path, and attack type
     * 
     * @param {object} req - Express request object
     * @param {string} attackType - Type of attack detected
     */
    async _logSecurityEvent(req, attackType) {
        if (!this.enableLogging) return;

        const ip = this._getClientIP(req);
        const path = req.originalUrl || req.url || req.path || '';
        const userAgent = req.headers['user-agent'] || '';

        // Prepare headers for logging (exclude sensitive headers)
        const safeHeaders = { ...req.headers };
        delete safeHeaders.cookie;
        delete safeHeaders.authorization;

        try {
            if (this.supabase) {
                await this.supabase
                    .from('security_logs')
                    .insert({
                        ip_address: ip,
                        path: path.substring(0, 2000), // Limit path length
                        attack_type: attackType,
                        user_agent: userAgent.substring(0, 500), // Limit user agent length
                        request_headers: safeHeaders,
                    });
            }
        } catch (error) {
            // Log error but don't fail the request
            console.error('[SecurityMiddleware] Failed to log security event:', error.message);
        }
    }

    /**
     * Get client IP address from request
     * Handles proxies and load balancers
     * @private
     */
    _getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.ip ||
               'unknown';
    }

    /**
     * Send 403 Forbidden response with generic message
     * Requirement 5.7: Do not reveal specific security rules
     * 
     * @param {object} res - Express response object
     */
    _sendForbidden(res) {
        return res.status(403).json({
            status: 'ERROR',
            code: 'FORBIDDEN',
            message: 'Access denied'
        });
    }
}

// Export constants for testing
export { 
    DEFAULT_BLOCKED_PATTERNS, 
    DEFAULT_BLOCKED_EXTENSIONS,
    DEFAULT_XSS_PATTERNS,
    DEFAULT_SQL_PATTERNS,
    ATTACK_TYPES 
};

export default SecurityMiddleware;
