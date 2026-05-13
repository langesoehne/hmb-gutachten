# Haustechnik

Diese Sektion (`data-section-key="haustechnik"`, `formular.html:999-1102`) erfasst die technische Gebäudeausstattung: **Heizungsart**, **Energieträger**, **Heizungs-Baujahr**, **Solarthermie**, **Photovoltaik** und **Warmwasser-Bereitstellung**. Sie ist im Public-Modus sichtbar (kein `admin-only`), wird also auch vom Kunden ausgefüllt.

Zwei weitere haustechnische Eingaben liegen in **anderen Formular-Sektionen**, fließen aber inhaltlich in denselben Word-Block „Haustechnik" ein: Das Feld `aufzug` (mit `aufzug_baujahr`) sitzt in der Sektion `objekt` (`formular.html:334-347`); das Textarea-Feld `heizung_zusatz` sitzt im Admin-Block `bauteile` (`formular.html:1343-1347`). Beide werden im Word-Output zusammen mit den Heizungs- und Warmwasser-Daten zu einem zusammenhängenden Beschreibungsblock verarbeitet.

Die Heizungs-Beschreibung wird im Code aus mehreren Komponenten zusammengesetzt: `heizung_art` (Energieträger) + `heizung` (Bauart) ergeben `heizung_text`. Der Artikel davor (`heizung_artikel` = „eine") wird automatisch grammatisch korrekt aus `heizung` abgeleitet. Die Warmwasser-Beschreibung kombiniert ihrerseits `warmwasser` (Erzeugungsart) + `warmwasser_art` (Energieträger) zu einem einzigen Output-Wert.

> **Wichtiger Sonderfall — `heizung_zusatz`**: Obwohl es im Template einen Platzhalter `{heizung_zusatz}` gibt, wird dieser im Output **immer auf leer gesetzt**. Der eingegebene Zusatztext wird stattdessen **inline in `{heizung_text}` integriert**, damit er noch vor dem Satzpunkt steht. Details siehe Abschnitt [Sonderfall heizung_zusatz](#sonderfall-heizung_zusatz) am Ende.

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `heizung` (Bauart) | _(fließt in `{heizung_text}` und `{heizung_artikel}`)_ | Heizungs-Satz im Block „Haustechnik" |
| `heizung_art` (Energieträger) | `{heizung_art_text}` (direkt) + indirekt in `{heizung_text}` | Energetischer Zustand (Sektion 5) + Haustechnik-Satz |
| `heizung_baujahr` | `{heizung_baujahr}` | Klammer im Heizungs-Satz: „(Baujahr …)" |
| `solarthermie` + `solar_bj_1` | `{solarthermie}` | Energetischer Zustand: „- Solarthermie: …" |
| `photovoltaik` + `pv_bj` | `{photovoltaik}` | Energetischer Zustand: „- Photovoltaik: …" |
| `warmwasser` (Erzeugungsart) | _(fließt in `{warmwasser_bereitstellung}`)_ | Haustechnik-Block: „Warmwasser-Bereitstellung: …" |
| `warmwasser_art` (Energieträger) | _(fließt in `{warmwasser_bereitstellung}`)_ | wie `warmwasser` |
| `heizung_zusatz` (in `bauteile`) | `{heizung_zusatz}` (immer leer!) + inline in `{heizung_text}` | Heizungs-Satz, vor dem Satzpunkt |
| `aufzug` + `aufzug_baujahr` (in `objekt`) | `{aufzug}` | Fenster/Glas-Block: „Aufzug: …" |

Zusammengesetzte Output-Werte (alle in `lib/docx/context.js:378-388`):

| Output-Key | Template-Platzhalter | Quelle |
|---|---|---|
| `heizung_art_text` | `{heizung_art_text}` | `context.js:126`, `transformers.js:35-38` |
| `heizung_text` | `{heizung_text}` | `context.js:128, 131` (compactJoin), `transformers.js:3-9` |
| `heizung_artikel` | `{heizung_artikel}` | `context.js:133`, `transformers.js:229-233` |
| `heizung_baujahr` | `{heizung_baujahr}` | `context.js:132` |
| `heizung_zusatz` | `{heizung_zusatz}` | `context.js:383` — **immer `''`** |
| `warmwasser_bereitstellung` | `{warmwasser_bereitstellung}` | `context.js:134`, `transformers.js:367-385` |
| `solarthermie` | `{solarthermie}` | `context.js:135`, `transformers.js:471-477` |
| `photovoltaik` | `{photovoltaik}` | `context.js:136`, `transformers.js:471-477` |
| `aufzug` | `{aufzug}` | `context.js:137`, `transformers.js:471-477` |

## Sub-Sektionen

### Heizung

Im Formular (`formular.html:1001-1033`) drei Eingabe-Blöcke:

1. **Heizungs-Bauart** (`name=heizung`): Radio-Gruppe — `zentral` / `etage` / `einzelofen`.
2. **Energieträger** (`name=heizung_art`): Radio-Gruppe — `gas` / `oel` / `strom`.
3. **Baujahr Heizung** (`name=heizung_baujahr`): freies Textfeld.

Diese drei Felder werden zusammen mit dem optionalen `heizung_zusatz` (aus `bauteile`) zu einem zusammenhängenden Satz verschmolzen: „Das Gebäude wird über `{heizung_artikel}` `{heizung_text}` (Baujahr `{heizung_baujahr}`) beheizt."

### Warmwasser

Im Formular (`formular.html:1073-1101`) zwei Radio-Gruppen:

1. **Erzeugungsart** (`name=warmwasser`): `zentral` / `durchlauferhitzer` / `therme`.
2. **Energieträger** (`name=warmwasser_art`): `gas` / `oel` / `strom`.

Beide werden in `toDisplayWarmwasser` (`transformers.js:367`) zu **einem** Wert `warmwasser_bereitstellung` kombiniert. Die Logik ist nicht trivial — z.B. wird Strom als Adjektiv vorangestellt („elektrische Therme"), und „zentral" trägt den Energieträger in Klammern („zentral (Gas)").

### Solarthermie

Im Formular (`formular.html:1037-1053`) ein Sub-Card-Block mit Ja/Nein-Radio (`name=solarthermie`) und optionalem Baujahrs-Textfeld (`name=solar_bj_1`). Das Baujahrsfeld ist initial `disabled` und wird über `toggleBjField('solar_bj_1', true/false)` per JS aktiviert, sobald „ja" gewählt ist.

### Photovoltaik

Analog zu Solarthermie: Ja/Nein-Radio (`name=photovoltaik`) plus Baujahr (`name=pv_bj`), gleiche Toggle-Logik (`formular.html:1054-1070`).

### Aufzug

**Nicht in `haustechnik`-Sektion**, sondern in der `objekt`-Sektion (`formular.html:333-348`). Eingabe-Logik identisch zu Solar/PV: Ja/Nein-Radio (`name=aufzug`) plus Baujahr (`name=aufzug_baujahr`), Toggle-Steuerung per JS.

## Felder im Detail

### `heizung` (Heizungsart / Bauart)

- **Label im Formular**: „Heizungsart" (`h3`-Überschrift, kein Feld-Label direkt)
- **HTML-Input-Typ**: 3 Radio-Buttons, gemeinsamer `name="heizung"`
- **Datalist/Options**:
  | Form-Value | Anzeige im Formular | Display-Wert via `toDisplayHeizungTyp` |
  |---|---|---|
  | `zentral` | „Zentral" | `Zentralheizung` |
  | `etage` | „Etage" | `Etagenheizung` |
  | `einzelofen` | „Einzelöfen" | `Einzelöfen` |
- **Quelle**: `formular.html:1002-1015`
- **Mapping (Context)**: `lib/docx/context.js:127` — `const heizungTypText = T.toDisplayHeizungTyp(fields.heizung);`. Wird in `heizungBasisText` per `compactJoin` mit Bindestrich an `heizungArtText` gehängt (`context.js:128`).
- **Transformer**:
  - `toDisplayHeizungTyp(rawValue)` ([`transformers.js:40-43`](../../lib/transformers.js)) — Map der drei Form-Values auf die Volltexte. Unbekannte Werte → `''`.
  - `toDisplayHeizungArtikel(heizungTyp)` ([`transformers.js:229-233`](../../lib/transformers.js)) — leitet den **Artikel** für die Grammatik ab:
    | `heizung` | `heizung_artikel` (Output) | Grund |
    |---|---|---|
    | `zentral` | `eine` | „Zentralheizung" ist feminin |
    | `etage` | `eine` | „Etagenheizung" ist feminin |
    | `einzelofen` | `''` (leer) | „Einzelöfen" ist Plural ohne Artikel |
    | leer / unbekannt | `eine` | Default-Fallback |
- **Output-Keys im Context-Objekt**: Indirekt in `heizung_text` (`context.js:380`) — und **direkt** in `heizung_artikel` (`context.js:381`, **ohne** `T.fallback`, also leer = leerer String, nicht `___`).
- **Template-Platzhalter**: indirekt via `{heizung_text}` und direkt via `{heizung_artikel}`.
- **Word-Kontext**:
  > Das Gebäude wird über {heizung_artikel} {heizung_text} (Baujahr {heizung_baujahr}) beheizt. {heizung_zusatz}
  (`_template_extract.md:515`, Sektion „Haustechnik / Heizung / Warmwasser")
- **Auswirkung**:
  - `heizung=zentral` + `heizung_art=gas` → Satz: „Das Gebäude wird über **eine Gas-Zentralheizung** (Baujahr …) beheizt."
  - `heizung=einzelofen` + `heizung_art=oel` → Satz: „Das Gebäude wird über **Öl-Einzelöfen** (Baujahr …) beheizt." (kein Artikel, weil Plural)
  - `heizung` leer + `heizung_art=gas` → Satz: „Das Gebäude wird über eine **Gas** (Baujahr …) beheizt." (Artikel-Fallback `eine` greift, was grammatisch holpert — also bitte beide Felder zusammen ausfüllen).
- **Besonderheiten**: Steuert über `toDisplayHeizungArtikel` die **Satz-Grammatik** im Template. Bei `einzelofen` wird der Artikel bewusst weggelassen.

### `heizung_art` (Energieträger der Heizung)

- **Label im Formular**: kein expliziter Label-Tag (zweite Radio-Gruppe unter „Heizungsart")
- **HTML-Input-Typ**: 3 Radio-Buttons, gemeinsamer `name="heizung_art"`
- **Datalist/Options**:
  | Form-Value | Anzeige im Formular | Display-Wert via `toDisplayHeizungArt` |
  |---|---|---|
  | `gas` | „Gas" | `Gas` |
  | `oel` | „Öl" | `Öl` |
  | `strom` | „Strom" | `Strom` |
- **Quelle**: `formular.html:1016-1029`
- **Mapping (Context)**: `lib/docx/context.js:126` — `const heizungArtText = T.toDisplayHeizungArt(fields.heizung_art);`.
- **Transformer**: `toDisplayHeizungArt(rawValue)` ([`transformers.js:35-38`](../../lib/transformers.js)) — Map der drei Form-Values auf die deutsche Anzeige. Unbekannte Werte → `''`.
- **Output-Keys im Context-Objekt**:
  - **Direkt**: `heizung_art_text` (`context.js:379`), gewrappt in `T.fallback(...)` → leer = `___`.
  - **Indirekt**: Fließt als erstes Glied in `heizungBasisText` (mit `-` verbunden), dann in `heizung_text`.
- **Template-Platzhalter**: `{heizung_art_text}` (direkt) **und** indirekt via `{heizung_text}`.
- **Word-Kontext** (zwei Stellen):
  1. **Sektion 5 (zwischen den Bauteilen)** — kurzer Satz:
     > Das Gebäude wird mit {heizung_art_text} beheizt.
     (`_template_extract.md:269`)
  2. **Haustechnik-Block** — als Teil von `{heizung_text}`:
     > Das Gebäude wird über {heizung_artikel} {heizung_text} (Baujahr {heizung_baujahr}) beheizt.
     (`_template_extract.md:515`)
  3. **Energetischer-Zustand-Liste** — als Teil von `{heizung_text}`:
     > - Heizung:{heizung_text}
     (`_template_extract.md:289`)
- **Auswirkung**:
  - `heizung_art=gas`: Direkt-Satz → „Das Gebäude wird mit **Gas** beheizt." + im Haustechnik-Block z.B. „Gas-Zentralheizung".
  - `heizung_art=oel`, `heizung=zentral`: → „… Öl-Zentralheizung …".
  - `heizung_art=strom`, `heizung=etage`: → „… Strom-Etagenheizung …".
  - Leer: `{heizung_art_text}` wird `___`, und in `heizung_text` fehlt der Energieträger-Teil — der `compactJoin` mit `-` ergibt dann nur den Bauart-Teil.
- **Besonderheiten**: `heizung_art` taucht im Template **doppelt** auf: einmal als reiner Energieträger-Satz (`{heizung_art_text}`) in Sektion 5 und einmal eingebaut in den vollen Beschreibungssatz (`{heizung_text}`).

### `heizung_baujahr`

- **Label im Formular**: „Baujahr Heizung:"
- **HTML-Input-Typ**: `type="text"` (Freitext)
- **Datalist/Options**: keine
- **Quelle**: `formular.html:1030-1033`
- **Mapping (Context)**: `lib/docx/context.js:132` — `const heizungBaujahr = T.str(fields.heizung_baujahr);` (nur getrimt, keine weitere Transformation).
- **Transformer**: `str(value)` ([`transformers.js:11-13`](../../lib/transformers.js)) — trimt, leer → `''`.
- **Output-Key im Context-Objekt**: `heizung_baujahr` (`context.js:382`), gewrappt in `T.fallback(...)` → leer = `___`.
- **Template-Platzhalter**: `{heizung_baujahr}`
- **Word-Kontext**:
  > Das Gebäude wird über {heizung_artikel} {heizung_text} (Baujahr {heizung_baujahr}) beheizt.
  (`_template_extract.md:515`)
- **Auswirkung**:
  - `heizung_baujahr=1995` → „… (Baujahr 1995) beheizt."
  - Leer → „… (Baujahr ___) beheizt."
- **Besonderheiten**: Freitext (kein `type="number"`), erlaubt also auch Werte wie „ca. 2010" oder „2010/erneuert 2020".

### `solarthermie` + `solar_bj_1`

- **Label im Formular**: „Solarthermie" (`h4`-Header der Sub-Card), darunter Ja/Nein-Radio und „Bj.:"-Textfeld.
- **HTML-Input-Typ**:
  - `solarthermie`: 2 Radio-Buttons (`ja` / `nein`)
  - `solar_bj_1`: `type="text"`, initial `disabled`
- **Datalist/Options**: keine
- **Quelle**: `formular.html:1039-1052`
- **Mapping (Context)**: `lib/docx/context.js:135` — `const solarthermieText = T.jaNein(fields.solarthermie, fields.solar_bj_1);`.
- **Transformer**: `jaNein(rawValue, baujahr)` ([`transformers.js:471-477`](../../lib/transformers.js)) — Logik:
  - Weder `ja` noch `nein` (also leer) → `''`.
  - `nein` → `'nicht vorhanden'` (Baujahr ignoriert).
  - `ja` + Baujahr leer → `'vorhanden'`.
  - `ja` + Baujahr gesetzt → `'vorhanden (Baujahr <wert>)'`.
- **Output-Key im Context-Objekt**: `solarthermie` (`context.js:385`), gewrappt in `T.fallback(...)`.
- **Template-Platzhalter**: `{solarthermie}`
- **Word-Kontext** (Energetischer-Zustand-Liste, Sektion 5):
  > - Solarthermie:{solarthermie}
  (`_template_extract.md:293`)
- **Auswirkung**:
  - `solarthermie=ja`, `solar_bj_1=2018` → „- Solarthermie: **vorhanden (Baujahr 2018)**"
  - `solarthermie=ja`, `solar_bj_1=''` → „- Solarthermie: **vorhanden**"
  - `solarthermie=nein` → „- Solarthermie: **nicht vorhanden**"
  - Beides leer → „- Solarthermie: **___**"
- **Besonderheiten**: Das Baujahr-Feld wird per JS-`toggleBjField` (`formular.html:1041, 1045`) aktiviert/deaktiviert; bei „nein" wird das Baujahr ignoriert, selbst wenn der Browser einen alten Wert behält. Der `name="solar_bj_1"` enthält die Endung `_1` aus historischen Gründen (nur eine Solar-Position erfasst).

### `photovoltaik` + `pv_bj`

- **Label im Formular**: „Photovoltaik" (`h4`-Header), darunter Ja/Nein-Radio und „Bj.:"
- **HTML-Input-Typ**:
  - `photovoltaik`: 2 Radio-Buttons (`ja` / `nein`)
  - `pv_bj`: `type="text"`, initial `disabled`
- **Datalist/Options**: keine
- **Quelle**: `formular.html:1056-1069`
- **Mapping (Context)**: `lib/docx/context.js:136` — `const photovoltaikText = T.jaNein(fields.photovoltaik, fields.pv_bj);`.
- **Transformer**: `jaNein` (siehe Solarthermie).
- **Output-Key im Context-Objekt**: `photovoltaik` (`context.js:386`), gewrappt in `T.fallback(...)`.
- **Template-Platzhalter**: `{photovoltaik}`
- **Word-Kontext** (Energetischer-Zustand-Liste, Sektion 5):
  > - Photovoltaik:{photovoltaik}
  (`_template_extract.md:295`)
- **Auswirkung**: Analog zu Solarthermie:
  - `photovoltaik=ja`, `pv_bj=2022` → „- Photovoltaik: **vorhanden (Baujahr 2022)**"
  - `photovoltaik=nein` → „- Photovoltaik: **nicht vorhanden**"
- **Besonderheiten**: identisch zu Solarthermie, nur kürzerer Feldname (`pv_bj` ohne `_1`).

### `warmwasser` (Erzeugungsart)

- **Label im Formular**: „Warmwasser" (`h3`-Überschrift, kein direkter Label-Tag)
- **HTML-Input-Typ**: 3 Radio-Buttons, gemeinsamer `name="warmwasser"`
- **Datalist/Options**:
  | Form-Value | Anzeige im Formular | Display-Wert via `toDisplayWarmwasserTyp` |
  |---|---|---|
  | `zentral` | „Zentral" | `zentral` (klein!) |
  | `durchlauferhitzer` | „Durchlauferhitzer" | `Durchlauferhitzer` |
  | `therme` | „Therme" | `Therme` |
- **Quelle**: `formular.html:1074-1087`
- **Mapping (Context)**: `lib/docx/context.js:134` — `const warmwasserBereitstellung = T.toDisplayWarmwasser(fields.warmwasser, fields.warmwasser_art);` (kombiniert beide Felder).
- **Transformer**: `toDisplayWarmwasser(rawTyp, rawArt)` ([`transformers.js:367-385`](../../lib/transformers.js)) — siehe Detailtabelle weiter unten unter `warmwasser_art`.
- **Output-Key im Context-Objekt**: Indirekt via `warmwasser_bereitstellung` (`context.js:384`).
- **Template-Platzhalter**: indirekt via `{warmwasser_bereitstellung}`.
- **Word-Kontext** (zwei Stellen):
  1. Energetischer Zustand:
     > - Warmwasser:{warmwasser_bereitstellung}
     (`_template_extract.md:291`)
  2. Haustechnik-Block:
     > Warmwasser-Bereitstellung: {warmwasser_bereitstellung}
     (`_template_extract.md:517`)
- **Auswirkung**: hängt von der Kombination mit `warmwasser_art` ab — siehe nächster Eintrag.
- **Besonderheiten**: Wird **nie** als eigener Platzhalter ausgegeben, sondern immer im Verbund mit `warmwasser_art`.

### `warmwasser_art` (Energieträger des Warmwassers)

- **Label im Formular**: kein expliziter Label-Tag (zweite Radio-Gruppe unter Warmwasser)
- **HTML-Input-Typ**: 3 Radio-Buttons, gemeinsamer `name="warmwasser_art"`
- **Datalist/Options**:
  | Form-Value | Anzeige im Formular | Display-Wert via `toDisplayWarmwasserArt` |
  |---|---|---|
  | `gas` | „Gas" | `Gas` |
  | `oel` | „Öl" | `Öl` |
  | `strom` | „Strom" | `Strom` |
- **Quelle**: `formular.html:1088-1101`
- **Mapping (Context)**: `lib/docx/context.js:134` — wird mit `warmwasser` zusammen an `toDisplayWarmwasser` übergeben.
- **Transformer**: `toDisplayWarmwasser(rawTyp, rawArt)` ([`transformers.js:367-385`](../../lib/transformers.js)) — die Kombinations-Logik:

  | `warmwasser` (Typ) | `warmwasser_art` (Energieträger) | Output `warmwasser_bereitstellung` |
  |---|---|---|
  | `zentral` | `gas` | `zentral (Gas)` |
  | `zentral` | `oel` | `zentral (Öl)` |
  | `zentral` | `strom` | `zentral (Strom)` |
  | `zentral` | leer | `zentral` |
  | `durchlauferhitzer` | `gas` | `Gas-Durchlauferhitzer` |
  | `durchlauferhitzer` | `oel` | `Öl-Durchlauferhitzer` |
  | `durchlauferhitzer` | `strom` | `elektrischer Durchlauferhitzer` *(Sonderform!)* |
  | `durchlauferhitzer` | leer | `Durchlauferhitzer` |
  | `therme` | `gas` | `Gas-Therme` |
  | `therme` | `oel` | `Öl-Therme` |
  | `therme` | `strom` | `elektrische Therme` *(Sonderform!)* |
  | `therme` | leer | `Therme` |
  | leer | `gas` | `Gas` (nur der Energieträger) |
  | leer | leer | `''` (leer) |

- **Output-Key im Context-Objekt**: `warmwasser_bereitstellung` (`context.js:384`), gewrappt in `T.fallback(...)`.
- **Template-Platzhalter**: `{warmwasser_bereitstellung}`
- **Word-Kontext**: zwei Stellen — siehe `warmwasser`.
- **Auswirkung**:
  - `warmwasser=therme`, `warmwasser_art=gas` → „- Warmwasser: **Gas-Therme**" und „Warmwasser-Bereitstellung: **Gas-Therme**"
  - `warmwasser=durchlauferhitzer`, `warmwasser_art=strom` → „**elektrischer Durchlauferhitzer**"
  - `warmwasser=zentral`, `warmwasser_art=gas` → „**zentral (Gas)**"
  - Beide leer → `___` (über `T.fallback`)
- **Besonderheiten**: Strom triggert eine **Adjektiv-Ersetzung** statt der `<Träger>-<Typ>`-Form: „elektrische Therme" / „elektrischer Durchlauferhitzer". Bei `zentral`+Strom bleibt die Klammer-Form: „zentral (Strom)" (kein Adjektiv).

### `heizung_zusatz` (in Sektion `bauteile`)

- **Label im Formular**: „Heizung — Zusatztext:"
- **HTML-Input-Typ**: `<textarea rows="2">` mit Placeholder „z.B. In den Räumen sind Heizkörper vorhanden. Das Warmwasser wird in der zentralen Gastherme erzeugt."
- **Datalist/Options**: keine
- **Quelle**: `formular.html:1345-1347` (in der **admin-only** Sektion `bauteile`, **nicht** in `haustechnik`)
- **Mapping (Context)**: `lib/docx/context.js:129-131` — wird in `heizungBasisText` per `compactJoin` (Separator `' '`) angehängt:
  ```javascript
  const heizungZusatz = T.str(fields.heizung_zusatz);
  // Zusatz inline in heizung_text einbauen, damit er nicht hinter dem Satzpunkt landet.
  const heizungText = T.compactJoin([heizungBasisText, heizungZusatz], ' ');
  ```
- **Transformer**: `str(value)` + `compactJoin([..., ...], ' ')`.
- **Output-Key im Context-Objekt**: **Zwei** Konsequenzen:
  - Inhalt fließt in `heizung_text` (`context.js:380`).
  - **`heizung_zusatz` selbst wird im Output IMMER auf `''` gesetzt** (`context.js:383`: `heizung_zusatz: ''`).
- **Template-Platzhalter**: `{heizung_zusatz}` existiert im Template (steht am Satzende), wird aber durch den hartcodierten leeren Wert **nie** mit Inhalt gefüllt — siehe [Sonderfall](#sonderfall-heizung_zusatz).
- **Word-Kontext**:
  > Das Gebäude wird über {heizung_artikel} {heizung_text} (Baujahr {heizung_baujahr}) beheizt. {heizung_zusatz}
  (`_template_extract.md:515`)
- **Auswirkung**:
  - `heizung_zusatz="Erdgaszufuhr in der Straße"`, `heizung_art=gas`, `heizung=zentral`, `heizung_baujahr=1999`:
    - `heizung_text` = `"Gas-Zentralheizung Erdgaszufuhr in der Straße"`
    - `heizung_zusatz` = `""`
    - Gerendert: „Das Gebäude wird über eine **Gas-Zentralheizung Erdgaszufuhr in der Straße** (Baujahr 1999) beheizt." (am Ende kein extra Zusatz mehr; der Punkt steht direkt nach „beheizt").
- **Besonderheiten**: Siehe ausführlich [Sonderfall heizung_zusatz](#sonderfall-heizung_zusatz).

### `aufzug` + `aufzug_baujahr` (in Sektion `objekt`)

- **Label im Formular**: „Aufzug:" (mit Ja/Nein-Radio und „Baujahr:" daneben)
- **HTML-Input-Typ**:
  - `aufzug`: 2 Radio-Buttons (`ja` / `nein`)
  - `aufzug_baujahr`: `type="text"`, initial `disabled`
- **Datalist/Options**: keine
- **Quelle**: `formular.html:334-348` (in der `objekt`-Sektion, **nicht** in `haustechnik`)
- **Mapping (Context)**: `lib/docx/context.js:137` — `const aufzugText = T.jaNein(fields.aufzug, fields.aufzug_baujahr);`.
- **Transformer**: `jaNein` (siehe Solarthermie).
- **Output-Key im Context-Objekt**: `aufzug` (`context.js:387`), gewrappt in `T.fallback(...)`.
- **Template-Platzhalter**: `{aufzug}`
- **Word-Kontext** (im „Fenster / Glas"-Block der `bauteile`-Sektion):
  > Aufzug:{aufzug}
  (`_template_extract.md:473`)
- **Auswirkung**:
  - `aufzug=ja`, `aufzug_baujahr=2005` → „Aufzug: **vorhanden (Baujahr 2005)**"
  - `aufzug=nein` → „Aufzug: **nicht vorhanden**"
  - Beides leer → „Aufzug: **___**"
- **Besonderheiten**: Liegt im Formular geografisch beim Objektabschnitt (Geschossigkeit/Stellplätze), wird im Word-Output aber im Bauteile-Block ausgegeben (vor „Hauseingang"). Toggle-Logik per JS analog zu Solar/PV.

## Sonderfall heizung_zusatz

Dieser Sonderfall verdient eine eigene Erklärung, weil das Verhalten nicht unmittelbar offensichtlich ist und beim Debugging einer fehlerhaft gerenderten Heizungs-Zeile gerne Verwirrung stiftet.

### Was im Template steht

Das Word-Template enthält an Sektion „Haustechnik / Heizung / Warmwasser" folgenden Satz (`_template_extract.md:515`):

```
Das Gebäude wird über {heizung_artikel} {heizung_text} (Baujahr {heizung_baujahr}) beheizt. {heizung_zusatz}
```

Auf den ersten Blick würde man erwarten, dass `{heizung_zusatz}` einen Zusatztext **hinter dem Satzpunkt** (nach „beheizt.") einsetzt. Das ist aber **nicht** das tatsächliche Verhalten.

### Was im Code passiert

In `lib/docx/context.js:125-131` wird die Heizungs-Beschreibung wie folgt zusammengesetzt:

```javascript
const heizungArtText = T.toDisplayHeizungArt(fields.heizung_art);          // z.B. "Gas"
const heizungTypText = T.toDisplayHeizungTyp(fields.heizung);              // z.B. "Zentralheizung"
const heizungBasisText = T.compactJoin([heizungArtText, heizungTypText], '-'); // "Gas-Zentralheizung"
const heizungZusatz = T.str(fields.heizung_zusatz);                        // z.B. "Erdgaszufuhr in der Straße"
// Zusatz inline in heizung_text einbauen, damit er nicht hinter dem Satzpunkt landet.
const heizungText = T.compactJoin([heizungBasisText, heizungZusatz], ' '); // "Gas-Zentralheizung Erdgaszufuhr in der Straße"
```

Dann in `lib/docx/context.js:380-383` (Output):

```javascript
heizung_text: T.fallback(heizungText),
heizung_artikel: heizungArtikel,
heizung_baujahr: T.fallback(heizungBaujahr),
heizung_zusatz: '',   // ← HARTCODIERT LEER, IGNORIERT die Form-Eingabe
```

### Warum das so gemacht wurde

Der Inline-Kommentar in Zeile 130 erklärt es:

> Zusatz inline in heizung_text einbauen, damit er nicht hinter dem Satzpunkt landet.

Da im Template `{heizung_zusatz}` **nach** dem Satzpunkt steht, würde ein direkt eingefügter Zusatz zu einem syntaktisch zerfallenen Satz führen. Beispiel mit naivem Einsetzen:

```
Das Gebäude wird über eine Gas-Zentralheizung (Baujahr 1999) beheizt. Erdgaszufuhr in der Straße
```

Das wäre kein vollständiger Satz mehr (kein zweiter Punkt), und Inhalte wie „Erdgaszufuhr in der Straße" sind keine eigenständigen Sätze. Statt das Template umzubauen, wird der Zusatztext vor dem Satzpunkt **innerhalb der Heizungs-Beschreibung** an `{heizung_text}` angehängt — und `{heizung_zusatz}` selbst bleibt leer.

### Konkretes Beispiel: Eingabe → Output

**Eingabe**:
- `heizung_art` = `gas`
- `heizung` = `zentral`
- `heizung_baujahr` = `1999`
- `heizung_zusatz` = `"Erdgaszufuhr in der Straße"`

**Berechnete Context-Werte**:
- `heizung_art_text` = `"Gas"`
- `heizung_text` = `"Gas-Zentralheizung Erdgaszufuhr in der Straße"` *(Basis + Zusatz mit Leerzeichen verbunden)*
- `heizung_artikel` = `"eine"`
- `heizung_baujahr` = `"1999"`
- `heizung_zusatz` = `""` *(immer leer im Output)*

**Gerenderter Satz im Word**:

```
Das Gebäude wird über eine Gas-Zentralheizung Erdgaszufuhr in der Straße (Baujahr 1999) beheizt. 
```

Der Zusatz steht damit als beschreibender Anhang **vor** dem Baujahr und **vor** dem Satzpunkt; nach dem Punkt folgt nur noch ein Leerzeichen (vom Template-Layout her, das ein Leerzeichen zwischen „beheizt." und `{heizung_zusatz}` hat).

### Implikationen / Fallstricke

1. **Den `{heizung_zusatz}`-Platzhalter im Template manuell mit Inhalt zu füllen ist nicht möglich**, ohne in `context.js:383` den hartcodierten leeren String zu ändern.
2. **Sonderzeichen / Formatierung im Zusatz** werden 1:1 in den Heizungssatz übernommen — ein langer Zusatz kann den Satz unleserlich machen.
3. **Bindestrich-Trenner**: `heizungBasisText` benutzt `'-'` als Separator (`Gas-Zentralheizung`), die Verbindung Basis+Zusatz aber `' '` (Leerzeichen) — der Zusatz wird also durch ein Leerzeichen abgesetzt, nicht durch einen weiteren Bindestrich.
4. **Bei leerem `heizung_zusatz`** verhält sich alles unauffällig: `compactJoin` filtert leere Werte, also bleibt `heizung_text` = `heizungBasisText`, und `{heizung_zusatz}` ist sowieso leer — der Template-Satz endet einfach mit „beheizt. " (Leerzeichen nach dem Punkt aus dem Template).

## Hinweise

- **Pflichtfeld-Charakter**: Keines der Felder ist HTML-`required`. Alle direkten Output-Platzhalter (`{heizung_art_text}`, `{heizung_text}`, `{heizung_baujahr}`, `{warmwasser_bereitstellung}`, `{solarthermie}`, `{photovoltaik}`, `{aufzug}`) benutzen `T.fallback(...)`, leere Werte erscheinen als `___`. **Ausnahme**: `heizung_artikel` und `heizung_zusatz` werden **ohne** `T.fallback` ausgegeben — leer = leerer String, **kein** `___`. Das ist gewollt: ein leerer Artikel würde sonst „über `___` eine …" produzieren, und `heizung_zusatz` ist Design-bedingt leer.
- **Felder-Migration zwischen Sektionen**: `aufzug` und `heizung_zusatz` liegen aus historischen Gründen außerhalb von `haustechnik` (in `objekt` bzw. `bauteile`), gehören inhaltlich aber zur Haustechnik. Eine Reorganisation des Formulars müsste die `data-section-key`-Zuordnung anpassen, würde aber das Mapping in `context.js` nicht beeinflussen, weil dort nur `fields.<name>` gelesen wird.
- **JS-Toggle-Logik**: Bei Solar/PV/Aufzug ist das Baujahr-Feld initial `disabled` und wird via `toggleBjField(name, true/false)` aktiviert. Bei „nein" wird das Baujahr-Feld geleert/deaktiviert — `jaNein` ignoriert es ohnehin in diesem Fall.
- **Eigene Sub-Card-Optik**: Solarthermie und Photovoltaik sind im Formular als nebeneinander stehende „Sub-Cards" (orangefarbener Border-Left) gestaltet (`formular.html:1037, 1054`) — das ist eine reine HTML/CSS-Auszeichnung, hat keinen Einfluss auf den Datenfluss zum Word.
