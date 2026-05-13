# Angaben zum Objekt

Diese Sektion (`data-section-key="objekt"`) ist die inhaltlich umfangreichste des Formulars und beschreibt das zu begutachtende Gebäude. Sie ist teilweise **kundensichtbar** (Anschrift, Eckdaten, Nutzung, Stellplätze, Aufzug, Form/Kellerung/Spitzboden, Flächen, Geschossigkeit, Energieausweis) und teilweise **admin-only** (Liegenschaft, Standardstufe, Ausstattungsgrad, Renovierungsstatus, Gesamtzustand). Die Felder fließen an sehr vielen Stellen ins Word-Dokument — vom Deckblatt (Flur, Flurstück, Gemarkung, Anschrift) über die Sektionen 2 (Auftrag), 3 (Sachverhalt), 4 (Ortsbesichtigung), 5 (Feststellungen), 6 (Bautechnische Beurteilung) bis 7 (Restnutzungsdauer).

Besonderheit dieser Sektion: viele Eingaben sind nicht 1:1 mit einem Template-Platzhalter verknüpft, sondern werden über **Transformer** in mehrere abgeleitete Formen geschickt (z.B. `nutzung` → `gebaeude_typ`, `gebaeude_typ_gen`, `nutzungs_zweck_satz`; `geschossigkeit` → `geschossigkeit`, `geschossigkeit_dekl`, `geschossigkeit_stoeckig`). Mehrere zentrale Felder dienen zusätzlich als Bausteine für **generierte Satz-Texte** (`sachverhalt_einleitung`, `sachverhalt_zwischen`, `gebaeude_kurzbeschreibung`, `bautechnik_einleitung`), die in `lib/docx/context.js` direkt aufgebaut werden.

