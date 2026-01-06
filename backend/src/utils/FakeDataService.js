import { faker, fakerEN_US, fakerEN_GB, fakerEN_CA, fakerEN_AU, fakerDE, fakerFR, fakerNL, fakerES, fakerIT, fakerPT_BR } from '@faker-js/faker';
import axios from 'axios';
import { getStateAbbrev } from './helpers.js';

/**
 * Locale-specific faker instances for country-accurate data
 */
const LOCALE_FAKERS = {
    'en_US': fakerEN_US,
    'en_GB': fakerEN_GB,
    'en_CA': fakerEN_CA,
    'en_AU': fakerEN_AU,
    'de': fakerDE,
    'fr': fakerFR,
    'nl': fakerNL,
    'es': fakerES,
    'it': fakerIT,
    'pt_BR': fakerPT_BR
};

/**
 * Centralized Fake Data Service
 * Single source of truth for generating fake user data across all clients
 * Uses @faker-js/faker for all data generation
 * 
 * NOTE: Gmail is excluded per AGENTS.md - sites block it
 */

/**
 * Popular email domains - NO GMAIL (blocked by most sites)
 */
const EMAIL_DOMAINS = [
    // Microsoft (most trusted)
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
    // Yahoo
    'yahoo.com', 'ymail.com', 
    // Apple
    'icloud.com', 'me.com', 'mac.com',
    // Other major providers
    'aol.com', 'zoho.com', 'mail.com', 'gmx.com', 'gmx.net',
    // European providers
    'web.de', 'freenet.de', 'orange.fr', 'laposte.net',
    // Business-friendly
    'fastmail.com', 'tutanota.com', 'proton.me'
];

/**
 * Country configurations for locale-aware data generation
 */
