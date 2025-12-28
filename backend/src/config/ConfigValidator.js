/**
 * ConfigValidator
 * Validates required environment variables on startup
 * Requirements: 1.1, 1.2, 1.3
 */
export class ConfigValidator {
    constructor() {
        this.requiredVars = [
            'TELEGRAM_BOT_TOKEN',
            'JWT_SECRET',
            'SUPABASE_URL',
            'SUPABASE_SERVICE_KEY'
        ];
    }

    /**
     * Validate all required environment variables
     * @returns {{ valid: boolean, missing: string[] }}
     */
    validate() {
        const missing = [];
        
        for (const varName of this.requiredVars) {
            const value = process.env[varName];
            
            // Check if missing or placeholder value
            if (!value || value.startsWith('your-') || value === '') {
                missing.push(varName);
            }
        }
        
        return { 
            valid: missing.length === 0, 
            missing 
        };
    }

    /**
     * Validate and throw if any required variables are missing
     * @throws {Error} If required environment variables are missing
     */
    validateOrThrow() {
        const result = this.validate();
        
        if (!result.valid) {
            const errorMessage = `Missing required environment variables: ${result.missing.join(', ')}`;
            throw new Error(errorMessage);
        }
    }
}

export const configValidator = new ConfigValidator();
