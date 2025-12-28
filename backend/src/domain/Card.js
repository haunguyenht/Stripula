/**
 * Card entity representing a payment card
 */
export class Card {
    constructor({ number, expMonth, expYear, cvv, originalLine = null }) {
        this.number = number?.replace(/\s/g, '') || '';
        this.expMonth = String(expMonth).padStart(2, '0');
        this.expYear = String(expYear).length === 2 ? `20${expYear}` : String(expYear);
        this.cvv = cvv;
        this.originalLine = originalLine;
    }

    get last4() {
        return this.number.slice(-4);
    }

    get bin() {
        return this.number.slice(0, 6);
    }

    get maskedNumber() {
        return `****${this.last4}`;
    }

    get expiry() {
        return `${this.expMonth}/${this.expYear.slice(-2)}`;
    }

    isValid() {
        return (
            /^\d{13,19}$/.test(this.number) &&
            /^(0[1-9]|1[0-2])$/.test(this.expMonth) &&
            /^\d{4}$/.test(this.expYear) &&
            /^\d{3,4}$/.test(this.cvv)
        );
    }

    toJSON() {
        return {
            number: this.number,
            expMonth: this.expMonth,
            expYear: this.expYear,
            cvv: this.cvv,
            last4: this.last4,
            bin: this.bin
        };
    }

    /**
     * Parse a card from text line (supports number|month|year|cvv format)
     */
    static fromString(line) {
        return Card.fromLine(line);
    }

    /**
     * Parse a card from text line (supports number|month|year|cvv format)
     */
    static fromLine(line) {
        if (!line || typeof line !== 'string') return null;
        const parts = line.split(/[|:,\s]+/).filter(Boolean);
        if (parts.length < 3) return null;

        let number = (parts[0] || '').replace(/\D/g, '');
        let expMonth, expYear, cvv;

        if (parts.length >= 4) {
            expMonth = parts[1];
            expYear = parts[2];
            cvv = parts[3];
        } else if (parts.length === 3) {
            const expiry = parts[1];
            if (expiry.includes('/')) {
                [expMonth, expYear] = expiry.split('/');
            } else if (expiry.length === 4) {
                expMonth = expiry.slice(0, 2);
                expYear = expiry.slice(2, 4);
            } else {
                return null;
            }
            cvv = parts[2];
        }

        const card = new Card({ number, expMonth, expYear, cvv, originalLine: line });
        return card.isValid() ? card : null;
    }

    /**
     * Parse multiple cards from text
     */
    static parseList(text) {
        return text
            .split('\n')
            .filter(line => line.trim() && !line.startsWith('#') && !line.startsWith('//'))
            .map(line => Card.fromLine(line.trim()))
            .filter(card => card !== null);
    }
}
