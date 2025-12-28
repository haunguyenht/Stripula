import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Infrastructure
import { stripeAPIClient } from './infrastructure/stripe/StripeAPIClient.js';
import { binLookupClient } from './infrastructure/external/BinLookupClient.js';
import { stripeErrorHandler } from './infrastructure/http/StripeErrorHandler.js';
import { retryHandler } from './infrastructure/http/RetryHandler.js';
import { supabase } from './infrastructure/database/SupabaseClient.js';

// Constants
import { GATEWAY_IDS } from './utils/constants.js';

// Services
import { KeyCheckerService } from './services/KeyCheckerService.js';
import { StripeAuthService } from './services/StripeAuthService.js';
import { ShopifyChargeService } from './services/ShopifyChargeService.js';
import { StripeChargeService } from './services/StripeChargeService.js';
import { TelegramAuthService } from './services/TelegramAuthService.js';
import { CreditManagerService } from './services/CreditManagerService.js';
import { UserService } from './services/UserService.js';
import { GatewayConfigService } from './services/GatewayConfigService.js';
import { AdminService } from './services/AdminService.js';
import { RedeemKeyService } from './services/RedeemKeyService.js';
import { SpeedConfigService } from './services/SpeedConfigService.js';
import { SpeedManager } from './services/SpeedManager.js';
import { GatewayManagerService } from './services/GatewayManagerService.js';
import { TierLimitService } from './services/TierLimitService.js';
import { SKBasedChargeService } from './services/SKBasedChargeService.js';
import { SKBasedAuthService } from './services/SKBasedAuthService.js';
import { TelegramBotService } from './services/TelegramBotService.js';
import { UserNotificationService } from './services/UserNotificationService.js';

// Controllers
import { AuthController } from './controllers/AuthController.js';
import { ChargeController } from './controllers/ChargeController.js';
import { ShopifyChargeController } from './controllers/ShopifyChargeController.js';
import { ProxyController } from './controllers/ProxyController.js';
import { SystemController } from './controllers/SystemController.js';
import { TelegramAuthController } from './controllers/TelegramAuthController.js';
import { CreditController } from './controllers/CreditController.js';
import { UserController } from './controllers/UserController.js';
import { AdminController } from './controllers/AdminController.js';
import { RedeemController } from './controllers/RedeemController.js';
import { HealthController } from './controllers/HealthController.js';
import { SpeedConfigController } from './controllers/SpeedConfigController.js';
import { GatewayController } from './controllers/GatewayController.js';
import { SavedProxyService } from './services/SavedProxyService.js';
import { SKBasedController } from './controllers/SKBasedController.js';
import { SKBasedAuthController } from './controllers/SKBasedAuthController.js';
import { KeyController } from './controllers/KeyController.js';

// Middleware
import { AuthMiddleware } from './middleware/AuthMiddleware.js';
import { AdminMiddleware } from './middleware/AdminMiddleware.js';
import { CreditMiddleware } from './middleware/CreditMiddleware.js';
import { RateLimitMiddleware } from './middleware/RateLimitMiddleware.js';

// Config
import { DEFAULTS } from './utils/constants.js';
import { configValidator } from './config/ConfigValidator.js';

dotenv.config();

/**
 * Dependency Injection Container
 */
