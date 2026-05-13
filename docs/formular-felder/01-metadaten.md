# Gutachten-Metadaten

Diese Sektion (`data-section-key="metadaten"`) ist im Formular **admin-only**, d.h. nur der Sachverständige sieht und füllt sie aus. Sie sammelt die administrativen Datumsangaben rund um die Auftragsbearbeitung: **Stichtag, Auftragsdatum, Ortsbesichtigungsdatum, Unterschriftsdatum**. Diese Daten erscheinen an verschiedenen Stellen im Word-Dokument — vom Deckblatt (Stichtag) über die Auftrags- und Ortsbesichtigungs-Kapitel bis zur Unterschriftzeile am Ende des Gutachtens.

Alle vier Felder sind HTML-`type="date"`-Inputs (ISO-Format `YYYY-MM-DD`) und werden vor dem Einfügen in das DOCX über den Transformer `formatDateDe` ([`lib/transformers.js:20`](../../lib/transformers.js)) in das deutsche Langformat `D. Monatsname YYYY` (z.B. `13. Mai 2026`) umgewandelt. Alle vier Output-Werte werden durch `T.fallback(...)` geschickt — leer eingegebene Felder erscheinen im Word also als `___`-Platzhalter.

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `stichtag` | `{stichtag}` | Deckblatt unter dem Objekt, Sektion 7 (Bewertungsstichtag-Zeile) |
| `auftragsdatum` | `{auftragsdatum}` | Sektion 2 „Auftrag" — Einleitungssatz zur Beauftragung |
| `ortsbesichtigungsdatum` | `{ortsbesichtigungsdatum}` | Sektion 4 „Ortsbesichtigung" — Termin der Objektaufnahme |
| `unterschriftsdatum` | `{unterschriftsdatum}` | Schlusszeile „Der Sachverständige München, den …" |

## Felder im Detail

### `stichtag`

- **Label im Formular**: „Stichtag:"
- **HTML-Input-Typ**: `type="date"`
- **Datalist/Options**: keine — freier Date-Picker (ISO-Format).
- **Quelle**: `formular.html:96-99`
- **Mapping (Context)**: `lib/docx/context.js:113` — `const stichtag = T.formatDateDe(fields.stichtag);`
- **Transformer**: `formatDateDe(value)` ([`lib/transformers.js:20-28`](../../lib/transformers.js)) — Konvertiert ISO-Datum (`yyyy-mm-dd`) in deutsches Langformat `D. Monatsname YYYY`. Bei leerer Eingabe wird `''` zurückgegeben (kein Hardfail, kein Fallback-Default).
- **Output-Key im Context-Objekt**: `stichtag` (`lib/docx/context.js:328`), gewrappt in `T.fallback(stichtag)` → leere Eingabe wird zu `___`.
- **Template-Platzhalter**: `{stichtag}`
- **Word-Kontext** (Vorkommen im Template):
  1. Deckblatt direkt unter dem Objekt:
     > Stichtag: {stichtag}
     (`_template_extract.md:25`)
  2. Im RND-Schlussabschnitt (Sektion 7) als Bewertungsstichtag-Zeile:
     > zum Bewertungsstichtag, den {stichtag}
     (`_template_extract.md:747`)
- **Auswirkung**: Mit Wert (`2026-05-13`) wird im Word z.B. ausgegeben: „Stichtag: 13. Mai 2026" und „zum Bewertungsstichtag, den 13. Mai 2026". Ohne Wert erscheint an beiden Stellen `___`.
- **Besonderheiten**: Der Stichtag taucht im Template an genau **zwei** Stellen auf und ist der zentrale Bewertungs-Bezugstag des gesamten Gutachtens.

### `auftragsdatum`

