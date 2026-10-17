# Wochenplan-Kalender — Anforderungsliste

Status: Anforderungsliste (noch keine detaillierte Spec, keine Implementierungsfreigabe)
Datum: 2026-10-07

## Übergeordnetes Ziel

Das Projekt soll langfristig bei der Essensplanung für die Woche helfen, Einkaufssynergien ermöglichen und zu lokalen Angeboten passende Rezepte vorschlagen. Dieser Kalender ist der erste Baustein (Wochenplanung). Einkaufssynergien und lokale Angebote sind eigene, spätere Teilprojekte — siehe Backlog unten, nicht Teil dieser Anforderungsliste.

## Scope

- Single-User, kein Login/Backend
- Rollierendes 14-Tage-Fenster ab heute (kein Mo–So-Kalender, keine Wochen-Navigation, kein Verlauf)
- Genau 1 Rezept-Slot pro Tag
- Neue Seite, unabhängig von der bestehenden Planner-Seite (`src/planner.njk`), aber so gebaut, dass sie diese später ablösen könnte

## Datenmodell

- Eigener localStorage-Key `weekplan`, Map `{ "YYYY-MM-DD": "recipe-id" | null }`
- Fenster wird bei jedem Laden neu berechnet/normalisiert: Tage außerhalb von heute…+13 fallen raus, neue Tage kommen leer dazu
- Kein gemeinsamer State mit dem bestehenden `planner`-Pool-Array (entkoppelter Ansatz, s.u. "Entscheidungen")

## Zuordnung / Interaktion

- Tap auf leeren Tag → Auswahl-Drawer mit Rezeptliste/Suche
- Tap auf belegten Tag → bestehende `recipe-preview`-Komponente (`src/assets/lib/recipe-preview.js`), inkl. Bring-Export-Button, aber „Tag leeren" statt „aus Planer entfernen"
- Drag & Drop als sekundärer Zuordnungsweg (vor allem Desktop), Tap bleibt primär
- Vorschläge nach gemeinsamen Zutaten (`suggestRecipes` aus `src/assets/lib/suggestions.js`) bleiben aktiv, bezogen auf die offenen Tage im 14-Tage-Fenster

## Navigation / Einstieg

- Dritter Icon-Link in der Bottom-Nav-Island (`src/_includes/base.njk:17-21`), z.B. `fa-calendar-days`, Route `/plan/`
- Bestehender Planner-Link (`fa-calendar`, `/planner/`) bleibt unverändert bestehen

## Datenfluss

- Laden: localStorage lesen → Fenster normalisieren → belegte Rezept-IDs gegen `/index.json` auflösen (`Promise.allSettled` + fetch, analog zu `planner.js`)
- Ändern: State-Update → localStorage schreiben → nur die betroffene Tageskarte neu rendern (kein Full-Page-Reload wie beim aktuellen „Clear" in `planner.js`)

## Fehlerfälle

- Gelöschtes/nicht mehr erreichbares Rezept → Tageskarte zeigt „Rezept nicht mehr verfügbar" + Tag ist neu belegbar
- Korrupte/fehlerhafte localStorage-Daten → try/catch, Fallback auf leeren Plan statt Crash

## Testing

- Reine Logik (Fensterberechnung, Normalisierung, Parsing) in eigener Lib `src/assets/lib/weekplan.js`, mit Vitest-Unit-Tests `tests/lib/weekplan.test.js` (passend zum bestehenden Muster: `suggestions.test.js`, `bring.test.js`, …)
- UI-Flows (Tap, Drag & Drop) manuell im Dev-Server geprüft, da stark UI-getrieben

## Getroffene Entscheidungen (zur Nachvollziehbarkeit)

- Nutzerkreis: nur eine Person → kein Mehrbenutzer-Sync nötig
- Datenmodell-Ansatz: eigener, vom bestehenden Pool entkoppelter Speicher (statt den bestehenden `planner`-Array als Basis zu erweitern) — geringeres Regressionsrisiko für die bestehende Planner-Seite, einfachere spätere Migration
- Bündelte Wocheneinkaufsliste bewusst **nicht** Teil dieses Kalenders — siehe Backlog

## Offen / Backlog (nicht Teil dieser Anforderungsliste)

- **Einkaufssynergien:** automatische, gebündelte Wocheneinkaufsliste (Zutaten aller geplanten Rezepte summiert, nach Kategorie sortiert), Gesamt-Export zu Bring! (statt nur pro Rezept), Hinweise auf angebrochene Packungen, die sich über mehrere Rezepte in der Woche verwerten lassen
- **Lokale Angebote:** Abgleich der Einkaufsliste mit aktuellen Angeboten in der Umgebung, Rezeptvorschläge basierend auf reduzierten Zutaten. Braucht vor jeder Spec einen eigenen Feasibility-Spike:
  - Gibt es öffentliche, für Endkunden-Abruf gedachte Angebotsseiten einzelner Händler (z.B. REWE, EDEKA), die man nutzen dürfte — im Gegensatz zu Aggregatoren wie Marktguru/Kaufda ohne öffentliche API?
  - Ein LLM-gestützter Fetch+Extraktions-Schritt wäre robuster als klassisches Scraping (überlebt Layout-Änderungen), löst aber nicht die Zugriffsrechte-Frage und erfordert eine serverseitige/geplante Komponente — das Projekt ist aktuell eine reine statische 11ty-Seite ohne Backend
  - Aktualität: Angebote sind wochenweise, ein wöchentlicher Lauf würde reichen (kein Echtzeitbedarf)
