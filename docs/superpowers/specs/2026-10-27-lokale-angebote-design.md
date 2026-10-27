# Wochenplan: Rezeptvorschläge nach lokalen Angeboten

## Kontext

Der Wochenplan (`/plan/`) lässt leere Tage über eine Day-Select-Schublade befüllen. Dort gibt es bereits "Mit ähnlichen Zutaten"-Vorschläge basierend auf bereits geplanten Tagen. Was fehlt: ein Bezug zu echten, aktuellen Supermarkt-Angeboten.

Hintergrund: Nicht alle Prospekte aller Märkte liegen vor, und der analoge Abgleich von Angeboten mit Rezepten ist mühsam. Das Feature macht sichtbar, welche vorschlagbaren Rezepte Zutaten verwenden, die aktuell im Angebot sind – **nur als Hinweis, kein automatisches Befüllen des Plans**.

Dies war im ursprünglichen Wochenplan-Requirements-Doc (`2026-10-07-weekplan-kalender-requirements.md`) als Backlog-Punkt "Lokale Angebote" vorgesehen und wird hiermit konkretisiert.

## Entschieden (Nutzer-Vorgaben)

- Nur große Ketten: Aldi, Lidl, REWE, EDEKA, Kaufland (keine kleinen/regionalen Märkte, kein Foto-Fallback).
- Datenquelle: Marktgurus inoffizielle REST-API (`api.marktguru.de/api/v1/offers/search`), kein Key nötig.
- Site ist rein statisch (11ty, kein Backend) → Angebote per wöchentlichem GitHub-Actions-Cron holen und als Datei ins Repo committen, nicht live im Browser abrufen.
- Feste PLZ als Konstante im Fetch-Script (Platzhalter, wird manuell eingetragen) – keine Einstellung, da Single-User-Seite.
- Nur Vorschläge: Badge + Sortier-Toggle in der bestehenden Rezeptliste der Day-Select-Schublade. Keine eigene "Diese Woche im Angebot"-Sektion, kein Auto-Fill.
- Badge zeigt den Markt direkt im Text, z.B. "Rinderhack (REWE), Paprika (Aldi)".

## Architektur-Entscheidung

Das Matching passiert **zur Build-Zeit** (`src/index.json.11ty.js`), nicht im Browser – analog zur bestehenden Zutaten-Reduktion dort (`baseIngredients()`). Der Browser bekommt pro Rezept nur ein fertiges `offerMatches`-Feld über `/index.json`, matched nie selbst live gegen Marktguru-Daten. Das isoliert das Risiko der inoffiziellen API vollständig: ein kaputter Marktguru-Endpunkt erzeugt höchstens ein veraltetes/leeres `offers.json`, nie einen Fehler auf der Live-Seite.

`src/_data/` ist 11ty's globaler Data-Ordner (vgl. `src/_data/recipes.js`). Eine neue Datei `src/_data/offers.json` wird automatisch als globale Daten unter dem Key `offers` verfügbar.

## Implementierung

### 1. Fetch-Pipeline (erster GitHub-Actions-Workflow im Repo)

**`scripts/fetch-offers.mjs`** (Node 20 ESM, `fetch` global, kein neues Package):
- `PLZ`-Konstante oben im File als Platzhalter, mit Kommentar zum manuellen Eintragen der echten PLZ.
- `RETAILERS`-Liste mit den 5 Ketten-Codes – vor dem ersten echten Lauf gegen eine Live-Antwort der API verifizieren (Aldi Nord vs. Süd ist regional unterschiedlich).
- `fetchRetailerOffers(retailer, plz)` – ein Fetch pro Kette.
- `fetchAllOffers(plz)` – `Promise.allSettled` über alle Ketten, sammelt Erfolge, merkt fehlgeschlagene Ketten.
- `normalizeOffer(raw)` – Rohdaten → `{ name, retailer, price, validUntil }`.
- `main()`: Schlagen alle Ketten fehl → nichts schreiben (letzter Stand bleibt), Exit-Code 1, Warnung loggen. Bei Teilerfolg → `src/_data/offers.json` schreiben, abgelaufene/namenlose Einträge vorher filtern.
- Output-Shape:
  ```json
  { "fetchedAt": "...", "plz": "00000", "retailers": [...], "failedRetailers": [...], "offers": [{ "name": "...", "retailer": "...", "price": 3.49, "validUntil": "..." }] }
  ```
- Seed-Datei `src/_data/offers.json` mit leerem `offers: []`, damit der erste Build vor dem ersten Cron-Lauf fehlerfrei "keine Badges" zeigt.
- npm-Script: `"fetch-offers": "node scripts/fetch-offers.mjs"`.

