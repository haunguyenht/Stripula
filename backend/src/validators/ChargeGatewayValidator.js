import { ChargeResult } from '../domain/ChargeResult.js';
import { RememberOrgClient } from '../infrastructure/charge/RememberOrgClient.js';
import { IRUSAClient } from '../infrastructure/charge/IRUSAClient.js';
import { NMDPClient } from '../infrastructure/charge/NMDPClient.js';
import { DEFAULT_CHARGE_SITE } from '../utils/constants.js';
import { GatewayMessageFormatter } from '../utils/GatewayMessageFormatter.js';

// Network/system error patterns - these should be ERROR status, not DECLINED
const NETWORK_ERROR_PATTERNS = [
    'timeout', 'etimedout', 'econnreset', 'econnrefused', 'enotfound',
    'socket hang up', 'socket closed', 'network error', 'connection_error',
    'epipe', 'ehostunreach', 'enetunreach', 'proxy', 'http_5', 'http_4',
    'exception_', 'fetch_error', 'service unavailable', 'cloudflare',
    'rate_limit', 'rate limit', 'too_soon', 'retry_exhausted'
];

/**
 * Check if error message indicates a network/system error (not a card decline)
 */
function isNetworkError(errorMsg) {
    if (!errorMsg) return false;
    const lower = errorMsg.toLowerCase();
    return NETWORK_ERROR_PATTERNS.some(pattern => lower.includes(pattern));
}

/**
 * Charge Gateway Validator
 * Validates cards via donation site charge flow
 * Supports multiple gateway types:
 * - remember-org: Remember.org (WordPress Charitable + Stripe)
 * - irusa-classy: Islamic Relief USA (Classy.org + Stripe)
 * - nmdp-classy: NMDP (Classy.org + Stripe)
 */
export class ChargeGatewayValidator {
    constructor(options = {}) {
        this.site = options.site || DEFAULT_CHARGE_SITE;
        this.proxyManager = options.proxyManager || null;
        this.maxRetries = options.maxRetries || 1;
        this.debug = true; // Enable debug logging for troubleshooting
        this.initClient();
    }

    _log(message, data = null) {
        if (!this.debug) return;
        const timestamp = new Date().toISOString().slice(11, 23);
        const prefix = `[ChargeGatewayValidator]`;
        if (data) {
            console.log(`${timestamp} ${prefix} ${message}`, JSON.stringify(data, null, 2));
        } else {
            console.log(`${timestamp} ${prefix} ${message}`);
        }
    }

    initClient() {
        this._log(`Initializing client for site: ${this.site?.label} (type: ${this.site?.type})`);
        
        // Route to appropriate client based on site type
        if (this.site?.type === 'irusa-classy') {
            // IRUSA/Classy.org client - uses different flow
            this.siteClient = new IRUSAClient(this.site, {
                proxyManager: this.proxyManager, // Pass proxyManager directly
                debug: true // Enable debug logging for troubleshooting
            });
        } else if (this.site?.type === 'nmdp-classy') {
            // NMDP/Classy.org client - similar to IRUSA
            this.siteClient = new NMDPClient(this.site, {
                proxyManager: this.proxyManager, // Pass proxyManager directly
                debug: true // Enable debug logging for troubleshooting
            });
        } else {
            // Default: Remember.org client (WordPress Charitable)
            this.siteClient = new RememberOrgClient(this.site, {
                proxyManager: this.proxyManager,
                debug: this.debug
            });
        }
    }

    getName() {
        return `ChargeGatewayValidator (${this.site.label})`;
    }

    setSite(site) {
        this.site = site;
        this.initClient();
    }

