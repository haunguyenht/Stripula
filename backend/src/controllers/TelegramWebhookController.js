/**
 * Telegram Webhook Controller
 * Handles Telegram webhook callbacks for inline button clicks (gateway health control)
 * 
 * Routes: POST /api/telegram/webhook
 * 
 * Requirements:
 * - 3.1: Validate callback data structure
 * - 3.2: Handle "Mark Offline" button click
 * - 3.3: Handle "Mark Degraded" button click
 * - 3.4: Handle "Dismiss" button click
 * - 3.5: Edit original message with confirmation
 * - 3.6: Broadcast status change via SSE
 * - 4.4: Validate admin user authorization
 * - 6.1: Expose POST /api/telegram/webhook endpoint
 * - 6.3: Handle callback_query updates for inline button clicks
 */
export class TelegramWebhookController {
    constructor(options = {}) {
        this.gatewayManager = options.gatewayManager;
        this.telegramBotService = options.telegramBotService;
        this.supabase = options.supabase;
    }

    /**
     * POST /api/telegram/webhook
     * Handle incoming Telegram webhook updates
     * 
     * Requirements: 6.1, 6.3
     * - Parse update from req.body
     * - Check for callback_query and route to _handleCallbackQuery
     * - Always return 200 OK to Telegram (prevents retries)
     * 
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async handleWebhook(req, res) {
        try {
            const update = req.body;

            // Handle callback query (inline button click)
            if (update.callback_query) {
                await this._handleCallbackQuery(update.callback_query);
            }

            // Always respond 200 to Telegram to prevent retries
            res.status(200).json({ ok: true });
        } catch (error) {
            console.error('[TelegramWebhook] Error:', error.message);
            // Still return 200 to prevent Telegram from retrying
            res.status(200).json({ ok: true });
        }
    }

    /**
     * Handle callback query from inline button click
     * 
     * Requirements: 3.1, 6.3
     * - Parse callback_data JSON
     * - Validate admin user via _isAdminUser
     * - Route to _handleSetHealth or _handleDismissAlert based on action
     * 
     * @private
     * @param {Object} callbackQuery - Telegram callback query object
     */
    async _handleCallbackQuery(callbackQuery) {
        const { id: callbackId, data, from, message } = callbackQuery;

        // Parse callback data (Requirement 3.1)
        let callbackData;
        try {
            callbackData = JSON.parse(data);
        } catch {
            await this.telegramBotService?.answerCallbackQuery(callbackId, '❌ Invalid action');
            return;
        }

        const { action, gateway_id, status } = callbackData;

        // Validate admin user (Requirement 4.4)
        const isAdmin = await this._isAdminUser(from.id);
        if (!isAdmin) {
            await this.telegramBotService?.answerCallbackQuery(callbackId, '❌ Admin access required');
            return;
        }

        // Route to appropriate handler based on action
        if (action === 'set_health') {
            await this._handleSetHealth(callbackId, gateway_id, status, from, message);
        } else if (action === 'dismiss_alert') {
            await this._handleDismissAlert(callbackId, gateway_id, from, message);
        } else {
            await this.telegramBotService?.answerCallbackQuery(callbackId, '❌ Unknown action');
        }
    }

    /**
     * Handle "Mark Offline" or "Mark Degraded" button click
     * 
     * Requirements: 3.2, 3.3, 3.5, 3.6
     * - Call gatewayManager.setManualHealthStatus()
     * - Answer callback query with success/error
     * - Edit original message with confirmation
     * 
     * @private
     * @param {string} callbackId - Telegram callback query ID
     * @param {string} gatewayId - Gateway ID to update
     * @param {string} status - New health status (online, degraded, offline)
     * @param {Object} from - Telegram user who clicked the button
     * @param {Object} message - Original message containing the button
     */
    async _handleSetHealth(callbackId, gatewayId, status, from, message) {
        try {
            // Update gateway health status (Requirements 3.2, 3.3, 3.6)
            const result = await this.gatewayManager.setManualHealthStatus(gatewayId, status, {
                adminId: from.id.toString(),
                reason: `Set via Telegram by @${from.username || from.first_name}`
            });

            // Answer callback query (acknowledge button click)
            await this.telegramBotService?.answerCallbackQuery(callbackId, `✅ Gateway marked ${status}`);

            // Edit original message to show confirmation (Requirement 3.5)
            const statusEmoji = { online: '🟢', degraded: '🟡', offline: '🔴' };
            const timestamp = new Date().toLocaleString('en-US', {
                timeZone: 'UTC',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            const confirmationMessage = `
✅ <b>Gateway Status Updated</b>
━━━━━━━━━━━━━━━━━━━━━━━

🔗 <b>Gateway:</b> <code>${gatewayId}</code>
📊 <b>Status:</b> ${statusEmoji[result.oldHealth] || '⚪'} ${result.oldHealth} → ${statusEmoji[status]} ${status.toUpperCase()}
👤 <b>Changed by:</b> @${from.username || from.first_name}
⏰ <b>Time:</b> ${timestamp} UTC
`.trim();

            await this.telegramBotService?.editMessageText(
                message.chat.id,
                message.message_id,
                confirmationMessage
            );
        } catch (error) {
            console.error(`[TelegramWebhook] Failed to set health status: ${error.message}`);
            await this.telegramBotService?.answerCallbackQuery(callbackId, `❌ Error: ${error.message}`);
        }
    }

    /**
     * Handle "Dismiss" button click
     * 
     * Requirements: 3.4
     * - Call gatewayManager.clearAlertState()
     * - Answer callback query
     * - Edit original message with dismissal confirmation
     * 
     * @private
     * @param {string} callbackId - Telegram callback query ID
     * @param {string} gatewayId - Gateway ID to dismiss alert for
     * @param {Object} from - Telegram user who clicked the button
     * @param {Object} message - Original message containing the button
     */
    async _handleDismissAlert(callbackId, gatewayId, from, message) {
        // Clear alert state without changing status (Requirement 3.4)
        this.gatewayManager?.clearAlertState(gatewayId);

        // Answer callback query
        await this.telegramBotService?.answerCallbackQuery(callbackId, '✅ Alert dismissed');

        // Edit original message with dismissal confirmation
        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: 'UTC',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const dismissMessage = `
📋 <b>Alert Dismissed</b>
━━━━━━━━━━━━━━━━━━━━━━━

🔗 <b>Gateway:</b> <code>${gatewayId}</code>
👤 <b>Dismissed by:</b> @${from.username || from.first_name}
⏰ <b>Time:</b> ${timestamp} UTC

<i>Gateway status unchanged. Monitoring continues.</i>
`.trim();

        await this.telegramBotService?.editMessageText(
            message.chat.id,
            message.message_id,
            dismissMessage
        );
    }

    /**
     * Check if a Telegram user is an admin
     * 
     * Requirement: 4.4
     * - Query users table for is_admin flag by telegram_id
     * - Return boolean
     * 
     * @private
     * @param {number|string} telegramId - Telegram user ID
     * @returns {Promise<boolean>} True if user is admin
     */
    async _isAdminUser(telegramId) {
        if (!this.supabase) {
            return false;
        }

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('is_admin')
                .eq('telegram_id', telegramId.toString())
                .single();

            return !error && data?.is_admin === true;
        } catch {
            return false;
        }
    }

    /**
     * Get route definitions for this controller
     * 
     * Requirement: 6.1
     * - Return array with POST /api/telegram/webhook route
     * 
     * @returns {Object} Route handlers
     */
    getRoutes() {
        return {
            handleWebhook: this.handleWebhook.bind(this)
        };
    }
}
