# Bauart

Die Sektion `bauart` (im Formular `data-section-key="bauart"`, **admin-only**) ist die mit Abstand größte Sektion des Formulars und beschreibt sämtliche konstruktiven und materiellen Eigenschaften des Bauwerks. Sie umfasst Außen- und Innenwände (jeweils mit getrennten Werten für UG und EG–DG), Wandstärken (Außenwand UG/EG, Innenwand tragend/nichttragend), Decken (Kellerdecke UG und Decke EG–DG), den Dachaufbau (Form, Stuhl, Eindeckung), Fenster (Material, Verglasung, Fensterbänke außen/innen) sowie die Fassadenausprägung (Putz/Verkleidung). Darüber hinaus speisen drei Ja/Nein-Felder (`bauart_fassade_daemmung`, `bauart_kellerdecke`, `bauart_fenster_verglasung`) die energetische Beurteilung in Sektion 5 (energie_aussenwand, energie_kellerdecke, fenster_text) und beeinflussen indirekt den abgeleiteten `waermeschutz_text` in Sektion 6.

Viele Bauteile haben **UG/EG-Splits**: Die Eingaben für UG und EG–DG werden getrennt erfasst, transformiert und im Word an unterschiedlichen Zeilen ausgegeben. Außerdem werden mehrere Felder zu **abgeleiteten Texten** zusammengesetzt: `innenwand_dicke_text` (tragend + nichttragend, via `compactJoin`), `dachstuhl_text` (Dachform + Dachstuhl), `fensterText` (Fenstertyp + Verglasungs-Suffix) und `fassade` (Putz und/oder Verkleidung als Liste). Zwei Sonderfälle sind besonders wichtig: (1) `kellerdecke_label` wechselt automatisch zwischen „Kellerdecke" und „Bodenplatte" abhängig vom Feld `kellerung` aus der Sektion `objekt` — eine cross-section Abhängigkeit. (2) `bauweise` (das langform-Adjektiv „Mauerwerksbauweise" / „Stahlbetonbauweise" / „Holztafelbauweise") wird **ausschließlich aus dem EG-Wert** (`bauart_außenwand_eg`) abgeleitet und erscheint an zentralen Stellen des Gutachtens, ohne den UG-Wert zu berücksichtigen.

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `bauart_außenwand_eg` | `{aussenwand_eg}`, `{bauweise}` | Rohbau: „EG bis DG: …"; außerdem Quelle für `{bauweise}` im Ausstattungssatz (Sektion 5) und im Sektion-6-Einleitungssatz |
| `bauart_außenwand_ug` | `{aussenwand_ug}` | Rohbau: „UG: …" |
| `bauart_aussenwand_dicke_eg` | `{aussenwand_dicke_eg}` | Rohbau: „EG bis DG: {aussenwand_eg}, {aussenwand_dicke_eg}" |
| `bauart_aussenwand_dicke_ug` | `{aussenwand_dicke_ug}` | Rohbau: „UG: {aussenwand_ug}, {aussenwand_dicke_ug}" |
| `bauart_innenwand_eg` | `{innenwand_eg}` | Rohbau: „EG bis DG: …" (Innenwände) |
| `bauart_innenwand_ug` | `{innenwand_ug}` | Rohbau: „UG: …" (Innenwände) |
| `bauart_innenwand_dicke_tragend` | (Teil von `{innenwand_dicke_text}`) | Rohbau: „Wände: tragend …, nichttragend …" |
| `bauart_innenwand_dicke_nichttragend` | (Teil von `{innenwand_dicke_text}`) | Rohbau: „Wände: tragend …, nichttragend …" |
| `bauart_decke` | `{decke}` | Rohbau: „Decke über UG: …" |
| `bauart_decke_og` | `{decke_og}` | Rohbau: „Decke über EG bis DG: …" (Fallback auf `{decke}` wenn leer) |
| `bauart_dachform` | `{dachform}`, Teil von `{dachstuhl_text}` | Sektion 5 Ausstattungs-Satz „… mit {dachform}"; Sektion 6 „… {dachform}gebäude …"; Rohbau-Block (über `{dachstuhl_text}`) |
| `bauart_dachstuhl` | (Teil von `{dachstuhl_text}`) | Rohbau: „Dachstuhl: {dachform}, {dachstuhl-Begriff}" |
| `bauart_dach` | `{energie_dach}` | Sektion 5 energetischer Block: „Dach: gedämmt/ungedämmt"; speist auch `{waermeschutz_text}` |
| `bauart_dacheindeckung` | `{dacheindeckung}` | Rohbau: „Eindeckung: …" |
| `bauart_fenster` | (Teil von `{fenster_text}`) | Sektion 5 energetisch + Ausbau: „Fenster: …" (zusammen mit Verglasung) |
| `bauart_fenster_verglasung` | (Teil von `{fenster_text}`) | Sektion 5 energetisch + Ausbau (zusammen mit `bauart_fenster`); auch Quelle für `{waermeschutz_text}` |
| `bauart_fensterbaenke_außen` | `{fensterbank_aussen}` | Ausbau: „Außenfensterbänke: …" |
| `bauart_fensterbaenke_innen` | `{fensterbank_innen}` | Ausbau: „Innenfensterbänke: …" |
| `bauart_fassade_putz` | (Teil von `{fassade}`) | Rohbau: „Fassade: EG bis DG: …" |
| `bauart_fassade_verkleidung` | (Teil von `{fassade}`) | Rohbau: „Fassade: EG bis DG: …" |
| `bauart_fassade_daemmung` | `{energie_aussenwand}` | Sektion 5 energetisch: „Außenwände: gedämmt/ungedämmt"; speist `{waermeschutz_text}` |
| `bauart_kellerdecke` | `{energie_kellerdecke}` | Sektion 5 energetisch: „{kellerdecke_label}: gedämmt/ungedämmt" |

## Sub-Sektionen (folgt Form-Struktur)

### Außenwände UG/EG (Material + Dicke)

Vier Radio-Felder: `bauart_außenwand_eg`, `bauart_außenwand_ug`, `bauart_aussenwand_dicke_eg`, `bauart_aussenwand_dicke_ug`. Materialien werden über `toDisplayBauweise` zum Kurzbegriff (z.B. „Stahlbeton") und ergeben pro Geschoss einen eigenen Output-Key. Wichtig: **Aus dem EG-Material wird zusätzlich der Langbegriff `{bauweise}` abgeleitet** (z.B. „Stahlbetonbauweise") — der UG-Wert geht hier nicht ein.

### Innenwände UG/EG (Material + Dicke tragend/nichttragend)

Vier Radio-Felder: `bauart_innenwand_eg`, `bauart_innenwand_ug`, `bauart_innenwand_dicke_tragend`, `bauart_innenwand_dicke_nichttragend`. Die beiden Dicke-Felder werden im Code zu **einem zusammengesetzten Text** `innenwand_dicke_text` verschmolzen (z.B. „tragend >24cm dick, nichttragend 11,5-24cm dick").

### Decken (UG/EG + DG/OG)

Zwei Radio-Felder: `bauart_decke` (UG/Kellerdecke) und `bauart_decke_og` (EG bis DG). Beide haben dieselben vier Optionen (Beton, Stahlbeton, Holz, Holzbalkendecke). Besonderheit: Ist `bauart_decke_og` leer, **fällt `{decke_og}` auf den UG-Wert (`{decke}`) zurück** — beide Zeilen zeigen dann dasselbe.

### Dach (Form, Status, Stuhl, Eindeckung)

Vier Felder: `bauart_dachform` (6 Optionen), `bauart_dachstuhl` (4 Optionen), `bauart_dach` (ja/nein → Dämmungsstatus) und `bauart_dacheindeckung` (5 Optionen). Dachform + Dachstuhl werden zu `dachstuhl_text` zusammengejoint; `bauart_dach` füttert `{energie_dach}`.

### Fenster (Typ + Verglasung + Fensterbänke)

Vier Felder: `bauart_fenster` (Holz/Kunststoff/Alu), `bauart_fenster_verglasung` (ja/nein für 2-fach), `bauart_fensterbaenke_außen` (Alu/Stein), `bauart_fensterbaenke_innen` (Holz/Stein). `bauart_fenster` + `bauart_fenster_verglasung` werden zu `fensterText` kombiniert (mit drei verschiedenen Suffix-Varianten je nach Verglasungs-Eingabe).

### Fassade (zwei Optik-Felder + Dämmungs-Feld)

Drei Felder: `bauart_fassade_putz` (ja/nein), `bauart_fassade_verkleidung` (ja/nein) → werden in der **Liste `fassadeListe`** kombiniert (durch Komma getrennt, leere Werte gefiltert). Drittes Feld `bauart_fassade_daemmung` (ja/nein) **erscheint nicht in `{fassade}`** — es geht ausschließlich in das energetische Feld `{energie_aussenwand}`.

### Energetischer Zustand (Dämmung Fassade, Kellerdecke, Verglasung)

Drei Ja/Nein-Felder, die nicht direkt im Rohbau-Block, sondern in der energetischen Aufzählung in Sektion 5 ausgegeben werden:
- `bauart_fassade_daemmung` → `{energie_aussenwand}` („gedämmt"/„ungedämmt"/leer)
- `bauart_kellerdecke` → `{energie_kellerdecke}` (zusammen mit dynamischem Label `{kellerdecke_label}` → „Kellerdecke" oder „Bodenplatte")
- `bauart_fenster_verglasung` → fließt in `{fenster_text}` ein (verändert das Suffix)

Alle drei wirken zusätzlich indirekt auf `{waermeschutz_text}` in Sektion 6, der einen narrativen Satz über den Wärmeschutz baut.

## Felder im Detail

### `bauart_außenwand_eg`

- **Label im Formular**: „Außenwände EG – DG"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `beton` → `{aussenwand_eg}` = „Stahlbeton"; `{bauweise}` = „Stahlbetonbauweise"
  - `mauerwerk` → `{aussenwand_eg}` = „Mauerwerk"; `{bauweise}` = „Mauerwerksbauweise"
  - `holztafel` → `{aussenwand_eg}` = „Holztafelbauweise"; `{bauweise}` = „Holztafelbauweise"
- **Quelle**: `formular.html:678-693`
- **Mapping (Context)**: `lib/docx/context.js:143` — `const aussenwandEg = T.toDisplayBauweise(fields.bauart_außenwand_eg);` und `lib/docx/context.js:147` — `const bauweiseLang = T.toDisplayBauweiseLang(fields.bauart_außenwand_eg);`
- **Transformer**:
  - `toDisplayBauweise` ([`lib/transformers.js:295-298`](../../lib/transformers.js)) — `{ beton: 'Stahlbeton', mauerwerk: 'Mauerwerk', holztafel: 'Holztafelbauweise' }`
  - `toDisplayBauweiseLang` ([`lib/transformers.js:300-303`](../../lib/transformers.js)) — `{ beton: 'Stahlbetonbauweise', mauerwerk: 'Mauerwerksbauweise', holztafel: 'Holztafelbauweise' }`
- **Output-Key(s)**: `aussenwand_eg` (Zeile 352), `bauweise` (Zeile 356) — beide via `T.fallback(...)`.
- **Template-Platzhalter**: `{aussenwand_eg}` (einmal), `{bauweise}` (zweimal)
- **Word-Kontext** (Zitate):
  > EG bis DG:{aussenwand_eg}, {aussenwand_dicke_eg}
  > (`_template_extract.md:393`)
  >
  > Der Ausstattungsgrad des {kellerung_adj}, in {bauweise} errichteten {gebaeude_form_gen} mit {dachform} ist {ausstattungsgrad} …
  > (`_template_extract.md:265`)
  >
  > Das {gebaeude_typ} wurde {baujahr} als {bautechnik_einleitung} in baujahrestypischer {bauweise} gebaut.
  > (`_template_extract.md:587`)
- **Auswirkung**: Bei `mauerwerk` erscheint im Rohbau-Block „EG bis DG: Mauerwerk, …" und in Sektion 5/6 „… in Mauerwerksbauweise errichteten …" bzw. „… in baujahrestypischer Mauerwerksbauweise gebaut." Bei `beton` (Stahlbeton-Logik!) wird daraus „… in Stahlbetonbauweise …".
- **Besonderheiten**: **Doppelte Wirkung**: füttert sowohl die UG/EG-Split-Zeile als auch zwei zentrale Beschreibungssätze (Sektion 5 + 6) über `{bauweise}`. Der **UG-Wert wird hier ignoriert** — das Gutachten beschreibt die Bauweise also immer aus EG-Sicht. Achtung: der Feldname enthält **das Umlaut `ä`** (`bauart_außenwand_eg`).

### `bauart_außenwand_ug`

- **Label im Formular**: „Außenwände UG"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `beton` → „Stahlbeton"
  - `mauerwerk` → „Mauerwerk"
  - `holztafel` → „Holztafelbauweise"
- **Quelle**: `formular.html:694-710`
- **Mapping (Context)**: `lib/docx/context.js:144` — `const aussenwandUg = T.toDisplayBauweise(fields.bauart_außenwand_ug);`
- **Transformer**: `toDisplayBauweise` ([`lib/transformers.js:295-298`](../../lib/transformers.js))
- **Output-Key(s)**: `aussenwand_ug` (Zeile 353) via `T.fallback(...)`.
- **Template-Platzhalter**: `{aussenwand_ug}`
- **Word-Kontext**:
  > UG:{aussenwand_ug}, {aussenwand_dicke_ug}
  > (`_template_extract.md:391`)
- **Auswirkung**: Bei `mauerwerk` → „UG: Mauerwerk, …". Bei leerem Feld → „UG: ___, …".
- **Besonderheiten**: **Hat keinen Einfluss auf `{bauweise}`** — nur `bauart_außenwand_eg` füttert die Langform. Der UG-Wert erscheint **nur** im Rohbau-Block. Wie beim EG-Feld: Feldname mit Umlaut `ä`.

### `bauart_aussenwand_dicke_eg`

- **Label im Formular**: „Außenwand-Stärke EG–DG"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `>24cm` → „>24cm dick"
  - `11,5-24cm` → „11,5-24cm dick"
  - `<11,5cm` → „<11,5cm dick"
- **Quelle**: `formular.html:826-832`
- **Mapping (Context)**: `lib/docx/context.js:145` — `const aussenwandDickeEg = T.toDisplayWandstaerke(fields.bauart_aussenwand_dicke_eg);`
- **Transformer**: `toDisplayWandstaerke` ([`lib/transformers.js:236-240`](../../lib/transformers.js)) — hängt einfach „ dick" hinten an, oder gibt `''` zurück bei leerer Eingabe.
- **Output-Key(s)**: `aussenwand_dicke_eg` (Zeile 354) via `T.fallback(...)`.
- **Template-Platzhalter**: `{aussenwand_dicke_eg}`
- **Word-Kontext**:
  > EG bis DG:{aussenwand_eg}, {aussenwand_dicke_eg}
  > (`_template_extract.md:393`)
- **Auswirkung**: Bei `11,5-24cm` → „EG bis DG: Mauerwerk, 11,5-24cm dick". Bei leerer Eingabe → „EG bis DG: Mauerwerk, ___".
- **Besonderheiten**: Wertet **nur den UG/EG-Split** mit Komma getrennt im Word; das Suffix „ dick" wird vom Transformer eingehängt, also nicht im Template selbst.

### `bauart_aussenwand_dicke_ug`

- **Label im Formular**: „Außenwand-Stärke UG"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**: `>24cm`, `11,5-24cm`, `<11,5cm` (jeweils + „ dick")
- **Quelle**: `formular.html:833-840`
- **Mapping (Context)**: `lib/docx/context.js:146` — `const aussenwandDickeUg = T.toDisplayWandstaerke(fields.bauart_aussenwand_dicke_ug);`
- **Transformer**: `toDisplayWandstaerke` ([`lib/transformers.js:236-240`](../../lib/transformers.js))
- **Output-Key(s)**: `aussenwand_dicke_ug` (Zeile 355) via `T.fallback(...)`.
- **Template-Platzhalter**: `{aussenwand_dicke_ug}`
- **Word-Kontext**:
  > UG:{aussenwand_ug}, {aussenwand_dicke_ug}
  > (`_template_extract.md:391`)
- **Auswirkung**: Bei `>24cm` → „UG: Stahlbeton, >24cm dick".
- **Besonderheiten**: Zwillingsfeld zu `bauart_aussenwand_dicke_eg`, identische Logik.

### `bauart_innenwand_eg`

- **Label im Formular**: „Innenwände EG – DG"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `trockenbau` → „Trockenbau"
  - `mauerwerk` → „Mauerwerk"
  - `holztafel` → „Holztafelbauweise"
- **Quelle**: `formular.html:757-771`
- **Mapping (Context)**: `lib/docx/context.js:148` — `const innenwandEgText = T.toDisplayInnenwand(fields.bauart_innenwand_eg);`
- **Transformer**: `toDisplayInnenwand` ([`lib/transformers.js:305-308`](../../lib/transformers.js)) — `{ trockenbau: 'Trockenbau', mauerwerk: 'Mauerwerk', holztafel: 'Holztafelbauweise' }`
- **Output-Key(s)**: `innenwand_eg` (Zeile 357) via `T.fallback(...)`.
- **Template-Platzhalter**: `{innenwand_eg}`
- **Word-Kontext**:
  > EG bis DG:{innenwand_eg}
  > (`_template_extract.md:401`)
- **Auswirkung**: Bei `trockenbau` → „EG bis DG: Trockenbau". Bei leerem Feld → „EG bis DG: ___".
- **Besonderheiten**: Eigene Optionsliste im Vergleich zu `bauart_außenwand_eg` — hier statt „Beton" gibt es „Trockenbau", da Innenwände andere typische Konstruktionsarten haben.

### `bauart_innenwand_ug`

- **Label im Formular**: „Innenwände UG"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**: `trockenbau` → „Trockenbau", `mauerwerk` → „Mauerwerk", `holztafel` → „Holztafelbauweise"
- **Quelle**: `formular.html:773-789`
- **Mapping (Context)**: `lib/docx/context.js:149` — `const innenwandUgText = T.toDisplayInnenwand(fields.bauart_innenwand_ug);`
- **Transformer**: `toDisplayInnenwand` ([`lib/transformers.js:305-308`](../../lib/transformers.js))
- **Output-Key(s)**: `innenwand_ug` (Zeile 358) via `T.fallback(...)`.
- **Template-Platzhalter**: `{innenwand_ug}`
- **Word-Kontext**:
  > UG:{innenwand_ug}
  > (`_template_extract.md:399`)
- **Auswirkung**: Bei `mauerwerk` → „UG: Mauerwerk". Bei leerem Feld → „UG: ___".
- **Besonderheiten**: Zwillingsfeld zu `bauart_innenwand_eg`.

### `bauart_innenwand_dicke_tragend`

- **Label im Formular**: „Innenwand-Stärke tragend"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**: `>24cm`, `11,5-24cm`, `<11,5cm` (jeweils + „ dick")
- **Quelle**: `formular.html:843-851`
- **Mapping (Context)**: `lib/docx/context.js:150` — `const innenwandDickeTragend = T.toDisplayWandstaerke(fields.bauart_innenwand_dicke_tragend);`
- **Transformer**: `toDisplayWandstaerke` ([`lib/transformers.js:236-240`](../../lib/transformers.js))
- **Output-Key(s)**: kein eigener Output-Key — fließt in `innenwand_dicke_text` (Zeile 359) ein.
- **Template-Platzhalter**: (Teil von `{innenwand_dicke_text}`)
- **Aufbau im Code** (`lib/docx/context.js:152-155`):
  ```js
  const innenwandDickeText = T.compactJoin([
    innenwandDickeTragend ? `tragend ${innenwandDickeTragend}` : '',
    innenwandDickeNichttragend ? `nichttragend ${innenwandDickeNichttragend}` : ''
  ], ', ');
  ```
