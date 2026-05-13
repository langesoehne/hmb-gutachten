# Bauschäden (Freitext)

Diese Sektion (`data-section-key="bauschaeden"`) ist im Formular **admin-only**, d.h. nur der Sachverständige sieht und füllt sie aus. Sie enthält **ein einzelnes Freitextfeld** zur Auflistung der bei der Ortsbesichtigung festgestellten Bauschäden. Der Form-Hint im Formular legt nahe, **je Punkt eine Zeile** zu verwenden, üblicherweise mit `-`-Listenstrichen am Zeilenanfang (Beispiel-Placeholder: „- aufsteigende Feuchtigkeit im Keller / - Bodenbeläge stark abgewohnt"). Der eingegebene Text wird 1:1 — ohne Transformation — in den Abschnitt „5. Feststellungen vor Ort und aus den Planunterlagen" des Word-Gutachtens übernommen und steht dort unter der Zwischenüberschrift „Bauschäden", direkt nach dem Sanierungszustand-Block.

Der Wert wird über `T.str(...)` als reiner Stringwert in den Context geschrieben. Er wird **nicht** durch `T.fallback(...)` gewrappt — bei leerer Eingabe erscheint im Word also **kein Platzhalter** (`___`), sondern eine leere Stelle unter der Überschrift „Bauschäden".

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `bauschaeden` | `{bauschaeden}` | Sektion 5 „Feststellungen vor Ort" — unter der Zwischenüberschrift „Bauschäden", direkt nach dem Sanierungszustand-Block |

## Felder im Detail

### `bauschaeden`

- **Label im Formular**: „Festgestellte Bauschäden (Freitext, je Punkt eine Zeile):"
- **HTML-Input-Typ**: `<textarea>` mit `rows="6"` und `resize: vertical` (Benutzer kann die Höhe anpassen).
- **Datalist/Options**: keine — freie Texteingabe.
- **Placeholder im Input**: `"z.B.\n- aufsteigende Feuchtigkeit im Keller\n- Bodenbeläge stark abgewohnt"` (zeigt das gewünschte Eingabe-Format: Liste mit Spiegelstrichen, eine Zeile pro Punkt).
- **Quelle**: `formular.html:1140-1143` (Sektion `formular.html:1138-1144`).
- **Mapping (Context)**: `lib/docx/context.js:302` — `const bauschaeden = T.str(fields.bauschaeden);`
- **Transformer**: `T.str(value)` ([`lib/transformers.js:11-13`](../../lib/transformers.js)) — Liefert den Wert getrimmt als String oder `''` bei `undefined`/`null`. Keine weitere Umformung; die Spiegelstriche bleiben als gewöhnliche `-`-Zeichen erhalten und werden nicht zu Word-Bullet-Listen umgewandelt.
- **Output-Key im Context-Objekt**: `bauschaeden` (`lib/docx/context.js:464`, Shorthand-Notation `bauschaeden`). **Nicht** durch `T.fallback(...)` gewrappt — leer bleibt leer.
- **Template-Platzhalter**: `{bauschaeden}`
- **Word-Kontext** (Sektion 5 „Feststellungen vor Ort", direkt nach dem Sanierungszustand-Block, vor dem Garagen/Stellplätze-Block):
  > Zustand
  >
  > {sanierungszustand}
  >
  > Bauschäden
  >
  > {bauschaeden}
  >
  > […]
  >
  > Garagen / Stellplätze

  (`_template_extract.md:557-575`)
- **Auswirkung**:
  - **Mit Wert** (z.B. „- aufsteigende Feuchtigkeit an der Nordwand des Kellers / - Risse in der Außenwand-Fassade an der Südseite (oberhalb des Fensterssturzes) / - Bodenbeläge in den Wohnräumen stark abgewohnt"): der Text erscheint im Word direkt unter der Zwischenüberschrift „Bauschäden". Die Spiegelstriche werden als reine Textzeichen ausgegeben — keine automatische Bullet-List-Umwandlung.
  - **Ohne Wert** (z.B. wenn keine wesentlichen Bauschäden festgestellt wurden): die Zeile mit `{bauschaeden}` bleibt **leer**, es erscheint kein `___`-Platzhalter. Die Überschrift „Bauschäden" steht damit ohne Inhalt im Dokument. Bei keinen festgestellten Schäden kann es sinnvoll sein, dies explizit zu vermerken (z.B. „Es wurden keine wesentlichen Bauschäden festgestellt."), um die Aussagekraft des Gutachtens zu sichern.
- **Besonderheiten**:
  - **Einzelfeld-Sektion**: Diese Sektion enthält ausschließlich dieses eine Feld.
  - **Listen-Format als Konvention**: Sowohl das `<label>` als auch der Placeholder weisen auf das Format „je Punkt eine Zeile" mit `-` hin. Das ist eine reine Konvention — der Transformer / Template macht daraus **keine** echte Word-Liste, sondern fügt den Text wörtlich ein.
  - **Abgrenzung zu `sanierungszustand`**: `sanierungszustand` ist die zusammenfassende Bewertung; `bauschaeden` ist die konkrete Aufzählung einzelner Mängel. Beide Felder sind im Template direkt benachbart.
  - **`resize: vertical`**: Anders als die meisten anderen Freitext-Sektionen (`resize: none`) erlaubt dieses Feld dem Sachverständigen, die Eingabehöhe nach Bedarf anzupassen.
