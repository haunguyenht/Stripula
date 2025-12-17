import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Infrastructure
import { stripeAPIClient } from './infrastructure/stripe/StripeAPIClient.js';
import { playwrightManager } from './infrastructure/browser/PlaywrightManager.js';
import { binLookupClient } from './infrastructure/external/BinLookupClient.js';
import { stripeErrorHandler } from './infrastructure/http/StripeErrorHandler.js';
import { retryHandler } from './infrastructure/http/RetryHandler.js';

// Services
import { ValidationFacade } from './services/ValidationFacade.js';
import { KeyCheckerService } from './services/KeyCheckerService.js';
import { ProxyManagerService } from './services/ProxyManagerService.js';

// Validators
import { ValidatorFactory } from './validators/ValidatorFactory.js';

// Controllers
import { KeyController } from './controllers/KeyController.js';
import { CardController } from './controllers/CardController.js';
import { SettingsController } from './controllers/SettingsController.js';
import { ProxyController } from './controllers/ProxyController.js';

// Config
import { DEFAULTS } from './utils/constants.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dependency Injection Container
 * Creates and wires all dependencies
 */
function createContainer() {
    // Infrastructure layer
    const infrastructure = {
        stripeClient: stripeAPIClient,
        browserService: playwrightManager,
        binLookup: binLookupClient,
        errorHandler: stripeErrorHandler,
        retryHandler: retryHandler
    };

    // Validator factory with dependencies
    const validatorFactory = new ValidatorFactory(infrastructure);

    // Services
    const proxyManager = new ProxyManagerService();
    
    const validationFacade = new ValidationFacade({
        validatorFactory,
        proxyManager
    });

    const keyChecker = new KeyCheckerService({
        stripeClient: infrastructure.stripeClient
    });

    // Controllers
    const keyController = new KeyController({ keyChecker });
    const cardController = new CardController({
        validationFacade,
        browserService: infrastructure.browserService
    });
    const settingsController = new SettingsController({
        browserService: infrastructure.browserService
    });
    const proxyController = new ProxyController({
        proxyManager
    });

    return {
        infrastructure,
        services: {
            validatorFactory,
            proxyManager,
            validationFacade,
            keyChecker
        },
        controllers: {
            key: keyController,
            card: cardController,
            settings: settingsController,
            proxy: proxyController
        }
    };
}

/**
 * Create Express application with routes
 */
function createApp(container) {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve checkout pages for Playwright
    app.get('/checkout', (req, res) => {
        res.sendFile(path.join(__dirname, 'checkout-page.html'));
    });

    app.get('/setup-checkout', (req, res) => {
        res.sendFile(path.join(__dirname, 'setup-checkout.html'));
    });

    // Checkout Sessions API page (custom UI mode)
    app.get('/checkout-sessions', (req, res) => {
        res.sendFile(path.join(__dirname, 'checkout-sessions-page.html'));
    });

    // Get route handlers
    const keyRoutes = container.controllers.key.getRoutes();
    const cardRoutes = container.controllers.card.getRoutes();
    const settingsRoutes = container.controllers.settings.getRoutes();
    const proxyRoutes = container.controllers.proxy.getRoutes();

    // Key routes
    app.post('/api/stripe-own/check-key', keyRoutes.checkKey);

    // Proxy routes
    app.post('/api/stripe-own/check-proxy', proxyRoutes.checkProxy);

    // Card validation routes
    app.post('/api/stripe-own/validate', cardRoutes.validate);
    app.post('/api/stripe-own/validate-nocharge', cardRoutes.validateNoCharge);
    app.post('/api/stripe-own/validate-batch', cardRoutes.validateBatch);
    app.post('/api/stripe-own/validate-batch-stream', cardRoutes.validateBatchStream);
    app.post('/api/stripe-own/stop-batch', cardRoutes.stopBatch);
    app.post('/api/stripe-own/parse-cards', cardRoutes.parseCards);
    app.post('/api/stripe-own/pay', cardRoutes.pay);
    app.post('/api/stripe-own/tokenize', cardRoutes.tokenize);

    // Settings routes
    app.post('/api/stripe-own/settings', settingsRoutes.settings);
    app.post('/api/stripe-own/debug-mode', settingsRoutes.debugMode);
    app.get('/api/health', settingsRoutes.health);

    return app;
}

/**
 * Main entry point
 */
async function main() {
    const PORT = process.env.PORT || DEFAULTS.PORT;

    // Create DI container
    const container = createContainer();

    // Create Express app
    const app = createApp(container);

    // Graceful shutdown
    const shutdown = async () => {
        console.log('\n[Server] Shutting down...');
        await container.infrastructure.browserService.closeBrowser();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start server
    app.listen(PORT, () => {
        console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║  Stripe Validation Server - Modular Architecture             ║`);
        console.log(`╠══════════════════════════════════════════════════════════════╣`);
        console.log(`║  Port: ${PORT}                                                   ║`);
        console.log(`╠══════════════════════════════════════════════════════════════╣`);
        console.log(`║  Endpoints:                                                  ║`);
        console.log(`║    POST /api/stripe-own/check-key           - Check SK key  ║`);
        console.log(`║    POST /api/stripe-own/validate            - Single card   ║`);
        console.log(`║    POST /api/stripe-own/validate-nocharge   - No charge     ║`);
        console.log(`║    POST /api/stripe-own/validate-batch      - Batch JSON    ║`);
        console.log(`║    POST /api/stripe-own/validate-batch-stream - Batch SSE   ║`);
        console.log(`║    POST /api/stripe-own/stop-batch          - Stop batch    ║`);
        console.log(`║    POST /api/stripe-own/tokenize            - Get PM ID     ║`);
        console.log(`║    POST /api/stripe-own/parse-cards         - Parse cards   ║`);
        console.log(`║    GET  /api/health                         - Health check  ║`);
        console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
    });
}

// Run
main().catch(err => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});
