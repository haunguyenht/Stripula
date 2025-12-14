/**
 * Key Controller
 * Handles Stripe API key operations
 */
export class KeyController {
    constructor(options = {}) {
        this.keyChecker = options.keyChecker;
    }

    /**
     * POST /api/stripe-own/check-key
     * Check a single SK key
     */
    async checkKey(req, res) {
        try {
            const { skKey } = req.body;

            if (!skKey) {
                return res.status(400).json({ status: 'ERROR', message: 'SK key is required' });
            }

            const result = await this.keyChecker.checkKey(skKey);
            res.json(result);

        } catch (error) {
            console.error('[KeyController] Error:', error.message);
            res.status(500).json({ status: 'ERROR', message: error.message });
        }
    }

    /**
     * Get Express router handlers
     */
    getRoutes() {
        return {
            checkKey: this.checkKey.bind(this)
        };
    }
}