function createContainer() {
    // Infrastructure layer
    const infrastructure = {
        stripeClient: stripeAPIClient,
        binLookup: binLookupClient,
        errorHandler: stripeErrorHandler,
        retryHandler: retryHandler
    };

    // Speed Config Service and Speed Manager (initialized early for injection into validation services)
    const speedConfigService = new SpeedConfigService();
    const speedManager = new SpeedManager({ speedConfigService });

    // Gateway Manager Service (initialized early for injection into validation services)
    const gatewayManagerService = new GatewayManagerService({ supabase });

    const keyChecker = new KeyCheckerService({
        stripeClient: infrastructure.stripeClient,
        gatewayManager: gatewayManagerService
    });

    // SK-Based Auth Service (created before authService for injection)
    const skbasedAuthService = new SKBasedAuthService({
        speedManager,
        gatewayManager: gatewayManagerService
    });

    const authService = new StripeAuthService({
        speedManager,
        gatewayManager: gatewayManagerService,
        skbasedAuthService // Inject for routing skbased-auth-* gateways
    });

    const shopifyChargeService = new ShopifyChargeService({
        speedManager,
        gatewayManager: gatewayManagerService
    });

    const chargeService = new StripeChargeService({
        speedManager,
        gatewayManager: gatewayManagerService
    });

    // SK-Based Charge Service
    const skbasedChargeService = new SKBasedChargeService({
        speedManager,
        gatewayManager: gatewayManagerService
    });

    // Telegram Auth Service
    const telegramAuthService = new TelegramAuthService();

    // Telegram Bot Service (for notifications)
    const telegramBotService = new TelegramBotService();

    // Credit Manager Service
    const creditManagerService = new CreditManagerService();

    // User Service
    const userService = new UserService();

    // Gateway Config Service (with gatewayManager for SSE broadcasts)
    const gatewayConfigService = new GatewayConfigService({
        gatewayManager: gatewayManagerService
    });

    // Tier Limit Service (with gatewayManager for SSE broadcasts)
    const tierLimitService = new TierLimitService({
        gatewayManager: gatewayManagerService
    });

    // User Notification Service (for real-time user updates)
    const userNotificationService = new UserNotificationService();

    // Admin Service
    const adminService = new AdminService();

    // Redeem Key Service
    const redeemKeyService = new RedeemKeyService(creditManagerService);

    // Middleware
    const authMiddleware = new AuthMiddleware({ telegramAuthService, userService });
    const adminMiddleware = new AdminMiddleware();
    const creditMiddleware = new CreditMiddleware({ 
        creditManagerService, 
        userService, 
        gatewayConfigService 
    });
    const rateLimitMiddleware = new RateLimitMiddleware();

    // Controllers
    const authController = new AuthController({ 
        authService, 
        creditManagerService,
        telegramBotService
    });
    const chargeController = new ChargeController({ 
        chargeService, 
        creditManagerService,
        telegramBotService
    });
    const shopifyController = new ShopifyChargeController({ 
        shopifyChargeService, 
        creditManagerService,
        telegramBotService
    });
    const proxyController = new ProxyController({});
    const systemController = new SystemController({ tierLimitService });
    const telegramAuthController = new TelegramAuthController({ telegramAuthService });
    const creditController = new CreditController({ creditManagerService });
    const userController = new UserController({ userService, userNotificationService });
    const adminController = new AdminController({ redeemKeyService, adminService, tierLimitService, userNotificationService });
    const redeemController = new RedeemController({ redeemKeyService });
    const healthController = new HealthController();
    const speedConfigController = new SpeedConfigController({ speedConfigService, speedManager });
    // Saved Proxy Service
    const savedProxyService = new SavedProxyService();
    
    const gatewayController = new GatewayController({ 
        gatewayManager: gatewayManagerService,
        gatewayConfigService: gatewayConfigService,
        userService: userService,
        savedProxyService: savedProxyService
    });

    // SK-Based Controller
    const skbasedController = new SKBasedController({
        skbasedService: skbasedChargeService,
        creditManagerService,
        telegramBotService
    });

    // SK-Based Auth Controller
    const skbasedAuthController = new SKBasedAuthController({
        skbasedAuthService,
        gatewayManager: gatewayManagerService,
        telegramBotService
    });

    // Key Controller
    const keyController = new KeyController({
        keyCheckerService: keyChecker,
        telegramBotService,
        gatewayManager: gatewayManagerService
    });

    return {
        infrastructure,
        services: {
            keyChecker,
            authService,
            shopifyChargeService,
            chargeService,
            skbasedChargeService,
            skbasedAuthService,
            telegramAuthService,
            creditManagerService,
            userService,
            gatewayConfigService,
            adminService,
            redeemKeyService,
            speedConfigService,
            speedManager,
            gatewayManagerService,
            tierLimitService,
            userNotificationService
        },
        middleware: {
            auth: authMiddleware,
            admin: adminMiddleware,
            credit: creditMiddleware,
            rateLimit: rateLimitMiddleware
        },
        controllers: {
            auth: authController,
            charge: chargeController,
            shopify: shopifyController,
            proxy: proxyController,
            system: systemController,
            telegramAuth: telegramAuthController,
            credit: creditController,
            user: userController,
            admin: adminController,
            redeem: redeemController,
            health: healthController,
            speedConfig: speedConfigController,
            gateway: gatewayController,
            skbased: skbasedController,
            skbasedAuth: skbasedAuthController,
            key: keyController
        }
    };
}

/**
 * Create Express application with routes
 */
