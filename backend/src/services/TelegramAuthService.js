import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabase, isSupabaseConfigured } from '../infrastructure/database/SupabaseClient.js';
import { STARTER_CREDITS, REFERRAL_CREDITS, MAX_REFERRALS } from './UserService.js';

/**
 * Telegram Auth Service
 * Handles Telegram SSO authentication and session management
 * 
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.3, 9.4, 9.5
 */
export class TelegramAuthService {
    constructor(options = {}) {
        this.botToken = options.botToken || process.env.TELEGRAM_BOT_TOKEN;
        this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET || this.botToken;
        this.sessionExpiry = options.sessionExpiry || '7d';
        this.authDataMaxAge = options.authDataMaxAge || 5 * 60; // 5 minutes in seconds
    }

    /**
     * Validate Telegram auth data hash using HMAC-SHA256
     * Algorithm:
     * 1. Sort fields alphabetically (excluding hash)
     * 2. Create data-check-string: "auth_date=X\nfirst_name=Y\nid=Z..."
     * 3. secret_key = SHA256(BOT_TOKEN)
     * 4. calculated_hash = HMAC_SHA256(data_check_string, secret_key)
     * 5. Compare calculated_hash with received hash
     * 
     * @param {Object} authData - Telegram auth data
     * @returns {Object} Validation result
     */
    validateAuthData(authData) {
        if (!this.botToken) {
            return { valid: false, error: 'Bot token not configured' };
        }

        if (!authData || !authData.hash || !authData.id || !authData.auth_date) {
            return { valid: false, error: 'Missing required auth data fields' };
        }

        // Check if auth_date is expired (older than 5 minutes)
        const authDate = parseInt(authData.auth_date, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (currentTime - authDate > this.authDataMaxAge) {
            return { valid: false, error: 'Authentication data expired' };
        }

        // Build data-check-string (sorted alphabetically, excluding hash)
        const { hash, ...dataWithoutHash } = authData;
        const dataCheckString = Object.keys(dataWithoutHash)
            .sort()
            .map(key => `${key}=${dataWithoutHash[key]}`)
            .join('\n');

        // Calculate secret key: SHA256(bot_token)
        const secretKey = crypto
            .createHash('sha256')
            .update(this.botToken)
            .digest();

        // Calculate hash: HMAC-SHA256(data_check_string, secret_key)
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        if (calculatedHash !== hash) {
            return { valid: false, error: 'Invalid authentication hash' };
        }

        return { valid: true };
    }


    /**
     * Authenticate user from Telegram data
     * Creates new user or updates existing user profile
     * Supports referral codes for new user registration
     * 
     * @param {Object} authData - Telegram auth data
     * @param {string} referralCode - Optional referral code for new users
     * @returns {Promise<Object>} Auth result with user data
     */
    async authenticateUser(authData, referralCode = null) {
        // Validate auth data first
        const validation = this.validateAuthData(authData);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Database not configured' };
        }

        const telegramId = parseInt(authData.id, 10);

        try {
            // Check if user exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('telegram_id', telegramId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                // PGRST116 = no rows returned (user doesn't exist)
                return { success: false, error: `Database error: ${fetchError.message}` };
            }

            let user;

            if (existingUser) {
                // Update existing user profile
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update({
                        username: authData.username || existingUser.username,
                        first_name: authData.first_name,
                        last_name: authData.last_name || null,
                        photo_url: authData.photo_url || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('telegram_id', telegramId)
                    .select()
                    .single();

                if (updateError) {
                    return { success: false, error: `Failed to update user: ${updateError.message}` };
                }
                user = updatedUser;
            } else {
                // Look up referrer if referral code provided (Requirement 9.5)
                let referrerId = null;
                if (referralCode) {
                    const { data: referrer } = await supabase
                        .from('users')
                        .select('id, telegram_id, referral_count, created_at')
                        .eq('referral_code', referralCode.toUpperCase())
                        .single();
                    
                    // Referral abuse protection:
                    // 1. Referrer must exist
                    // 2. Referrer hasn't hit the limit (Requirement 9.4)
                    // 3. Prevent self-referral (same telegram_id)
                    // 4. Referrer account must be at least 1 hour old
                    if (referrer && 
                        referrer.referral_count < MAX_REFERRALS &&
                        referrer.telegram_id !== telegramId) {
                        
                        // Check account age (at least 1 hour old)
                        const referrerCreatedAt = new Date(referrer.created_at);
                        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                        
                        if (referrerCreatedAt < oneHourAgo) {
                            referrerId = referrer.id;
                        }
                    }
                }

                // Create new user with starter credits
                const newReferralCode = this._generateReferralCode();
                
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        telegram_id: telegramId,
                        username: authData.username || null,
                        first_name: authData.first_name,
                        last_name: authData.last_name || null,
                        photo_url: authData.photo_url || null,
                        tier: 'free',
                        credit_balance: STARTER_CREDITS, // Starter credits (Requirement 9.1)
                        referral_code: newReferralCode,
                        referred_by: referrerId,
                        referral_count: 0,
                        daily_cards_used: 0
                    })
                    .select()
                    .single();

                if (createError) {
                    return { success: false, error: `Failed to create user: ${createError.message}` };
                }
                user = newUser;

                // Record starter credits transaction
                await supabase.from('credit_transactions').insert({
                    user_id: user.id,
                    amount: STARTER_CREDITS,
                    balance_after: STARTER_CREDITS,
                    type: 'starter',
                    description: 'Welcome bonus credits'
                });

                // Grant referral credits to referrer (Requirement 9.3)
                if (referrerId) {
                    await this._grantReferralCredits(referrerId, user.id);
                }
            }

            return { success: true, user, isNewUser: !existingUser };
        } catch (error) {
            return { success: false, error: `Authentication failed: ${error.message}` };
        }
    }


    /**
     * Create a session token (JWT) for authenticated user
     * 
     * @param {Object} user - User object from database
     * @returns {Promise<Object>} Session result with token
     */
    async createSession(user) {
        if (!user || !user.id) {
            return { success: false, error: 'Invalid user data' };
        }

        try {
            // Generate JWT token
            const payload = {
                userId: user.id,
                telegramId: user.telegram_id,
                tier: user.tier
            };

            const token = jwt.sign(payload, this.jwtSecret, {
                expiresIn: this.sessionExpiry,
                issuer: 'stripe-own'
            });

            // Hash token for storage
            const tokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Calculate expiration date
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

            // Invalidate existing sessions (single session enforcement - Requirement 13.8)
            await supabase
                .from('sessions')
                .update({ revoked_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .is('revoked_at', null);

            // Store session in database
            const { data: session, error: sessionError } = await supabase
                .from('sessions')
                .insert({
                    user_id: user.id,
                    token_hash: tokenHash,
                    expires_at: expiresAt.toISOString()
                })
                .select()
                .single();

            if (sessionError) {
                return { success: false, error: `Failed to create session: ${sessionError.message}` };
            }

            return {
                success: true,
                token,
                expiresAt: expiresAt.toISOString(),
                sessionId: session.id
            };
        } catch (error) {
            return { success: false, error: `Session creation failed: ${error.message}` };
        }
    }

    /**
     * Validate a session token
     * 
     * @param {string} token - JWT token
     * @returns {Promise<Object>} Validation result with user data
     */
    async validateSession(token) {
        if (!token) {
            return { valid: false, error: 'No token provided' };
        }

        try {
            // Verify JWT
            const decoded = jwt.verify(token, this.jwtSecret, {
                issuer: 'stripe-own'
            });

            // Hash token to check against database
            const tokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Check session in database
            const { data: session, error: sessionError } = await supabase
                .from('sessions')
                .select('*')
                .eq('token_hash', tokenHash)
                .is('revoked_at', null)
                .single();

            if (sessionError || !session) {
                return { valid: false, error: 'Session not found or revoked' };
            }

            // Check if session is expired
            if (new Date(session.expires_at) < new Date()) {
                return { valid: false, error: 'Session expired' };
            }

            // Get user data
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', decoded.userId)
                .single();

            if (userError || !user) {
                return { valid: false, error: 'User not found' };
            }

            // Check if user is flagged
            if (user.is_flagged) {
                return { valid: false, error: 'Account suspended' };
            }

            return { valid: true, user, session };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return { valid: false, error: 'Token expired' };
            }
            if (error.name === 'JsonWebTokenError') {
                return { valid: false, error: 'Invalid token' };
            }
            return { valid: false, error: `Validation failed: ${error.message}` };
        }
    }


    /**
     * Logout user and invalidate session
     * 
     * @param {string} userId - User ID
     * @param {string} sessionId - Session ID (optional, invalidates all if not provided)
     * @returns {Promise<Object>} Logout result
     */
    async logout(userId, sessionId = null) {
        if (!userId) {
            return { success: false, error: 'User ID required' };
        }

        try {
            let query = supabase
                .from('sessions')
                .update({ revoked_at: new Date().toISOString() })
                .eq('user_id', userId)
                .is('revoked_at', null);

            if (sessionId) {
                query = query.eq('id', sessionId);
            }

            const { error } = await query;

            if (error) {
                return { success: false, error: `Logout failed: ${error.message}` };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: `Logout failed: ${error.message}` };
        }
    }

    /**
     * Refresh token if within refresh window (24 hours before expiration)
     * 
     * @param {string} token - Current JWT token
     * @returns {Promise<Object>} New token or null if not eligible
     */
    async refreshToken(token) {
        const validation = await this.validateSession(token);
        
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // Check if within refresh window (24 hours before expiration)
        const session = validation.session;
        const expiresAt = new Date(session.expires_at);
        const refreshWindow = new Date();
        refreshWindow.setHours(refreshWindow.getHours() + 24);

        if (expiresAt > refreshWindow) {
            // Not within refresh window yet
            return { success: false, error: 'Token not eligible for refresh yet' };
        }

        // Create new session
        return this.createSession(validation.user);
    }

    /**
     * Get user by ID
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User data or null
     */
    async getUserById(userId) {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) return null;
        return user;
    }

    /**
     * Generate a unique referral code
     * @private
     */
    _generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Grant referral credits to referrer
     * 
     * Requirements: 9.3, 9.4
     * 
     * @private
     * @param {string} referrerId - Referrer user ID
     * @param {string} referredUserId - New user ID
     */
    async _grantReferralCredits(referrerId, referredUserId) {
        try {
            // Get referrer's current balance and referral count
            const { data: referrer, error: fetchError } = await supabase
                .from('users')
                .select('credit_balance, referral_count')
                .eq('id', referrerId)
                .single();

            if (fetchError || !referrer) {
                return;
            }

            // Check referral limit (Requirement 9.4)
            if (referrer.referral_count >= MAX_REFERRALS) {
                return;
            }

            const newBalance = parseFloat(referrer.credit_balance) + REFERRAL_CREDITS;

            // Update referrer's balance and referral count
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    credit_balance: newBalance,
                    referral_count: (referrer.referral_count || 0) + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', referrerId);

            if (updateError) {
                return;
            }

            // Record referral credit transaction
            await supabase.from('credit_transactions').insert({
                user_id: referrerId,
                amount: REFERRAL_CREDITS,
                balance_after: newBalance,
                type: 'referral',
                description: `Referral bonus for inviting user ${referredUserId}`
            });
        } catch (error) {
        }
    }
}

export default TelegramAuthService;
