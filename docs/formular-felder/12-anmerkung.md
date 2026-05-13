# Anmerkung (Freitext)

Diese Sektion (`data-section-key="anmerkung"`) ist im Formular **admin-only**, d.h. nur der Sachverständige sieht und füllt sie aus. Sie enthält **ein einzelnes Freitextfeld** für eine **gutachterliche Schlussanmerkung** des Sachverständigen, die am Ende des Gutachtens — kurz vor dem Haftungs-Schlussabsatz und der Unterschriftszeile — erscheint. Typischerweise nutzt der Sachverständige dieses Feld für Hinweise auf Annahmen, Einschränkungen der Begutachtung, Hinweise auf besondere Bewertungs-Aspekte oder ergänzende Anmerkungen zur Restnutzungsdauer.

Wichtig zur Bezeichnung: Im Formular trägt das Feld den `name="anmerkung"` (Singular). Im Word-Template erscheint die Zwischenüberschrift im Plural als „Anmerkung:" — der Inhalt des Platzhalters folgt unmittelbar darunter.

Der Wert wird über `T.str(...)` als reiner Stringwert in den Context geschrieben. Er wird **nicht** durch `T.fallback(...)` gewrappt — bei leerer Eingabe erscheint im Word also **kein Platzhalter** (`___`), sondern eine leere Stelle unter der Überschrift „Anmerkung:".

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `anmerkung` | `{anmerkung}` | Sektion 7 „Restnutzungsdauer" — Schlussbereich, unter der Zwischenüberschrift „Anmerkung:", direkt vor dem Haftungsabsatz und der Unterschriftszeile |

## Felder im Detail

### `anmerkung`

- **Label im Formular**: kein eigenes `<label>`-Element; die Beschriftung ergibt sich allein aus der `<h2>Anmerkung</h2>`-Überschrift der Sektion (im Formular gibt es keinen ergänzenden Form-Hint).
- **HTML-Input-Typ**: `<textarea>` mit `rows="8"`, ohne `resize`-Möglichkeit (`resize: none`).
- **Datalist/Options**: keine — freie Texteingabe.
- **Quelle**: `formular.html:1149-1151` (Sektion `formular.html:1147-1152`).
- **Mapping (Context)**: `lib/docx/context.js:301` — `const anmerkung = T.str(fields.anmerkung);`
- **Transformer**: `T.str(value)` ([`lib/transformers.js:11-13`](../../lib/transformers.js)) — Liefert den Wert getrimmt als String oder `''` bei `undefined`/`null`. Keine weitere Umformung. Mehrzeilige Eingaben werden so eingefügt, wie sie das `<textarea>` zurückgibt (`\n`-getrennt).
- **Output-Key im Context-Objekt**: `anmerkung` (`lib/docx/context.js:463`, Shorthand-Notation `anmerkung,`). **Nicht** durch `T.fallback(...)` gewrappt — leer bleibt leer.
- **Template-Platzhalter**: `{anmerkung}`
- **Word-Kontext** (Sektion 7 „Restnutzungsdauer", ganz am Ende, unmittelbar nach dem RND-Ergebnisblock und vor dem Haftungs-Schlussabsatz):
  > Restnutzungsdauer
  >
  > {rnd_jahre} Jahre
  >
  > […]
  >
  > Anmerkung:
  >
  > {anmerkung}
  >
  > Zur Vermeidung der Gefahr von Vermögensschäden müssen Dritte in Bezug auf ihre Interessenslage die bautechnische Stellungnahme auf Vollständigkeit und Richtigkeit überprüfen, bevor sie über ihr Vermögen disponieren. […]
  >
  > Der Sachverständige München, den {unterschriftsdatum}

  (`_template_extract.md:749-769`)
- **Auswirkung**:
  - **Mit Wert** (z.B. „Die hier ermittelte Restnutzungsdauer berücksichtigt einen energetischen Sanierungsbedarf an Fassade und Heizungsanlage. Sollten diese Maßnahmen innerhalb der nächsten 5 Jahre durchgeführt werden, ist eine Neubewertung der Restnutzungsdauer angeraten."): der Text erscheint im Word direkt unter der Zwischenüberschrift „Anmerkung:" und vor dem allgemeinen Haftungs-Schlussabsatz.
  - **Ohne Wert**: die Zeile mit `{anmerkung}` bleibt **leer**, es erscheint kein `___`-Platzhalter. Die Überschrift „Anmerkung:" steht ohne Inhalt im Dokument, was optisch dazu führen kann, dass der Haftungsabsatz unmittelbar darauf folgt. Soll die Überschrift bei leerer Anmerkung wegfallen, müsste das Template manuell oder über eine bedingte Section-Logik im Code angepasst werden — dies ist derzeit nicht vorgesehen.
- **Besonderheiten**:
  - **Einzelfeld-Sektion**: Diese Sektion enthält ausschließlich dieses eine Feld.
  - **Singular/Plural-Differenz**: Im Formular heißt die Sektion „Anmerkung" (Singular), im Template steht die Überschrift „Anmerkung:" (ebenfalls Singular). Die zuvor in Sektion 5 vorkommende ähnliche Zwischenüberschrift „Anmerkungen:" (Plural, `_template_extract.md:311`) ist ein **fester Template-Text** — sie wird **nicht** durch dieses Feld befüllt, sondern leitet einen statischen Haftungs-/Methodik-Block in Sektion 5 ein.
  - **Position**: Dieses Feld erscheint im Word an **einer** Stelle, nämlich ganz am Ende des Gutachtens vor dem Haftungs-Schlussabsatz und der Unterschriftszeile.
