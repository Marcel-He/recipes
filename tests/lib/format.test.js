import { describe, it, expect } from 'vitest';
import { formatQuantity, formatIngredientParenthetical } from '../../src/assets/lib/format.js';

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

describe('formatIngredientParenthetical', () => {
  it('combines name and quantity in parentheses', () => {
    expect(formatIngredientParenthetical({ name: 'Paprika', amount: 300, unit: 'g' })).toBe('Paprika (300 g)');
  });

  it('returns just the name when there is no quantity', () => {
    expect(formatIngredientParenthetical({ name: 'Joghurt', amount: null, unit: null })).toBe('Joghurt');
  });

  it('returns just the name when amount is 0', () => {
    expect(formatIngredientParenthetical({ name: 'Salz', amount: 0, unit: 'Prise' })).toBe('Salz');
  });
});
