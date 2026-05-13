# Formular-Felder Dokumentation

Vollständige Dokumentation aller Felder des AFA-Gutachten-Formulars (`formular.html`) und ihrer Verarbeitung bis ins finale Word-Gutachten (`templates/gutachten_template.docx`).

Pro Formular-Sektion eine eigene MD-Datei. Jede Datei dokumentiert für jedes Feld:

- **Quelle**: `formular.html:<Zeile>` (Label, Input-Typ, Optionen / Datalist)
- **Mapping**: Variable in `lib/docx/context.js` + ggf. Transformer aus `lib/transformers.js`
- **Template-Platzhalter**: `{<key>}` im Word-Template mit Wort-Kontext (zitiert)
- **Auswirkung**: Vorher/Nachher-Beispiele und Besonderheiten

## Sektionen (Reihenfolge wie im Formular)

| # | Sektion | Datei | Inhalt |
|---|---|---|---|
| 1 | Gutachten-Metadaten | [01-metadaten.md](01-metadaten.md) | Stichtag, Auftrags-, Ortsbesichtigungs-, Unterschriftsdatum |
| 2 | Auftraggeber | [02-auftraggeber.md](02-auftraggeber.md) | Anrede, Vor-/Nachname, Adresse → zusammengesetzte Block/Satz-Outputs |
| 3 | Angaben zum Objekt | [03-objekt.md](03-objekt.md) | Anschrift, Eckdaten, Nutzung, Stellplätze, Grundbuch, Geschossigkeit, Kellerung, Energieausweis, Zustand/Standard |
| 4 | Erschließung | [04-erschliessung.md](04-erschliessung.md) | Strom/Gas/Wasser/Kanalisation/Himmelsrichtung/Fahrbahn → `{erschliessung_text}` |
| 5 | Bilder | [05-bilder.md](05-bilder.md) | Hausansicht (×2), Grundriss, Liegenschaftskarte, Anlage 1, Bildunterschriften, Upload-Pipeline |
| 6 | Bauart | [06-bauart.md](06-bauart.md) | Außen-/Innenwände UG/EG, Decken, Dach, Fenster, Fassade, energetischer Zustand |
| 7 | Haustechnik | [07-haustechnik.md](07-haustechnik.md) | Heizung (Art, Typ, Artikel, Zusatz-Sonderfall), Warmwasser, Solar, PV, Aufzug |
| 8 | Modernisierungen | [08-modernisierungen.md](08-modernisierungen.md) | Freitext `modernisierung_freitext` (Tabelle mit Maßnahmen/Jahren → siehe `17-rnd.md`) |
| 9 | Erweiterung / Anbau | [09-erweiterung.md](09-erweiterung.md) | Freitext `erweiterung` |
| 10 | Sanierungszustand | [10-sanierungszustand.md](10-sanierungszustand.md) | Freitext `sanierungszustand` |
| 11 | Bauschäden | [11-bauschaeden.md](11-bauschaeden.md) | Freitext `bauschaeden` |
| 12 | Anmerkung | [12-anmerkung.md](12-anmerkung.md) | Freitext `anmerkung` |
| 13 | Außenanlagen | [13-aussenanlagen.md](13-aussenanlagen.md) | Eingang, Garten, Zustand (drei Felder) |
| 14 | Bauteile — Detailtexte | [14-bauteile.md](14-bauteile.md) | Rohbau-Zusatz, Wandoberflächen, Türen, Bodenbeläge, Decken-Oberfläche, Haustechnik-Detailtexte (inkl. 3 Sonderfälle) |
| 15 | Funktion-Zusatztexte | [15-funktion.md](15-funktion.md) | Zusätze nach „Vollgeschosse" und „Wohneinheiten" |
| 16 | Bautechnische Beurteilung (Sektion 6) | [16-bautechnik.md](16-bautechnik.md) | Decken-/Standsicherheits-/Tierbefall-Einschätzung + Override für Installation, viele generierte Texte |
| 17 | Restnutzungsdauer (Sektion 7) | [17-rnd.md](17-rnd.md) | Fiktives Alter, RND, GND, Modernisierungs-Tabelle, SW-RL-Punkte mit Summe + Kategorie |

Ergänzend liegt der reine **Template-Text** für Suche/Referenz in [`_template_extract.md`](_template_extract.md) (aus `templates/gutachten_template.docx` extrahiert).

