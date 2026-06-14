# Nav Active Pill + Sliding Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the "Recipes" nav link so it stays active on recipe detail pages, and add a cross-document View Transitions sliding pill animation when switching between nav items.

**Architecture:** A `<span class="pill-bg">` inside each nav `<a>` carries the active background. CSS `view-transition-name: nav-pill` on the active span lets the browser track and slide it across page navigations. The Nunjucks active condition is broadened to match any `/recipes/*` URL.

**Tech Stack:** 11ty (Nunjucks templates), SCSS, CSS View Transitions API, Vitest

---

## File Map

| File | Change |
|------|--------|
| `src/_includes/base.njk` | Widen active condition; add `<span class="pill-bg">` inside each `<a>` |
| `src/assets/style.scss` | Add `@view-transition`; update `.nav-island a` (position, transition); add `.pill-bg`; add `::view-transition-*` rules |
| `tests/nav-active.test.js` | New — integration tests that build the site and assert nav HTML |

---

## Task 1: Write failing integration tests for nav active state

**Files:**
- Create: `tests/nav-active.test.js`

The tests build the 11ty site once, then read the rendered HTML files to assert correct `aria-current` placement and the presence of `.pill-bg` spans.

- [ ] **Step 1: Create the test file**

```js
// tests/nav-active.test.js
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
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: all 6 tests in `nav-active.test.js` FAIL (Recipes not active on recipe pages, no pill-bg spans).

---

## Task 2: Fix the Nunjucks template

**Files:**
- Modify: `src/_includes/base.njk`

- [ ] **Step 1: Open `src/_includes/base.njk` and replace the nav block**

Find the current nav (lines 16–19):

```html
  <nav class="nav-island" aria-label="Main navigation">
    <a href="/" {% if page.url == "/" %}aria-current="page"{% endif %}>Recipes</a>
    <a href="/planner/" {% if page.url == "/planner/" %}aria-current="page"{% endif %}>Planner</a>
  </nav>
```

Replace with:

```html
  <nav class="nav-island" aria-label="Main navigation">
    <a href="/" {% if page.url == "/" or "/recipes/" in page.url %}aria-current="page"{% endif %}><span class="pill-bg"></span>Recipes</a>
    <a href="/planner/" {% if page.url == "/planner/" %}aria-current="page"{% endif %}><span class="pill-bg"></span>Planner</a>
  </nav>
```

Two changes per link: wider active condition on Recipes, and `<span class="pill-bg"></span>` as the first child of each `<a>`.

- [ ] **Step 2: Run the tests**

```bash
npm test
```

Expected: all 6 tests in `nav-active.test.js` PASS.

- [ ] **Step 3: Commit**

```bash
git add src/_includes/base.njk tests/nav-active.test.js
git commit -m "feat: fix Recipes nav active state on recipe pages and add pill-bg span"
```

---

## Task 3: Update the stylesheet

**Files:**
- Modify: `src/assets/style.scss`

- [ ] **Step 1: Add `@view-transition` after the `@use` line at the top**

Current line 1:
```scss
@use 'variables' as *;
```

Add immediately after:
```scss
@use 'variables' as *;

@view-transition {
  navigation: auto;
}
```

- [ ] **Step 2: Update the `.nav-island a` block (lines 66–83)**

Find the current block:
```scss
  a {
    font-family: $font-body;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    color: $outline;
    padding: 0.35rem 0.9rem;
    border-radius: $radius-full;
    transition: background 0.15s, color 0.15s;

    &:hover { color: $primary; }
    &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }

    &[aria-current="page"] {
      background: $primary;
      color: $on-primary;
    }
  }
```

Replace with:
```scss
  a {
    font-family: $font-body;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    color: $outline;
    padding: 0.35rem 0.9rem;
    border-radius: $radius-full;
    transition: color 0.15s;
    position: relative;

    &:hover { color: $primary; }
    &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }

    &[aria-current="page"] {
      color: $on-primary;
    }

    .pill-bg {
      position: absolute;
      inset: 0;
      border-radius: $radius-full;
      z-index: -1;
    }

    &[aria-current="page"] .pill-bg {
      background: $primary;
      view-transition-name: nav-pill;
    }
  }
```

Key diffs from the original:
- `transition` loses `background` (background is now on `.pill-bg`, not the `<a>`)
- `position: relative` added so the span can anchor to the `<a>`
- `background: $primary` removed from `&[aria-current="page"]` (moved to `.pill-bg`)
- `.pill-bg` block added (absolutely fills the `<a>`, sits behind text via `z-index: -1`)
- `&[aria-current="page"] .pill-bg` sets the background and registers the view-transition name

- [ ] **Step 3: Add view-transition animation rules at the end of the file**

Append after the last block in `style.scss`:

```scss
// ── Nav pill view transition ────────────────────────────────────────────────
::view-transition-group(nav-pill) {
  animation-duration: 0.35s;
  animation-timing-function: cubic-bezier(0.34, 1.2, 0.64, 1);
}

::view-transition-old(nav-pill),
::view-transition-new(nav-pill) {
  animation: none;
}
```

`::view-transition-group` controls the positional morph (the slide). The spring curve `cubic-bezier(0.34, 1.2, 0.64, 1)` gives it a slight overshoot. `animation: none` on old/new suppresses the default crossfade — the pill is a solid colour so fading it would look wrong.

- [ ] **Step 4: Build and visually verify**

```bash
npm start
```

Open `http://localhost:8080` in Chrome or Edge (View Transitions requires Chrome 126+ / Edge 126+).

Check:
1. Home page — "Recipes" pill is active (dark green background, white text)
2. Click "Planner" — pill slides right to "Planner" with a spring motion
3. Click "Recipes" — pill slides back left
4. Click any recipe from the list — stay on the recipe page, "Recipes" pill remains active
5. From a recipe page, click "Planner" — pill slides to "Planner"
6. In Safari or Firefox — nav still works, pill just appears/disappears instantly (no slide)

- [ ] **Step 5: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: all tests PASS (CSS changes don't affect the HTML assertions).

- [ ] **Step 6: Commit**

```bash
git add src/assets/style.scss
git commit -m "feat: add sliding pill view transition animation to nav island"
```
