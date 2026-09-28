import { describe, it, expect } from 'vitest';
import { buildRecipeJsonLd } from '../../src/assets/lib/jsonld.js';

const recipe = {
  id: 'pasta',
  title: 'Pasta',
  servings: 4,
  ingredients: [
    { name: 'Olivenöl', amount: 2, unit: 'EL', step: 1 },
    { name: 'Frühlingszwiebeln', amount: 3, unit: null, step: 1 },
    { name: 'Salz', amount: null, unit: null, step: 2 }
  ]
};

describe('buildRecipeJsonLd', () => {
  it('describes the recipe as schema.org Recipe with its servings as yield', () => {
    const jsonLd = buildRecipeJsonLd(recipe);
    expect(jsonLd['@type']).toBe('Recipe');
    expect(jsonLd.name).toBe('Pasta');
    expect(jsonLd.recipeYield).toBe('4');
  });

  it('lists each ingredient as a "qty name" line, omitting missing quantities', () => {
    expect(buildRecipeJsonLd(recipe).recipeIngredient).toEqual([
      '2 EL Olivenöl',
      '3 Frühlingszwiebeln',
      'Salz'
    ]);
  });

  it('includes the image only when given', () => {
    expect(buildRecipeJsonLd(recipe).image).toBeUndefined();
    expect(buildRecipeJsonLd(recipe, { image: '/a.png' }).image).toBe('/a.png');
  });
});