---

## Globale Konventionen (gelten überall)

### Helper-Funktionen
Quelle: `lib/transformers.js`

| Helfer | Bedeutung |
|---|---|
| `T.str(value)` | Trimt zu String. Leerwert (null/undefined) → `''` |
| `T.fallback(value)` | Wie `T.str`, aber leerer Wert → sichtbares `___` (Drei-Unterstrich-Platzhalter) im Word |
| `T.compactJoin(parts, sep)` | Joint Array mit Separator; leere/whitespace-Teile werden gefiltert |

**Folge**: Felder, die in `context.js` über `T.fallback(...)` ausgegeben werden, zeigen bei leerer Eingabe ein deutlich sichtbares `___` im Word — ideal für Pflichtangaben. Felder ohne `T.fallback` erscheinen bei leerer Eingabe einfach **leer** (kein Marker).

### Wo wird ersetzt?
- **Word-Template**: `templates/gutachten_template.docx` mit `{platzhalter}`-Syntax (docxtemplater)
- **Context-Builder**: `lib/docx/context.js` → `buildDocxContext(fields)` baut das Objekt mit allen Output-Keys
- **Render-Pipeline**: `lib/docx/render.js` (+ `image-utils.js`, `anlage.js`)

### Sonderfälle (kurz; Details in den Einzeldateien)

- **`heizung_zusatz`** (`14-bauteile.md` + `07-haustechnik.md`): Trotz eigenem Platzhalter `{heizung_zusatz}` im Template wird der Eingabewert **inline in `{heizung_text}`** verbaut und der Platzhalter `{heizung_zusatz}` selbst auf `''` gesetzt (sonst würde der Zusatz hinter dem Satzpunkt landen).
- **`terrasse_balkon_text` → `{terrasse_balkon}`** (`14-bauteile.md`): Einziges Feld, bei dem das `_text`-Suffix beim Mapping verschwindet.
- **`bild1` = `bild3`** (`05-bilder.md`): Die Hausansicht wird im Template zweimal verwendet; Eingabe und Caption werden auf beide Stellen gespiegelt.
- **`kellerdecke_label`** (`06-bauart.md`): Wechselt zwischen „Kellerdecke" / „Bodenplatte" abhängig vom Feld `kellerung` aus Sektion 3 (cross-section).
- **`fundamente_einschaetzung_text`** (`16-bautechnik.md`): Wechselt analog je nach Kellerung (mit Keller / mit Bodenplatte).
- **`decke_og` Fallback** (`06-bauart.md`): Wenn das EG-Decken-Feld leer ist, übernimmt das OG-Feld dessen Wert.
- **`installation_text` Override** (`16-bautechnik.md`): Eingabe in `installation_einschaetzung` ersetzt einen festen Default-Satz.
- **`rnd_punkte_summe` + `rnd_kategorie_text`** (`17-rnd.md`): Werden aus 7 Einzelpunkten gerechnet; Kategorie hängt an festen Schwellwerten (0 / 1–4 / 5–9 / 10–14 / ≥15).
- **Generierte Texte ohne eigenes Eingabefeld**: `sachverhalt_einleitung`, `sachverhalt_zwischen`, `gebaeude_kurzbeschreibung`, `bautechnik_einleitung`, `erschliessung_text`, `waermeschutz_text`, `auftraggeber_block` / `_satz` / `_name`, `stellplaetze` — alle aus mehreren Eingaben zusammengebaut (siehe jeweilige MD).

---

## Verwendung dieser Doku

Wenn du wissen willst „Was passiert, wenn ich Feld X auf Y setze?":
1. Schau in der Übersicht oben, in welcher Sektion das Feld liegt.
2. Öffne die zugehörige `NN-<sektion>.md`.
3. Suche das Feld unter „Felder im Detail" oder in der Übersichtstabelle.
4. Dort steht: Mapping, Transformer, Output-Key, Template-Platzhalter, Word-Kontext (Zitat) und Vorher/Nachher-Auswirkung.

Wenn du wissen willst „Wo kommt der Platzhalter `{xyz}` her?":
1. Grep den Platzhalter in `_template_extract.md` für den Kontext.
2. Grep den Output-Key in `lib/docx/context.js` für das Mapping.
3. Folge der Variable rückwärts zum Eingabefeld in `formular.html`.
