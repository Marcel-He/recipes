# Artisanal Harvest Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the recipe app using the Artisanal Harvest design system — Playfair Display + Plus Jakarta Sans typography, forest green palette, bottom floating nav island, white drawer cards, pill buttons.

**Architecture:** Three files change: `_variables.scss` (token replacement), `style.scss` (complete rewrite), `base.njk` (header removed, nav moved to bottom island as `<nav class="nav-island">`). No JS, data, or other template changes.

**Tech Stack:** SCSS compiled via `sass` npm package + 11ty template (`style.css.11ty.js`), Nunjucks templates, 11ty v3. Build command: `npm run build`. Expected output: `[11ty] Copied N Wrote 7 files in X seconds`.

---

### Task 1: Replace `_variables.scss`

**Files:**
- Modify: `src/assets/_variables.scss`

- [ ] **Step 1: Overwrite `src/assets/_variables.scss` with Artisanal Harvest tokens**

```scss
// Surfaces
$background:                #fcf9f8;
$surface-container-lowest:  #ffffff;
$surface-container-low:     #f6f3f2;
$surface-container:         #f0eded;
$surface-container-high:    #eae7e7;
$surface-container-highest: #e4e2e1;
$surface-dim:               #dcd9d9;

// Content
$on-surface:         #1b1c1c;
$on-surface-variant: #414844;
$outline:            #717973;
$outline-variant:    #c1c8c2;

// Primary (Forest Green)
$primary:           #012d1d;
$on-primary:        #ffffff;
$primary-container: #1b4332;

// Tertiary (Ochre — planner chips)
$tertiary:           #3b1f00;
$tertiary-container: #56340e;

// Error (destructive actions)
$error: #ba1a1a;

// Typography
$font-display: 'Playfair Display', Georgia, serif;
$font-body:    'Plus Jakarta Sans', system-ui, sans-serif;

// Layout
$max-width: 1200px;
$gutter:    16px;

// Radius
$radius-sm:   0.25rem;
$radius:      0.5rem;
$radius-md:   0.75rem;
$radius-lg:   1rem;
$radius-xl:   1.5rem;
$radius-full: 9999px;
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: `[11ty] Copied 17 Wrote 7 files in X seconds` (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/assets/_variables.scss
git commit -m "feat: replace SCSS variables with Artisanal Harvest design tokens"
```

---

### Task 2: Update `base.njk` — bottom nav island

**Files:**
- Modify: `src/_includes/base.njk`

- [ ] **Step 1: Overwrite `src/_includes/base.njk`**

Remove the `<header>` element entirely. Add `<nav class="nav-island">` as the last child of `<body>`, after the script tag.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title or "Recipes" }}</title>
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <main>
    {{ content | safe }}
  </main>
  {% if pageScript %}
  <script type="module" src="/assets/{{ pageScript }}"></script>
  {% endif %}
  <nav class="nav-island">
    <a href="/">Recipes</a>
    <a href="/planner/">Planner</a>
  </nav>
</body>
</html>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: `[11ty] Copied 17 Wrote 7 files in X seconds` (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/_includes/base.njk
git commit -m "feat: replace top header with bottom floating nav island"
```

---

### Task 3: Rewrite `style.scss`

**Files:**
- Modify: `src/assets/style.scss`

- [ ] **Step 1: Overwrite `src/assets/style.scss` with the full redesign**

```scss
@use 'variables' as *;

// ── Fonts ──────────────────────────────────────────────────────────────────
@font-face {
  font-family: 'Playfair Display';
  src: url('/assets/fonts/PlayfairDisplay-VariableFont_wght.ttf') format('truetype');
  font-weight: 300 900;
  font-display: swap;
}

@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/assets/fonts/PlusJakartaSans-VariableFont_wght.ttf') format('truetype');
  font-weight: 200 800;
  font-display: swap;
}

// ── Reset ──────────────────────────────────────────────────────────────────
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }

// ── Base ───────────────────────────────────────────────────────────────────
body {
  margin: 0;
  font-family: $font-body;
  font-size: 16px;
  line-height: 1.6;
  background: $background;
  color: $on-surface;
  padding-bottom: 80px;
}

main {
  max-width: $max-width;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

// ── Typography ─────────────────────────────────────────────────────────────
h1, h2, h3 {
  font-family: $font-display;
  color: $on-surface;
}

h1 { font-size: 32px; font-weight: 700; line-height: 40px; margin: 0 0 0.25rem; }
h2 { font-size: 24px; font-weight: 600; line-height: 32px; margin: 0 0 0.75rem; }

// ── Nav island ─────────────────────────────────────────────────────────────
.nav-island {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba($outline-variant, 0.6);
  border-radius: $radius-full;
  padding: 0.45rem 0.75rem;
  box-shadow: 0 4px 24px rgba($primary, 0.14), 0 1px 4px rgba($primary, 0.08);

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

    &[aria-current="page"] {
      background: $primary;
      color: $on-primary;
    }
  }
}

// ── Search ─────────────────────────────────────────────────────────────────
#search {
  width: 100%;
  padding: 0.75rem 1rem;
  background: $surface-container-lowest;
  border: 1px solid $outline-variant;
  border-radius: $radius-lg;
  font-family: $font-body;
  font-size: 1rem;
  color: $on-surface;
  margin-bottom: 1.5rem;

  &::placeholder { color: $outline; }

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.15);
  }
}

