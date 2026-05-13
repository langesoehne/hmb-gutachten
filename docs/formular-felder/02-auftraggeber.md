# Auftraggeber

Diese Sektion (`data-section-key="auftraggeber"`) erfasst die Kontaktdaten des Auftraggebers. Sie hat zwei Beschriftungen: Im Admin-Modus heißt sie **„Auftraggeber"**, im Public-Modus (Kunden-Ansicht) heißt sie **„Ihre Kontaktdaten"** — der Kunde füllt sie also selbst aus. Die Eingaben werden aus mehreren Einzelfeldern zu drei Output-Werten **zusammengesetzt**, die an unterschiedlichen Stellen im Word-Dokument auftauchen:

- `{auftraggeber_block}` — mehrzeiliger Adressblock auf der ersten Seite („1.1 Auftraggeber des Gutachtens").
- `{auftraggeber_satz}` — Inline-Variante mit Komma-Trennung im Auftrags-Eröffnungssatz (Sektion 2).
- `{auftraggeber_name}` — Vor- und Nachname zusammen, ohne Anrede und Adresse, für den Ortsbesichtigungs-Satz (Sektion 4).

Außerdem gibt es im Formular einen **„Adresse prüfen"-Button** (OpenStreetMap-Geocoding) der die Straße/Hausnummer/PLZ/Ort sauber zurückschreibt — die geprüften Werte landen ganz normal in den unten dokumentierten Feldern.

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter (direkt) | Word-Kontext (Kurzform) |
|---|---|---|
| `auftraggeber_anrede` | _(keiner direkt — fließt in `{auftraggeber_block}` und `{auftraggeber_satz}`)_ | Erste Zeile von 1.1; Beginn des Satzes in Sektion 2 |
| `vorname` | _(fließt in alle drei Outputs)_ | 1.1, Sektion 2 („…erteilte XYZ…"), Sektion 4 („Auftraggeber, XYZ,…") |
| `name` | _(fließt in alle drei Outputs)_ | Wie `vorname` |
| `strasse` | _(fließt in `{auftraggeber_block}` und `{auftraggeber_satz}`)_ | Zweite Zeile von 1.1, Komma-Glied im Auftragssatz |
| `hausnummer` | _(fließt in `{auftraggeber_block}` und `{auftraggeber_satz}`)_ | Wie `strasse` (mit Straße kombiniert) |
| `hausnummer_zusatz` | _(fließt in `{auftraggeber_block}` und `{auftraggeber_satz}`)_ | Wie `hausnummer` (z.B. „12a") |
| `plz` | _(fließt in `{auftraggeber_block}` und `{auftraggeber_satz}`)_ | Dritte Zeile von 1.1, Komma-Glied im Auftragssatz |
| `ort` | _(fließt in `{auftraggeber_block}` und `{auftraggeber_satz}`)_ | Wie `plz` |

Die zusammengesetzten Output-Werte:

| Output-Key | Template-Platzhalter | Quelle |
|---|---|---|
| `auftraggeber_block` | `{auftraggeber_block}` | `lib/docx/context.js:83`, `lib/transformers.js:445-459` |
| `auftraggeber_satz` | `{auftraggeber_satz}` | `lib/docx/context.js:84`, `lib/transformers.js:462-469` |
| `auftraggeber_name` | `{auftraggeber_name}` | `lib/docx/context.js:79` |

## Felder im Detail

### `auftraggeber_anrede`

- **Label im Formular**: „Anrede:"
- **HTML-Input-Typ**: `<select>` (Dropdown)
- **Datalist/Options**: Drei wählbare Werte (plus Leerwert „– bitte wählen –"):
  | Form-Value | Anzeige im Dropdown | Display-Wert via `toDisplayAnrede` |
  |---|---|---|
  | `""` (leer) | „– bitte wählen –" | `''` |
  | `herr` | „Herr" | `Herr` |
  | `frau` | „Frau" | `Frau` |
  | `firma` | „Firma" | `Firma` |
- **Quelle**: `formular.html:121-128`
- **Mapping (Context)**: Wird **nicht direkt** als eigener Context-Key ausgegeben. Stattdessen fließt der Wert über `toDisplayAnrede(fields.auftraggeber_anrede)` ([`lib/transformers.js:30-33`](../../lib/transformers.js)) in die Helfer `buildAuftraggeberBlock` und `buildAuftraggeberSatz`, die daraus zwei zusammengesetzte Outputs erzeugen.
- **Transformer**: `toDisplayAnrede(rawValue)` ([`lib/transformers.js:30-33`](../../lib/transformers.js)) — Mapped die Lowercase-Form-Values (`herr`/`frau`/`firma`) auf die im Deutschen großgeschriebene Anzeige (`Herr`/`Frau`/`Firma`). Unbekannte Werte (inkl. Leerstring) → `''`.
- **Output-Key im Context-Objekt**: Indirekt via `auftraggeber_block` und `auftraggeber_satz` (siehe unten). Es gibt **keinen** eigenständigen `{anrede}`-Platzhalter im Template.
- **Template-Platzhalter**: indirekt — siehe Output-Keys `{auftraggeber_block}` und `{auftraggeber_satz}`.
- **Word-Kontext**: Bei Wahl `firma` steht „Firma" als **eigene Zeile 1** im `{auftraggeber_block}` (gefolgt vom Firmennamen); bei `herr`/`frau` steht die Anrede unmittelbar vor dem Namen (z.B. „Herr Robert Hyra"). Im `{auftraggeber_satz}` (Sektion 2) wird `firma` zu „die Firma <Name>", bei `herr`/`frau` zu „Herr <Name>" bzw. „Frau <Name>" — der Artikel kommt nur bei Firmen vor.
- **Auswirkung**:
  - `herr` + Vorname „Robert" + Name „Hyra" → Block-Zeile 1: „Herr Robert Hyra"; Satz: „Herr Robert Hyra".
  - `firma` + Name „Beispiel GmbH" (Vorname leer) → Block-Zeile 1: „Firma", Zeile 2: „Beispiel GmbH"; Satz: „die Firma Beispiel GmbH".
  - leer → Block-Zeile 1 enthält nur den Namen; Satz beginnt mit dem Namen ohne Anrede.
- **Besonderheiten**: Sonderlogik für „Firma": eigene Zeile im Block + Artikel „die" im Satz. Wird im Pflichtfeld-Check des Formulars indirekt geprüft (über die zusammengebauten Output-Werte).

### `vorname`

- **Label im Formular**: „Vorname:"
- **HTML-Input-Typ**: `type="text"` (id zusätzlich `vorname`)
- **Datalist/Options**: keine.
- **Quelle**: `formular.html:129-132`
- **Mapping (Context)**: `lib/docx/context.js:79` — `const auftraggeberName = T.compactJoin([fields.vorname, fields.name]);`
- **Transformer**: `compactJoin([v, n])` ([`lib/transformers.js:3-9`](../../lib/transformers.js)) — verbindet die Liste mit Leerzeichen, trimt jedes Element, filtert leere raus. Bei `vorname="Robert"`, `name="Hyra"` → `"Robert Hyra"`; bei leerem Vornamen → nur `"Hyra"`.
- **Output-Key im Context-Objekt**: Fließt in `auftraggeber_name` (`lib/docx/context.js:306`), `auftraggeber_block` (`:307`), `auftraggeber_satz` (`:308`).
- **Template-Platzhalter**: indirekt via `{auftraggeber_name}`, `{auftraggeber_block}`, `{auftraggeber_satz}`.
- **Word-Kontext** (Beispiele aus dem Template):
  > Daran nahmen der Auftraggeber, {auftraggeber_name}, sowie als Sachverständiger der Unterzeichnende teil.
  (`_template_extract.md:205` — Sektion 4 „Ortsbesichtigung")
- **Auswirkung**: Vorname erscheint als erstes Element vor dem Nachnamen in allen drei zusammengesetzten Outputs. Bei leerem Vornamen wird er einfach weggelassen (z.B. bei Firma ohne Ansprechpartner). Beispiel `vorname=Robert`, `name=Hyra`: → „Robert Hyra" überall.
- **Besonderheiten**: Wird bei Firma typischerweise leer gelassen — dann steht in 1.1 nur der Firmenname auf Zeile 2.

### `name`

- **Label im Formular**: „Name:"
- **HTML-Input-Typ**: `type="text"`
- **Datalist/Options**: keine.
- **Quelle**: `formular.html:133-136`
- **Mapping (Context)**: `lib/docx/context.js:79` — wird mit `vorname` über `compactJoin` zu `auftraggeberName` verbunden.
- **Transformer**: `compactJoin` (siehe `vorname`). Bei `name=Hyra`, `vorname=Robert` → `"Robert Hyra"`.
- **Output-Key im Context-Objekt**: Fließt in `auftraggeber_name`, `auftraggeber_block`, `auftraggeber_satz` (`lib/docx/context.js:306-308`).
- **Template-Platzhalter**: indirekt via `{auftraggeber_name}`, `{auftraggeber_block}`, `{auftraggeber_satz}`.
- **Word-Kontext**: identisch zu `vorname`.
- **Auswirkung**: Der Nachname (bzw. der Firmenname bei Anrede=Firma) ist im Zweifel der wichtigste Teil — ohne ihn bleiben alle Auftraggeber-Verweise quasi leer (nur Anrede).
- **Besonderheiten**: Bei Anrede=Firma trägt der Kunde hier **den Firmennamen** ein (es gibt kein separates Feld „Firmenname"). Pflichtfeld-Charakter (faktisch, da ohne Name kein sinnvolles Gutachten möglich ist).

### `strasse`

- **Label im Formular**: „Straße:"
- **HTML-Input-Typ**: `type="text"`
- **Datalist/Options**: keine. Wird vom „Adresse prüfen"-Tool ([Geocode-Button](../../formular.html#auftraggeberToolsBar)) ggf. automatisch zurückgeschrieben.
- **Quelle**: `formular.html:140-142`
- **Mapping (Context)**: `lib/docx/context.js:81` — `const auftraggeberStrasseHausnummer = T.compactJoin([fields.strasse, hausnummerMitZusatz]);`
- **Transformer**: `compactJoin` mit Default-Separator `' '`. Bei `strasse="Musterstr."`, Hausnummer-Block `"12a"` → `"Musterstr. 12a"`.
- **Output-Key im Context-Objekt**: Fließt zusammen mit Hausnummer in `auftraggeber_block` (Zeile 2) und in `auftraggeber_satz` (mittleres Komma-Glied).
- **Template-Platzhalter**: indirekt via `{auftraggeber_block}` und `{auftraggeber_satz}`.
- **Word-Kontext**: Zeile 2 des `{auftraggeber_block}` in Sektion 1.1; Komma-Glied im Auftrags-Satz von Sektion 2.
- **Auswirkung**: Mit Wert „Musterstr." + Hausnummer „12" → Block-Zeile: „Musterstr. 12". Ohne Wert: Zeile wird (falls auch Hausnummer leer ist) komplett weggelassen, weil `compactJoin` leere Werte filtert und `buildAuftraggeberBlock` nur nicht-leere Zeilen einfügt.
- **Besonderheiten**: Wird zusammen mit `hausnummer` und `hausnummer_zusatz` zu einer einzelnen Zeile/einem einzelnen Komma-Glied verschmolzen.

### `hausnummer`

- **Label im Formular**: „Hausnummer:"
- **HTML-Input-Typ**: `type="text"`
- **Datalist/Options**: keine. Vom Geocode-Tool ggf. auto-gefüllt.
- **Quelle**: `formular.html:143-146`
- **Mapping (Context)**: `lib/docx/context.js:80` — `const hausnummerMitZusatz = T.compactJoin([fields.hausnummer, T.str(fields.hausnummer_zusatz)]);` — zuerst Hausnummer und Zusatz mit Leerzeichen verbinden, danach in `auftraggeberStrasseHausnummer` weitergegeben.
- **Transformer**: `compactJoin` (siehe oben). Bei `hausnummer=12`, `hausnummer_zusatz=a` → `"12 a"`.
- **Output-Key im Context-Objekt**: Wie `strasse` — indirekt via `auftraggeber_block` und `auftraggeber_satz`.
- **Template-Platzhalter**: indirekt via `{auftraggeber_block}` und `{auftraggeber_satz}`.
- **Word-Kontext**: Wie `strasse` — Teil der Straßen-Zeile.
- **Auswirkung**: Mit Wert „12" → wird an die Straße angehängt: „Musterstr. 12". Ohne Wert: nur die Straße erscheint.
- **Besonderheiten**: Wird mit `hausnummer_zusatz` zu einer kombinierten Hausnummer-Einheit gemerged, bevor diese ihrerseits mit der Straße verschmolzen wird.

### `hausnummer_zusatz`

- **Label im Formular**: „Hausnummerzusatz:"
- **HTML-Input-Typ**: `type="text"`
- **Datalist/Options**: keine.
- **Quelle**: `formular.html:147-150`
- **Mapping (Context)**: `lib/docx/context.js:80` — siehe `hausnummer`. Wird per `T.str(...)` getrimt und mit `compactJoin` an die Hausnummer angehängt.
- **Transformer**: `str(value)` ([`lib/transformers.js:11-13`](../../lib/transformers.js)) — trimt, leerer Wert → `''`. Danach Teil des `compactJoin`-Calls.
- **Output-Key im Context-Objekt**: indirekt via `auftraggeber_block`, `auftraggeber_satz`.
- **Template-Platzhalter**: indirekt via `{auftraggeber_block}` und `{auftraggeber_satz}`.
- **Word-Kontext**: Hängt sich mit Leerzeichen an die Hausnummer.
- **Auswirkung**: Bei `hausnummer=12`, `hausnummer_zusatz=a` → „12 a". Bei leerem Zusatz nur „12".
- **Besonderheiten**: Optionales Zusatzfeld für Hausnummern wie „12a", „12 b" oder „4/1". Anders als manche Adress-Standards wird hier per Leerzeichen verbunden (nicht ohne Leerzeichen) — beim Geocoding-Reverse-Mapping kann das relevant sein.

### `plz`

- **Label im Formular**: „PLZ:"
- **HTML-Input-Typ**: `type="text"`
- **Datalist/Options**: keine. Wird vom Geocode-Tool ggf. zurückgeschrieben. (Hinweis aus dem Code: PLZ-zu-Bundesland-Auto-Fill läuft im Hintergrund beim Tippen — relevant für die Objekt-Sektion, nicht direkt hier.)
- **Quelle**: `formular.html:153-156`
- **Mapping (Context)**: `lib/docx/context.js:82` — `const auftraggeberPlzOrt = T.compactJoin([fields.plz, fields.ort]);`
- **Transformer**: `compactJoin` mit Leerzeichen-Separator. Bei `plz=80331`, `ort=München` → `"80331 München"`.
- **Output-Key im Context-Objekt**: indirekt via `auftraggeber_block` (Zeile 3) und `auftraggeber_satz` (drittes Komma-Glied).
- **Template-Platzhalter**: indirekt via `{auftraggeber_block}` und `{auftraggeber_satz}`.
- **Word-Kontext**: Letzte Zeile von 1.1; letztes Komma-Glied im Auftrags-Satz von Sektion 2.
- **Auswirkung**: Mit „80331" und Ort „München" → Block-Zeile: „80331 München". Ohne Wert (beide leer) → Zeile fehlt.
- **Besonderheiten**: Wird mit `ort` zu einer kombinierten Zeile zusammengeschmolzen.

### `ort`

- **Label im Formular**: „Ort:"
- **HTML-Input-Typ**: `type="text"`
- **Datalist/Options**: keine. Vom Geocode-Tool ggf. auto-gefüllt.
- **Quelle**: `formular.html:157-160`
- **Mapping (Context)**: `lib/docx/context.js:82` — siehe `plz`.
- **Transformer**: `compactJoin` (siehe oben).
- **Output-Key im Context-Objekt**: indirekt via `auftraggeber_block` und `auftraggeber_satz`.
- **Template-Platzhalter**: indirekt via `{auftraggeber_block}` und `{auftraggeber_satz}`.
- **Word-Kontext**: Wie `plz` — letzte Zeile/letztes Komma-Glied.
- **Auswirkung**: Wie `plz`.
- **Besonderheiten**: Keine zusätzliche Bundeslandfeld-Synchronisation in der Auftraggeber-Sektion (das ist nur für die Objekt-Adresse relevant).

## Zusammengesetzte Output-Werte

### `auftraggeber_block` — der mehrzeilige Adressblock

- **Quelle (Code)**: `lib/transformers.js:445-459` (Funktion `buildAuftraggeberBlock`), aufgerufen in `lib/docx/context.js:83`.
- **Logik**:
  - Bei **Anrede=Firma**: Zeile 1 = „Firma", Zeile 2 = `<Name>` (Firmenname).
  - Sonst: Zeile 1 = „`<Anrede> <Name>`" (z.B. „Herr Robert Hyra"); ist beides leer, entfällt die Zeile.
  - Zeile 3 = `<Straße> <Hausnummer> <Hausnummer-Zusatz>` (kombiniert via `compactJoin`).
  - Zeile 4 = `<PLZ> <Ort>`.
  - Leere Zeilen werden komplett weggelassen.
  - Zeilen sind mit `\n` verbunden (Newline) — docxtemplater rendert das als Zeilenumbruch.
- **Output-Key**: `auftraggeber_block` (`lib/docx/context.js:307`), gewrappt in `T.fallback(...)` → leerer Wert ergibt `___`.
- **Template-Platzhalter**: `{auftraggeber_block}`
- **Word-Kontext** (Sektion 1.1 „Auftraggeber des Gutachtens"):
  > ## 1.1Auftraggeber des Gutachtens
  >
  > {auftraggeber_block}
  (`_template_extract.md:71-75`)
- **Beispiel-Output**:
  - Privatperson: Eingabe `auftraggeber_anrede=herr`, `vorname=Robert`, `name=Hyra`, `strasse=Musterstr.`, `hausnummer=12`, `plz=80331`, `ort=München` →
    ```
    Herr Robert Hyra
    Musterstr. 12
    80331 München
    ```
  - Firma: Eingabe `auftraggeber_anrede=firma`, `name=Beispiel GmbH`, Rest analog →
    ```
    Firma
    Beispiel GmbH
    Musterstr. 12
    80331 München
    ```

### `auftraggeber_satz` — die Inline-Satzform

- **Quelle (Code)**: `lib/transformers.js:462-469` (Funktion `buildAuftraggeberSatz`), aufgerufen in `lib/docx/context.js:84`.
- **Logik**:
  - Bei **Anrede=Firma**: Kopf = „die Firma `<Name>`".
  - Sonst: Kopf = „`<Anrede> <Name>`" (z.B. „Herr Robert Hyra"; ohne Anrede nur Name).
  - Anschließend mit Komma verbunden mit Straße+Hausnummer und PLZ+Ort.
  - Leere Glieder werden via `compactJoin([..., ..., ...], ', ')` entfernt.
- **Output-Key**: `auftraggeber_satz` (`lib/docx/context.js:308`), gewrappt in `T.fallback(...)`.
- **Template-Platzhalter**: `{auftraggeber_satz}`
- **Word-Kontext** (Sektion 2 „Auftrag"):
  > Am {auftragsdatum} erteilte {auftraggeber_satz}, dem Unterzeichner den Auftrag, den bautechnischen Zustand des Gebäudes in Hinblick auf eine Sanierung sowie die Restnutzungsdauer des Gebäudes zu beurteilen.
  (`_template_extract.md:141`)
- **Beispiel-Output**:
  - Privatperson: „Herr Robert Hyra, Musterstr. 12, 80331 München".
  - Firma: „die Firma Beispiel GmbH, Musterstr. 12, 80331 München".
  - Im fertigen Satz: „Am 22. April 2026 erteilte Herr Robert Hyra, Musterstr. 12, 80331 München, dem Unterzeichner den Auftrag, …"

### `auftraggeber_name` — nur Vor- und Nachname

- **Quelle (Code)**: `lib/docx/context.js:79` — `const auftraggeberName = T.compactJoin([fields.vorname, fields.name]);`
- **Logik**: Einfach Vorname + Name mit Leerzeichen verbunden, ohne Anrede, ohne Adresse. Bei leerem Vornamen nur Name; bei beidem leer → `''`.
- **Output-Key**: `auftraggeber_name` (`lib/docx/context.js:306`), gewrappt in `T.fallback(...)` → leer ergibt `___`.
- **Template-Platzhalter**: `{auftraggeber_name}`
- **Word-Kontext** (Sektion 4 „Ortsbesichtigung"):
  > Die Objektaufnahme wurde am {ortsbesichtigungsdatum} durchgeführt. Daran nahmen der Auftraggeber, {auftraggeber_name}, sowie als Sachverständiger der Unterzeichnende teil.
  (`_template_extract.md:205`)
- **Beispiel-Output**:
  - `vorname=Robert`, `name=Hyra` → „Robert Hyra".
  - Im Satz: „Daran nahmen der Auftraggeber, Robert Hyra, sowie als Sachverständiger der Unterzeichnende teil."
- **Besonderheiten**: Im Gegensatz zu `auftraggeber_block` und `auftraggeber_satz` wird die Anrede hier **bewusst weggelassen** — die Anrede „Auftraggeber" wird im Template-Satz separat („der Auftraggeber, …") als Apposition vorangestellt. Bei Firma steht hier nur der Firmenname (ohne „Firma " davor).

## Hinweise

- **Pflichtfeld-Charakter**: Keines der Felder ist HTML-`required`, aber alle drei Output-Wrapper benutzen `T.fallback(...)` ([`lib/transformers.js:15-18`](../../lib/transformers.js)) — leer eingegebene Adressen erscheinen im Word als `___`-Lücke (nicht stillschweigend leer). Das macht im Korrektur-Workflow gut sichtbar, wo noch Daten fehlen.
- **Doppelte/abhängige Nutzung**: Vorname und Name fließen in **alle drei** Outputs; Straße/Hausnummer/PLZ/Ort fließen in `block` und `satz` (nicht in `name`). Anrede fließt nur in `block` und `satz`. Eine Änderung an einem einzelnen Feld kann also bis zu drei Stellen im Word betreffen.
- **Adresse prüfen (Geocode)**: Der Button „📍 Adresse prüfen" (`formular.html:165-167`) im Tools-Bar löst das OSM-Nominatim-Geocoding aus; das Ergebnis wird (auf Bestätigung des Users) direkt in `strasse`, `hausnummer`, `plz`, `ort` zurückgeschrieben — der Workflow funktioniert identisch wie für die Objekt-Sektion.
- **Keine eigenständigen Platzhalter**: Es gibt im Template **keinen** `{anrede}`, `{vorname}`, `{name}`, `{strasse}`, `{plz}` etc. — die Eingaben werden zwingend über die drei kombinierten Outputs ausgegeben. Hinzufügen weiterer Stellen im Word erfordert entweder weitere Output-Keys in `context.js` oder Verwendung der bestehenden drei Platzhalter.