Die Anschrift-Felder (`objekt_strasse`, `objekt_hausnummer`, `objekt_hausnummer_zusatz`, `objekt_plz`, `objekt_ort`) werden über `T.compactJoin` zu einem zusammengefassten `genaue_anschrift`-Output verschmolzen. Das Bundesland steuert über zwei Lookup-Tabellen die **Landesbauordnung** (Sektion 1.2) und die **Liegenschaftskarten-Quelle** (Bildunterschrift Bild 2). Zustand- und Renovierungs-Felder beeinflussen die Adjektiv-Form, die im fertigen Gutachten vor dem Gebäudetyp steht („nicht renovierten Wohngebäudes" usw.).

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter / Output-Verwendung | Word-Kontext (Kurzform) |
|---|---|---|
| `objekt_strasse` | Teil von `{genaue_anschrift}`; Erschließungs-Satz | Deckblatt, Sektion 2 (Auftrag), 3, 4 (Grundstück), 5 (Bild-3-Einleitung), 7 (RND-Schluss) |
| `objekt_hausnummer` | Teil von `{genaue_anschrift}` | Wie oben |
| `objekt_hausnummer_zusatz` | Teil von `{genaue_anschrift}` | Wie oben |
| `objekt_plz` | Teil von `{genaue_anschrift}` | Wie oben |
| `objekt_ort` | Teil von `{genaue_anschrift}` | Wie oben |
| `baujahr` | `{baujahr}` | Sektion 3, 5 (Einleitungssatz, „Funktion"), 6 (Bautechnik), 7 (RND-Einleitung) |
| `wohneinheiten` | `{wohneinheiten}` | Sektion 5 „Funktion" |
| `vollgeschosse` | `{vollgeschosse}` | Sektion 5 „Funktion" |
| `nutzflaeche` | `{nutzflaeche}` | Sektion 5 (Ausstattungsgrad-Satz) |
| `nutzung` | `{gebaeude_typ}`, `{gebaeude_typ_gen}`, `{nutzungs_zweck_satz}` | Sektion 3 (Gegenstand), 4 (Liegenschaftsnutzung), 5 (Zustands-Sätze), 6, 7 |
| `nutzung_vergangenheit` | Teil von `{nutzungs_zweck_satz}` | Sektion 4 |
| `stellplaetze_vorhanden` | Teil von `{stellplaetze}` | Sektion 5 „Garagen / Stellplätze" |
| `stellplaetze_anzahl` | Teil von `{stellplaetze}` | Sektion 5 „Garagen / Stellplätze" |
| `aufzug` | `{aufzug}` | Sektion 5 (Ausbau, Aufzug-Zeile) |
| `aufzug_baujahr` | Teil von `{aufzug}` | Sektion 5 |
| `flur` | `{flur}` | Deckblatt, Sektion 2, 4 (Grundstück), implizit in `sachverhalt_einleitung` |
| `flurstueck` | `{flurstueck}` | Deckblatt, Sektion 2, 4 (Grundstück), implizit in `sachverhalt_einleitung` |
| `gemarkung` | `{gemarkung}` | Deckblatt, Sektion 2 |
| `bundesland` | `{landesbauordnung_name}`, `{landesbauordnung_kurz}`, `{liegenschaftskarte_quelle}` | Sektion 1.2 (Rechtsgrundlagen), Bild 2 Bildunterschrift |
| `grundstueck_flaeche` | Teil von `{sachverhalt_einleitung}` | Sektion 3 |
| `gebaeude_grundflaeche` | Teil von `{sachverhalt_zwischen}` | Sektion 3 |
| `geschossigkeit` | Teil von `{sachverhalt_zwischen}`, `{sachverhalt_einleitung}`, `{gebaeude_kurzbeschreibung}`, `{bautechnik_einleitung}` | Sektion 3, 5, 6 |
| `kellerung` | `{kellerung_adj}`, indirekt in `{sachverhalt_einleitung}`, `{sachverhalt_zwischen}`, `{gebaeude_kurzbeschreibung}`, `{bautechnik_einleitung}`, `{fundamente_einschaetzung_text}`, `{kellerdecke_label}`, `{waermeschutz_text}` | Sektion 3, 5, 6 |
| `spitzboden` | Teil von `{gebaeude_kurzbeschreibung}` | Sektion 5 |
| `gebaeude_form` | `{gebaeude_form_gen}`, indirekt in `{sachverhalt_einleitung}`, `{gebaeude_kurzbeschreibung}` | Sektion 3, 5 |
| `standardstufe` | `{standardstufe}` | Sektion 5 (Ausstattungsgrad-Satz), 7 (RND-Einleitung) |
| `ausstattungsgrad` | `{ausstattungsgrad}` | Sektion 5 |
| `renovierungsstatus` | `{renovierungsstatus_adj}`, `{renovierungsstatus_satz}` | Sektion 5 (Zustands-Satz), 7 (RND-Modernisierung) |
| `zustand_gesamt` | `{zustand_kurz}`, `{zustand_lang_deklin}` | Sektion 5 (Zustands-Satz, Abschlusssatz) |
| `energieausweis_jahr` | `{energieausweis_jahr}` | Sektion 5 (Energieausweis-Zeile) |
| `energieausweis_gueltig_bis` | `{energieausweis_gueltig_bis}` | Sektion 5 (Energieausweis-Zeile) |

## Sub-Gruppierungen

Die Sektion ist im Formular grob in folgende Sub-Bereiche unterteilt (in dieser Reihenfolge):

1. **Anschrift** (kundensichtbar) — Straße, Hausnummer, Hausnummerzusatz, PLZ, Ort.
2. **Eckdaten und Nutzung** (kundensichtbar) — Baujahr, Wohneinheiten, Vollgeschosse, Nutzfläche, derzeitige + frühere Nutzung, Stellplätze, Aufzug.
3. **Liegenschaft** (admin-only) — Flur, Flurstück, Gemarkung, Bundesland.
4. **Gebäude-Eckdaten** (kundensichtbar) — Grundstücksfläche, Gebäude-Grundfläche, Geschossigkeit, Kellerung, Spitzboden, Gebäudeform.
5. **Gutachter-Bewertungen** (admin-only) — Standardstufe (SW-RL), Ausstattungsgrad, Renovierungsstatus, Gesamtzustand.
6. **Energieausweis** (kundensichtbar) — Ausstellungsjahr, Gültig bis.

## Felder im Detail

### `objekt_strasse`

- **Label im Formular**: „Straße:" (Sub-Header „Genaue Anschrift des Objekts")
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:35`](../../required-fields.js))
- **Quelle**: `formular.html:177-180`
- **Mapping (Context)**: `lib/docx/context.js:87` — `const objektStrasse = T.str(fields.objekt_strasse);`
- **Transformer**: `T.str` (Trim, leerer String bei null/undefined) und `T.compactJoin` ([`lib/transformers.js:3-9`](../../lib/transformers.js))
- **Output-Key(s)**:
  - Bestandteil von `genaue_anschrift` (`lib/docx/context.js:94`, ausgegeben als `{genaue_anschrift}` mit `T.fallback`).
  - Direkt verwendet in `erschliessungAnschrift` und `erschliessungText` (`lib/docx/context.js:209-213`).
- **Template-Platzhalter**: tritt **nicht** direkt auf; fließt in `{genaue_anschrift}` und `{erschliessung_text}` (Sektion „Erschließung").
- **Word-Kontext** (Auswahl aus den Verwendungen):
  > {genaue_anschrift}

  > Das zu begutachtende Gebäude befindet sich auf dem Grundstück „{genaue_anschrift}" (Flur {flur}; Flst.Nr.: {flurstueck}).
  (`_template_extract.md:17, 213`)
- **Auswirkung**: Wert „Lukas-Cranach-Str." kombiniert mit Hausnummer/Ort wird zur kompletten Anschrift verschmolzen, z.B. „Lukas-Cranach-Str. 14, 80538 München". Leer: dann fehlt der Straßenteil oder die ganze Anschrift wird zu `___` (wenn alle Adressfelder leer sind).
- **Besonderheiten**: Die Trennzeichen-Logik (`compactJoin`) ignoriert leere Teile, d.h. nur die ausgefüllten Komponenten werden mit Leerzeichen/Komma zusammengeführt. Erscheint außerdem im „Erschließung"-Satz (Sektion 4) als Bezugsname der Straße.

### `objekt_hausnummer`

- **Label im Formular**: „Hausnummer:"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:36`](../../required-fields.js))
- **Quelle**: `formular.html:181-184`
- **Mapping (Context)**: `lib/docx/context.js:89-92` — `T.compactJoin([fields.objekt_hausnummer, objektHausnummerZusatz])`
- **Transformer**: `T.compactJoin` ([`lib/transformers.js:3-9`](../../lib/transformers.js))
- **Output-Key(s)**: zusammen mit `objekt_hausnummer_zusatz` an `objektStrasseHausnummer` und dann an `genaueAnschrift` (`lib/docx/context.js:89-94`).
- **Template-Platzhalter**: kein eigener; fließt in `{genaue_anschrift}`.
- **Word-Kontext**: über `{genaue_anschrift}` an allen Anschrift-Stellen (Deckblatt, Sektion 2, 4, 5, 7).
- **Auswirkung**: Wert „14" wird zu „Lukas-Cranach-Str. 14" → in der vollen Anschrift „Lukas-Cranach-Str. 14, 80538 München".
- **Besonderheiten**: Wird mit `hausnummer_zusatz` per Leerzeichen zusammengeführt („14 a"); leerer Zusatz wird ignoriert.

### `objekt_hausnummer_zusatz`

- **Label im Formular**: „Hausnummerzusatz:"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: nein
- **Quelle**: `formular.html:185-188`
- **Mapping (Context)**: `lib/docx/context.js:88, 91` — `const objektHausnummerZusatz = T.str(fields.objekt_hausnummer_zusatz);`
- **Transformer**: `T.str`, `T.compactJoin`
- **Output-Key(s)**: Bestandteil von `genaue_anschrift` und `erschliessungAnschrift`.
- **Template-Platzhalter**: kein eigener; fließt in `{genaue_anschrift}` und `{erschliessung_text}`.
- **Word-Kontext**: wie `objekt_hausnummer`.
- **Auswirkung**: Wert „a" wird zu „Hausnummer 14 a" in der Anschrift. Leerer Zusatz: nur die Hausnummer.
- **Besonderheiten**: Optional, daher kein Pflichtfeld.

### `objekt_plz`

- **Label im Formular**: „PLZ:"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:37`](../../required-fields.js))
- **Quelle**: `formular.html:191-194`
- **Mapping (Context)**: `lib/docx/context.js:93` — `const objektPlzOrt = T.compactJoin([fields.objekt_plz, fields.objekt_ort]);`
- **Transformer**: `T.compactJoin`
- **Output-Key(s)**: Bestandteil von `genaue_anschrift`.
- **Template-Platzhalter**: kein eigener; fließt in `{genaue_anschrift}`.
- **Word-Kontext**: wie oben.
- **Auswirkung**: Wert „80538" wird zusammen mit Ort zu „80538 München" und mit Straße zu „Lukas-Cranach-Str. 14, 80538 München".
- **Besonderheiten**: Eine UI-Auto-Fill-Logik (außerhalb des DOCX-Pfades, beim Tippen im Formular) ergänzt das Bundesland anhand der PLZ. Hat keinen direkten Output-Key, beeinflusst aber das Bundesland-Feld indirekt.

### `objekt_ort`

- **Label im Formular**: „Ort:"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:38`](../../required-fields.js))
- **Quelle**: `formular.html:195-198`
- **Mapping (Context)**: wie PLZ — `lib/docx/context.js:93`.
- **Output-Key(s)**: Bestandteil von `genaue_anschrift`.
- **Template-Platzhalter**: kein eigener; fließt in `{genaue_anschrift}`.
- **Word-Kontext**: wie oben.
- **Auswirkung**: Wert „München" erscheint überall, wo `{genaue_anschrift}` steht.
- **Besonderheiten**: ohne.

> **Hinweis (`genaue_anschrift`)**: Output-Key wird in `lib/docx/context.js:311` als `T.fallback(genaueAnschrift)` ausgegeben. Bleibt die komplette Anschrift leer, erscheint `___` an allen Stellen, an denen `{genaue_anschrift}` steht (Deckblatt, Sektion 2, 3, 4, 5, 7).

### `baujahr`

- **Label im Formular**: „Baujahr:"
- **HTML-Input-Typ**: `type="text"` (freie Texteingabe — z.B. „1972")
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:39`](../../required-fields.js))
- **Quelle**: `formular.html:260-263`
- **Mapping (Context)**: `lib/docx/context.js:97` — `const baujahr = T.str(fields.baujahr);`
- **Transformer**: `T.str` + `T.fallback` beim Output.
- **Output-Key(s)**: `baujahr` (`lib/docx/context.js:319`) → `{baujahr}`.
- **Template-Platzhalter**: `{baujahr}` (tritt **mehrfach** auf).
- **Word-Kontext** (Auswahl):
  > Nach Angaben der Eigentümer wurde das Gebäude im Jahr {baujahr} errichtet.
  (`_template_extract.md:179`)

  > Der bauliche und technische Zustand des {baujahr} errichteten und {renovierungsstatus_adj} {gebaeude_typ_gen} ist, …
  (`_template_extract.md:261`)

  > Das Gebäude stammt aus dem Jahr {baujahr} und verfügt über {vollgeschosse} Vollgeschosse.
  (`_template_extract.md:373`)

  > Das {gebaeude_typ} wurde {baujahr} als {bautechnik_einleitung} in baujahrestypischer {bauweise} gebaut.
  (`_template_extract.md:587`)

  > Dies gilt auch für das Bewertungsobjekt, das ursprünglich im Jahr {baujahr} errichtet wurde.
  (`_template_extract.md:627`)
- **Auswirkung**: Wert „1972" wird an mind. 5 Stellen im Gutachten eingefügt. Ohne Wert: überall `___`.
- **Besonderheiten**: Zentrale Bezugsgröße für die Berechnung der Restnutzungsdauer (Sektion 7). Wird nicht als Zahl validiert — beliebiger Text möglich, was bei der Datums-Arithmetik (Sektion 7) zu Problemen führen kann.

### `wohneinheiten`

- **Label im Formular**: „Anzahl der Wohneinheiten:"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:40`](../../required-fields.js))
- **Quelle**: `formular.html:264-267`
- **Mapping (Context)**: `lib/docx/context.js:98` — `const wohneinheiten = T.str(fields.wohneinheiten);`
- **Transformer**: `T.str` + `T.fallback`.
- **Output-Key(s)**: `wohneinheiten` (`lib/docx/context.js:320`) → `{wohneinheiten}`.
- **Template-Platzhalter**: `{wohneinheiten}` (einmalig).
- **Word-Kontext** (Sektion 5 „Funktion"):
  > Das {gebaeude_typ} umfasst insgesamt {wohneinheiten} Wohneinheiten. {funktion_zusatz_einheiten}
  (`_template_extract.md:377`)
- **Auswirkung**: Wert „3" → „Das Wohngebäude umfasst insgesamt 3 Wohneinheiten."
- **Besonderheiten**: Freitext-Feld, keine Zahlen-Validierung.

### `vollgeschosse`

- **Label im Formular**: „Vollgeschosse:"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:41`](../../required-fields.js))
- **Quelle**: `formular.html:268-271`
- **Mapping (Context)**: `lib/docx/context.js:100` — `const vollgeschosse = T.str(fields.vollgeschosse);`
- **Transformer**: `T.str` + `T.fallback`.
- **Output-Key(s)**: `vollgeschosse` (`lib/docx/context.js:322`) → `{vollgeschosse}`.
- **Template-Platzhalter**: `{vollgeschosse}` (einmalig).
- **Word-Kontext** (Sektion 5 „Funktion"):
  > Das Gebäude stammt aus dem Jahr {baujahr} und verfügt über {vollgeschosse} Vollgeschosse.
  (`_template_extract.md:373`)
- **Auswirkung**: Wert „2" → „…verfügt über 2 Vollgeschosse."
- **Besonderheiten**: Unterschiedlich zu `geschossigkeit`! `vollgeschosse` ist die rein bauordnungsrechtliche Anzahl der Vollgeschosse (ganze Zahl), `geschossigkeit` ist eine kompoundsbildende Beschreibung in 0,5er-Schritten.

### `nutzflaeche`

- **Label im Formular**: „Nutzfläche (m²):"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:42`](../../required-fields.js))
- **Quelle**: `formular.html:272-275`
- **Mapping (Context)**: `lib/docx/context.js:99` — `const nutzflaeche = T.str(fields.nutzflaeche);`
- **Transformer**: `T.str` + `T.fallback`.
- **Output-Key(s)**: `nutzflaeche` (`lib/docx/context.js:321`) → `{nutzflaeche}`.
- **Template-Platzhalter**: `{nutzflaeche}` (einmalig).
- **Word-Kontext** (Sektion 5, Ausstattungsgrad-Satz):
  > …und die Nutzfläche des Gebäudes beträgt gemäß Angaben des Eigentümers rd. {nutzflaeche} m² für das {gebaeude_typ} …
  (`_template_extract.md:265`)
- **Auswirkung**: Wert „218" → „…rd. 218 m² für das Wohngebäude…"
- **Besonderheiten**: m²-Einheit ist im Template fest formuliert, nicht im Wert eingefügt.

### `nutzung`

- **Label im Formular**: „Derzeitige Nutzung:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `wohnzwecke` — „zu Wohnzwecken"
  - `gewerblich` — „gewerblich"
  - `wohngewerblich` — „Wohn- und Bürogebäude"
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:43`](../../required-fields.js))
- **Quelle**: `formular.html:278-294`
- **Mapping (Context)**: `lib/docx/context.js:140-142`:
  - `const gebaeudeTyp = T.toDisplayGebaeudeTyp(fields.nutzung);`
  - `const gebaeudeTypGen = T.toDisplayGebaeudeTypGen(fields.nutzung);`
  - `const nutzungsZweckSatz = T.toDisplayNutzungsZweckSatz(fields.nutzung, fields.nutzung_vergangenheit);`
- **Transformer**:
  - `toDisplayGebaeudeTyp` ([`lib/transformers.js:252-259`](../../lib/transformers.js)) — Map: `wohnzwecke` → „Wohngebäude", `gewerblich` → „Gewerbegebäude", `wohngewerblich` → „Wohn- und Bürogebäude".
  - `toDisplayGebaeudeTypGen` ([`lib/transformers.js:261-268`](../../lib/transformers.js)) — Genitiv-Variante: „Wohngebäudes", „Gewerbegebäudes", „Wohn- und Bürogebäudes".
  - `toDisplayNutzungsZweckSatz` ([`lib/transformers.js:280-293`](../../lib/transformers.js)) — Generiert Satzfragment, siehe `nutzung_vergangenheit`.
- **Output-Key(s)** (alle mit `T.fallback`):
  - `gebaeude_typ` (`lib/docx/context.js:339`) → `{gebaeude_typ}` (tritt **8 Mal** im Template auf).
  - `gebaeude_typ_gen` (`lib/docx/context.js:340`) → `{gebaeude_typ_gen}`.
  - `nutzungs_zweck_satz` (`lib/docx/context.js:341`) → `{nutzungs_zweck_satz}`.
- **Template-Platzhalter**: `{gebaeude_typ}`, `{gebaeude_typ_gen}`, `{nutzungs_zweck_satz}`
- **Word-Kontext** (Auswahl):
  > Gegenstand dieses Gutachtens ist das {gebaeude_typ}
  (`_template_extract.md:169`)

  > Der bauliche und technische Zustand des {baujahr} errichteten und {renovierungsstatus_adj} {gebaeude_typ_gen} ist, soweit anhand einer Begehung feststellbar, als {zustand_kurz} zu bezeichnen.
  (`_template_extract.md:261`)

  > Die zu begutachtende Liegenschaft {nutzungs_zweck_satz} genutzt.
  (`_template_extract.md:227`)

  > Das {gebaeude_typ} umfasst insgesamt {wohneinheiten} Wohneinheiten.
  (`_template_extract.md:377`)

  > In hilfsweiser Anlehnung an das Modell zur Ableitung der wirtschaftlichen Restnutzungsdauer für {gebaeude_typ} unter Berücksichtigung von Modernisierungen …
  (`_template_extract.md:651`)
- **Auswirkung**:
  - Wahl „wohnzwecke" → `{gebaeude_typ}` wird zu „Wohngebäude", `{gebaeude_typ_gen}` zu „Wohngebäudes", und der Liegenschafts-Satz wird zu „Die zu begutachtende Liegenschaft wird aktuell und wurde in der Vergangenheit zu Wohnzwecken genutzt." (bei Vergangenheit=`gleich`).
  - Wahl „gewerblich" → „Gewerbegebäude", „Gewerbegebäudes", „zu gewerblichen Zwecken".
  - Wahl „wohngewerblich" → „Wohn- und Bürogebäude", „Wohn- und Bürogebäudes", „zu Wohn- und Gewerbezwecken".
- **Besonderheiten**: Das ist eines der mächtigsten Felder — `{gebaeude_typ}` taucht überall im Gutachten auf. Achtung: Im Template gibt es eine kreative Stelle „Ohne Modernisierungsmaßnahmen wird bei {gebaeude_typ}n von einer …" (`_template_extract.md:623`) — das `n` wird **fest hinter** dem Platzhalter im Template angehängt, um Pluralisierung „Wohngebäuden" zu erzeugen. Bei `gewerblich` ergibt das „Gewerbegebäuden", bei `wohngewerblich` „Wohn- und Bürogebäuden".

### `nutzung_vergangenheit`

- **Label im Formular**: „Nutzung in der Vergangenheit:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `gleich` — „wie aktuell" (default)
  - `wohnzwecke` — „zu Wohnzwecken"
  - `gewerblich` — „gewerblich"
  - `wohngewerblich` — „Wohn- und Bürogebäude"
- **Pflichtfeld**: nein (Default `gleich` ist gesetzt)
- **Quelle**: `formular.html:295-315`
- **Mapping (Context)**: `lib/docx/context.js:142` — als 2. Argument an `T.toDisplayNutzungsZweckSatz`.
- **Transformer**: `toDisplayNutzungsZweckSatz` ([`lib/transformers.js:280-293`](../../lib/transformers.js)):
  - Wenn Wert leer / `gleich` / identisch mit aktueller Nutzung → „wird aktuell und wurde in der Vergangenheit zu {nutzungszweck}".
  - Sonst → „wird aktuell zu {current} und wurde in der Vergangenheit zu {past}".
- **Output-Key(s)**: nur über `nutzungs_zweck_satz` (kein eigener Platzhalter).
- **Template-Platzhalter**: kein eigener; fließt in `{nutzungs_zweck_satz}`.
- **Word-Kontext**:
  > Die zu begutachtende Liegenschaft {nutzungs_zweck_satz} genutzt.
  (`_template_extract.md:227`)
- **Auswirkung**:
  - `gleich` + aktuell=`wohnzwecke`: „…wird aktuell und wurde in der Vergangenheit zu Wohnzwecken genutzt."
  - `gewerblich` + aktuell=`wohnzwecke`: „…wird aktuell zu Wohnzwecken und wurde in der Vergangenheit zu gewerblichen Zwecken genutzt."
- **Besonderheiten**: Wenn das Feld einen anderen Wert hat als die aktuelle Nutzung, entsteht ein längerer Satz mit zwei Zeitformen. Achtung: Wenn `nutzung` leer ist, ist `nutzungs_zweck_satz` ebenfalls leer, dann `___`.

### `stellplaetze_vorhanden`

- **Label im Formular**: „Stellplätze:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `ja` — „ja" (aktiviert das Feld `stellplaetze_anzahl`)
  - `nein` — „nein" (deaktiviert das Feld `stellplaetze_anzahl`)
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:44`](../../required-fields.js))
- **Quelle**: `formular.html:316-332`
- **Mapping (Context)**: `lib/docx/context.js:101` — `const stellplaetze = T.buildStellplaetzeText(fields);`
- **Transformer**: `buildStellplaetzeText` ([`lib/transformers.js:479-489`](../../lib/transformers.js)):
  - `nein` → „keine Stellplätze".
  - `ja` mit Anzahl `1` → „einen Stellplatz".
  - `ja` mit Anzahl >1 → „N Stellplätze".
  - Leer oder fehlende Anzahl bei `ja` → leerer String.
