/**
 * FingerprintGenerator - Dynamic browser fingerprint generation
 * Generates realistic, randomized browser fingerprints for anti-detection
 */

// Chrome version ranges (major.minor.patch.build) - Updated Dec 2024
// Keep range narrow (last 3-4 versions) for realism
const CHROME_VERSIONS = {
    min: 128,
    max: 131,
    getVersion() {
        const major = Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
        const minor = 0;
        const patch = Math.floor(Math.random() * 100); // Realistic patch range
        const build = Math.floor(Math.random() * 100);
        return `${major}.${minor}.${patch}.${build}`;
    }
};

// Firefox version ranges - Updated Dec 2024
const FIREFOX_VERSIONS = {
    min: 130,
    max: 133,
    getVersion() {
        const major = Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
        return `${major}.0`;
    }
};

// Safari version ranges - Updated Dec 2024
const SAFARI_VERSIONS = {
    min: 17,
    max: 18,
    getVersion() {
        const major = Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
        const minor = Math.floor(Math.random() * 3); // Safari minor versions are 0-2 typically
        return `${major}.${minor}`;
    }
};

// Operating systems with realistic version distributions - Updated Dec 2024
// Note: Windows 11 still reports as "Windows NT 10.0" in UA strings
const OS_CONFIGS = {
    windows: {
        versions: ['10.0'],  // Both Win10 and Win11 use NT 10.0
        weights: [1.0],
        platform: 'Win64; x64'
    },
    macos: {
        versions: ['12_0', '13_0', '14_0', '14_4', '15_0', '15_1'],
        weights: [0.05, 0.15, 0.25, 0.20, 0.20, 0.15],
        platform: 'Intel Mac OS X'
    },
    linux: {
        versions: ['x86_64'],
        weights: [1],
        platform: 'Linux x86_64'
    },
    ios: {
        versions: ['17_4', '17_6', '18_0', '18_1'],
        weights: [0.15, 0.25, 0.30, 0.30],
        devices: ['iPhone', 'iPad']
    },
    android: {
        versions: ['13', '14', '15'],
        weights: [0.20, 0.50, 0.30],
        devices: ['SM-S928B', 'SM-S918B', 'Pixel 8', 'Pixel 8 Pro', 'Pixel 9']
    }
};

// Screen resolutions
const SCREEN_RESOLUTIONS = [
    { width: 1920, height: 1080, weight: 0.35 },
    { width: 1366, height: 768, weight: 0.15 },
    { width: 1536, height: 864, weight: 0.12 },
    { width: 1440, height: 900, weight: 0.10 },
    { width: 2560, height: 1440, weight: 0.10 },
    { width: 1680, height: 1050, weight: 0.08 },
    { width: 1280, height: 720, weight: 0.10 }
];

// Mobile resolutions
const MOBILE_RESOLUTIONS = [
    { width: 390, height: 844, weight: 0.25 },  // iPhone 14
    { width: 393, height: 852, weight: 0.20 },  // iPhone 15
    { width: 412, height: 915, weight: 0.20 },  // Samsung Galaxy
    { width: 360, height: 800, weight: 0.15 },
    { width: 414, height: 896, weight: 0.20 }
];

// Timezone offsets (minutes)
const TIMEZONES = [
    { offset: -480, name: 'America/Los_Angeles', weight: 0.15 },
    { offset: -420, name: 'America/Denver', weight: 0.08 },
    { offset: -360, name: 'America/Chicago', weight: 0.12 },
    { offset: -300, name: 'America/New_York', weight: 0.20 },
    { offset: 0, name: 'Europe/London', weight: 0.10 },
    { offset: 60, name: 'Europe/Paris', weight: 0.08 },
    { offset: 120, name: 'Europe/Berlin', weight: 0.07 },
    { offset: 330, name: 'Asia/Kolkata', weight: 0.10 },
    { offset: 480, name: 'Asia/Singapore', weight: 0.05 },
    { offset: 540, name: 'Asia/Tokyo', weight: 0.05 }
];

