import { faker, fakerEN_US, fakerEN_GB, fakerEN_CA, fakerEN_AU, fakerDE, fakerFR, fakerNL, fakerES, fakerIT, fakerPT_BR } from '@faker-js/faker';
import axios from 'axios';
import { getStateAbbrev } from './helpers.js';

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
 * Uses @faker-js/faker and randomuser.me API
 */

const EMAIL_DOMAINS = ['outlook.com', 'yahoo.com', 'hotmail.com', 'protonmail.com', 'icloud.com'];

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

class FakeDataService {
    /**
     * Get faker instance for locale
     */
    getFaker(locale = 'en_US') {
        return LOCALE_FAKERS[locale] || faker;
    }

    /**
     * Get random element from array
     */
    randomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Get random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate random email domain (NOT gmail - per AGENTS.md)
     */
    getRandomEmailDomain() {
        return this.randomElement(EMAIL_DOMAINS);
    }

    /**
     * Generate fake user with first/last name
     */
    generateFakeUser() {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const rand = this.randomInt(1000, 9999);
        const domain = this.getRandomEmailDomain();

        return {
            first: firstName,
            last: lastName,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}${rand}@${domain}`,
            phone: this.generatePhone()
        };
    }

    /**
     * Generate random phone number (US format)
     */
    generatePhone() {
        const area = this.randomInt(200, 999);
        const prefix = this.randomInt(200, 999);
        const line = this.randomInt(1000, 9999);
        return `${area}${prefix}${line}`;
    }

    /**
     * Generate phone number for specific country
     */
    generatePhoneForCountry(countryCode) {
        const prefixes = {
            US: '+1', GB: '+44', CA: '+1', AU: '+61',
            DE: '+49', FR: '+33', NL: '+31', ES: '+34',
            IT: '+39', BR: '+55'
        };
        const prefix = prefixes[countryCode] || '+1';
        const digits = Array(10).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
        return `${prefix}${digits}`;
    }

    /**
     * Generate random credentials (email + password)
     */
    generateCredentials() {
        const user = `user${this.randomInt(1000, 9999)}`;
        const domain = this.getRandomEmailDomain();
        return {
            email: `${user}@${domain}`,
            password: `Pass${this.randomInt(10000, 99999)}!`
        };
    }

    /**
     * Generate random birth date
     */
    generateBirthDate() {
        const year = this.randomInt(1970, 1999);
        const month = String(this.randomInt(1, 12)).padStart(2, '0');
        const day = String(this.randomInt(1, 28)).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Generate UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Generate random postal code
     */
    generatePostalCode(countryCode = 'US') {
        const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;
        const localFaker = this.getFaker(config.locale);
        return localFaker.location.zipCode(config.zipFormat);
    }

    /**
     * Generate billing details for Stripe
     * Falls back to US if country code is unknown/unsupported
     */
    generateBillingDetails(countryCode = 'US') {
        const user = this.generateFakeUser();

        // Normalize and validate country code
        const normalizedCode = (countryCode || 'US').toUpperCase();
        const hasConfig = COUNTRY_CONFIGS.hasOwnProperty(normalizedCode);

        // Use the config or fallback to US
        const effectiveCountry = hasConfig ? normalizedCode : 'US';
        const config = COUNTRY_CONFIGS[effectiveCountry];
        const localFaker = this.getFaker(config.locale);

        return {
            country: effectiveCountry, // Use effective country, not original (for AVS consistency)
            state: effectiveCountry === 'US' ? localFaker.location.state({ abbreviated: true }) : localFaker.location.state(),
            city: localFaker.location.city(),
            line1: localFaker.location.streetAddress(),
            postalCode: localFaker.location.zipCode(config.zipFormat),
            name: user.fullName,
            email: user.email
        };
    }

    /**
     * Generate address object
     */
    generateAddress(countryCode = 'US') {
        const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;
        const localFaker = this.getFaker(config.locale);

        return {
            line1: localFaker.location.streetAddress(),
            city: localFaker.location.city(),
            state: countryCode === 'US' ? localFaker.location.state({ abbreviated: true }) : localFaker.location.state(),
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

            return {
                firstName: user.name.first,
                lastName: user.name.last,
                first: user.name.first,
                last: user.name.last,
                fullName: `${user.name.first} ${user.name.last}`,
                email: `${user.login.username}${this.randomInt(100, 999)}@${this.getRandomEmailDomain()}`,
                street: `${user.location.street.number} ${user.location.street.name}`,
                line1: `${user.location.street.number} ${user.location.street.name}`,
                city: user.location.city,
                state: state,
                zip: zip,
                postalCode: zip,
                country: countryCode,
                phone: user.phone?.replace(/[^\d+]/g, '') || this.generatePhoneForCountry(countryCode)
            };
        } catch (error) {
            return this.generateFallbackIdentity(countryCode);
        }
    }

    /**
     * Generate fallback identity using faker
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
            email: `${firstName.toLowerCase()}${lastName.toLowerCase()}${this.randomInt(100, 999)}@${this.getRandomEmailDomain()}`,
            street,
            line1: street,
            city: localFaker.location.city(),
            state: countryCode === 'US' ? localFaker.location.state({ abbreviated: true }) : localFaker.location.state(),
            zip: zip,
            postalCode: zip,
            country: countryCode,
            phone: this.generatePhoneForCountry(countryCode)
        };
    }

    /**
     * Generate identity matching BIN data
     */
    async generateIdentityForBin(binData) {
        const countryCode = binData?.countryCode || 'US';
        return this.generateRealisticIdentity(countryCode);
    }
}

export const fakeDataService = new FakeDataService();
export default fakeDataService;
