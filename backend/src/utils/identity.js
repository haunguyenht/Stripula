import { faker } from '@faker-js/faker';
import axios from 'axios';
import { getStateAbbrev } from './helpers.js';

/**
 * Generate realistic identity from randomuser.me API
 * @returns {Promise<Object>}
 */
export async function generateRealisticIdentity() {
    try {
        const response = await axios.get('https://randomuser.me/api/1.4/?nat=us', { timeout: 5000 });
        const user = response.data.results[0];
        
        const stateAbbrev = getStateAbbrev(user.location.state);
        
        return {
            firstName: user.name.first,
            lastName: user.name.last,
            fullName: `${user.name.first} ${user.name.last}`,
            email: `${user.login.username}${Math.floor(Math.random() * 999)}@gmail.com`,
            street: `${user.location.street.number} ${user.location.street.name}`,
            city: user.location.city,
            state: stateAbbrev,
            zip: String(user.location.postcode),
            country: 'US',
            phone: user.phone
        };
    } catch (error) {
        console.log(`[Identity] randomuser.me failed, using faker: ${error.message}`);
        return generateFallbackIdentity();
    }
}

/**
 * Generate fallback identity using faker
 * @returns {Object}
 */
export function generateFallbackIdentity() {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@gmail.com`,
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode('#####'),
        country: 'US',
        phone: faker.phone.number()
    };
}

/**
 * Generate random billing details (for AVS)
 * @returns {{zip: string, country: string}}
 */
export function generateBillingDetails() {
    const countries = ['US', 'GB', 'CA', 'AU'];
    const country = countries[Math.floor(Math.random() * countries.length)];
    
    let zip;
    switch (country) {
        case 'US': zip = faker.location.zipCode('#####'); break;
        case 'GB': zip = faker.location.zipCode('??# #??'); break;
        case 'CA': zip = faker.location.zipCode('?#? #?#'); break;
        case 'AU': zip = faker.location.zipCode('####'); break;
        default: zip = faker.location.zipCode();
    }
    
    return { zip, country };
}
