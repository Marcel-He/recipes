import { describe, it, expect } from 'vitest';
import { buildBringImportUrl } from '../../src/assets/lib/bring.js';

describe('buildBringImportUrl', () => {
  it('returns the official Bring recipe-import deeplink', () => {
    const url = buildBringImportUrl('https://example.com', [{ name: 'Milk', amount: 1, unit: 'l' }]);
    expect(url.startsWith('https://api.getbring.com/rest/bringrecipes/deeplink?url=')).toBe(true);
    expect(url).toContain('source=web');
  });

  it('points the deeplink at our own planner-recipe endpoint', () => {
    const url = buildBringImportUrl('https://example.com', [{ name: 'Milk', amount: 1, unit: 'l' }]);
    const target = new URL(url).searchParams.get('url');
    expect(target.startsWith('https://example.com/api/planner-recipe?data=')).toBe(true);
  });

  it('encodes the ingredient list into the recipe-page URL', () => {
    const ingredients = [{ name: 'Olive oil', amount: 2, unit: 'tbsp' }];
    const url = buildBringImportUrl('https://example.com', ingredients);
    const target = new URL(new URL(url).searchParams.get('url'));
    const data = JSON.parse(target.searchParams.get('data'));
    expect(data).toEqual(ingredients);
  });

  it('returns a valid URL for an empty ingredient list', () => {
    const url = buildBringImportUrl('https://example.com', []);
    expect(() => new URL(url)).not.toThrow();
  });
});
