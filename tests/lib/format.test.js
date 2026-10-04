import { describe, it, expect } from 'vitest';
import { formatQuantity } from '../../src/assets/lib/format.js';

describe('formatQuantity', () => {
  it('combines amount and unit', () => {
    expect(formatQuantity({ amount: 0.75, unit: 'TL' })).toBe('0.75 TL');
  });

  it('returns just the amount when there is no unit', () => {
    expect(formatQuantity({ amount: 4, unit: null })).toBe('4');
  });

  it('returns empty string when amount is null', () => {
    expect(formatQuantity({ amount: null, unit: null })).toBe('');
  });

  it('returns empty string when amount is null even if a unit is set', () => {
    expect(formatQuantity({ amount: null, unit: 'Prise' })).toBe('');
  });

  it('returns empty string when amount is 0', () => {
    expect(formatQuantity({ amount: 0, unit: 'g' })).toBe('');
  });
});