function createApp(container) {
    const app = express();

    // Middleware
    app.use(cors({
        origin: true,
        credentials: true
    }));
    app.use(cookieParser());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Serve static files
    app.use(express.static(path.join(__dirname, '../public')));

    // Get route handlers
    const authRoutes = container.controllers.auth.getRoutes();
    const chargeRoutes = container.controllers.charge.getRoutes();
    const shopifyRoutes = container.controllers.shopify.getRoutes();
    const proxyRoutes = container.controllers.proxy.getRoutes();
    const systemRoutes = container.controllers.system.getRoutes();
    const telegramAuthRoutes = container.controllers.telegramAuth.getRoutes();
    const creditRoutes = container.controllers.credit.getRoutes();
    const userRoutes = container.controllers.user.getRoutes();
    const adminRoutes = container.controllers.admin.getRoutes();
    const redeemRoutes = container.controllers.redeem.getRoutes();
    const healthRoutes = container.controllers.health.getRoutes();
    const speedConfigRoutes = container.controllers.speedConfig.getRoutes();
    const gatewayRoutes = container.controllers.gateway.getRoutes();
    const skbasedRoutes = container.controllers.skbased.getRoutes();
    const skbasedAuthRoutes = container.controllers.skbasedAuth.getRoutes();
    const keyRoutes = container.controllers.key.getRoutes();

    // Get middleware
    const authMiddleware = container.middleware.auth;
    const adminMiddleware = container.middleware.admin;
    const creditMiddleware = container.middleware.credit;
    const rateLimitMiddleware = container.middleware.rateLimit;

    // ═══════════════════════════════════════════════════════════════
    // Telegram Auth routes - SSO authentication
    // Rate limit login attempts to 5/min per IP (Requirement 11.1)
    // ═══════════════════════════════════════════════════════════════
    app.post('/api/auth/telegram/callback', rateLimitMiddleware.limitByIP(5, 60 * 1000), telegramAuthRoutes.handleCallback);
    app.post('/api/auth/logout', authMiddleware.authenticate(), telegramAuthRoutes.handleLogout);
    app.get('/api/auth/me', authMiddleware.authenticate(), telegramAuthRoutes.getCurrentUser);
    app.post('/api/auth/refresh', rateLimitMiddleware.limitByIP(10, 60 * 1000), telegramAuthRoutes.refreshToken);

    // ═══════════════════════════════════════════════════════════════
    // Credit routes - Credit management and daily claims
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/credits/balance', authMiddleware.authenticate(), creditRoutes.getBalance);
    app.get('/api/credits/history', authMiddleware.authenticate(), creditRoutes.getHistory);
    app.post('/api/credits/claim-daily', authMiddleware.authenticate(), creditRoutes.claimDaily);
    app.get('/api/credits/claim-status', authMiddleware.authenticate(), creditRoutes.getClaimStatus);
    app.get('/api/credits/summary', authMiddleware.authenticate(), creditRoutes.getSummary);
    app.post('/api/credits/release-lock', authMiddleware.authenticate(), creditRoutes.releaseLock);

    // ═══════════════════════════════════════════════════════════════
    // User routes - User profile and referrals
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/user/status', authMiddleware.authenticate(), creditRoutes.getOperationStatus);
    app.get('/api/user/profile', authMiddleware.authenticate(), userRoutes.getProfile);
    app.get('/api/user/referral', authMiddleware.authenticate(), userRoutes.getReferral);
    app.get('/api/user/notifications/stream', authMiddleware.authenticate(), userRoutes.notificationStream);

    // ═══════════════════════════════════════════════════════════════
    // Auth routes - SetupIntent/Auth flows (WooCommerce, Yogatket)
    // Protected routes require authentication and credit check
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/auth/sites', authRoutes.getSites);
    app.post('/api/auth/site', authRoutes.setSite);
    app.post('/api/auth/check', authMiddleware.optionalAuth(), authRoutes.checkCard);
    app.post('/api/auth/batch-stream', 
        authMiddleware.authenticate(), 
        creditMiddleware.checkCredits(GATEWAY_IDS.AUTH_1),
        creditMiddleware.acquireLock(),
        authRoutes.checkBatchStream
    );
    app.post('/api/auth/stop', authMiddleware.optionalAuth(), authRoutes.stopBatch);

    // ═══════════════════════════════════════════════════════════════
    // Charge routes - Actual charge flows (Remember.org donations)
    // Protected routes require authentication and credit check
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/charge/sites', chargeRoutes.getSites);
    app.get('/api/charge/health', chargeRoutes.getHealth); // Health check endpoint (Requirement 11.5)
    app.post('/api/charge/site', chargeRoutes.setSite);
    app.post('/api/charge/check', authMiddleware.optionalAuth(), chargeRoutes.checkCard);
    app.post('/api/charge/batch-stream', 
        authMiddleware.authenticate(), 
        creditMiddleware.checkCredits(GATEWAY_IDS.CHARGE_1),
        creditMiddleware.acquireLock(),
        chargeRoutes.checkBatchStream
    );
    app.post('/api/charge/stop', authMiddleware.optionalAuth(), chargeRoutes.stopBatch);

    // ═══════════════════════════════════════════════════════════════
    // SK-Based routes - User-provided SK/PK key validation
    // Protected routes require authentication only (NO credit deduction)
    // Requirements: 3.1-3.3
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/skbased/health', skbasedRoutes.getHealth);
    app.post('/api/skbased/validate', 
        authMiddleware.authenticate(), 
        skbasedRoutes.startValidation
    );
    app.post('/api/skbased/stop', authMiddleware.optionalAuth(), skbasedRoutes.stopBatch);

    // ═══════════════════════════════════════════════════════════════
    // SK-Based Auth routes - SetupIntent $0 authorization
    // Uses user-provided SK/PK keys for direct Stripe API validation
    // NO credit deduction for SK-based gateways
    // ═══════════════════════════════════════════════════════════════
    app.post('/api/skbased-auth/validate', 
        authMiddleware.authenticate(), 
        skbasedAuthRoutes.startValidation
    );
    app.get('/api/skbased-auth/validate/stream', 
        authMiddleware.authenticate(), 
        skbasedAuthRoutes.streamResults
    );
    app.post('/api/skbased-auth/stop', authMiddleware.optionalAuth(), skbasedAuthRoutes.stopValidation);

    // ═══════════════════════════════════════════════════════════════
    // Key routes - SK key validation (for StripeOwn panel)
    // ═══════════════════════════════════════════════════════════════
    app.post('/api/keys/check', authMiddleware.optionalAuth(), keyRoutes.checkKey);
    app.post('/api/keys/check-batch', authMiddleware.optionalAuth(), keyRoutes.checkKeysBatch);

    // ═══════════════════════════════════════════════════════════════
    // Shopify routes - Shopify checkout validation
    // Protected routes require authentication and credit check
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/shopify/sites', shopifyRoutes.getSites);
    app.get('/api/shopify/all-sites', shopifyRoutes.getAllSites);
    app.post('/api/shopify/site', shopifyRoutes.setSite);
    app.post('/api/shopify/update-site', shopifyRoutes.updateSite);
    app.post('/api/shopify/check', authMiddleware.optionalAuth(), shopifyRoutes.checkCard);
    app.post('/api/shopify/batch', 
        authMiddleware.authenticate(), 
        creditMiddleware.checkCredits(GATEWAY_IDS.SHOPIFY_1),
        creditMiddleware.acquireLock(),
        shopifyRoutes.checkBatch
    );
    app.post('/api/shopify/batch-stream', 
        authMiddleware.authenticate(), 
        creditMiddleware.checkCredits(GATEWAY_IDS.SHOPIFY_1),
        creditMiddleware.acquireLock(),
        shopifyRoutes.checkBatchStream
    );
    app.post('/api/shopify/stop', authMiddleware.optionalAuth(), shopifyRoutes.stopBatch);

    // ═══════════════════════════════════════════════════════════════
    // Proxy routes - Proxy testing
    // ═══════════════════════════════════════════════════════════════
    app.post('/api/proxy/check', proxyRoutes.checkProxy);
    app.post('/api/proxy/check-stripe', proxyRoutes.checkStripeAccess);

    // ═══════════════════════════════════════════════════════════════
    // Redeem routes - Key redemption for authenticated users
    // Rate limited to 10 attempts per IP per minute (Requirement 8.4)
    // Requirements: 5.1, 5.8
    // ═══════════════════════════════════════════════════════════════
    app.post('/api/redeem', 
        rateLimitMiddleware.limitByIPAndEndpoint('redeem', 10, 60 * 1000),
        authMiddleware.authenticate(), 
        redeemRoutes.redeemKey
    );

    // ═══════════════════════════════════════════════════════════════
    // Admin routes - Admin dashboard endpoints
    // All routes require authentication + admin role
    // Requirements: 3.1, 3.2, 3.4, 3.5, 4.1, 4.7, 4.8
    // ═══════════════════════════════════════════════════════════════
    // Key management
    app.post('/api/admin/keys/generate', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.generateKeys
    );
    app.get('/api/admin/keys', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.getKeys
    );
    app.delete('/api/admin/keys/:id', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.revokeKey
    );
    
    // User management
    app.get('/api/admin/users', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.getUsers
    );
    app.patch('/api/admin/users/:id/tier', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.updateUserTier
    );
    app.patch('/api/admin/users/:id/credits', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.updateUserCredits
    );
    app.post('/api/admin/users/:id/flag', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.flagUser
    );
    app.delete('/api/admin/users/:id/flag', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.unflagUser
    );
    
    // Analytics
    app.get('/api/admin/analytics', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.getAnalytics
    );

    // ═══════════════════════════════════════════════════════════════
    // Tier Limit routes - Admin tier limit configuration
    // Requirements: 7.2, 7.3, 7.4, 7.5, 7.6
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/admin/tier-limits', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.getTierLimits
    );
    app.put('/api/admin/tier-limits', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.updateTierLimits
    );
    app.put('/api/admin/tier-limits/:tier', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.updateSingleTierLimit
    );
    app.post('/api/admin/tier-limits/reset', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        adminRoutes.resetTierLimits
    );

    // ═══════════════════════════════════════════════════════════════
    // Speed Config routes - Gateway speed configuration
    // Public routes require authentication, admin routes require admin role
    // Requirements: 1.1, 1.2, 1.6, 3.6, 4.1, 4.2
    // ═══════════════════════════════════════════════════════════════
    // Public routes (authenticated users)
    app.get('/api/speed-config/comparison/:gatewayId', 
        authMiddleware.authenticate(), 
        speedConfigRoutes.getSpeedComparison
    );
    app.get('/api/speed-config/:gatewayId/:tier', 
        authMiddleware.authenticate(), 
        speedConfigRoutes.getSpeedConfig
    );
    app.get('/api/speed-config/:gatewayId', 
        authMiddleware.authenticate(), 
        speedConfigRoutes.getGatewayConfigs
    );
    app.get('/api/speed-config', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        speedConfigRoutes.getAllConfigs
    );
    
    // Admin routes (admin role required)
    app.patch('/api/admin/speed-config/:gatewayId/:tier', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        speedConfigRoutes.updateSpeedConfig
    );
    app.post('/api/admin/speed-config/reset', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        speedConfigRoutes.resetToDefaults
    );

    // ═══════════════════════════════════════════════════════════════
    // Health routes - Health check endpoints for monitoring
    // Requirement: 7.3
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/health', healthRoutes.health);
    app.get('/api/health/detailed', healthRoutes.healthDetailed);

    // ═══════════════════════════════════════════════════════════════
    // Gateway routes - Gateway management and status
    // Public routes require authentication, admin routes require admin role
    // Requirements: 5.1, 6.1, 6.2, 6.3, 6.4, 7.1
    // ═══════════════════════════════════════════════════════════════
    // Public routes (authenticated users)
    app.get('/api/gateways', 
        authMiddleware.authenticate(), 
        gatewayRoutes.listGateways
    );
    app.get('/api/gateways/status/stream', 
        authMiddleware.authenticate(), 
        gatewayRoutes.streamStatus
    );
    
    // Admin routes (admin role required)
    app.get('/api/admin/gateways', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.adminListGateways
    );
    app.get('/api/admin/gateways/:id', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.getGateway
    );
    app.put('/api/admin/gateways/:id/state', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.updateState
    );
    app.post('/api/admin/gateways/:id/maintenance', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.enableMaintenance
    );
    app.delete('/api/admin/gateways/:id/maintenance', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.disableMaintenance
    );
    app.get('/api/admin/gateways/:id/health', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.getHealth
    );
    app.post('/api/admin/gateways/:id/health/reset', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.resetHealth
    );
    app.get('/api/admin/gateways/health/thresholds', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.getHealthThresholds
    );
    app.put('/api/admin/gateways/health/thresholds', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.updateHealthThresholds
    );
    app.get('/api/admin/gateways/audit', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.getAllAuditLogs
    );
    app.get('/api/admin/gateways/:id/audit', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.getAuditLogs
    );

    // Proxy configuration routes (Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6)
    app.get('/api/admin/gateways/:id/proxy', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.getProxyConfig
    );
    app.put('/api/admin/gateways/:id/proxy', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.setProxyConfig
    );
    app.delete('/api/admin/gateways/:id/proxy', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.clearProxyConfig
    );
    app.post('/api/admin/gateways/:id/proxy/test', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.testProxyConnection
    );

    // Saved proxies routes
    app.get('/api/admin/proxies',
        authMiddleware.authenticate(),
        adminMiddleware.requireAdmin(),
        gatewayRoutes.listSavedProxies
    );
    app.post('/api/admin/proxies',
        authMiddleware.authenticate(),
        adminMiddleware.requireAdmin(),
        gatewayRoutes.saveSavedProxy
    );
    app.delete('/api/admin/proxies/:id',
        authMiddleware.authenticate(),
        adminMiddleware.requireAdmin(),
        gatewayRoutes.deleteSavedProxy
    );

    // Credit rate configuration routes (Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 11.1)
    app.get('/api/gateways/credit-rates', 
        authMiddleware.authenticate(), 
        gatewayRoutes.getAllCreditRates
    );
    app.get('/api/admin/gateways/:id/credit-rate', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.getCreditRate
    );
    app.put('/api/admin/gateways/:id/credit-rate', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.setCreditRate
    );
    app.delete('/api/admin/gateways/:id/credit-rate', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.resetCreditRate
    );

    // Pricing routes (admin) - set approved/live pricing
    app.put('/api/admin/gateways/:id/pricing', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.setPricing
    );

    // Tier restriction routes (admin)
    app.get('/api/gateways/tier-restrictions', 
        authMiddleware.authenticate(), 
        gatewayRoutes.getAllTierRestrictions
    );
    app.get('/api/admin/gateways/:id/tier-restriction', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.getTierRestriction
    );
    app.put('/api/admin/gateways/:id/tier-restriction', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.setTierRestriction
    );
    app.delete('/api/admin/gateways/:id/tier-restriction', 
        authMiddleware.authenticate(), 
        adminMiddleware.requireAdmin(), 
        gatewayRoutes.clearTierRestriction
    );

    // ═══════════════════════════════════════════════════════════════
    // System routes - Health, config, settings, tier limits
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/system/health', systemRoutes.health);
    app.get('/api/system/config', systemRoutes.getConfig);
    app.post('/api/system/config/reload', systemRoutes.reloadConfig);
    app.post('/api/system/settings', systemRoutes.settings);
    app.post('/api/system/debug-mode', systemRoutes.debugMode);
    
    // Tier limits route (authenticated users)
    // Requirements: 1.1 - Return current tier limits and defaults
    app.get('/api/system/tier-limits', 
        authMiddleware.authenticate(), 
        systemRoutes.getTierLimits
    );

    return app;
}

