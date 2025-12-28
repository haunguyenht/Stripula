import { BROWSER_USER_AGENTS, API_USER_AGENTS, VIEWPORTS, STATE_ABBREV } from './constants.js';
import { fingerprintGenerator } from './FingerprintGenerator.js';

/**
 * Get random element from array
 * @param {Array} arr - Array to pick from
 * @returns {*} Random element
 */
export function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get random browser user agent
 * @returns {string}
 */
export function getRandomBrowserUserAgent() {
    return getRandomElement(BROWSER_USER_AGENTS);
}

/**
 * Get random API user agent
 * @returns {string}
 */
export function getRandomAPIUserAgent() {
    return getRandomElement(API_USER_AGENTS);
}

/**
 * Get random viewport
 * @returns {{width: number, height: number}}
 */
export function getRandomViewport() {
    return getRandomElement(VIEWPORTS);
}

/**
 * Generate random charge amount between min and max (in cents)
 * @param {number} minCents - Minimum amount in cents (default: 50)
 * @param {number} maxCents - Maximum amount in cents (default: 5000)
 * @returns {number} Amount in cents
 */
export function getRandomChargeAmount(minCents = 50, maxCents = 5000) {
    return Math.floor(Math.random() * (maxCents - minCents + 1)) + minCents;
}

/**
 * Generate Stripe tracking IDs (guid, muid, sid)
 * Uses standard UUID v4 format from FingerprintGenerator
 * @returns {{guid: string, muid: string, sid: string}}
 * @deprecated Use fingerprintGenerator.generateStripeIds() directly
 */
export function generateStripeIds() {
    return fingerprintGenerator.generateStripeIds();
}

/**
 * Format currency amount
 * @param {number} amountCents - Amount in cents
 * @param {string} currency - Currency code
 * @returns {string}
 */
export function formatCurrency(amountCents, currency = 'USD') {
    const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$' };
    const symbol = symbols[currency.toUpperCase()] || currency;
    return `${symbol}${(amountCents / 100).toFixed(2)}`;
}

/**
 * Get state abbreviation from full name
 * @param {string} stateName - Full state name
 * @returns {string} Abbreviation or original if not found
 */
export function getStateAbbrev(stateName) {
    return STATE_ABBREV[stateName?.toLowerCase()] || stateName || 'NY';
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a masked version of a string
 * @param {string} str - String to mask
 * @param {number} showStart - Characters to show at start
 * @param {number} showEnd - Characters to show at end
 * @returns {string}
 */
export function maskString(str, showStart = 4, showEnd = 4) {
    if (!str || str.length <= showStart + showEnd) return str;
    return `${str.slice(0, showStart)}...${str.slice(-showEnd)}`;
}

/**
 * Generate random time on page value (for Stripe fingerprinting)
 * @returns {number}
 */
export function getRandomTimeOnPage() {
    return Math.floor(Math.random() * 200000) + 50000;
}
