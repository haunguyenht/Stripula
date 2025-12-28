import { HealthMetrics } from '../domain/HealthMetrics.js';

/**
 * Failure Classifier Utility
 * 
 * Classifies errors into categories for accurate health metrics tracking.
 * 
 * Requirements:
 * - 6.2: WHEN a proxy connection fails, THE System SHALL record it as proxy_error
 * - 6.3: WHEN a gateway returns an HTTP error (5xx), THE System SHALL record it as gateway_error
 * - 6.4: WHEN a request times out, THE System SHALL record it as timeout
 * - 6.5: WHEN a network connection fails, THE System SHALL record it as network_error
 */

const { FAILURE_CATEGORIES } = HealthMetrics;

/**
 * Classify an error into a failure category
 * 
 * @param {Error|Object|string} error - The error to classify
 * @returns {string} One of: proxy_error, gateway_error, timeout, network_error
 */
export function classifyFailure(error) {
    if (!error) {
        return FAILURE_CATEGORIES.NETWORK_ERROR;
    }

    // Handle string errors
    const message = typeof error === 'string' 
        ? error.toLowerCase() 
        : (error.message || '').toLowerCase();
    
    const code = error.code || '';
    const statusCode = error.response?.status || error.statusCode || error.status || 0;

    // 1. Check for timeout errors (Requirement 6.4)
    if (isTimeoutError(message, code)) {
        return FAILURE_CATEGORIES.TIMEOUT;
    }

    // 2. Check for proxy errors (Requirement 6.2)
    if (isProxyError(message, code, statusCode)) {
        return FAILURE_CATEGORIES.PROXY_ERROR;
    }

    // 3. Check for gateway errors - HTTP 5xx (Requirement 6.3)
    if (isGatewayError(statusCode)) {
        return FAILURE_CATEGORIES.GATEWAY_ERROR;
    }

    // 4. Check for network errors (Requirement 6.5)
    if (isNetworkError(message, code)) {
        return FAILURE_CATEGORIES.NETWORK_ERROR;
    }

    // Default to network_error for unclassified errors
    return FAILURE_CATEGORIES.NETWORK_ERROR;
}

/**
 * Check if error is a timeout error
 * @param {string} message - Error message (lowercase)
 * @param {string} code - Error code
 * @returns {boolean}
 */
function isTimeoutError(message, code) {
    const timeoutCodes = ['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ETIME'];
    const timeoutPatterns = ['timeout', 'timed out', 'timedout'];
    
    if (timeoutCodes.includes(code)) {
        return true;
    }
    
    return timeoutPatterns.some(pattern => message.includes(pattern));
}

/**
 * Check if error is a proxy error
 * @param {string} message - Error message (lowercase)
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @returns {boolean}
 */
function isProxyError(message, code, statusCode) {
    // HTTP 407 Proxy Authentication Required
    if (statusCode === 407) {
        return true;
    }
    
    const proxyPatterns = [
        'proxy',
        '407',
        'proxy authentication',
        'proxy auth',
        'tunnel connection failed',
        'unable to connect to proxy',
        'proxy connection',
        'socks'
    ];
    
    const proxyCodes = ['EPROXY', 'EPROXYAUTH'];
    
    if (proxyCodes.includes(code)) {
        return true;
    }
    
    return proxyPatterns.some(pattern => message.includes(pattern));
}

/**
 * Check if error is a gateway error (HTTP 5xx)
 * @param {number} statusCode - HTTP status code
 * @returns {boolean}
 */
function isGatewayError(statusCode) {
    return statusCode >= 500 && statusCode < 600;
}

/**
 * Check if error is a network error
 * @param {string} message - Error message (lowercase)
 * @param {string} code - Error code
 * @returns {boolean}
 */
function isNetworkError(message, code) {
    const networkCodes = [
        'ECONNREFUSED',
        'ENOTFOUND',
        'ENETUNREACH',
        'EHOSTUNREACH',
        'ECONNRESET',
        'EPIPE',
        'ECONNABORTED',
        'EAI_AGAIN',
        'ENETDOWN',
        'EHOSTDOWN'
    ];
    
    const networkPatterns = [
        'connection refused',
        'dns resolution failed',
        'network unreachable',
        'host unreachable',
        'connection reset',
        'socket hang up',
        'network error',
        'enotfound',
        'getaddrinfo',
        'no route to host'
    ];
    
    if (networkCodes.includes(code)) {
        return true;
    }
    
    return networkPatterns.some(pattern => message.includes(pattern));
}

export default classifyFailure;
