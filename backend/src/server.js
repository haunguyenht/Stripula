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
import { ChargeAVSService } from './services/ChargeAVSService.js';
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
import { DashboardService } from './services/DashboardService.js';
import { MaintenanceService } from './services/MaintenanceService.js';
import { ErrorReporterService } from './services/ErrorReporterService.js';

// Controllers
import { AuthController } from './controllers/AuthController.js';
import { ChargeController } from './controllers/ChargeController.js';
import { ShopifyChargeController } from './controllers/ShopifyChargeController.js';
import { ChargeAVSController } from './controllers/ChargeAVSController.js';
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
import { DashboardController } from './controllers/DashboardController.js';
import { TelegramWebhookController } from './controllers/TelegramWebhookController.js';
import { PlaywrightChargeController } from './controllers/PlaywrightChargeController.js';

// Middleware
import { AuthMiddleware } from './middleware/AuthMiddleware.js';
import { AdminMiddleware } from './middleware/AdminMiddleware.js';
import { CreditMiddleware } from './middleware/CreditMiddleware.js';
import { RateLimitMiddleware } from './middleware/RateLimitMiddleware.js';
import { OnlineUserTracker } from './middleware/OnlineUserTracker.js';
import { SecurityMiddleware } from './middleware/SecurityMiddleware.js';
import { MaintenanceMiddleware } from './middleware/MaintenanceMiddleware.js';
import { GlobalErrorHandler } from './middleware/GlobalErrorHandler.js';

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

    // Dashboard Service (initialized early for injection into validation services)
    // Requirements: 8.1, 8.2 - Statistics tracking integration
    const dashboardService = new DashboardService({ supabase });

    // Maintenance Service (for global maintenance mode management)
    // Requirements: 1.1, 1.2, 1.3, 1.5, 1.6 - Maintenance mode toggle and persistence
    const maintenanceService = new MaintenanceService({ supabase });

    // Error Reporter Service (for error reporting to Telegram)
    // Requirements: 6.3, 6.4, 6.5, 6.6 - Error reporting and rate limiting
    const errorReporterService = new ErrorReporterService({ supabase });

    const keyChecker = new KeyCheckerService({
        stripeClient: infrastructure.stripeClient,
        gatewayManager: gatewayManagerService
    });

    // SK-Based Auth Service (created before authService for injection)
    const skbasedAuthService = new SKBasedAuthService({
        speedManager,
        gatewayManager: gatewayManagerService,
        dashboardService // Inject for statistics tracking
    });

    const authService = new StripeAuthService({
        speedManager,
        gatewayManager: gatewayManagerService,
        skbasedAuthService, // Inject for routing skbased-auth-* gateways
        dashboardService // Inject for statistics tracking
    });

    const shopifyChargeService = new ShopifyChargeService({
        speedManager,
        gatewayManager: gatewayManagerService,
        dashboardService // Inject for statistics tracking
    });

    const chargeService = new StripeChargeService({
        speedManager,
        gatewayManager: gatewayManagerService,
        dashboardService // Inject for statistics tracking
    });

    // Charge AVS Service (Qgiv with AVS validation)
    const chargeAVSService = new ChargeAVSService({
        speedManager,
        gatewayManager: gatewayManagerService,
        dashboardService // Inject for statistics tracking
    });

    // SK-Based Charge Service
    const skbasedChargeService = new SKBasedChargeService({
        speedManager,
        gatewayManager: gatewayManagerService,
        dashboardService // Inject for statistics tracking
    });

    // Telegram Auth Service
    const telegramAuthService = new TelegramAuthService();

    // Telegram Bot Service (for notifications)
    const telegramBotService = new TelegramBotService();

    // Inject TelegramBotService into GatewayManagerService for health notifications
    gatewayManagerService.telegramBotService = telegramBotService;

    // Inject TelegramBotService into MaintenanceService for maintenance notifications
    maintenanceService.telegramBotService = telegramBotService;

    // Inject TelegramBotService into ErrorReporterService for error notifications
    errorReporterService.telegramBotService = telegramBotService;

    // Inject MaintenanceService and Supabase into TelegramBotService for maintenance commands
    telegramBotService.setMaintenanceService(maintenanceService);
    telegramBotService.setSupabase(supabase);

    // Credit Manager Service
    const creditManagerService = new CreditManagerService();

    // User Service
    const userService = new UserService();

    // Gateway Config Service (with gatewayManager for SSE broadcasts and creditManagerService for cache invalidation)
    const gatewayConfigService = new GatewayConfigService({
        gatewayManager: gatewayManagerService,
        creditManagerService: creditManagerService
    });

    // Tier Limit Service (with gatewayManager for SSE broadcasts)
    const tierLimitService = new TierLimitService({
        gatewayManager: gatewayManagerService
    });

    // User Notification Service (for real-time user updates)
    const userNotificationService = new UserNotificationService();

    // Online User Tracker (middleware for activity tracking)
    const onlineUserTracker = new OnlineUserTracker({
        supabase,
        dashboardService
    });

    // Admin Service
    const adminService = new AdminService({ userService });

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

    // Security Middleware (Requirements: 5.1, 5.2, 5.3, 5.4)
    // Validates requests and blocks potential security threats
    const securityMiddleware = new SecurityMiddleware({ supabase });

    // Maintenance Middleware (Requirements: 1.3, 1.4)
    // Checks maintenance status and blocks non-admin users during maintenance
    // Admin users can bypass maintenance mode to manage the system
    const maintenanceMiddleware = new MaintenanceMiddleware({
        maintenanceService,
        telegramAuthService
    });

    // Global Error Handler (Requirements: 6.1, 7.1)
    // Catches all unhandled errors and reports to Telegram
    const globalErrorHandler = new GlobalErrorHandler({ errorReporter: errorReporterService });

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
    const chargeAVSController = new ChargeAVSController({
        chargeAVSService,
        creditManager: creditManagerService,
        gatewayConfigService,
        telegramBotService
    });
    const proxyController = new ProxyController({});
    const systemController = new SystemController({
        tierLimitService,
        maintenanceService,
        errorReporterService
    });
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

    // Dashboard Controller
    const dashboardController = new DashboardController({
        dashboardService
    });

    // Telegram Webhook Controller (for gateway health inline button callbacks)
    // Requirements: 6.1 - Handle Telegram webhook callbacks for inline buttons
    const telegramWebhookController = new TelegramWebhookController({
        gatewayManager: gatewayManagerService,
        telegramBotService,
        supabase
    });

    // Playwright Charge Controller (browser-based Stripe Elements charging)
    const playwrightChargeController = new PlaywrightChargeController();

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
            userNotificationService,
            dashboardService,
            maintenanceService,
            errorReporterService
        },
        middleware: {
            auth: authMiddleware,
            admin: adminMiddleware,
            credit: creditMiddleware,
            rateLimit: rateLimitMiddleware,
            onlineUserTracker: onlineUserTracker,
            security: securityMiddleware,
            maintenance: maintenanceMiddleware,
            globalErrorHandler: globalErrorHandler
        },
        controllers: {
            auth: authController,
            charge: chargeController,
            shopify: shopifyController,
            chargeAVS: chargeAVSController,
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
            key: keyController,
            dashboard: dashboardController,
            telegramWebhook: telegramWebhookController,
            playwright: playwrightChargeController
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

    // ═══════════════════════════════════════════════════════════════
    // Security Middleware - MUST be first after basic Express middleware
    // Requirements: 5.1, 5.2, 5.3, 5.4 - Block security threats
    // ═══════════════════════════════════════════════════════════════
    const securityMiddleware = container.middleware.security;
    app.use(securityMiddleware.protect());

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
    const dashboardRoutes = container.controllers.dashboard.getRoutes();
    const telegramWebhookRoutes = container.controllers.telegramWebhook.getRoutes();
    const playwrightRoutes = container.controllers.playwright.getRoutes();

    // ═══════════════════════════════════════════════════════════════
    // Telegram Webhook route - NO AUTH REQUIRED for Telegram callbacks
    // Must be registered BEFORE maintenance middleware
    // Requirements: 6.1 - Expose POST /api/telegram/webhook endpoint
    // ═══════════════════════════════════════════════════════════════
    app.post('/api/telegram/webhook', telegramWebhookRoutes.handleWebhook);

    // Get middleware
    const authMiddleware = container.middleware.auth;
    const adminMiddleware = container.middleware.admin;
    const creditMiddleware = container.middleware.credit;
    const rateLimitMiddleware = container.middleware.rateLimit;
    const onlineUserTracker = container.middleware.onlineUserTracker;
    const maintenanceMiddleware = container.middleware.maintenance;
    const globalErrorHandler = container.middleware.globalErrorHandler;

    // ═══════════════════════════════════════════════════════════════
    // Maintenance Middleware - Check maintenance status for API routes
    // Requirements: 1.3, 1.4 - Block non-admin users during maintenance
    // Applied to all /api/* routes except:
    // - /api/auth/telegram/* (login routes)
    // - /api/system/maintenance/* (maintenance status routes)
    // - /api/health/* (health check routes)
    // ═══════════════════════════════════════════════════════════════
    app.use('/api', (req, res, next) => {
        // Skip maintenance check for these routes
        const skipPaths = [
            '/auth/telegram/callback',
            '/auth/refresh',
            '/system/maintenance/status',
            '/system/maintenance/stream',
            '/health',
            '/health/detailed'
        ];

        // Check if path should skip maintenance check
        const shouldSkip = skipPaths.some(path => req.path === path || req.path.startsWith(path + '/'));
        if (shouldSkip) {
            return next();
        }

        // Apply maintenance check for API routes
        return maintenanceMiddleware.checkAPI()(req, res, next);
    });

    // ═══════════════════════════════════════════════════════════════
    // Online User Tracker - Global activity tracking for all API routes
    // Updates last_active_at for authenticated users on any API request
    // Requirement: 6.5, 8.3 - Track user activity for online status
    // ═══════════════════════════════════════════════════════════════
    app.use('/api', onlineUserTracker.middleware());

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

    // ═══════════════════════════════════════════════════════════════
    // User routes - User profile and referrals
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/user/profile', authMiddleware.authenticate(), userRoutes.getProfile);
    app.get('/api/user/referral', authMiddleware.authenticate(), userRoutes.getReferral);
    app.get('/api/user/notifications/stream', authMiddleware.authenticate(), userRoutes.notificationStream);

    // ═══════════════════════════════════════════════════════════════
    // Dashboard routes - Dashboard stats, leaderboard, online users
    // All routes require authentication
    // Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 5.1, 6.1, 8.3
    // Note: Online tracking is now handled globally via app.use('/api', onlineUserTracker.middleware())
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/dashboard/stats',
        authMiddleware.authenticate(),
        dashboardRoutes.getStats
    );
    app.get('/api/dashboard/stats/stream',
        authMiddleware.authenticate(),
        dashboardRoutes.streamStats
    );
    app.get('/api/dashboard/leaderboard',
        authMiddleware.authenticate(),
        dashboardRoutes.getLeaderboard
    );
    app.get('/api/dashboard/online-users',
        authMiddleware.authenticate(),
        dashboardRoutes.getOnlineUsers
    );

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
        chargeRoutes.checkBatchStream
    );
    app.post('/api/charge/stop', authMiddleware.optionalAuth(), chargeRoutes.stopBatch);

    // ═══════════════════════════════════════════════════════════════
    // SK-Based routes - User-provided SK/PK key validation
    // Protected routes require authentication and credit deduction
    // Requirements: 3.1-3.3
    // ═══════════════════════════════════════════════════════════════
    app.get('/api/skbased/health', skbasedRoutes.getHealth);
    app.post('/api/skbased/validate',
        authMiddleware.authenticate(),
        creditMiddleware.checkCredits(GATEWAY_IDS.SKBASED_CHARGE_1),
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
    // Shopify routes - Auto Shopify API card validation (charge type)
    // User provides Shopify URL for validation
    // Protected routes require authentication and credit check
    // ═══════════════════════════════════════════════════════════════
    app.post('/api/shopify/check', authMiddleware.optionalAuth(), shopifyRoutes.checkCard);
    app.post('/api/shopify/batch-stream',
        authMiddleware.authenticate(),
        creditMiddleware.checkCredits(GATEWAY_IDS.AUTO_SHOPIFY_1),
        shopifyRoutes.checkBatchStream
    );
    app.post('/api/shopify/stop', authMiddleware.optionalAuth(), shopifyRoutes.stopBatch);

    // ═══════════════════════════════════════════════════════════════
    // Charge AVS routes - Qgiv AVS card validation
    // Requires card format: number|mm|yy|cvv|zip
    // Protected routes require authentication and credit check
    // ═══════════════════════════════════════════════════════════════
    const chargeAVSRoutes = container.controllers.chargeAVS.getRoutes();
    app.use('/api/charge-avs', authMiddleware.authenticate(), chargeAVSRoutes);

    // ═══════════════════════════════════════════════════════════════
    // Proxy routes - Proxy testing
    // ═══════════════════════════════════════════════════════════════
    app.post('/api/proxy/check', proxyRoutes.checkProxy);
    app.post('/api/proxy/check-stripe', proxyRoutes.checkStripeAccess);

    // ═══════════════════════════════════════════════════════════════
    // Playwright routes - Browser-based Stripe Elements charging
    // Uses real browser with human-like typing and proxy support
    // ═══════════════════════════════════════════════════════════════
    playwrightRoutes.forEach(route => {
        app[route.method.toLowerCase()](route.path, authMiddleware.optionalAuth(), route.handler);
    });

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
    app.post('/api/admin/users/:id/tier/extend',
        authMiddleware.authenticate(),
        adminMiddleware.requireAdmin(),
        adminRoutes.extendUserTier
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

    // Manual health status control routes (Requirements: 4.1, 5.1)
    app.post('/api/admin/gateways/:id/health-status',
        authMiddleware.authenticate(),
        adminMiddleware.requireAdmin(),
        gatewayRoutes.setHealthStatus
    );
    app.post('/api/admin/gateways/:id/reset-metrics',
        authMiddleware.authenticate(),
        adminMiddleware.requireAdmin(),
        gatewayRoutes.resetMetrics
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

    // ═══════════════════════════════════════════════════════════════
    // Maintenance Mode routes - Global maintenance mode management
    // Requirements: 1.1, 1.2, 1.5 - Maintenance mode toggle and status
    // ═══════════════════════════════════════════════════════════════
    // Public routes (no auth required for status check)
    app.get('/api/system/maintenance/status', systemRoutes.getMaintenanceStatus);
    app.get('/api/system/maintenance/stream', systemRoutes.streamMaintenanceStatus);

    // Admin routes (admin role required)
    app.post('/api/admin/maintenance/enable',
        authMiddleware.authenticate(),
        adminMiddleware.requireAdmin(),
        systemRoutes.enableMaintenance
    );
    app.post('/api/admin/maintenance/disable',
        authMiddleware.authenticate(),
        adminMiddleware.requireAdmin(),
        systemRoutes.disableMaintenance
    );

    // ═══════════════════════════════════════════════════════════════
    // Error Reporting routes - Client-side error reporting
    // Requirement: 6.4 - POST /api/errors/report for client-side errors
    // ═══════════════════════════════════════════════════════════════
    app.post('/api/errors/report',
        authMiddleware.optionalAuth(),
        systemRoutes.reportError
    );

    // ═══════════════════════════════════════════════════════════════
    // 404 Handler - Must be after all routes
    // Requirements: 3.1, 7.4 - Return JSON for API routes, HTML for others
    // ═══════════════════════════════════════════════════════════════
    app.use((req, res, next) => {
        // Check if this is an API route
        const isApiRoute = req.path.startsWith('/api/');

        if (isApiRoute) {
            // Return JSON for API routes (Requirement 7.4)
            return res.status(404).json({
                status: 'ERROR',
                error: {
                    code: 404,
                    type: 'NotFound',
                    message: 'The requested resource was not found.'
                }
            });
        }

        // For non-API routes, return a simple HTML 404 page
        // The frontend will handle displaying the proper 404 page
        res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a2332 0%, #0d1520 100%);
            color: #e5e7eb;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container { text-align: center; max-width: 500px; }
        .icon { font-size: 64px; margin-bottom: 24px; }
        h1 { font-size: 28px; font-weight: 600; margin-bottom: 16px; color: #f9fafb; }
        .message { font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px; }
        a { color: #60a5fa; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔍</div>
        <h1>Page Not Found</h1>
        <p class="message">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/">Return to Dashboard</a>
    </div>
</body>
</html>`);
    });

    // ═══════════════════════════════════════════════════════════════
    // Global Error Handler - Must be LAST middleware
    // Requirements: 6.1, 7.1 - Catch all unhandled errors
    // ═══════════════════════════════════════════════════════════════
    app.use(globalErrorHandler.handle());

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

    // Initialize MaintenanceService (loads maintenance state from database)
    // Requirements: 1.6 - Persist maintenance mode state across server restarts
    await container.services.maintenanceService.initialize();

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
