import axios from 'axios';

/**
 * reCAPTCHA v2/v3 Invisible Bypass
 * Mimics the internal reCAPTCHA JavaScript flow to obtain tokens
 */
export class RecaptchaBypass {
    constructor() {
        this.timeout = 10000;
        this.version = 'gEr-ODersURoIfof1hiDm7R5'; // Current reCAPTCHA version
    }

    /**
     * Get reCAPTCHA v3 token for a site
     * reCAPTCHA v3 uses score-based validation with action parameter
     * @param {string} siteKey - The reCAPTCHA site key (6Le...)
     * @param {string} siteUrl - The website URL (https://example.com)
     * @param {string} action - The action name for v3 (default: 'submit')
     * @returns {Promise<{success: boolean, token?: string, error?: string}>}
     */
    async getToken(siteKey, siteUrl, action = 'submit') {
        try {
            // Encode origin for co parameter (base64 of origin:443)
            const origin = new URL(siteUrl).origin + ':443';
            const coParam = Buffer.from(origin).toString('base64').replace(/=/g, '.');

            // For reCAPTCHA v3, we use api2/anchor with size=invisible
            // The key difference is we need to specify the action
            const anchorUrl = `https://www.google.com/recaptcha/api2/anchor?ar=1&k=${siteKey}&co=${coParam}&hl=en&v=${this.version}&size=invisible&cb=${this.generateCallback()}`;

            const anchorResponse = await axios.get(anchorUrl, {
                headers: this.getHeaders(),
                timeout: this.timeout
            });

            if (anchorResponse.status !== 200) {
                return { success: false, error: `Anchor request failed: ${anchorResponse.status}` };
            }

            // Extract recaptcha-token value
            const tokenMatch = anchorResponse.data.match(/value=\"([^\"]+)\"/);
            if (!tokenMatch) {
                return { success: false, error: 'Could not extract anchor token' };
            }

            const anchorToken = tokenMatch[1];

            // Step 2: Reload to get final token
            const reloadUrl = `https://www.google.com/recaptcha/api2/reload?k=${siteKey}`;

            const reloadData = new URLSearchParams({
                'v': this.version,
                'reason': 'q',
                'c': anchorToken,
                'k': siteKey,
                'co': coParam,
                'hl': 'en',
                'size': 'invisible',
                'chr': '[89,64,27]',
                'vh': this.generateVh(),
                'bg': this.generateBg(),
                'action': action // Add action for v3
            }).toString();

            const reloadResponse = await axios.post(reloadUrl, reloadData, {
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: this.timeout
            });

            if (reloadResponse.status !== 200) {
                return { success: false, error: `Reload request failed: ${reloadResponse.status}` };
            }

            // Extract rresp token
            const rrespMatch = reloadResponse.data.match(/rresp\",\"([^\"]+)\"/);
            if (!rrespMatch) {
                return { success: false, error: 'Could not extract rresp token' };
            }

            const finalToken = rrespMatch[1];

            return { success: true, token: finalToken };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get reCAPTCHA Enterprise token for a site
     * @param {string} siteKey - The reCAPTCHA Enterprise site key (6Le...)
     * @param {string} siteUrl - The website URL (https://example.com)
     * @returns {Promise<{success: boolean, token?: string, error?: string}>}
     */
    async getEnterpriseToken(siteKey, siteUrl) {
        try {
            // Encode origin for co parameter
            const origin = new URL(siteUrl).origin + ':443';
            const coParam = Buffer.from(origin).toString('base64').replace(/=/g, '.');

            // Step 1: Get anchor page from Enterprise endpoint
            const anchorUrl = `https://www.google.com/recaptcha/enterprise/anchor?ar=1&k=${siteKey}&co=${coParam}&hl=en&v=${this.version}&size=invisible&cb=${this.generateCallback()}`;

            const anchorResponse = await axios.get(anchorUrl, {
                headers: this.getHeaders(),
                timeout: this.timeout
            });

            if (anchorResponse.status !== 200) {
                return { success: false, error: `Enterprise anchor failed: ${anchorResponse.status}` };
            }

            // Extract recaptcha-token value
            const tokenMatch = anchorResponse.data.match(/value="([^"]+)"/);
            if (!tokenMatch) {
                return { success: false, error: 'Could not extract enterprise anchor token' };
            }

            const anchorToken = tokenMatch[1];

            // Step 2: Reload to get final token (Enterprise endpoint)
            const reloadUrl = `https://www.google.com/recaptcha/enterprise/reload?k=${siteKey}`;

            const reloadData = new URLSearchParams({
                'v': this.version,
                'reason': 'q',
                'c': anchorToken,
                'k': siteKey,
                'co': coParam,
                'hl': 'en',
                'size': 'invisible',
                'chr': '[89,64,27]',
                'vh': this.generateVh(),
                'bg': this.generateBg()
            }).toString();

            const reloadResponse = await axios.post(reloadUrl, reloadData, {
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: this.timeout
            });

            if (reloadResponse.status !== 200) {
                return { success: false, error: `Enterprise reload failed: ${reloadResponse.status}` };
            }

            // Extract rresp token
            const rrespMatch = reloadResponse.data.match(/rresp","([^"]+)"/);
            if (!rrespMatch) {
                return { success: false, error: 'Could not extract enterprise rresp token' };
            }

            const finalToken = rrespMatch[1];

            return { success: true, token: finalToken };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate random callback parameter
     */
    generateCallback() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate vh parameter (viewport hash)
     */
    generateVh() {
        return String(Math.floor(Math.random() * 999999999));
    }

    /**
     * Generate bg parameter (browser fingerprint) - simplified version
     */
    generateBg() {
        // This is a simplified bg parameter. Real one is more complex.
        // May need to be updated if Google detects and blocks
        return '!REKgQkcKAAQeE4AJbQEHnAgC';
    }

    /**
     * Get headers for requests
     */
    getHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        };
    }

    /**
     * Extract site key from HTML page
     */
    extractSiteKey(html) {
        // Try various patterns
        const patterns = [
            /data-sitekey="([^"]+)"/,
            /grecaptcha\.execute\(['"]([^'"]+)['"]/,
            /recaptcha\/api\.js\?render=([^"&]+)/,
            /'sitekey'\s*:\s*'([^']+)'/,
            /"sitekey"\s*:\s*"([^"]+)"/
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }
}

export const recaptchaBypass = new RecaptchaBypass();