/**
 * Main entry point
 */
async function main() {
    const PORT = process.env.PORT || DEFAULTS.PORT;

    // Validate required environment variables on startup
    // Requirements: 1.1, 1.2, 1.3
    configValidator.validateOrThrow();

    // Create DI container
    const container = createContainer();

    // Initialize GatewayManagerService (loads states from database)
    await container.services.gatewayManagerService.initialize();

    // Create Express app
    const app = createApp(container);

    // Graceful shutdown
    const shutdown = async () => {
        console.log('\n[Server] Shutting down...');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start server
    app.listen(PORT, async () => {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Card Validation Server v2.0                                 ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                   ║
╠══════════════════════════════════════════════════════════════╣
║  API Endpoints:                                              ║
║                                                              ║
║  TgAuth   /api/auth/telegram/*  Telegram SSO authentication  ║
║  Credits  /api/credits/*        Credit management            ║
║  User     /api/user/*           User status & operations     ║
║  Redeem   /api/redeem           Key redemption               ║
║  Admin    /api/admin/*          Admin dashboard              ║
║  Speed    /api/speed-config/*   Gateway speed configuration  ║
║  Gateway  /api/gateways/*       Gateway status & management  ║
║  Auth     /api/auth/*           SetupIntent validation       ║
║  Charge   /api/charge/*         Charge validation            ║
║  SKBased  /api/skbased/*        SK-based charge validation   ║
║  SKAuth   /api/skbased-auth/*  SK-based $0 auth validation   ║
║  Shopify  /api/shopify/*        Shopify checkout validation  ║
║  Proxy    /api/proxy/*          Proxy testing                ║
║  Health   /api/health/*         Health monitoring            ║
║  System   /api/system/*         Health, config, settings     ║
╚══════════════════════════════════════════════════════════════╝
`);
    });
}

// Run
main().catch(err => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});
