# Artisanal Harvest Styling — Design Spec

**Date:** 2026-06-13
**Scope:** Adapt `_variables.scss` and `style.scss` to the Artisanal Harvest design system; make one HTML change to `base.njk` for bottom nav island.

---

## 1. Files Changed

| File | Change |
|---|---|
| `src/assets/_variables.scss` | Replace all variables with Artisanal Harvest tokens |
| `src/assets/style.scss` | Full redesign using new tokens |
| `src/_includes/base.njk` | Move `<nav>` from inside `<header>` at top to a `<nav>` island at bottom of `<body>` |

No other files change. JS, templates, and data files are untouched.

**CSS custom properties:** The current `style.scss` declares a `:root {}` block with `--bg`, `--surface`, etc. and uses `var()` throughout. The redesign removes this pattern — SCSS variables are used directly in the compiled output. No CSS custom properties in the new stylesheet.

---

## 2. Variables (`_variables.scss`)

Replace existing variables with the full Artisanal Harvest palette plus typography, spacing, and radius tokens.

**Colors:**
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

// Tertiary (Ochre — for planner chips)
$tertiary:           #3b1f00;
$tertiary-container: #56340e;

// Error (for destructive actions)
$error: #ba1a1a;
```

**Typography:**
```scss
$font-display: 'Playfair Display', Georgia, serif;
$font-body:    'Plus Jakarta Sans', system-ui, sans-serif;
```

**Spacing & layout:**
```scss
$max-width: 1200px;
$gutter:    16px;
```

**Radius:**
```scss
$radius-sm:   0.25rem;
$radius:      0.5rem;
$radius-md:   0.75rem;
$radius-lg:   1rem;      // cards & drawers
$radius-xl:   1.5rem;
$radius-full: 9999px;    // buttons & nav pill
```

---

## 3. Typography (`style.scss`)

Load both fonts as `@font-face` from the existing TTF files in `src/assets/fonts/`:

```scss
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
```

**Usage rules:**
- `h1`, `h2`, `h3` → `$font-display`, bold
- All body text, labels, buttons, inputs → `$font-body`
- Difficulty / metadata labels → uppercase, `letter-spacing: 0.06em`, 11–12px, `$outline` color

---

## 4. Layout

- `body`: `background: $background`, `padding-bottom: 80px` (space for fixed bottom nav)
- `main`: `max-width: $max-width`, centered, `padding: 2rem 1.5rem`
- Remove all references to the old 900px max-width

---

## 5. Navigation Island (`base.njk` + `style.scss`)

**HTML change** — replace the current `<header><nav>…</nav></header>` block with a `<nav>` element placed just before `</body>`:

```html
<nav class="nav-island">
  <a href="/">Recipes</a>
  <a href="/planner/">Planner</a>
</nav>
```

The old `<header>` element and its wrapper are removed entirely.

**CSS:**
```scss
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
```

**Note:** `aria-current="page"` is not set by 11ty automatically. Since there are only two nav links, the active state is a nice-to-have — the CSS rule is in place but will only activate if `aria-current` is added later. This is not in scope for this implementation.

---

## 6. Buttons

All buttons: `border-radius: $radius-full`, `font-family: $font-body`, `font-weight: 600`.

### Default (Secondary)
```scss
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
```

### Primary — `#add-to-planner` (recipe detail page, `id`), `#bring-export`
```scss
background: $primary;
color: $on-primary;
border-color: $primary;
&:hover:not(:disabled) { background: $primary-container; border-color: $primary-container; }
```

### Small Secondary — `.add-to-planner` (recipe list items, `class` not `id`)
Same as default but `font-size: 12px; padding: 0.3rem 0.85rem`.

### Ghost — `#toggle-view` (Show per step)
```scss
background: none;
border: none;
color: $primary;
padding: 0;
font-size: 13px;
```

### Destructive — `#clear-planner`
```scss
color: $error;
border-color: $error;
&:hover:not(:disabled) { background: rgba($error, 0.06); }
```

### Servings controls — `#servings-down`, `#servings-up`
Circular pill: `width: 28px; height: 28px; padding: 0; font-size: 16px;` — secondary style, square aspect ratio forced to circle via `border-radius: $radius-full`.

### Remove chip — `.remove-recipe`
```scss
background: none; border: none; color: $outline; padding: 0; font-size: 1rem;
```

---

## 7. Recipe List Cards

```scss
#recipe-list {
  li {
    background: $surface-container-lowest;
    border: none;
    border-radius: $radius-lg;
    box-shadow: 0 2px 12px rgba($primary, 0.08);
    transition: box-shadow 0.15s, transform 0.15s;
    &:hover { box-shadow: 0 4px 20px rgba($primary, 0.14); transform: translateY(-1px); }
  }
  span { /* difficulty tag */
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $outline;
  }
}
```

---

## 8. Drawer Containers (Ingredients & Steps sections)

```scss
#ingredients-section,
#steps-section {
  background: $surface-container-lowest;
  border: none;
  border-radius: $radius-lg;
  box-shadow: 0 2px 12px rgba($primary, 0.08);
  padding: 1.25rem 1.4rem;
}
```

---

## 9. Search Input

```scss
#search {
  background: $surface-container-lowest;
  border: 1px solid $outline-variant;
  border-radius: $radius-lg;
  font-family: $font-body;

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.15);
  }
}
```

---

## 10. Planner Chips

```scss
#recipe-tags li {
  background: rgba($tertiary-container, 0.12);
  border: 1px solid rgba($tertiary-container, 0.25);
  border-radius: $radius-full;
  color: $tertiary;
  font-family: $font-body;
  font-size: 13px;
  font-weight: 600;
}
```

---

## 11. Difficulty Label

```scss
.difficulty {
  font-family: $font-body;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $outline;
}
```

---

## Out of Scope

- `aria-current="page"` active nav state (requires server-side logic)
- Circular image framing (no images in the app currently)
- Dark mode
- Responsive breakpoints beyond single-column mobile layout
- Animation beyond button hover transitions
