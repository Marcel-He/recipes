# Cook Mode Redesign — Step Titles + Mockup Layout

**Date:** 2026-10-05

## Goal

Restyle the cook-mode overlay (`src/_includes/recipe.njk` / `src/assets/lib/cook-mode.js` /
`src/assets/scss/recipe-detail/_styles.scss`) to match a supplied mockup: recipe title +
dot progress indicator at the top, a plain ingredients list for the current step, a short
step title, the step body, and a Back/"Next Step" bottom bar. This requires adding step
titles to the recipe content — a content-model change that touches every existing recipe
and the `rezept-normalisierer` import skill, not just cook mode's CSS.

## 1. Content format: bold lead-in, no JSON schema change

Each markdown step gets a short bold title at the start of its sentence:

```markdown
1. **Öl erhitzen & würzen.** Olivenöl in einer großen Pfanne erhitzen und Harissa,
   Tomatenmark, Paprika, Knoblauch, Kreuzkümmel und ¾ TL Salz zusammen anbraten.
```

Markdown renders this as `<strong>Öl erhitzen & würzen.</strong> Olivenöl in...` inside
the existing `<li>` — the `<ol>`/`<li>` structure that `renderStepIngredients` and cook
mode both index into by position is untouched. No change to the per-recipe `.json` files.

Rejected alternative: turning each step into its own `### Heading` + paragraph. This
would break the positional `ol > li` indexing used throughout `recipe.js` and
`cook-mode.js` (`groupIngredientsByStep` keys ingredients by `step: <li position>`) for
no benefit beyond what the bold-prefix approach already gives.

The regular (non-cook-mode) step list on the recipe page is unaffected — the bold phrase
just reads as emphasis there, a normal recipe-card convention.

## 2. Migration of existing recipes

12 recipes, 83 steps total, across `src/recipes/*/index.md`. Each step line gets a short
German bold title prefixed onto the existing sentence; step wording itself doesn't change.
Done as its own commit, separate from the rendering/styling changes, so a title that needs
wordsmithing later is a clean, isolated diff.

## 3. `rezept-normalisierer` skill update

**File:** `.claude/skills/rezept-normalisierer/SKILL.md`

Add a rule under "Regeln" (near the existing ingredient-naming rules) requiring every
step to start with a short bold title phrase (2–4 words, German, ending in a period),
and update the worked example (`spaghetti-carbonara.md`) to include titled steps. This
makes every future import already produce titled steps — no separate migration needed
going forward.

## 4. Cook-mode layout

**File:** `src/_includes/recipe.njk`

```html
<div id="cook-mode" class="cook-mode" hidden>
  <button type="button" id="cook-mode-close" class="icon-button cook-mode__close" aria-label="Exit cook mode">
    <i class="fa-solid fa-xmark"></i>
  </button>
  <div class="cook-mode__header">
    <h2 id="cook-mode-title" class="cook-mode__title"></h2>
    <div class="cook-mode__progress">
      <span id="cook-mode-dots" class="cook-mode__dots"></span>
      <span id="cook-mode-progress-text" class="cook-mode__progress-text"></span>
    </div>
  </div>
  <div id="cook-mode-step" class="cook-mode__step">
    <div id="cook-mode-ingredients" class="cook-mode__ingredients"></div>
    <h3 id="cook-mode-step-title" class="cook-mode__step-title"></h3>
    <p id="cook-mode-step-body" class="cook-mode__step-body"></p>
  </div>
  <div class="cook-mode__controls">
    <button type="button" id="cook-mode-prev" class="cook-mode__back">
      <i class="fa-solid fa-chevron-left"></i> Back
    </button>
    <button type="button" id="cook-mode-next" class="cook-mode__next">
      Next Step <i class="fa-solid fa-chevron-right"></i>
    </button>
  </div>
</div>
```

- The X close button floats top-right (`.cook-mode__close`, same `.icon-button` base as
  elsewhere), separate from the centered title/progress block.
- `#cook-mode-title` is filled from the recipe's `<h1>` text at open time.
- `#cook-mode-dots` gets one `<span class="cook-mode__dot">` per step, `.is-current` on
  the active one; `#cook-mode-progress-text` gets `"STEP {n} OF {total}"`.
- `#cook-mode-ingredients` is only populated (and only visible) when the current step has
  ingredients — an "INGREDIENTS" eyebrow label followed by one line per ingredient,
  `Name (qty unit)` — e.g. `Paprika (300 g)`, or bare `Joghurt` when there's no quantity.
- Back (`#cook-mode-prev`) is a ghost/text button, disabled on the first step (unchanged
  behavior from today, just restyled). Forward (`#cook-mode-next`) is a solid pill
  labeled "Next Step →"; on the last step its label changes to "Done" and clicking it
  calls `close()` instead of advancing.

## 5. Data flow — ingredients passed in, not scraped

**File:** `src/assets/recipe.js`

Today, cook mode reads `li.innerHTML` (which includes the ingredient chip div
`renderStepIngredients` prepends) straight from the DOM. The redesigned ingredients list
needs structured `{name, amount, unit}` data instead of rendered chip HTML, so:

- `renderIngredients()` keeps a module-level `currentStepGroups` variable, set from
  `groupIngredientsByStep(scaled)` alongside the existing call to `renderStepIngredients`.
