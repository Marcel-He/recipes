# Wochenplan-Kalender Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new `/plan/` page showing a rolling 14-day window as a 7×2 grid (one recipe
slot per day), with a tap-to-assign drawer for empty days, the existing `recipe-preview`
for filled days, and desktop drag-and-drop to swap/move assignments between days.

**Architecture:** A pure, localStorage-free library (`weekplan.js`) owns the window/
normalization logic and is unit-tested; the page controller (`plan.js`) owns all DOM
wiring and localStorage IO, untested, matching this codebase's existing split
(`suggestions.js`/`bring.js`/`format.js` pure + tested vs. `planner.js`/`recipe-preview.js`
DOM-wired + untested). `recipe-preview.js` gains one optional `action` parameter so the
same bottom-sheet component can show "Tag leeren" on `/plan/` instead of "Add to planner",
with zero behavior change for its existing callers (`main.js`, `planner.js`). The
day-select drawer reuses `planner.js`'s suggestion-list markup/logic and `main.js`'s
Fuse.js search-over-a-static-list pattern verbatim rather than inventing new approaches.

**Tech Stack:** 11ty/Nunjucks, vanilla JS (ES modules), SCSS, Vitest, Fuse.js (already a
dependency, used by `main.js`).

**Spec:** `docs/superpowers/specs/2026-10-17-weekplan-kalender-design.md` (and the
requirements it implements: `docs/superpowers/specs/2026-10-07-weekplan-kalender-requirements.md`)

## Global Constraints

- Own localStorage key `weekplan`, decoupled from the existing `planner` array — no shared
  state (requirements §Datenmodell).
- The window is recomputed/normalized on every load: days outside today…+13 are dropped,
  new days are added empty (spec §1).
- Exactly 1 recipe slot per day.
- No Mon–Sun grid: grid columns are chronological from today, not weekday-anchored — column
  1 is always "today", regardless of today's actual weekday (spec §3).
- Tap stays the primary assignment path on every device; drag-and-drop is desktop/mouse
  only — no touch handlers (spec §6).
- `recipe-preview.js`'s existing callers (`main.js`, `planner.js`) must not change — the new
  `action` parameter is purely additive/optional (spec §5).
- New UI copy on `/plan/` is German, matching the requirements/design docs and the existing
  planner's German hint text ("Mit ähnlichen Zutaten…"); icons via Font Awesome 6 classes
  already used elsewhere (`fa-solid fa-...`).
- DOM-wiring code (`plan.js`, the `recipe-preview.js` extension) stays untested, matching
  the existing convention — only the pure functions in `weekplan.js` get unit tests.

## Review Focus

- `getWindowDates` must roll over month/year boundaries correctly (e.g. a window starting
  Dec 28 must land on Jan 1–10, not wrap within December) — pinned by a unit test in Task 1.
- A day whose assigned recipe no longer resolves against `/index.json` (a deleted recipe)
  must show a warning thumbnail and route the tap to the day-select drawer with a "Rezept
  nicht mehr verfügbar" hint, not throw or silently show nothing — pinned by a manual check
  in Task 5.
- Corrupted/non-JSON data under the `weekplan` localStorage key must fall back to an empty,
  normalized plan on load, not crash the page — pinned by a unit test in Task 1.
- Dragging a cell onto itself, or dropping outside any cell, must not lose the dragged
  day's assignment — pinned by explicit guards in Task 7, verified manually.
- Existing `recipe-preview` behavior on the homepage and planner (the "Add to planner"
  toggle) must be pixel-for-pixel unchanged after Task 3's `action` parameter is added —
  pinned by a manual check in Task 3.

---

## Task 1: `weekplan.js` — window/normalization logic + localStorage IO

**Files:**
- Create: `src/assets/lib/weekplan.js`
- Test: `tests/lib/weekplan.test.js`

**Interfaces:**
- Produces: `getWindowDates(today: Date, days = 14): string[]` (chronological
  `YYYY-MM-DD` strings starting at `today`), `normalizeWeekplan(stored: object|null,
  windowDates: string[]): Record<string, string|null>`, `loadWeekplan(windowDates:
  string[]): Record<string, string|null>`, `saveWeekplan(map: Record<string,
  string|null>): void`.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/weekplan.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { getWindowDates, normalizeWeekplan, loadWeekplan } from '../../src/assets/lib/weekplan.js';

describe('getWindowDates', () => {
  it('returns 14 consecutive dates starting today', () => {
    const dates = getWindowDates(new Date(2026, 9, 17)); // Oct 17, 2026
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe('2026-10-17');
    expect(dates[13]).toBe('2026-10-30');
  });

  it('rolls over a month/year boundary correctly', () => {
    const dates = getWindowDates(new Date(2026, 11, 28)); // Dec 28, 2026
    expect(dates[0]).toBe('2026-12-28');
    expect(dates[3]).toBe('2026-12-31');
    expect(dates[4]).toBe('2027-01-01');
    expect(dates[13]).toBe('2027-01-10');
  });

  it('supports a custom window length', () => {
    expect(getWindowDates(new Date(2026, 9, 17), 3)).toEqual(['2026-10-17', '2026-10-18', '2026-10-19']);
  });
});

