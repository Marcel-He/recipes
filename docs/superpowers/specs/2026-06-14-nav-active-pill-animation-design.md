# Nav Active Pill + Sliding Animation

**Date:** 2026-06-14

## Goal

Two improvements to the bottom nav island:

1. The "Recipes" link should stay active when inside a recipe detail page (`/recipes/slug/`), not just on the home page (`/`).
2. When the active item changes between navigations, a pill background should slide to the new position using the browser's cross-document View Transitions API.

## Active State Fix

**File:** `src/_includes/base.njk`

The "Recipes" link condition changes from an exact URL match to a substring check:

```njk
{% if page.url == "/" or "/recipes/" in page.url %}aria-current="page"{% endif %}
```

This covers:
- `/` — home / recipe list
- `/recipes/bolognese/` — recipe detail (and any other recipe slug)

The "Planner" condition (`page.url == "/planner/"`) is unchanged.

## Sliding Pill — HTML

**File:** `src/_includes/base.njk`

Each nav `<a>` gets a `<span class="pill-bg">` as its first child:

```html
<nav class="nav-island" aria-label="Main navigation">
  <a href="/" {% if page.url == "/" or "/recipes/" in page.url %}aria-current="page"{% endif %}>
    <span class="pill-bg"></span>Recipes
  </a>
  <a href="/planner/" {% if page.url == "/planner/" %}aria-current="page"{% endif %}>
    <span class="pill-bg"></span>Planner
  </a>
</nav>
```

The span is absolutely positioned behind the link text and carries the pill background. Only the active link's span gets `view-transition-name: nav-pill`, so the browser tracks it across page navigations.

## Sliding Pill — CSS

**File:** `src/assets/style.scss`

### 1. Enable cross-document view transitions

Add at the top of the stylesheet (after `@use`):

```scss
@view-transition {
  navigation: auto;
}
```

### 2. Nav island `a` updates

Inside the existing `.nav-island a` block:

- Add `position: relative` to the `<a>` so the span can anchor to it.
- Change `transition: background 0.15s, color 0.15s` to `transition: color 0.15s` — background is now on `.pill-bg` so animating it on the `<a>` is redundant.
- Remove `background: $primary` from `&[aria-current="page"]` (background moves to `.pill-bg`).
- Keep `color: $on-primary` on `&[aria-current="page"]`.

Add `.pill-bg` styles:

```scss
.pill-bg {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  z-index: -1;
}

&[aria-current="page"] .pill-bg {
  background: $primary;
  view-transition-name: nav-pill;
}
```

### 3. Animate the slide

```scss
::view-transition-group(nav-pill) {
  animation-duration: 0.35s;
  animation-timing-function: cubic-bezier(0.34, 1.2, 0.64, 1); // spring
}

::view-transition-old(nav-pill),
::view-transition-new(nav-pill) {
  animation: none; // suppress content crossfade — pill is a solid colour
}
```

## Browser Support

Cross-document view transitions work in Chrome 126+ and Edge 126+. Safari and Firefox fall back gracefully to the existing instant colour switch — no degradation.

## Files Changed

| File | Change |
|------|--------|
| `src/_includes/base.njk` | Active condition fix + `<span class="pill-bg">` in each link |
| `src/assets/style.scss` | `@view-transition`, `position: relative`, `.pill-bg` styles, `::view-transition-*` rules |
