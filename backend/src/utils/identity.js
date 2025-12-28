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

function getFaker(locale = 'en_US') {
    return LOCALE_FAKERS[locale] || faker;
}

// Country-specific identity generators
const COUNTRY_CONFIGS = {
    US: {
        nat: 'us',
        locale: 'en_US',
        zipFormat: '#####',
        phoneFormat: '(###) ###-####'
    },
    GB: {
        nat: 'gb',
        locale: 'en_GB',
        zipFormat: '??# #??',
        phoneFormat: '+44 #### ######'
    },
    CA: {
        nat: 'ca',
        locale: 'en_CA',
        zipFormat: '?#? #?#',
        phoneFormat: '(###) ###-####'
    },
    AU: {
        nat: 'au',
        locale: 'en_AU',
        zipFormat: '####',
        phoneFormat: '+61 # #### ####'
    },
    DE: {
        nat: 'de',
        locale: 'de',
        zipFormat: '#####',
        phoneFormat: '+49 ### #######'
    },
    FR: {
        nat: 'fr',
        locale: 'fr',
        zipFormat: '#####',
        phoneFormat: '+33 # ## ## ## ##'
    },
    NL: {
        nat: 'nl',
        locale: 'nl',
        zipFormat: '#### ??',
        phoneFormat: '+31 ## ### ####'
    },
    ES: {
        nat: 'es',
        locale: 'es',
        zipFormat: '#####',
        phoneFormat: '+34 ### ### ###'
    },
    IT: {
        nat: 'it',
        locale: 'it',
        zipFormat: '#####',
        phoneFormat: '+39 ### ### ####'
    },
    BR: {
        nat: 'br',
        locale: 'pt_BR',
        zipFormat: '#####-###',
        phoneFormat: '+55 ## #####-####'
    }
};

/**
 * Generate realistic identity matching the card's country
 * @param {string} countryCode - ISO 2-letter country code (from BIN lookup)
 * @returns {Promise<Object>}
 */
export async function generateRealisticIdentity(countryCode = 'US') {
    const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;

    try {
        const response = await axios.get(`https://randomuser.me/api/1.4/?nat=${config.nat}`, { timeout: 5000 });
        const user = response.data.results[0];

        let state = user.location.state;
        if (countryCode === 'US') {
            state = getStateAbbrev(state);
        }

        // Format zip based on country
        let zip = String(user.location.postcode);
        if (countryCode === 'GB' && zip.length > 4) {
            zip = zip.slice(0, -3) + ' ' + zip.slice(-3);
        }

        return {
            firstName: user.name.first,
            lastName: user.name.last,
            fullName: `${user.name.first} ${user.name.last}`,
            email: `${user.login.username}${Math.floor(Math.random() * 999)}@gmail.com`,
            street: `${user.location.street.number} ${user.location.street.name}`,
            city: user.location.city,
            state: state,
            zip: zip,
            country: countryCode,
            phone: user.phone?.replace(/[^\d+]/g, '') || generatePhoneForCountry(countryCode)
        };
    } catch (error) {
        return generateFallbackIdentity(countryCode);
    }
}

/**
 * Generate fallback identity using faker
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {Object}
 */
export function generateFallbackIdentity(countryCode = 'US') {
    const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.US;
    const localFaker = getFaker(config.locale);

    const firstName = localFaker.person.firstName();
    const lastName = localFaker.person.lastName();

    // Use non-gmail domains per AGENTS.md
    const domains = ['outlook.com', 'yahoo.com', 'hotmail.com', 'protonmail.com', 'icloud.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];

    return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@${domain}`,
        street: localFaker.location.streetAddress(),
        city: localFaker.location.city(),
        state: countryCode === 'US' ? localFaker.location.state({ abbreviated: true }) : localFaker.location.state(),
        zip: localFaker.location.zipCode(config.zipFormat),
        country: countryCode,
        phone: generatePhoneForCountry(countryCode)
    };
}

/**
 * Generate phone number for country
 * @param {string} countryCode 
 * @returns {string}
 */
function generatePhoneForCountry(countryCode) {
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
 * Generate identity matching BIN data
 * @param {Object} binData - BIN lookup data with countryCode
 * @returns {Promise<Object>}
 */
export async function generateIdentityForBin(binData) {
    const countryCode = binData?.countryCode || 'US';
    return generateRealisticIdentity(countryCode);
}

/**
 * Generate random billing details (for AVS)
 * @returns {{zip: string, country: string}}
 */
export function generateBillingDetails() {
    const countries = ['US', 'GB', 'CA', 'AU'];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const config = COUNTRY_CONFIGS[country] || COUNTRY_CONFIGS.US;
    const localFaker = getFaker(config.locale);

    const zip = localFaker.location.zipCode(config.zipFormat);

    return { zip, country };
}