**`.github/workflows/update-offers.yml`**: wöchentlicher Cron (Montag früh UTC) + `workflow_dispatch`. `npm ci` → `npm run fetch-offers` → committet `src/_data/offers.json` nur bei tatsächlicher Änderung, pusht auf `main`. Netlify/Vercel rebuilden automatisch auf Push.

### 2. Matching-Modul

**`src/assets/lib/offers.js`** (pure/isomorph wie `suggestions.js`, läuft zur Build-Zeit in Node):
- `matchOffers(ingredients, offers)` – Fuse-Suche je Base-Zutat gegen `offers[].name`, strengerer Threshold als die Rezeptsuche in `plan.js`, kurze Namen ausgeschlossen. Nutzt `fuse.js` (npm-Paket).
- `countOfferMatches(ingredients, offers)`.
- Nutzt dieselbe Base-Zutaten-Liste wie `baseIngredients()` aus `suggestions.js` (STAPLES bereits gefiltert, Klammerzusätze gestrippt).

**`tests/lib/offers.test.js`**: feste Fixtures, Treffer, Staple-Ausschluss, leere `offers` → `[]`.

### 3. Build-Wiring

**`src/index.json.11ty.js`** – `render({ collections, recipes, offers })`:
```js
const offerList = offers?.offers || [];
offerMatches: matchOffers(ingredients, offerList).map(m => ({ ingredient: m.ingredient, retailer: m.offer.retailer })),
```
`offerMatches` ist `{ ingredient, retailer }[]`, damit der Badge-Text direkt "Zutat (Markt)" zeigen kann.

### 4. Pattern Library

**`src/pattern-library/components.njk`**: Abschnitt "Day-select drawer" erweitern um Toolbar (Such-Input + Sortier-Toggle, Tag-Icon, `aria-pressed`, nutzt `.icon-button.is-active`-Muster) und Badge-Beispiel-Markup.

**SCSS**: `.recipe-list__badge` in `recipe-list/_styles.scss` mit den bisher ungenutzten Tokens `$tag`/`$tag-bg`. `.day-select__toolbar` in `weekplan/_styles.scss`.

### 5. Echte Screens

**`src/plan.njk`**: Such-Input in `.day-select__toolbar` verschieben, Sortier-Toggle daneben; `.recipe-list__badge` je `<li>`.

**`src/assets/plan.js`**:
- `annotateDaySelectOffers()` – `data-offer-count` pro `<li>`, Badge-Text aus `offerMatches` gebaut ("Zutat (Markt)", kommasepariert).
- `sortDaySelectList(byOffers)` – ordnet `<li>`-Elemente um, Text-Suche (toggelt nur `hidden`) bleibt unberührt.
- `initDaySelectOfferSort()` – Toggle-Click-Handler.
- `openDaySelect()`: Toggle bei jedem Öffnen zurücksetzen.

## Kritische Dateien

- `src/index.json.11ty.js`, `src/assets/lib/offers.js` (neu), `src/assets/plan.js`, `src/plan.njk`
- `scripts/fetch-offers.mjs` (neu), `.github/workflows/update-offers.yml` (neu)
- `src/pattern-library/components.njk`, `src/assets/scss/recipe-list/_styles.scss`, `src/assets/scss/weekplan/_styles.scss`

## Wiederverwendet

- `baseIngredient`/`baseIngredients`/`STAPLES` aus `src/assets/lib/suggestions.js`
- `fuse.js` (npm-Paket) für Fuzzy-Matching
- `.icon-button.is-active` + `aria-pressed`-Muster aus `recipe-detail/_styles.scss`
- `$tag`/`$tag-bg`-Tokens aus `tokens/_index.scss`

## Offen (manuell einzutragen)

- Echte PLZ in `scripts/fetch-offers.mjs`.
- Retailer-Codes (`RETAILERS`) gegen eine echte API-Antwort für diese PLZ verifizieren (Aldi Nord vs. Süd).

## Verifikation

1. `npm test` – neue Tests in `tests/lib/offers.test.js` grün, bestehende Tests unverändert grün.
2. `npm run build` mit leerer Seed-`offers.json` – Build läuft durch, `/index.json` enthält `offerMatches: []` pro Rezept.
3. Lokal Test-Angebote in `src/_data/offers.json` eintragen, `npm start`, `/plan/` öffnen, leeren Tag antippen → Badges sichtbar, Sortier-Toggle sortiert um, Text-Suche funktioniert weiterhin.
4. `node scripts/fetch-offers.mjs` manuell ausführen (mit echter PLZ), Ergebnis prüfen, bevor der Cron aktiviert wird.
5. `.github/workflows/update-offers.yml` einmal per `workflow_dispatch` manuell anstoßen und den Actions-Log prüfen.
