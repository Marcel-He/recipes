# Recipes App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static recipes site with 11ty, vanilla JS, and Fuse.js — featuring live search, serving scaling, a per-step ingredient view, wake lock, and a planner that exports a merged shopping list to Bring.

**Architecture:** 11ty v3 compiles Markdown recipe files into static HTML pages using Nunjucks layouts. `src/_data/recipes.js` reads all recipe JSON files at build time and exposes them to templates; a JavaScript template generates `/index.json` for the client. All interactivity is pure vanilla JS ES modules. Pure utility functions live in `src/assets/lib/` and are unit-tested with Vitest.

**Tech Stack:** Eleventy v3, Fuse.js v7, Vitest v2, Netlify

---

## File Map

| File | Role |
|---|---|
| `.eleventy.js` | 11ty config: input/output dirs, passthrough copies |
| `src/_includes/base.njk` | Base HTML shell: `<head>`, nav, conditional page script |
| `src/_includes/recipe.njk` | Recipe detail layout, wraps base.njk |
| `src/_data/recipes.js` | Reads `src/recipes/*.json` at build time; exposes as `recipes` global |
| `src/index.json.11ty.js` | Generates `/index.json` — full recipe array for client fetch |
| `src/index.njk` | Recipe list page |
| `src/planner.njk` | Planner / shopping list page |
| `src/recipes/recipes.11tydata.json` | Sets `layout: recipe.njk` and `tags: [recipe]` for all recipe MD files |
| `src/recipes/bolognese.md` | Sample recipe (frontmatter + markdown steps) |
| `src/recipes/bolognese.json` | Sample recipe structured data |
| `src/assets/style.css` | All styles |
| `src/assets/main.js` | Recipe list page: loads index.json, initialises Fuse.js, add-to-planner |
| `src/assets/recipe.js` | Recipe detail page: scaling UI, step toggle, wake lock, add-to-planner |
| `src/assets/planner.js` | Planner page: reads localStorage, fetches JSONs, aggregates, Bring export |
| `src/assets/lib/scaling.js` | Pure fn: `scaleIngredients(ingredients, baseServings, targetServings)` |
| `src/assets/lib/steps.js` | Pure fn: `groupIngredientsByStep(ingredients)` |
| `src/assets/lib/aggregator.js` | Pure fn: `aggregateIngredients(recipesData)` |
| `src/assets/lib/bring.js` | Pure fn: `buildBringUrl(ingredients)` |
| `tests/lib/scaling.test.js` | Vitest unit tests |
| `tests/lib/steps.test.js` | Vitest unit tests |
| `tests/lib/aggregator.test.js` | Vitest unit tests |
| `tests/lib/bring.test.js` | Vitest unit tests |
| `netlify.toml` | Netlify build config |

---

### Task 1: Scaffold Project

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.eleventyignore`
- Create: `vitest.config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "recipes-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "eleventy",
    "start": "eleventy --serve",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@11ty/eleventy": "^3.0.0",
    "fuse.js": "^7.0.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create .gitignore**

```
node_modules/
_site/
.DS_Store
```

- [ ] **Step 4: Create .eleventyignore**

```
tests/
vitest.config.js
```