- `createCookMode({ requestWakeLock, releaseWakeLock })`'s `open()` becomes
  `open(stepGroups)`; the `start-cook-mode` click handler calls
  `cookMode.open(currentStepGroups)`.
- Cook mode still reads step title/body from the live `#steps-section ol > li` elements
  (servings changes don't need to be re-synced while the overlay is open, same reasoning
  as before — the overlay covers the servings control).

## 6. Step title/body parsing — pure, tested function

**File:** `src/assets/lib/cook-mode.js`

A pure string function, continuing the existing TDD pattern (`nextStepIndex`,
`prevStepIndex`, `swipeDirection`):

```js
export function parseStep(html) {
  const match = html.match(/^\s*(?:<div class="step-ingredients">.*?<\/div>)?\s*<strong>(.*?)\.?<\/strong>\s*(.*)$/s);
  if (!match) return { title: '', body: html.trim() };
  return { title: match[1], body: match[2].trim() };
}
```

- Input: a step `<li>`'s `innerHTML` (the leading ingredient-chip div, if present, is
  stripped defensively — cook mode no longer uses it, but the live DOM still has it from
  `renderStepIngredients`).
- Output: `{ title, body }`, trailing period stripped from the title to match the mockup
  ("Preheat & Season", not "Preheat & Season.").
- Tests cover: title+body split, a step with no bold title (falls back to `title: ''`,
  full text as body — e.g. for any recipe not yet migrated), and the leading
  ingredient-chip div being stripped correctly.

## 7. Ingredient line formatting — pure, tested function

**File:** `src/assets/lib/format.js`

```js
export function formatIngredientParenthetical(ingredient) {
  const qty = formatQuantity(ingredient);
  return qty ? `${ingredient.name} (${qty})` : ingredient.name;
}
```

Tests mirror the existing `formatQuantity` tests: with amount+unit, with neither (falls
back to bare name), with amount `0` (also bare name, consistent with `formatQuantity`'s
existing treatment of `0` as "no quantity").

## 8. Styling

**File:** `src/assets/scss/recipe-detail/_styles.scss`

Replace the current `.cook-mode__header` / `.cook-mode__progress` / `.cook-mode__step` /
`.cook-mode__controls` / `.cook-mode__nav` rules with mockup-matching styles:

- `.cook-mode__title` — `$font-display`, centered, `$text-headline-md-size`.
- `.cook-mode__progress` — centered row, `.cook-mode__dots` as inline flex of small
  circles (`$border` color, `$brand` when `.is-current`), `.cook-mode__progress-text` as
  small uppercase label (`$text-subtle`), same visual language as `.difficulty`.
- `.cook-mode__close` — `position: fixed; top/right` like `.back-button--floating`.
- `.cook-mode__ingredients` — "INGREDIENTS" eyebrow (reuse the `.difficulty`-style label
  treatment) + plain stacked lines, left-aligned, `$text-base`/`$text-subtle` split
  between name and quantity (reusing the subtle-quantity convention from
  `.ingredient-qty` elsewhere on the page, just not chip-styled).
- `.cook-mode__step-title` — `$font-display`, left-aligned heading.
- `.cook-mode__step-body` — body copy, `$text-body-lg-size`/`$text-body-lg-line`.
- `.cook-mode__controls` — flex row, space-between; `.cook-mode__back` ghost/text style;
  `.cook-mode__next` solid dark pill (reuse `$brand`/`$brand-text`, full corner radius)
  with a `.is-done` variant (same visual, just confirms the label swap in JS, no new CSS
  needed beyond what `.cook-mode__next` already covers).

The pattern library's "Cook mode" entry (`src/pattern-library/components.njk`) gets
updated to the new markup so it documents the final version.

## 9. Testing

- `tests/lib/cook-mode.test.js` — add cases for `parseStep` (see §6); keep the existing
  `nextStepIndex`/`prevStepIndex`/`swipeDirection` tests.
- `tests/lib/format.test.js` — add cases for `formatIngredientParenthetical` (see §7).
- DOM wiring (`createCookMode`, the markup, `recipe.js` glue) stays untested, consistent
  with the rest of `recipe.js`/`planner.js`/`recipe-preview.js` in this codebase.
- Manual/build verification: `npm test`, `npm run build`, fetch the built recipe and
  pattern-library pages to confirm the new markup/CSS are present (same approach used
  for the original cook-mode build, since the Chrome browser extension isn't reliably
  available in this environment for interactive verification).

## Files Changed

| File | Change |
|------|--------|
| `src/recipes/*/index.md` (12 files) | Add a bold title phrase to each of the 83 steps |
| `.claude/skills/rezept-normalisierer/SKILL.md` | New rule + updated example requiring step titles |
| `src/_includes/recipe.njk` | Cook-mode markup restructured to match the mockup |
| `src/assets/recipe.js` | Track `currentStepGroups`; `cookMode.open()` takes step ingredient groups |
| `src/assets/lib/cook-mode.js` | Add `parseStep`; `open()` signature change; dots/title/ingredients rendering |
| `src/assets/lib/format.js` | Add `formatIngredientParenthetical` |
| `src/assets/scss/recipe-detail/_styles.scss` | Replace `.cook-mode__*` rules with mockup-matching styles |
| `src/pattern-library/components.njk` | Update "Cook mode" demo markup |
| `tests/lib/cook-mode.test.js` | Add `parseStep` tests |
| `tests/lib/format.test.js` | Add `formatIngredientParenthetical` tests |
