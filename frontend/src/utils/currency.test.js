import { describe, it, expect } from 'vitest';
import { CURRENCY_SYMBOLS } from './currency';

describe('Currency Symbols', () => {
    it('should have correct symbols for common currencies', () => {
        expect(CURRENCY_SYMBOLS['AZN']).toBe('₼');
        expect(CURRENCY_SYMBOLS['USD']).toBe('$');
        expect(CURRENCY_SYMBOLS['EUR']).toBe('€');
        expect(CURRENCY_SYMBOLS['TRY']).toBe('₺');
        expect(CURRENCY_SYMBOLS['RUB']).toBe('₽');
        expect(CURRENCY_SYMBOLS['GBP']).toBe('£');
    });

    it('should return undefined for unknown currency', () => {
        expect(CURRENCY_SYMBOLS['UNKNOWN']).toBeUndefined();
    });
});