- **Word-Kontext** (zusammen mit `bauart_innenwand_dicke_nichttragend`):
  > Wände:{innenwand_dicke_text}
  > (`_template_extract.md:403`)
- **Auswirkung**:
  - `bauart_innenwand_dicke_tragend = ">24cm"` und `bauart_innenwand_dicke_nichttragend = "<11,5cm"` → `{innenwand_dicke_text}` = „tragend >24cm dick, nichttragend <11,5cm dick"
  - Nur `bauart_innenwand_dicke_tragend = ">24cm"` (nichttragend leer) → „tragend >24cm dick"
  - Beide leer → `___` (über `T.fallback`)
- **Besonderheiten**: Wird mit `bauart_innenwand_dicke_nichttragend` kombiniert — leere Teile werden via `compactJoin` weggefiltert; das Wort „tragend " wird im Code als Präfix gesetzt.

### `bauart_innenwand_dicke_nichttragend`

- **Label im Formular**: „Innenwand-Stärke nichttragend"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**: `>24cm`, `11,5-24cm`, `<11,5cm` (jeweils + „ dick")
- **Quelle**: `formular.html:852-859`
- **Mapping (Context)**: `lib/docx/context.js:151` — `const innenwandDickeNichttragend = T.toDisplayWandstaerke(fields.bauart_innenwand_dicke_nichttragend);`
- **Transformer**: `toDisplayWandstaerke` ([`lib/transformers.js:236-240`](../../lib/transformers.js))
- **Output-Key(s)**: kein eigener Key — wird zu `innenwand_dicke_text` gejoined (siehe oben).
- **Template-Platzhalter**: (Teil von `{innenwand_dicke_text}`)
- **Word-Kontext**: siehe `bauart_innenwand_dicke_tragend`.
- **Auswirkung**: Bei `11,5-24cm` (gemeinsam mit tragendem `>24cm`) → „tragend >24cm dick, nichttragend 11,5-24cm dick". Allein gesetzt → „nichttragend 11,5-24cm dick".
- **Besonderheiten**: Wird durch `compactJoin([…], ', ')` mit Komma separiert; das Wort „nichttragend " kommt als Präfix vom Code, nicht vom Template.

