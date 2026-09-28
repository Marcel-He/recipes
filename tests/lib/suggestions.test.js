import { describe, it, expect } from 'vitest';
import { baseIngredient, baseIngredients, suggestRecipes } from '../../src/assets/lib/suggestions.js';

describe('baseIngredient', () => {
  it('drops the parenthesised notes', () => {
    expect(baseIngredient('Kartoffeln (mehlig kochend)')).toBe('Kartoffeln');
    expect(baseIngredient('Zwiebeln')).toBe('Zwiebeln');
  });
});

describe('baseIngredients', () => {
  it('dedupes bases and skips pantry staples', () => {
    expect(baseIngredients([
      { name: 'Kartoffeln (mehlig kochend)' },
      { name: 'Kartoffeln' },
      { name: 'Salz (grob)' },
      { name: 'Pfeffer (schwarz)' },
      { name: 'Olivenöl' },
      { name: 'Butter' },
      { name: 'Feta' }
    ])).toEqual(['Kartoffeln', 'Feta']);
  });
});

describe('suggestRecipes', () => {
  const pueree = { id: 'pueree', title: 'Püree', ingredients: ['Kartoffeln', 'Butter', 'Milch'] };
  const tortilla = { id: 'tortilla', title: 'Tortilla', ingredients: ['Kartoffeln', 'Eier', 'Zwiebeln'] };
  const gratin = { id: 'gratin', title: 'Gratin', ingredients: ['Kartoffeln', 'Milch', 'Butter'] };
  const salat = { id: 'salat', title: 'Salat', ingredients: ['Feldsalat'] };
  const all = [pueree, tortilla, gratin, salat];

  it('ranks unplanned recipes by shared base ingredients', () => {
    const result = suggestRecipes([pueree], all);
    expect(result.map(s => s.recipe.id)).toEqual(['gratin', 'tortilla']);
    expect(result[0].shared).toEqual(['Kartoffeln', 'Milch', 'Butter']);
    expect(result[1].shared).toEqual(['Kartoffeln']);
  });

  it('never suggests planned recipes or ones with nothing in common', () => {
    const ids = suggestRecipes([pueree], all).map(s => s.recipe.id);
    expect(ids).not.toContain('pueree');
    expect(ids).not.toContain('salat');
  });

  it('returns nothing for an empty plan', () => {
    expect(suggestRecipes([], all)).toEqual([]);
  });

  it('respects the limit', () => {
    expect(suggestRecipes([pueree], all, 1)).toHaveLength(1);
  });
});