describe('normalizeWeekplan', () => {
  const windowDates = ['2026-10-17', '2026-10-18', '2026-10-19'];

  it('drops stored days outside the window and adds missing window days as null', () => {
    const stored = { '2026-10-16': 'old-recipe', '2026-10-18': 'carbonara' };
    expect(normalizeWeekplan(stored, windowDates)).toEqual({
      '2026-10-17': null,
      '2026-10-18': 'carbonara',
      '2026-10-19': null
    });
  });

  it('preserves windowDates order in the result', () => {
    expect(Object.keys(normalizeWeekplan({}, windowDates))).toEqual(windowDates);
  });

  it('falls back to an all-empty plan when stored is not an object', () => {
    expect(normalizeWeekplan(null, windowDates)).toEqual({
      '2026-10-17': null,
      '2026-10-18': null,
      '2026-10-19': null
    });
  });
});

describe('loadWeekplan', () => {
  const windowDates = ['2026-10-17', '2026-10-18'];

  beforeEach(() => {
    globalThis.localStorage = {
      store: {},
      getItem(key) { return this.store[key] ?? null; },
      setItem(key, value) { this.store[key] = value; }
    };
  });

  it('reads and normalizes a valid stored plan', () => {
    localStorage.setItem('weekplan', JSON.stringify({ '2026-10-17': 'carbonara' }));
    expect(loadWeekplan(windowDates)).toEqual({ '2026-10-17': 'carbonara', '2026-10-18': null });
  });

  it('falls back to an empty normalized plan on corrupt JSON instead of throwing', () => {
    localStorage.setItem('weekplan', '{not valid json');
    expect(loadWeekplan(windowDates)).toEqual({ '2026-10-17': null, '2026-10-18': null });
  });

  it('falls back to an empty normalized plan when nothing is stored yet', () => {
    expect(loadWeekplan(windowDates)).toEqual({ '2026-10-17': null, '2026-10-18': null });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/lib/weekplan.test.js`
Expected: FAIL — `src/assets/lib/weekplan.js` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `src/assets/lib/weekplan.js`:

```js
// Own localStorage key for the week-plan calendar — deliberately decoupled from the
// existing `planner` array (see the requirements/design docs for why).
const STORAGE_KEY = 'weekplan';

// `days` consecutive YYYY-MM-DD strings starting at `today` (a Date). Uses local
// calendar fields (not UTC) so the window matches the user's wall-clock date.
export function getWindowDates(today, days = 14) {
  const fmt = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return fmt(d);
  });
}

// Rebuilds the plan against the current window: days outside `windowDates` are dropped,
// days inside it that aren't in `stored` are added as null. Result key order follows
// `windowDates` (chronological).
export function normalizeWeekplan(stored, windowDates) {
  const safe = stored && typeof stored === 'object' ? stored : {};
  const result = {};
  for (const date of windowDates) {
    result[date] = Object.prototype.hasOwnProperty.call(safe, date) ? safe[date] : null;
  }
  return result;
}

// The only functions that touch localStorage. Corrupt/missing data falls back to an
// empty, normalized plan rather than throwing.
export function loadWeekplan(windowDates) {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    stored = {};
  }
  return normalizeWeekplan(stored, windowDates);
}

export function saveWeekplan(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/weekplan.test.js`
Expected: PASS, all 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/assets/lib/weekplan.js tests/lib/weekplan.test.js
git commit -m "Add weekplan.js: rolling 14-day window and normalization logic"
```

---

## Task 2: Pattern library entries + SCSS for the grid cell and day-select drawer

**Files:**
- Modify: `src/pattern-library/components.njk`
- Create: `src/assets/scss/weekplan/_styles.scss`
- Modify: `src/assets/style.scss`

**Interfaces:**
- Produces: the CSS classes Task 4's `plan.njk` markup and Task 5/6's `plan.js` rendering
  depend on — `.weekplan-hero`, `.weekplan-grid`, `.weekplan-cell` (+
  `__weekday`/`__day`/`__thumb`/`__thumb--empty`/`__thumb--warning`), `.day-select` (+
  `__backdrop`/`__panel`/`__close`/`__title`/`__missing-hint`), `#day-select-search`.

- [ ] **Step 1: Create the SCSS partial**

Create `src/assets/scss/weekplan/_styles.scss`:

```scss
@use '../tokens' as *;

// ── Hero ───────────────────────────────────────────────────────────────────
// Same full-bleed white panel as .planner-hero.
.weekplan-hero {
  width: 100vw;
  margin-inline: calc(50% - 50vw);
  margin-top: -2rem;
  background: $card;
  padding: 2rem 1.5rem 1.5rem;
}

// ── Grid ───────────────────────────────────────────────────────────────────
// 7 columns × 2 rows, chronological (cell 1 = today) — not weekday-anchored.
.weekplan-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.4rem;
}

.weekplan-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.2rem;
  background: $bg;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba($brand, 0.06);
  }
  &:focus-visible {
    outline: 2px solid $brand;
    outline-offset: 2px;
  }
}

.weekplan-cell__weekday {
  font-family: $font-body;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $text-subtle;
}

.weekplan-cell__day {
  font-family: $font-body;
  font-size: $text-label-md-size;
  font-weight: 700;
  color: $text-base;
}

$weekplan-thumb-size: 32px;

.weekplan-cell__thumb {
  display: block;
  width: $weekplan-thumb-size;
  height: $weekplan-thumb-size;
  border-radius: $radius-full;
  object-fit: cover;
}

.weekplan-cell__thumb--empty,
.weekplan-cell__thumb--warning {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $weekplan-thumb-size;
  height: $weekplan-thumb-size;
  border-radius: $radius-full;
  font-size: 12px;
}

.weekplan-cell__thumb--empty {
  background: rgba($brand, 0.08);
  color: $brand;
}

.weekplan-cell__thumb--warning {
  background: rgba($danger, 0.1);
  color: $danger;
}

// ── Day-select drawer ────────────────────────────────────────────────────
// Same bottom-sheet structure as .recipe-preview (backdrop + sliding panel),
// different content: suggestions + search + full recipe list.
.day-select {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.day-select__backdrop {
  position: fixed;
  inset: 0;
  background: rgba($brand, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.day-select__panel {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 2rem;
  background: $card;
  border-radius: $radius-xl $radius-xl 0 0;
  box-shadow: $shadow-drawer;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.day-select.is-open {
  .day-select__backdrop {
    opacity: 1;
  }
  .day-select__panel {
    transform: translateY(0);
  }
}

.day-select__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.day-select__title {
  margin: 0 2.5rem 0.5rem 0; // leave room for the close button
}

.day-select__missing-hint {
  margin: 0 0 1rem;
  font-size: $text-label-md-size;
  color: $danger;
}

#day-select-search {
  width: 100%;
  padding: 0.75rem 1rem;
  background: $bg;
  border: 1px solid $border;
  border-radius: $radius-lg;
  font-family: $font-body;
  font-size: $text-body-lg-size;
  color: $text-base;
  margin: 0.5rem 0 1rem;

  &::placeholder {
    color: $text-subtle;
  }
  &:focus {
    outline: none;
    border-color: $brand;
    box-shadow: $shadow-focus;
  }
}
```

- [ ] **Step 2: Register the partial in `style.scss`**

In `src/assets/style.scss`, change:

```scss
@use './scss/planner';
```

to:

```scss
@use './scss/planner';
@use './scss/weekplan';
```

- [ ] **Step 3: Add the pattern library section**

In `src/pattern-library/components.njk`, add a new section at the end of the file (after
the existing "Cook mode" section's closing `</section>`):

```html

<section class="pl-section">
  <h2 class="pl-section-title">Weekplan grid cell</h2>
  <p>.weekplan-cell — one button per day in the /plan/ page's 7×2 grid. Shows the weekday
    abbreviation, day number, and a small round thumbnail: the recipe's image when
    assigned, a "+" placeholder when empty, or a warning icon when the assigned recipe no
    longer resolves against /index.json. No title text — details only appear in the
    recipe-preview (filled) or day-select drawer (empty/missing) opened on tap.</p>
  <div class="pl-row" style="gap: 0.75rem;">
    <button type="button" class="weekplan-cell">
      <span class="weekplan-cell__weekday">Sa</span>
      <span class="weekplan-cell__day">17</span>
      <span class="weekplan-cell__thumb weekplan-cell__thumb--empty"><i class="fa-solid fa-plus"></i></span>
    </button>
    <button type="button" class="weekplan-cell">
      <span class="weekplan-cell__weekday">So</span>
      <span class="weekplan-cell__day">18</span>
      <img class="weekplan-cell__thumb" src="/assets/images/bifteki-mit-hirtenkase.jpg" alt="">
    </button>
    <button type="button" class="weekplan-cell">
      <span class="weekplan-cell__weekday">Mo</span>
      <span class="weekplan-cell__day">19</span>
      <span class="weekplan-cell__thumb weekplan-cell__thumb--warning"><i class="fa-solid fa-triangle-exclamation"></i></span>
    </button>
  </div>
</section>

<section class="pl-section">
  <h2 class="pl-section-title">Day-select drawer</h2>
  <p>.day-select — bottom-sheet opened by tapping an empty (or no-longer-resolvable) day in
    the weekplan grid. Same backdrop+panel structure as .recipe-preview. Suggestions
    (shared base ingredients with already-planned days, via suggestRecipes) come first,
    reusing .suggestion-list verbatim; a search field plus the full recipe list (reusing
    .recipe-list) follow. Tapping any entry assigns that recipe to the open day and closes
    the drawer.</p>
  <div style="position: relative; height: 480px; background: rgba(0,0,0,0.05); border-radius: 1rem; overflow: hidden;">
    <div class="day-select is-open" style="position: absolute; inset: 0;">
      <div class="day-select__panel" style="position: absolute; bottom: 0; transform: none;">
        <button type="button" class="icon-button day-select__close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        <h2 class="day-select__title">Sa, 17.10.</h2>
        <section class="suggestions">
          <h3>Mit ähnlichen Zutaten</h3>
          <ul class="suggestion-list">
            <li class="suggestion-list__item">
              <img class="suggestion-list__image" src="/assets/images/bifteki-mit-hirtenkase.jpg" alt="">
              <span class="suggestion-list__text">
                <span class="suggestion-list__name">Tortilla de Patatas</span>
                <span class="suggestion-list__shared">Auch mit: Kartoffeln</span>
              </span>
            </li>
          </ul>
        </section>
        <input type="search" placeholder="Rezepte durchsuchen…" autocomplete="off">
        <ul class="recipe-list">
          <li>
            <a href="#">
              <img src="/assets/images/bifteki-mit-hirtenkase.jpg" alt="">
              <span class="headline">Bifteki auf Orzotto</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Build and confirm the new classes compile and render**

Run: `npm run build && grep -c "weekplan-cell" _site/assets/style.css && grep -c "day-select" _site/assets/style.css`
Expected: both counts non-zero.

Run: `grep -c "weekplan-cell" _site/pattern-library/components/index.html`
Expected: non-zero.

- [ ] **Step 5: Commit**

```bash
git add src/pattern-library/components.njk src/assets/scss/weekplan/_styles.scss src/assets/style.scss
git commit -m "Add pattern-library entries and styles for the weekplan grid cell and day-select drawer"
```

---

## Task 3: Generalize `recipe-preview.js`'s action button

**Files:**
- Modify: `src/assets/lib/recipe-preview.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `createRecipePreview().open({ id, image, imageAlt, title, description, href,
  bringHref, action? })` — `action`, if present, is `{ label: string, icon: string (a
  `fa-solid` suffix like `'fa-calendar-xmark'`), onClick: () => void }`. When omitted,
  behavior is byte-for-byte what it is today (the "Add to planner" toggle).

- [ ] **Step 1: Add an `action`-aware branch to `open()`**

In `src/assets/lib/recipe-preview.js`, add a module-level variable next to
`previewRecipeId`:

```js
let previewRecipeId = null;
let currentAction = null;
```

Then change the `open()` function from:

```js
  function open({ id, image, imageAlt, title, description, href, bringHref }) {
    previewRecipeId = id;
    previewImage.src = image || '';
    previewImage.alt = imageAlt || '';
    previewTitle.textContent = title;
    previewDescription.textContent = description || '';
    previewCta.href = href;
    if (previewBringBtn) {
      previewBringBtn.hidden = !bringHref;
      if (bringHref) previewBringBtn.href = bringHref;
    }
    setAddButtonState(isPlanned(id));
    preview.hidden = false;
    requestAnimationFrame(() => preview.classList.add('is-open'));
    previewAddBtn.closest('.recipe-preview__panel').querySelector('.recipe-preview__close').focus();
  }
```

to:

```js
  function open({ id, image, imageAlt, title, description, href, bringHref, action }) {
    previewRecipeId = id;
    previewImage.src = image || '';
    previewImage.alt = imageAlt || '';
    previewTitle.textContent = title;
    previewDescription.textContent = description || '';
    previewCta.href = href;
    if (previewBringBtn) {
      previewBringBtn.hidden = !bringHref;
      if (bringHref) previewBringBtn.href = bringHref;
    }
    currentAction = action || null;
    if (currentAction) {
      previewAddBtn.classList.remove('is-active');
      previewAddBtn.disabled = false;
      previewAddBtn.setAttribute('aria-label', currentAction.label);
      previewAddBtn.removeAttribute('aria-pressed');
      previewAddBtn.querySelector('i').className = `fa-solid ${currentAction.icon}`;
    } else {
      setAddButtonState(isPlanned(id));
    }
    preview.hidden = false;
    requestAnimationFrame(() => preview.classList.add('is-open'));
    previewAddBtn.closest('.recipe-preview__panel').querySelector('.recipe-preview__close').focus();
  }
```

- [ ] **Step 2: Branch the click handler**

Change:

```js
  previewAddBtn.addEventListener('click', () => {
    if (!previewRecipeId) return;
    const planner = JSON.parse(localStorage.getItem('planner') || '[]');
    if (!planner.includes(previewRecipeId)) {
      planner.push(previewRecipeId);
      localStorage.setItem('planner', JSON.stringify(planner));
    }
    setAddButtonState(true);
  });
```

to:

```js
  previewAddBtn.addEventListener('click', () => {
    if (currentAction) {
      currentAction.onClick();
      return;
    }
    if (!previewRecipeId) return;
    const planner = JSON.parse(localStorage.getItem('planner') || '[]');
    if (!planner.includes(previewRecipeId)) {
      planner.push(previewRecipeId);
      localStorage.setItem('planner', JSON.stringify(planner));
    }
    setAddButtonState(true);
  });
```

- [ ] **Step 3: Run the unit test suite**

Run: `npx vitest run`
Expected: PASS, same counts as before this task (this file has no dedicated unit tests —
confirm nothing else regressed).

- [ ] **Step 4: Manually verify existing callers are unchanged**

Run: `npm run build && npm start` (or just `npm start` if already building), open
`/` in a browser, tap a recipe card, and confirm the preview still shows "Add to planner"
with the calendar-plus icon, toggling to a disabled "Added to planner" state on click —
no `action` is passed from `main.js`, so this path is untouched. Repeat on `/planner/` for
the same button. If the Chrome browser extension isn't connected in this environment, skip
the live check and instead confirm by reading the diff that `main.js`/`planner.js` never
pass `action` to `preview.open()` (`grep -n "preview.open" src/assets/main.js
src/assets/planner.js`) — note explicitly in your report whether the live check was done.

- [ ] **Step 5: Commit**

```bash
git add src/assets/lib/recipe-preview.js
git commit -m "Add an optional action param to recipe-preview's button, for Tag leeren on /plan/"
```

---

## Task 4: `/plan/` page skeleton + nav link

**Files:**
- Create: `src/plan.njk`
- Modify: `src/_includes/base.njk:17-21`

**Interfaces:**
- Produces: the element IDs Task 5/6/7's `plan.js` wires up — `weekplan-grid`,
  `day-select`, `day-select-title`, `day-select-missing-hint`, `day-select-suggestions`,
  `day-select-suggestion-list`, `day-select-search`, `day-select-list`,
  `recipe-preview-add` (reused from the shared `#recipe-preview` block), route `/plan/`.

- [ ] **Step 1: Create `src/plan.njk`**

```njk
---
layout: base.njk
title: Wochenplan
pageScript: plan.js
---
<div class="weekplan-page">
  <div class="weekplan-hero">
    <div class="planner-header">
      <span class="planner-eyebrow">Dein Plan</span>
      <h1>Die nächsten 14 Tage</h1>
    </div>
    <div id="weekplan-grid" class="weekplan-grid"></div>
  </div>
</div>

<div id="day-select" class="day-select" hidden>
  <div class="day-select__backdrop" data-close></div>
  <div class="day-select__panel" role="dialog" aria-modal="true" aria-labelledby="day-select-title">
    <button type="button" class="icon-button day-select__close" data-close aria-label="Close">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <h2 id="day-select-title" class="day-select__title"></h2>
    <p id="day-select-missing-hint" class="day-select__missing-hint" hidden>Rezept nicht mehr verfügbar.</p>

    <section id="day-select-suggestions" class="suggestions" hidden>
      <h3>Mit ähnlichen Zutaten</h3>
      <ul id="day-select-suggestion-list" class="suggestion-list"></ul>
    </section>

    <input id="day-select-search" type="search" placeholder="Rezepte durchsuchen…" autocomplete="off">
    <ul id="day-select-list" class="recipe-list">
      {% for item in collections.recipe %}
      <li data-id="{{ item.data.id }}">
        <a href="#" data-id="{{ item.data.id }}">
          {% if item.data.image %}<img src="{{ item.data.image }}" alt="{{ item.data.title }}">{% endif %}
          <span class="headline">{{ item.data.title }}</span>
        </a>
      </li>
      {% endfor %}
    </ul>
  </div>
</div>

<div id="recipe-preview" class="recipe-preview" hidden>
  <div class="recipe-preview__backdrop" data-close></div>
  <div class="recipe-preview__panel" role="dialog" aria-modal="true" aria-labelledby="recipe-preview-title">
    <button type="button" class="icon-button recipe-preview__close" data-close aria-label="Close preview">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="recipe-preview__image-wrap">
      <img class="recipe-preview__image" src="" alt="">
    </div>
    <h2 id="recipe-preview-title" class="recipe-preview__title"></h2>
    <p class="recipe-preview__description"></p>
    <div class="recipe-preview__actions">
      <a class="recipe-preview__cta" href="#">
        View Full Recipe <i class="fa-solid fa-arrow-right"></i>
      </a>
      <button type="button" id="recipe-preview-add" class="icon-button" aria-label="Tag leeren" aria-pressed="false">
        <i class="fa-solid fa-calendar-xmark"></i>
      </button>
    </div>
  </div>
</div>
```

This page's `#recipe-preview` has no `#recipe-preview-bring` element — Bring export isn't
part of this flow (requirements doc's filled-day tap only mentions preview + "Tag
leeren"); `createRecipePreview()` already treats that button as optional (it's guarded by
`if (previewBringBtn)` everywhere it's used).

- [ ] **Step 2: Add the third nav icon**

In `src/_includes/base.njk`, change:

```njk
<nav class="nav-island" aria-label="Main navigation">
    <div class="nav-pill" aria-hidden="true"></div>
    <a href="/" {% if page.url == "/" or "/recipes/" in page.url %}aria-current="page" {% endif %}aria-label="Rezepte"><i class="fa-solid fa-utensils"></i></a>
    <a href="/planner/" {% if page.url == "/planner/" %}aria-current="page" {% endif %}aria-label="Planer"><i class="fa-solid fa-calendar"></i></a>
</nav>
```

to:

```njk
<nav class="nav-island" aria-label="Main navigation">
    <div class="nav-pill" aria-hidden="true"></div>
    <a href="/" {% if page.url == "/" or "/recipes/" in page.url %}aria-current="page" {% endif %}aria-label="Rezepte"><i class="fa-solid fa-utensils"></i></a>
    <a href="/planner/" {% if page.url == "/planner/" %}aria-current="page" {% endif %}aria-label="Planer"><i class="fa-solid fa-calendar"></i></a>
    <a href="/plan/" {% if page.url == "/plan/" %}aria-current="page" {% endif %}aria-label="Wochenplan"><i class="fa-solid fa-calendar-days"></i></a>
</nav>
```

- [ ] **Step 3: Build and verify the page exists**

Run: `npm run build && test -f _site/plan/index.html && echo OK`
Expected: `OK`.

Run: `grep -c 'aria-label="Wochenplan"' _site/plan/index.html _site/index.html _site/planner/index.html`
Expected: a non-zero count in all three (the nav is shared via `base.njk`).

- [ ] **Step 4: Commit**

```bash
git add src/plan.njk src/_includes/base.njk
git commit -m "Add the /plan/ page skeleton and its bottom-nav entry"
```

---

## Task 5: `plan.js` — load state, render the grid, filled-day tap

**Files:**
- Create: `src/assets/plan.js`

**Interfaces:**
- Consumes: `getWindowDates`, `loadWeekplan`, `saveWeekplan` (Task 1); `createRecipePreview`
  with its `action` param (Task 3); the element IDs from Task 4.
- Produces: module-level `windowDates`, `plan`, `indexById`, `allRecipes` and a
  `renderGrid()` function that Task 6/7 also call after they mutate `plan`.

- [ ] **Step 1: Create `src/assets/plan.js` with grid rendering and the filled-day tap**

```js
import { getWindowDates, loadWeekplan, saveWeekplan } from './lib/weekplan.js';
import { createRecipePreview } from './lib/recipe-preview.js';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const preview = createRecipePreview();

let windowDates = [];
let plan = {};
let indexById = new Map();
let allRecipes = [];

async function init() {
  windowDates = getWindowDates(new Date());
  plan = loadWeekplan(windowDates);

  allRecipes = await fetch('/index.json').then(r => r.json()).catch(() => []);
  indexById = new Map(allRecipes.map(r => [r.id, r]));

  renderGrid();
  initGridTap();
}

function cellLabel(date) {
  const d = new Date(`${date}T00:00:00`);
  return { weekday: WEEKDAYS[d.getDay()], day: d.getDate() };
}

function renderGrid() {
  document.getElementById('weekplan-grid').innerHTML = windowDates.map(renderCell).join('');
}

function renderCell(date) {
  const { weekday, day } = cellLabel(date);
  const recipeId = plan[date];
  const recipe = recipeId ? indexById.get(recipeId) : null;

  let thumb;
  if (!recipeId) {
    thumb = '<span class="weekplan-cell__thumb weekplan-cell__thumb--empty"><i class="fa-solid fa-plus"></i></span>';
  } else if (!recipe) {
    thumb = '<span class="weekplan-cell__thumb weekplan-cell__thumb--warning"><i class="fa-solid fa-triangle-exclamation"></i></span>';
  } else if (recipe.image) {
    thumb = `<img class="weekplan-cell__thumb" src="${recipe.image}" alt="">`;
  } else {
    thumb = '<span class="weekplan-cell__thumb weekplan-cell__thumb--empty"><i class="fa-solid fa-utensils"></i></span>';
  }

  return `
    <button type="button" class="weekplan-cell" data-date="${date}" ${recipeId ? 'draggable="true"' : ''}>
      <span class="weekplan-cell__weekday">${weekday}</span>
      <span class="weekplan-cell__day">${day}</span>
      ${thumb}
    </button>`;
}

function clearDay(date) {
  plan[date] = null;
  saveWeekplan(plan);
  renderGrid();
  preview.close();
}

function initGridTap() {
  document.getElementById('weekplan-grid').addEventListener('click', e => {
    const cell = e.target.closest('.weekplan-cell');
    if (!cell) return;
    const date = cell.dataset.date;
    const recipeId = plan[date];

    if (!recipeId) {
      openDaySelect(date);
      return;
    }

    const recipe = indexById.get(recipeId);
    if (!recipe) {
      openDaySelect(date, { missing: true });
      return;
    }

    preview.open({
      id: recipeId,
      image: recipe.image || '',
      imageAlt: '',
      title: recipe.title,
      description: recipe.description || '',
      href: `/recipes/${recipeId}/`,
      action: {
        label: 'Tag leeren',
        icon: 'fa-calendar-xmark',
        onClick: () => clearDay(date)
      }
    });
  });
}

init();
```

`openDaySelect` is a forward reference to Task 6 — this file isn't runnable standalone
until that task lands; that's expected for this intermediate step (confirmed by Step 2's
build-only check, not a browser check).

- [ ] **Step 2: Build to confirm no syntax errors**

Run: `npm run build`
Expected: builds cleanly (11ty doesn't execute `plan.js`, so the missing `openDaySelect`
reference won't surface until Task 6 adds it and it's exercised in a browser).

- [ ] **Step 3: Commit**

```bash
git add src/assets/plan.js
git commit -m "Add plan.js: load weekplan state, render the grid, wire filled-day tap"
```

---

## Task 6: Day-select drawer — suggestions, search, assign

**Files:**
- Modify: `src/assets/plan.js`

**Interfaces:**
- Consumes: `suggestRecipes` from `src/assets/lib/suggestions.js`; `Fuse` from
  `/assets/fuse.min.mjs` (same import `main.js` uses); the element IDs from Task 4.
- Produces: `openDaySelect(date, { missing? }): void`, `assignDay(date, recipeId): void` —
  completes the forward reference left in Task 5.

- [ ] **Step 1: Add the imports and day-select state**

In `src/assets/plan.js`, change the top imports from:

```js
import { getWindowDates, loadWeekplan, saveWeekplan } from './lib/weekplan.js';
import { createRecipePreview } from './lib/recipe-preview.js';
```

to:

```js
import Fuse from '/assets/fuse.min.mjs';
import { getWindowDates, loadWeekplan, saveWeekplan } from './lib/weekplan.js';
import { suggestRecipes } from './lib/suggestions.js';
import { createRecipePreview } from './lib/recipe-preview.js';
```

Add alongside the other module-level state (`let windowDates = [];` etc.):

```js
let currentSelectDate = null;
let daySelectFuse = null;
let daySelectItems = [];
```

- [ ] **Step 2: Build the Fuse index and item list once at init**

In `init()`, after `indexById = new Map(...)`, add:

```js
  daySelectFuse = new Fuse(allRecipes, { keys: ['title', 'difficulty', 'aufwand'], threshold: 0.4 });
  daySelectItems = Array.from(document.querySelectorAll('#day-select-list > li'));
```

Then, after the existing `initGridTap();` call, add:

```js
  initDaySelect();
```

- [ ] **Step 3: Implement the day-select drawer**

Add these functions after `initGridTap`:

```js
function plannedRecipes() {
  return windowDates
    .map(d => plan[d])
    .filter(Boolean)
    .map(id => indexById.get(id))
    .filter(Boolean);
}

function renderDaySelectSuggestions() {
  const section = document.getElementById('day-select-suggestions');
  const suggestions = suggestRecipes(plannedRecipes(), allRecipes);
  if (suggestions.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  document.getElementById('day-select-suggestion-list').innerHTML = suggestions
    .map(({ recipe, shared }) => {
      const photo = recipe.image
        ? `<img class="suggestion-list__image" src="${recipe.image}" alt="">`
        : `<div class="suggestion-list__image suggestion-list__image--placeholder"><i class="fa-solid fa-utensils"></i></div>`;
      return `
        <li class="suggestion-list__item" data-id="${recipe.id}">
          ${photo}
          <span class="suggestion-list__text">
            <span class="suggestion-list__name">${recipe.title}</span>
            <span class="suggestion-list__shared">Auch mit: ${shared.join(', ')}</span>
          </span>
        </li>`;
    })
    .join('');
}

function openDaySelect(date, { missing = false } = {}) {
  currentSelectDate = date;
  const { weekday, day } = cellLabel(date);
  document.getElementById('day-select-title').textContent = `${weekday}, ${day}.`;
  document.getElementById('day-select-missing-hint').hidden = !missing;

  renderDaySelectSuggestions();
  document.getElementById('day-select-search').value = '';
  daySelectItems.forEach(el => { el.hidden = false; });

  const panel = document.getElementById('day-select');
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add('is-open'));
}

function closeDaySelect() {
  const panel = document.getElementById('day-select');
  panel.classList.remove('is-open');
  panel.addEventListener('transitionend', () => { panel.hidden = true; }, { once: true });
}

function assignDay(date, recipeId) {
  plan[date] = recipeId;
  saveWeekplan(plan);
  renderGrid();
  closeDaySelect();
}

function initDaySelect() {
  const panel = document.getElementById('day-select');

  panel.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) {
      closeDaySelect();
      return;
    }
    const suggestion = e.target.closest('.suggestion-list__item');
    if (suggestion) {
      assignDay(currentSelectDate, suggestion.dataset.id);
      return;
    }
    const link = e.target.closest('#day-select-list a[data-id]');
    if (link) {
      e.preventDefault();
      assignDay(currentSelectDate, link.dataset.id);
    }
  });

  document.getElementById('day-select-search').addEventListener('input', e => {
    const query = e.target.value.trim();
    if (!query) {
      daySelectItems.forEach(el => { el.hidden = false; });
      return;
    }
    const matchedIds = new Set(daySelectFuse.search(query).map(r => r.item.id));
    daySelectItems.forEach(el => { el.hidden = !matchedIds.has(el.dataset.id); });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) closeDaySelect();
  });
}
```

- [ ] **Step 4: Run the unit test suite**

Run: `npx vitest run`
Expected: PASS, same counts as Task 3 Step 3 (this task adds no new unit-testable pure
functions — DOM wiring, per the Global Constraints).

- [ ] **Step 5: Build and manually verify**

Run: `npm run build`

If the Chrome browser extension is connected: open `/plan/`, tap an empty day, confirm the
drawer opens with a search field and the full recipe list, type a known recipe title and
confirm the list filters, clear the search and tap a recipe to assign it, confirm the
drawer closes and the grid cell now shows that recipe's thumbnail. Then tap a day whose
recipe you just deleted from `/index.json` conceptually isn't possible to simulate without
editing data — instead confirm the "Rezept nicht mehr verfügbar" hint element exists by
inspecting `#day-select-missing-hint` in devtools (it'll be exercised for real once a
recipe is actually missing).

If the extension isn't connected, state that explicitly rather than claiming the UI was
exercised, and instead confirm via `grep -c "day-select" _site/plan/index.html` that the
drawer markup built correctly.

- [ ] **Step 6: Commit**

```bash
git add src/assets/plan.js
git commit -m "Wire the day-select drawer: suggestions, search, and assignment"
```

---

## Task 7: Drag-and-drop between days

**Files:**
- Modify: `src/assets/plan.js`

**Interfaces:**
- Consumes: `plan`, `renderGrid` (module state from Task 5).
- Produces: `swapDays(fromDate, toDate): void`.

- [ ] **Step 1: Add drag-and-drop wiring**

In `src/assets/plan.js`, add after `initDaySelect();` in `init()`:

```js
  initDragAndDrop();
```

Add these functions after `initDaySelect`:

```js
function swapDays(fromDate, toDate) {
  const temp = plan[toDate];
  plan[toDate] = plan[fromDate];
  plan[fromDate] = temp;
  saveWeekplan(plan);
  renderGrid();
}

function initDragAndDrop() {
  const grid = document.getElementById('weekplan-grid');

  grid.addEventListener('dragstart', e => {
    const cell = e.target.closest('.weekplan-cell[draggable="true"]');
    if (!cell) return;
    e.dataTransfer.setData('text/plain', cell.dataset.date);
  });

  grid.addEventListener('dragover', e => {
    if (e.target.closest('.weekplan-cell')) e.preventDefault(); // allow drop
  });

  grid.addEventListener('drop', e => {
    const target = e.target.closest('.weekplan-cell');
    if (!target) return;
    e.preventDefault();
    const fromDate = e.dataTransfer.getData('text/plain');
    const toDate = target.dataset.date;
    if (!fromDate || fromDate === toDate) return;
    swapDays(fromDate, toDate);
  });
}
```

- [ ] **Step 2: Run the unit test suite**

Run: `npx vitest run`
Expected: PASS, same counts as Task 6 Step 4.

- [ ] **Step 3: Build and manually verify (desktop drag)**

Run: `npm run build`

If the Chrome browser extension is connected: open `/plan/` on a wide-enough viewport,
assign two different days, drag one cell's thumbnail onto the other, and confirm their
recipes swap. Drag a filled cell onto an empty one and confirm it moves (source becomes
empty). Drag a cell onto itself and confirm nothing changes (no flicker, no data loss).

If the extension isn't connected, state that explicitly in your report instead of claiming
this was exercised.

- [ ] **Step 4: Commit**

```bash
git add src/assets/plan.js
git commit -m "Add desktop drag-and-drop to swap or move weekplan assignments"
```

---

## Task 8: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: all `weekplan.test.js` tests pass, plus every pre-existing test file's counts
unchanged from before this plan started.

- [ ] **Step 2: Full build**

Run: `npm run build`
Expected: builds cleanly; `_site/plan/index.html` exists alongside every existing page.

- [ ] **Step 3: Spot-check the built `/plan/` page**

Run:
```bash
grep -c 'weekplan-cell' _site/plan/index.html
grep -c 'day-select' _site/plan/index.html
grep -c 'aria-label="Wochenplan"' _site/plan/index.html _site/index.html _site/planner/index.html
```
Expected: all non-zero.

- [ ] **Step 4: End-to-end manual check (Review Focus items)**

If the Chrome browser extension is connected: walk through the full flow once —
open `/plan/`, assign a recipe via tap, open it via tap and clear it via "Tag leeren",
assign two days and swap them via drag, reload the page and confirm the assignments
persisted and the window still starts at today. Then open `/` and `/planner/` and confirm
the recipe-preview's "Add to planner" button still behaves exactly as before (Review Focus
item 5).

If the extension isn't connected, say so explicitly in your final report rather than
claiming this was visually verified.

- [ ] **Step 5: Report**

Summarize what changed (weekplan.js + tests, pattern-library entries, the generalized
recipe-preview action param, the new /plan/ page with grid/day-select/drag-and-drop, the
nav link), the test/build results from Steps 1–3, and whether Step 4's manual check was
possible or not.