- **Output-Key(s)**: `stellplaetze` (`lib/docx/context.js:323`) → `{stellplaetze}`.
- **Template-Platzhalter**: `{stellplaetze}`.
- **Word-Kontext** (Sektion 5 „Garagen / Stellplätze"):
  > Das Gebäude verfügt über {stellplaetze}.
  (`_template_extract.md:579`)
- **Auswirkung**:
  - `nein` → „Das Gebäude verfügt über keine Stellplätze."
  - `ja` + Anzahl `1` → „Das Gebäude verfügt über einen Stellplatz."
  - `ja` + Anzahl `3` → „Das Gebäude verfügt über 3 Stellplätze."
- **Besonderheiten**: Komplementäres Feld `stellplaetze_anzahl` ist nur aktiv, wenn `ja` gewählt ist (siehe nächstes Feld).

### `stellplaetze_anzahl`

- **Label im Formular**: „Anzahl:"
- **HTML-Input-Typ**: `type="number"` (`min="1"`, `step="1"`), per default `disabled`.
- **Optionen**: keine
- **Pflichtfeld**: konditional (Kunde, `[required-fields.js:154-156]`) — nur bei `stellplaetze_vorhanden === 'ja'`.
- **Quelle**: `formular.html:327-331`
- **Mapping (Context)**: indirekt über `buildStellplaetzeText` (`lib/docx/context.js:101`).
- **Transformer**: `buildStellplaetzeText` ([`lib/transformers.js:479-489`](../../lib/transformers.js)) — parst die Anzahl per `parseInt`.
- **Output-Key(s)**: nur über `stellplaetze`.
- **Template-Platzhalter**: kein eigener; fließt in `{stellplaetze}`.
- **Word-Kontext**: über `{stellplaetze}` (siehe oben).
- **Auswirkung**: Steuert, ob „einen Stellplatz" oder „N Stellplätze" steht.
- **Besonderheiten**: Wenn `stellplaetze_vorhanden === 'ja'`, aber `stellplaetze_anzahl` leer/ungültig ist, liefert `buildStellplaetzeText` einen leeren String → durch `T.fallback` zu `___`. Sprich: „Das Gebäude verfügt über ___." Über die `toggleBjField`-JS-Funktion wird das Feld bei `nein` deaktiviert.

### `aufzug`

- **Label im Formular**: „Aufzug:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `ja` — „ja" (aktiviert `aufzug_baujahr`)
  - `nein` — „nein"
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:51`](../../required-fields.js))
- **Quelle**: `formular.html:333-349`
- **Mapping (Context)**: `lib/docx/context.js:137` — `const aufzugText = T.jaNein(fields.aufzug, fields.aufzug_baujahr);`
- **Transformer**: `jaNein` ([`lib/transformers.js:471-477`](../../lib/transformers.js)):
  - `nein` → „nicht vorhanden".
  - `ja` mit Baujahr → „vorhanden (Baujahr {bj})".
  - `ja` ohne Baujahr → „vorhanden".
- **Output-Key(s)**: `aufzug` (`lib/docx/context.js:387`) → `{aufzug}`.
- **Template-Platzhalter**: `{aufzug}`.
- **Word-Kontext** (Sektion 5 „Ausbau"):
  > Aufzug:{aufzug}
  (`_template_extract.md:473`)
- **Auswirkung**:
  - `nein` → „Aufzug: nicht vorhanden".
  - `ja` + Baujahr „2010" → „Aufzug: vorhanden (Baujahr 2010)".
  - `ja` ohne Baujahr → „Aufzug: vorhanden".
- **Besonderheiten**: Befindet sich strukturell unter „Ausbau", obwohl das Aufzug-Feld im Formular in der Eckdaten-Zeile sitzt.

### `aufzug_baujahr`

- **Label im Formular**: „Baujahr:" (neben dem Aufzug-Radio)
- **HTML-Input-Typ**: `type="text"`, per default `disabled`.
- **Optionen**: keine
- **Pflichtfeld**: konditional (Kunde, [`required-fields.js:157-159`](../../required-fields.js)) — nur bei `aufzug === 'ja'`.
- **Quelle**: `formular.html:344-348`
- **Mapping (Context)**: indirekt über `jaNein` (`lib/docx/context.js:137`).
- **Transformer**: `jaNein` (siehe oben).
- **Output-Key(s)**: nur über `aufzug`.
- **Template-Platzhalter**: kein eigener; fließt in `{aufzug}`.
- **Word-Kontext**: über `{aufzug}` (siehe oben).
- **Auswirkung**: Steuert, ob in der Aufzug-Zeile zusätzlich „(Baujahr YYYY)" steht.
- **Besonderheiten**: Wird über JS-`toggleBjField` aktiviert / deaktiviert.

### `flur` (admin-only)

- **Label im Formular**: „Flur:" (Sub-Header „Liegenschaft")
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Gutachter, [`required-fields.js:78`](../../required-fields.js))
- **Quelle**: `formular.html:353-357`
- **Mapping (Context)**: `lib/docx/context.js:104` — `const flur = T.str(fields.flur);`
- **Transformer**: `T.str` + `T.fallback`.
- **Output-Key(s)**: `flur` (`lib/docx/context.js:312`) → `{flur}`. Wird zusätzlich in die generierten Texte `sachverhalt_einleitung` und `sachverhalt_zwischen` weitergereicht.
- **Template-Platzhalter**: `{flur}` (tritt **mehrfach** auf).
- **Word-Kontext** (Auswahl):
  > über das Gebäude auf dem Grundstück (Flur {flur}; Flst.Nr.: {flurstueck})
  (`_template_extract.md:11` — Deckblatt)

  > lfd. Nr. 1, (Flur {flur}; Flst.Nr.: {flurstueck}) der Gemarkung {gemarkung} in {genaue_anschrift}
  (`_template_extract.md:145`)

  > Das zu begutachtende Gebäude befindet sich auf dem Grundstück „{genaue_anschrift}" (Flur {flur}; Flst.Nr.: {flurstueck}).
  (`_template_extract.md:213`)
- **Auswirkung**: Wert „1234" → wird an mind. 3 Stellen eingefügt. Ohne Wert: `___`.
- **Besonderheiten**: Fließt zusätzlich in den Generator `buildSachverhaltEinleitung` (`lib/docx/context.js:12-24`), wo bei vorhandenem Flur/Flurstück die längere Variante „Das Grundstück Flur 1234; Flst.Nr.: 567 …" verwendet wird.

### `flurstueck` (admin-only)

- **Label im Formular**: „Flurstücksnummer:"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Gutachter, [`required-fields.js:79`](../../required-fields.js))
- **Quelle**: `formular.html:358-361`
- **Mapping (Context)**: `lib/docx/context.js:105` — `const flurstueck = T.str(fields.flurstueck);`
- **Transformer**: `T.str` + `T.fallback`.
- **Output-Key(s)**: `flurstueck` (`lib/docx/context.js:313`) → `{flurstueck}`.
- **Template-Platzhalter**: `{flurstueck}` (mehrfach, an denselben Stellen wie `{flur}`).
- **Word-Kontext**: siehe `flur`.
- **Auswirkung**: Wert „567" → erscheint überall, wo `{flurstueck}` steht.
- **Besonderheiten**: wie `flur` — wird zusätzlich in `sachverhalt_einleitung` verwendet.

### `gemarkung` (admin-only)

- **Label im Formular**: „Gemarkung:" (Placeholder: „z.B. Friesenheim (074157)")
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Gutachter, [`required-fields.js:80`](../../required-fields.js))
- **Quelle**: `formular.html:362-365`
- **Mapping (Context)**: `lib/docx/context.js:106` — `const gemarkung = T.str(fields.gemarkung);`
- **Transformer**: `T.str` + `T.fallback`.
- **Output-Key(s)**: `gemarkung` (`lib/docx/context.js:314`) → `{gemarkung}`.
- **Template-Platzhalter**: `{gemarkung}` (zweifach).
- **Word-Kontext**:
  > der Gemarkung {gemarkung} in
  (`_template_extract.md:13` — Deckblatt)

  > lfd. Nr. 1, (Flur {flur}; Flst.Nr.: {flurstueck}) der Gemarkung {gemarkung} in {genaue_anschrift}
  (`_template_extract.md:145`)
- **Auswirkung**: Wert „Friesenheim (074157)" → „der Gemarkung Friesenheim (074157) in Lukas-Cranach-Str. 14, 80538 München".
- **Besonderheiten**: Es wird empfohlen, im Klammertext den ALKIS-Gemarkungs-Code mitzuführen.

### `bundesland` (admin-only)

- **Label im Formular**: „Bundesland:"
- **HTML-Input-Typ**: `<select>` (Dropdown)
- **Optionen** (16 deutsche Bundesländer):
  - `BW` Baden-Württemberg · `BY` Bayern · `BE` Berlin · `BB` Brandenburg · `HB` Bremen · `HH` Hamburg · `HE` Hessen · `MV` Mecklenburg-Vorpommern · `NI` Niedersachsen · `NW` Nordrhein-Westfalen · `RP` Rheinland-Pfalz · `SL` Saarland · `SN` Sachsen · `ST` Sachsen-Anhalt · `SH` Schleswig-Holstein · `TH` Thüringen.
- **Pflichtfeld**: ja (Gutachter, [`required-fields.js:81`](../../required-fields.js))
- **Quelle**: `formular.html:366-388`
- **Mapping (Context)**:
  - `lib/docx/context.js:107` — `const bundesland = T.str(fields.bundesland);`
  - `lib/docx/context.js:108` — `const landesbauordnung = T.getLandesbauordnung(bundesland);`
  - `lib/docx/context.js:185` — `const liegenschaftskarteQuelle = T.getLiegenschaftskarteQuelle(bundesland);`
- **Transformer**:
  - `getLandesbauordnung` ([`lib/transformers.js:415-418`](../../lib/transformers.js)) liefert ein Objekt `{ name, kurz }` aus der Lookup-Tabelle `LANDESBAUORDNUNG_BY_BUNDESLAND` ([`lib/transformers.js:396-413`](../../lib/transformers.js)). Beispiele:
    - `BW` → `{ name: 'Landesbauordnung für Baden-Württemberg', kurz: 'LBO' }`
    - `BY` → `{ name: 'Bayerische Bauordnung', kurz: 'BayBO' }`
    - `NW` → `{ name: 'Bauordnung für das Land Nordrhein-Westfalen', kurz: 'BauO NRW' }`
    - leer / ungültig → `{ name: '', kurz: '' }` → `___` per `T.fallback`.
  - `getLiegenschaftskarteQuelle` ([`lib/transformers.js:439-441`](../../lib/transformers.js)) liefert die kommagetrennte Geoportal-Quelle aus der Lookup-Tabelle `LIEGENSCHAFTSKARTE_QUELLE` ([`lib/transformers.js:420-437`](../../lib/transformers.js)). Beispiele:
    - `BW` → `, geoportal-bw.de`
    - `BY` → `, geoportal.bayern.de`
    - `NW` → `, GEOportal.NRW`
    - leer / ungültig → `''`.
- **Output-Key(s)**:
  - `landesbauordnung_name` (`lib/docx/context.js:315`) → `{landesbauordnung_name}`.
  - `landesbauordnung_kurz` (`lib/docx/context.js:316`) → `{landesbauordnung_kurz}`.
  - `liegenschaftskarte_quelle` (`lib/docx/context.js:376`) → `{liegenschaftskarte_quelle}` — **ohne** `T.fallback`! Leeres Bundesland erzeugt keinen Platzhalter, sondern einen unsichtbaren leeren String.
- **Template-Platzhalter**: `{landesbauordnung_name}`, `{landesbauordnung_kurz}`, `{liegenschaftskarte_quelle}`.
- **Word-Kontext**:
  > {landesbauordnung_name}- {landesbauordnung_kurz} -
  (`_template_extract.md:93` — Sektion 1.2 in der Liste der Rechtsgrundlagen)

  > Bild 2: Auszug aus der Liegenschaftskarte{liegenschaftskarte_quelle}
  (`_template_extract.md:219` — Sektion 4)
- **Auswirkung**:
  - Bundesland `BW` → „Landesbauordnung für Baden-Württemberg- LBO -" in Sektion 1.2, und „Bild 2: Auszug aus der Liegenschaftskarte, geoportal-bw.de" in Sektion 4.
  - Bundesland `NW` → „Bauordnung für das Land Nordrhein-Westfalen- BauO NRW -" und „Bild 2: Auszug aus der Liegenschaftskarte, GEOportal.NRW".
  - Leer → „___- ___ -" und „Bild 2: Auszug aus der Liegenschaftskarte" (ohne Komma/Quelle).
- **Besonderheiten**: Die UI auto-fillt das Bundesland anhand der PLZ beim Tippen (außerhalb des DOCX-Pfades). Die Liegenschaftskarte-Quelle wird **nicht** über `T.fallback` geleitet — fehlt das Bundesland, bleibt das einfach leer (kein `___`-Marker).

### `grundstueck_flaeche`

- **Label im Formular**: „Grundstücksfläche (m²):" (Placeholder „z.B. 383")
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:45`](../../required-fields.js))
- **Quelle**: `formular.html:392-395`
- **Mapping (Context)**: `lib/docx/context.js:109` — `const grundstueckFlaeche = T.str(fields.grundstueck_flaeche);`
- **Transformer**: `T.str`. Kein direkter Output-Key, **nur** als Bestandteil von `sachverhalt_einleitung` (über `sharedCtx.grundstueckFlaeche`, `lib/docx/context.js:216-219`).
- **Output-Key(s)**: nur in `{sachverhalt_einleitung}` als Teil von „mit einer Fläche von … m²".
- **Template-Platzhalter**: kein eigener; fließt in `{sachverhalt_einleitung}` (Sektion 3).
- **Word-Kontext** (Sektion 3 — Anfang Sachverhalt):
  > {sachverhalt_einleitung}
  (`_template_extract.md:165`)

  Generator-Logik (`lib/docx/context.js:12-24`): wenn `grundstueckFlaeche` ausgefüllt ist, fügt der Satz „… mit einer Fläche von 383 m²" ein, sonst entfällt der Flächen-Teil komplett.
