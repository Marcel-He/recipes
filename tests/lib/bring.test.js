import { describe, it, expect } from 'vitest';
import { buildBringImportUrl, recipePageUrl } from '../../src/assets/lib/bring.js';

describe('buildBringImportUrl', () => {
  it('returns the official Bring recipe-import deeplink', () => {
    const url = buildBringImportUrl('https://example.com/recipes/pasta/', 4);
    expect(url.startsWith('https://api.getbring.com/rest/bringrecipes/deeplink?')).toBe(true);
    expect(new URL(url).searchParams.get('source')).toBe('web');
  });

  it('points the deeplink at the recipe page itself', () => {
    const url = buildBringImportUrl('https://example.com/recipes/pasta/', 4);
    expect(new URL(url).searchParams.get('url')).toBe('https://example.com/recipes/pasta/');
  });

  it('defaults the requested servings to the recipe servings', () => {
    const params = new URL(buildBringImportUrl('https://example.com/recipes/pasta/', 4)).searchParams;
    expect(params.get('baseQuantity')).toBe('4');
    expect(params.get('requestedQuantity')).toBe('4');
  });

  it('passes scaled servings as the requested quantity', () => {
    const params = new URL(buildBringImportUrl('https://example.com/recipes/pasta/', 4, 6)).searchParams;
    expect(params.get('baseQuantity')).toBe('4');
    expect(params.get('requestedQuantity')).toBe('6');
  });

  it('omits quantities when the recipe has no servings', () => {
    const params = new URL(buildBringImportUrl('https://example.com/recipes/pasta/')).searchParams;
    expect(params.has('baseQuantity')).toBe(false);
    expect(params.has('requestedQuantity')).toBe(false);
  });
});

describe('recipePageUrl', () => {
  it('builds the public recipe page URL', () => {
    expect(recipePageUrl('https://example.com', 'haehnchen-piccata')).toBe('https://example.com/recipes/haehnchen-piccata/');
  });
});
