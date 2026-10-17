# Wochenplan-Kalender — Design

**Date:** 2026-10-17
**Requirements:** `docs/superpowers/specs/2026-10-07-weekplan-kalender-requirements.md`

## Goal

Eine neue Seite `/plan/`, die ein rollierendes 14-Tage-Fenster als 7×2-Grid zeigt, mit genau
einem Rezept-Slot pro Tag. Tap auf leeren Tag öffnet einen Auswahl-Drawer (Vorschläge +
Suche/Liste), Tap auf belegten Tag öffnet die bestehende `recipe-preview`-Komponente. Drag &
Drop (Desktop) tauscht/verschiebt Zuordnungen zwischen Tagen. Eigener, von `planner` entkoppelter
localStorage-State.

## 1. Datenmodell & Fenster-Logik — `src/assets/lib/weekplan.js` (neu)

Reine Funktionen, kein DOM-/localStorage-Zugriff außer in den beiden IO-Funktionen am Ende.
Stil orientiert an `src/assets/lib/suggestions.js`.

```js
// 14 YYYY-MM-DD Strings, beginnend bei `today` (ein Date-Objekt, lokale Zeit).
export function getWindowDates(today, days = 14) {
  const fmt = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return fmt(d);
  });
}

// stored: { [date]: recipeId|null }, windowDates: string[] (aus getWindowDates).
// Tage außerhalb des Fensters fallen raus, fehlende Tage im Fenster werden mit null ergänzt.
// Reihenfolge der Rückgabe folgt windowDates (chronologisch, Tag 1..14).
export function normalizeWeekplan(stored, windowDates) {
  const safe = stored && typeof stored === 'object' ? stored : {};
  const result = {};
  for (const date of windowDates) {
    result[date] = Object.prototype.hasOwnProperty.call(safe, date) ? safe[date] : null;
  }
  return result;
}

const STORAGE_KEY = 'weekplan';

// Liest + normalisiert in einem Schritt. Korrupte/fehlerhafte Daten → leerer Plan.
export function loadWeekplan(windowDates) {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    stored = {};
  }
  return normalizeWeekplan(stored, windowDates);
}

export function saveWeekplan(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
```

- `getWindowDates` nimmt `today` als Parameter (statt intern `new Date()` zu rufen), damit Tests
  deterministisch sind.
- `normalizeWeekplan` ist der Kern der "Fenster wird bei jedem Laden neu berechnet"-Anforderung:
  alte Tage (außerhalb `windowDates`) werden beim Zusammenbau von `result` stillschweigend
  weggelassen, da nur über `windowDates` iteriert wird.
- `loadWeekplan`/`saveWeekplan` sind die einzigen Funktionen mit `localStorage`-Zugriff; alles
  andere bleibt pur und ohne try/catch (Anforderung: korrupte Daten → Fallback auf leeren Plan,
  nicht Crash).

## 2. Seitenstruktur

**Neue Dateien:**
- `src/plan.njk` — `layout: base.njk`, `pageScript: plan.js`, Route `/plan/`.
- `src/assets/plan.js` — Seiten-Controller (State laden, Grid rendern, Tap/Drag wiring,
  Drawer-Logik), analog zu `src/assets/planner.js`.
- `src/assets/scss/weekplan/_styles.scss` — neues Partial, in `src/assets/style.scss` per
  `@use './scss/weekplan';` ergänzt (neben den bestehenden `@use`-Zeilen für `planner`,
  `recipe-preview` etc.).
- `tests/lib/weekplan.test.js` — Vitest-Unit-Tests für §1.

**Geänderte Dateien:**
- `src/_includes/base.njk:17-21` — drittes Icon in `.nav-island`.
- `src/assets/lib/recipe-preview.js` — generalisierter Action-Button (§5).
- `src/pattern-library/components.njk` — neue Einträge für Grid-Zelle + Day-Select-Drawer
  (§7).

## 3. Grid-Markup (`src/plan.njk`)

```html
<div class="weekplan-page">
  <div class="weekplan-hero">
    <div class="planner-header">
      <span class="planner-eyebrow">Dein Plan</span>
      <h1>Die nächsten 14 Tage</h1>
    </div>
    <div id="weekplan-grid" class="weekplan-grid"></div>
  </div>
</div>
```

`#weekplan-grid` wird von `plan.js` befüllt, eine Zelle pro Tag:

```html
<button type="button" class="weekplan-cell" data-date="2026-10-17" draggable="true">
  <span class="weekplan-cell__weekday">Sa</span>
  <span class="weekplan-cell__day">17</span>
  <img class="weekplan-cell__thumb" src="…" alt="">
  <!-- oder: <span class="weekplan-cell__thumb weekplan-cell__thumb--empty"><i class="fa-solid fa-plus"></i></span> -->
</button>
```

- 7 Spalten × 2 Zeilen, chronologisch: Zelle 1 = heute, Zelle 8 = heute+7 — kein
  Wochentag-Raster, Spalte 1 ist immer "heute" unabhängig vom Wochentag der ersten Zelle.