const COUNTRY_CONFIGS = {
    // North America
    US: { nat: 'us', locale: 'en_US', zipFormat: '#####', phoneFormat: '(###) ###-####' },
    CA: { nat: 'ca', locale: 'en_CA', zipFormat: '?#? #?#', phoneFormat: '(###) ###-####' },

    // Europe
    GB: { nat: 'gb', locale: 'en_GB', zipFormat: '??# #??', phoneFormat: '+44 #### ######' },
    DE: { nat: 'de', locale: 'de', zipFormat: '#####', phoneFormat: '+49 ### #######' },
    FR: { nat: 'fr', locale: 'fr', zipFormat: '#####', phoneFormat: '+33 # ## ## ## ##' },
    NL: { nat: 'nl', locale: 'nl', zipFormat: '#### ??', phoneFormat: '+31 ## ### ####' },
    ES: { nat: 'es', locale: 'es', zipFormat: '#####', phoneFormat: '+34 ### ### ###' },
    IT: { nat: 'it', locale: 'it', zipFormat: '#####', phoneFormat: '+39 ### ### ####' },
    CH: { nat: 'ch', locale: 'de', zipFormat: '####', phoneFormat: '+41 ## ### ## ##' },
    AT: { nat: 'at', locale: 'de', zipFormat: '####', phoneFormat: '+43 ### ### ####' },
    BE: { nat: 'be', locale: 'fr', zipFormat: '####', phoneFormat: '+32 ### ## ## ##' },
    SE: { nat: 'se', locale: 'en_US', zipFormat: '### ##', phoneFormat: '+46 ## ### ## ##' },
    NO: { nat: 'no', locale: 'en_US', zipFormat: '####', phoneFormat: '+47 ## ## ## ##' },
    DK: { nat: 'dk', locale: 'en_US', zipFormat: '####', phoneFormat: '+45 ## ## ## ##' },
    FI: { nat: 'fi', locale: 'en_US', zipFormat: '#####', phoneFormat: '+358 ## ### ####' },
    IE: { nat: 'ie', locale: 'en_GB', zipFormat: '??? ????', phoneFormat: '+353 ## ### ####' },
    PL: { nat: 'pl', locale: 'en_US', zipFormat: '##-###', phoneFormat: '+48 ### ### ###' },
    PT: { nat: 'pt', locale: 'pt_BR', zipFormat: '####-###', phoneFormat: '+351 ### ### ###' },

    // Asia Pacific
    AU: { nat: 'au', locale: 'en_AU', zipFormat: '####', phoneFormat: '+61 # #### ####' },
    NZ: { nat: 'nz', locale: 'en_AU', zipFormat: '####', phoneFormat: '+64 ## ### ####' },
    SG: { nat: 'sg', locale: 'en_US', zipFormat: '######', phoneFormat: '+65 #### ####' },
    MY: { nat: 'my', locale: 'en_US', zipFormat: '#####', phoneFormat: '+60 ## #### ####' },
    JP: { nat: 'jp', locale: 'en_US', zipFormat: '###-####', phoneFormat: '+81 ## #### ####' },
    KR: { nat: 'kr', locale: 'en_US', zipFormat: '#####', phoneFormat: '+82 ## #### ####' },
    HK: { nat: 'hk', locale: 'en_US', zipFormat: '', phoneFormat: '+852 #### ####' },
    TW: { nat: 'tw', locale: 'en_US', zipFormat: '###', phoneFormat: '+886 # #### ####' },
    IN: { nat: 'in', locale: 'en_US', zipFormat: '######', phoneFormat: '+91 ##### #####' },
    TH: { nat: 'th', locale: 'en_US', zipFormat: '#####', phoneFormat: '+66 ## ### ####' },
    PH: { nat: 'ph', locale: 'en_US', zipFormat: '####', phoneFormat: '+63 ### ### ####' },
    ID: { nat: 'id', locale: 'en_US', zipFormat: '#####', phoneFormat: '+62 ### #### ####' },
    VN: { nat: 'vn', locale: 'en_US', zipFormat: '######', phoneFormat: '+84 ## ### ####' },

    // Middle East
    AE: { nat: 'ae', locale: 'en_US', zipFormat: '', phoneFormat: '+971 ## ### ####' },
    SA: { nat: 'sa', locale: 'en_US', zipFormat: '#####', phoneFormat: '+966 ## ### ####' },
    IL: { nat: 'il', locale: 'en_US', zipFormat: '#######', phoneFormat: '+972 ## ### ####' },

    // South America
    BR: { nat: 'br', locale: 'pt_BR', zipFormat: '#####-###', phoneFormat: '+55 ## #####-####' },
    MX: { nat: 'mx', locale: 'es', zipFormat: '#####', phoneFormat: '+52 ## #### ####' },
    AR: { nat: 'ar', locale: 'es', zipFormat: '####', phoneFormat: '+54 ## #### ####' },
    CL: { nat: 'cl', locale: 'es', zipFormat: '#######', phoneFormat: '+56 # #### ####' },
    CO: { nat: 'co', locale: 'es', zipFormat: '######', phoneFormat: '+57 ### ### ####' }
};

/**
 * Phone country prefixes
 */
const PHONE_PREFIXES = {
    US: '+1', CA: '+1', GB: '+44', AU: '+61', NZ: '+64',
    DE: '+49', FR: '+33', NL: '+31', ES: '+34', IT: '+39',
    CH: '+41', AT: '+43', BE: '+32', SE: '+46', NO: '+47',
    DK: '+45', FI: '+358', IE: '+353', PL: '+48', PT: '+351',
    BR: '+55', MX: '+52', AR: '+54', CL: '+56', CO: '+57',
    SG: '+65', MY: '+60', JP: '+81', KR: '+82', HK: '+852',
    TW: '+886', IN: '+91', TH: '+66', PH: '+63', ID: '+62',
    VN: '+84', AE: '+971', SA: '+966', IL: '+972'
};

class FakeDataService {
    /**
     * Get faker instance for locale
     */
    getFaker(locale = 'en_US') {
        return LOCALE_FAKERS[locale] || faker;
    }

    /**
     * Get random element from array using faker
     */
    randomElement(arr) {
        return faker.helpers.arrayElement(arr);
    }

