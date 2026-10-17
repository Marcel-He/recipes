# SCSS Formatting Ruleset — Design Spec

**Date:** 2026-06-14

## Goal

Add Prettier-based SCSS formatting with a single npm script (`npm run precommit`). No git hooks, no staged-file filtering — run manually before committing.

## Dependencies

- `prettier` (dev dependency, one package)

## Config

`.prettierrc`:
```json
{
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

- `singleQuote` — matches existing SCSS string style
- `tabWidth: 2` — matches existing indentation
- `printWidth: 100` — generous enough to avoid breaking long shadow/token lines

`.prettierignore`:
```
_site
node_modules
```

## npm Script

Add to `package.json`:
```json
"precommit": "prettier --write 'src/**/*.scss'"
```

## Side Effects

Prettier will expand single-line rules (e.g. `&:hover { ... }`) to multi-line. This is intentional — consistent block formatting across all files.