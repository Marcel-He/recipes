import { describe, it, expect } from 'vitest';
import { aggregateIngredients } from '../../src/assets/lib/aggregator.js';

describe('aggregateIngredients', () => {
  it('merges the same ingredient from two recipes', () => {
    const recipes = [
      { ingredients: [{ name: 'Salt', amount: 1, unit: 'tsp' }] },
      { ingredients: [{ name: 'Salt', amount: 2, unit: 'tsp' }] }
    ];
    const result = aggregateIngredients(recipes);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(3);
  });

  it('keeps same ingredient in different units as separate entries', () => {
    const recipes = [
      { ingredients: [{ name: 'Milk', amount: 200, unit: 'ml' }] },
      { ingredients: [{ name: 'Milk', amount: 1, unit: 'cup' }] }
    ];
    const result = aggregateIngredients(recipes);
    expect(result).toHaveLength(2);
  });

  it('handles a single recipe', () => {
    const result = aggregateIngredients([
      { ingredients: [{ name: 'Flour', amount: 200, unit: 'g' }] }
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Flour');
  });

  it('returns empty array for empty input', () => {
    expect(aggregateIngredients([])).toEqual([]);
  });

  it('keeps amount null when merging two ingredients without an amount', () => {
    const recipes = [
      { ingredients: [{ name: 'Balsamico-Creme', amount: null, unit: null }] },
      { ingredients: [{ name: 'Balsamico-Creme', amount: null, unit: null }] }
    ];
    const result = aggregateIngredients(recipes);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBeNull();
  });

  it('sums a known amount with a missing one instead of losing it', () => {
    const recipes = [
      { ingredients: [{ name: 'Salz', amount: 1, unit: 'TL' }] },
      { ingredients: [{ name: 'Salz', amount: null, unit: 'TL' }] }
    ];
    const result = aggregateIngredients(recipes);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(1);
  });
});