- `draggable="true"` nur gesetzt, wenn die Zelle belegt ist (siehe §6) — leere Zellen sind nicht
  draggable.
- `.weekplan-cell__thumb` zeigt: Rezeptbild (belegt + Rezept noch auflösbar), ein `+`-Icon
  (leer), oder ein Warn-Icon (belegt, aber Rezept nicht mehr auflösbar — siehe §8).
- Kein Titeltext in der Zelle — Details erst im Tap-Preview, hält die Zelle auf ~50px Breite
  lesbar.

## 4. Day-Select-Drawer (Tap auf leeren Tag)

Neue Overlay-Komponente `.day-select`, strukturell wie `.recipe-preview` (Backdrop + von unten
einfahrendes Panel, `is-open`-Klasse), aber mit eigenem Inhalt statt Rezeptdetails:

```html
<div id="day-select" class="day-select" hidden>
  <div class="day-select__backdrop" data-close></div>
  <div class="day-select__panel" role="dialog" aria-modal="true" aria-labelledby="day-select-title">
    <button type="button" class="icon-button day-select__close" data-close aria-label="Close">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <h2 id="day-select-title" class="day-select__title"></h2>

    <section id="day-select-suggestions" class="suggestions" hidden>
      <h3>Mit ähnlichen Zutaten</h3>
      <ul id="day-select-suggestion-list" class="suggestion-list"></ul>
    </section>

    <input id="day-select-search" type="search" placeholder="Rezepte durchsuchen…" autocomplete="off">
    <ul id="day-select-list" class="recipe-list"></ul>
  </div>
</div>
```

- `#day-select-title` wird beim Öffnen auf das angetippte Datum gesetzt (z.B. "Sa, 17.10.").
- Vorschläge-Sektion: `suggestRecipes(planned, all)` aus `suggestions.js`, `planned` = alle
  Rezepte, die aktuell irgendeinem Tag im Fenster zugeordnet sind. Nur sichtbar, wenn
  `suggestions.length > 0`. Reuses `.suggestion-list`/`.suggestion-list__item`-Markup 1:1 aus
  `planner.js`'s `renderSuggestions`, nur ohne den Add-Icon-Button — ein Klick auf den Eintrag
  weist das Rezept direkt dem offenen Tag zu und schließt den Drawer.
