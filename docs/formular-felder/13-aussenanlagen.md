# Außenanlagen (Freitexte)

Diese Sektion (`data-section-key="aussenanlagen"`) ist im Formular **admin-only**, d.h. nur der Sachverständige sieht und füllt sie aus. Sie enthält **drei** getrennte Freitextfelder, die jeweils einen Aspekt der Außenanlagen beschreiben: **Eingang**, **Garten / Hof** und **Zustand**. Alle drei Texte werden 1:1 — ohne Transformation — in den Abschnitt „5. Feststellungen vor Ort und aus den Planunterlagen" des Word-Gutachtens übernommen, jeweils unter einer eigenen Zwischenüberschrift im Unterkapitel „Außenanlagen".

Alle drei Werte werden über `T.str(...)` als reine Stringwerte in den Context geschrieben. Sie werden **nicht** durch `T.fallback(...)` gewrappt — bei leerer Eingabe erscheint im Word also **kein Platzhalter** (`___`), sondern eine leere Stelle unter der jeweiligen Zwischenüberschrift.

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `aussenanlagen_eingang` | `{aussenanlagen_eingang}` | Sektion 5 „Feststellungen vor Ort" — Unterkapitel „Außenanlagen", unter „Eingang" |
| `aussenanlagen_garten` | `{aussenanlagen_garten}` | Sektion 5 „Feststellungen vor Ort" — Unterkapitel „Außenanlagen", unter „Garten / Hof" |
| `aussenanlagen_zustand` | `{aussenanlagen_zustand}` | Sektion 5 „Feststellungen vor Ort" — Unterkapitel „Außenanlagen", unter „Zustand" |

## Felder im Detail

### `aussenanlagen_eingang`

