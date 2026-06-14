import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { describe, it, expect, beforeAll } from 'vitest';

describe('nav active state', () => {
  beforeAll(() => {
    execSync('npm run build', { stdio: 'pipe' });
  });

  it('marks Recipes active on the home page', () => {
    const html = readFileSync('_site/index.html', 'utf8');
    expect(html).toMatch(/href="\/" aria-current="page"/);
  });

  it('marks Recipes active on a recipe detail page', () => {
    const html = readFileSync('_site/recipes/bolognese/index.html', 'utf8');
    expect(html).toMatch(/href="\/" aria-current="page"/);
  });

  it('does not mark Recipes active on the planner page', () => {
    const html = readFileSync('_site/planner/index.html', 'utf8');
    expect(html).not.toMatch(/href="\/" aria-current="page"/);
  });

  it('marks Planner active on the planner page', () => {
    const html = readFileSync('_site/planner/index.html', 'utf8');
    expect(html).toMatch(/href="\/planner\/" aria-current="page"/);
  });

  it('includes pill-bg span in each nav link on home page', () => {
    const html = readFileSync('_site/index.html', 'utf8');
    expect(html).toContain('<span class="pill-bg"></span>Recipes');
    expect(html).toContain('<span class="pill-bg"></span>Planner');
  });

  it('includes pill-bg span in each nav link on a recipe page', () => {
    const html = readFileSync('_site/recipes/bolognese/index.html', 'utf8');
    expect(html).toContain('<span class="pill-bg"></span>Recipes');
    expect(html).toContain('<span class="pill-bg"></span>Planner');
  });

  it('includes pill-bg span in each nav link on the planner page', () => {
    const html = readFileSync('_site/planner/index.html', 'utf8');
    expect(html).toContain('<span class="pill-bg"></span>Recipes');
    expect(html).toContain('<span class="pill-bg"></span>Planner');
  });
});
