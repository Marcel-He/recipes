import { describe, it, expect } from 'vitest';
import { formatQuantity, formatIngredient } from '../../src/assets/lib/format.js';

describe('formatQuantity', () => {
  it('formats amount and unit together', () => {
    expect(formatQuantity({ amount: 2, unit: 'tbsp' })).toBe('2 tbsp');
  });

  it('formats amount alone when unit is missing', () => {
    expect(formatQuantity({ amount: 2, unit: null })).toBe('2');
  });

  it('formats unit alone when amount is missing', () => {
    expect(formatQuantity({ amount: null, unit: 'Prise' })).toBe('Prise');
  });

  it('returns null when both amount and unit are missing', () => {
    expect(formatQuantity({ amount: null, unit: null })).toBeNull();
  });

  it('treats a zero amount as missing', () => {
    expect(formatQuantity({ amount: 0, unit: null })).toBeNull();
    expect(formatQuantity({ amount: 0, unit: 'Prise' })).toBe('Prise');
  });
});

describe('formatIngredient', () => {
  it('includes the quantity when present', () => {
    expect(formatIngredient({ name: 'Milk', amount: 1, unit: 'l' })).toBe('Milk: 1 l');
  });

  it('falls back to just the name when amount and unit are missing', () => {
    expect(formatIngredient({ name: 'Balsamico-Creme', amount: null, unit: null })).toBe(
      'Balsamico-Creme'
    );
  });

  it('shows the unit alone when only it is known', () => {
    expect(formatIngredient({ name: 'Salz', amount: null, unit: 'Prise' })).toBe('Salz: Prise');
  });
});
