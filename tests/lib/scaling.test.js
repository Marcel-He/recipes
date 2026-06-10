import { describe, it, expect } from 'vitest';
import { scaleIngredients } from '../../src/assets/lib/scaling.js';

describe('scaleIngredients', () => {
  const base = [
    { name: 'Flour', amount: 200, unit: 'g', step: 1 },
    { name: 'Milk', amount: 100, unit: 'ml', step: 1 }
  ];

  it('doubles amounts when target is 2x base', () => {
    const result = scaleIngredients(base, 2, 4);
    expect(result[0].amount).toBe(400);
    expect(result[1].amount).toBe(200);
  });

  it('halves amounts when target is half of base', () => {
    const result = scaleIngredients(base, 4, 2);
    expect(result[0].amount).toBe(100);
    expect(result[1].amount).toBe(50);
  });

  it('preserves all other fields', () => {
    const result = scaleIngredients(base, 2, 4);
    expect(result[0].name).toBe('Flour');
    expect(result[0].unit).toBe('g');
    expect(result[0].step).toBe(1);
  });

  it('does not mutate the original array', () => {
    scaleIngredients(base, 2, 4);
    expect(base[0].amount).toBe(200);
  });

  it('rounds to one decimal place', () => {
    const result = scaleIngredients([{ name: 'Oil', amount: 1, unit: 'tbsp', step: 1 }], 3, 2);
    expect(result[0].amount).toBe(0.7);
  });
});
