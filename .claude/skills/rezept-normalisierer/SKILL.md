---
name: rezept-normalisierer
description: Use when a recipe needs to be normalized into structured MD and JSON files — triggered by URLs, photos, typed text, or any raw recipe input that needs standardized output.
---

# Rezept-Normalisierer

## Übersicht

Wandelt ein Rezept aus beliebigem Format (URL-Inhalt, Foto, abgetippter Text) in zwei standardisierte Ausgabedateien um: eine MD-Datei für Menschen und eine JSON-Datei für Maschinen.

## Ausgabe 1: Markdown-Datei (`<id>.md`)

```markdown
---
id: <id>
title: <Titel>
aufwand: <einfach|mittel|aufwändig>
servings: <Anzahl>
---

<Kurze Beschreibung in 2-3 Sätzen.>

1. <Schritt eins>
2. <Schritt zwei>
3. <Schritt drei>
```

## Ausgabe 2: JSON-Datei (`<id>.json`)

```json
{
  "id": "<id>",
  "title": "<Titel>",
  "aufwand": "<einfach|mittel|aufwändig>",
  "servings": <Zahl>,
  "ingredients": [
    { "name": "<Zutat>", "amount": <Zahl|null>, "unit": "<Einheit|null>", "step": <Schrittnummer> }
  ]
}
```

## Regeln

### ID
- Lowercase, keine Sonderzeichen (ä→ae, ö→oe, ü→ue, ß→ss)
- Bindestriche statt Leerzeichen
- Beispiel: `spaghetti-carbonara`

### Aufwand
Nur diese drei Werte erlaubt:
- `einfach` — wenige Schritte, Alltagszutaten, unter 30 Min
- `mittel` — mehrere Techniken oder Schritte, 30–60 Min
- `aufwändig` — komplexe Technik, viele Schritte, über 60 Min oder Ruhephasen

### Zutaten
- Wenn eine Zutat in mehreren Schritten vorkommt: je ein Eintrag pro Schritt mit der entsprechenden `step`-Nummer
- Unklare oder fehlende Mengen: `"amount": null, "unit": null`
- `step` bezieht sich auf die Schrittnummer in der MD-Datei

### Einheiten (nur diese verwenden)

| Einheit | Bedeutung |
|---------|-----------|
| `g` | Gramm |
| `kg` | Kilogramm |
| `ml` | Milliliter |
| `l` | Liter |
| `EL` | Esslöffel |
| `TL` | Teelöffel |
| `Tasse` | Tasse |
| `Stück` | Stück |
| `Zehe` | Knoblauchzehe o.ä. |
| `Prise` | Prise |
| `Scheibe` | Scheibe |

### Sprache
Alle Texte auf Deutsch. Fremdsprachige Rezepte übersetzen.

## Beispiel

**Input:** "Spaghetti Carbonara for 2: 200g spaghetti, 100g pancetta, 2 eggs, 50g parmesan, black pepper. Cook pasta, fry pancetta, mix eggs+cheese, combine off heat."

**`spaghetti-carbonara.md`:**
```markdown
---
id: spaghetti-carbonara
title: Spaghetti Carbonara
aufwand: mittel
servings: 2
---

Ein klassisches römisches Nudelgericht mit cremiger Ei-Käse-Sauce ohne Sahne.
Die Hitze der Pasta gart die Eier sanft zu einer seidigen Sauce.

1. Spaghetti in Salzwasser al dente kochen.
2. Pancetta in einer Pfanne knusprig ausbraten.
3. Eier und Parmesan in einer Schüssel verquirlen.
4. Pasta vom Herd nehmen, Pancetta und Ei-Käse-Mischung unterheben, mit Pfeffer würzen.
```

**`spaghetti-carbonara.json`:**
```json
{
  "id": "spaghetti-carbonara",
  "title": "Spaghetti Carbonara",
  "aufwand": "mittel",
  "servings": 2,
  "ingredients": [
    { "name": "Spaghetti", "amount": 200, "unit": "g", "step": 1 },
    { "name": "Pancetta", "amount": 100, "unit": "g", "step": 2 },
    { "name": "Eier", "amount": 2, "unit": "Stück", "step": 3 },
    { "name": "Parmesan", "amount": 50, "unit": "g", "step": 3 },
    { "name": "Schwarzer Pfeffer", "amount": null, "unit": "Prise", "step": 4 }
  ]
}
```

## Häufige Fehler

| Fehler | Richtig |
|--------|---------|
| `aufwand: "schnell"` | Nur `einfach`, `mittel`, `aufwändig` |
| Sonderzeichen in ID: `knödel` | ID: `knoedel` |
| Eine Zutat für alle Schritte | Pro Schritt ein separater Eintrag |
| Fehlende Menge als `0` | Fehlende Menge als `null` |
| Englische Einheit `tbsp` | Immer `EL` verwenden |