### `bauart_decke`

- **Label im Formular**: „Decke UG (Kellerdecke)"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `beton` → „Beton"
  - `stahlbeton` → „Stahlbeton"
  - `holz` → „Holz"
  - `holzbalken` → „Holzbalkendecke"
- **Quelle**: `formular.html:863-871`
- **Mapping (Context)**: `lib/docx/context.js:156` — `const deckeText = T.toDisplayDecke(fields.bauart_decke);`
- **Transformer**: `toDisplayDecke` ([`lib/transformers.js:310-318`](../../lib/transformers.js)) — `{ beton: 'Beton', stahlbeton: 'Stahlbeton', holz: 'Holz', holzbalken: 'Holzbalkendecke' }`
- **Output-Key(s)**: `decke` (Zeile 360) via `T.fallback(...)`.
- **Template-Platzhalter**: `{decke}`
- **Word-Kontext**:
  > Decke über UG:{decke}
  > (`_template_extract.md:411`)
- **Auswirkung**: Bei `stahlbeton` → „Decke über UG: Stahlbeton". Bei `holzbalken` → „Decke über UG: Holzbalkendecke".
- **Besonderheiten**: **Außerdem Fallback-Quelle für `{decke_og}`**: Ist `bauart_decke_og` leer, übernimmt `{decke_og}` automatisch den Wert von `{decke}`. So zeigen UG- und EG-Decke beide denselben Wert, wenn nur die UG-Decke ausgefüllt wurde.

