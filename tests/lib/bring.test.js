import { describe, it, expect } from 'vitest';
import { inflateRawSync } from 'node:zlib';
import { buildBringImportUrl, BRING_MAX_URL_LENGTH } from '../../src/assets/lib/bring.js';

function decodeLines(url) {
  const target = new URL(new URL(url).searchParams.get('url'));
  return inflateRawSync(Buffer.from(target.searchParams.get('z'), 'base64url')).toString('utf8').split('\n');
}

describe('buildBringImportUrl', () => {
  it('returns the official Bring recipe-import deeplink', async () => {
    const url = await buildBringImportUrl('https://example.com', [{ name: 'Milk', amount: 1, unit: 'l' }]);
    expect(url.startsWith('https://api.getbring.com/rest/bringrecipes/deeplink?url=')).toBe(true);
    expect(url).toContain('source=web');
  });

  it('points the deeplink at our own planner-recipe endpoint', async () => {
    const url = await buildBringImportUrl('https://example.com', [{ name: 'Milk', amount: 1, unit: 'l' }]);
    const target = new URL(url).searchParams.get('url');
    expect(target.startsWith('https://example.com/api/planner-recipe?z=')).toBe(true);
  });

  it('encodes the ingredient list into the recipe-page URL', async () => {
    const ingredients = [{ name: 'Olive oil', amount: 2, unit: 'tbsp' }];
    const url = await buildBringImportUrl('https://example.com', ingredients);
    expect(decodeLines(url)).toEqual(['2 tbsp Olive oil']);
  });

  it('returns a valid URL for an empty ingredient list', async () => {
    const url = await buildBringImportUrl('https://example.com', []);
    expect(() => new URL(url)).not.toThrow();
  });

  it('omits missing quantities and keeps non-ASCII names intact', async () => {
    const url = await buildBringImportUrl('https://example.com', [
      { name: 'Salz', amount: null, unit: null },
      { name: 'Frühlingszwiebeln', amount: 3, unit: null }
    ]);
    expect(decodeLines(url)).toEqual(['Salz', '3 Frühlingszwiebeln']);
  });

  it('keeps a typical weekly shopping list under the Bring URL limit', async () => {
    const ingredients = Array.from({ length: 60 }, (_, i) => ({
      name: `Zutat Nummer ${i}`, amount: i * 50, unit: 'g'
    }));
    const url = await buildBringImportUrl('https://recipes-faulpelz-project-space.vercel.app', ingredients);
    expect(url.length).toBeLessThan(BRING_MAX_URL_LENGTH);
  });
});