- **Auswirkung**:
  - Mit Flur+Flurstück und Wert „383": „Das Grundstück Flur 1234; Flst.Nr.: 567 mit einer Fläche von 383 m² ist mit einem … bebaut."
  - Ohne Wert: „Das Grundstück Flur 1234; Flst.Nr.: 567 ist mit einem … bebaut."
- **Besonderheiten**: Wird ausschließlich für `sachverhalt_einleitung` verwendet. Fließt **nicht** in einen separaten Platzhalter.

### `gebaeude_grundflaeche`

- **Label im Formular**: „Gebäude-Grundfläche (m²):" (Placeholder „z.B. 80")
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:46`](../../required-fields.js))
- **Quelle**: `formular.html:396-399`
- **Mapping (Context)**: `lib/docx/context.js:110` — `const gebaeudeGrundflaeche = T.str(fields.gebaeude_grundflaeche);`
- **Transformer**: `T.str`. Wird über `sharedCtx` (`lib/docx/context.js:216-220`) an `buildSachverhaltZwischen` (`lib/docx/context.js:26-39`) gegeben.
- **Output-Key(s)**: nur indirekt in `{sachverhalt_zwischen}`.
- **Template-Platzhalter**: kein eigener; fließt in `{sachverhalt_zwischen}` (Sektion 3).
- **Word-Kontext** (Sektion 3):
  > {sachverhalt_zwischen}
  (`_template_extract.md:175`)

  Generator-Logik: bei vorhandener Grundfläche fügt der Satz „weist eine Grundfläche von ca. 80 m² auf (gemäß Angaben des Eigentümers; durch den Sachverständigen mittels überschlägiger Plausibilitätsprüfung verifiziert)" ein.
- **Auswirkung**:
  - Mit Wert „80": „Das bezeichnete Gebäude ist zweigeschossig ausgeführt, vollständig unterkellert und weist eine Grundfläche von ca. 80 m² auf (…). Dem Unterzeichner lagen Auszüge aus den ursprünglichen Eingabeplänen sowie nachträglich erstellte Bestandsunterlagen vor."
  - Ohne Wert: nur Geschossigkeit + Kellerung im Satz, ohne Grundflächen-Teil.
- **Besonderheiten**: Wird ausschließlich für `sachverhalt_zwischen` verwendet.

### `geschossigkeit`

- **Label im Formular**: „Geschossigkeit (1,0 – 8,0 in 0,5er-Schritten):" (mit Datalist)
- **HTML-Input-Typ**: `type="text"` mit `inputmode="decimal"` und Datalist `geschossigkeit_options`.
- **Optionen** (Datalist, dürfen aber auch frei getippt werden): `1,0`, `1,5`, `2,0`, `2,5`, …, `8,0` in 0,5er-Schritten.
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:47`](../../required-fields.js))
- **Quelle**: `formular.html:402-428`
- **Mapping (Context)**: `lib/docx/context.js:188-190`:
  - `const geschossigkeit = T.toDisplayGeschossigkeit(fields.geschossigkeit);`
  - `const geschossigkeitDekl = T.toDisplayGeschossigkeitDekl(fields.geschossigkeit);`
  - `const geschossigkeitStoeckig = T.toDisplayGeschossigkeitMehrstoeckig(fields.geschossigkeit);`
