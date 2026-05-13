# Funktion-Zusatztexte

Diese Sektion (`data-section-key="funktion"`) ist im Formular **admin-only**, d.h. nur der Sachverständige sieht und füllt sie aus. Sie enthält **zwei optionale Textareas**, deren Inhalt als gutachterlicher Zusatz direkt hinter zwei festen Sätzen im Block „Funktion" (Sektion 5 — Feststellungen vor Ort) eingefügt wird.

Die beiden Felder werden ohne Transformation durch `T.str()` getrimmt und 1:1 als Platzhalter ins Template gereicht. Es gibt keine Bedingungen, keine Defaults und keine Fallback-Ersetzungen über `T.fallback` — leere Eingaben führen zu leerem String im Word-Dokument (da `nullGetter: () => ''` in [`lib/docx/render.js:119`](../../lib/docx/render.js) gesetzt ist, bleibt der Platzhalter bei leerem Wert schlicht unsichtbar).

Inhaltlich handelt es sich um **freie Ergänzungen zu den fest formulierten Standardsätzen** im Funktion-Block: der erste Zusatz folgt unmittelbar nach dem Satz zur Geschossanzahl, der zweite folgt unmittelbar nach dem Satz zur Anzahl der Wohneinheiten. Typische Inhalte sind Hinweise zum Spitzboden (Ausbaufähigkeit, Zugang) bzw. zur Verteilung der Wohneinheiten auf einzelne Etagen oder zur Kellernutzung.

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter / Output | Word-Kontext (Kurzform) |
|---|---|---|
| `funktion_zusatz_geschosse` | `{funktion_zusatz_geschosse}` | Sektion 5 „Funktion" — Zusatzsatz nach „… Vollgeschosse." |
| `funktion_zusatz_einheiten` | `{funktion_zusatz_einheiten}` | Sektion 5 „Funktion" — Zusatzsatz nach „… Wohneinheiten." |

## Abgeleitete / berechnete Werte

Es gibt für diese Sektion **keine** abgeleiteten oder berechneten Werte — die beiden Textareas werden ohne Transformation, ohne Verkettung mit anderen Feldern und ohne Fallback ins Word-Dokument übernommen.

Im Context-Mapping ([`lib/docx/context.js:227-228`](../../lib/docx/context.js)) reduziert sich der gesamte Code auf:

```js
const funktionZusatzGeschosse = T.str(fields.funktion_zusatz_geschosse);
const funktionZusatzEinheiten = T.str(fields.funktion_zusatz_einheiten);
```

und in der Rückgabe ([`lib/docx/context.js:403-404`](../../lib/docx/context.js)):

```js
funktion_zusatz_geschosse: funktionZusatzGeschosse,
funktion_zusatz_einheiten: funktionZusatzEinheiten,
```

Beide Outputs sind **nicht** in `T.fallback(...)` gewickelt — bei leerer Eingabe wird der Platzhalter im Word durch einen leeren String ersetzt (kein `___`-Platzhalter wie bei anderen Feldern).

## Felder im Detail

### `funktion_zusatz_geschosse`

