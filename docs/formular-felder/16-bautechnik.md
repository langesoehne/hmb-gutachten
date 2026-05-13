# Bautechnische Beurteilung (Sektion 6)

Diese Sektion (`data-section-key="bautechnik"`) ist im Formular **admin-only** und sammelt die strukturierte gutachterliche Bewertung der Bausubstanz für Sektion 6 des Gutachtens. Sie umfasst **vier Eingabefelder** (drei Radiogruppen + ein Textarea-Override) und erzeugt daraus **sieben Ausgabe-Platzhalter** im Word-Template — die meisten davon mit bedingten Texten, die je nach Radiowert (bzw. je nach Wert aus der Objekt-Sektion) verschiedene Standardsätze einsetzen.

Charakteristisch für diese Sektion ist die **fast vollständige Vorformulierung** der gutachterlichen Sätze im Code: der Sachverständige wählt nur per Radio aus, welcher der vorbereiteten Sätze ins Gutachten kommt. Das einzige Freitextfeld (`installation_einschaetzung`) ist als **Override** konzipiert — bleibt es leer, wird ein hartcodierter Default-Satz verwendet.

Eine Besonderheit ist `fundamente_einschaetzung_text`: dieser Output wird **nicht** durch ein Feld dieser Sektion gesteuert, sondern hängt vom Wert `kellerung` aus der Sektion „Angaben zum Objekt" ab.

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter / Output | Word-Kontext (Kurzform) |
|---|---|---|
| `decken_einschaetzung` | `{decken_einschaetzung_text}` | Sektion 6 — Absatz nach der Einleitung („Die Decken sind …") |
| `standsicherheit_einschaetzung` | `{standsicherheit_text}` | Sektion 6 — Absatz zur Standsicherheit |
| `tierbefall` | `{tierbefall_text}` | Sektion 6 — Absatz „Tierbefall von Bauteilen" |
| `installation_einschaetzung` | `{installation_text}` | Sektion 6 — Schlussabsatz zu Sanitär-/Elektroinstallation |
| *(keine direkte Eingabe)* | `{bautechnik_einleitung}` | Sektion 6 — erster Satz, generiert aus Geschossigkeit + Dachform + Kellerung |
| *(keine direkte Eingabe)* | `{fundamente_einschaetzung_text}` | Sektion 6 — Absatz „Fundamente …" (hängt von `kellerung` aus Sektion Objekt ab) |
| *(keine direkte Eingabe)* | `{waermeschutz_text}` | Sektion 6 — Absatz zu Dach/Wand/Fenster-Dämmung |

## Abgeleitete / berechnete Werte

### `bautechnik_einleitung`

Generiert aus drei Werten anderer Sektionen ([`lib/docx/context.js:253-257`](../../lib/docx/context.js)):

```js
const bautechnikEinleitung = T.compactJoin([
  geschossigkeitStoeckig,
  dachform ? `${dachform}gebäude` : '',
  istUnterkellert ? 'mit Unterkellerung' : 'ohne Unterkellerung'
], ' ');
```

- `geschossigkeitStoeckig` aus `T.toDisplayGeschossigkeitMehrstoeckig(fields.geschossigkeit)` (z.B. „dreistöckiges")
- `dachform` aus `T.toDisplayDachform(fields.bauart_dachform)` (z.B. „Satteldach") — wird zu „Satteldachgebäude" zusammengezogen
- `istUnterkellert` ist `true`, wenn `fields.kellerung` einer von `unterkellert` / `teilunterkellert` ist ([`lib/docx/context.js:192-193`](../../lib/docx/context.js))

Beispiel-Output: `dreistöckiges Satteldachgebäude mit Unterkellerung`

### `decken_einschaetzung_text`

Je nach Radio-Wert von `decken_einschaetzung` ([`lib/docx/context.js:258-263`](../../lib/docx/context.js)):

```js
const deckenEinschaetzungText = deckenEinschaetzung === 'duenn'
  ? 'Die Decken sind verhältnismäßig dünn ausgebildet. Soweit einschätzbar erfüllen sie nicht die heutigen Brand- und Schallschutzanforderungen. Die Wände sind in üblichen Bauteilstärken ausgeführt.'
  : (deckenEinschaetzung === 'ueblich'
     ? 'Die Decken sind in üblichen Bauteilstärken ausgeführt. Die Wände sind in üblichen Bauteilstärken ausgeführt.'
     : '');
```

### `standsicherheit_text`

Je nach Radio-Wert von `standsicherheit_einschaetzung` ([`lib/docx/context.js:264-269`](../../lib/docx/context.js)):

```js
const standsicherheitText = standsicherheit === 'ausreichend'
  ? 'Das Gebäude erscheint insgesamt ausreichend standsicher.'
  : (standsicherheit === 'eingeschraenkt'
     ? 'Die Standsicherheit des Gebäudes erscheint eingeschränkt.'
     : '');
```

### `fundamente_einschaetzung_text`

Hängt **nicht** von einem Feld dieser Sektion, sondern vom `kellerung`-Wert der Sektion „Angaben zum Objekt" ab ([`lib/docx/context.js:270-272`](../../lib/docx/context.js)):

```js
const fundamenteEinschaetzungText = istUnterkellert
  ? 'Die Fundamente und der Keller sind massiv ausgebildet und, soweit ersichtlich, ausreichend standsicher. Der Keller ist weder gedämmt noch abgedichtet.'
  : 'Die Fundamente sind massiv ausgebildet und, soweit ersichtlich, ausreichend standsicher. Die Bodenplatte ist weder gedämmt noch abgedichtet.';
```

`istUnterkellert` ist `true`, wenn `kellerung` einer von `unterkellert` / `teilunterkellert` ist, sonst (`nicht_unterkellert` o.Ä.) `false` — Variante „Bodenplatte" greift dann.

### `waermeschutz_text`

Generiert durch `buildWaermeschutzText(fields, sharedCtx)` ([`lib/docx/context.js:54-75`](../../lib/docx/context.js)). Der Builder kombiniert drei Inputs aus den Sektionen Bauart und Energetik:

- `fields.bauart_dach` (Dach gedämmt? `ja`/`nein`)
- `fields.bauart_fassade_daemmung` (Fassade gedämmt? `ja`/`nein`)
- `ctx.fensterTyp` + `ctx.fensterIst2fach` (aus `bauart_fenster` und `bauart_fenster_verglasung`)
- `ctx.istUnterkellert` (siehe oben)

Der Builder erzeugt drei Sätze, die mit Leerzeichen verbunden werden:

1. **Erster Satz** — Dach- und Fassaden-Dämmungsstatus (4 Varianten):
   - Beides ungedämmt + unterkellert: „Weder der Keller noch das Dach sind zusätzlich gedämmt."
   - Beides ungedämmt + nicht unterkellert: „Weder das Dach noch die Wände sind zusätzlich gedämmt."
   - Nur Dach gedämmt: „Das Dach ist gedämmt, die Wände sind nicht zusätzlich gedämmt."
   - Nur Fassade gedämmt: „Die Wände sind gedämmt, das Dach ist nicht zusätzlich gedämmt."
   - Beides gedämmt: „Sowohl das Dach als auch die Wände sind gedämmt."

2. **Zweiter Satz** (nur wenn `fensterTyp` vorhanden): „Die {fensterTyp} sind {2-fach verglast | einfach verglast} ohne weitere Anforderungen."

3. **Dritter Satz** (immer): „Gemäß dem Gebäudebaujahr wurden an das Gebäude keine Wärmeschutzanforderungen gestellt. Dementsprechend schlecht stellt sich der Wärmeschutz im Verhältnis zu den aktuellen Wärmeschutzanforderungen dar."

### `tierbefall_text`

Je nach Radio-Wert von `tierbefall` ([`lib/docx/context.js:274-277`](../../lib/docx/context.js)):

```js
const tierbefallText = tierbefall === 'ja'
  ? 'Tierbefall von Bauteilen: Tierbefall wurde festgestellt.'
  : (tierbefall === 'nein' ? 'Tierbefall von Bauteilen: Tierbefall wurde nicht festgestellt.' : '');
```

### `installation_text`

Override-Logik: Wenn `installation_einschaetzung` einen Wert hat, wird dieser verwendet — sonst greift der Default ([`lib/docx/context.js:278-279`](../../lib/docx/context.js)):

```js
const installationText = T.str(fields.installation_einschaetzung) ||
  'Ebenfalls sind die Sanitär- und Elektroinstallationen seit den Modernisierungsmaßnahmen in die Jahre gekommen und entsprechen nicht den heutigen Anforderungen.';
```

## Felder im Detail

### `decken_einschaetzung`

- **Label im Formular**: „Decken-Einschätzung:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen** (Radio-Werte):
  | Wert (`value=`) | Anzeigetext im Formular | Ergebnis in `{decken_einschaetzung_text}` |
  |---|---|---|
  | `duenn` | verhältnismäßig dünn | „Die Decken sind verhältnismäßig dünn ausgebildet. Soweit einschätzbar erfüllen sie nicht die heutigen Brand- und Schallschutzanforderungen. Die Wände sind in üblichen Bauteilstärken ausgeführt." |
  | `ueblich` | üblich ausgebildet | „Die Decken sind in üblichen Bauteilstärken ausgeführt. Die Wände sind in üblichen Bauteilstärken ausgeführt." |
- **Quelle**: [`formular.html:1414-1415`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:258-263`](../../lib/docx/context.js):
  ```js
  const deckenEinschaetzung = T.str(fields.decken_einschaetzung).toLowerCase();
  const deckenEinschaetzungText = deckenEinschaetzung === 'duenn' ? '...' : (deckenEinschaetzung === 'ueblich' ? '...' : '');
  ```
- **Transformer / Builder**: keiner — direkte Branch-Logik im Context.
- **Output-Key**: `decken_einschaetzung_text` ([`lib/docx/context.js:436`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{decken_einschaetzung_text}`
- **Word-Kontext** (Sektion 6, `_template_extract.md:591`):
  > {decken_einschaetzung_text}
- **Auswirkung**: Bei `duenn` erscheint die kritischere Variante mit Hinweis auf nicht erfüllten Brand-/Schallschutz; bei `ueblich` die unauffällige Variante. Bei leerem Radio fällt der gesamte Absatz weg (`T.fallback` schlägt zu — siehe „Besonderheiten").
- **Besonderheiten**: Der Output ist in `T.fallback(...)` gewickelt ([`lib/docx/context.js:436`](../../lib/docx/context.js)) — bei leerem Radiowert wird der Platzhalter im Word durch `___` ersetzt. Die Radio-Werte werden case-insensitive verglichen (`toLowerCase()`).

### `standsicherheit_einschaetzung`

- **Label im Formular**: „Standsicherheit:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen** (Radio-Werte):
  | Wert (`value=`) | Anzeigetext im Formular | Ergebnis in `{standsicherheit_text}` |
  |---|---|---|
  | `ausreichend` | ausreichend standsicher | „Das Gebäude erscheint insgesamt ausreichend standsicher." |
  | `eingeschraenkt` | eingeschränkt | „Die Standsicherheit des Gebäudes erscheint eingeschränkt." |
- **Quelle**: [`formular.html:1421-1422`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:264-269`](../../lib/docx/context.js):
  ```js
  const standsicherheit = T.str(fields.standsicherheit_einschaetzung).toLowerCase();
  const standsicherheitText = standsicherheit === 'ausreichend' ? '...' : (standsicherheit === 'eingeschraenkt' ? '...' : '');
  ```
- **Transformer / Builder**: keiner.
- **Output-Key**: `standsicherheit_text` ([`lib/docx/context.js:437`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{standsicherheit_text}`
- **Word-Kontext** (Sektion 6, `_template_extract.md:595`):
  > {standsicherheit_text}
- **Auswirkung**: Eigenständiger Absatz nach `{decken_einschaetzung_text}` — ein einzelner Satz, der den Standsicherheits-Gesamteindruck dokumentiert. Bei leerem Radio: `___` (durch `T.fallback`).
- **Besonderheiten**: Der Output ist in `T.fallback(...)` gewickelt. Die Werte sind nicht mit Umlauten (`eingeschraenkt` statt `eingeschränkt`), um Encoding-Konflikte mit dem HTML-`value`-Attribut zu vermeiden.

### `tierbefall`

- **Label im Formular**: „Tierbefall:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen** (Radio-Werte):
  | Wert (`value=`) | Anzeigetext im Formular | Ergebnis in `{tierbefall_text}` |
  |---|---|---|
  | `nein` | nicht festgestellt | „Tierbefall von Bauteilen: Tierbefall wurde nicht festgestellt." |
  | `ja` | festgestellt | „Tierbefall von Bauteilen: Tierbefall wurde festgestellt." |
- **Quelle**: [`formular.html:1430-1431`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:274-277`](../../lib/docx/context.js):
  ```js
  const tierbefall = T.str(fields.tierbefall).toLowerCase();
  const tierbefallText = tierbefall === 'ja' ? '...' : (tierbefall === 'nein' ? '...' : '');
  ```
- **Transformer / Builder**: keiner.
- **Output-Key**: `tierbefall_text` ([`lib/docx/context.js:440`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{tierbefall_text}`
- **Word-Kontext** (Sektion 6, `_template_extract.md:609`):
  > {tierbefall_text}
- **Auswirkung**: Ein einzeiliger Absatz, der explizit das Wort „Tierbefall" voranstellt (statt nur einer Aussage), damit der Absatz im Gutachten auch ohne Kontext sofort lesbar ist. Bei leerem Radio: `___`.
- **Besonderheiten**: Output ist in `T.fallback(...)` gewickelt. Bemerkenswert: in beiden Varianten wird das Präfix „Tierbefall von Bauteilen: " hartcodiert — der Sachverständige kann die Formulierung nicht abweichen.

### `installation_einschaetzung` (Override mit Default)

- **Label im Formular**: „Installation-Einschätzung (Override; Default wird automatisch generiert):"
- **HTML-Input-Typ**: `<textarea rows="3">`
- **Placeholder**: „Standard: 'Ebenfalls sind die Sanitär- und Elektroinstallationen seit den Modernisierungsmaßnahmen …'"
- **Quelle**: [`formular.html:1436-1437`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:278-279`](../../lib/docx/context.js):
  ```js
  const installationText = T.str(fields.installation_einschaetzung) ||
    'Ebenfalls sind die Sanitär- und Elektroinstallationen seit den Modernisierungsmaßnahmen in die Jahre gekommen und entsprechen nicht den heutigen Anforderungen.';
  ```
- **Transformer / Builder**: keiner — JS `||`-Default-Pattern.
- **Output-Key**: `installation_text` ([`lib/docx/context.js:441`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{installation_text}`
- **Word-Kontext** (Sektion 6, `_template_extract.md:615`):
  > {installation_text}
- **Auswirkung**:
  - Bei **leerem Feld** wird automatisch der hartcodierte Default-Satz eingefügt: „Ebenfalls sind die Sanitär- und Elektroinstallationen seit den Modernisierungsmaßnahmen in die Jahre gekommen und entsprechen nicht den heutigen Anforderungen."
  - Bei **gefülltem Feld** wird die Eingabe **wörtlich** verwendet, unabhängig vom Default. Der Sachverständige verantwortet die Satzqualität selbst.
- **Besonderheiten**:
  - Der Default-Satz wird **immer** ins Word geschrieben, wenn das Feld leer ist — anders als z.B. die Radios oben, wo bei leerer Eingabe der Absatz ganz wegfällt. Hier gibt es keinen „leeren" Fallzustand.
  - Der Output ist trotzdem in `T.fallback(...)` gewickelt, was aber praktisch nie greift, weil der Default-String niemals leer ist.
  - Mehrzeilige Eingaben werden durch `linebreaks: true` ([`lib/docx/render.js:118`](../../lib/docx/render.js)) als echte Zeilenumbrüche gerendert.

## Vollständiger Word-Kontext (Sektion 6)

Die gesamte Sektion 6 im Template (`_template_extract.md:583-615`) sieht so aus:

```
# 6.Bautechnische Beurteilung

Das {gebaeude_typ} wurde {baujahr} als {bautechnik_einleitung} in baujahrestypischer {bauweise} gebaut.

{decken_einschaetzung_text}

{standsicherheit_text}

{fundamente_einschaetzung_text}

{waermeschutz_text}


{tierbefall_text}


{installation_text}
```

Jeder der sieben Platzhalter belegt einen eigenen Absatz. Die Reihenfolge ist fest und folgt der Logik „erst Gesamtcharakteristik (Einleitung) → Bauteilstärken (Decken/Wände) → Standsicherheit → Fundamente/Keller → Wärmeschutz → Tierbefall → Installation".

## Querverweise auf Eingaben außerhalb dieser Sektion

`bautechnik_einleitung`, `fundamente_einschaetzung_text` und `waermeschutz_text` lesen Felder aus anderen Sektionen:

- **Sektion „Angaben zum Objekt"**: `kellerung` (steuert `istUnterkellert` → wirkt auf `bautechnik_einleitung` und auf `fundamente_einschaetzung_text`)
- **Sektion „Geschossigkeit / Form / Dach"**: `geschossigkeit` (→ `geschossigkeitStoeckig`), `bauart_dachform` (→ `dachform`)
- **Sektion „Bauart"**: `bauart_dach` (Dach gedämmt? — `waermeschutz_text`), `bauart_fassade_daemmung` (Fassade gedämmt? — `waermeschutz_text`), `bauart_fenster` (→ `fensterTyp`), `bauart_fenster_verglasung` (→ `fensterIst2fach`)

Ist eines dieser Felder leer, bleiben einzelne Teile der drei generierten Texte still aus — der Sachverständige sollte daher die Bauart-Sektion vor Sektion 6 abschließen.