- **Label im Formular**: „Eingang:"
- **HTML-Input-Typ**: `<textarea>` mit `rows="4"` (kein `resize`-Style explizit gesetzt — Browser-Default).
- **Datalist/Options**: keine — freie Texteingabe.
- **Placeholder im Input**: `"z.B. Der Zugang zum Gebäude erfolgt von der ... über einen befestigten Gehweg ..."`.
- **Quelle**: `formular.html:1158-1161` (Sektion `formular.html:1155-1170`).
- **Mapping (Context)**: `lib/docx/context.js:224` — `const aussenanlagenEingang = T.str(fields.aussenanlagen_eingang);`
- **Transformer**: `T.str(value)` ([`lib/transformers.js:11-13`](../../lib/transformers.js)) — Liefert den Wert getrimmt als String oder `''` bei `undefined`/`null`. Keine weitere Umformung.
- **Output-Key im Context-Objekt**: `aussenanlagen_eingang` (`lib/docx/context.js:398`). **Nicht** durch `T.fallback(...)` gewrappt — leer bleibt leer.
- **Template-Platzhalter**: `{aussenanlagen_eingang}`
- **Word-Kontext** (Sektion 5, Unterkapitel „Außenanlagen", erster Block):
  > Außenanlagen
  >
  > Eingang
  >
  > {aussenanlagen_eingang}

  (`_template_extract.md:331-341`)
- **Auswirkung**:
  - **Mit Wert** (z.B. „Der Zugang zum Gebäude erfolgt von der Hauptstraße über einen mit Betonpflaster befestigten Gehweg, der zur an der Ostseite gelegenen Eingangstür führt."): der Text erscheint im Word direkt unter der Zwischenüberschrift „Eingang".
  - **Ohne Wert**: die Zeile mit `{aussenanlagen_eingang}` bleibt **leer**, kein `___`-Platzhalter. Die Überschrift „Eingang" steht ohne Inhalt im Dokument.

### `aussenanlagen_garten`

- **Label im Formular**: „Garten / Hof:"
- **HTML-Input-Typ**: `<textarea>` mit `rows="4"` (kein `resize`-Style explizit gesetzt).
- **Datalist/Options**: keine — freie Texteingabe.
- **Placeholder im Input**: `"z.B. An der Westseite befinden sich Grünflächen ..."`.
- **Quelle**: `formular.html:1162-1165` (Sektion `formular.html:1155-1170`).
- **Mapping (Context)**: `lib/docx/context.js:225` — `const aussenanlagenGarten = T.str(fields.aussenanlagen_garten);`
- **Transformer**: `T.str(value)` ([`lib/transformers.js:11-13`](../../lib/transformers.js)) — wie oben.
- **Output-Key im Context-Objekt**: `aussenanlagen_garten` (`lib/docx/context.js:399`). **Nicht** durch `T.fallback(...)` gewrappt — leer bleibt leer.
- **Template-Platzhalter**: `{aussenanlagen_garten}`
- **Word-Kontext** (Sektion 5, Unterkapitel „Außenanlagen", zweiter Block):
  > Eingang
  >
  > {aussenanlagen_eingang}
  >
  > Garten / Hof
  >
  > {aussenanlagen_garten}

  (`_template_extract.md:337-351`)
- **Auswirkung**:
  - **Mit Wert** (z.B. „An der Westseite befinden sich Grünflächen mit Rasen, einer Hecke entlang der Grundstücksgrenze sowie zwei älteren Obstbäumen. Die rückwärtige Terrasse ist mit Betonplatten belegt."): der Text erscheint im Word direkt unter der Zwischenüberschrift „Garten / Hof".
  - **Ohne Wert**: die Zeile mit `{aussenanlagen_garten}` bleibt **leer**. Die Überschrift bleibt ohne Inhalt im Dokument.

### `aussenanlagen_zustand`

- **Label im Formular**: „Zustand:"
- **HTML-Input-Typ**: `<textarea>` mit `rows="4"` (kein `resize`-Style explizit gesetzt).
- **Datalist/Options**: keine — freie Texteingabe.
- **Placeholder im Input**: `"z.B. Die Außenanlage ist durch ... abgegrenzt ..."`.
- **Quelle**: `formular.html:1166-1169` (Sektion `formular.html:1155-1170`).
- **Mapping (Context)**: `lib/docx/context.js:226` — `const aussenanlagenZustand = T.str(fields.aussenanlagen_zustand);`
- **Transformer**: `T.str(value)` ([`lib/transformers.js:11-13`](../../lib/transformers.js)) — wie oben.
- **Output-Key im Context-Objekt**: `aussenanlagen_zustand` (`lib/docx/context.js:400`). **Nicht** durch `T.fallback(...)` gewrappt — leer bleibt leer.
- **Template-Platzhalter**: `{aussenanlagen_zustand}`
- **Word-Kontext** (Sektion 5, Unterkapitel „Außenanlagen", dritter Block — direkt vor dem dynamischen Gebäude-Typ-Block):
  > Garten / Hof
  >
  > {aussenanlagen_garten}
  >
  > Zustand
  >
  > {aussenanlagen_zustand}
  >
  > {gebaeude_typ}

  (`_template_extract.md:347-365`)
- **Auswirkung**:
  - **Mit Wert** (z.B. „Die Außenanlage ist durch einen Maschendrahtzaun zum nördlichen Nachbargrundstück abgegrenzt; der Zaun ist teilweise von Rost befallen. Die Pflasterung am Eingangsbereich zeigt vereinzelte Lockerungen."): der Text erscheint im Word direkt unter der Zwischenüberschrift „Zustand" (innerhalb des Außenanlagen-Unterkapitels).
  - **Ohne Wert**: die Zeile mit `{aussenanlagen_zustand}` bleibt **leer**. Die Überschrift „Zustand" steht ohne Inhalt im Dokument.

## Besonderheiten

- **Drei eigenständige Felder**: Anders als bei den anderen Freitext-Sektionen (`modernisierungen`, `erweiterung`, `sanierungszustand`, `bauschaeden`, `anmerkung`) gibt es hier **drei** thematisch separate Eingabefelder, die jeweils einen eigenen Template-Platzhalter und eine eigene Zwischenüberschrift haben.
- **Position im Template direkt benachbart**: Alle drei Platzhalter liegen im Template direkt untereinander unter der Überschrift „Außenanlagen" (`_template_extract.md:331-361`).
- **Namensraum-Kollision „Zustand"**: Sowohl die Außenanlagen-Sektion als auch die darauffolgende Sanierungszustand-Sektion enthalten eine Zwischenüberschrift „Zustand" im Template. Die beiden Stellen werden jedoch **getrennt** befüllt: `aussenanlagen_zustand` betrifft den Zustand der Außenanlagen (Pflasterung, Zaun, Bewuchs etc.), `sanierungszustand` betrifft den baulichen Sanierungszustand des Gebäudes selbst.
- **Kein `T.fallback`**: Bei keiner der drei Felder wird der Wert mit `T.fallback(...)` gewrappt. Bei leerer Eingabe bleibt die Zeile entsprechend leer (kein `___`-Platzhalter im Word-Dokument).
- **Form-Hint der Sektion**: „Beschreibungen der Außenanlagen — werden 1:1 ins Word-Gutachten übernommen." Das spiegelt die hier dokumentierte Transformation (keine Umformung) sauber wider.
