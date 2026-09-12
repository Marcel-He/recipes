import { describe, it, expect, vi } from 'vitest';
import handler from '../../api/planner-recipe.js';

function mockRes() {
  const res = {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    }
  };
  return res;
}

describe('planner-recipe handler', () => {
  it('renders valid JSON-LD Recipe markup with the given ingredients', () => {
    const req = { query: { data: JSON.stringify([{ name: 'Milk', amount: 1, unit: 'l' }]) } };
    const res = mockRes();
    handler(req, res);

    expect(res.statusCode).toBe(200);
    const match = res.body.match(/<script type="application\/ld\+json">(.*)<\/script>/s);
    const jsonLd = JSON.parse(match[1]);
    expect(jsonLd['@type']).toBe('Recipe');
    expect(jsonLd.recipeIngredient).toEqual(['1 l Milk']);
  });

  it('falls back to an empty list for missing or invalid data', () => {
    const res = mockRes();
    handler({ query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('"recipeIngredient":[]');

    const res2 = mockRes();
    handler({ query: { data: 'not json' } }, res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body).toContain('"recipeIngredient":[]');
  });

  it('escapes ingredient names in the visible list', () => {
    const req = { query: { data: JSON.stringify([{ name: '<script>alert(1)</script>', amount: null, unit: null }]) } };
    const res = mockRes();
    handler(req, res);
    expect(res.body).not.toContain('<script>alert(1)</script>');
    expect(res.body).toContain('&lt;script&gt;');
  });
});