    /**
     * Get random integer between min and max (inclusive) using faker
     */
    randomInt(min, max) {
        return faker.number.int({ min, max });
    }

    /**
     * Generate random email domain (NOT gmail - per AGENTS.md)
     */
    getRandomEmailDomain() {
        return this.randomElement(EMAIL_DOMAINS);
    }

    /**
     * Generate realistic email address using faker names
     * Uses various common email patterns real people use
     */
    generateEmail(firstName = null, lastName = null) {
        const first = (firstName || faker.person.firstName()).toLowerCase().replace(/[^a-z]/g, '');
        const last = (lastName || faker.person.lastName()).toLowerCase().replace(/[^a-z]/g, '');
        const num = this.randomInt(1, 9999);
        const domain = this.getRandomEmailDomain();
        
        // Common email patterns real people use
        const patterns = [
            `${first}.${last}${num}`,           // john.smith123
            `${first}${last}${num}`,            // johnsmith123
            `${first}_${last}${num}`,           // john_smith123
            `${first}${num}`,                   // john123
            `${first[0]}${last}${num}`,         // jsmith123
            `${first}.${last[0]}${num}`,        // john.s123
            `${last}.${first}${num}`,           // smith.john123
            `${first}${last.slice(0, 3)}${num}`,// johnsmi123
            `${last}${first[0]}${num}`,         // smithj123
            `${first}${this.randomInt(1950, 2005)}` // john1985
        ];
        
        return `${this.randomElement(patterns)}@${domain}`;
    }

    /**
     * Generate fake user with full details
     */
    generateFakeUser(countryCode = 'US') {
        const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;
        const localFaker = this.getFaker(config.locale);
        
        const firstName = localFaker.person.firstName();
        const lastName = localFaker.person.lastName();

        return {
            first: firstName,
            last: lastName,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            email: this.generateEmail(firstName, lastName),
            phone: this.generatePhone(countryCode)
        };
    }

    /**
     * Generate random phone number for country using faker
     */
    generatePhone(countryCode = 'US') {
        const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;
        const localFaker = this.getFaker(config.locale);
        
        // Use faker's phone number with country format
        if (config.phoneFormat) {
            return localFaker.phone.number(config.phoneFormat);
        }
        return localFaker.phone.number();
    }

    /**
     * Generate phone number with international prefix
     */
    generatePhoneWithPrefix(countryCode = 'US') {
        const prefix = PHONE_PREFIXES[countryCode] || '+1';
        // Generate 10 digits for the number part
        const digits = faker.string.numeric(10);
        return `${prefix}${digits}`;
    }

    /**
     * Generate random credentials (email + password)
     * Uses faker.js for realistic names with popular email providers
     */
    generateCredentials() {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        
        return {
            email: this.generateEmail(firstName, lastName),
            password: faker.internet.password({ length: 12, memorable: false, prefix: 'Aa1!' })
        };
    }