### `bauart_decke_og`

- **Label im Formular**: „Decke EG bis DG"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**: identisch zu `bauart_decke` (`beton` → „Beton", `stahlbeton` → „Stahlbeton", `holz` → „Holz", `holzbalken` → „Holzbalkendecke")
- **Quelle**: `formular.html:872-880`
- **Mapping (Context)**: `lib/docx/context.js:157` — `const deckeOgText = T.toDisplayDecke(fields.bauart_decke_og) || deckeText;`
- **Transformer**: `toDisplayDecke` ([`lib/transformers.js:310-318`](../../lib/transformers.js))
- **Output-Key(s)**: `decke_og` (Zeile 361) via `T.fallback(...)`.
- **Template-Platzhalter**: `{decke_og}`
- **Word-Kontext**:
  > Decke über EG bis DG:{decke_og}
  > (`_template_extract.md:413`)
- **Auswirkung**:
  - `bauart_decke_og = "holzbalken"` → „Decke über EG bis DG: Holzbalkendecke"
  - `bauart_decke_og` leer, aber `bauart_decke = "stahlbeton"` → „Decke über EG bis DG: Stahlbeton" (Fallback aktiv)
  - Beide leer → „Decke über EG bis DG: ___"
- **Besonderheiten**: **Fallback-Logik mit `|| deckeText`** — wenn das EG-Decke-Feld leer ist, wird der UG-Wert übernommen. Dies vermeidet, dass die EG-Zeile leer ausgegeben wird, wenn der Gutachter nur die Kellerdecke spezifiziert hat.

### `bauart_dachform`

- **Label im Formular**: „Dachform"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `sattel` → „Satteldach"
  - `mansard` → „Mansarddach"
  - `walm` → „Walmdach"
  - `kruppelwalm` → „Krüppelwalmdach"
  - `pult` → „Pultdach"
  - `flach` → „Flachdach"
- **Quelle**: `formular.html:885-893`
- **Mapping (Context)**: `lib/docx/context.js:159` — `const dachform = T.toDisplayDachform(fields.bauart_dachform);`
- **Transformer**: `toDisplayDachform` ([`lib/transformers.js:45-55`](../../lib/transformers.js))
- **Output-Key(s)**: `dachform` (Zeile 362) via `T.fallback(...)`. Außerdem Bestandteil von `dachstuhl_text` (Zeile 160) und `bautechnik_einleitung` (Zeile 253-257).
- **Template-Platzhalter**: `{dachform}`, sowie indirekt in `{dachstuhl_text}` und `{bautechnik_einleitung}`
- **Word-Kontext**:
  > … mit {dachform} ist {ausstattungsgrad} …
  > (`_template_extract.md:265`)
  >
  > Dachstuhl:{dachstuhl_text}
  > (`_template_extract.md:431`)
  >
  > Das {gebaeude_typ} wurde {baujahr} als {bautechnik_einleitung} in baujahrestypischer {bauweise} gebaut.
  > (`_template_extract.md:587` — `bautechnik_einleitung` enthält z.B. „Satteldachgebäude")
  >
  > Das Gebäude ist ein {gebaeude_form} und besteht aus einem … Gebäude mit {dachform}.
  > (in `{gebaeude_kurzbeschreibung}`, `_template_extract.md:257`)
- **Auswirkung**: Bei `sattel` erscheint überall „Satteldach": Im Ausstattungssatz („… mit Satteldach …"), im Rohbau-Block (über `{dachstuhl_text}`: „Satteldach, Holzkonstruktion"), in Sektion 6 (über `bautechnik_einleitung`: „… als zweigeschossiges Satteldachgebäude mit Unterkellerung in baujahrestypischer Mauerwerksbauweise gebaut."). Bei `kruppelwalm` → „Krüppelwalmdach" (mit Umlaut).
- **Besonderheiten**: **Vielfach-Verwendung**: erscheint an mindestens 4 verschiedenen Stellen, davon 3 indirekt über abgeleitete Texte. Wert `kruppelwalm` (ohne ü) wird zu „Krüppelwalmdach" (mit Ü) — der Transformer korrigiert die Schreibweise.