- **Label im Formular**: „Auftragsdatum:"
- **HTML-Input-Typ**: `type="date"`
- **Datalist/Options**: keine.
- **Quelle**: `formular.html:100-103`
- **Mapping (Context)**: `lib/docx/context.js:114` — `const auftragsdatum = T.formatDateDe(fields.auftragsdatum);`
- **Transformer**: `formatDateDe(value)` ([`lib/transformers.js:20-28`](../../lib/transformers.js)) — wie oben.
- **Output-Key im Context-Objekt**: `auftragsdatum` (`lib/docx/context.js:330`), gewrappt in `T.fallback(...)`.
- **Template-Platzhalter**: `{auftragsdatum}`
- **Word-Kontext** (Sektion 2 „Auftrag"):
  > Am {auftragsdatum} erteilte {auftraggeber_satz}, dem Unterzeichner den Auftrag, den bautechnischen Zustand des Gebäudes in Hinblick auf eine Sanierung sowie die Restnutzungsdauer des Gebäudes zu beurteilen.
  (`_template_extract.md:141`)
- **Auswirkung**: Mit Wert (`2026-04-22`) wird ausgegeben: „Am 22. April 2026 erteilte Herr Mustermann, …". Ohne Wert: „Am ___ erteilte …".
- **Besonderheiten**: Erscheint nur einmal im Template, im Eröffnungssatz von Sektion 2 zusammen mit `{auftraggeber_satz}`.

### `ortsbesichtigungsdatum`

- **Label im Formular**: „Ortsbesichtigung am:"
- **HTML-Input-Typ**: `type="date"`
- **Datalist/Options**: keine.
- **Quelle**: `formular.html:104-107`
- **Mapping (Context)**: `lib/docx/context.js:115` — `const ortsbesichtigungsdatum = T.formatDateDe(fields.ortsbesichtigungsdatum);`
- **Transformer**: `formatDateDe(value)` ([`lib/transformers.js:20-28`](../../lib/transformers.js)) — wie oben.
- **Output-Key im Context-Objekt**: `ortsbesichtigungsdatum` (`lib/docx/context.js:331`), gewrappt in `T.fallback(...)`.
- **Template-Platzhalter**: `{ortsbesichtigungsdatum}`
- **Word-Kontext** (Sektion 4 „Ortsbesichtigung"):
  > Die Objektaufnahme wurde am {ortsbesichtigungsdatum} durchgeführt. Daran nahmen der Auftraggeber, {auftraggeber_name}, sowie als Sachverständiger der Unterzeichnende teil. Bei diesem Ortstermin wurden die wesentlichen Merkmale des Gebäudes in Wort und Bild aufgenommen.
  (`_template_extract.md:205`)
- **Auswirkung**: Mit Wert (`2026-04-25`) wird ausgegeben: „Die Objektaufnahme wurde am 25. April 2026 durchgeführt." Ohne Wert: „Die Objektaufnahme wurde am ___ durchgeführt."
- **Besonderheiten**: Erscheint nur einmal im Template, im Einleitungssatz von Sektion 4.

### `unterschriftsdatum`

- **Label im Formular**: „Unterschriftsdatum:"
- **HTML-Input-Typ**: `type="date"`
- **Datalist/Options**: keine.
- **Quelle**: `formular.html:108-111`
- **Mapping (Context)**: `lib/docx/context.js:116` — `const unterschriftsdatum = T.formatDateDe(fields.unterschriftsdatum);`
- **Transformer**: `formatDateDe(value)` ([`lib/transformers.js:20-28`](../../lib/transformers.js)) — wie oben.
- **Output-Key im Context-Objekt**: `unterschriftsdatum` (`lib/docx/context.js:329`), gewrappt in `T.fallback(...)`.
- **Template-Platzhalter**: `{unterschriftsdatum}`
- **Word-Kontext** (Schlusszeile, ganz am Ende des Gutachtens):
  > Der Sachverständige München, den {unterschriftsdatum}
  (`_template_extract.md:769`)
- **Auswirkung**: Mit Wert (`2026-05-13`) wird ausgegeben: „Der Sachverständige München, den 13. Mai 2026". Ohne Wert: „Der Sachverständige München, den ___".
- **Besonderheiten**: Erscheint nur einmal im Template, ganz am Ende vor dem Haftungsabschnitt — markiert den Tag, an dem das Gutachten unterzeichnet wird (kann/sollte nach dem Stichtag liegen).

## Hinweise zur Datums-Konvertierung

Der Transformer `formatDateDe` ([`lib/transformers.js:20-28`](../../lib/transformers.js)) arbeitet so:

```js
function formatDateDe(value) {
  const s = str(value);
  if (!s) return '';
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;          // Fallback: gibt Original zurück, wenn nicht ISO
  const [, y, mo, d] = m;
  const months = ['Januar','Februar','März', ...];
  return `${parseInt(d, 10)}. ${months[parseInt(mo, 10) - 1]} ${y}`;
}
```

Beispiel-Transformationen:

| Eingabe (ISO)  | Ausgabe im Word       |
|----------------|-----------------------|
| `2026-05-13`   | `13. Mai 2026`        |
| `2026-01-03`   | `3. Januar 2026`      |
| `2025-12-31`   | `31. Dezember 2025`   |
| (leer)         | `___` (via `T.fallback`) |

Da alle vier Felder denselben Transformer und denselben `T.fallback`-Wrapper benutzen, ist das Verhalten konsistent: gültige Datumswerte werden lesbar ausgeschrieben, leere Felder erscheinen sichtbar als `___`-Lücken im fertigen Gutachten.