// Languages
const LANGUAGES = [
    { code: 'en-US', weight: 0.45 },
    { code: 'en-GB', weight: 0.15 },
    { code: 'en-CA', weight: 0.08 },
    { code: 'en-AU', weight: 0.05 },
    { code: 'de-DE', weight: 0.07 },
    { code: 'fr-FR', weight: 0.06 },
    { code: 'es-ES', weight: 0.05 },
    { code: 'pt-BR', weight: 0.04 },
    { code: 'ja-JP', weight: 0.03 },
    { code: 'zh-CN', weight: 0.02 }
];

class FingerprintGenerator {
    /**
     * Weighted random selection
     */
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i];
        }
        return items[items.length - 1];
    }

    /**
     * Generate random hex string
     */
    randomHex(length) {
        let result = '';
        const chars = '0123456789abcdef';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate random alphanumeric string
     */
    randomAlphanumeric(length) {
        let result = '';
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate Chrome User-Agent
     */
    generateChromeUA(os = 'windows') {
        const chromeVersion = CHROME_VERSIONS.getVersion();
        const safariVersion = '537.36';
        
        switch (os) {
            case 'windows': {
                const winVersion = this.weightedRandom(
                    OS_CONFIGS.windows.versions,
                    OS_CONFIGS.windows.weights
                );
                return `Mozilla/5.0 (Windows NT ${winVersion}; Win64; x64) AppleWebKit/${safariVersion} (KHTML, like Gecko) Chrome/${chromeVersion} Safari/${safariVersion}`;
            }
            case 'macos': {
                const macVersion = this.weightedRandom(
                    OS_CONFIGS.macos.versions,
                    OS_CONFIGS.macos.weights
                );
                return `Mozilla/5.0 (Macintosh; Intel Mac OS X ${macVersion}) AppleWebKit/${safariVersion} (KHTML, like Gecko) Chrome/${chromeVersion} Safari/${safariVersion}`;
            }
            case 'linux':
                return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/${safariVersion} (KHTML, like Gecko) Chrome/${chromeVersion} Safari/${safariVersion}`;
            case 'android': {
                const androidVersion = this.weightedRandom(
                    OS_CONFIGS.android.versions,
                    OS_CONFIGS.android.weights
                );
                const device = OS_CONFIGS.android.devices[Math.floor(Math.random() * OS_CONFIGS.android.devices.length)];
                return `Mozilla/5.0 (Linux; Android ${androidVersion}; ${device}) AppleWebKit/${safariVersion} (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/${safariVersion}`;
            }
            default:
                return this.generateChromeUA('windows');
        }
    }

    /**
     * Generate Firefox User-Agent
     */
    generateFirefoxUA(os = 'windows') {
        const firefoxVersion = FIREFOX_VERSIONS.getVersion();
        
        switch (os) {
            case 'windows': {
                const winVersion = this.weightedRandom(
                    OS_CONFIGS.windows.versions,
                    OS_CONFIGS.windows.weights
                );
                return `Mozilla/5.0 (Windows NT ${winVersion}; Win64; x64; rv:${firefoxVersion}) Gecko/20100101 Firefox/${firefoxVersion}`;
            }
            case 'macos': {
                const macVersion = this.weightedRandom(
                    OS_CONFIGS.macos.versions,
                    OS_CONFIGS.macos.weights
                );
                return `Mozilla/5.0 (Macintosh; Intel Mac OS X ${macVersion}; rv:${firefoxVersion}) Gecko/20100101 Firefox/${firefoxVersion}`;
            }
            case 'linux':
                return `Mozilla/5.0 (X11; Linux x86_64; rv:${firefoxVersion}) Gecko/20100101 Firefox/${firefoxVersion}`;
            default:
                return this.generateFirefoxUA('windows');
        }
    }

    /**
     * Generate Safari User-Agent
     */
    generateSafariUA(os = 'macos') {
        const safariVersion = SAFARI_VERSIONS.getVersion();
        const webkitVersion = '605.1.15';
        
        switch (os) {
            case 'macos': {
                const macVersion = this.weightedRandom(
                    OS_CONFIGS.macos.versions,
                    OS_CONFIGS.macos.weights
                );
                return `Mozilla/5.0 (Macintosh; Intel Mac OS X ${macVersion}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${safariVersion} Safari/${webkitVersion}`;
            }
            case 'ios': {
                const iosVersion = this.weightedRandom(
                    OS_CONFIGS.ios.versions,
                    OS_CONFIGS.ios.weights
                );
                const device = OS_CONFIGS.ios.devices[Math.floor(Math.random() * OS_CONFIGS.ios.devices.length)];
                return `Mozilla/5.0 (${device}; CPU ${device} OS ${iosVersion} like Mac OS X) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Version/${safariVersion} Mobile/15E148 Safari/${webkitVersion}`;
            }
            default:
                return this.generateSafariUA('macos');
        }
    }

    /**
     * Generate random User-Agent with realistic distribution
     */
    generateUserAgent(options = {}) {
        const { browser, os, mobile = false } = options;
        
        // Browser distribution (based on real market share)
        const browsers = ['chrome', 'firefox', 'safari'];
        const browserWeights = [0.65, 0.20, 0.15];
        const selectedBrowser = browser || this.weightedRandom(browsers, browserWeights);
        
        // OS distribution
        const desktopOS = ['windows', 'macos', 'linux'];
        const desktopOSWeights = [0.70, 0.20, 0.10];
        const mobileOS = ['android', 'ios'];
        const mobileOSWeights = [0.55, 0.45];
        
        let selectedOS = os;
        if (!selectedOS) {
            if (mobile) {
                selectedOS = this.weightedRandom(mobileOS, mobileOSWeights);
            } else {
                selectedOS = this.weightedRandom(desktopOS, desktopOSWeights);
            }
        }
        
        switch (selectedBrowser) {
            case 'chrome':
                return this.generateChromeUA(selectedOS);
            case 'firefox':
                return this.generateFirefoxUA(selectedOS);
            case 'safari':
                return this.generateSafariUA(selectedOS === 'ios' ? 'ios' : 'macos');
            default:
                return this.generateChromeUA(selectedOS);
        }
    }

    /**
     * Generate Stripe-specific identifiers
     * Format: Standard UUID v4 (8-4-4-4-12)
     */
    generateStripeIds() {
        const uuid = () => this.randomHex(8) + '-' + this.randomHex(4) + '-4' + this.randomHex(3) + '-' + this.randomHex(4) + '-' + this.randomHex(12);
        return {
            guid: uuid(),
            muid: uuid(),
            sid: uuid()
        };
    }

    /**
     * Generate screen resolution
     */
    generateScreenResolution(mobile = false) {
        const resolutions = mobile ? MOBILE_RESOLUTIONS : SCREEN_RESOLUTIONS;
        const weights = resolutions.map(r => r.weight);
        const resolution = this.weightedRandom(resolutions, weights);
        
        // Add some variation
        const colorDepth = [24, 32][Math.floor(Math.random() * 2)];
        const pixelRatio = mobile 
            ? [2, 3][Math.floor(Math.random() * 2)]
            : [1, 1.25, 1.5, 2][Math.floor(Math.random() * 4)];
        
        return {
            width: resolution.width,
            height: resolution.height,
            availWidth: resolution.width,
            availHeight: resolution.height - Math.floor(Math.random() * 40 + 40), // taskbar
            colorDepth,
            pixelRatio
        };
    }

    /**
     * Generate timezone
     */
    generateTimezone() {
        const weights = TIMEZONES.map(t => t.weight);
        return this.weightedRandom(TIMEZONES, weights);
    }

    /**
     * Generate language preferences
     */
    generateLanguage() {
        const weights = LANGUAGES.map(l => l.weight);
        const primary = this.weightedRandom(LANGUAGES, weights);
        
        // Generate accept-language header
        const languages = [primary.code];
        const baseLang = primary.code.split('-')[0];
        if (!languages.includes(baseLang)) {
            languages.push(baseLang);
        }
        if (baseLang !== 'en') {
            languages.push('en');
        }
        
        return {
            primary: primary.code,
            acceptLanguage: languages.map((l, i) => 
                i === 0 ? l : `${l};q=${(1 - i * 0.1).toFixed(1)}`
            ).join(',')
        };
    }

    /**
     * Generate canvas fingerprint hash (simulated)
     */
    generateCanvasHash() {
        return this.randomHex(32);
    }

    /**
     * Generate WebGL fingerprint data
     */
    generateWebGLData() {
        const vendors = [
            'Google Inc. (NVIDIA)',
            'Google Inc. (Intel)',
            'Google Inc. (AMD)',
            'Google Inc.',
            'Intel Inc.',
            'Apple Inc.'
        ];
        const renderers = [
            'ANGLE (NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)',
            'ANGLE (NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0)',
            'ANGLE (Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
            'ANGLE (AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0)',
            'ANGLE (Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0)',
            'Apple GPU'
        ];
        
        return {
            vendor: vendors[Math.floor(Math.random() * vendors.length)],
            renderer: renderers[Math.floor(Math.random() * renderers.length)]
        };
    }

    /**
     * Generate time on page (realistic browsing behavior)
     */
    generateTimeOnPage() {
        // Between 15-45 seconds with some outliers
        const base = Math.floor(Math.random() * 30000) + 15000;
        const jitter = Math.floor(Math.random() * 5000);
        return base + jitter;
    }

    /**
     * Generate complete browser fingerprint
     */
    generateFingerprint(options = {}) {
        const { mobile = false } = options;
        const userAgent = this.generateUserAgent({ mobile });
        const screen = this.generateScreenResolution(mobile);
        const timezone = this.generateTimezone();
        const language = this.generateLanguage();
        const stripeIds = this.generateStripeIds();
        const webgl = this.generateWebGLData();
        
        return {
            userAgent,
            screen,
            timezone,
            language,
            stripeIds,
            webgl,
            canvasHash: this.generateCanvasHash(),
            timeOnPage: this.generateTimeOnPage(),
            hardwareConcurrency: [2, 4, 8, 12, 16][Math.floor(Math.random() * 5)],
            deviceMemory: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
            platform: mobile ? 'Linux armv8l' : 'Win32',
            cookiesEnabled: true,
            doNotTrack: Math.random() > 0.7 ? '1' : null
        };
    }

    /**
     * Generate HTTP headers from fingerprint
     */
    generateHeaders(fingerprint, options = {}) {
        const { includeSecHeaders = true } = options;
        
        const headers = {
            'User-Agent': fingerprint.userAgent,
            'Accept-Language': fingerprint.language.acceptLanguage,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };
        
        if (includeSecHeaders) {
            headers['Sec-CH-UA'] = this.generateSecCHUA(fingerprint.userAgent);
            headers['Sec-CH-UA-Mobile'] = fingerprint.userAgent.includes('Mobile') ? '?1' : '?0';
            headers['Sec-CH-UA-Platform'] = this.getPlatformFromUA(fingerprint.userAgent);
            headers['Sec-Fetch-Dest'] = 'document';
            headers['Sec-Fetch-Mode'] = 'navigate';
            headers['Sec-Fetch-Site'] = 'none';
            headers['Sec-Fetch-User'] = '?1';
            headers['Upgrade-Insecure-Requests'] = '1';
        }
        
        return headers;
    }

    /**
     * Generate Sec-CH-UA header
     */
    generateSecCHUA(userAgent) {
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        if (chromeMatch) {
            const version = chromeMatch[1];
            return `"Chromium";v="${version}", "Google Chrome";v="${version}", "Not-A.Brand";v="99"`;
        }
        return '"Not-A.Brand";v="99"';
    }

    /**
     * Get platform from User-Agent
     */
    getPlatformFromUA(userAgent) {
        if (userAgent.includes('Windows')) return '"Windows"';
        if (userAgent.includes('Macintosh')) return '"macOS"';
        if (userAgent.includes('Linux') && !userAgent.includes('Android')) return '"Linux"';
        if (userAgent.includes('Android')) return '"Android"';
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return '"iOS"';
        return '"Unknown"';
    }
}

// Singleton instance
export const fingerprintGenerator = new FingerprintGenerator();
export { FingerprintGenerator };
