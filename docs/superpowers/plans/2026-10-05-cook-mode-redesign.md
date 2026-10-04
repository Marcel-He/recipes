# Cook Mode Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the cook-mode overlay to match the supplied mockup (recipe title + dot
progress indicator, a plain per-step ingredients list, a short step title, and a
Back/"Next Step" bottom bar), which requires adding step titles to every recipe's content
and to the `rezept-normalisierer` import skill.

**Architecture:** Step titles are a bold lead-in phrase at the start of each markdown
step's existing sentence (`**Titel.** Satz...`), not a new JSON field — this keeps the
`<ol>`/`<li>` structure every positional lookup in `recipe.js`/`cook-mode.js` depends on
unchanged. `cook-mode.js` gains a pure `parseStep(html)` function to split that lead-in
from the body, and `lib/format.js` gains a pure `formatIngredientParenthetical` for the
mockup's `Name (qty unit)` ingredient lines. `createCookMode`'s rendering is rewritten
around these two helpers and structured ingredient data passed in from `recipe.js`
(rather than scraped from the chip markup the regular step list renders).

**Tech Stack:** 11ty/Nunjucks, vanilla JS (ES modules), SCSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-05-cook-mode-redesign-design.md`

## Global Constraints

- No changes to any recipe's `.json` file or ingredient schema — step titles live only in
  the markdown, as a bold lead-in (spec §1).
- Every step title: 2–4 words, German, ends with a period, inside `**...**` at the very
  start of the step's existing sentence — wording of the step itself does not change
  (spec §1–2).
- The regular (non-cook-mode) step list on the recipe page keeps its existing
  ingredient-chip rendering, unchanged (spec §4).
- UI chrome text inside cook mode (progress label, "Back", "Next Step", "Done",
  "Ingredients") stays English, matching the existing English chrome elsewhere on this
  German-content page (`<h2>Ingredients</h2>`, `<h2>Steps</h2>` in `recipe.njk`).
- New DOM-wiring code (`createCookMode`, the `recipe.js` glue) stays untested, matching
  this codebase's existing convention for `recipe.js`/`planner.js`/`recipe-preview.js` —
  only pure functions (`parseStep`, `formatIngredientParenthetical`, the existing
  `nextStepIndex`/`prevStepIndex`/`swipeDirection`) get unit tests (spec §9).

## Review Focus

- A step with zero ingredients for its step number must hide the ingredients block
  entirely, not show an empty "Ingredients" label with nothing under it — pinned by a
  manual build-check in Task 6 (e.g. the last step of most recipes has no ingredients).
- A literal `&` (or other HTML-significant character) in a step's bold title must survive
  `parseStep` and display correctly, not as a literal `&amp;` — pinned by a unit test in
  Task 2, and by rendering with `innerHTML` (not `textContent`) in Task 6.
- A step with no bold lead-in (content that was never migrated, or a future recipe
  imported before the skill update lands) must not crash or show a broken/empty heading —
  pinned by `parseStep`'s fallback-to-empty-title unit test in Task 2.
- Clicking "Next Step" on the last step (now labeled "Done") must close cook mode, not
  throw or try to advance past the last index — pinned by a manual check in Task 6.
- The floating close (×) button must not visually collide with a long, two-line-wrapped
  recipe title on a narrow viewport — flagged as a manual visual check in Task 9, against
  one of the longer recipe titles (e.g. "Chiliöl-Kartoffelsalat mit weichen Eiern").

---

## Task 1: `formatIngredientParenthetical` in `lib/format.js`

**Files:**
- Modify: `src/assets/lib/format.js`
- Test: `tests/lib/format.test.js`

**Interfaces:**
- Produces: `formatIngredientParenthetical(ingredient: { name, amount, unit }): string` —
  `"Name (qty unit)"`, or bare `"Name"` when there's no quantity (reuses the existing
  `formatQuantity` for the parenthetical part).

- [ ] **Step 1: Write the failing tests**

In `tests/lib/format.test.js`, change the import line to:

```js
import { formatQuantity, formatIngredientParenthetical } from '../../src/assets/lib/format.js';
```

Then add, after the existing `formatQuantity` describe block:

```js
describe('formatIngredientParenthetical', () => {
  it('combines name and quantity in parentheses', () => {
    expect(formatIngredientParenthetical({ name: 'Paprika', amount: 300, unit: 'g' })).toBe('Paprika (300 g)');
  });

  it('returns just the name when there is no quantity', () => {
    expect(formatIngredientParenthetical({ name: 'Joghurt', amount: null, unit: null })).toBe('Joghurt');
  });

  it('returns just the name when amount is 0', () => {
    expect(formatIngredientParenthetical({ name: 'Salz', amount: 0, unit: 'Prise' })).toBe('Salz');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/lib/format.test.js`
Expected: FAIL — `formatIngredientParenthetical is not a function` (or `undefined`), since
it doesn't exist yet.

- [ ] **Step 3: Implement**

In `src/assets/lib/format.js`, add after `formatQuantity`:

```js
export function formatIngredientParenthetical(ingredient) {
  const qty = formatQuantity(ingredient);
  return qty ? `${ingredient.name} (${qty})` : ingredient.name;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/format.test.js`
Expected: PASS, all 8 tests (5 existing `formatQuantity` + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/assets/lib/format.js tests/lib/format.test.js
git commit -m "Add formatIngredientParenthetical for cook mode's plain ingredient list"
```

---

## Task 2: `parseStep` in `lib/cook-mode.js`

**Files:**
- Modify: `src/assets/lib/cook-mode.js`
- Test: `tests/lib/cook-mode.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `parseStep(html: string): { title: string, body: string }` — splits a step
  `<li>`'s `innerHTML` into its bold lead-in title (trailing period stripped) and the
  remaining body, defensively stripping a leading `<div class="step-ingredients">...</div>`
  if present; falls back to `{ title: '', body: html.trim() }` when there's no bold
  lead-in at all.

- [ ] **Step 1: Write the failing tests**

In `tests/lib/cook-mode.test.js`, change the import line to:

```js
import { describe, it, expect } from 'vitest';
import { nextStepIndex, prevStepIndex, swipeDirection, parseStep } from '../../src/assets/lib/cook-mode.js';
```

Then add, after the existing `swipeDirection` describe block:

```js
describe('parseStep', () => {
  it('splits a bold title from the step body', () => {
    const html = '<strong>Öl erhitzen & würzen.</strong> Olivenöl in einer großen Pfanne erhitzen.';
    expect(parseStep(html)).toEqual({
      title: 'Öl erhitzen & würzen',
      body: 'Olivenöl in einer großen Pfanne erhitzen.'
    });
  });

  it('strips a leading ingredient-chip div before the title', () => {
    const html = '<div class="step-ingredients"><span class="step-ingredients__item">400 g Tomaten</span></div><strong>Tomaten köcheln lassen.</strong> Tomaten hinzufügen und 10 Minuten köcheln lassen.';
    expect(parseStep(html)).toEqual({
      title: 'Tomaten köcheln lassen',
      body: 'Tomaten hinzufügen und 10 Minuten köcheln lassen.'
    });
  });

  it('falls back to an empty title when there is no bold lead-in', () => {
    const html = 'Sofort servieren, direkt aus der Pfanne.';
    expect(parseStep(html)).toEqual({ title: '', body: 'Sofort servieren, direkt aus der Pfanne.' });
  });

  it('preserves HTML-escaped characters in the title untouched', () => {
    const html = '<strong>Mehl &amp; Butter verkneten.</strong> Mehl und Butter zu einem Teig verkneten.';
    expect(parseStep(html).title).toBe('Mehl &amp; Butter verkneten');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/lib/cook-mode.test.js`
Expected: FAIL — `parseStep is not a function`.

- [ ] **Step 3: Implement**

In `src/assets/lib/cook-mode.js`, add after `swipeDirection` (before the
`createCookMode` export):

```js
export function parseStep(html) {
  const match = html.match(/^\s*(?:<div class="step-ingredients">.*?<\/div>)?\s*<strong>(.*?)\.?<\/strong>\s*(.*)$/s);
  if (!match) return { title: '', body: html.trim() };
  return { title: match[1], body: match[2].trim() };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/cook-mode.test.js`
Expected: PASS, all 12 tests (8 existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add src/assets/lib/cook-mode.js tests/lib/cook-mode.test.js
git commit -m "Add parseStep to split a step's bold title from its body"
```

---

## Task 3: Update the `rezept-normalisierer` skill

**Files:**
- Modify: `.claude/skills/rezept-normalisierer/SKILL.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing code-facing — this is the content contract future recipe imports
  follow, matching the format `parseStep` (Task 2) and the Task 4 migration both assume.

- [ ] **Step 1: Add the step-title rule**

In `.claude/skills/rezept-normalisierer/SKILL.md`, in the `## Regeln` section, add a new
`### Schritt-Titel` subsection right after `### Aufwand` and before `### Zutaten`:

```markdown
### Schritt-Titel
Jeder Schritt beginnt mit einem kurzen, fett gesetzten Titel (2–4 Wörter, endet mit einem
Punkt), gefolgt vom eigentlichen Schritttext:

`1. **Zwiebeln andünsten.** Zwiebeln schälen und in einer Pfanne bei mittlerer Hitze glasig dünsten.`

Der Titel fasst die Haupthandlung des Schritts zusammen (Verb + Objekt), nicht das
Ergebnis.
```

- [ ] **Step 2: Update the worked example**

In the same file, in the `## Beispiel` section, replace the `spaghetti-carbonara.md`
step list:

```markdown
1. Spaghetti in Salzwasser al dente kochen.
2. Pancetta in einer Pfanne knusprig ausbraten.
3. Eier und Parmesan in einer Schüssel verquirlen.
4. Pasta vom Herd nehmen, Pancetta und Ei-Käse-Mischung unterheben, mit Pfeffer würzen.
```

with:

```markdown
1. **Pasta kochen.** Spaghetti in Salzwasser al dente kochen.
2. **Pancetta anbraten.** Pancetta in einer Pfanne knusprig ausbraten.
3. **Ei-Käse-Mischung verquirlen.** Eier und Parmesan in einer Schüssel verquirlen.
4. **Alles vermengen.** Pasta vom Herd nehmen, Pancetta und Ei-Käse-Mischung unterheben, mit Pfeffer würzen.
```

- [ ] **Step 3: Add a row to "Häufige Fehler"**

In the same file's `## Häufige Fehler` table, add a row:

```markdown
| Schritt ohne Titel | Jeder Schritt beginnt mit `**Kurztitel.**` |
```

- [ ] **Step 4: Verify**

Run: `grep -c "Schritt-Titel" .claude/skills/rezept-normalisierer/SKILL.md`
Expected: `1`

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/rezept-normalisierer/SKILL.md
git commit -m "Require a bold step title in the rezept-normalisierer skill"
```

---

## Task 4: Migrate the 12 existing recipes (83 steps)

**Files:**
- Modify: `src/recipes/banitsa-boerek-bulgarischer-art/index.md`
- Modify: `src/recipes/bifteki-mit-hirtenkaese-auf-orzotto/index.md`
- Modify: `src/recipes/chilioel-kartoffelsalat-mit-weichen-eiern/index.md`
- Modify: `src/recipes/couscous-mit-karotten-feta-topping/index.md`
- Modify: `src/recipes/franzoesische-zwiebelsuppe/index.md`
- Modify: `src/recipes/haehnchen-piccata/index.md`
- Modify: `src/recipes/italian-beef-sandwiches-steak-version/index.md`
- Modify: `src/recipes/rosmarin-kartoffelpueree-mit-parmesan/index.md`
- Modify: `src/recipes/rote-bete-carpaccio-mit-feta/index.md`
- Modify: `src/recipes/shakshuka-nach-ottolenghi/index.md`
- Modify: `src/recipes/spinatknoedel-mit-salbeibutter/index.md`
- Modify: `src/recipes/tortilla-de-patatas/index.md`

**Interfaces:**
- Consumes: the `### Schritt-Titel` format from Task 3.
- Produces: every step `<li>` in the built site now starts with a `<strong>Titel.</strong>`
  — what Task 6's `parseStep` call will read.

Each step below: replace the exact existing line with the new one (step wording is
otherwise byte-for-byte identical — only the bold title phrase is prefixed).

- [ ] **Step 1: `banitsa-boerek-bulgarischer-art/index.md`**

```markdown
1. **Ofen vorheizen.** Den Backofen auf 180 °C Ober-/Unterhitze vorheizen.
2. **Form einfetten.** Die Backform mit Butter oder Öl einfetten.
3. **Joghurt mit Natron verrühren.** Den Joghurt mit dem Natron verrühren und 2–3 Minuten ruhen lassen.
4. **Eier unterrühren.** Die Eier verquirlen und mit dem Joghurt vermengen.
5. **Feta einarbeiten.** Den zerbröselten Feta hinzufügen und alles gut vermischen.
6. **Teigblätter füllen & rollen.** Ein Teigblatt auslegen, mit etwas geschmolzener Butter bestreichen und etwas von der Füllung darauf verteilen. Das Teigblatt locker aufrollen und zu einer Schnecke formen, die in die Backform gelegt wird. Diesen Vorgang wiederholen, bis alle Teigblätter aufgebraucht sind.
7. **Mit Butter & Milch übergießen.** Die restliche Butter gleichmäßig über der Banitsa verteilen. Falls noch etwas von der Käse-Ei-Mischung übrig ist, diese gleichmäßig über die Teigrollen geben. Anschließend die Milch darüber verteilen.
8. **Backen & ruhen lassen.** Die Banitsa 35–45 Minuten backen, bis sie goldbraun und knusprig ist. Nach dem Backen etwa 10 Minuten ruhen lassen.
```

- [ ] **Step 2: `bifteki-mit-hirtenkaese-auf-orzotto/index.md`**

```markdown
1. **Bifteki formen.** Feta in eine große Schüssel zerbröseln, Hackfleisch, Gewürzmischung, die Hälfte des Oreganos, Salz und Pfeffer dazugeben. Gut vermengen und zu 4 ovalen Frikadellen formen.
2. **Bifteki braten.** Öl in einer großen Pfanne bei mittlerer Hitze erhitzen und die Bifteki von jeder Seite 6–7 Minuten braten, bis sie durchgegart sind. Herausnehmen und beiseitestellen.
3. **Gemüse vorbereiten.** Knoblauch fein hacken. Zwiebel halbieren und in dünne Streifen schneiden. Karotte schälen, längs halbieren und in ca. 1 cm dicke Halbmonde schneiden.
4. **Orzotto köcheln.** Die Pfanne erneut erhitzen und die Zwiebelstreifen 1–2 Minuten anschwitzen. Ajvar, restlichen Oregano, Orzo, Karotten und Knoblauch dazugeben und 2–3 Minuten anbraten. Wasser und Brühepulver hinzufügen, zugedeckt bei niedriger Hitze 10–12 Minuten köcheln lassen, dabei gelegentlich umrühren.
5. **Spinat & Käse unterrühren.** Sobald der Orzo gar ist, den Babyspinat nach und nach unterheben, bis er zusammenfällt. Geriebenen Käse unterrühren, mit Salz und Pfeffer abschmecken. Die Bifteki zurück in die Pfanne geben und 1–2 Minuten erwärmen.
6. **Anrichten & servieren.** Orzotto anrichten und mit den Bifteki toppen. Servieren.
```

- [ ] **Step 3: `chilioel-kartoffelsalat-mit-weichen-eiern/index.md`**

```markdown
1. **Kartoffeln kochen.** Die Kartoffeln in Salzwasser gar kochen und leicht abkühlen lassen.
2. **Dressing verstreichen.** Den Joghurt mit Chiliöl und Remoulade verrühren und auf einem großen Teller oder einer Platte verstreichen.
3. **Eier kochen.** Vier Eier genau 6 Minuten und 30 Sekunden kochen, anschließend abschrecken und pellen.
4. **Kartoffeln auflegen.** Die Kartoffeln auf den Joghurt setzen.
5. **Beilagen klein schneiden.** Die vier weichen Eier, die Cornichons und die Lauchzwiebeln klein schneiden. Die Minigurke in feine Scheiben schneiden.
6. **Verteilen & vermengen.** Alles auf den Kartoffeln verteilen, mit etwas Salz würzen und anschließend miteinander vermengen.
7. **Ei als Topping.** Ein weiteres Ei ebenfalls 6 Minuten und 30 Sekunden kochen, halbieren und als Topping darauflegen.
8. **Sofort servieren.** Sofort genießen.
```

- [ ] **Step 4: `couscous-mit-karotten-feta-topping/index.md`**

```markdown
1. **Zutaten bereitstellen.** Alle Zutaten bereitstellen.
2. **Ofen vorheizen.** Backofen auf 200 °C Umluft (empfohlen) oder 220 °C Ober-/Unterhitze vorheizen.
3. **Karotten rösten.** Karotten schälen, in Scheiben schneiden, auf ein Backblech geben, mit Olivenöl, Salz und Pfeffer vermengen und im Ofen ca. 15–20 Minuten rösten, bis sie weich sind.
4. **Couscous quellen lassen.** Couscous in eine Schüssel geben, mit heißem Karottensaft übergießen, abdecken und 5–10 Minuten quellen lassen, danach mit einer Gabel auflockern.
5. **Dressing anrühren.** Feta zerbröseln. Joghurt mit Honig, Kreuzkümmel, Currypulver, Zitronensaft und Minze glatt rühren, Feta unterheben.
6. **Rucola untermischen.** Rucola unter den Couscous mischen, mit Salz und Pfeffer abschmecken.
7. **Anrichten & servieren.** Couscous auf Tellern anrichten, mit den gerösteten Karotten toppen, das Feta-Joghurt-Dressing darüberverteilen und servieren.
```

- [ ] **Step 5: `franzoesische-zwiebelsuppe/index.md`**

```markdown
1. **Zwiebeln schmoren.** Die Zwiebeln schälen und in Ringe schneiden. In einem Topf mit hohem Rand die Butter zerlassen und die Zwiebeln darin etwa 15 Minuten schmoren lassen. Parallel dazu die Brühe mit dem heißen Wasser anmischen und den Backofen auf 200 °C vorheizen.
2. **Ablöschen & köcheln.** Das Mehl über die Zwiebeln streuen und mit der Brühe und dem Weißwein ablöschen. Mit Salz und Pfeffer abschmecken und etwa 15 Minuten bei mittlerer Hitze köcheln lassen.
3. **Baguette & Käse vorbereiten.** Das Baguettebrot in Scheiben schneiden und ohne Fett in einer Pfanne anrösten. Den Käse raspeln, die Suppe in Suppenschüsseln füllen und mit dem Käse bestreuen.
4. **Überbacken & servieren.** Die Schüsseln in den vorgeheizten Backofen geben und den Käse 5–6 Minuten schmelzen lassen. Zum Schluss mit Rosmarinnadeln bestreuen, die gerösteten Brotscheiben dazugeben und servieren.
```

- [ ] **Step 6: `haehnchen-piccata/index.md`**

```markdown
1. **Filets plattieren.** Ein Hähnchenbrustfilet in einen großen Gefrierbeutel legen. Mit dem Boden einer schweren Pfanne oder einem Fleischklopfer auf etwa 1 cm Dicke plattieren. Es muss nicht hauchdünn sein, nur dünn genug, damit es gleichmäßig und recht schnell gart. Mit den übrigen Filets wiederholen.
2. **Filets würzen.** Jedes Filet mit einer Prise Salz und etwas frisch gemahlenem Pfeffer würzen und beiseitestellen.
3. **Zutaten vorbereiten.** Zutaten vorbereiten: Knoblauch und Petersilie grob hacken. Zitronen halbieren. Kapern, Butter, Wein und Brühe bereitstellen.
4. **Mehl würzen.** Eine große Pfanne bei mittlerer bis hoher Hitze erhitzen und den Boden mit einer guten Schicht Olivenöl bedecken (etwa 3 mm). Währenddessen das Mehl in eine Auflaufform oder einen flachen Teller geben, mit einer großzügigen Prise Salz und Pfeffer würzen und mit einer Gabel vermengen.
5. **Filets anbraten.** Sobald die Pfanne heiß ist (nicht rauchend, aber deutlich heiß), die Filets im Mehl wenden, überschüssiges Mehl abklopfen und in die Pfanne legen. Es sollten zwei Filets gleichzeitig hineinpassen.
6. **Fertig braten.** Etwa 2–3 Minuten braten, bis die Unterseite leicht gebräunt ist, dann wenden und weitere 2–3 Minuten braten. Auf einem Gitterrost beiseitelegen und mit den restlichen Filets wiederholen.
7. **Knoblauch & Wein ablöschen.** Die Hitze auf mittlere Stufe reduzieren und den Knoblauch hinzufügen. Etwa 30 Sekunden anbraten, bis er intensiv duftet. Sofort mit dem Wein ablöschen und den Bratensatz vom Pfannenboden lösen.
8. **Kapern & Brühe reduzieren.** Den Wein um die Hälfte einkochen lassen, dann Kapern und Hühnerbrühe dazugeben und erneut um etwa die Hälfte reduzieren.
9. **Filets in der Sauce ziehen lassen.** Den Saft der beiden Zitronen hinzufügen und 1–2 Minuten einkochen lassen. Dann die Hitze auf niedrig stellen, die Schnitzel samt ausgetretenem Fleischsaft zurück in die Pfanne legen und 2–3 Minuten in der Sauce ziehen lassen. Dabei einmal wenden und mit Sauce übergießen. Nach Belieben ein paar dünne Zitronenscheiben dazulegen.
10. **Sauce mit Butter binden.** Die Pfanne vom Herd nehmen. Die Butter in Stücken zwischen den Filets verteilen und die Pfanne schwenken, bis eine gebundene, cremige Sauce entsteht. Wichtig: Die Butter erst einrühren, wenn die Pfanne nicht mehr auf der Hitze steht – kocht die Sauce weiter, trennt sich die Butter und die Sauce wird ölig statt cremig. Mit Salz und Pfeffer abschmecken, dann Petersilie und etwas frisch geriebene Zitronenschale darübergeben.
11. **Sofort servieren.** Sofort servieren, direkt aus der Pfanne oder auf einer Platte angerichtet, mit der Sauce über dem Fleisch.
```

- [ ] **Step 7: `italian-beef-sandwiches-steak-version/index.md`**

```markdown
1. **Steak würzen.** Das Steak trocken tupfen und mit ¾ TL Salz und ¼ TL Pfeffer einreiben.
2. **Steak anbraten.** Das Öl in einer Pfanne stark erhitzen und das Steak pro Seite 1–2 Minuten scharf anbraten, sodass es innen noch roh bis sehr rosa ist. Herausnehmen.
3. **Jus köcheln.** Knoblauch und Zwiebel in derselben Pfanne kurz anrösten, mit der Brühe ablöschen und den Bratensatz lösen. Alle Gewürze sowie das restliche Salz und den restlichen Pfeffer einrühren und etwa 10 Minuten leise köcheln lassen.
4. **Steak anfrieren.** Das Steak 20–30 Minuten ins Gefrierfach legen.
5. **Dünn aufschneiden.** Das angefrorene Steak quer zur Faser hauchdünn aufschneiden.
6. **Im Jus erwärmen.** Die Fleischscheiben 2–3 Minuten im köchelnden Jus ziehen lassen, bis sie nicht mehr rosa sind.
7. **Brötchen toasten.** Die Brötchen längs aufschneiden, dabei an einer Seite verbunden lassen. Mit der offenen Seite nach unten bei 160 °C etwa 5 Minuten toasten.
8. **Sandwiches belegen.** Das Fleisch mit einer Zange aus dem Jus heben, großzügig in die Brötchen füllen, mit extra Jus tränken und mit Giardiniera garnieren.
```

- [ ] **Step 8: `rosmarin-kartoffelpueree-mit-parmesan/index.md`**

```markdown
1. **Kartoffeln kochen.** Die Kartoffeln schälen, in gleich große Stücke schneiden und in einem Topf mit Salzwasser in etwa 20 Minuten weich kochen.
2. **Rosmarinmilch ziehen lassen.** Währenddessen die Milch mit den Rosmarinzweigen in einem kleinen Topf erhitzen und kurz ziehen lassen. Nach Belieben ein paar Rosmarinnadeln sehr fein hacken, wenn man sie im Püree sehen und schmecken möchte.
3. **Kartoffeln ausdampfen lassen.** Die fertigen Kartoffeln abgießen und kurz im warmen Topf ohne Deckel ausdampfen lassen, damit überschüssige Feuchtigkeit entweicht.
4. **Kartoffeln stampfen.** Die Kartoffeln mit einem Kartoffelstampfer oder einer Kartoffelpresse zerdrücken. Keinen Stabmixer verwenden, da das Püree sonst zäh und klebrig wird.
5. **Milch, Butter & Parmesan unterrühren.** Die ganzen Rosmarinzweige aus der Milch entfernen. Die warme Rosmarin-Milch und die Butter nach und nach unterrühren, bis das Püree cremig ist. Anschließend den fein geriebenen Parmesan unterheben, bis er geschmolzen ist.
6. **Abschmecken & servieren.** Mit Salz, Pfeffer und frisch geriebener Muskatnuss abschmecken und nach Belieben mit etwas Parmesan bestreut servieren.
```

- [ ] **Step 9: `rote-bete-carpaccio-mit-feta/index.md`**

```markdown
1. **Salat & Rote Bete vorbereiten.** Feldsalat waschen und gleichmäßig auf Tellern oder einer großen Platte verteilen. Rote Bete mit einem scharfen Messer oder einer Mandoline in dünne Scheiben schneiden.
2. **Pinienkerne karamellisieren.** Pinienkerne in einer Pfanne ohne Fett rösten, bis sie duften. Zucker hinzufügen und unter ständigem Rühren kurz karamellisieren lassen.
3. **Anrichten & garnieren.** Rote-Bete-Scheiben fächerförmig auf dem Salat anrichten. Feta darüber bröseln, mit Salz und Pfeffer würzen, mit Balsamico-Creme beträufeln und mit den karamellisierten Pinienkernen garnieren.
```

- [ ] **Step 10: `shakshuka-nach-ottolenghi/index.md`**

```markdown
1. **Öl erhitzen & würzen.** Olivenöl in einer großen Pfanne erhitzen und Harissa, Tomatenmark, Paprika, Knoblauch, Kreuzkümmel und ¾ TL Salz zusammen anbraten.
2. **Paprika dünsten.** Bei mittlerer Hitze 5 Minuten unter häufigem Rühren dünsten, bis die Paprika leicht weich werden.
3. **Tomaten köcheln lassen.** Tomaten hinzufügen und 10 Minuten köcheln lassen, bis eine dicke Sauce entsteht.
4. **Eier eingeben.** 8 kleine Mulden in die Sauce drücken und je ein Ei vorsichtig hineingeben, dabei die Eigelbe intakt lassen.
5. **Sanft gar ziehen lassen.** Sanft 8–10 Minuten köcheln lassen, bis das Eiweiß gestockt ist, die Eigelbe aber noch leicht flüssig sind.
6. **Servieren.** Vom Herd nehmen und mit Brot und dickem Joghurt servieren.
```

- [ ] **Step 11: `spinatknoedel-mit-salbeibutter/index.md`**

```markdown
1. **Spinat auftauen.** Blattspinat bei Raumtemperatur auftauen.
2. **Brot würfeln.** Weißbrot in 1-cm-Würfel schneiden.
3. **Schalotte & Knoblauch andünsten.** Schalotte und Knoblauch schälen, hacken und in Butter andünsten.
4. **Spinat würzen.** Aufgetauten Blattspinat dazugeben und mit Salz, Pfeffer und Muskatnuss würzen.
5. **Teig mischen.** Spinat, gehackten Bergkäse, Eier und Mehl zu den Brotwürfeln geben und alles kräftig durchmischen. Bei zu trockenem Teig etwas Milch unterrühren, dabei gut durchkneten, bevor mehr Milch zugegeben wird.
6. **Teig ruhen lassen.** Teig zugedeckt etwa 10 Minuten ruhen lassen.
7. **Knödel formen & garen.** Mit nassen Händen Knödel formen und in leicht kochendem Salzwasser 15-20 Minuten garen. (Rohe Knödel lassen sich gut einfrieren.)
8. **Salbeibutter bräunen.** Für die Salbeibutter Butter in einer Pfanne zerlassen und getrockneten Salbei unterrühren, bis die Butter gebräunt ist.
9. **Anrichten & bestreuen.** Knödel auf Tellern anrichten, mit der Salbeibutter beträufeln und frisch geriebenem Parmesan bestreuen.
```

- [ ] **Step 12: `tortilla-de-patatas/index.md`**

```markdown
1. **Kartoffeln vorbereiten.** Kartoffeln schälen, waschen und ca. 5 mm dünn aufschneiden. Mit Salz bestreuen und trockentupfen.
2. **Kartoffeln confieren.** Reichlich Olivenöl in einer großen Pfanne erhitzen und die Kartoffelscheiben bei niedriger Hitze 20 Minuten weich garen. Abschöpfen und in einem Sieb abtropfen lassen.
3. **Zwiebeln karamellisieren.** Zwiebel in dünne Scheiben schneiden und in etwas Olivenöl bei mittlerer Hitze 10–20 Minuten karamellisieren lassen. Abtropfen lassen.
4. **Eimasse ruhen lassen.** Eier in einer Schüssel verquirlen und salzen. Abgekühlte Kartoffeln und Zwiebeln unterheben und die Masse 15–20 Minuten ruhen lassen.
5. **Tortilla stocken lassen.** Etwas Olivenöl in der Pfanne erhitzen, Eimasse hineingeben und bei mittlerer bis niedriger Hitze 6–8 Minuten stocken lassen. Dabei die Ränder mit einem Spatel lösen.
6. **Tortilla wenden.** Tortilla auf einen Teller stürzen und zurück in die Pfanne gleiten lassen. Weitere 6–8 Minuten garen.
7. **Abkühlen & anschneiden.** Auf einen Servierteller gleiten lassen, kurz abkühlen und in Stücke schneiden.
```

- [ ] **Step 13: Verify every step was migrated**

Run: `grep -nP '^\d+\.(?!\s\*\*)' src/recipes/*/index.md`
Expected: no output (this lists any numbered step line whose number isn't immediately
followed by a bold title — i.e. a step that didn't get migrated). Before this task,
running this same command reports all 83 steps.

Run: `npm run build`
Expected: builds cleanly, same file count as before.

- [ ] **Step 14: Commit**

```bash
git add src/recipes/*/index.md
git commit -m "Add a bold step title to every step across all 12 recipes"
```

---

## Task 5: Restructure the cook-mode markup

**Files:**
- Modify: `src/_includes/recipe.njk:56-72`

**Interfaces:**
- Produces: the element IDs Task 6 wires up —
  `cook-mode-close`, `cook-mode-title`, `cook-mode-dots`, `cook-mode-progress-text`,
  `cook-mode-step`, `cook-mode-ingredients`, `cook-mode-ingredients-list`,
  `cook-mode-step-title`, `cook-mode-step-body`, `cook-mode-prev`, `cook-mode-next`,
  `cook-mode-next-label`.

- [ ] **Step 1: Replace the cook-mode overlay markup**

In `src/_includes/recipe.njk`, replace lines 56–72 (the entire
`<div id="cook-mode" class="cook-mode" hidden>...</div>` block) with:

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
    <div id="cook-mode-ingredients" class="cook-mode__ingredients" hidden>
      <span class="cook-mode__ingredients-label">Ingredients</span>
      <div id="cook-mode-ingredients-list"></div>
    </div>
    <h3 id="cook-mode-step-title" class="cook-mode__step-title"></h3>
    <p id="cook-mode-step-body" class="cook-mode__step-body"></p>
  </div>
  <div class="cook-mode__controls">
    <button type="button" id="cook-mode-prev" class="cook-mode__back">
      <i class="fa-solid fa-chevron-left"></i> Back
    </button>
    <button type="button" id="cook-mode-next" class="cook-mode__next">
      <span id="cook-mode-next-label">Next Step</span> <i class="fa-solid fa-chevron-right"></i>
    </button>
  </div>
</div>
```

- [ ] **Step 2: Verify the build still succeeds**

Run: `npm run build`
Expected: builds cleanly (cook mode's JS will error at runtime until Task 6 lands — that's
expected and fine for a build-only check; nothing in the build step executes browser JS).

- [ ] **Step 3: Commit**

```bash
git add src/_includes/recipe.njk
git commit -m "Restructure cook-mode markup to match the mockup layout"
```

---

## Task 6: Rewrite cook-mode rendering and wire it to recipe.js

**Files:**
- Modify: `src/assets/lib/cook-mode.js`
- Modify: `src/assets/recipe.js`

**Interfaces:**
- Consumes: `formatIngredientParenthetical` (Task 1), `parseStep` (Task 2), the element
  IDs from Task 5.
- Produces: `createCookMode({ requestWakeLock, releaseWakeLock }).open(stepGroups: Record<number, Ingredient[]>)` —
  the `open()` signature changes from no-arg to taking the current servings' ingredient
  groups (keyed by step number, same shape `groupIngredientsByStep` already returns).

- [ ] **Step 1: Add the import and rewrite `createCookMode`**

In `src/assets/lib/cook-mode.js`, add at the top of the file:

```js
import { formatIngredientParenthetical } from './format.js';
```

Then replace the entire `createCookMode` function (everything from
`export function createCookMode({ requestWakeLock, releaseWakeLock }) {` to its closing
`}`) with:

```js
export function createCookMode({ requestWakeLock, releaseWakeLock }) {
  const overlay = document.getElementById('cook-mode');
  const titleEl = document.getElementById('cook-mode-title');
  const dotsEl = document.getElementById('cook-mode-dots');
  const progressTextEl = document.getElementById('cook-mode-progress-text');
  const stepEl = document.getElementById('cook-mode-step');
  const ingredientsEl = document.getElementById('cook-mode-ingredients');
  const ingredientsListEl = document.getElementById('cook-mode-ingredients-list');
  const stepTitleEl = document.getElementById('cook-mode-step-title');
  const stepBodyEl = document.getElementById('cook-mode-step-body');
  const prevBtn = document.getElementById('cook-mode-prev');
  const nextBtn = document.getElementById('cook-mode-next');
  const nextLabelEl = document.getElementById('cook-mode-next-label');
  const closeBtn = document.getElementById('cook-mode-close');

  let steps = [];
  let stepGroups = {};
  let currentIndex = 0;
  let touchStartX = null;

  function render() {
    const { title, body } = parseStep(steps[currentIndex]);
    stepTitleEl.innerHTML = title;
    stepBodyEl.innerHTML = body;

    const ingredients = stepGroups[currentIndex + 1];
    if (ingredients && ingredients.length) {
      ingredientsEl.hidden = false;
      ingredientsListEl.innerHTML = ingredients
        .map(i => `<div class="cook-mode__ingredient">${formatIngredientParenthetical(i)}</div>`)
        .join('');
    } else {
      ingredientsEl.hidden = true;
      ingredientsListEl.innerHTML = '';
    }

    dotsEl.querySelectorAll('.cook-mode__dot').forEach((dot, i) => {
      dot.classList.toggle('is-current', i === currentIndex);
    });
    progressTextEl.textContent = `Step ${currentIndex + 1} of ${steps.length}`;

    prevBtn.disabled = currentIndex === 0;
    nextLabelEl.textContent = currentIndex === steps.length - 1 ? 'Done' : 'Next Step';
  }

  function goTo(index) {
    currentIndex = index;
    render();
  }

  async function open(groups) {
    steps = Array.from(document.querySelectorAll('#steps-section ol > li')).map(li => li.innerHTML);
    if (!steps.length) return;
    stepGroups = groups;
    currentIndex = 0;
    titleEl.textContent = document.querySelector('[data-recipe-id] h1').textContent;
    dotsEl.innerHTML = steps.map(() => '<span class="cook-mode__dot"></span>').join('');
    render();
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    await requestWakeLock();
    closeBtn.focus();
  }

  async function close() {
    overlay.classList.remove('is-open');
    overlay.addEventListener('transitionend', () => { overlay.hidden = true; }, { once: true });
    await releaseWakeLock();
  }

  prevBtn.addEventListener('click', () => goTo(prevStepIndex(currentIndex)));
  nextBtn.addEventListener('click', () => {
    if (currentIndex === steps.length - 1) {
      close();
      return;
    }
    goTo(nextStepIndex(currentIndex, steps.length));
  });
  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') goTo(nextStepIndex(currentIndex, steps.length));
    if (e.key === 'ArrowLeft') goTo(prevStepIndex(currentIndex));
  });

  stepEl.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  });

  stepEl.addEventListener('touchend', e => {
    if (touchStartX == null) return;
    const direction = swipeDirection(e.changedTouches[0].clientX - touchStartX);
    if (direction === 'next') goTo(nextStepIndex(currentIndex, steps.length));
    if (direction === 'prev') goTo(prevStepIndex(currentIndex));
    touchStartX = null;
  });

  return { open, close };
}
```

- [ ] **Step 2: Wire `recipe.js` to pass ingredient groups into `open()`**

In `src/assets/recipe.js`, change:

```js
let currentServings = baseServings;
let recipeData = null;
```

to:

```js
let currentServings = baseServings;
let recipeData = null;
let currentStepGroups = {};
```

Change:

```js
function renderIngredients() {
  if (!recipeData) return;
  const scaled = scaleIngredients(recipeData.ingredients, baseServings, currentServings);
  renderAll(scaled);
  renderStepIngredients(scaled);
}
```

to:

```js
function renderIngredients() {
  if (!recipeData) return;
  const scaled = scaleIngredients(recipeData.ingredients, baseServings, currentServings);
  renderAll(scaled);
  renderStepIngredients(scaled);
  currentStepGroups = groupIngredientsByStep(scaled);
}
```

Change:

```js
document.getElementById('start-cook-mode').addEventListener('click', () => cookMode.open());
```

to:

```js
document.getElementById('start-cook-mode').addEventListener('click', () => cookMode.open(currentStepGroups));
```

- [ ] **Step 3: Run the unit test suite**

Run: `npx vitest run`
Expected: PASS (same 61/63 as before this plan started — the 2 `nav-active.test.js`
failures are pre-existing and reference a non-existent `bolognese` recipe, unrelated to
this change).

- [ ] **Step 4: Build and manually verify the Review Focus items**

Run: `npm run build`

Then verify by reading the built HTML (`curl`/`grep`, since the Chrome browser extension
may not be connected in this environment — note that limitation in your report if so):

- Fetch a recipe whose last step has no ingredients (e.g.
  `_site/recipes/shakshuka-nach-ottolenghi/index.html`, step 6 "Servieren" has no
  ingredients assigned) and confirm the built markup for `#cook-mode-ingredients` still
  has the `hidden` attribute as its initial state (the JS sets it per-step at runtime, but
  this confirms the attribute wiring is intact).
- Confirm `#cook-mode-dots` and `#cook-mode-next-label` exist in the built page.
- If the browser extension *is* available: open cook mode on
  `/recipes/shakshuka-nach-ottolenghi/`, click "Next Step" through all 6 steps, and
  confirm step 6's forward button reads "Done" and clicking it closes the overlay rather
  than erroring or advancing further.

- [ ] **Step 5: Commit**

```bash
git add src/assets/lib/cook-mode.js src/assets/recipe.js
git commit -m "Rewrite cook-mode rendering: title, dots, plain ingredients, step titles"
```

---

## Task 7: Restyle cook mode to match the mockup

**Files:**
- Modify: `src/assets/scss/recipe-detail/_styles.scss`

**Interfaces:**
- Consumes: the class names from Task 5's markup.

- [ ] **Step 1: Replace the `.cook-mode` SCSS block**

In `src/assets/scss/recipe-detail/_styles.scss`, replace everything from the
`// ── Cook mode ──...` comment to the end of the file (the old `.cook-mode`,
`.cook-mode.is-open`, `.cook-mode__header`, `.cook-mode__progress`, `.cook-mode__step`,
`.cook-mode__controls`, and `.cook-mode__nav` rules) with:

```scss
// ── Cook mode ──────────────────────────────────────────────────────────────
// Full-screen step-by-step overlay. Opacity-only transition (no translateY
// like .recipe-preview) since it covers the whole screen rather than
// sliding up from an edge.
.cook-mode {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  flex-direction: column;
  background: $card;
  padding: 1.5rem;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.cook-mode.is-open {
  opacity: 1;
}

// Floats clear of the centered title/progress block below it, rather than
// sharing a header row with them (see the mockup this redesign matches).
.cook-mode__close {
  position: absolute;
  top: 1.1rem;
  right: 1.1rem;
}

.cook-mode__header {
  text-align: center;
  padding: 0.5rem 3rem 1.5rem;
}

.cook-mode__title {
  margin: 0 0 0.75rem;
  font-size: $text-headline-md-size;
  line-height: $text-headline-md-line;
}

.cook-mode__progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.cook-mode__dots {
  display: flex;
  gap: 0.4rem;
}

.cook-mode__dot {
  width: 7px;
  height: 7px;
  border-radius: $radius-full;
  background: $row;

  &.is-current {
    background: $brand;
  }
}

.cook-mode__progress-text {
  font-family: $font-body;
  font-weight: 700;
  font-size: $text-label-md-size;
  color: $text-subtle;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

// Left-aligned content column — swipeable, so the touch listeners in
// cook-mode.js bind directly to this element.
.cook-mode__step {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.5rem 1.5rem;
}

.cook-mode__ingredients {
  margin-bottom: 1.5rem;
}

.cook-mode__ingredients-label {
  display: block;
  font-family: $font-body;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: $text-subtle;
  margin-bottom: 0.5rem;
}

.cook-mode__ingredient {
  padding: 0.4rem 0;
  color: $text-base;
  font-size: $text-body-lg-size;
}

.cook-mode__step-title {
  margin: 0 0 0.75rem;
  font-size: $text-headline-md-size;
  line-height: $text-headline-md-line;
}

.cook-mode__step-body {
  margin: 0;
  color: $text-base;
  font-size: $text-body-lg-size;
  line-height: $text-body-lg-line;
}

.cook-mode__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
}

.cook-mode__back {
  background: transparent;
  color: $text-subtle;
  border: none;
  padding: 0.75rem 0.5rem;
  font-family: $font-body;
  font-size: $text-label-md-size;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
}

.cook-mode__next {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: $brand;
  color: $brand-text;
  border: none;
  border-radius: $radius-full;
  padding: 0.85rem 1.5rem;
  font-family: $font-body;
  font-size: $text-label-md-size;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: $brand-hover;
  }
}
```

- [ ] **Step 2: Build and confirm the compiled CSS contains the new rules**

Run: `npm run build && grep -c "cook-mode__dot" _site/assets/style.css`
Expected: a non-zero count.

- [ ] **Step 3: Commit**

```bash
git add src/assets/scss/recipe-detail/_styles.scss
git commit -m "Restyle cook mode to match the mockup: title, dots, plain ingredients list"
```

---

## Task 8: Update the pattern library's "Cook mode" entry

**Files:**
- Modify: `src/pattern-library/components.njk`

**Interfaces:**
- Consumes: the markup structure from Task 5 and the classes from Task 7.

- [ ] **Step 1: Replace the "Cook mode" section**

In `src/pattern-library/components.njk`, replace the entire `<section class="pl-section">`
block whose `<h2>` reads "Cook mode" (from `<h2 class="pl-section-title">Cook mode</h2>`
through its closing `</section>`) with:

```html
<section class="pl-section">
  <h2 class="pl-section-title">Cook mode</h2>
  <p>.cook-mode — full-screen step-by-step overlay opened from the recipe detail screen's
    "Start cook mode" button. Shows the recipe title and a dot progress indicator at the
    top, that step's ingredients as a plain list (only shown when the step has any), a
    short step title (the bold lead-in every migrated step starts with), and the step
    body — all left-aligned so the text can use the full width. Advances via the "Next
    Step" pill (becomes "Done" and closes cook mode on the last step), a left/right swipe
    on the step, or the arrow keys; "Back" is disabled on the first step. The close (×)
    button floats in the top-right corner, separate from the centered header. Opening it
    enables the screen wake lock; closing it releases it again.</p>
  <div style="position: relative; height: 560px; background: rgba(0,0,0,0.05); border-radius: 1rem; overflow: hidden;">
    <div class="cook-mode is-open" style="position: absolute; inset: 0;">
      <button type="button" class="icon-button cook-mode__close" aria-label="Exit cook mode"><i class="fa-solid fa-xmark"></i></button>
      <div class="cook-mode__header">
        <h2 class="cook-mode__title">Bifteki auf Orzotto</h2>
        <div class="cook-mode__progress">
          <span class="cook-mode__dots">
            <span class="cook-mode__dot"></span>
            <span class="cook-mode__dot"></span>
            <span class="cook-mode__dot"></span>
            <span class="cook-mode__dot is-current"></span>
            <span class="cook-mode__dot"></span>
            <span class="cook-mode__dot"></span>
          </span>
          <span class="cook-mode__progress-text">Step 4 of 6</span>
        </div>
      </div>
      <div class="cook-mode__step">
        <div class="cook-mode__ingredients">
          <span class="cook-mode__ingredients-label">Ingredients</span>
          <div class="cook-mode__ingredient">Ajvar (25 g)</div>
          <div class="cook-mode__ingredient">Oregano (getrocknet) (1 g)</div>
          <div class="cook-mode__ingredient">Orzo-Nudeln (180 g)</div>
          <div class="cook-mode__ingredient">Hühnerbrühepulver (4 g)</div>
          <div class="cook-mode__ingredient">Wasser (400 ml)</div>
        </div>
        <h3 class="cook-mode__step-title">Orzotto köcheln</h3>
        <p class="cook-mode__step-body">Die Pfanne erneut erhitzen und die Zwiebelstreifen 1–2 Minuten anschwitzen. Ajvar, restlichen Oregano, Orzo, Karotten und Knoblauch dazugeben und 2–3 Minuten anbraten. Wasser und Brühepulver hinzufügen, zugedeckt bei niedriger Hitze 10–12 Minuten köcheln lassen, dabei gelegentlich umrühren.</p>
      </div>
      <div class="cook-mode__controls">
        <button type="button" class="cook-mode__back"><i class="fa-solid fa-chevron-left"></i> Back</button>
        <button type="button" class="cook-mode__next">Next Step <i class="fa-solid fa-chevron-right"></i></button>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Build and confirm the pattern library page renders**

Run: `npm run build && curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/pattern-library/components/ 2>/dev/null || grep -c "cook-mode__step-title" _site/pattern-library/components/index.html`
Expected: if the dev server isn't running, the `grep` fallback should report a non-zero
count.

- [ ] **Step 3: Commit**

```bash
git add src/pattern-library/components.njk
git commit -m "Update the pattern library's Cook mode entry to the new layout"
```

---

## Task 9: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: same pass/fail counts as Task 6 Step 3 (61 passed / 2 pre-existing unrelated
failures in `nav-active.test.js`).

- [ ] **Step 2: Full build**

Run: `npm run build`
Expected: builds cleanly, 12 recipe pages + pattern library + planner + index all written.

- [ ] **Step 3: Spot-check the built markup across a few recipes**

Run:
```bash
for r in shakshuka-nach-ottolenghi haehnchen-piccata chilioel-kartoffelsalat-mit-weichen-eiern; do
  echo "=== $r ==="
  grep -o '<strong>[^<]*</strong>' "_site/recipes/$r/index.html" | head -3
done
```
Expected: each recipe shows its migrated step titles as `<strong>...</strong>` text.

- [ ] **Step 4: Visual check for the close-button/title collision (Review Focus item)**

If the Chrome browser extension is connected in this session: open
`/recipes/chilioel-kartoffelsalat-mit-weichen-eiern/` (one of the longer recipe titles),
click "Start cook mode", and screenshot it — confirm the close (×) button doesn't overlap
the title text even if it wraps to two lines.

If the extension is *not* connected: say so explicitly in your final report rather than
claiming this was visually verified — this mirrors how the original cook-mode build was
verified in this same environment.

- [ ] **Step 5: Report**

Summarize what changed (step titles added to content + skill, cook-mode markup/JS/CSS
rewrite, pattern library update), the test/build results from Steps 1–3, and whether
Step 4's visual check was possible or not.
