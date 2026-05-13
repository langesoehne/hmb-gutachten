# Restnutzungsdauer (Sektion 7)

Diese Sektion (`data-section-key="rnd"`) ist im Formular **admin-only** und sammelt alle Werte, die für die Berechnung und Darstellung der Restnutzungsdauer (RND) gemäß Anlage 4 der Sachwertrichtlinie (SW-RL) nötig sind. Sie umfasst **12 Eingabefelder**: drei Jahreszahlen (fiktives Alter, RND, Gesamtnutzungsdauer), ein Freitext zu den Modernisierungsjahren, eine Textarea für die Liste der Modernisierungsmaßnahmen und **sieben Punkte-Felder** für die SW-RL-Anlage-4-Bewertung.

Die sieben Punkte-Felder werden zur **Punkte-Summe** addiert (`{rnd_punkte_summe}`) und über die Schwellwert-Funktion `T.toDisplayRndKategorie` auf eine textuelle **Modernisierungs-Kategorie** abgebildet (`{rnd_kategorie_text}`) — z.B. „mittlere Modernisierung" für Summe 5–9. Beide Werte werden im Template direkt für die Berechnungserläuterung im Schluss-Absatz von Sektion 7 verwendet.

Die Eingabe `modernisierungs_massnahmen` ist eine mehrzeilige Textarea und wird im Word über `linebreaks: true` ([`lib/docx/render.js:118`](../../lib/docx/render.js)) als echte Zeilenumbruch-Liste gerendert — **nicht** als formatierte Tabelle, sondern als Fließtext-Absatz mit Zeilenumbrüchen. (Das Form-Label „Tabelle, je Zeile eine Maßnahme" bezieht sich auf die optische Wirkung im Word, nicht auf eine echte Word-Tabelle.)

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter / Output | Word-Kontext (Kurzform) |
|---|---|---|
| `rnd_fiktives_alter` | `{fiktives_alter}` | Sektion 7 — „fiktives Alter des Gebäudes von … Jahren" + Schluss-Satz |
| `rnd_jahre` | `{rnd_jahre}` | Sektion 7 — RND-Jahre an drei Stellen (Berechnung, Schluss-Satz, Tabellen-Footer) |
| `rnd_gesamtnutzungsdauer` | `{rnd_gesamtnutzungsdauer}` | Sektion 7 — „gewöhnliche Gesamtnutzungsdauer von … Jahren" |
| `modernisierungs_jahre` | `{modernisierungs_jahre}` | Sektion 7 — „Es wurde {…} {renovierungsstatus_satz}." |
| `modernisierungs_massnahmen` | `{modernisierungs_massnahmen}` | Sektion 7 — Block „Folgende Modernisierungsmaßnahmen wurden durchgeführt:" |
| `rnd_punkte_fenster` | `{rnd_punkte_fenster}` | SW-RL-Tabelle Zeile „Fenster" |
| `rnd_punkte_dach` | `{rnd_punkte_dach}` | SW-RL-Tabelle Zeile „Dach (nur Eindeckung)" |
| `rnd_punkte_leitungen` | `{rnd_punkte_leitungen}` | SW-RL-Tabelle Zeile „Leitungssysteme" |
| `rnd_punkte_heizung` | `{rnd_punkte_heizung}` | SW-RL-Tabelle Zeile „Heizungsanlage" |
| `rnd_punkte_fassade` | `{rnd_punkte_fassade}` | SW-RL-Tabelle Zeile „Fassadendämmung (nur einseitig)" |
| `rnd_punkte_innenausbau` | `{rnd_punkte_innenausbau}` | SW-RL-Tabelle Zeile „Innenausbau" |
| `rnd_punkte_baeder` | `{rnd_punkte_baeder}` | SW-RL-Tabelle Zeile „Bäder" |
| *(berechnet)* | `{rnd_punkte_summe}` | SW-RL-Tabelle Footer + Schluss-Satz „verlängert sich … um {…} Jahre" |
| *(berechnet)* | `{rnd_kategorie_text}` | Schluss-Satz „erreichte Punktzahl (={…})" |

## Abgeleitete / berechnete Werte

### `rnd_punkte_summe`

Summe aller sieben Punkte-Felder ([`lib/docx/context.js:287-294`](../../lib/docx/context.js)):

```js
const pFenster = parseInt(T.str(fields.rnd_punkte_fenster), 10) || 0;
const pDach = parseInt(T.str(fields.rnd_punkte_dach), 10) || 0;
const pLeitungen = parseInt(T.str(fields.rnd_punkte_leitungen), 10) || 0;
const pHeizung = parseInt(T.str(fields.rnd_punkte_heizung), 10) || 0;
const pFassade = parseInt(T.str(fields.rnd_punkte_fassade), 10) || 0;
const pInnenausbau = parseInt(T.str(fields.rnd_punkte_innenausbau), 10) || 0;
const pBaeder = parseInt(T.str(fields.rnd_punkte_baeder), 10) || 0;
const punkteSumme = pFenster + pDach + pLeitungen + pHeizung + pFassade + pInnenausbau + pBaeder;
```

Jeder einzelne Wert wird **toleranzbehaftet** geparst: leere Strings, nicht-numerische Werte oder `NaN` werden zu `0` umgewandelt (`|| 0`). Der Output ist also immer eine gültige Ganzzahl.

**Mögliche Maximalwerte** (laut Formular-Hinweis [`formular.html:1468`](../../formular.html) und gemäß SW-RL Anlage 4):

| Punkt | Maximum |
|---|---|
| Fenster | 2 |
| Dach (nur Eindeckung) | 4 |
| Leitungssysteme | 2 |
| Heizungsanlage | 2 |
| Fassadendämmung (nur einseitig) | 4 |
| Innenausbau | 2 |
| Bäder | 2 |
| **Summe maximal** | **18** |

Die `max`-Attribute an den HTML-Inputs verhindern die Eingabe höherer Werte im Browser, der Server prüft dies nicht zusätzlich.

### `rnd_kategorie_text`

Berechnet aus `punkteSumme` über `T.toDisplayRndKategorie(punkteSumme)` ([`lib/transformers.js:242-250`](../../lib/transformers.js)):

```js
function toDisplayRndKategorie(punkteSumme) {
  const n = parseInt(str(punkteSumme), 10);
  if (!Number.isFinite(n)) return '';
  if (n === 0) return 'nicht modernisiert bis kleine Modernisierung im Rahmen der Instandhaltung';
  if (n <= 4) return 'kleine Modernisierung im Rahmen der Instandhaltung';
  if (n <= 9) return 'mittlere Modernisierung';
  if (n <= 14) return 'umfassende Modernisierung';
  return 'umfassende Modernisierung im Rahmen einer Sanierung';
}
```

**Schwellwerte und Kategorien**:

| Summe (Punkte) | Kategorie-Text |
|---|---|
| `0` | „nicht modernisiert bis kleine Modernisierung im Rahmen der Instandhaltung" |
| `1`–`4` | „kleine Modernisierung im Rahmen der Instandhaltung" |
| `5`–`9` | „mittlere Modernisierung" |
| `10`–`14` | „umfassende Modernisierung" |
| `≥ 15` | „umfassende Modernisierung im Rahmen einer Sanierung" |

Bei nicht-numerischer Summe (theoretisch unmöglich, da `punkteSumme` immer eine Zahl ist) wird ein leerer String zurückgegeben.

## Felder im Detail

### `rnd_fiktives_alter`

- **Label im Formular**: „Fiktives Alter (Jahre):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="200">`
- **Placeholder**: „z.B. 50"
- **Quelle**: [`formular.html:1447-1448`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:282`](../../lib/docx/context.js):
  ```js
  const rndFiktivesAlter = T.str(fields.rnd_fiktives_alter);
  ```
