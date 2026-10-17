import { describe, it, expect } from 'vitest';
import { slugify, extractTitle, extractOgImageUrl, computeSquareCrop, resolveOutputPath } from '../../.claude/skills/og-thumbnail/scripts/lib.mjs';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Shakshuka nach Ottolenghi')).toBe('shakshuka-nach-ottolenghi');
  });

  it('transliterates German umlauts and eszett', () => {
    expect(slugify('Grüne Soße mit Knödel')).toBe('gruene-sosse-mit-knoedel');
  });

  it('strips punctuation', () => {
    expect(slugify("Nonna's Best Ragù!")).toBe('nonnas-best-ragu');
  });

  it('collapses repeated separators and trims leading/trailing hyphens', () => {
    expect(slugify('  Spicy -- Tofu  Bowl  ')).toBe('spicy-tofu-bowl');
  });
});

describe('extractTitle', () => {
  it('prefers the og:title meta tag', () => {
    const html = '<head><title>Fallback</title><meta property="og:title" content="Real Title"></head>';
    expect(extractTitle(html)).toBe('Real Title');
  });

  it('falls back to the <title> tag when og:title is missing', () => {
    const html = '<head><title>Only Title</title></head>';
    expect(extractTitle(html)).toBe('Only Title');
  });

  it('returns null when neither is present', () => {
    expect(extractTitle('<head></head>')).toBeNull();
  });
});

describe('extractOgImageUrl', () => {
  it('extracts an absolute og:image URL', () => {
    const html = '<meta property="og:image" content="https://example.com/dish.jpg">';
    expect(extractOgImageUrl(html, 'https://example.com/recipe')).toBe('https://example.com/dish.jpg');
  });

  it('resolves a relative og:image URL against the page URL', () => {
    const html = '<meta property="og:image" content="/images/dish.jpg">';
    expect(extractOgImageUrl(html, 'https://example.com/recipes/foo')).toBe('https://example.com/images/dish.jpg');
  });

  it('handles content attribute appearing before property', () => {
    const html = '<meta content="https://example.com/dish.jpg" property="og:image">';
    expect(extractOgImageUrl(html, 'https://example.com/recipe')).toBe('https://example.com/dish.jpg');
  });

  it('falls back to og:image:secure_url when og:image is absent', () => {
    const html = '<meta property="og:image:secure_url" content="https://example.com/secure.jpg">';
    expect(extractOgImageUrl(html, 'https://example.com/recipe')).toBe('https://example.com/secure.jpg');
  });

  it('falls back to twitter:image when no og:image variant is present', () => {
    const html = '<meta name="twitter:image" content="https://example.com/tw.jpg">';
    expect(extractOgImageUrl(html, 'https://example.com/recipe')).toBe('https://example.com/tw.jpg');
  });

  it('returns null when no image meta tag exists', () => {
    expect(extractOgImageUrl('<head></head>', 'https://example.com/recipe')).toBeNull();
  });
});

describe('computeSquareCrop', () => {
  it('uses the shorter side as the square size for a landscape image', () => {
    const result = computeSquareCrop({ width: 1200, height: 800, cx: 0.5, cy: 0.5 });
    expect(result.size).toBe(800);
  });

  it('centers the crop on cx/cy when it fits without clamping', () => {
    const result = computeSquareCrop({ width: 1200, height: 800, cx: 0.5, cy: 0.5 });
    expect(result.left).toBe(200);
    expect(result.top).toBe(0);
  });

  it('clamps the crop so it never goes past the left/top edge', () => {
    const result = computeSquareCrop({ width: 1200, height: 800, cx: 0.05, cy: 0.5 });
    expect(result.left).toBe(0);
  });

  it('clamps the crop so it never goes past the right/bottom edge', () => {
    const result = computeSquareCrop({ width: 1200, height: 800, cx: 0.95, cy: 0.5 });
    expect(result.left).toBe(400);
  });
});

describe('resolveOutputPath', () => {
  it('returns the base path when nothing exists yet', () => {
    const exists = () => false;
    expect(resolveOutputPath('src/assets/images', 'dish', 'jpg', exists)).toBe('src/assets/images/dish.jpg');
  });

  it('appends a numeric suffix when the base path is already taken', () => {
    const taken = new Set(['src/assets/images/dish.jpg', 'src/assets/images/dish-2.jpg']);
    const exists = p => taken.has(p);
    expect(resolveOutputPath('src/assets/images', 'dish', 'jpg', exists)).toBe('src/assets/images/dish-3.jpg');
  });
});