    /**
     * Generate random birth date using faker
     * Returns adult age (18-55 years old)
     */
    generateBirthDate() {
        const date = faker.date.birthdate({ min: 18, max: 55, mode: 'age' });
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    /**
     * Generate UUID v4 using faker
     */
    generateUUID() {
        return faker.string.uuid();
    }

    /**
     * Generate random postal code for country using faker
     */
    generatePostalCode(countryCode = 'US') {
        const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;
        const localFaker = this.getFaker(config.locale);
        return localFaker.location.zipCode(config.zipFormat);
    }

    /**
     * Generate billing details for Stripe
     * Uses locale-appropriate faker for country-accurate data
     */
    generateBillingDetails(countryCode = 'US') {
        // Normalize and validate country code
        const normalizedCode = (countryCode || 'US').toUpperCase();
        const effectiveCountry = COUNTRY_CONFIGS.hasOwnProperty(normalizedCode) ? normalizedCode : 'US';
        const config = COUNTRY_CONFIGS[effectiveCountry];
        const localFaker = this.getFaker(config.locale);

        const firstName = localFaker.person.firstName();
        const lastName = localFaker.person.lastName();

        return {
            country: effectiveCountry,
            state: effectiveCountry === 'US' 
                ? localFaker.location.state({ abbreviated: true }) 
                : localFaker.location.state(),
            city: localFaker.location.city(),
            line1: localFaker.location.streetAddress(),
            postalCode: localFaker.location.zipCode(config.zipFormat),
            name: `${firstName} ${lastName}`,
            email: this.generateEmail(firstName, lastName)
        };
    }

    /**
     * Generate full address object using faker
     */
    generateAddress(countryCode = 'US') {
        const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;
        const localFaker = this.getFaker(config.locale);

        return {
            line1: localFaker.location.streetAddress(),
            line2: faker.helpers.maybe(() => localFaker.location.secondaryAddress(), { probability: 0.3 }),
            city: localFaker.location.city(),
            state: countryCode === 'US' 
                ? localFaker.location.state({ abbreviated: true }) 
                : localFaker.location.state(),
            postalCode: localFaker.location.zipCode(config.zipFormat),
            country: countryCode
        };
    }

    /**
     * Generate realistic identity matching the card's country
     * Uses randomuser.me API with faker fallback
     */
    async generateRealisticIdentity(countryCode = 'US') {
        const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;

        try {
            const response = await axios.get(`https://randomuser.me/api/1.4/?nat=${config.nat}`, { timeout: 5000 });
            const user = response.data.results[0];

            let state = user.location.state;
            if (countryCode === 'US') {
                state = getStateAbbrev(state);
            }

            let zip = String(user.location.postcode);
            if (countryCode === 'GB' && zip.length > 4) {
                zip = zip.slice(0, -3) + ' ' + zip.slice(-3);
            }

            const firstName = user.name.first;
            const lastName = user.name.last;

            return {
                firstName,
                lastName,
                first: firstName,
                last: lastName,
                fullName: `${firstName} ${lastName}`,
                email: this.generateEmail(firstName, lastName),
                street: `${user.location.street.number} ${user.location.street.name}`,
                line1: `${user.location.street.number} ${user.location.street.name}`,
                city: user.location.city,
                state: state,
                zip: zip,
                postalCode: zip,
                country: countryCode,
                phone: user.phone?.replace(/[^\d+]/g, '') || this.generatePhoneWithPrefix(countryCode)
            };
        } catch (error) {
            // Fallback to faker-based generation
            return this.generateFallbackIdentity(countryCode);
        }
    }

    /**
     * Generate fallback identity using faker (when API fails)
     */
    generateFallbackIdentity(countryCode = 'US') {
        const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;
        const localFaker = this.getFaker(config.locale);

        const firstName = localFaker.person.firstName();
        const lastName = localFaker.person.lastName();
        const zip = localFaker.location.zipCode(config.zipFormat);
        const street = localFaker.location.streetAddress();

        return {
            firstName,
            lastName,
            first: firstName,
            last: lastName,
            fullName: `${firstName} ${lastName}`,
            email: this.generateEmail(firstName, lastName),
            street,
            line1: street,
            city: localFaker.location.city(),
            state: countryCode === 'US' 
                ? localFaker.location.state({ abbreviated: true }) 
                : localFaker.location.state(),
            zip: zip,
            postalCode: zip,
            country: countryCode,
            phone: this.generatePhoneWithPrefix(countryCode)
        };
    }

    /**
     * Generate identity matching BIN data
     */
    async generateIdentityForBin(binData) {
        const countryCode = binData?.countryCode || 'US';
        return this.generateRealisticIdentity(countryCode);
    }

    /**
     * Generate company/business name using faker
     */
    generateCompanyName() {
        return faker.company.name();
    }

    /**
     * Generate credit card holder name (for display)
     */
    generateCardholderName() {
        return faker.person.fullName().toUpperCase();
    }

    /**
     * Generate random user agent string
     */
    generateUserAgent() {
        return faker.internet.userAgent();
    }

    /**
     * Generate IP address
     */
    generateIPAddress() {
        return faker.internet.ip();
    }
}

export const fakeDataService = new FakeDataService();
export default fakeDataService;