- **Transformer / Builder**: keiner — `T.str` zum Trimmen, dann `T.fallback` für den Output ([`lib/docx/context.js:445`](../../lib/docx/context.js)).
- **Output-Key**: `fiktives_alter` (**nicht** `rnd_fiktives_alter`!)
- **Template-Platzhalter**: `{fiktives_alter}` — kommt im Template **zweimal** vor (`_template_extract.md:631, 743`).
- **Word-Kontext** (Sektion 7):
  > … taxiert der Unterzeichnende … zunächst ein fiktives Alter des Gebäudes von **{fiktives_alter}** Jahren. Bei einer gewöhnlichen Gesamtnutzungsdauer von {rnd_gesamtnutzungsdauer} Jahren …
  >
  > Die taxierte Restnutzungsdauer des Gebäudes … verlängert sich entsprechend der erreichten Punktzahl (={rnd_kategorie_text}) und einem angesetzten Alter von **{fiktives_alter}** Jahren um {rnd_punkte_summe} Jahre auf {rnd_jahre} Jahre …
- **Auswirkung**: Beide Stellen werden mit der gleichen Zahl gefüllt. Bei leerer Eingabe: `___` an beiden Stellen.
- **Besonderheiten**: Der Output-Key ist `fiktives_alter`, nicht `rnd_fiktives_alter` — bei der Suche im Code aufpassen. Output ist in `T.fallback(...)` gewickelt.