- [ ] **Step 5: Create vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node'
  }
});
```

- [ ] **Step 6: Create directory structure**

```bash
mkdir -p src/recipes src/_includes src/_data src/assets/lib tests/lib
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .gitignore .eleventyignore vitest.config.js
git commit -m "chore: scaffold project with 11ty and vitest"
```

---

### Task 2: 11ty Configuration

**Files:**
- Create: `.eleventy.js`

- [ ] **Step 1: Find the correct fuse.js ESM filename**

```bash
ls node_modules/fuse.js/dist/
```

Note the exact filename of the ESM build (typically `fuse.esm.min.js` or `fuse.esm.js`). Use that filename in the next step.

- [ ] **Step 2: Create .eleventy.js**

Replace `fuse.esm.min.js` below with the actual filename from Step 1 if it differs.

```js
export default function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/recipes/*.json");
  eleventyConfig.addPassthroughCopy({
    "node_modules/fuse.js/dist/fuse.esm.min.js": "assets/fuse.esm.min.js"
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
}
```

- [ ] **Step 3: Verify build succeeds**

```bash
npm run build
```

Expected: `_site/` created, no errors. `_site/assets/fuse.esm.min.js` exists.

- [ ] **Step 4: Verify passthrough paths are correct**

```bash
ls _site/assets/ && echo "---" && ls _site/recipes/ 2>/dev/null || echo "no recipes yet"
```

Expected: `fuse.esm.min.js` is in `_site/assets/`. If `_site/src/` was created instead of `_site/assets/`, the passthrough paths need adjustment — change `"src/assets"` to `"assets"` and `"src/recipes/*.json"` to `"recipes/*.json"` in `.eleventy.js` (11ty resolves these relative to the input dir).

- [ ] **Step 5: Commit**

```bash
git add .eleventy.js
git commit -m "chore: configure eleventy with passthrough copies"
```

---

### Task 3: Base Layout and Skeleton CSS

**Files:**
- Create: `src/_includes/base.njk`
- Create: `src/assets/style.css`

- [ ] **Step 1: Create base.njk**

```njk
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title or "Recipes" }}</title>
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <header>
    <nav>
      <a href="/">Recipes</a>
      <a href="/planner/">Planner</a>
    </nav>
  </header>
  <main>
    {{ content | safe }}
  </main>
  {% if pageScript %}
  <script type="module" src="/assets/{{ pageScript }}"></script>
  {% endif %}
</body>
</html>
```

- [ ] **Step 2: Create skeleton style.css**

```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.5; }
nav { display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid #eee; }
nav a { text-decoration: none; color: inherit; }
main { max-width: 900px; margin: 0 auto; padding: 1rem; }
```

- [ ] **Step 3: Commit**

```bash
git add src/_includes/base.njk src/assets/style.css
git commit -m "feat: add base layout and skeleton CSS"
```

---

### Task 4: Data Layer

**Files:**
- Create: `src/_data/recipes.js`
- Create: `src/index.json.11ty.js`

- [ ] **Step 1: Create _data/recipes.js**

```js
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function() {
  const dir = join(__dirname, '../recipes');
  let files;
  try {
    files = (await readdir(dir)).filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }
  return Promise.all(
    files.map(async file => {
      const content = await readFile(join(dir, file), 'utf-8');
      return JSON.parse(content);
    })
  );
}
```

- [ ] **Step 2: Create index.json.11ty.js**

```js
export default class RecipesIndex {
  data() {
    return {
      permalink: '/index.json',
      eleventyExcludeFromCollections: true
    };
  }

  render({ recipes }) {
    return JSON.stringify(recipes);
  }
}
```

- [ ] **Step 3: Build and verify empty index**

```bash
npm run build && cat _site/index.json
```

Expected: `[]` (no recipes yet).

- [ ] **Step 4: Commit**

```bash
git add src/_data/recipes.js src/index.json.11ty.js
git commit -m "feat: add data layer and index.json generator"
```

---

### Task 5: Recipe List Page

**Files:**
- Create: `src/index.njk`

- [ ] **Step 1: Create index.njk**

```njk
---
layout: base.njk
title: Recipes
pageScript: main.js
---
<section>
  <input id="search" type="search" placeholder="Search recipes…" autocomplete="off">
</section>
<ul id="recipe-list">
  {% for recipe in recipes %}
  <li data-id="{{ recipe.id }}">
    <a href="/recipes/{{ recipe.id }}/">{{ recipe.title }}</a>
    <span>{{ recipe.difficulty }}</span>
    <button class="add-to-planner" data-id="{{ recipe.id }}">+ Planner</button>
  </li>
  {% endfor %}
</ul>
```

- [ ] **Step 2: Build and start dev server**

```bash
npm start
```

Open `http://localhost:8080`. Expected: page loads, empty recipe list (no recipes yet), no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.njk
git commit -m "feat: add recipe list page"
```

---

### Task 6: Sample Recipe

**Files:**
- Create: `src/recipes/recipes.11tydata.json`
- Create: `src/recipes/bolognese.md`
- Create: `src/recipes/bolognese.json`

- [ ] **Step 1: Create directory data file**

This sets the layout for every `.md` file in `src/recipes/` so individual recipe files don't need to repeat it.

```json
{
  "layout": "recipe.njk",
  "tags": ["recipe"]
}
```

Save as `src/recipes/recipes.11tydata.json`.

- [ ] **Step 2: Create sample recipe markdown**

```markdown
---
id: bolognese
title: Spaghetti Bolognese
difficulty: easy
servings: 4
---

A classic Italian meat sauce served over spaghetti.

## Steps

1. Heat olive oil in a large pan. Fry the minced beef until browned all over.
2. Add the tomato passata and a pinch of salt. Simmer on low heat for 20 minutes.
3. Cook the spaghetti in salted boiling water according to packet instructions.
4. Drain the spaghetti and serve with the sauce on top.
```

Save as `src/recipes/bolognese.md`.

- [ ] **Step 3: Create sample recipe JSON**

```json
{
  "id": "bolognese",
  "title": "Spaghetti Bolognese",
  "difficulty": "easy",
  "servings": 4,
  "ingredients": [
    { "name": "Minced beef", "amount": 500, "unit": "g", "step": 1 },
    { "name": "Olive oil", "amount": 2, "unit": "tbsp", "step": 1 },
    { "name": "Tomato passata", "amount": 400, "unit": "ml", "step": 2 },
    { "name": "Salt", "amount": 1, "unit": "tsp", "step": 2 },
    { "name": "Spaghetti", "amount": 320, "unit": "g", "step": 3 }
  ]
}
```

Save as `src/recipes/bolognese.json`.

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

```bash
cat _site/index.json
```

Expected: JSON array with one recipe object (bolognese, all fields present).

```bash
ls _site/recipes/
```

Expected: `bolognese.json` and a `bolognese/` directory containing `index.html`.

- [ ] **Step 5: Commit**

```bash
git add src/recipes/
git commit -m "feat: add sample bolognese recipe"
```

---

### Task 7: Recipe Detail Layout

**Files:**
- Create: `src/_includes/recipe.njk`

- [ ] **Step 1: Create recipe.njk**

```njk
---
layout: base.njk
pageScript: recipe.js
---
<article data-recipe-id="{{ id }}" data-base-servings="{{ servings }}">
  <header>
    <h1>{{ title }}</h1>
    <span class="difficulty">{{ difficulty }}</span>

    <div class="servings-control">
      <label>Servings</label>
      <button id="servings-down">−</button>
      <output id="servings">{{ servings }}</output>
      <button id="servings-up">+</button>
    </div>

    <button id="wake-lock-toggle">Keep screen on</button>
    <button id="add-to-planner" data-id="{{ id }}">+ Planner</button>
  </header>

  <section id="ingredients-section">
    <h2>Ingredients</h2>
    <button id="toggle-view">Show per step</button>
    <div id="ingredients-all"></div>
    <div id="ingredients-by-step" hidden></div>
  </section>

  <section id="steps-section">
    <h2>Steps</h2>
    {{ content | safe }}
  </section>
</article>
```

- [ ] **Step 2: Start dev server and check recipe page renders**

```bash
npm start
```

Open `http://localhost:8080/recipes/bolognese/`. Expected: title "Spaghetti Bolognese", difficulty "easy", step text appears, ingredient sections are empty (JS not loaded yet).

- [ ] **Step 3: Commit**

```bash
git add src/_includes/recipe.njk
git commit -m "feat: add recipe detail layout"
```

---

### Task 8: Scaling Library (TDD)

**Files:**
- Create: `tests/lib/scaling.test.js`
- Create: `src/assets/lib/scaling.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/lib/scaling.test.js
import { describe, it, expect } from 'vitest';
import { scaleIngredients } from '../../src/assets/lib/scaling.js';

describe('scaleIngredients', () => {
  const base = [
    { name: 'Flour', amount: 200, unit: 'g', step: 1 },
    { name: 'Milk', amount: 100, unit: 'ml', step: 1 }
  ];

  it('doubles amounts when target is 2x base', () => {
    const result = scaleIngredients(base, 2, 4);
    expect(result[0].amount).toBe(400);
    expect(result[1].amount).toBe(200);
  });

  it('halves amounts when target is half of base', () => {
    const result = scaleIngredients(base, 4, 2);
    expect(result[0].amount).toBe(100);
    expect(result[1].amount).toBe(50);
  });

  it('preserves all other fields', () => {
    const result = scaleIngredients(base, 2, 4);
    expect(result[0].name).toBe('Flour');
    expect(result[0].unit).toBe('g');
    expect(result[0].step).toBe(1);
  });

  it('does not mutate the original array', () => {
    scaleIngredients(base, 2, 4);
    expect(base[0].amount).toBe(200);
  });

  it('rounds to one decimal place', () => {
    const result = scaleIngredients([{ name: 'Oil', amount: 1, unit: 'tbsp', step: 1 }], 3, 2);
    expect(result[0].amount).toBe(0.7);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../../src/assets/lib/scaling.js'`

- [ ] **Step 3: Implement scaleIngredients**

```js
// src/assets/lib/scaling.js
export function scaleIngredients(ingredients, baseServings, targetServings) {
  const factor = targetServings / baseServings;
  return ingredients.map(ing => ({
    ...ing,
    amount: Math.round(ing.amount * factor * 10) / 10
  }));
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/assets/lib/scaling.js tests/lib/scaling.test.js
git commit -m "feat: add scaleIngredients with tests"
```

---

### Task 9: Steps Grouping Library (TDD)

**Files:**
- Create: `tests/lib/steps.test.js`
- Create: `src/assets/lib/steps.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/lib/steps.test.js
import { describe, it, expect } from 'vitest';
import { groupIngredientsByStep } from '../../src/assets/lib/steps.js';

describe('groupIngredientsByStep', () => {
  const ingredients = [
    { name: 'Beef', amount: 500, unit: 'g', step: 1 },
    { name: 'Oil', amount: 2, unit: 'tbsp', step: 1 },
    { name: 'Passata', amount: 400, unit: 'ml', step: 2 },
    { name: 'Spaghetti', amount: 320, unit: 'g', step: 3 }
  ];

  it('groups ingredients by step number', () => {
    const result = groupIngredientsByStep(ingredients);
    expect(result[1]).toHaveLength(2);
    expect(result[2]).toHaveLength(1);
    expect(result[3]).toHaveLength(1);
  });

  it('places ingredients with no step under key 0', () => {
    const result = groupIngredientsByStep([{ name: 'Salt', amount: 1, unit: 'tsp' }]);
    expect(result[0]).toHaveLength(1);
  });

  it('does not mutate the input array', () => {
    groupIngredientsByStep(ingredients);
    expect(ingredients).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement groupIngredientsByStep**

```js
// src/assets/lib/steps.js
export function groupIngredientsByStep(ingredients) {
  return ingredients.reduce((groups, ing) => {
    const step = ing.step ?? 0;
    if (!groups[step]) groups[step] = [];
    groups[step].push(ing);
    return groups;
  }, {});
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test
```

Expected: 3 tests PASS (8 total across both lib files).

- [ ] **Step 5: Commit**

```bash
git add src/assets/lib/steps.js tests/lib/steps.test.js
git commit -m "feat: add groupIngredientsByStep with tests"
```

---

### Task 10: Ingredient Aggregator (TDD)

**Files:**
- Create: `tests/lib/aggregator.test.js`
- Create: `src/assets/lib/aggregator.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/lib/aggregator.test.js
import { describe, it, expect } from 'vitest';
import { aggregateIngredients } from '../../src/assets/lib/aggregator.js';

describe('aggregateIngredients', () => {
  it('merges the same ingredient from two recipes', () => {
    const recipes = [
      { ingredients: [{ name: 'Salt', amount: 1, unit: 'tsp' }] },
      { ingredients: [{ name: 'Salt', amount: 2, unit: 'tsp' }] }
    ];
    const result = aggregateIngredients(recipes);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(3);
  });

  it('keeps same ingredient in different units as separate entries', () => {
    const recipes = [
      { ingredients: [{ name: 'Milk', amount: 200, unit: 'ml' }] },
      { ingredients: [{ name: 'Milk', amount: 1, unit: 'cup' }] }
    ];
    const result = aggregateIngredients(recipes);
    expect(result).toHaveLength(2);
  });

  it('handles a single recipe', () => {
    const result = aggregateIngredients([
      { ingredients: [{ name: 'Flour', amount: 200, unit: 'g' }] }
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Flour');
  });

  it('returns empty array for empty input', () => {
    expect(aggregateIngredients([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement aggregateIngredients**

```js
// src/assets/lib/aggregator.js
export function aggregateIngredients(recipes) {
  const map = new Map();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = `${ing.name}|${ing.unit}`;
      if (map.has(key)) {
        map.get(key).amount += ing.amount;
      } else {
        map.set(key, { name: ing.name, amount: ing.amount, unit: ing.unit });
      }
    }
  }
  return Array.from(map.values());
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test
```

Expected: 4 tests PASS (12 total).

- [ ] **Step 5: Commit**

```bash
git add src/assets/lib/aggregator.js tests/lib/aggregator.test.js
git commit -m "feat: add aggregateIngredients with tests"
```

---

### Task 11: Bring URL Builder (TDD)

**Files:**
- Create: `tests/lib/bring.test.js`
- Create: `src/assets/lib/bring.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/lib/bring.test.js
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
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement buildBringUrl**

> Note: Verify the exact Bring URL scheme format before shipping — test with the Bring app on a real device. The format below follows the most commonly documented structure (`bring://bring/?items=name,amount;name,amount`).

```js
// src/assets/lib/bring.js
export function buildBringUrl(ingredients) {
  if (ingredients.length === 0) return 'bring://bring/';
  const items = ingredients
    .map(i => `${encodeURIComponent(i.name)},${encodeURIComponent(`${i.amount} ${i.unit}`.trim())}`)
    .join(';');
  return `bring://bring/?items=${items}`;
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test
```

Expected: 3 tests PASS (15 total across all 4 lib files).

- [ ] **Step 5: Commit**

```bash
git add src/assets/lib/bring.js tests/lib/bring.test.js
git commit -m "feat: add buildBringUrl with tests"
```

---

### Task 12: Client-Side Search

**Files:**
- Create: `src/assets/main.js`

- [ ] **Step 1: Confirm fuse.js ESM filename**

```bash
ls _site/assets/fuse*
```

Expected: `fuse.esm.min.js` (or whatever filename you used in `.eleventy.js`). Update the import in the next step if the filename differs.

- [ ] **Step 2: Create main.js**

```js
// src/assets/main.js
import Fuse from '/assets/fuse.esm.min.js';

async function init() {
  const res = await fetch('/index.json');
  const recipes = await res.json();

  const fuse = new Fuse(recipes, {
    keys: ['title', 'difficulty'],
    threshold: 0.4
  });

  const searchInput = document.getElementById('search');
  const list = document.getElementById('recipe-list');
  const items = Array.from(list.querySelectorAll('li'));

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (!query) {
      items.forEach(el => { el.hidden = false; });
      return;
    }
    const matchedIds = new Set(fuse.search(query).map(r => r.item.id));
    items.forEach(el => { el.hidden = !matchedIds.has(el.dataset.id); });
  });

  list.addEventListener('click', e => {
    const btn = e.target.closest('.add-to-planner');
    if (!btn) return;
    const planner = JSON.parse(localStorage.getItem('planner') || '[]');
    if (!planner.includes(btn.dataset.id)) {
      planner.push(btn.dataset.id);
      localStorage.setItem('planner', JSON.stringify(planner));
    }
    btn.textContent = '✓ Added';
    btn.disabled = true;
  });
}

init();
```

- [ ] **Step 3: Test in browser**

```bash
npm start
```

Open `http://localhost:8080`. Expected:
- Bolognese appears in the list.
- Typing "bolo" in the search box keeps bolognese visible; typing "xyz" hides it.
- Clicking "+ Planner" changes button to "✓ Added".
- In the browser console: `JSON.parse(localStorage.getItem('planner'))` returns `["bolognese"]`.

- [ ] **Step 4: Commit**

```bash
git add src/assets/main.js
git commit -m "feat: add client-side search and add-to-planner on list page"
```

---

### Task 13: Recipe Detail Page JS

**Files:**
- Create: `src/assets/recipe.js`

- [ ] **Step 1: Create recipe.js**

```js
// src/assets/recipe.js
import { scaleIngredients } from './lib/scaling.js';
import { groupIngredientsByStep } from './lib/steps.js';

const article = document.querySelector('[data-recipe-id]');
const recipeId = article.dataset.recipeId;
const baseServings = parseInt(article.dataset.baseServings, 10);
let currentServings = baseServings;
let recipeData = null;

async function loadRecipe() {
  const res = await fetch(`/recipes/${recipeId}.json`);
  recipeData = await res.json();
  renderIngredients();
}

function renderIngredients() {
  const scaled = scaleIngredients(recipeData.ingredients, baseServings, currentServings);
  renderAll(scaled);
  renderByStep(scaled);
}

function renderAll(ingredients) {
  document.getElementById('ingredients-all').innerHTML =
    `<ul>${ingredients.map(i => `<li>${i.name}: ${i.amount} ${i.unit}</li>`).join('')}</ul>`;
}

function renderByStep(ingredients) {
  const groups = groupIngredientsByStep(ingredients);
  document.getElementById('ingredients-by-step').innerHTML =
    Object.entries(groups)
      .map(([step, ings]) =>
        `<div><strong>Step ${step}</strong><ul>${ings.map(i =>
          `<li>${i.name}: ${i.amount} ${i.unit}</li>`
        ).join('')}</ul></div>`
      ).join('');
}

// Servings controls
document.getElementById('servings-down').addEventListener('click', () => {
  if (currentServings <= 1) return;
  currentServings--;
  document.getElementById('servings').value = currentServings;
  renderIngredients();
});

document.getElementById('servings-up').addEventListener('click', () => {
  currentServings++;
  document.getElementById('servings').value = currentServings;
  renderIngredients();
});

// Step toggle
let showByStep = false;
document.getElementById('toggle-view').addEventListener('click', () => {
  showByStep = !showByStep;
  document.getElementById('ingredients-all').hidden = showByStep;
  document.getElementById('ingredients-by-step').hidden = !showByStep;
  document.getElementById('toggle-view').textContent = showByStep ? 'Show all' : 'Show per step';
});

// Wake lock
let wakeLock = null;
document.getElementById('wake-lock-toggle').addEventListener('click', async () => {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
    document.getElementById('wake-lock-toggle').textContent = 'Keep screen on';
  } else {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      document.getElementById('wake-lock-toggle').textContent = 'Screen on ✓';
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
        document.getElementById('wake-lock-toggle').textContent = 'Keep screen on';
      });
    } catch {
      // Wake lock unsupported or denied; fail silently
    }
  }
});

// Add to planner
document.getElementById('add-to-planner').addEventListener('click', () => {
  const planner = JSON.parse(localStorage.getItem('planner') || '[]');
  if (!planner.includes(recipeId)) {
    planner.push(recipeId);
    localStorage.setItem('planner', JSON.stringify(planner));
  }
  const btn = document.getElementById('add-to-planner');
  btn.textContent = '✓ In planner';
  btn.disabled = true;
});

loadRecipe();
```

- [ ] **Step 2: Test all interactions in browser**

```bash
npm start
```

Open `http://localhost:8080/recipes/bolognese/`. Expected:
- Ingredients list renders (fetched from `/recipes/bolognese.json`).
- "+ " and "−" buttons update servings counter and recompute ingredient amounts.
- "Show per step" toggles between the flat list and the grouped-by-step view.
- "Keep screen on" requests wake lock (browser may require user gesture — it does here via the click).
- "+ Planner" saves to `localStorage` and disables itself.

- [ ] **Step 3: Commit**

```bash
git add src/assets/recipe.js
git commit -m "feat: add recipe detail interactivity (scaling, steps, wake lock, planner)"
```

---

### Task 14: Planner Page

**Files:**
- Create: `src/planner.njk`
- Create: `src/assets/planner.js`

- [ ] **Step 1: Create planner.njk**

```njk
---
layout: base.njk
title: Planner
pageScript: planner.js
---
<h1>Planner</h1>

<section>
  <h2>Selected recipes</h2>
  <ul id="recipe-tags"></ul>
</section>

<section>
  <h2>Shopping list</h2>
  <ul id="shopping-list"></ul>
</section>

<div style="display:flex;gap:.5rem;margin-top:1rem">
  <button id="bring-export" disabled>Export to Bring</button>
  <button id="clear-planner">Clear planner</button>
</div>
```

- [ ] **Step 2: Create planner.js**

```js
// src/assets/planner.js
import { aggregateIngredients } from './lib/aggregator.js';
import { buildBringUrl } from './lib/bring.js';

async function init() {
  const ids = JSON.parse(localStorage.getItem('planner') || '[]');

  if (ids.length === 0) {
    document.getElementById('shopping-list').innerHTML = '<li>No recipes selected.</li>';
    return;
  }

  const recipes = await Promise.all(
    ids.map(id => fetch(`/recipes/${id}.json`).then(r => r.json()))
  );

  renderRecipeTags(recipes, ids);
  const aggregated = aggregateIngredients(recipes);
  renderShoppingList(aggregated);

  const bringBtn = document.getElementById('bring-export');
  bringBtn.disabled = false;
  bringBtn.addEventListener('click', () => {
    window.location.href = buildBringUrl(aggregated);
  });

  document.getElementById('clear-planner').addEventListener('click', () => {
    localStorage.removeItem('planner');
    window.location.reload();
  });
}

function renderRecipeTags(recipes, ids) {
  const list = document.getElementById('recipe-tags');
  list.innerHTML = recipes
    .map((r, i) => `<li>${r.title} <button class="remove-recipe" data-id="${ids[i]}">×</button></li>`)
    .join('');

  list.addEventListener('click', e => {
    const btn = e.target.closest('.remove-recipe');
    if (!btn) return;
    const planner = JSON.parse(localStorage.getItem('planner') || '[]');
    localStorage.setItem('planner', JSON.stringify(planner.filter(id => id !== btn.dataset.id)));
    window.location.reload();
  });
}

function renderShoppingList(ingredients) {
  document.getElementById('shopping-list').innerHTML = ingredients
    .map(i => `<li>${i.name}: ${i.amount} ${i.unit}</li>`)
    .join('');
}

init();
```

- [ ] **Step 3: Test the planner end-to-end**

```bash
npm start
```

1. Go to `http://localhost:8080`, click "+ Planner" on bolognese.
2. Go to `http://localhost:8080/planner/`.

Expected:
- "Bolognese" appears under selected recipes with a "×" button.
- Shopping list shows all 5 ingredients.
- "Export to Bring" button is enabled.
- Clicking "×" removes the recipe and reloads.
- "Clear planner" removes all and reloads.

- [ ] **Step 4: Commit**

```bash
git add src/planner.njk src/assets/planner.js
git commit -m "feat: add planner page with shopping list and Bring export"
```

---

### Task 15: CSS Styling

**Files:**
- Modify: `src/assets/style.css`

- [ ] **Step 1: Replace skeleton CSS with complete styles**

```css
/* src/assets/style.css */
*, *::before, *::after { box-sizing: border-box; }

