import { ChargeResult } from '../domain/ChargeResult.js';
import { QgivClient } from '../infrastructure/charge/QgivClient.js';
import { DEFAULT_CHARGE_AVS_SITE } from '../utils/constants.js';
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
 * Charge AVS Validator
 * Validates cards via Qgiv donation platform with AVS (Address Verification)
 * Requires card format: number|mm|yy|cvv|zip
 */
export class ChargeAVSValidator {
    constructor(options = {}) {
        this.site = options.site || DEFAULT_CHARGE_AVS_SITE;
        this.proxyManager = options.proxyManager || null;
        this.maxRetries = options.maxRetries || 1;
        this.debug = true; // Enable debug logging for troubleshooting
        this.initClient();
    }

    _log(message, data = null) {
        if (!this.debug) return;
        const timestamp = new Date().toISOString().slice(11, 23);
        const prefix = `[ChargeAVSValidator]`;
        if (data) {
            console.log(`${timestamp} ${prefix} ${message}`, JSON.stringify(data, null, 2));
        } else {
            console.log(`${timestamp} ${prefix} ${message}`);
        }
    }

    initClient() {
        this._log(`Initializing client for site: ${this.site?.label} (type: ${this.site?.type})`);
        this._log(`ProxyManager available: ${!!this.proxyManager}`);
        
        // Qgiv client for AVS validation
        this.siteClient = new QgivClient(this.site, {
            proxyManager: this.proxyManager,
            debug: true
        });
    }

    getName() {
        return `ChargeAVSValidator (${this.site.label})`;
    }

    setSite(site) {
        this.site = site;
        this.initClient();
    }

    async validate(cardInfo) {
        const startTime = Date.now();
        // Include zip in full card format for AVS
        const fullCard = cardInfo.zip 
            ? `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}|${cardInfo.zip}`
            : `${cardInfo.number}|${cardInfo.expMonth}|${cardInfo.expYear}|${cardInfo.cvc}`;
        const cardPreview = `${cardInfo.number?.slice(0, 6)}****`;

        this._log(`Starting validation for ${cardPreview}`, { hasZip: !!cardInfo.zip });

        let lastError = null;

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

                lastError = result.message;
                this._log(`Non-definitive result, may retry`, { error: lastError });
            } catch (error) {
                lastError = error.message;
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
        
        // Pass zip to the client for AVS validation
        const result = await this.siteClient.validate({
            ...cardInfo,
            billingZip: cardInfo.zip
        });
        
        this._log(`attemptValidation: siteClient returned`, { 
            status: result.status, 
            code: result.code,
            message: result.message 
        });

        return this._handleQgivResponse(result, fullCard, startTime);
    }

    /**
     * Handle QgivClient response format
     * QgivClient returns: { status: 'Approved'|'Live'|'Declined'|'Errors', code, message }
     */
    _handleQgivResponse(result, fullCard, startTime) {
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

        // Map Qgiv status to our standard status
        let mappedStatus;
        let declineCode = null;

        if (status === 'approved') {
            mappedStatus = 'APPROVED';
        } else if (status === 'live') {
            // Qgiv 'Live' means card is valid but can't charge (3DS, AVS fail, etc.)
            mappedStatus = '3DS_REQUIRED';
            declineCode = result.code;
        } else {
            // 'declined' or any other status
            // Check if this is actually a network/system error
            if (isNetworkError(errorMessage) || isNetworkError(result.code)) {
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

        // Get formatted message
        const formatted = GatewayMessageFormatter.formatResponse({
            status: mappedStatus,
            message: result.message,
            declineCode,
            gateway: 'charge-avs'
        });

        return new ChargeResult({
            status: mappedStatus,
            message: formatted.formattedMessage,
            success: mappedStatus === 'APPROVED' || mappedStatus === '3DS_REQUIRED',
            card: fullCard,
            site: this.site.label,
            duration: Date.now() - startTime,
            donationId: result.transactionId,
            declineCode,
            chargeAmount
        });
    }

    parseCard(cardLine) {
        if (!cardLine || typeof cardLine !== 'string') return null;
        const parts = cardLine.split('|');
        // Support both 4-part (no zip) and 5-part (with zip) formats
        if (parts.length < 4) return null;

        let [number, expMonth, expYear, cvc, zip] = parts.map(p => (p || '').trim());
        number = number.replace(/\s/g, '');

        if (number.length < 13) return null;

        expYear = expYear.length === 4 ? expYear.slice(-2) : expYear;
        expMonth = expMonth.padStart(2, '0');

        const result = { number, expMonth, expYear, cvc };
        if (zip) {
            result.zip = zip;
        }
        return result;
    }
}
