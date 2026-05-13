# Erweiterung / Anbau (Freitext)

Diese Sektion (`data-section-key="erweiterung"`) ist im Formular **admin-only**, d.h. nur der Sachverständige sieht und füllt sie aus. Sie enthält **ein einzelnes Freitextfeld**, in dem ggf. nachträglich am Gebäude vorgenommene Erweiterungen oder Anbauten beschrieben werden (üblich: Funktion und Baujahr des Anbaus, z.B. „Wintergarten an der Südseite, Baujahr 2012" oder „Anbau eines Wirtschaftsraums an der Nordseite, Baujahr 2003"). Der eingegebene Text wird 1:1 — ohne Transformation — in den Abschnitt „3. Sachverhalt" des Word-Gutachtens übernommen und steht dort unter der Zwischenüberschrift „Erweiterung / Anbau:".

Der Wert wird über `T.str(...)` als reiner Stringwert in den Context geschrieben. Er wird **nicht** durch `T.fallback(...)` gewrappt — bei leerer Eingabe erscheint im Word also **kein Platzhalter** (`___`), sondern eine leere Stelle unter der Überschrift „Erweiterung / Anbau:".

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `erweiterung` | `{erweiterung}` | Sektion 3 „Sachverhalt" — unter der Zwischenüberschrift „Erweiterung / Anbau:" |

## Felder im Detail

### `erweiterung`

- **Label im Formular**: kein eigenes `<label>`-Element; die Beschriftung ergibt sich aus der `<h2>Erweiterung / Anbau</h2>`-Überschrift der Sektion plus dem Form-Hint „z.B. Funktion / Baujahr".
- **HTML-Input-Typ**: `<textarea>` mit `rows="6"`, ohne `resize`-Möglichkeit (`resize: none`).
- **Datalist/Options**: keine — freie Texteingabe.
- **Quelle**: `formular.html:1121-1123` (Sektion `formular.html:1116-1124`).
- **Mapping (Context)**: `lib/docx/context.js:299` — `const erweiterung = T.str(fields.erweiterung);`
- **Transformer**: `T.str(value)` ([`lib/transformers.js:11-13`](../../lib/transformers.js)) — Liefert den Wert getrimmt als String oder `''` bei `undefined`/`null`. Keine weitere Umformung. Mehrzeilige Eingaben werden eingefügt, wie das `<textarea>` sie liefert (`\n`-getrennt).
- **Output-Key im Context-Objekt**: `erweiterung` (`lib/docx/context.js:461`, Shorthand-Notation `erweiterung,`). **Nicht** durch `T.fallback(...)` gewrappt — leer bleibt leer.
- **Template-Platzhalter**: `{erweiterung}`
- **Word-Kontext** (Sektion 3 „Sachverhalt", direkt nach dem Modernisierungs-Block):
  > Modernisierungen:
  >
  > {modernisierung_freitext}
  >
  > Erweiterung / Anbau:
  >
  > {erweiterung}
  >
  > Anlass dieses Gutachtens ist die technische und wirtschaftliche Beurteilung des Bestandsgebäudes im Hinblick auf die Ableitung der Restnutzungsdauer, …

  (`_template_extract.md:183-197`)
- **Auswirkung**:
  - **Mit Wert** (z.B. „Im Jahr 2008 wurde an der Westseite ein eingeschossiger Wintergarten angebaut (Funktion: Aufenthaltsraum, Holz-Glas-Konstruktion auf Punktfundamenten)."): der Text erscheint im Word direkt unter der fettgesetzten Zwischenüberschrift „Erweiterung / Anbau:".
  - **Ohne Wert**: die Zeile mit `{erweiterung}` bleibt **leer**, es erscheint kein `___`-Platzhalter. Bei Gebäuden ohne Erweiterung kann das Feld bewusst leer bleiben — die Überschrift bleibt allerdings sichtbar im Dokument stehen. Soll das Kapitel ganz entfallen, muss das Template manuell angepasst werden (eine bedingte Sichtbarkeit ist im Code nicht vorgesehen).
- **Besonderheiten**:
  - **Einzelfeld-Sektion**: Diese Sektion enthält ausschließlich dieses eine Feld.
  - **Form-Hint als Eingabehinweis**: Der Sachverständige wird durch den Hinweis „z.B. Funktion / Baujahr" angeleitet, mindestens die Funktion des Anbaus sowie das Baujahr zu nennen. Diese Konvention ist im Template nicht erzwungen.
  - **Kein Default-Text** und **keine Fallback-Anzeige**: Anders als z.B. die Eingabe-Sektion „Bauteile", in der einige Felder einen Default-Vorschlag haben, ist hier weder ein Platzhalter-Text noch ein `___`-Fallback hinterlegt.
