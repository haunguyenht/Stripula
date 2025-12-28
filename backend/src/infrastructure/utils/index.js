/**
 * Shared utilities for infrastructure layer
 * Consolidates sleep, delay, logging, and common utilities
 */

// ═══════════════════════════════════════════════════════════════════════════
// SLEEP & DELAY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random delay between min and max milliseconds
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {Promise<void>}
 */
export async function randomDelay(min, max) {
    const delay = min + Math.floor(Math.random() * (max - min));
    await sleep(delay);
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING UTILITIES WITH THROTTLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log level enum
 */
export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

/**
 * Current log level (can be configured)
 * Default to INFO to reduce hot-path noise
 */
let currentLogLevel = LogLevel.INFO;

/**
 * Set the log level
 * @param {number} level - LogLevel value
 */
export function setLogLevel(level) {
    currentLogLevel = level;
}

/**
 * Get the current log level
 * @returns {number}
 */
export function getLogLevel() {
    return currentLogLevel;
}

/**
 * Throttle map for log deduplication
 * @type {Map<string, {count: number, lastTime: number}>}
 */
const throttleMap = new Map();

/**
 * Throttle interval in ms (default: 5 seconds)
 */
const THROTTLE_INTERVAL = 5000;

/**
 * Create a throttled logger that batches repeated messages
 * @param {string} prefix - Log prefix (e.g., '[Retry]')
 * @returns {Object} Logger with debug, info, warn, error methods
 */
export function createThrottledLogger(prefix) {
    const log = (level, levelName, ...args) => {
        if (level < currentLogLevel) return;
        
        const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        const key = `${prefix}:${levelName}:${message}`;
        const now = Date.now();
        
        const existing = throttleMap.get(key);
        if (existing && now - existing.lastTime < THROTTLE_INTERVAL) {
            existing.count++;
            return;
        }
        
        // Flush previous count if exists
        if (existing && existing.count > 1) {
            console[levelName === 'debug' ? 'log' : levelName](
                `${prefix} (repeated ${existing.count}x) ${message}`
            );
        } else {
            const logFn = levelName === 'debug' ? console.log : console[levelName];
            logFn(`${prefix} ${message}`);
        }
        
        throttleMap.set(key, { count: 1, lastTime: now });
    };
    
    return {
        debug: (...args) => log(LogLevel.DEBUG, 'debug', ...args),
        info: (...args) => log(LogLevel.INFO, 'log', ...args),
        warn: (...args) => log(LogLevel.WARN, 'warn', ...args),
        error: (...args) => log(LogLevel.ERROR, 'error', ...args),
        // Direct log (never throttled)
        direct: (...args) => console.log(`${prefix}`, ...args)
    };
}

/**
 * Clear throttle map (for testing or reset)
 */
export function clearThrottleMap() {
    throttleMap.clear();
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate random hex string
 * @param {number} length - Length of hex string
 * @returns {string}
 */
export function generateHex(length) {
    const chars = '0123456789abcdef';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * 16)]).join('');
}

/**
 * Get random element from array
 * @param {T[]} arr - Array to pick from
 * @returns {T}
 * @template T
 */
export function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Mask sensitive string
 * @param {string} str - String to mask
 * @param {number} showStart - Characters to show at start
 * @param {number} showEnd - Characters to show at end
 * @returns {string}
 */
export function maskString(str, showStart = 4, showEnd = 4) {
    if (!str || str.length <= showStart + showEnd) return str;
    return `${str.slice(0, showStart)}...${str.slice(-showEnd)}`;
}
