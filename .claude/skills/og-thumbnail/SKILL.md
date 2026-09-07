---
name: og-thumbnail
description: Use when you need a square, plate-centered thumbnail generated from a recipe webpage's og:image, falling back to a web image search when the page has no usable image or it isn't a top-down shot — given a URL to a page about a dish, produces a square crop centered on the dish for use as a thumbnail.
---

# OG Thumbnail

## Overview

Given a URL to a webpage about a recipe, produces a square thumbnail centered on the dish, cropped from that page's `og:image`. If the page has no `og:image` (or equivalent), or the image found isn't a top-down shot, falls back to a `WebSearch` for a top-down photo of the same dish elsewhere. Designed as a standalone, composable step: pass in a URL, get back a file path (or a "not usable" report) — no assumptions about what happens before or after. Requires the `WebSearch` tool for the fallback path.

## Inputs

- `url` (required) — the recipe webpage to pull the image from
- `outputPath` (optional) — exact path to write the thumbnail to. If omitted, defaults to `src/assets/images/<slug>.jpg`, where `<slug>` is derived from the page's title (numeric suffix appended if that file already exists)
- `size` (optional, default `800`) — output width/height in pixels (always square)

## Steps

1. **Fetch the source image**

   ```bash
   node .claude/skills/og-thumbnail/scripts/fetch-og-image.mjs "<url>"
   ```

   Prints JSON: `{ "tempImagePath": "...", "title": "...", "ogImageUrl": "..." }`. If the page has no `og:image` / `og:image:secure_url` / `twitter:image` meta tag, `tempImagePath` and `ogImageUrl` come back `null` (title is still extracted from `<title>`/`og:title` when present) — this is not an error, it means go to step 1b.

2. **Look at the image and judge the shot**

   If `tempImagePath` is `null`, skip straight to step 1b.

   Otherwise, read/view `tempImagePath`. Decide: is this a top-down (overhead / bird's-eye) shot of the dish?

   - **Not top-down** (angled, side-on, close-up of a bite, a person, packaging, etc.) → go to step 1b, remembering this `ogImageUrl` as a rejected candidate in case the fallback also comes up empty.
   - **Top-down** → continue to step 3.

1b. **Search fallback** (only reached if step 1 gave `tempImagePath: null`, or step 2 judged the image not top-down)

   Use `WebSearch` with a query built from `title` (e.g. `<title>`, optionally narrowed further, e.g. `<title> Rezept` for German dishes) to find other pages about the same dish.

   For up to 3 promising results (skip the original `url` and any domain already tried), run the same fetch step against each candidate:

   ```bash
   node .claude/skills/og-thumbnail/scripts/fetch-og-image.mjs "<candidate-url>"
   ```

   View each resulting `tempImagePath` (skip candidates that also come back `null`). Judge two things:
   - Is it recognizably **the same dish** (not an unrelated recipe that merely shares a keyword)?
   - Is it a **top-down** shot?

   - First candidate passing both → treat its `tempImagePath`/`ogImageUrl` as the source image and continue to step 3.
   - No candidate passes after 3 tries → **stop**. Do not run the crop script and do not write any output file. Report that no top-down image could be found for `title`, either from `url` or from search (listing any rejected `ogImageUrl`s), so the caller can supply one manually.

3. **Estimate the plate's center**

   Still looking at the same image, estimate the plate/dish's center as normalized coordinates `cx`, `cy` (each in `[0, 1]`, where `0,0` is the top-left corner and `1,1` is the bottom-right).

4. **Resolve the output path** (only if `outputPath` wasn't given)

   ```bash
   node .claude/skills/og-thumbnail/scripts/resolve-output-path.mjs --dir src/assets/images --title "<title>" --ext jpg
   ```

5. **Crop and resize**

   ```bash
   node .claude/skills/og-thumbnail/scripts/crop-square.mjs --input "<tempImagePath>" --output "<outputPath>" --cx <cx> --cy <cy> --size <size>
   ```

   Takes the largest square that fits the source image, centered on `(cx, cy)` and clamped to the image bounds, then resizes to `size × size`.

6. **Report the result**

   Return the final `outputPath` to the caller.

## Notes

- Uses `sharp` for the actual crop/resize (already a devDependency of this repo).
- The temp file from step 1 lives in the OS temp directory and doesn't need manual cleanup.