// ── Recipe list ────────────────────────────────────────────────────────────
#recipe-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.9rem 1.1rem;
    background: $surface-container-lowest;
    border: none;
    border-radius: $radius-lg;
    box-shadow: 0 2px 12px rgba($primary, 0.08);
    transition: box-shadow 0.15s, transform 0.15s;

    &:hover { box-shadow: 0 4px 20px rgba($primary, 0.14); transform: translateY(-1px); }
  }

  a {
    flex: 1;
    text-decoration: none;
    color: $on-surface;
    font-weight: 600;

    &:hover { color: $primary; }
  }

  span {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $outline;
  }
}

// ── Buttons ────────────────────────────────────────────────────────────────
button {
  background: transparent;
  color: $primary;
  border: 1.5px solid $primary;
  border-radius: $radius-full;
  padding: 0.45rem 1.1rem;
  font-family: $font-body;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover:not(:disabled) { background: rgba($primary, 0.06); }
  &:disabled { opacity: 0.4; cursor: default; }
}

// Primary — recipe detail page + export
#add-to-planner,
#bring-export {
  background: $primary;
  color: $on-primary;
  border-color: $primary;

  &:hover:not(:disabled) {
    background: $primary-container;
    border-color: $primary-container;
    color: $on-primary;
  }
}

// Small secondary — list-item "+ Planner" (class, not id)
.add-to-planner {
  font-size: 12px;
  padding: 0.3rem 0.85rem;
}

// Ghost — show per step toggle
#toggle-view {
  background: none;
  border: none;
  color: $primary;
  padding: 0;
  font-size: 13px;
}

// Destructive — clear planner
#clear-planner {
  color: $error;
  border-color: $error;

  &:hover:not(:disabled) { background: rgba($error, 0.06); }
}

// Circular servings controls
#servings-down,
#servings-up {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// Remove planner chip
.remove-recipe {
  background: none;
  border: none;
  color: $outline;
  padding: 0;
  font-size: 1rem;
  cursor: pointer;

  &:hover { color: $tertiary; }
}

// ── Recipe detail ──────────────────────────────────────────────────────────
[data-recipe-id] h1 { margin: 2rem 0 0.25rem; }

.difficulty {
  display: inline-block;
  font-family: $font-body;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $outline;
  margin-top: 0.25rem;
}

.servings-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.25rem 0;

  label { font-weight: 600; font-size: 13px; }
}

#servings {
  font-size: 1rem;
  font-weight: 700;
  min-width: 1.5rem;
  text-align: center;
}

// ── Drawer containers ──────────────────────────────────────────────────────
#ingredients-section,
#steps-section {
  margin-top: 1rem;
  padding: 1.25rem 1.4rem;
  background: $surface-container-lowest;
  border: none;
  border-radius: $radius-lg;
  box-shadow: 0 2px 12px rgba($primary, 0.08);

  h2 { margin: 0 0 0.75rem; }
  ul, ol { padding-left: 1.25rem; margin: 0; }
  li { margin-bottom: 0.35rem; }
}

// ── Planner chips ──────────────────────────────────────────────────────────
#recipe-tags {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.85rem;
    background: rgba($tertiary-container, 0.12);
    border: 1px solid rgba($tertiary-container, 0.25);
    border-radius: $radius-full;
    font-family: $font-body;
    font-size: 13px;
    font-weight: 600;
    color: $tertiary;
  }
}

// ── Shopping list ──────────────────────────────────────────────────────────
#shopping-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    padding: 0.6rem 0;
    border-bottom: 1px solid $outline-variant;
    font-size: 16px;

    &:last-child { border-bottom: none; }
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: `[11ty] Copied 17 Wrote 7 files in X seconds` (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/assets/style.scss
git commit -m "feat: apply Artisanal Harvest design system to stylesheet"
```

---

### Task 4: Visual verification

**Files:** None (read-only check)

- [ ] **Step 1: Start dev server**

Run: `npm start`
Expected: Server running at `http://localhost:8080` (or similar port printed in output)

- [ ] **Step 2: Check recipe list page (`/`)**

Open `http://localhost:8080` and verify:
- Cream (`#fcf9f8`) background
- White recipe cards with soft green shadow, 1rem border-radius
- Bottom floating pill nav with backdrop blur
- No top header/nav bar
- Difficulty tags: uppercase, muted, small
- `+ Planner` buttons: small, outlined green, pill-shaped

- [ ] **Step 3: Check recipe detail page (e.g. `/recipes/bolognese/`)**

Verify:
- Title rendered in Playfair Display (serif)
- `+ Planner` button: solid forest green, pill
- `Keep screen on` button: outlined green, pill
- `Show per step`: no border, green text
- Servings `−`/`+`: small circles
- Ingredients and Steps sections: white drawer cards with shadow

- [ ] **Step 4: Check planner page (`/planner/`)**

Verify:
- Recipe chips: ochre tint background, dark ochre text, pill shape
- `Export to Bring`: solid green (disabled → 40% opacity)
- `Clear planner`: outlined red

- [ ] **Step 5: Stop dev server and commit plan**

```bash
git add docs/superpowers/plans/2026-06-13-artisanal-harvest-styling.md
git commit -m "docs: add Artisanal Harvest styling implementation plan"
```