- **Transformer**: alle drei verwenden `parseGeschossigkeitNum` ([`lib/transformers.js:68-76`](../../lib/transformers.js)) und `geschossigkeitWortstamm` ([`lib/transformers.js:79-88`](../../lib/transformers.js)):
  - `parseGeschossigkeitNum`: ersetzt `,` durch `.`, prüft auf 1.0–8.0 in 0,5er-Schritten. Ungültig → `null`.
  - `geschossigkeitWortstamm`: erzeugt aus 1 → „ein", 1,5 → „eineinhalb", 2 → „zwei", 2,5 → „zweieinhalb", …, 8 → „acht".
  - `toDisplayGeschossigkeit` ([`lib/transformers.js:90-93`](../../lib/transformers.js)): hängt `geschossig` an → „eingeschossig", „eineinhalbgeschossig", „zweigeschossig", „zweieinhalbgeschossig", …
  - `toDisplayGeschossigkeitDekl` ([`lib/transformers.js:95-98`](../../lib/transformers.js)): hängt `geschossigen` an → „eingeschossigen", „zweigeschossigen", … (Adjektiv im Akk./Dat.).
  - `toDisplayGeschossigkeitMehrstoeckig` ([`lib/transformers.js:111-114`](../../lib/transformers.js)): hängt `stöckiges` an → „einstöckiges", „zweistöckiges", … Bei ungültigem Wert: Fallback „mehrstöckiges".
- **Output-Key(s)**:
  - Kein eigener Platzhalter mit `{geschossigkeit}` etc.! Alle drei Formen fließen über `sharedCtx` in:
    - `{sachverhalt_einleitung}` (über `geschossigkeitDekl`)
    - `{sachverhalt_zwischen}` (über `geschossigkeit`)
    - `{gebaeude_kurzbeschreibung}` (über `geschossigkeitDekl`)
    - `{bautechnik_einleitung}` (über `geschossigkeitStoeckig`)
- **Template-Platzhalter**: kein eigener; fließt in `{sachverhalt_einleitung}`, `{sachverhalt_zwischen}`, `{gebaeude_kurzbeschreibung}`, `{bautechnik_einleitung}` (Sektion 6).
- **Word-Kontext** (Auswahl der zusammengesetzten Sätze):
  > {sachverhalt_einleitung}
  → enthält Adjektiv-Form, z.B. „… ist mit einem zweigeschossigen, unterkellerten freistehenden Gebäude bebaut."

  > {sachverhalt_zwischen}
  → „Das bezeichnete Gebäude ist zweigeschossig ausgeführt, vollständig unterkellert und weist eine Grundfläche von ca. 80 m² auf …"

  > {gebaeude_kurzbeschreibung}
  → „Das Gebäude ist ein freistehendes Gebäude und besteht aus einem zweigeschossigen, unterkellerten Gebäude mit Satteldach und ausbaufähigem Spitzboden."

  > Das {gebaeude_typ} wurde {baujahr} als {bautechnik_einleitung} in baujahrestypischer {bauweise} gebaut.
  (`_template_extract.md:587`) → enthält die `stöckig`-Form: „… wurde 1972 als zweistöckiges Satteldachgebäude mit Unterkellerung in baujahrestypischer Mauerwerksbauweise gebaut."
- **Auswirkung**:
  - Wert „2,0" → Sätze werden mit „zweigeschossig"/„zweigeschossigen"/„zweistöckiges" eingefügt.
  - Wert „2,5" → „zweieinhalbgeschossig"/„zweieinhalbgeschossigen"/„zweieinhalbstöckiges".
  - Wert „1,0" → „eingeschossig"/„eingeschossigen"/„einstöckiges".
  - Leer/ungültig → die drei zusammengesetzten Sätze fallen zurück auf Default-Werte oder lassen den Teil weg.
- **Besonderheiten**: Das ist das komplexeste Wandlungs-Beispiel der Sektion. Die Eingabe darf mit Komma oder Punkt erfolgen, wird aber strikt geprüft (Range 1–8, 0,5er-Schritte). Ungültige Werte produzieren bei `*Stoeckig` den Fallback „mehrstöckiges", bei den anderen leeren String.

### `kellerung`

