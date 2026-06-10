import { describe, it, expect } from 'vitest';
import { groupIngredientsByStep } from '../../src/assets/lib/steps.js';

describe('groupIngredientsByStep', () => {
  const ingredients = [
    { name: 'Beef', amount: 500, unit: 'g', step: 1 },
    { name: 'Oil', amount: 2, unit: 'tbsp', step: 1 },
    { name: 'Passata', amount: 400, unit: 'ml', step: 2 },
    { name: 'Spaghetti', amount: 320, unit: 'g', step: 3 }
  ];

  it('groups ingredients by step number', () => {
    const result = groupIngredientsByStep(ingredients);
    expect(result[1]).toHaveLength(2);
    expect(result[2]).toHaveLength(1);
    expect(result[3]).toHaveLength(1);
  });

  it('places ingredients with no step under key 0', () => {
    const result = groupIngredientsByStep([{ name: 'Salt', amount: 1, unit: 'tsp' }]);
    expect(result[0]).toHaveLength(1);
  });

  it('does not mutate the input array', () => {
    groupIngredientsByStep(ingredients);
    expect(ingredients).toHaveLength(4);
  });
});
