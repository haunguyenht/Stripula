/**
 * Settings Controller
 * Handles application settings
 */
export class SettingsController {
    constructor(options = {}) {
        this.browserService = options.browserService;
    }

    /**
     * POST /api/stripe-own/settings
     * Toggle fast mode
     */
    settings(req, res) {
        const { fastMode } = req.body;
        if (typeof fastMode === 'boolean') {
            console.log(`[SettingsController] Fast mode: ${fastMode ? 'ON' : 'OFF'}`);
            res.json({ success: true, fastMode });
        } else {
            res.status(400).json({ error: 'fastMode must be boolean' });
        }
    }

    /**
     * POST /api/stripe-own/debug-mode
     * Toggle browser headless mode
     */
    async debugMode(req, res) {
        const { headless = true } = req.body;
        
        await this.browserService.closeBrowser();
        this.browserService.setHeadless(headless);
        
        res.json({
            status: 'OK',
            headless,
            message: headless ? 'Browser hidden' : 'Browser visible for debugging'
        });
    }

    /**
     * GET /api/health
     */
    health(req, res) {
        res.json({
            status: 'ok',
            service: 'stripe-own-backend',
            playwright: true,
            architecture: 'modular'
        });
    }

    /**
     * Get Express router handlers
     */
    getRoutes() {
        return {
            settings: this.settings.bind(this),
            debugMode: this.debugMode.bind(this),
            health: this.health.bind(this)
        };
    }
}