- Suche + volle Liste darunter: clientseitiger Filter über `/index.json` auf `title`
  (gleiche Quelle wie `main.js`'s Suche), `.recipe-list`-Markup aus `src/index.njk` wiederverwendet.
  Klick auf einen Listeneintrag weist zu und schließt.
- Zuweisen = `plan.js` ruft `assignDay(date, recipeId)`: State-Update → `saveWeekplan` →
  betroffene Zelle neu rendern (kein Reload) → Drawer schließen.

## 5. `recipe-preview.js` — generalisierter Action-Button

**Datei:** `src/assets/lib/recipe-preview.js`

Heute ist der Action-Button hart auf "Add to planner" verdrahtet (`setAddButtonState`,
`isPlanned`, direkter `localStorage.planner`-Zugriff in `open()`/dem Click-Handler). Für den
Wochenplan braucht der gleiche Button stattdessen "Tag leeren".

```js
// open()'s neuer, optionaler Parameter. Wenn weggelassen: unverändertes
// Verhalten (Add-to-planner-Toggle) für bestehende Aufrufer (main.js, planner.js).
function open({ id, image, imageAlt, title, description, href, bringHref, action }) {
  previewRecipeId = id;
  previewImage.src = image || '';
  previewImage.alt = imageAlt || '';
  previewTitle.textContent = title;
  previewDescription.textContent = description || '';
  previewCta.href = href;
  if (previewBringBtn) {
    previewBringBtn.hidden = !bringHref;
    if (bringHref) previewBringBtn.href = bringHref;
  }
  if (action) {
    previewAddBtn.querySelector('i').className = `fa-solid ${action.icon}`;
    previewAddBtn.setAttribute('aria-label', action.label);
    previewAddBtn.disabled = false;
    previewAddBtn.classList.remove('is-active');
    currentAction = action;
  } else {
    currentAction = null;
    setAddButtonState(isPlanned(id));
  }
  preview.hidden = false;
  requestAnimationFrame(() => preview.classList.add('is-open'));
  previewAddBtn.closest('.recipe-preview__panel').querySelector('.recipe-preview__close').focus();
}
```

```js
let currentAction = null;

previewAddBtn.addEventListener('click', () => {
  if (currentAction) {
    currentAction.onClick();
    return;
  }
  if (!previewRecipeId) return;
  const planner = JSON.parse(localStorage.getItem('planner') || '[]');
  if (!planner.includes(previewRecipeId)) {
    planner.push(previewRecipeId);
    localStorage.setItem('planner', JSON.stringify(planner));
  }
  setAddButtonState(true);
});
```

- `action: { label: string, icon: string (Font-Awesome-Suffix, z.B. 'fa-calendar-xmark'),
  onClick: () => void }`.
- `plan.js` ruft `preview.open({ …, action: { label: 'Tag leeren', icon: 'fa-calendar-xmark',
  onClick: () => clearDay(date) } })` — `clearDay` setzt den Tag auf `null`, speichert, rendert
  die Zelle neu, schließt den Preview (`preview.close()`).
- `main.js`/`planner.js` übergeben `action` nicht → unverändertes Verhalten, keine Migration
  nötig.

## 6. Drag & Drop (Desktop, sekundär)

**Datei:** `src/assets/plan.js`

```js
grid.addEventListener('dragstart', e => {
  const cell = e.target.closest('.weekplan-cell[draggable="true"]');
  if (!cell) return;
  e.dataTransfer.setData('text/plain', cell.dataset.date);
});

grid.addEventListener('dragover', e => {
  if (e.target.closest('.weekplan-cell')) e.preventDefault(); // allow drop
});

grid.addEventListener('drop', e => {
  const target = e.target.closest('.weekplan-cell');
  if (!target) return;
  e.preventDefault();
  const fromDate = e.dataTransfer.getData('text/plain');
  const toDate = target.dataset.date;
  if (fromDate === toDate) return;
  swapDays(fromDate, toDate);
});
```

- `swapDays(fromDate, toDate)`: liest beide Werte aus dem State, tauscht sie (`toDate`'s
  vorheriger Wert — ggf. `null` bei leerem Ziel — landet auf `fromDate`, und umgekehrt),
  speichert, rendert beide Zellen neu.
- Nur belegte Zellen sind `draggable` (§3) — ein Drop auf eine leere Zelle verschiebt (die Quelle
  wird leer), ein Drop auf eine belegte Zelle tauscht. Beides deckt derselbe `swapDays`-Aufruf ab,
  da "Tausch mit `null`" identisch zu "Verschieben" ist.
- Keine Touch-Handler — Tap bleibt auf allen Geräten der primäre Weg, Drag & Drop ist nur über
  echte `dragstart`/`drop`-Events erreichbar (Desktop-Mausnutzung).

## 7. Pattern Library

**Datei:** `src/pattern-library/components.njk`

Zwei neue Einträge unter einer neuen Sektion "Weekplan", vor der Implementierung in `plan.njk`
gebaut (CLAUDE.md-Workflow):
- Grid-Zelle: beide Zustände (leer, belegt) nebeneinander, mit `.pl-label`-Beschreibung.
- Day-Select-Drawer: statisches Beispiel mit 1 Vorschlag + 2 Suchergebnissen, analog zum
  bestehenden "Plan drawer"-Eintrag (Zeile 69 ff.).

## 8. Fehlerfälle

- **Rezept nicht mehr auflösbar:** `plan.js` lädt beim Start `/index.json` und gleicht jede
  belegte `recipeId` dagegen ab (`Promise.allSettled` + fetch, analog `planner.js`). Fehlt die
  ID im Index, rendert die Zelle ein Warn-Icon statt Thumbnail; Tap öffnet keinen
  `recipe-preview`, sondern direkt den Day-Select-Drawer mit dem Hinweistext "Rezept nicht mehr
  verfügbar" über der Vorschlagsliste — der Tag ist damit sofort neu belegbar.
- **Korrupte localStorage-Daten:** `loadWeekplan`'s try/catch (§1) fängt JSON-Parse-Fehler ab und
  liefert einen leeren, normalisierten Plan statt zu crashen.

## 9. Testing

- `tests/lib/weekplan.test.js`: `getWindowDates` (14 aufeinanderfolgende Tage, korrektes
  Monats-/Jahresrollover), `normalizeWeekplan` (wirft Tage außerhalb des Fensters raus, ergänzt
  fehlende Tage als `null`, erhält Reihenfolge von `windowDates`), `loadWeekplan` (korruptes JSON
  → leerer normalisierter Plan).
- Grid-Rendering, Drawer, Drag & Drop: manuell im Dev-Server geprüft (UI-getrieben, kein
  bestehendes Testmuster für DOM-Wiring in `planner.js`/`recipe-preview.js`).

## Files Changed

| File | Change |
|------|--------|
| `src/assets/lib/weekplan.js` | Neu — Fenster-/Normalisierungs-/IO-Funktionen |
| `tests/lib/weekplan.test.js` | Neu — Unit-Tests für `weekplan.js` |
| `src/plan.njk` | Neu — Grid-Seite |
| `src/assets/plan.js` | Neu — Seiten-Controller |
| `src/assets/scss/weekplan/_styles.scss` | Neu — Grid-/Drawer-Styles |
| `src/assets/style.scss` | `@use './scss/weekplan';` ergänzt |
| `src/_includes/base.njk` | Drittes Nav-Icon (`fa-calendar-days` → `/plan/`) |
| `src/assets/lib/recipe-preview.js` | `open()` nimmt optionalen `action`-Parameter |
| `src/pattern-library/components.njk` | Neue "Weekplan"-Sektion (Grid-Zelle, Day-Select-Drawer) |
