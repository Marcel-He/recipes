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

  it('includes nav-pill div in the nav island', () => {
    const html = readFileSync('_site/index.html', 'utf8');
    expect(html).toContain('<div class="nav-pill" aria-hidden="true"></div>');
  });

  it('includes nav-pill div on recipe pages', () => {
    const html = readFileSync('_site/recipes/bolognese/index.html', 'utf8');
    expect(html).toContain('<div class="nav-pill" aria-hidden="true"></div>');
  });

  it('includes nav-pill div on the planner page', () => {
    const html = readFileSync('_site/planner/index.html', 'utf8');
    expect(html).toContain('<div class="nav-pill" aria-hidden="true"></div>');
  });
});