### `bauart_dachstuhl`

- **Label im Formular**: „Dachstuhl"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `holz` → „Holzkonstruktion"
  - `binder` → „Binderkonstruktion"
  - `pfetten` → „Pfettendach, Holzkonstruktion"
  - `stahlbeton` → „Stahlbetonkonstruktion"
- **Quelle**: `formular.html:895-903`
- **Mapping (Context)**: `lib/docx/context.js:160` — `const dachstuhlText = T.compactJoin([dachform, T.toDisplayDachstuhl(fields.bauart_dachstuhl)], ', ');`
- **Transformer**: `toDisplayDachstuhl` ([`lib/transformers.js:57-65`](../../lib/transformers.js))
- **Output-Key(s)**: kein eigener Key — fließt in `dachstuhl_text` (Zeile 363) ein.
- **Template-Platzhalter**: (Teil von `{dachstuhl_text}`)
- **Aufbau im Code**:
  ```js
  const dachstuhlText = T.compactJoin([
    dachform,
    T.toDisplayDachstuhl(fields.bauart_dachstuhl)
  ], ', ');
  ```
- **Word-Kontext**:
  > Dachstuhl:{dachstuhl_text}
  > (`_template_extract.md:431`)
- **Auswirkung** (Beispiele):
  - `bauart_dachform=sattel`, `bauart_dachstuhl=holz` → `{dachstuhl_text}` = „Satteldach, Holzkonstruktion"
  - `bauart_dachform=mansard`, `bauart_dachstuhl=pfetten` → „Mansarddach, Pfettendach, Holzkonstruktion"
  - `bauart_dachform=flach`, `bauart_dachstuhl=stahlbeton` → „Flachdach, Stahlbetonkonstruktion"
  - Nur `bauart_dachform=walm`, Dachstuhl leer → „Walmdach"
  - Beide leer → `___` (via `T.fallback`)
- **Besonderheiten**: **`compactJoin` filtert leere Teile** — fehlt eines der beiden Felder, wird das andere allein ausgegeben (ohne Komma); beide leer → Platzhalter. Beachte: Die Option `pfetten` enthält bereits ein Komma in der Übersetzung („Pfettendach, Holzkonstruktion"), was zu einer dreigliedrigen Komma-Liste führen kann, wenn auch eine Dachform gesetzt ist.

### `bauart_dach`

- **Label im Formular**: „Dach / Spitzboden gedämmt"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `ja` → „gedämmt"
  - `nein` → „ungedämmt"
  - (leer) → `''` (leere Zeichenkette, wird durch `T.fallback` zu `___`)
- **Quelle**: `formular.html:809-822`
- **Mapping (Context)**: `lib/docx/context.js:158` — `const dachZustand = T.toDisplayDachStatus(fields.bauart_dach);`
- **Transformer**: `toDisplayDachStatus` ([`lib/transformers.js:320-325`](../../lib/transformers.js))
- **Output-Key(s)**: `energie_dach` (Zeile 373) via `T.fallback(...)`. Außerdem fließt der Wert über die `dachGedaemmt`-Auswertung in `lib/docx/context.js:56` direkt in `buildWaermeschutzText` ein.
- **Template-Platzhalter**: `{energie_dach}`
- **Word-Kontext**:
  > - Dach:{energie_dach}
  > (`_template_extract.md:283`)
  >
  > (indirekt in `{waermeschutz_text}`, Sektion 6)
- **Auswirkung**:
  - `ja` → „Dach: gedämmt"; gemeinsam mit `bauart_fassade_daemmung=nein` ergibt `{waermeschutz_text}` z.B. „Das Dach ist gedämmt, die Wände sind nicht zusätzlich gedämmt. …"
  - `nein` → „Dach: ungedämmt"
  - (leer) → „Dach: ___"
- **Besonderheiten**: **Crossreferenz**: speist sowohl die energetische Stichpunkt-Liste in Sektion 5 als auch den narrativen Wärmeschutzsatz in Sektion 6. Im Wärmeschutz-Satz wird das Feld kombiniert mit `bauart_fassade_daemmung` und (falls `ctx.istUnterkellert`) anders formuliert: „Weder der Keller noch das Dach sind zusätzlich gedämmt." vs. „Weder das Dach noch die Wände sind zusätzlich gedämmt." (siehe `lib/transformers.js`/`context.js:54-75`).

### `bauart_dacheindeckung`

- **Label im Formular**: „Dacheindeckung / Ziegel"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `beton` → „Betonziegel"
  - `ton` → „Tonziegel"
  - `faserzement` → „Faserzement"
  - `bitumen` → „Bitumen"
  - `folie` → „Folie"
- **Quelle**: `formular.html:908-931`
- **Mapping (Context)**: `lib/docx/context.js:161` — `const dacheindeckungText = T.toDisplayDacheindeckung(fields.bauart_dacheindeckung);`
- **Transformer**: `toDisplayDacheindeckung` ([`lib/transformers.js:327-336`](../../lib/transformers.js))
- **Output-Key(s)**: `dacheindeckung` (Zeile 364) via `T.fallback(...)`.
- **Template-Platzhalter**: `{dacheindeckung}`
- **Word-Kontext**:
  > Eindeckung:{dacheindeckung}
  > (`_template_extract.md:433`)
- **Auswirkung**: Bei `beton` → „Eindeckung: Betonziegel"; bei `ton` → „Eindeckung: Tonziegel"; bei `folie` → „Eindeckung: Folie"; leer → „Eindeckung: ___".
- **Besonderheiten**: Beachte die Mapping-Nuance: `beton` wird hier zu „Betonziegel" (Suffix „ziegel"), während bei `bauart_außenwand_eg` derselbe Schlüssel `beton` zu „Stahlbeton" wird. Pro Bauteilfeld ein separater Transformer mit eigenem Vokabular.

### `bauart_fenster`

- **Label im Formular**: „Fenster"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `holz` → „Holzfenster"
  - `kunststoff` → „Kunststofffenster"
  - `alu` → „Aluminiumfenster"
- **Quelle**: `formular.html:935-950`
- **Mapping (Context)**: `lib/docx/context.js:162` — `const fensterTyp = T.toDisplayFensterNominativ(fields.bauart_fenster);`
- **Transformer**: `toDisplayFensterNominativ` ([`lib/transformers.js:338-341`](../../lib/transformers.js))
- **Output-Key(s)**: kein eigener Key — fließt in `fenster_text` (Zeile 365) und in `{waermeschutz_text}` (über `ctx.fensterTyp`, Sektion 6) ein.
- **Template-Platzhalter**: (Teil von `{fenster_text}`)
- **Aufbau im Code** (`lib/docx/context.js:178-182`):
  ```js
  const fensterText = fensterTyp
    ? (fensterIst2fach
        ? `${fensterTyp}, 2-fach-Verglasung`
        : (fensterVerglasung === 'nein' ? `${fensterTyp}, einfach verglast` : fensterTyp))
    : '';
  ```
