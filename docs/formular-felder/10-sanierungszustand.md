# Sanierungszustand (Freitext)

Diese Sektion (`data-section-key="sanierungszustand"`) ist im Formular **admin-only**, d.h. nur der Sachverständige sieht und füllt sie aus. Sie enthält **ein einzelnes Freitextfeld** zur gutachterlichen Bewertung des sichtbaren Sanierungszustandes (z.B. Beschädigungen, undichte Fenster, Auffälligkeiten an der Haustechnik, Feuchtigkeitsschäden, Risse). Der eingegebene Text wird 1:1 — ohne Transformation — in den Abschnitt „5. Feststellungen vor Ort und aus den Planunterlagen" des Word-Gutachtens übernommen und steht dort unter der Zwischenüberschrift „Zustand".

Der Wert wird über `T.str(...)` als reiner Stringwert in den Context geschrieben. Er wird **nicht** durch `T.fallback(...)` gewrappt — bei leerer Eingabe erscheint im Word also **kein Platzhalter** (`___`), sondern eine leere Stelle unter der Überschrift „Zustand".

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `sanierungszustand` | `{sanierungszustand}` | Sektion 5 „Feststellungen vor Ort" — unter der Zwischenüberschrift „Zustand", direkt vor dem Bauschäden-Block |

## Felder im Detail

### `sanierungszustand`

- **Label im Formular**: kein eigenes `<label>`-Element; die Beschriftung ergibt sich aus der `<h2>Sanierungszustand</h2>`-Überschrift der Sektion plus dem Form-Hint „z.B. Beschädigungen / undichte Fenster / Haustechnik / Feuchtigkeitsschäden / Risse".
- **HTML-Input-Typ**: `<textarea>` mit `rows="8"`, ohne `resize`-Möglichkeit (`resize: none`).
- **Datalist/Options**: keine — freie Texteingabe.
- **Quelle**: `formular.html:1132-1134` (Sektion `formular.html:1127-1135`).
- **Mapping (Context)**: `lib/docx/context.js:300` — `const sanierungszustand = T.str(fields.sanierungszustand);`
- **Transformer**: `T.str(value)` ([`lib/transformers.js:11-13`](../../lib/transformers.js)) — Liefert den Wert getrimmt als String oder `''` bei `undefined`/`null`. Keine weitere Umformung; auch Listen / Bullet-Points werden so eingefügt, wie sie das `<textarea>` zurückgibt.
- **Output-Key im Context-Objekt**: `sanierungszustand` (`lib/docx/context.js:462`, Shorthand-Notation `sanierungszustand,`). **Nicht** durch `T.fallback(...)` gewrappt — leer bleibt leer.
- **Template-Platzhalter**: `{sanierungszustand}`
- **Word-Kontext** (Sektion 5 „Feststellungen vor Ort", nach den Haustechnik-Detailtexten und unmittelbar vor dem Bauschäden-Block):
  > Zustand
  >
  > {sanierungszustand}
  >
  > Bauschäden
  >
  > {bauschaeden}

  (`_template_extract.md:557-565`)
- **Auswirkung**:
  - **Mit Wert** (z.B. „Im Keller wurde eine deutliche aufsteigende Feuchte an der Nordwand festgestellt. Die Fenster an der Westseite zeigen Undichtigkeiten an den Anschlagdichtungen. Im Bad des Obergeschosses sind Risse in den Fugen sichtbar."): der Text erscheint im Word direkt unter der Zwischenüberschrift „Zustand" und vor dem Bauschäden-Block.
  - **Ohne Wert**: die Zeile mit `{sanierungszustand}` bleibt **leer**, es erscheint kein `___`-Platzhalter. Die Überschrift „Zustand" steht damit ohne Inhalt im Dokument. Für eine sinnvolle Gutachten-Aussage sollte das Feld bei vorhandenen Mängeln zwingend gefüllt werden.
- **Besonderheiten**:
  - **Einzelfeld-Sektion**: Diese Sektion enthält ausschließlich dieses eine Feld.
  - **Zwei-Spurigkeit mit Bauschäden**: Im Template stehen `{sanierungszustand}` und `{bauschaeden}` direkt untereinander und sind daher inhaltlich abzugrenzen — „Sanierungszustand" als zusammenfassende Bewertung der bisher durchgeführten / unterlassenen Sanierungen vs. „Bauschäden" als konkrete Liste festgestellter Schäden.
  - **Mehrzeilige Eingaben**: Das `<textarea>` (`rows="8"`) erlaubt umfangreiche Beschreibungen. Zeilenumbrüche werden je nach Docxtemplater-Setup als Absätze / Soft-Breaks in Word übernommen.