:root {
  --bg: #fafaf9;
  --surface: #ffffff;
  --border: #e5e5e5;
  --text: #1a1a1a;
  --muted: #6b7280;
  --accent: #d97706;
  --radius: 8px;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  background: var(--bg);
  color: var(--text);
}

/* Nav */
header { border-bottom: 1px solid var(--border); background: var(--surface); }
nav { display: flex; gap: 1.5rem; padding: 0.75rem 1.5rem; max-width: 900px; margin: 0 auto; }
nav a { text-decoration: none; color: var(--text); font-weight: 500; }
nav a:hover { color: var(--accent); }

/* Layout */
main { max-width: 900px; margin: 0 auto; padding: 1.5rem; }

/* Search */
#search {
  width: 100%;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  margin-bottom: 1.25rem;
  background: var(--surface);
}
#search:focus { outline: 2px solid var(--accent); border-color: transparent; }

/* Recipe list */
#recipe-list {
  list-style: none;
  margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 0.5rem;
}
#recipe-list li {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
#recipe-list a { flex: 1; text-decoration: none; color: var(--text); font-weight: 500; }
#recipe-list a:hover { color: var(--accent); }
#recipe-list span { font-size: 0.8rem; color: var(--muted); text-transform: capitalize; }

/* Buttons */
button {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  font-size: 0.85rem;
  cursor: pointer;
}
button:hover:not(:disabled) { background: var(--bg); }
button:disabled { opacity: 0.5; cursor: default; }