- **Word-Kontext** (zwei Stellen):
  > - Fenster:{fenster_text}
  > (`_template_extract.md:287`, energetische Liste in Sektion 5)
  >
  > Wohnung:{fenster_text}, {fenster_zusatz}
  > (`_template_extract.md:467`, Ausbau-Block)
- **Auswirkung**:
  - `bauart_fenster=holz`, `bauart_fenster_verglasung=ja` → `{fenster_text}` = „Holzfenster, 2-fach-Verglasung"
  - `bauart_fenster=kunststoff`, `bauart_fenster_verglasung=nein` → „Kunststofffenster, einfach verglast"
  - `bauart_fenster=alu`, `bauart_fenster_verglasung` leer → „Aluminiumfenster" (ohne Verglasungs-Suffix)
  - `bauart_fenster` leer → `___` (egal was bei Verglasung steht)
- **Besonderheiten**: Wird gemeinsam mit `bauart_fenster_verglasung` zu `{fenster_text}` kombiniert. Zudem speist `fensterTyp` (z.B. „Holzfenster") in `buildWaermeschutzText` (Sektion 6), der einen Satz wie „Die Holzfenster sind 2-fach verglast ohne weitere Anforderungen." baut (`lib/docx/context.js:69-72`).

### `bauart_fenster_verglasung`

- **Label im Formular**: „2-fach-Verglasung"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `ja` → Suffix „, 2-fach-Verglasung" wird an `{fenster_text}` angehängt; im `waermeschutz_text` „2-fach verglast"
  - `nein` → Suffix „, einfach verglast" wird angehängt; im `waermeschutz_text` „einfach verglast"
  - (leer) → kein Suffix; im `waermeschutz_text` wird ebenfalls „einfach verglast" (Fallback `fensterIst2fach=false`) verwendet
- **Quelle**: `formular.html:952-964`
- **Mapping (Context)**: `lib/docx/context.js:176-177`:
  ```js
  const fensterVerglasung = T.str(fields.bauart_fenster_verglasung).toLowerCase();
  const fensterIst2fach = fensterVerglasung === 'ja';
  ```
- **Transformer**: Keiner — der Code in `context.js:178-182` konvertiert direkt.
- **Output-Key(s)**: kein eigener Key — fließt in `fenster_text` (Zeile 365) ein. Setzt zusätzlich `ctx.fensterIst2fach` (boolean), das `buildWaermeschutzText` nutzt.
- **Template-Platzhalter**: (Teil von `{fenster_text}`)
- **Word-Kontext**: siehe `bauart_fenster`.
- **Auswirkung** (drei Zustände):
  1. **`ja`** + `bauart_fenster=holz` → `{fenster_text}` = „Holzfenster, 2-fach-Verglasung"; `{waermeschutz_text}` enthält „Die Holzfenster sind 2-fach verglast ohne weitere Anforderungen."
  2. **`nein`** + `bauart_fenster=holz` → „Holzfenster, einfach verglast"; `{waermeschutz_text}` enthält „Die Holzfenster sind einfach verglast ohne weitere Anforderungen."
  3. **(leer)** + `bauart_fenster=holz` → „Holzfenster" (kein Verglasungs-Suffix); `{waermeschutz_text}` behandelt das wie `nein` (Fallback `fensterIst2fach=false`) → „… einfach verglast …"
- **Besonderheiten**: **Drei-Zustands-Logik**: leer ≠ „nein" für `{fenster_text}`, aber leer ≈ „nein" für `{waermeschutz_text}`. Wenn `bauart_fenster` leer ist, bleibt `{fenster_text}` insgesamt leer (`___`), egal was bei der Verglasung eingegeben wurde.

### `bauart_fensterbaenke_außen`

- **Label im Formular**: „Fensterbänke außen"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `alu` → „Aluminium"
  - `stein` → „Stein"
- **Quelle**: `formular.html:968-980`
- **Mapping (Context)**: `lib/docx/context.js:163` — `const fensterbankAussen = T.toDisplayFensterbankAussen(fields.bauart_fensterbaenke_außen);`
- **Transformer**: `toDisplayFensterbankAussen` ([`lib/transformers.js:343-346`](../../lib/transformers.js))
- **Output-Key(s)**: `fensterbank_aussen` (Zeile 367) via `T.fallback(...)`.
- **Template-Platzhalter**: `{fensterbank_aussen}`
- **Word-Kontext**:
  > Außenfensterbänke:{fensterbank_aussen}
  > (`_template_extract.md:471`)
- **Auswirkung**: Bei `alu` → „Außenfensterbänke: Aluminium"; bei `stein` → „Außenfensterbänke: Stein"; leer → „Außenfensterbänke: ___".
- **Besonderheiten**: Feldname enthält **Umlaut `ä`** (`bauart_fensterbaenke_außen` — mit `ae` in „fensterbaenke" aber `ß` in „außen"). Beachte den Unterschied zur Innen-Variante: außen `alu` → „Aluminium", innen `holz` → „Holz".

### `bauart_fensterbaenke_innen`

- **Label im Formular**: „Fensterbänke innen"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `holz` → „Holz"
  - `stein` → „Stein"
- **Quelle**: `formular.html:981-993`
- **Mapping (Context)**: `lib/docx/context.js:164` — `const fensterbankInnen = T.toDisplayFensterbankInnen(fields.bauart_fensterbaenke_innen);`
- **Transformer**: `toDisplayFensterbankInnen` ([`lib/transformers.js:348-351`](../../lib/transformers.js))
- **Output-Key(s)**: `fensterbank_innen` (Zeile 368) via `T.fallback(...)`.
- **Template-Platzhalter**: `{fensterbank_innen}`
- **Word-Kontext**:
  > Innenfensterbänke:{fensterbank_innen}
  > (`_template_extract.md:469`)
- **Auswirkung**: Bei `holz` → „Innenfensterbänke: Holz"; bei `stein` → „Innenfensterbänke: Stein"; leer → „Innenfensterbänke: ___".
- **Besonderheiten**: Innen-Optionen unterscheiden sich von außen (innen: holz/stein vs. außen: alu/stein) — typische Material-Verwendung bei Fensterbänken.

### `bauart_fassade_putz`

- **Label im Formular**: „Fassade — Putz"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `ja` → Eintrag „Putz" wird zur `fassadeListe` hinzugefügt
  - `nein` → nichts wird hinzugefügt
  - (leer) → nichts wird hinzugefügt
- **Quelle**: `formular.html:727-738`
- **Mapping (Context)**: `lib/docx/context.js:165-166`:
  ```js
  const fassadeListe = T.toDisplayFassade(fields);
  const fassadeText = fassadeListe.length ? fassadeListe.join(', ') : '';
  ```
- **Transformer**: `toDisplayFassade` ([`lib/transformers.js:388-393`](../../lib/transformers.js)):
  ```js
  function toDisplayFassade(fields) {
    const out = [];
    if (str(fields.bauart_fassade_putz).toLowerCase() === 'ja') out.push('Putz');
    if (str(fields.bauart_fassade_verkleidung).toLowerCase() === 'ja') out.push('Verkleidung');
    return out;
  }
  ```
- **Output-Key(s)**: kein eigener Key — fließt in `fassade` (Zeile 369) ein.
- **Template-Platzhalter**: (Teil von `{fassade}`)
- **Word-Kontext**:
  > Fassade:
  > EG bis DG:{fassade}
  > (`_template_extract.md:437-439`)
- **Auswirkung** (Kombinationen mit `bauart_fassade_verkleidung`):
  - Beide `ja` → `{fassade}` = „Putz, Verkleidung"
  - Nur `bauart_fassade_putz=ja` → „Putz"
  - Nur `bauart_fassade_verkleidung=ja` → „Verkleidung"
  - Beide `nein` oder beide leer → `___` (über `T.fallback`)
- **Besonderheiten**: **Mehrere Ja/Nein-Felder → Liste**: `toDisplayFassade` baut ein Array nur aus den Einträgen, bei denen `ja` gesetzt ist. `nein` und leere Werte werden gleich behandelt (= weggelassen). Die Liste wird in `context.js:166` mit `, ` gejoined.

### `bauart_fassade_verkleidung`

- **Label im Formular**: „Fassade — Verkleidung"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**: `ja` → „Verkleidung" in Liste; `nein`/leer → nichts.
- **Quelle**: `formular.html:740-752`
- **Mapping (Context)**: `lib/docx/context.js:165-166` (siehe `bauart_fassade_putz`)
- **Transformer**: `toDisplayFassade` (siehe oben)
- **Output-Key(s)**: Teil von `fassade` (Zeile 369) via `T.fallback(...)`.
- **Template-Platzhalter**: (Teil von `{fassade}`)
- **Word-Kontext**: siehe `bauart_fassade_putz`.
- **Auswirkung**: Wenn `ja` → fügt „Verkleidung" ein. Kombinierte Beispiele oben.
- **Besonderheiten**: Spielt mit `bauart_fassade_putz` zusammen — beide Felder zusammen entscheiden über den Inhalt von `{fassade}`. Wichtig: **`bauart_fassade_daemmung` taucht NICHT in `{fassade}` auf** (siehe nächstes Feld), nur die optischen Fassaden-Aspekte (Putz/Verkleidung).

### `bauart_fassade_daemmung`

- **Label im Formular**: „Fassade gedämmt"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `ja` → `{energie_aussenwand}` = „gedämmt"
  - `nein` → `{energie_aussenwand}` = „ungedämmt"
  - (leer) → `{energie_aussenwand}` = `''` (→ `___` durch `T.fallback`)
- **Quelle**: `formular.html:714-725`
- **Mapping (Context)**: `lib/docx/context.js:169-171`:
  ```js
  const fassadeDaemmung = T.str(fields.bauart_fassade_daemmung).toLowerCase();
  const energieAussenwand = fassadeDaemmung === 'ja' ? 'gedämmt'
    : (fassadeDaemmung === 'nein' ? 'ungedämmt' : '');
  ```
- **Transformer**: Keiner — Inline-Konvertierung im Context. Außerdem flieβt das Feld über die `fassadeGedaemmt`-Auswertung in `lib/docx/context.js:57` in `buildWaermeschutzText` ein.
- **Output-Key(s)**: `energie_aussenwand` (Zeile 372) via `T.fallback(...)`.
- **Template-Platzhalter**: `{energie_aussenwand}`
- **Word-Kontext**:
  > - Außenwände: {energie_aussenwand}
  > (`_template_extract.md:281`)
  >
  > (indirekt in `{waermeschutz_text}`, Sektion 6)
- **Auswirkung**:
  - `ja` → „Außenwände: gedämmt"
  - `nein` → „Außenwände: ungedämmt"
  - (leer) → „Außenwände: ___"
  - Wirkt zusätzlich auf `{waermeschutz_text}`: kombiniert mit `bauart_dach` ergibt z.B. „Sowohl das Dach als auch die Wände sind gedämmt." (beide ja) bzw. „Weder das Dach noch die Wände sind zusätzlich gedämmt." (beide nein, ohne Unterkellerung).
- **Besonderheiten**: **Erscheint NICHT im Rohbau-`{fassade}`-Block** — sondern nur im energetischen Block (Sektion 5) und im Wärmeschutz-Narrativ (Sektion 6). Eine zentrale Energie-Aussage.

### `bauart_kellerdecke`

- **Label im Formular**: „Kellerdecke gedämmt"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `ja` → `{energie_kellerdecke}` = „gedämmt"
  - `nein` → `{energie_kellerdecke}` = „ungedämmt"
  - (leer) → `{energie_kellerdecke}` = `''` (→ `___`)
- **Quelle**: `formular.html:794-805`
- **Mapping (Context)**: `lib/docx/context.js:173-175`:
  ```js
  const kellerdeckeDaemmung = T.str(fields.bauart_kellerdecke).toLowerCase();
  const energieKellerdecke = kellerdeckeDaemmung === 'ja' ? 'gedämmt'
    : (kellerdeckeDaemmung === 'nein' ? 'ungedämmt' : '');
  ```
- **Transformer**: Keiner — Inline-Konvertierung.
- **Output-Key(s)**: `energie_kellerdecke` (Zeile 374) via `T.fallback(...)`.
- **Template-Platzhalter**: `{energie_kellerdecke}` (kombiniert mit `{kellerdecke_label}`)
- **Word-Kontext**:
  > - {kellerdecke_label}: {energie_kellerdecke}
  > (`_template_extract.md:285`)
- **Auswirkung** (Kombinationen mit `kellerung` aus Sektion `objekt`):
  - `bauart_kellerdecke=ja` + `kellerung=unterkellert` → „Kellerdecke: gedämmt"
  - `bauart_kellerdecke=ja` + `kellerung=nicht` → „Bodenplatte: gedämmt" (Label-Wechsel!)
  - `bauart_kellerdecke=nein` + `kellerung=teilunterkellert` → „Kellerdecke: ungedämmt"
  - `bauart_kellerdecke` leer → „Kellerdecke: ___" oder „Bodenplatte: ___"
- **Besonderheiten**: **Cross-Section-Abhängigkeit**: Das Label vor dem Doppelpunkt wird dynamisch durch `kellerdecke_label` (`lib/docx/context.js:192-194`) bestimmt:
  ```js
  const kellerungKey = T.str(fields.kellerung).toLowerCase();
  const istUnterkellert = kellerungKey === 'unterkellert' || kellerungKey === 'teilunterkellert';
  const kellerdeckeLabel = istUnterkellert ? 'Kellerdecke' : 'Bodenplatte';
  ```
  D.h. ob das Feld als „Kellerdecke" oder „Bodenplatte" beschriftet wird, hängt vom **anderen Formular-Feld `kellerung`** (in Sektion `objekt`) ab — bei `nicht` (= nicht unterkellert) wird der Begriff zur „Bodenplatte". Außerdem: Die Eingabe wirkt **nicht** auf `{waermeschutz_text}` ein.

## Querschnitt: Abgeleitete Felder und Cross-Section-Effekte

### `{bauweise}` — wird nur aus EG abgeleitet

`{bauweise}` ist die Langform der Außenwand-Bauweise (z.B. „Mauerwerksbauweise") und erscheint an **zwei prominenten Stellen** im Gutachten:
- Sektion 5 Ausstattungssatz: „… in {bauweise} errichteten …"
- Sektion 6 Einleitung: „… in baujahrestypischer {bauweise} gebaut."

Quelle ist **ausschließlich `bauart_außenwand_eg`** (`lib/docx/context.js:147`). Der UG-Wert geht nicht ein. Das ist eine bewusste Design-Entscheidung: Das Gutachten soll die typische Bauweise des Gebäudes als Ganzes beschreiben, und der überirdische Anteil ist hier maßgeblich.

### `{innenwand_dicke_text}` — compactJoin aus zwei Feldern

Wird aus `bauart_innenwand_dicke_tragend` und `bauart_innenwand_dicke_nichttragend` zusammengebaut. Beispiel (`lib/docx/context.js:152-155`):
- Beide gesetzt → „tragend 11,5-24cm dick, nichttragend <11,5cm dick"
- Nur tragend → „tragend 11,5-24cm dick"
- Beide leer → `___`

### `{dachstuhl_text}` — compactJoin aus Dachform + Dachstuhl

`lib/docx/context.js:160`. Beispiele:
- `dachform=sattel`, `dachstuhl=holz` → „Satteldach, Holzkonstruktion"
- Nur `dachform=walm`, kein Stuhl → „Walmdach"

### `{fenster_text}` — Drei-Zweig-Logik

`lib/docx/context.js:178-182`. Drei Verglasungs-Zustände bestimmen das Suffix:
- `bauart_fenster_verglasung=ja` → „{Fenstertyp}, 2-fach-Verglasung"
- `bauart_fenster_verglasung=nein` → „{Fenstertyp}, einfach verglast"
- leer → nur „{Fenstertyp}" (kein Suffix)

### `{fassade}` — Liste aus zwei Ja/Nein-Feldern

Nur `bauart_fassade_putz=ja` und `bauart_fassade_verkleidung=ja` werden zur Liste; `nein` und leer fallen raus. Ergebnis mit `, ` gejoined.

### `{kellerdecke_label}` — Cross-Section zum Feld `kellerung`

Wechselt zwischen „Kellerdecke" und „Bodenplatte" basierend auf `fields.kellerung` (Sektion `objekt`):
- `kellerung=unterkellert` oder `teilunterkellert` → „Kellerdecke"
- `kellerung=nicht` oder leer → „Bodenplatte"

Die energetische Aussage (`{energie_kellerdecke}`) wird also passend zur baulichen Situation gelabelt.

### Indirekte Effekte auf `{waermeschutz_text}` (Sektion 6)

Drei Bauart-Felder beeinflussen den narrativen Wärmeschutzsatz in Sektion 6 (`lib/docx/context.js:54-75`, `lib/docx/context.js:273`):
- `bauart_dach` (`ja`/`nein` → `dachGedaemmt`)
- `bauart_fassade_daemmung` (`ja`/`nein` → `fassadeGedaemmt`)
- `bauart_fenster` + `bauart_fenster_verglasung` (über `fensterTyp` und `fensterIst2fach`)
- Zusätzlich indirekt `kellerung` aus Sektion `objekt` (über `ctx.istUnterkellert`)

Beispielausgaben:
- Dach gedämmt, Fassade nicht gedämmt → „Das Dach ist gedämmt, die Wände sind nicht zusätzlich gedämmt."
- Beide nicht gedämmt + unterkellert → „Weder der Keller noch das Dach sind zusätzlich gedämmt."
- Beide nicht gedämmt + nicht unterkellert → „Weder das Dach noch die Wände sind zusätzlich gedämmt."
- Beide gedämmt → „Sowohl das Dach als auch die Wände sind gedämmt."

Plus, falls `fensterTyp` gesetzt: „Die {fensterTyp} sind {2-fach verglast | einfach verglast} ohne weitere Anforderungen."

Der gesamte Satz endet immer mit einer Standardformulierung über die fehlenden Wärmeschutzanforderungen zum Baujahr.

## Hinweise und Fallstricke

1. **Feldnamen mit Umlauten**: `bauart_außenwand_eg`, `bauart_außenwand_ug`, `bauart_fensterbaenke_außen` — der Umlaut `ä`/`ß` im HTML-`name` ist unüblich, aber funktional. Vergessen leicht beim API-Mocking. (`bauart_fensterbaenke_innen` hat `ae` statt `ä`, sondern `ä` in „außen".)
2. **`bauweise` ignoriert UG**: Wer im UG einen anderen Baustoff als im EG hat, sieht das im `{bauweise}`-Text nicht (immer EG).
3. **`decke_og` fällt auf `decke` zurück**: Gutachter, die nur die Kellerdecke eintragen, kriegen beide Decken-Zeilen identisch — möglicherweise nicht beabsichtigt, aber so vom Code gewollt.
4. **`bauart_kellerdecke` und `kellerdecke_label`**: Der Begriff vor dem Doppelpunkt im energetischen Block hängt vom Feld `kellerung` (Sektion `objekt`) ab, nicht von der Bauart-Sektion selbst.
5. **`bauart_dach` vs. `bauart_fassade_daemmung`**: Beide sind Ja/Nein-Felder für Dämmung, aber das eine ergibt `gedämmt`/`ungedämmt`, das andere füttert zusätzlich den `waermeschutz_text`. Die Logik der Wärmeschutz-Aussage berücksichtigt **Unterkellerung** (aus `kellerung`), nicht aber den Kellerdecken-Dämmstatus (`bauart_kellerdecke`).
6. **`bauart_fenster_verglasung` hat drei Zustände**: leer ≠ „nein" für `{fenster_text}` (leer → kein Suffix, „nein" → „einfach verglast"). Für `{waermeschutz_text}` werden leer und „nein" hingegen gleich behandelt.
7. **`bauart_fassade_daemmung` fließt NICHT in `{fassade}` ein**: Das Feld dient ausschließlich dem energetischen Block und dem Wärmeschutzsatz. `{fassade}` zeigt nur optische Aspekte (Putz, Verkleidung).
8. **Dachform doppelt indirekt**: `dachform` erscheint außerdem in der `{gebaeude_kurzbeschreibung}` (Sektion 5: „… Gebäude mit Satteldach.") und in `{bautechnik_einleitung}` (Sektion 6: „… Satteldachgebäude …" — Suffix „gebäude" wird angehängt).
9. **`bauart_dacheindeckung=beton`** → „Betonziegel" (mit Suffix), aber `bauart_außenwand_eg=beton` → „Stahlbeton" (Mapping-Spezialfall). Pro Feld eigener Transformer mit eigenem Vokabular — Konsistenz nicht garantiert.
