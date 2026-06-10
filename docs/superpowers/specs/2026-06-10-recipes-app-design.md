# Recipes App — Design Spec

Date: 2026-06-10

## Stack

- **11ty (Eleventy)** — static site generator, compiles MD + Nunjucks templates into HTML
- **Vanilla JS** — all client-side interactivity
- **Fuse.js** — client-side fuzzy search
- **Netlify or Vercel** — static hosting, no backend

## Folder Structure

```
recipes-app/
  src/
    recipes/
      bolognese.md          ← frontmatter + description + steps (11ty source)
      bolognese.json        ← structured data (ingredients, servings, etc.)
    _includes/
      base.njk              ← base HTML layout
      recipe.njk            ← recipe detail layout
    _data/
      recipes.js            ← reads all .json files, exposes as 11ty global data
    assets/
      main.js               ← vanilla JS (search, scaling, planner, wake lock)
      style.css
      fuse.js               ← vendored library
    index.njk               ← recipe list page
    planner.njk             ← meal planner / shopping list page
  .eleventy.js
  package.json
```

## Data Model

Each recipe has two files:

**`bolognese.md`** — frontmatter with `id`, `title`, `aufwand`, `servings`, followed by markdown description and step-by-step instructions.

**`bolognese.json`** — structured data consumed by client-side JS:

```json
{
  "id": "bolognese",
  "title": "Spaghetti Bolognese",
  "aufwand": "einfach",
  "servings": 4,
  "ingredients": [
    { "name": "Hackfleisch", "amount": 500, "unit": "g", "step": 1 }
  ]
}
```

The `step` field on each ingredient links it to a specific recipe step, enabling the per-step ingredients view.

`_data/recipes.js` reads all JSON files at build time and exposes them as a global collection. This also drives generation of a flat `index.json` served to the client, so the browser does a single fetch on load to have all recipe metadata in memory.

## Pages

### Recipe List (`/`)
- Loads `index.json` on page load, holds all recipe metadata in memory
- Fuse.js powers live fuzzy search over title, tags, aufwand
- Each card links to the 11ty-rendered recipe detail page
- "Add to planner" button on each card writes the recipe ID to `localStorage`

### Recipe Detail (`/recipes/[id]/`)
- Rendered statically by 11ty from the MD file
- JS fetches the matching `.json` on load for dynamic features
- **Scale servings:** JS reads base amounts from JSON, rewrites ingredient quantities in the DOM
- **Ingredients per step:** groups ingredients by `step` field, renders a parallel view alongside the steps
- **Aggregated ingredients list:** `reduce` over all ingredients for a full shopping view of one recipe
- **Keep screen on:** `navigator.wakeLock.request('screen')` toggled by a button
- **Add to planner:** button writes recipe ID to `localStorage`

### Planner (`/planner/`)
- Reads recipe IDs from `localStorage`
- Fetches the `.json` file for each selected recipe
- Aggregates all ingredients via `reduce`, merging by name+unit
- Renders the merged shopping list
- **Bring export:** constructs a Bring URL scheme from the aggregated list and opens it

## State

| Data | Storage |
|---|---|
| Recipe index | In memory (fetched once from `index.json`) |
| Loaded recipe JSONs | In memory (cached per session) |
| Planner selection | `localStorage` |
| Favorites | `localStorage` |
| History | `localStorage` |

## Adding New Recipes

1. Drop `recipe-name.md` and `recipe-name.json` into `src/recipes/`
2. Update `index.json` (or regenerate via `_data/recipes.js` at build time)
3. Push — Netlify/Vercel rebuilds and deploys automatically

No import logic lives in the app. An external Claude Project skill normalizes any recipe source into the required MD + JSON format.

## Scaling

The `index.json` pattern (single fetch, all metadata in memory) stays performant well past 1000 recipes. No database is needed at this scale. A database would only be warranted if multi-user write access were ever required.