### `rnd_jahre`

- **Label im Formular**: „Restnutzungsdauer (Jahre):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="100">`
- **Placeholder**: „z.B. 15"
- **Quelle**: [`formular.html:1451-1452`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:283`](../../lib/docx/context.js):
  ```js
  const rndJahre = T.str(fields.rnd_jahre);
  ```
- **Transformer / Builder**: keiner.
- **Output-Key**: `rnd_jahre` ([`lib/docx/context.js:444`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{rnd_jahre}` — kommt im Template **dreimal** vor (`_template_extract.md:631, 743, 751`).
- **Word-Kontext** (Sektion 7):
  > … wäre somit eine Restnutzungsdauer von **{rnd_jahre}** Jahren für das {gebaeude_typ} anzusetzen.
  >
  > Die taxierte Restnutzungsdauer … verlängert sich … um {rnd_punkte_summe} Jahre auf **{rnd_jahre}** Jahre für das {gebaeude_typ}.
  >
  > Restnutzungsdauer
  >
  > **{rnd_jahre}** Jahre
- **Auswirkung**: Dieselbe Zahl an drei Stellen, einmal in den Berechnungs-Sätzen, einmal als kompakter Schluss-Wert. Bei leerer Eingabe: `___` an allen drei Stellen.
- **Besonderheiten**: Output ist in `T.fallback(...)` gewickelt. Die Logik prüft **nicht**, ob `rnd_jahre = rnd_gesamtnutzungsdauer - rnd_fiktives_alter + punkteSumme` rechnerisch konsistent ist — der Sachverständige verantwortet die Stimmigkeit selbst.

### `rnd_gesamtnutzungsdauer`

- **Label im Formular**: „Gesamtnutzungsdauer (Jahre):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="100">`
- **Placeholder**: „z.B. 65"
- **Quelle**: [`formular.html:1455-1456`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:284`](../../lib/docx/context.js):
  ```js
  const rndGesamtnutzungsdauer = T.str(fields.rnd_gesamtnutzungsdauer);
  ```
- **Transformer / Builder**: keiner.
- **Output-Key**: `rnd_gesamtnutzungsdauer` ([`lib/docx/context.js:446`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{rnd_gesamtnutzungsdauer}` (einmal im Template, `_template_extract.md:631`)
- **Word-Kontext** (Sektion 7):
  > Bei einer gewöhnlichen Gesamtnutzungsdauer von **{rnd_gesamtnutzungsdauer}** Jahren für das {gebaeude_typ} (hier Standardstufe {standardstufe} nach SW-RL) wäre somit eine Restnutzungsdauer von {rnd_jahre} Jahren … anzusetzen.
- **Auswirkung**: Wird im Berechnungs-Satz als Bezugspunkt für die RND-Ableitung verwendet. Bei leerer Eingabe: `___`.
- **Besonderheiten**: Output ist in `T.fallback(...)` gewickelt.

### `modernisierungs_jahre`

- **Label im Formular**: „Modernisierungs-Jahre (kurze Angabe für den Schluss-Satz):"
- **HTML-Input-Typ**: `<input type="text" style="width:100%;">`
- **Placeholder**: `z.B. „in den Jahren 1991/1992"`
- **Quelle**: [`formular.html:1460-1461`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:285`](../../lib/docx/context.js):
  ```js
  const modernisierungsJahre = T.str(fields.modernisierungs_jahre);
  ```
- **Transformer / Builder**: keiner.
- **Output-Key**: `modernisierungs_jahre` ([`lib/docx/context.js:456`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{modernisierungs_jahre}` (einmal im Template, `_template_extract.md:627`)
- **Word-Kontext** (Sektion 7):
  > Dies gilt auch für das Bewertungsobjekt, das ursprünglich im Jahr {baujahr} errichtet wurde. Es wurde **{modernisierungs_jahre}** {renovierungsstatus_satz}.
- **Auswirkung**: Wörtlich übernommen ins Satzgerüst. Beispiel mit Eingabe „in den Jahren 1991/1992" und `renovierungsstatus_satz = "umfassend modernisiert"` → „Es wurde in den Jahren 1991/1992 umfassend modernisiert." Bei leerer Eingabe entsteht eine grammatikalisch unvollständige Konstruktion („Es wurde  umfassend modernisiert.") — das Feld ist also faktisch pflicht.
- **Besonderheiten**: **Output ist NICHT in `T.fallback(...)` gewickelt** — bei leerer Eingabe entsteht ein leerer String, nicht `___`. Das ist ein Unterschied zu den meisten anderen Feldern. Der Sachverständige bestimmt selbst Großschreibung und Phrase (z.B. „in den Jahren …", „im Jahr …", „zwischen … und …").

### `modernisierungs_massnahmen`

- **Label im Formular**: „Modernisierungs-Maßnahmen (Tabelle, je Zeile eine Maßnahme):"
- **HTML-Input-Typ**: `<textarea rows="6">`
- **Placeholder** (mehrzeilig):
  ```
  z.B.
  Badsanierung 1991: Erneuerung der Sanitärinstallation
  Fensteraustausch 1991: Kunststofffenster mit 2-fach-Isolierverglasung
  Heizungsanlage 1991: Erneuerung der Gasetagenheizung
  ```
- **Quelle**: [`formular.html:1463-1465`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:286`](../../lib/docx/context.js):
  ```js
  const modernisierungsMassnahmen = T.str(fields.modernisierungs_massnahmen);
  ```
- **Transformer / Builder**: keiner — nur `T.str` zum Trimmen.
- **Output-Key**: `modernisierungs_massnahmen` ([`lib/docx/context.js:457`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{modernisierungs_massnahmen}` (einmal im Template, `_template_extract.md:639`)
- **Word-Kontext** (Sektion 7):
  > Folgende Modernisierungsmaßnahmen wurden durchgeführt:
  >
  > **{modernisierungs_massnahmen}**
  >
  > *(Leerabsatz)*
  >
  > In hilfsweiser Anlehnung an das Modell zur Ableitung der wirtschaftlichen Restnutzungsdauer …
- **Auswirkung**: Jede Zeile der Textarea-Eingabe wird im Word als eigene Zeile dargestellt — Zeilenumbrüche (`\n`) werden dank `linebreaks: true` ([`lib/docx/render.js:118, 171`](../../lib/docx/render.js)) als echte Word-Zeilenumbrüche gerendert. Aus der Beispiel-Eingabe entsteht im Word:
  > Badsanierung 1991: Erneuerung der Sanitärinstallation
  > Fensteraustausch 1991: Kunststofffenster mit 2-fach-Isolierverglasung
  > Heizungsanlage 1991: Erneuerung der Gasetagenheizung
- **Besonderheiten**:
  - **Keine echte Word-Tabelle** — die Bezeichnung „Tabelle" im Label bezieht sich auf die zeilenweise optische Struktur des Fließtexts, nicht auf eine tatsächliche Tabellenstruktur. Im DOCX entsteht ein einzelner Absatz mit Soft-Line-Breaks (`<w:br/>`-Elemente, automatisch von Docxtemplater eingefügt).
  - **Output ist NICHT in `T.fallback(...)` gewickelt** — bei leerer Eingabe bleibt der Block sichtbar, aber leer (kein `___`).
  - Format-Konvention für saubere Darstellung: pro Zeile ein vollständiger Bullet-Punkt-Stil-Eintrag (z.B. „Badsanierung 1991: Erneuerung der Sanitärinstallation"). Bullet-Symbole (`•`, `-`) sind nicht zwingend, werden aber wörtlich übernommen.

### `rnd_punkte_fenster`

- **Label im Formular**: „Fenster (max. 2):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="2" value="0">`
- **Quelle**: [`formular.html:1470`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:287`](../../lib/docx/context.js):
  ```js
  const pFenster = parseInt(T.str(fields.rnd_punkte_fenster), 10) || 0;
  ```
- **Transformer / Builder**: `parseInt(..., 10) || 0` — leere/nicht-numerische Werte werden zu 0.
- **Output-Key**: `rnd_punkte_fenster` ([`lib/docx/context.js:447`](../../lib/docx/context.js)):
  ```js
  rnd_punkte_fenster: String(pFenster),
  ```
- **Template-Platzhalter**: `{rnd_punkte_fenster}` (einmal in der SW-RL-Tabelle, `_template_extract.md:671`)
- **Word-Kontext** (SW-RL-Tabelle in Sektion 7):
  > Fenster | 2 | {rnd_punkte_fenster}
- **Auswirkung**: Der Punkt-Ansatz für Fenster (0, 1 oder 2) erscheint in der „Ansatz"-Spalte der SW-RL-Tabelle und fließt in `rnd_punkte_summe` ein. Default ist 0.
- **Besonderheiten**: Output ist **immer ein String** (`String(pFenster)`), nicht in `T.fallback` gewickelt — bei fehlender Eingabe steht „0" im Word, nicht `___`.

### `rnd_punkte_dach`

- **Label im Formular**: „Dach (max. 4):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="4" value="0">`
- **Quelle**: [`formular.html:1471`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:288`](../../lib/docx/context.js):
  ```js
  const pDach = parseInt(T.str(fields.rnd_punkte_dach), 10) || 0;
  ```
- **Output-Key**: `rnd_punkte_dach` ([`lib/docx/context.js:448`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{rnd_punkte_dach}` (`_template_extract.md:681`)
- **Word-Kontext**:
  > Dach (nur Eindeckung) | 4 | {rnd_punkte_dach}
- **Auswirkung**: Wert 0–4 in der „Ansatz"-Spalte; fließt in `rnd_punkte_summe` ein.
- **Besonderheiten**: Wie `rnd_punkte_fenster` — immer als String, nicht durch `T.fallback`.

### `rnd_punkte_leitungen`

- **Label im Formular**: „Leitungen (max. 2):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="2" value="0">`
- **Quelle**: [`formular.html:1472`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:289`](../../lib/docx/context.js):
  ```js
  const pLeitungen = parseInt(T.str(fields.rnd_punkte_leitungen), 10) || 0;
  ```
- **Output-Key**: `rnd_punkte_leitungen` ([`lib/docx/context.js:449`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{rnd_punkte_leitungen}` (`_template_extract.md:691`)
- **Word-Kontext**:
  > Leitungssysteme | 2 | {rnd_punkte_leitungen}
- **Auswirkung**: Wert 0–2 in der „Ansatz"-Spalte; fließt in `rnd_punkte_summe` ein.
- **Besonderheiten**: Wie oben.

### `rnd_punkte_heizung`

- **Label im Formular**: „Heizung (max. 2):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="2" value="0">`
- **Quelle**: [`formular.html:1473`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:290`](../../lib/docx/context.js):
  ```js
  const pHeizung = parseInt(T.str(fields.rnd_punkte_heizung), 10) || 0;
  ```
- **Output-Key**: `rnd_punkte_heizung` ([`lib/docx/context.js:450`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{rnd_punkte_heizung}` (`_template_extract.md:701`)
- **Word-Kontext**:
  > Heizungsanlage | 2 | {rnd_punkte_heizung}
- **Auswirkung**: Wert 0–2 in der „Ansatz"-Spalte; fließt in `rnd_punkte_summe` ein.
- **Besonderheiten**: Wie oben.

### `rnd_punkte_fassade`

- **Label im Formular**: „Fassadendämmung (max. 4):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="4" value="0">`
- **Quelle**: [`formular.html:1476`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:291`](../../lib/docx/context.js):
  ```js
  const pFassade = parseInt(T.str(fields.rnd_punkte_fassade), 10) || 0;
  ```
- **Output-Key**: `rnd_punkte_fassade` ([`lib/docx/context.js:451`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{rnd_punkte_fassade}` (`_template_extract.md:711`)
- **Word-Kontext**:
  > Fassadendämmung (nur einseitig) | 4 | {rnd_punkte_fassade}
- **Auswirkung**: Wert 0–4 in der „Ansatz"-Spalte; fließt in `rnd_punkte_summe` ein.
- **Besonderheiten**: Wie oben.

### `rnd_punkte_innenausbau`

- **Label im Formular**: „Innenausbau (max. 2):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="2" value="0">`
- **Quelle**: [`formular.html:1477`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:292`](../../lib/docx/context.js):
  ```js
  const pInnenausbau = parseInt(T.str(fields.rnd_punkte_innenausbau), 10) || 0;
  ```
- **Output-Key**: `rnd_punkte_innenausbau` ([`lib/docx/context.js:452`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{rnd_punkte_innenausbau}` (`_template_extract.md:721`)
- **Word-Kontext**:
  > Innenausbau | 2 | {rnd_punkte_innenausbau}
- **Auswirkung**: Wert 0–2 in der „Ansatz"-Spalte; fließt in `rnd_punkte_summe` ein.
- **Besonderheiten**: Wie oben.

### `rnd_punkte_baeder`

- **Label im Formular**: „Bäder (max. 2):"
- **HTML-Input-Typ**: `<input type="number" min="0" max="2" value="0">`
- **Quelle**: [`formular.html:1478`](../../formular.html)
- **Mapping (Context)**: [`lib/docx/context.js:293`](../../lib/docx/context.js):
  ```js
  const pBaeder = parseInt(T.str(fields.rnd_punkte_baeder), 10) || 0;
  ```
- **Output-Key**: `rnd_punkte_baeder` ([`lib/docx/context.js:453`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{rnd_punkte_baeder}` (`_template_extract.md:731`)
- **Word-Kontext**:
  > Bäder | 2 | {rnd_punkte_baeder}
- **Auswirkung**: Wert 0–2 in der „Ansatz"-Spalte; fließt in `rnd_punkte_summe` ein.
- **Besonderheiten**: Wie oben.

### `{rnd_punkte_summe}` (berechnet, kein Input)

- **Output-Key**: `rnd_punkte_summe` ([`lib/docx/context.js:454`](../../lib/docx/context.js)):
  ```js
  rnd_punkte_summe: String(punkteSumme),
  ```
- **Template-Platzhalter**: `{rnd_punkte_summe}` — kommt im Template **zweimal** vor (`_template_extract.md:737, 743`).
- **Word-Kontext**:
  > *(SW-RL-Tabelle Footer-Zeile)*
  >
  > {rnd_punkte_summe}
  >
  > Die taxierte Restnutzungsdauer … verlängert sich entsprechend der erreichten Punktzahl (={rnd_kategorie_text}) und einem angesetzten Alter von {fiktives_alter} Jahren um **{rnd_punkte_summe}** Jahre auf {rnd_jahre} Jahre für das {gebaeude_typ}.
- **Auswirkung**: Die Summe (0–18) erscheint einmal am Tabellenende und einmal im Schluss-Satz als Verlängerungs-Wert in Jahren. Ohne Eingaben in den sieben Punkte-Feldern wird „0" angezeigt (default-Werte).
- **Besonderheiten**: Immer ein String (`String(punkteSumme)`), nicht durch `T.fallback`.

### `{rnd_kategorie_text}` (berechnet, kein Input)

- **Output-Key**: `rnd_kategorie_text` ([`lib/docx/context.js:455`](../../lib/docx/context.js)):
  ```js
  rnd_kategorie_text: T.fallback(rndKategorieText),
  ```
- **Template-Platzhalter**: `{rnd_kategorie_text}` (einmal im Template, `_template_extract.md:743`)
- **Word-Kontext**:
  > Die taxierte Restnutzungsdauer … verlängert sich entsprechend der erreichten Punktzahl (=**{rnd_kategorie_text}**) und einem angesetzten Alter von {fiktives_alter} Jahren um {rnd_punkte_summe} Jahre auf {rnd_jahre} Jahre …
- **Auswirkung**: Der Kategorie-Text aus der Schwellwert-Tabelle (siehe oben) wird in der Klammer hinter „Punktzahl" eingefügt. Bei `punkteSumme = 7` z.B. „… der erreichten Punktzahl (=mittlere Modernisierung) und einem angesetzten Alter …".
- **Besonderheiten**:
  - Output ist in `T.fallback(...)` gewickelt — bei `punkteSumme = 0` greift aber bereits die Branch `n === 0 → 'nicht modernisiert bis kleine Modernisierung …'`, sodass `T.fallback` praktisch nie auf `___` zurückfällt.
  - `toDisplayRndKategorie` gibt nur dann einen leeren String zurück, wenn `parseInt` `NaN` liefert — das ist unmöglich, weil `punkteSumme` immer numerisch ist.

## Vollständiger Word-Kontext (Sektion 7)

Sektion 7 im Template (`_template_extract.md:619-751`) besteht aus:

1. **Einführungsabsatz** zur theoretischen Lebensdauer (statischer Text mit `{gebaeude_typ}`-Einsatz).
2. **Bewertungsobjekt-Absatz**: „Dies gilt auch … das ursprünglich im Jahr {baujahr} errichtet wurde. Es wurde **{modernisierungs_jahre}** {renovierungsstatus_satz}."
3. **Berechnungs-Absatz**: „… fiktives Alter von **{fiktives_alter}** Jahren. Bei einer gewöhnlichen Gesamtnutzungsdauer von **{rnd_gesamtnutzungsdauer}** Jahren … wäre somit eine Restnutzungsdauer von **{rnd_jahre}** Jahren … anzusetzen."
4. **Maßnahmen-Block**: „Folgende Modernisierungsmaßnahmen wurden durchgeführt:" + **{modernisierungs_massnahmen}**
5. **SW-RL-Tabelle** mit sieben Zeilen (Fenster/Dach/Leitungen/Heizung/Fassade/Innenausbau/Bäder) und der Summen-Zeile **{rnd_punkte_summe}**.
6. **Schluss-Satz**: „Die taxierte Restnutzungsdauer … verlängert sich entsprechend der erreichten Punktzahl (=**{rnd_kategorie_text}**) und einem angesetzten Alter von **{fiktives_alter}** Jahren um **{rnd_punkte_summe}** Jahre auf **{rnd_jahre}** Jahre für das {gebaeude_typ}."
7. **Schluss-Block**: kompakte Wiedergabe der RND („Restnutzungsdauer / **{rnd_jahre}** Jahre") und der Anschrift sowie des Stichtags.

## Querverweise auf Eingaben außerhalb dieser Sektion

Der RND-Block referenziert mehrere Platzhalter aus anderen Sektionen, die in Sektion 7 mit-eingebunden sind:

- `{baujahr}` (Sektion „Eckdaten")
- `{gebaeude_typ}` (aus `nutzung`, Sektion „Eckdaten")
- `{standardstufe}` (Sektion „Zustand und Ausstattung")
- `{renovierungsstatus_satz}` (aus `renovierungsstatus`, Sektion „Zustand und Ausstattung")
- `{genaue_anschrift}` (aus `objekt_*`-Feldern, Sektion „Angaben zum Objekt")
- `{stichtag}` (Sektion „Metadaten")
- `{anmerkung}` (im finalen Anmerkung-Block, Sektion „Freitexte")

Insbesondere `renovierungsstatus_satz` und `modernisierungs_jahre` müssen grammatikalisch zusammenpassen („Es wurde {…} {renovierungsstatus_satz}."), damit der zusammengesetzte Satz im Word korrekt liest.