- **Label im Formular**: „Kellerung:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `unterkellert` — „unterkellert"
  - `teilunterkellert` — „teilunterkellert"
  - `nicht` — „nicht unterkellert"
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:48`](../../required-fields.js))
- **Quelle**: `formular.html:431-438`
- **Mapping (Context)**: `lib/docx/context.js:191-194`:
  - `const kellerungAdj = T.toDisplayKellerungAdjektiv(fields.kellerung);`
  - `const kellerungKey = T.str(fields.kellerung).toLowerCase();`
  - `const istUnterkellert = kellerungKey === 'unterkellert' || kellerungKey === 'teilunterkellert';`
  - `const kellerdeckeLabel = istUnterkellert ? 'Kellerdecke' : 'Bodenplatte';`
- **Transformer**:
  - `toDisplayKellerungAdjektiv` ([`lib/transformers.js:125-132`](../../lib/transformers.js)) — Map: `unterkellert` → „unterkellerten", `teilunterkellert` → „teilunterkellerten", `nicht` → „nicht unterkellerten".
  - `toDisplayKellerung` ([`lib/transformers.js:116-123`](../../lib/transformers.js)) wird in dieser Sektion **nicht** verwendet (nur indirekt).
- **Output-Key(s)**:
  - `kellerung_adj` (`lib/docx/context.js:342`) → `{kellerung_adj}`.
  - `kellerdecke_label` (`lib/docx/context.js:375`) → `{kellerdecke_label}` (Wert: „Kellerdecke" oder „Bodenplatte", **ohne** `T.fallback`).
  - Indirekt in `{sachverhalt_einleitung}` (über `kellerungAdj`), `{sachverhalt_zwischen}` (über `fields.kellerung`), `{gebaeude_kurzbeschreibung}` (über `kellerungAdj`), `{bautechnik_einleitung}` (`lib/docx/context.js:253-257`: „mit Unterkellerung" bzw. „ohne Unterkellerung"), `{fundamente_einschaetzung_text}` (`lib/docx/context.js:270-272`), `{waermeschutz_text}` (`lib/docx/context.js:54-75`).
- **Template-Platzhalter**: `{kellerung_adj}`, `{kellerdecke_label}` (sowie viele zusammengesetzte Texte).
- **Word-Kontext** (Auswahl):
  > Der Ausstattungsgrad des {kellerung_adj}, in {bauweise} errichteten {gebaeude_form_gen} mit {dachform} ist …
  (`_template_extract.md:265`)

  > - {kellerdecke_label}: {energie_kellerdecke}
  (`_template_extract.md:285` — Sektion 5, Energetischer Zustand)

  > {sachverhalt_zwischen}
  → enthält bei `unterkellert` „vollständig unterkellert", bei `teilunterkellert` „teilunterkellert", bei `nicht` keinen Kellerung-Teil.

  > Das {gebaeude_typ} wurde {baujahr} als {bautechnik_einleitung} in baujahrestypischer {bauweise} gebaut.
  → `bautechnik_einleitung` enthält „mit Unterkellerung" oder „ohne Unterkellerung".

  > {fundamente_einschaetzung_text}
  → bei `unterkellert`/`teilunterkellert`: „Die Fundamente und der Keller sind massiv ausgebildet …". Sonst: „Die Fundamente sind massiv ausgebildet … Die Bodenplatte ist weder gedämmt noch abgedichtet."

  > {waermeschutz_text}
  → bei Unterkellerung der Hinweis „Weder der Keller noch das Dach sind zusätzlich gedämmt." statt „Weder das Dach noch die Wände sind zusätzlich gedämmt." (wenn beides ungedämmt ist).
- **Auswirkung**:
  - `unterkellert` → `kellerung_adj` = „unterkellerten"; `kellerdecke_label` = „Kellerdecke"; Sektion 5 zeigt „- Kellerdecke: {energie_kellerdecke}"; `sachverhalt_zwischen` enthält „vollständig unterkellert"; Sektion 6 sagt „mit Unterkellerung".
  - `teilunterkellert` → „teilunterkellerten"; „Kellerdecke" (gilt als unterkellert); „teilunterkellert"; Sektion 6 „mit Unterkellerung".
  - `nicht` → „nicht unterkellerten"; `kellerdecke_label` = „Bodenplatte"; Sektion 5 zeigt „- Bodenplatte: {energie_kellerdecke}"; `sachverhalt_zwischen` enthält keinen Kellerungs-Teil; Sektion 6 „ohne Unterkellerung".
- **Besonderheiten**: Eines der einflussreichsten Felder, beeinflusst 5+ Texte. Das `kellerdecke_label` (Sektion 5) wechselt zwischen „Kellerdecke" und „Bodenplatte", je nachdem ob ein Keller existiert.

### `spitzboden`

- **Label im Formular**: „Spitzboden:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `ausbaufaehig` — „ausbaufähig"
  - `nicht_ausbaufaehig` — „nicht ausbaufähig"
  - `ausgebaut` — „DG ausgebaut"
  - `keiner` — „keiner"
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:49`](../../required-fields.js))
- **Quelle**: `formular.html:439-447`
- **Mapping (Context)**: `lib/docx/context.js:195` — `const spitzbodenText = T.toDisplaySpitzboden(fields.spitzboden);`
- **Transformer**: `toDisplaySpitzboden` ([`lib/transformers.js:134-142`](../../lib/transformers.js)) — Map:
  - `ausbaufaehig` → „ausbaufähigem Spitzboden"
  - `nicht_ausbaufaehig` → „nicht ausbaufähigem Spitzboden"
  - `ausgebaut` → „ausgebautem Dachgeschoss"
  - `keiner` → `''` (leerer String)
- **Output-Key(s)**: kein eigener Platzhalter; fließt in `sharedCtx.spitzbodenText` und damit in `{gebaeude_kurzbeschreibung}` (`lib/docx/context.js:50`).
- **Template-Platzhalter**: kein eigener; fließt in `{gebaeude_kurzbeschreibung}`.
- **Word-Kontext** (Sektion 5):
  > {gebaeude_kurzbeschreibung}
  → mit Spitzboden=`ausbaufaehig`: „… Gebäude mit Satteldach und ausbaufähigem Spitzboden."
- **Auswirkung**:
  - `ausbaufaehig` → „und ausbaufähigem Spitzboden" wird an die Kurzbeschreibung angehängt.
  - `ausgebaut` → „und ausgebautem Dachgeschoss".
  - `nicht_ausbaufaehig` → „und nicht ausbaufähigem Spitzboden".
  - `keiner` → kein Spitzboden-Teil.