/* Recipe detail header */
[data-recipe-id] > header { border: none; background: none; padding: 0; }
[data-recipe-id] h1 { margin: 0 0 0.25rem; font-size: 2rem; }
.difficulty { font-size: 0.85rem; color: var(--muted); text-transform: capitalize; }
.servings-control { display: flex; align-items: center; gap: 0.5rem; margin: 1rem 0; }
.servings-control label { font-weight: 500; }
#servings { font-size: 1rem; font-weight: 600; min-width: 2ch; text-align: center; }

/* Ingredient / step sections */
#ingredients-section,
#steps-section {
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
#ingredients-section h2,
#steps-section h2 { margin: 0 0 0.75rem; }
#ingredients-section ul,
#steps-section ol { padding-left: 1.25rem; margin: 0; }
#ingredients-section li { margin-bottom: 0.25rem; }

/* Planner tags */
#recipe-tags {
  list-style: none; margin: 0 0 1rem; padding: 0;
  display: flex; flex-wrap: wrap; gap: 0.5rem;
}
#recipe-tags li {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.9rem;
}
.remove-recipe {
  border: none; background: none; padding: 0;
  font-size: 1rem; cursor: pointer; color: var(--muted);
}

/* Shopping list */
#shopping-list { list-style: none; margin: 0; padding: 0; }
#shopping-list li { padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
#shopping-list li:last-child { border-bottom: none; }

/* Bring export button */
#bring-export {
  background: #00a86b; color: white; border-color: #00a86b;
  font-size: 1rem; padding: 0.6rem 1.25rem;
}
#bring-export:hover:not(:disabled) { background: #009860; }
```

- [ ] **Step 2: Check all three pages in the browser**

```bash
npm start
```

Visit `http://localhost:8080`, `http://localhost:8080/recipes/bolognese/`, `http://localhost:8080/planner/`. All pages should look clean and consistent. No layout breaks, no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/assets/style.css
git commit -m "feat: add complete CSS styling"
```

---

### Task 16: Deploy Configuration

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Create netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = "_site"

[build.environment]
  NODE_VERSION = "20"
```

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: `_site/` contains:
- `index.html`
- `index.json`
- `planner/index.html`
- `recipes/bolognese/index.html`
- `recipes/bolognese.json`
- `assets/main.js`, `assets/recipe.js`, `assets/planner.js`
- `assets/lib/scaling.js`, `assets/lib/steps.js`, `assets/lib/aggregator.js`, `assets/lib/bring.js`
- `assets/fuse.esm.min.js`
- `assets/style.css`

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all 15 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add netlify.toml
git commit -m "chore: add netlify deploy config"
```
