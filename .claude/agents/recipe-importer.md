---
name: recipe-importer
description: Use when importing a new recipe into this site from an external URL — fetches the page, normalizes it into this repo's recipe format via rezept-normalisierer, and generates a plate-centered square thumbnail via og-thumbnail, wiring both together under src/recipes/<id>/.
tools: Read, Write, Bash, WebFetch, WebSearch
skills: [rezept-normalisierer, og-thumbnail]
---

# Recipe Importer

## Overview

Given a URL to an external recipe page, produces a complete recipe entry for this
site: `src/recipes/<id>/index.md` + `src/recipes/<id>/<id>.json` (per the
`rezept-normalisierer` skill's rules) plus a square, plate-centered dish photo at
`src/assets/images/<id>.jpg` (via the `og-thumbnail` skill's scripts), with the
`.md` frontmatter wired to point at that image.

The two skills are independent and don't know about each other or about this
repo's file layout — this agent is the glue.

## Steps

1. **Fetch and normalize the recipe content**

   Fetch the given URL (WebFetch) and read off the title, ingredients, and
   instructions. Apply the `rezept-normalisierer` rules exactly (ID
   transliteration, `aufwand` values, ingredient/step structure, allowed units,
   German output) to derive `id`, `title`, `aufwand`, `servings`, a short
   description, the numbered steps, and the ingredients list. Do not write any
   files yet — just derive the data now so `<id>` is known for step 2.

2. **Generate the thumbnail**

   Follow the `og-thumbnail` skill's full workflow (including its `WebSearch`
   fallback for pages with no usable image or a non-top-down one) against the
   *same URL*, but use the recipe's own `<id>` as the output filename instead
   of a title-derived slug:

   ```bash
   node .claude/skills/og-thumbnail/scripts/fetch-og-image.mjs "<url>"
   ```

   This prints `{ tempImagePath, title, ogImageUrl }`. If `tempImagePath` is
   `null`, or the image isn't a top-down (overhead) shot of the dish, run the
   skill's search fallback (step 1b) before giving up — only report "no
   thumbnail" if that fallback is also exhausted.

   Once a usable top-down `tempImagePath` is in hand (from the original URL or
   the fallback), estimate the plate's center as normalized `cx`, `cy` (each in
   `[0, 1]`), then:

   ```bash
   node .claude/skills/og-thumbnail/scripts/crop-square.mjs --input "<tempImagePath>" --output "src/assets/images/<id>.jpg" --cx <cx> --cy <cy> --size 800
   ```

3. **Write the recipe files**

   `src/recipes/<id>/index.md`:

   ```markdown
   ---
   id: <id>
   title: <title>
   aufwand: <einfach|mittel|aufwändig>
   servings: <servings>
   image: /assets/images/<id>.jpg
   description: "<description>"
   ---

   1. <step 1>
   2. <step 2>
   ...
   ```

   Omit the `image:` line entirely if step 2 didn't produce a thumbnail — the
   `recipe.njk` layout already handles a missing image (`{% if image %}`), so
   nothing else needs to change for that case.

   `src/recipes/<id>/<id>.json`: exactly the structure defined in
   `rezept-normalisierer` (id, title, aufwand, servings, ingredients with
   name/amount/unit/step).

4. **Report back**

   Summarize what was written: the two file paths, whether a thumbnail was
   generated, and if not, which `ogImageUrl`(s) were rejected (from the source
   page and any search fallback candidates tried) so the user can judge them
   themselves or supply a different source. If the thumbnail came from a
   search fallback rather than the source page, say so and name the page it
   came from. Flag any normalization judgment calls worth double-checking
   (ambiguous `aufwand`, unclear quantities, etc.).