    async validate(cardInfo) {
        const startTime = Date.now();
        const fullCard = `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;
        const cardPreview = `${cardInfo.number?.slice(0, 6)}****`;

        this._log(`Starting validation for ${cardPreview}`);

        let lastError = null;
        let lastIsNetworkError = false;

        for (let retry = 0; retry <= this.maxRetries; retry++) {
            this._log(`Attempt ${retry + 1}/${this.maxRetries + 1}`);
            try {
                const result = await this.attemptValidation(cardInfo, fullCard, startTime);

                // Return immediately for approved/declined/3DS (definitive results)
                // 3DS_REQUIRED means card is LIVE (valid but needs authentication)
                if (result.isApproved() || result.isDeclined() || result.is3DS()) {
                    this._log(`Definitive result: ${result.status}`, { duration: Date.now() - startTime });
                    return result;
                }

                // For errors, track if it's a network error for retry logic
                lastError = result.message;
                lastIsNetworkError = result.isNetworkError || false;
                this._log(`Non-definitive result, may retry`, { error: lastError, isNetworkError: lastIsNetworkError });
            } catch (error) {
                lastError = error.message;
                lastIsNetworkError = true;
                this._log(`Exception caught`, { error: lastError });
            }

            if (retry < this.maxRetries) {
                this._log(`Waiting 1s before retry...`);
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        this._log(`RETRY_EXHAUSTED after ${this.maxRetries + 1} attempts`, { lastError });
        return ChargeResult.error(`RETRY_EXHAUSTED: ${lastError}`, {
            card: fullCard,
            site: this.site.label,
            duration: Date.now() - startTime
        });
    }

    async attemptValidation(cardInfo, fullCard, startTime) {
        this._log(`attemptValidation: Calling siteClient.validate()`);
        const result = await this.siteClient.validate(cardInfo);
        this._log(`attemptValidation: siteClient returned`, { success: result.success, approved: result.approved, status: result.status, message: result.message, isNetworkError: result.isNetworkError });

        // Handle IRUSAClient and NMDPClient response format (status-based)
        // Both Classy.org clients use the same response format
        if (this.site?.type === 'irusa-classy' || this.site?.type === 'nmdp-classy') {
            return this._handleClassyResponse(result, fullCard, startTime);
        }

        // Handle RememberOrgClient response format (success/approved-based)
        return this._handleRememberOrgResponse(result, fullCard, startTime);
    }

    /**
     * Handle Classy.org client response format (IRUSAClient, NMDPClient)
     * Returns: { status: 'Approved'|'Live'|'Declined'|'Errors', code, message, brand, country }
     */
    _handleClassyResponse(result, fullCard, startTime) {
        const status = result.status?.toLowerCase();
        const chargeAmount = this.site?.chargeAmount || null;
        const errorMessage = result.message || result.error || '';

        // Handle error status
        if (status === 'errors') {
            return ChargeResult.error(errorMessage || 'Unknown error', {
                card: fullCard,
                site: this.site.label,
                duration: Date.now() - startTime,
                declineCode: result.code,
                chargeAmount
            });
        }

        // Map IRUSA status to our standard status
        let mappedStatus;
        let declineCode = null;

        if (status === 'approved') {
            mappedStatus = 'APPROVED';
        } else if (status === 'live') {
            // IRUSA 'Live' means card is valid but can't charge (3DS, AVS fail, etc.)
            mappedStatus = '3DS_REQUIRED';
            declineCode = result.code;
        } else {
            // 'declined' or any other status
            // Check if this is actually a network/system error
            if (result.isNetworkError || isNetworkError(errorMessage) || isNetworkError(result.code)) {
                return ChargeResult.error(errorMessage || result.code || 'Network error', {
                    card: fullCard,
                    site: this.site.label,
                    duration: Date.now() - startTime,
                    declineCode: result.code,
                    chargeAmount
                });
            }
            mappedStatus = 'DECLINED';
            declineCode = result.code;
        }

        // Ensure we have a message - use code as fallback
        const rawMessage = result.message || result.code || 'Card declined';

        // Get formatted message
        const formatted = GatewayMessageFormatter.formatResponse({
            status: mappedStatus,
            message: rawMessage,
            declineCode,
            gateway: 'charge'
        });

        return new ChargeResult({
            status: mappedStatus,
            message: formatted.formattedMessage || rawMessage,
            success: mappedStatus === 'APPROVED' || mappedStatus === '3DS_REQUIRED',
            card: fullCard,
            brand: result.brand,
            country: result.country,
            last4: result.card?.slice(-4),
            site: this.site.label,
            duration: Date.now() - startTime,
            donationId: result.transactionId,
            declineCode,
            chargeAmount
        });
    }

    /**
     * Handle RememberOrgClient response format
     * RememberOrgClient returns: { success, approved, status, message, brand, country, donationId }
     */
    _handleRememberOrgResponse(result, fullCard, startTime) {
        const chargeAmount = this.site?.chargeAmount || null;

        // Network/proxy errors - return as ERROR status
        if (!result.success) {
            if (result.isNetworkError) {
                this._log(`attemptValidation: Network error detected`);
                return ChargeResult.error(result.error || result.code || 'Network error', {
                    card: fullCard,
                    site: this.site.label,
                    duration: Date.now() - startTime,
                    declineCode: result.code,
                    chargeAmount
                });
            }
            // Non-network errors (shouldn't happen, but handle gracefully)
            this._log(`attemptValidation: Non-network error`);
            const parsed = GatewayMessageFormatter.parseDeclineFromText(result.error);
            return ChargeResult.error(parsed.message, {
                card: fullCard,
                site: this.site.label,
                duration: Date.now() - startTime,
                declineCode: parsed.code,
                chargeAmount
            });
        }

        // Determine status: 3DS_REQUIRED is treated as LIVE
        let status;
        let declineCode = null;

        if (result.status === '3DS_REQUIRED') {
            status = '3DS_REQUIRED';
        } else if (result.approved) {
            status = 'APPROVED';
        } else {
            status = 'DECLINED';
            // Parse the decline message to get standardized code
            const parsed = GatewayMessageFormatter.parseDeclineFromText(result.message);
            declineCode = parsed.code;
        }

        // Get formatted message
        const formatted = GatewayMessageFormatter.formatResponse({
            status,
            message: result.message,
            declineCode,
            gateway: 'charge'
        });

        return new ChargeResult({
            status,
            message: formatted.formattedMessage,
            success: result.approved || result.status === '3DS_REQUIRED',
            card: fullCard,
            brand: result.brand,
            country: result.country,
            last4: result.last4,
            site: this.site.label,
            duration: Date.now() - startTime,
            donationId: result.donationId,
            declineCode,
            chargeAmount
        });
    }

    parseCard(cardLine) {
        if (!cardLine || typeof cardLine !== 'string') return null;
        const parts = cardLine.split('|');
        if (parts.length !== 4) return null;

        let [number, expMonth, expYear, cvc] = parts.map(p => (p || '').trim());
        number = number.replace(/\s/g, '');

        if (number.length < 13) return null;

        expYear = expYear.length === 4 ? expYear.slice(-2) : expYear;
        expMonth = expMonth.padStart(2, '0');

        return { number, expMonth, expYear, cvc };
    }
}