- **Label im Formular**: „Zusatz nach „Vollgeschosse" (z.B. zu Spitzboden / Zugang):"
- **HTML-Input-Typ**: `<textarea rows="3">`
- **Placeholder**: „z.B. Der Spitzboden ist nicht ausbaufähig und ungedämmt. Der Zugang erfolgt über…"
- **Quelle**: [`formular.html:1397-1399`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:227`](../../lib/docx/context.js):
  ```js
  const funktionZusatzGeschosse = T.str(fields.funktion_zusatz_geschosse);
  ```
- **Transformer / Builder**: keiner — nur `T.str()` ([`lib/transformers.js:11-13`](../../lib/transformers.js)) zum Trimmen.
- **Output-Key**: `funktion_zusatz_geschosse` ([`lib/docx/context.js:403`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{funktion_zusatz_geschosse}`
- **Word-Kontext** (Sektion 5 „Funktion", `_template_extract.md:373`):
  > Das Gebäude stammt aus dem Jahr {baujahr} und verfügt über {vollgeschosse} Vollgeschosse. {funktion_zusatz_geschosse}
- **Auswirkung**: Der eingegebene Text wird **direkt am Satzende** angehängt, mit einem führenden Leerzeichen, das bereits im Template hardcodiert ist. Beispiel mit Eingabe „Der Spitzboden ist nicht ausbaufähig und ungedämmt." → „Das Gebäude stammt aus dem Jahr 1965 und verfügt über 3 Vollgeschosse. Der Spitzboden ist nicht ausbaufähig und ungedämmt." Bei leerer Eingabe bleibt der Standardsatz ohne Zusatz stehen (kein sichtbarer Fallback, kein `___`).
- **Besonderheiten**: Mehrzeilige Eingaben werden dank `linebreaks: true` im Docxtemplater-Setup ([`lib/docx/render.js:118, 171`](../../lib/docx/render.js)) als echte Zeilenumbrüche im DOCX gerendert. Der Sachverständige verantwortet die Satzbau-Hygiene selbst (Großschreibung am Zusatzanfang, Punkt am Ende).

### `funktion_zusatz_einheiten`

- **Label im Formular**: „Zusatz nach „Wohneinheiten" (Verteilung auf Etagen, Kellernutzung):"
- **HTML-Input-Typ**: `<textarea rows="3">`
- **Placeholder**: „z.B. In den Etagen EG bis 2.OG befinden sich jeweils 1 Wohneinheit. Die Kellerräume werden als…"
- **Quelle**: [`formular.html:1401-1403`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:228`](../../lib/docx/context.js):
  ```js
  const funktionZusatzEinheiten = T.str(fields.funktion_zusatz_einheiten);
  ```
- **Transformer / Builder**: keiner — nur `T.str()`.
- **Output-Key**: `funktion_zusatz_einheiten` ([`lib/docx/context.js:404`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{funktion_zusatz_einheiten}`
- **Word-Kontext** (Sektion 5 „Funktion", `_template_extract.md:377`):
  > Das {gebaeude_typ} umfasst insgesamt {wohneinheiten} Wohneinheiten. {funktion_zusatz_einheiten}
- **Auswirkung**: Der eingegebene Text wird direkt am Satzende des Wohneinheiten-Satzes angehängt, mit einem führenden Leerzeichen aus dem Template. Beispiel mit Eingabe „In den Etagen EG bis 2.OG befinden sich jeweils 1 Wohneinheit." → „Das Wohngebäude umfasst insgesamt 3 Wohneinheiten. In den Etagen EG bis 2.OG befinden sich jeweils 1 Wohneinheit." Bei leerer Eingabe bleibt der Standardsatz unverändert.
- **Besonderheiten**: Wie bei `funktion_zusatz_geschosse` werden Zeilenumbrüche aus der Textarea (`\n`) im DOCX als echte Zeilenumbrüche dargestellt. Der Sachverständige bestimmt selbst, ob der Zusatz ein eigener Satz, ein eigener Absatz oder eine mehrteilige Aufzählung ist.

## Reihenfolge im Word-Dokument

Beide Zusätze stehen in Sektion 5 „Feststellungen vor Ort und aus den Planunterlagen", Unterabschnitt **„Funktion"** (`_template_extract.md:369-377`). Die Reihenfolge ist fest:

1. Standardsatz mit `{baujahr}` und `{vollgeschosse}` Vollgeschosse → `{funktion_zusatz_geschosse}`
2. Standardsatz mit `{gebaeude_typ}` und `{wohneinheiten}` Wohneinheiten → `{funktion_zusatz_einheiten}`

Beide Zusätze sind also **vor** dem Block „Rohbau" platziert (der mit „Fundamente / Bodenplatte: …" beginnt — `_template_extract.md:381-385`) und **nach** dem Block „Außenanlagen" (`_template_extract.md:331-361`).
