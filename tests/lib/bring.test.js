import { describe, it, expect } from 'vitest';
import { buildBringUrl } from '../../src/assets/lib/bring.js';

describe('buildBringUrl', () => {
  it('returns a bring:// URL', () => {
    const url = buildBringUrl([{ name: 'Milk', amount: 1, unit: 'l' }]);
    expect(url.startsWith('bring://')).toBe(true);
  });

  it('URL-encodes ingredient names with spaces', () => {
    const url = buildBringUrl([{ name: 'Olive oil', amount: 2, unit: 'tbsp' }]);
    expect(url).toContain('Olive%20oil');
  });

  it('returns a valid URL for an empty ingredient list', () => {
    const url = buildBringUrl([]);
    expect(typeof url).toBe('string');
    expect(url.startsWith('bring://')).toBe(true);
  });
});
