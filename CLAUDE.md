# Recipes — Project Notes

## Stack
- **11ty** static site generator with Nunjucks templates
- **SCSS** compiled via `style.css.11ty.js`; variables in `src/assets/_variables.scss`
- **Font Awesome 6** for icons (CDN)
- Fonts: Playfair Display (headings), Plus Jakarta Sans (body)

---

## Pattern Library

Located at `/pattern-library/`. Build styles here before wiring them into screens.

**Pages**
- `/pattern-library/atoms/` — base-level tokens and elements: colors, typography scale, spacing, buttons, inputs, badges, icons
- `/pattern-library/components/` — composed UI: cards, nav patterns, chips, lists, drawers (combines what would be molecules + organisms)

**Layout**
- Uses `src/_includes/pattern-library.njk`, which extends `base.njk`
- Sub-nav at the top tabs between Atoms and Components
- The bottom nav island links to the pattern library via the swatchbook icon

**Workflow**
1. Define and document styles in the pattern library
2. Reference those patterns when building screens — don't invent new styles on the screen level