- **Besonderheiten**: Wird grammatisch direkt eingebaut („… mit Satteldach **und** ausbaufähigem Spitzboden"); die Wortform ist im Dativ ohne Artikel.

### `gebaeude_form`

- **Label im Formular**: „Gebäudeform:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `freistehend` — „freistehend"
  - `doppelhaus` — „Doppelhaus"
  - `reihenmittelhaus` — „Reihenmittelhaus"
  - `reihenendhaus` — „Reihenendhaus"
  - `mehrfamilienhaus` — „Mehrfamilienhaus"
- **Pflichtfeld**: ja (Kunde, [`required-fields.js:50`](../../required-fields.js))
- **Quelle**: `formular.html:450-459`
- **Mapping (Context)**: `lib/docx/context.js:196-198`:
  - `const gebaeudeForm = T.toDisplayGebaeudeForm(fields.gebaeude_form);`
  - `const gebaeudeFormDekl = T.toDisplayGebaeudeFormDekl(fields.gebaeude_form);`
  - `const gebaeudeFormGen = T.toDisplayGebaeudeFormGen(fields.gebaeude_form);`
- **Transformer**:
  - `toDisplayGebaeudeForm` ([`lib/transformers.js:144-153`](../../lib/transformers.js)) — Nominativ: `freistehend` → „freistehendes Gebäude", `doppelhaus` → „Doppelhaus", `reihenmittelhaus` → „Reihenmittelhaus", `reihenendhaus` → „Reihenendhaus", `mehrfamilienhaus` → „Mehrfamilienhaus".
  - `toDisplayGebaeudeFormDekl` ([`lib/transformers.js:156-165`](../../lib/transformers.js)) — Dativ Sg. nach „einem …": `freistehend` → „freistehenden Gebäude", andere unverändert.
  - `toDisplayGebaeudeFormGen` ([`lib/transformers.js:100-109`](../../lib/transformers.js)) — Genitiv: `freistehend` → „freistehenden Gebäudes", `doppelhaus` → „Doppelhauses", `reihenmittelhaus` → „Reihenmittelhauses", `reihenendhaus` → „Reihenendhauses", `mehrfamilienhaus` → „Mehrfamilienhauses". Fallback: „Gebäudes".
- **Output-Key(s)**:
  - `gebaeude_form_gen` (`lib/docx/context.js:343`) → `{gebaeude_form_gen}` (gewrappt in `T.fallback`).
  - Indirekt in `{sachverhalt_einleitung}` (über `gebaeudeFormDekl`), `{gebaeude_kurzbeschreibung}` (über `gebaeudeForm`).
- **Template-Platzhalter**: `{gebaeude_form_gen}` (sowie indirekt die generierten Sätze).
- **Word-Kontext**:
  > Der Ausstattungsgrad des {kellerung_adj}, in {bauweise} errichteten {gebaeude_form_gen} mit {dachform} ist {ausstattungsgrad}…
  (`_template_extract.md:265`)

  > {sachverhalt_einleitung}
  → enthält Dekl.-Form: „… ist mit einem zweigeschossigen, unterkellerten freistehenden Gebäude bebaut." (bei `freistehend`) bzw. „… ist mit einem zweigeschossigen, unterkellerten Doppelhaus bebaut."

  > {gebaeude_kurzbeschreibung}
  → enthält Nom.-Form: „Das Gebäude ist ein freistehendes Gebäude und besteht aus einem …" (bei `freistehend`).
- **Auswirkung**:
  - `freistehend` → `gebaeude_form_gen` = „freistehenden Gebäudes"; in der Kurzbeschreibung: „Das Gebäude ist ein freistehendes Gebäude und besteht…"; in der Einleitung: „… ist mit einem … freistehenden Gebäude bebaut".
  - `doppelhaus` → „Doppelhauses"; „Das Gebäude ist ein Doppelhaus und…"; „… mit einem … Doppelhaus bebaut".
  - Andere analog.
- **Besonderheiten**: Drei Deklinationsformen werden parallel berechnet, weil das Wort an unterschiedlichen grammatischen Stellen im Gutachten erscheint. `freistehend` ist die einzige Form, bei der eine Adjektiv-Konstruktion entsteht („freistehendes Gebäude" / „freistehenden Gebäude" / „freistehenden Gebäudes"); die anderen Optionen sind Substantive.

### `standardstufe` (admin-only)

- **Label im Formular**: „Standardstufe (SW-RL):"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**: `1`, `2`, `3`, `4`, `5` (ohne Beschriftung — die Stufen entsprechen der Sachwertrichtlinie).
- **Pflichtfeld**: ja (Gutachter, [`required-fields.js:84`](../../required-fields.js))
- **Quelle**: `formular.html:463-472`
- **Mapping (Context)**: `lib/docx/context.js:206` — `const standardstufe = T.str(fields.standardstufe);`
- **Transformer**: `T.str` + `T.fallback`.
- **Output-Key(s)**: `standardstufe` (`lib/docx/context.js:349`) → `{standardstufe}`.
- **Template-Platzhalter**: `{standardstufe}` (zweifach).
- **Word-Kontext**:
  > Der Ausstattungsgrad des {kellerung_adj}, in {bauweise} errichteten {gebaeude_form_gen} mit {dachform} ist {ausstattungsgrad} (im Mittel Stufe {standardstufe} ({gebaeude_typ}) Normalherstellungskosten -NHK- 2010) …
  (`_template_extract.md:265`)

  > Bei einer gewöhnlichen Gesamtnutzungsdauer von {rnd_gesamtnutzungsdauer} Jahren für das {gebaeude_typ} (hier Standardstufe {standardstufe} nach SW-RL) wäre somit eine Restnutzungsdauer von {rnd_jahre} Jahren …
  (`_template_extract.md:631`)
- **Auswirkung**: Wert `3` erscheint in Sektion 5 als „im Mittel Stufe 3 (Wohngebäude)" und in Sektion 7 als „Standardstufe 3 nach SW-RL".
- **Besonderheiten**: Reine Zahlenangabe — wird ohne weitere Konvertierung als String ausgegeben.

### `ausstattungsgrad` (admin-only)

- **Label im Formular**: „Ausstattungsgrad:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `einfach` — „einfache Art"
  - `mittel` — „mittlere Art"
  - `gehoben` — „gehobene Art"
- **Pflichtfeld**: ja (Gutachter, [`required-fields.js:85`](../../required-fields.js))
- **Quelle**: `formular.html:473-480`
- **Mapping (Context)**: `lib/docx/context.js:205` — `const ausstattungsgrad = T.toDisplayAusstattungsgrad(fields.ausstattungsgrad);`
- **Transformer**: `toDisplayAusstattungsgrad` ([`lib/transformers.js:209-212`](../../lib/transformers.js)) — Map: `einfach` → „überwiegend einfache Art", `mittel` → „mittlere Art", `gehoben` → „gehobene Art".
- **Output-Key(s)**: `ausstattungsgrad` (`lib/docx/context.js:348`) → `{ausstattungsgrad}` (gewrappt in `T.fallback`).
- **Template-Platzhalter**: `{ausstattungsgrad}`.
- **Word-Kontext**:
  > Der Ausstattungsgrad des {kellerung_adj}, in {bauweise} errichteten {gebaeude_form_gen} mit {dachform} ist {ausstattungsgrad} (im Mittel Stufe {standardstufe} ({gebaeude_typ}) Normalherstellungskosten -NHK- 2010) …
  (`_template_extract.md:265`)
- **Auswirkung**:
  - `einfach` → „… ist überwiegend einfache Art …"
  - `mittel` → „… ist mittlere Art …"
  - `gehoben` → „… ist gehobene Art …"
- **Besonderheiten**: Auch wenn das Label „einfache Art" lautet, mapt der Transformer den Wert auf „**überwiegend** einfache Art" — was im Gutachten weicher klingt.

### `renovierungsstatus` (admin-only)

- **Label im Formular**: „Renovierungsstatus:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `nicht_renoviert` — „nicht renoviert"
  - `teilweise` — „teilweise renoviert"
  - `umfassend` — „umfassend modernisiert"
  - `saniert` — „saniert"
- **Pflichtfeld**: ja (Gutachter, [`required-fields.js:86`](../../required-fields.js))
- **Quelle**: `formular.html:483-491`
- **Mapping (Context)**: `lib/docx/context.js:201-202`:
  - `const renovierungsstatusAdj = T.toDisplayRenovierungsstatusAdjektiv(fields.renovierungsstatus);`
  - `const renovierungsstatusSatz = T.toDisplayRenovierungsstatusSatz(fields.renovierungsstatus);`
- **Transformer**:
  - `toDisplayRenovierungsstatusAdjektiv` ([`lib/transformers.js:167-175`](../../lib/transformers.js)): `nicht_renoviert` → „nicht renovierten", `teilweise` → „teilweise renovierten", `umfassend` → „umfassend modernisierten", `saniert` → „sanierten".
  - `toDisplayRenovierungsstatusSatz` ([`lib/transformers.js:177-185`](../../lib/transformers.js)): `nicht_renoviert` → „nicht renoviert oder modernisiert", `teilweise` → „teilweise renoviert und modernisiert", `umfassend` → „umfassend modernisiert", `saniert` → „umfassend saniert".
- **Output-Key(s)**:
  - `renovierungsstatus_adj` (`lib/docx/context.js:344`) → `{renovierungsstatus_adj}` (gewrappt in `T.fallback`).
  - `renovierungsstatus_satz` (`lib/docx/context.js:345`) → `{renovierungsstatus_satz}` (gewrappt in `T.fallback`).
- **Template-Platzhalter**: `{renovierungsstatus_adj}`, `{renovierungsstatus_satz}`.
- **Word-Kontext**:
  > Der bauliche und technische Zustand des {baujahr} errichteten und {renovierungsstatus_adj} {gebaeude_typ_gen} ist, soweit anhand einer Begehung feststellbar, als {zustand_kurz} zu bezeichnen.
  (`_template_extract.md:261`)

  > Dies gilt auch für das Bewertungsobjekt, das ursprünglich im Jahr {baujahr} errichtet wurde.Es wurde {modernisierungs_jahre} {renovierungsstatus_satz}.
  (`_template_extract.md:627`)
- **Auswirkung**:
  - `nicht_renoviert` → Sektion 5: „… und nicht renovierten Wohngebäudes …"; Sektion 7: „Es wurde {modernisierungs_jahre} nicht renoviert oder modernisiert."
  - `teilweise` → „… teilweise renovierten Wohngebäudes …" / „… teilweise renoviert und modernisiert."
  - `umfassend` → „… umfassend modernisierten Wohngebäudes …" / „… umfassend modernisiert."
  - `saniert` → „… sanierten Wohngebäudes …" / „… umfassend saniert."
- **Besonderheiten**: Zwei parallele Deklinationsformen, weil „adj" als Adjektiv vor einem Substantiv steht (Genitiv), während „satz" eine verbale Konstruktion ist.

### `zustand_gesamt` (admin-only)

- **Label im Formular**: „Gesamtzustand:"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen**:
  - `altersgemaess` — „dem Alter entsprechend"
  - `gepflegt` — „gepflegt"
  - `unterdurchschnittlich` — „unterdurchschnittlich"
  - `renovierungsbeduerftig` — „renovierungsbedürftig"
  - `sanierungsbeduerftig` — „sanierungsbedürftig"
- **Pflichtfeld**: ja (Gutachter, [`required-fields.js:87`](../../required-fields.js))
- **Quelle**: `formular.html:492-501`
- **Mapping (Context)**: `lib/docx/context.js:203-204`:
  - `const zustandKurz = T.toDisplayZustandKurz(fields.zustand_gesamt);`
  - `const zustandLangDeklin = T.toDisplayZustandLangDeklin(fields.zustand_gesamt);`
- **Transformer**:
  - `toDisplayZustandKurz` ([`lib/transformers.js:187-196`](../../lib/transformers.js)) — wie Labels, Map: `altersgemaess` → „dem Alter entsprechend", `unterdurchschnittlich` → „unterdurchschnittlich", `gepflegt` → „gepflegt", `sanierungsbeduerftig` → „sanierungsbedürftig", `renovierungsbeduerftig` → „renovierungsbedürftig".
  - `toDisplayZustandLangDeklin` ([`lib/transformers.js:198-207`](../../lib/transformers.js)) — Adjektiv-Form Dat. Sg.: `altersgemaess` → „dem Alter entsprechenden", `unterdurchschnittlich` → „unterdurchschnittlichen", `gepflegt` → „gepflegten", `sanierungsbeduerftig` → „sanierungsbedürftigen", `renovierungsbeduerftig` → „renovierungsbedürftigen".
- **Output-Key(s)**:
  - `zustand_kurz` (`lib/docx/context.js:346`) → `{zustand_kurz}` (gewrappt in `T.fallback`).
  - `zustand_lang_deklin` (`lib/docx/context.js:347`) → `{zustand_lang_deklin}` (gewrappt in `T.fallback`).
- **Template-Platzhalter**: `{zustand_kurz}`, `{zustand_lang_deklin}`.
- **Word-Kontext**:
  > Der bauliche und technische Zustand des {baujahr} errichteten und {renovierungsstatus_adj} {gebaeude_typ_gen} ist, soweit anhand einer Begehung feststellbar, als {zustand_kurz} zu bezeichnen.
  (`_template_extract.md:261`)

  > Ansonsten erfolgten im Wesentlichen nur geringfügige Verbesserungen im Rahmen der gewöhnlichen Instandhaltung. Das Objekt befindet sich in einem {zustand_lang_deklin} Zustand.
  (`_template_extract.md:299`)
- **Auswirkung**:
  - `altersgemaess` → „… als dem Alter entsprechend zu bezeichnen." / „… in einem dem Alter entsprechenden Zustand."
  - `gepflegt` → „… als gepflegt zu bezeichnen." / „… in einem gepflegten Zustand."
  - `unterdurchschnittlich` → „… als unterdurchschnittlich zu bezeichnen." / „… in einem unterdurchschnittlichen Zustand."
  - `renovierungsbeduerftig` → „… als renovierungsbedürftig zu bezeichnen." / „… in einem renovierungsbedürftigen Zustand."
  - `sanierungsbeduerftig` → „… als sanierungsbedürftig zu bezeichnen." / „… in einem sanierungsbedürftigen Zustand."
- **Besonderheiten**: Kurz-/Lang-Splitting wegen unterschiedlicher Satzpositionen (Prädikativ vs. Attributiv mit Substantiv).

### `energieausweis_jahr`

- **Label im Formular**: „Ausstellungsjahr:"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: nein
- **Quelle**: `formular.html:504-507`
- **Mapping (Context)**: `lib/docx/context.js:102` — `const energieausweisJahr = T.str(fields.energieausweis_jahr);`
- **Transformer**: `T.str` + `T.fallback`.
- **Output-Key(s)**: `energieausweis_jahr` (`lib/docx/context.js:324`) → `{energieausweis_jahr}`.
- **Template-Platzhalter**: `{energieausweis_jahr}`.
- **Word-Kontext** (Sektion 5):
  > Ein Energieausweis aus dem Jahr {energieausweis_jahr} (gültig bis {energieausweis_gueltig_bis}) liegt vor.
  (`_template_extract.md:273`)
- **Auswirkung**: Wert „2018" → „Ein Energieausweis aus dem Jahr 2018 (gültig bis 2028) liegt vor."
- **Besonderheiten**: Leerer Wert → „… aus dem Jahr ___ (gültig bis ___) liegt vor." Die Logik berücksichtigt nicht, ob der Energieausweis überhaupt existiert — dieser Satz erscheint immer.

### `energieausweis_gueltig_bis`

- **Label im Formular**: „Gültig bis (Jahr):"
- **HTML-Input-Typ**: `type="text"`
- **Optionen**: keine
- **Pflichtfeld**: nein
- **Quelle**: `formular.html:508-511`
- **Mapping (Context)**: `lib/docx/context.js:103` — `const energieausweisGueltigBis = T.str(fields.energieausweis_gueltig_bis);`
- **Transformer**: `T.str` + `T.fallback`.
- **Output-Key(s)**: `energieausweis_gueltig_bis` (`lib/docx/context.js:325`) → `{energieausweis_gueltig_bis}`.
- **Template-Platzhalter**: `{energieausweis_gueltig_bis}`.
- **Word-Kontext**: gemeinsam mit `{energieausweis_jahr}`, siehe oben (`_template_extract.md:273`).
- **Auswirkung**: Wert „2028" → „… (gültig bis 2028) …".
- **Besonderheiten**: Wert kann frei getippt werden (keine Validierung).

## Zusammengesetzte Outputs (Generator-Funktionen)

Drei generierte Texte werden in `lib/docx/context.js` direkt aufgebaut und nutzen mehrere Sektion-`objekt`-Felder:

### `sachverhalt_einleitung` → `{sachverhalt_einleitung}`

- **Generator**: `buildSachverhaltEinleitung` ([`lib/docx/context.js:12-24`](../../lib/docx/context.js))
- **Inputs (aus Sektion `objekt`)**:
  - `flur`, `flurstueck` (admin) — bauen den Grundstücks-Teil.
  - `grundstueck_flaeche` — fügt „mit einer Fläche von … m²" ein.
  - `geschossigkeit` (über `geschossigkeitDekl`) — z.B. „zweigeschossigen".
  - `kellerung` (über `kellerungAdj`) — z.B. „unterkellerten".
  - `gebaeude_form` (über `gebaeudeFormDekl`) — z.B. „freistehenden Gebäude".
- **Word-Kontext** (Sektion 3, ganz am Anfang):
  > {sachverhalt_einleitung}

  → Beispiel: „Das Grundstück Flur 1234; Flst.Nr.: 567 mit einer Fläche von 383 m² ist mit einem zweigeschossigen, unterkellerten freistehenden Gebäude bebaut."
- **Auswirkung**: Wenn alle Eingaben leer sind, gibt der Generator `''` zurück → `{sachverhalt_einleitung}` wird durch `T.fallback` zu `___`.

### `sachverhalt_zwischen` → `{sachverhalt_zwischen}`

- **Generator**: `buildSachverhaltZwischen` ([`lib/docx/context.js:26-39`](../../lib/docx/context.js))
- **Inputs (aus Sektion `objekt`)**:
  - `geschossigkeit` — z.B. „zweigeschossig".
  - `kellerung` — Schlüssel `unterkellert` / `teilunterkellert` ergänzt „vollständig unterkellert" / „teilunterkellert".
  - `gebaeude_grundflaeche` — fügt „weist eine Grundfläche von ca. … m² auf …" ein.
- **Word-Kontext** (Sektion 3):
  > {sachverhalt_zwischen}

  → Beispiel: „Das bezeichnete Gebäude ist zweigeschossig ausgeführt, vollständig unterkellert und weist eine Grundfläche von ca. 80 m² auf (gemäß Angaben des Eigentümers; durch den Sachverständigen mittels überschlägiger Plausibilitätsprüfung verifiziert). Dem Unterzeichner lagen Auszüge aus den ursprünglichen Eingabeplänen sowie nachträglich erstellte Bestandsunterlagen vor."

### `gebaeude_kurzbeschreibung` → `{gebaeude_kurzbeschreibung}`

- **Generator**: `buildGebaeudeKurzbeschreibung` ([`lib/docx/context.js:41-52`](../../lib/docx/context.js))
- **Inputs (aus Sektion `objekt`)**:
  - `geschossigkeit` (über `geschossigkeitDekl`).
  - `kellerung` (über `kellerungAdj`).
  - `gebaeude_form` (über `gebaeudeForm` Nominativ).
  - `spitzboden` (über `spitzbodenText`).
  - Zusätzlich aus der Bauart-Sektion: `dachform`.
- **Word-Kontext** (Sektion 5, unter Bild 3):
  > {gebaeude_kurzbeschreibung}

  → Beispiel: „Das Gebäude ist ein freistehendes Gebäude und besteht aus einem zweigeschossigen, unterkellerten Gebäude mit Satteldach und ausbaufähigem Spitzboden."

### `bautechnik_einleitung` → `{bautechnik_einleitung}`

- **Generator**: direkt in `lib/docx/context.js:253-257`:
  ```js
  const bautechnikEinleitung = T.compactJoin([
    geschossigkeitStoeckig,
    dachform ? `${dachform}gebäude` : '',
    istUnterkellert ? 'mit Unterkellerung' : 'ohne Unterkellerung'
  ], ' ');
  ```
- **Inputs (aus Sektion `objekt`)**: `geschossigkeit` (über `geschossigkeitStoeckig`), `kellerung` (über `istUnterkellert`); zusätzlich `dachform` (aus Bauart-Sektion).
- **Word-Kontext** (Sektion 6):
  > Das {gebaeude_typ} wurde {baujahr} als {bautechnik_einleitung} in baujahrestypischer {bauweise} gebaut.
  (`_template_extract.md:587`)

  → Beispiel: „Das Wohngebäude wurde 1972 als zweistöckiges Satteldachgebäude mit Unterkellerung in baujahrestypischer Mauerwerksbauweise gebaut."

## Hinweise

- **`T.fallback` vs. leerer String**: Die meisten Outputs der Sektion sind durch `T.fallback(...)` geschützt — leer eingegebene Felder werden im Word zu `___`-Platzhaltern. Drei Ausnahmen ohne `fallback`:
  - `kellerdecke_label` (`lib/docx/context.js:375`) — wechselt nur zwischen „Kellerdecke" und „Bodenplatte" (immer ein gültiger Wert).
  - `liegenschaftskarte_quelle` (`lib/docx/context.js:376`) — beginnt mit Komma+Leerzeichen oder ist leer.
  - `bild1_caption`, `bild3_caption`, `bild4_caption` (gehören zu Sektion „Bilder", nicht zu „objekt").
- **Geschossigkeit vs. Vollgeschosse**: Beide Felder existieren parallel. `vollgeschosse` ist eine bauordnungsrechtliche Ganzzahl (z.B. „2"), die im Satz „… verfügt über 2 Vollgeschosse" verwendet wird. `geschossigkeit` ist eine kompoundbildende Beschreibung in 0,5er-Schritten (z.B. „2,0"), die in Adjektive „zweigeschossig"/„zweigeschossigen"/„zweistöckiges" gewandelt wird und in mehreren generierten Texten erscheint.
- **Bundesland**: Wenn das Bundesland leer ist, erscheinen die Landesbauordnungs-Felder als `___` in Sektion 1.2; die Liegenschaftskartenquelle bleibt unsichtbar (Sektion 4, Bild-2-Caption „Bild 2: Auszug aus der Liegenschaftskarte" ohne nachgestellte Quelle).
- **Anschrift-Verkettung**: `objekt_strasse` + `objekt_hausnummer` + `objekt_hausnummer_zusatz` werden zuerst per `compactJoin([str, [hn, zusatz]])` zu „Straße 14 a" verbunden, dann mit `objekt_plz` + `objekt_ort` (zu „80538 München") per Komma zu der vollen Anschrift „Straße 14 a, 80538 München". Leere Teile fallen automatisch raus.
