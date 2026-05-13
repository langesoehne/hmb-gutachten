# Bauteile — Detailtexte

Diese Sektion (`data-section-key="bauteile"`) ergänzt die Sektion **Bauart** um die freitextlichen **Detailbeschreibungen** der einzelnen Bauteile. Während die Sektion `bauart` über `<select>`-Felder die **Bauart-Pflichtwerte** (z.B. Bauweise Außenwand, Wandstärke, Innenwand-Material, Dachstuhl-Typ) festlegt, dienen die Felder hier zur Freitext-Detaillierung: konkrete Bodenbeläge, Beschreibungen von Treppen, Wandoberflächen, Tür-Ausführung, Badausstattung etc. Diese Felder sind im Formular als **admin-only** markiert (nur der Sachverständige füllt sie), und die meisten besitzen eine `<datalist>` mit Vorschlägen, die als Eingabehilfe dienen — der Sachverständige kann frei davon abweichen.

Eine wichtige technische Besonderheit dieser Sektion: **Anders als bei Bauart-Feldern werden Detailtexte ohne `T.fallback` in den Word-Context geschrieben.** Während Bauart-Pflichtfelder bei leerer Eingabe als `___` (drei Unterstriche) im Word-Dokument erscheinen, bleiben leere Bauteile-Detailtexte einfach **leer** — der Platzhalter wird durch einen leeren String ersetzt. Daraus folgt: Im Word-Dokument können z.B. die Zeilen „Wohnräume: " oder „Treppenhaus: " mit hängendem Doppelpunkt enden, oder ganze Sätze brechen mittendrin ab, wenn nichts eingegeben wurde. Drei Felder dieser Sektion haben Sonderbehandlungen (siehe Abschnitt **Sonderfälle** am Ende).

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) | Datalist-ID |
|---|---|---|---|
| `fundamente_zusatz` | `{fundamente_zusatz}` | Rohbau: Anhang an „Die Fundamente werden als baujahrestypisch eingeschätzt." | `dl_fundamente` |
| `terrasse_balkon_text` | `{terrasse_balkon}` ⚠️ | Rohbau: Eigene Absatzzeile nach Decken | _(keine — Textarea)_ |
| `treppen_text` | `{treppen_text}` | Rohbau: Wert nach Label „Treppen:" | `dl_treppen` |
| `regenrinne_text` | `{regenrinne_text}` | Rohbau: Wert nach Label „Regenrinne und Fallrohr:" | `dl_regenrinne` |
| `wandoberflaeche_wohnraeume` | `{wandoberflaeche_wohnraeume}` | Ausbau Wandoberflächen: „Wohnräume: …" | `dl_wand_wohn` |
| `wandoberflaeche_baeder` | `{wandoberflaeche_baeder}` | Ausbau Wandoberflächen: „Bäder: …" | `dl_wand_bad` |
| `wandoberflaeche_kuechen` | `{wandoberflaeche_kuechen}` | Ausbau Wandoberflächen: „Küchen: …" | `dl_wand_kueche` |
| `fenster_zusatz` | `{fenster_zusatz}` ⚠️ | Ausbau Fenster: „Wohnung: {fenster_text}, {fenster_zusatz}" | `dl_fenster_zusatz` |
| `hauseingang_element` | `{hauseingang_element}` | Ausbau Hauseingang: „Eingangselement: …" | _(keine — Textarea)_ |
| `innentueren_text` | `{innentueren_text}` | Ausbau: „Innentüren: …" | `dl_inneren` |
| `wohnungstueren_text` | `{wohnungstueren_text}` | Ausbau: „Wohnungstüren: …" | `dl_wohntueren` |
| `boden_baeder` | `{boden_baeder}` | Bodenbeläge: „in Bädern: …" | `dl_b_alle` |
| `boden_kuechen` | `{boden_kuechen}` | Bodenbeläge: „in Küchen: …" | `dl_b_alle` |
| `boden_flur` | `{boden_flur}` | Bodenbeläge: „Flur: …" | `dl_b_alle` |
| `boden_wohnraeume` | `{boden_wohnraeume}` | Bodenbeläge: „Wohnräume: …" | `dl_b_alle` |
| `boden_eingang` | `{boden_eingang}` | Bodenbeläge: „Eingang: …" | `dl_b_alle` |
| `boden_treppenhaus` | `{boden_treppenhaus}` | Bodenbeläge: „Treppenhaus: …" | `dl_b_alle` |
| `boden_keller` | `{boden_keller}` | Bodenbeläge: „Keller: …" | `dl_b_alle` |
| `decken_oberflaeche` | `{decken_oberflaeche}` | Ausbau: Absatzzeile unter „Deckenoberflächen:" | `dl_decko` |
| `heizung_zusatz` | `{heizung_zusatz}` ⚠️ | Haustechnik: Eingebettet inline in `{heizung_text}` — siehe Sonderfall | _(keine — Textarea)_ |
| `schornstein_text` | `{schornstein_text}` | Haustechnik: Wert unter Label „Schornstein:" | `dl_schorn` |
| `sanitaer_text` | `{sanitaer_text}` | Haustechnik: Wert unter Label „Sanitärinstallation:" | `dl_sanit` |
| `bad_ausstattung_text` | `{bad_ausstattung_text}` | Haustechnik: Wert unter Label „Badausstattung:" | `dl_bad` |
| `elektro_text` | `{elektro_text}` | Haustechnik: Wert unter Label „Elektroinstallation:" | `dl_elektro` |

⚠️ = Sonderfall, siehe letzter Abschnitt.

## Sub-Sektionen

Die Sektion ist im Formular in folgende H3-Untergruppen gegliedert (entspricht der Struktur im Word-Template):

### Rohbau
Felder: `fundamente_zusatz`, `terrasse_balkon_text`, `treppen_text`, `regenrinne_text`

### Ausbau — Wandoberflächen
Felder: `wandoberflaeche_wohnraeume`, `wandoberflaeche_baeder`, `wandoberflaeche_kuechen` (drei nebeneinander in einer `form-row`)

### Fenster — Zusatz
Felder: `fenster_zusatz` (einzelnes Feld, ergänzt im Word `{fenster_text}` aus der Bauart-Sektion)

### Türen
Felder: `hauseingang_element`, `innentueren_text`, `wohnungstueren_text`

### Bodenbeläge
Felder: `boden_baeder`, `boden_kuechen`, `boden_flur`, `boden_wohnraeume`, `boden_eingang`, `boden_treppenhaus`, `boden_keller` — **alle sieben Felder teilen sich dieselbe `<datalist id="dl_b_alle">`** mit gemeinsamen Boden-Vorschlägen (Fliesen, Dielenboden, Parkett, etc.). Das macht die Eingabe konsistent und schnell: Wenn der Sachverständige in einem Feld „Parkett" eintippt, taucht es als Vorschlag in allen anderen Boden-Feldern auf.

### Decken
Feld: `decken_oberflaeche`

### Haustechnik
Felder: `heizung_zusatz`, `schornstein_text`, `sanitaer_text`, `bad_ausstattung_text`, `elektro_text`

## Felder im Detail

### `fundamente_zusatz`

- **Label im Formular**: „Fundamente — Zusatz:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_fundamente"`
- **Datalist-Vorschläge** (`dl_fundamente`):
  - „Soweit ersichtlich, gibt es eine nicht tragende Bodenplatte."
  - „Soweit ersichtlich, gibt es eine Bodenplatte, schätzungsweise baujahrestypisch nicht tragend mit Streifenfundamenten."
- **Quelle**: `formular.html:1180`
- **Mapping (Context)**: `lib/docx/context.js:229` — Variable `fundamenteZusatz = T.str(fields.fundamente_zusatz)`
- **Output-Key**: `fundamente_zusatz` (`lib/docx/context.js:407`) — **kein `T.fallback`!** Bei leerer Eingabe → leerer String.
- **Template-Platzhalter**: `{fundamente_zusatz}`
- **Word-Kontext** (Zitat aus `_template_extract.md:385`):
  > „Fundamente / Bodenplatte: Fundamente sind nicht ersichtlich.Die Fundamente werden als baujahrestypisch eingeschätzt. {fundamente_zusatz}"
- **Auswirkung**: Das Feld wird als zusätzlicher Satz/Halbsatz an einen festen Standardtext angehängt.
  - **Mit Eingabe** „Soweit ersichtlich, gibt es eine nicht tragende Bodenplatte.":
    > „Fundamente / Bodenplatte: Fundamente sind nicht ersichtlich. Die Fundamente werden als baujahrestypisch eingeschätzt. Soweit ersichtlich, gibt es eine nicht tragende Bodenplatte."
  - **Ohne Eingabe**:
    > „Fundamente / Bodenplatte: Fundamente sind nicht ersichtlich. Die Fundamente werden als baujahrestypisch eingeschätzt. "
    (Endet mit überzähligem Leerzeichen, kein `___`-Platzhalter.)
- **Besonderheiten**: keine.

---

### `terrasse_balkon_text`

- **Label im Formular**: „Terrasse / Balkon (Beschreibung):"
- **HTML-Input-Typ**: `<textarea rows="4">`
- **Datalist-Vorschläge**: _(keine)_ — Placeholder zeigt „z.B. Die Wohnungen verfügen jeweils über einen Balkon …".
- **Quelle**: `formular.html:1188`
- **Mapping (Context)**: `lib/docx/context.js:230` — Variable `terrasseBalkon = T.str(fields.terrasse_balkon_text)`
- **Output-Key**: `terrasse_balkon` (`lib/docx/context.js:408`) — ⚠️ **Output-Key heißt `terrasse_balkon`, NICHT `terrasse_balkon_text`!** Das `_text`-Suffix wird beim Mapping entfernt — einziges Feld in dieser Sektion mit dieser Sonderbehandlung. **Kein `T.fallback`!**
- **Template-Platzhalter**: `{terrasse_balkon}` _(ohne `_text`-Suffix)_
- **Word-Kontext** (Zitat aus `_template_extract.md:417`):
  > „{terrasse_balkon}"
  (Steht alleinstehend als eigene Absatzzeile im Rohbau-Abschnitt, zwischen Decken und Treppen.)
- **Auswirkung**: Da der Platzhalter alleinstehend im Word steht, **ohne** umgebenden festen Text, ergibt eine leere Eingabe schlicht eine leere Absatzzeile (kein hängender Text). Beispiel-Eingabe „Die Wohnungen verfügen jeweils über einen Südbalkon mit ca. 6 m² Fläche. Die Brüstungen sind in Stahlblech ausgeführt." erscheint dann **wortgleich** als eigener Absatz im Word.
- **Besonderheiten**: Siehe **Sonderfall 2** am Ende.

---

### `treppen_text`

- **Label im Formular**: „Treppen:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_treppen"`
- **Datalist-Vorschläge** (`dl_treppen`):
  - „UG - DG: Holztreppen"
  - „UG - EG: Betontreppe; EG - DG: Aufgesattelte Stahltreppe mit Steinstufen"
  - „UG bis DG: Stahlbetontreppe mit Kunststeintrittstufen"
  - „UG bis EG: Stahlbetontreppenhaus mit Kunststeinbelag"
- **Quelle**: `formular.html:1192`
- **Mapping (Context)**: `lib/docx/context.js:231` — Variable `treppenText = T.str(fields.treppen_text)`
- **Output-Key**: `treppen_text` (`lib/docx/context.js:409`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{treppen_text}`
- **Word-Kontext** (Zitat aus `_template_extract.md:423-425`):
  > „Treppen:
  > 
  > {treppen_text}"
- **Auswirkung**:
  - **Mit Eingabe** „UG - DG: Holztreppen":
    > „Treppen:
    > UG - DG: Holztreppen"
  - **Ohne Eingabe**:
    > „Treppen:
    > "
    (Leere Zeile unter der Überschrift „Treppen:".)
- **Besonderheiten**: keine.

---

### `regenrinne_text`

- **Label im Formular**: „Regenrinne und Fallrohr:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_regenrinne"`
- **Datalist-Vorschläge** (`dl_regenrinne`):
  - „Beschichtete Metallrohre"
  - „Kupfer"
  - „Zink"
  - „Kunststoff"
- **Quelle**: `formular.html:1202`
- **Mapping (Context)**: `lib/docx/context.js:232` — Variable `regenrinneText = T.str(fields.regenrinne_text)`
- **Output-Key**: `regenrinne_text` (`lib/docx/context.js:410`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{regenrinne_text}`
- **Word-Kontext** (Zitat aus `_template_extract.md:443-445`):
  > „Regenrinne und Fallrohr:
  > 
  > {regenrinne_text}"
- **Auswirkung**:
  - **Mit Eingabe** „Kupfer": Wert erscheint unter der Überschrift.
  - **Ohne Eingabe**: Überschrift „Regenrinne und Fallrohr:" bleibt mit leerer Folgezeile stehen.
- **Besonderheiten**: keine.

---

### `wandoberflaeche_wohnraeume`

- **Label im Formular**: „Wohnräume:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_wand_wohn"`
- **Datalist-Vorschläge** (`dl_wand_wohn`):
  - „verputzt und tapeziert"
  - „tapeziert / gestrichen"
  - „gespachtelt / gestrichen"
- **Quelle**: `formular.html:1215`
- **Mapping (Context)**: `lib/docx/context.js:233` — Variable `wandoberflaecheWohnraeume = T.str(fields.wandoberflaeche_wohnraeume)`
- **Output-Key**: `wandoberflaeche_wohnraeume` (`lib/docx/context.js:413`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{wandoberflaeche_wohnraeume}`
- **Word-Kontext** (Zitat aus `_template_extract.md:457`):
  > „Wohnräume:{wandoberflaeche_wohnraeume}"
  (im Block „Wandoberflächen", direkt nach dem Label-Doppelpunkt — kein Leerzeichen zwischen Doppelpunkt und Platzhalter im Template, was aber durch das Word-Layout kaschiert wird, da meist eine Tabelle/Tab zwischen Label und Wert sitzt.)
- **Auswirkung**:
  - **Mit Eingabe** „verputzt und tapeziert": „Wohnräume: verputzt und tapeziert"
  - **Ohne Eingabe**: „Wohnräume:" (mit hängendem Doppelpunkt).
- **Besonderheiten**: keine.

---

### `wandoberflaeche_baeder`

- **Label im Formular**: „Bäder:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_wand_bad"`
- **Datalist-Vorschläge** (`dl_wand_bad`):
  - „raumhoch gefliest"
  - „gefliest, Höhe ca. 2,00m"
  - „gefliest, Höhe ca. 1,40m; teilweise raumhoch"
- **Quelle**: `formular.html:1224`
- **Mapping (Context)**: `lib/docx/context.js:234` — Variable `wandoberflaecheBaeder = T.str(fields.wandoberflaeche_baeder)`
- **Output-Key**: `wandoberflaeche_baeder` (`lib/docx/context.js:414`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{wandoberflaeche_baeder}`
- **Word-Kontext** (Zitat aus `_template_extract.md:459`):
  > „Bäder:{wandoberflaeche_baeder}"
- **Auswirkung**:
  - **Mit Eingabe** „raumhoch gefliest": „Bäder: raumhoch gefliest"
  - **Ohne Eingabe**: „Bäder:" (hängender Doppelpunkt).
- **Besonderheiten**: keine.

---

### `wandoberflaeche_kuechen`

- **Label im Formular**: „Küchen:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_wand_kueche"`
- **Datalist-Vorschläge** (`dl_wand_kueche`):
  - „Fliesenspiegel"
  - „Anstrich, Fliesenspiegel"
  - „tapeziert, gestrichen, Fliesenspiegel"
- **Quelle**: `formular.html:1233`
- **Mapping (Context)**: `lib/docx/context.js:235` — Variable `wandoberflaecheKuechen = T.str(fields.wandoberflaeche_kuechen)`
- **Output-Key**: `wandoberflaeche_kuechen` (`lib/docx/context.js:415`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{wandoberflaeche_kuechen}`
- **Word-Kontext** (Zitat aus `_template_extract.md:461`):
  > „Küchen:{wandoberflaeche_kuechen}"
- **Auswirkung**:
  - **Mit Eingabe** „Fliesenspiegel": „Küchen: Fliesenspiegel"
  - **Ohne Eingabe**: „Küchen:" (hängender Doppelpunkt).
- **Besonderheiten**: keine.

---

### `fenster_zusatz`

- **Label im Formular**: „Fenster — Zusatztext (Sprossenfenster, Rollladen, etc.):"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_fenster_zusatz"`
- **Datalist-Vorschläge** (`dl_fenster_zusatz`):
  - „Sprossenfenster, mit Rollladen"
  - „ohne Sprossen, mit Rollladen"
  - „ohne Sprossen, ohne Rollladen"
  - „mit Jalousien"
- **Quelle**: `formular.html:1245` _(erscheint nur **einmal** im Formular — in Sektion `bauteile`, nicht in `bauart`)_
- **Mapping (Context)**: `lib/docx/context.js:183` — Variable `fensterZusatz = T.str(fields.fenster_zusatz)` (in der Bauart-Code-Region, da inhaltlich mit `fenster_text` verknüpft)
- **Output-Key**: `fenster_zusatz` (`lib/docx/context.js:366`) — **kein `T.fallback`!** (Steht ohne `T.fallback(…)` direkt im Output-Objekt.)
- **Template-Platzhalter**: `{fenster_zusatz}`
- **Word-Kontext** (Zitat aus `_template_extract.md:467`):
  > „Wohnung:{fenster_text}, {fenster_zusatz}"
  (Beachte: zwischen `{fenster_text}` und `{fenster_zusatz}` steht im Template ein **Komma + Leerzeichen** als Trenner.)
- **Auswirkung**: Der Wert wird **inline** an `{fenster_text}` (aus Sektion `bauart`, z.B. „Kunststofffenster, 2-fach-Verglasung") angehängt.
  - **Mit Eingabe** „Sprossenfenster, mit Rollladen" + `fenster_text` = „Kunststofffenster, 2-fach-Verglasung":
    > „Wohnung: Kunststofffenster, 2-fach-Verglasung, Sprossenfenster, mit Rollladen"
  - **Ohne Eingabe** + identisches `fenster_text`:
    > „Wohnung: Kunststofffenster, 2-fach-Verglasung, "
    (Hängendes Komma am Ende, weil das Komma im Template hartcodiert ist.)
- **Besonderheiten**: Siehe **Sonderfall 3** am Ende.

---

### `hauseingang_element`

- **Label im Formular**: „Hauseingang — Element:"
- **HTML-Input-Typ**: `<textarea rows="2">`
- **Datalist-Vorschläge**: _(keine)_ — Placeholder zeigt „z.B. Kunststofftürelement mit Glasausschnitt und Sprossen. Feststehender Briefkasten mit Klingelanlage".
- **Quelle**: `formular.html:1257`
- **Mapping (Context)**: `lib/docx/context.js:236` — Variable `hauseingangElement = T.str(fields.hauseingang_element)`
- **Output-Key**: `hauseingang_element` (`lib/docx/context.js:416`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{hauseingang_element}`
- **Word-Kontext** (Zitat aus `_template_extract.md:477-479`):
  > „Hauseingang:
  > 
  > Eingangselement:{hauseingang_element}"
- **Auswirkung**:
  - **Mit Eingabe** „Kunststofftürelement mit Glasausschnitt und Sprossen. Feststehender Briefkasten mit Klingelanlage": „Eingangselement: Kunststofftürelement mit Glasausschnitt und Sprossen. Feststehender Briefkasten mit Klingelanlage"
  - **Ohne Eingabe**: „Eingangselement:" (hängender Doppelpunkt).
- **Besonderheiten**: Als `<textarea>` darf der Text mehrzeilig sein. Beim Einfügen in Word werden Zeilenumbrüche je nach docx-Engine ggf. als Soft-Break übernommen.

---

### `innentueren_text`

- **Label im Formular**: „Innentüren:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_inneren"`
- **Datalist-Vorschläge** (`dl_inneren`):
  - „Holztüren, Kassettentüren mit klassischen rechteckigen Füllungen"
  - „Holztüren"
  - „leichte glatte, furnierte Türen mit Holzzargen, Holztüren"
  - „Holztüren mit Glasausschnitt, teilweise Glastüren"
- **Quelle**: `formular.html:1262`
- **Mapping (Context)**: `lib/docx/context.js:237` — Variable `innentuerenText = T.str(fields.innentueren_text)`
- **Output-Key**: `innentueren_text` (`lib/docx/context.js:417`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{innentueren_text}`
- **Word-Kontext** (Zitat aus `_template_extract.md:485`):
  > „Innentüren:{innentueren_text}Wohnungstüren:{wohnungstueren_text}"
  (Im Template stehen Innentüren und Wohnungstüren direkt nebeneinander in derselben Zeile/Tabellenzelle.)
- **Auswirkung**:
  - **Mit Eingabe** „Holztüren": „Innentüren: Holztüren …"
  - **Ohne Eingabe**: „Innentüren:" (hängender Doppelpunkt direkt vor dem nächsten Label).
- **Besonderheiten**: keine.

---

### `wohnungstueren_text`

- **Label im Formular**: „Wohnungstüren:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_wohntueren"`
- **Datalist-Vorschläge** (`dl_wohntueren`):
  - „Holztüren"
  - „Holztüren, 2-flüglige Kassettentüren mit Ornamentverglasung und Oberlicht"
  - „Holztüren mit Glasausschnitt"
- **Quelle**: `formular.html:1272`
- **Mapping (Context)**: `lib/docx/context.js:238` — Variable `wohnungstuerenText = T.str(fields.wohnungstueren_text)`
- **Output-Key**: `wohnungstueren_text` (`lib/docx/context.js:418`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{wohnungstueren_text}`
- **Word-Kontext** (Zitat aus `_template_extract.md:485`):
  > „Innentüren:{innentueren_text}Wohnungstüren:{wohnungstueren_text}"
- **Auswirkung**:
  - **Mit Eingabe** „Holztüren": „… Wohnungstüren: Holztüren"
  - **Ohne Eingabe**: „… Wohnungstüren:" (hängender Doppelpunkt am Zeilenende).
- **Besonderheiten**: keine.

---

### `boden_baeder`

- **Label im Formular**: „Bäder:" (im Block „Bodenbeläge")
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_b_alle"`
- **Datalist-Vorschläge** (`dl_b_alle` — gemeinsame Liste aller Boden-Felder, siehe unten unter `boden_keller` für Vollständigkeit)
- **Quelle**: `formular.html:1285`
- **Mapping (Context)**: `lib/docx/context.js:239` — Variable `bodenBaeder = T.str(fields.boden_baeder)`
- **Output-Key**: `boden_baeder` (`lib/docx/context.js:419`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{boden_baeder}`
- **Word-Kontext** (Zitat aus `_template_extract.md:491`):
  > „in Bädern:{boden_baeder}"
- **Auswirkung**:
  - **Mit Eingabe** „Fliesen": „in Bädern: Fliesen"
  - **Ohne Eingabe**: „in Bädern:" (hängender Doppelpunkt).
- **Besonderheiten**: Teilt sich die Datalist mit allen anderen Boden-Feldern.

---

### `boden_kuechen`

- **Label im Formular**: „Küchen:" (im Block „Bodenbeläge")
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_b_alle"`
- **Quelle**: `formular.html:1289`
- **Mapping (Context)**: `lib/docx/context.js:240` — Variable `bodenKuechen = T.str(fields.boden_kuechen)`
- **Output-Key**: `boden_kuechen` (`lib/docx/context.js:420`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{boden_kuechen}`
- **Word-Kontext** (Zitat aus `_template_extract.md:493`):
  > „in Küchen:{boden_kuechen}Flur:{boden_flur}"
  (Im Template stehen Küchen und Flur direkt nebeneinander in derselben Zeile.)
- **Auswirkung**:
  - **Mit Eingabe** „Fliesen": „in Küchen: Fliesen Flur: …"
  - **Ohne Eingabe**: „in Küchen:Flur: …" (kein Wert zwischen den beiden Labels).
- **Besonderheiten**: Teilt sich die Datalist mit allen anderen Boden-Feldern.

---

### `boden_flur`

- **Label im Formular**: „Flur:" (im Block „Bodenbeläge")
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_b_alle"`
- **Quelle**: `formular.html:1293`
- **Mapping (Context)**: `lib/docx/context.js:241` — Variable `bodenFlur = T.str(fields.boden_flur)`
- **Output-Key**: `boden_flur` (`lib/docx/context.js:421`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{boden_flur}`
- **Word-Kontext** (Zitat aus `_template_extract.md:493`):
  > „in Küchen:{boden_kuechen}Flur:{boden_flur}"
- **Auswirkung**:
  - **Mit Eingabe** „Dielenboden": „… Flur: Dielenboden"
  - **Ohne Eingabe**: „… Flur:" (hängender Doppelpunkt am Zeilenende).
- **Besonderheiten**: Teilt sich die Datalist mit allen anderen Boden-Feldern.

---

### `boden_wohnraeume`

- **Label im Formular**: „Wohnräume:" (im Block „Bodenbeläge")
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_b_alle"`
- **Quelle**: `formular.html:1299`
- **Mapping (Context)**: `lib/docx/context.js:242` — Variable `bodenWohnraeume = T.str(fields.boden_wohnraeume)`
- **Output-Key**: `boden_wohnraeume` (`lib/docx/context.js:422`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{boden_wohnraeume}`
- **Word-Kontext** (Zitat aus `_template_extract.md:495`):
  > „Wohnräume:{boden_wohnraeume}"
- **Auswirkung**:
  - **Mit Eingabe** „Dielenboden / Parkett": „Wohnräume: Dielenboden / Parkett"
  - **Ohne Eingabe**: „Wohnräume:" (hängender Doppelpunkt).
- **Besonderheiten**: Teilt sich die Datalist mit allen anderen Boden-Feldern.

---

### `boden_eingang`

- **Label im Formular**: „Eingang:" (im Block „Bodenbeläge")
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_b_alle"`
- **Quelle**: `formular.html:1303`
- **Mapping (Context)**: `lib/docx/context.js:243` — Variable `bodenEingang = T.str(fields.boden_eingang)`
- **Output-Key**: `boden_eingang` (`lib/docx/context.js:423`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{boden_eingang}`
- **Word-Kontext** (Zitat aus `_template_extract.md:497`):
  > „Eingang:{boden_eingang}"
- **Auswirkung**:
  - **Mit Eingabe** „Naturstein": „Eingang: Naturstein"
  - **Ohne Eingabe**: „Eingang:" (hängender Doppelpunkt).
- **Besonderheiten**: Teilt sich die Datalist mit allen anderen Boden-Feldern.

---

### `boden_treppenhaus`

- **Label im Formular**: „Treppenhaus:" (im Block „Bodenbeläge")
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_b_alle"`
- **Quelle**: `formular.html:1307`
- **Mapping (Context)**: `lib/docx/context.js:244` — Variable `bodenTreppenhaus = T.str(fields.boden_treppenhaus)`
- **Output-Key**: `boden_treppenhaus` (`lib/docx/context.js:424`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{boden_treppenhaus}`
- **Word-Kontext** (Zitat aus `_template_extract.md:499`):
  > „Treppenhaus:{boden_treppenhaus}"
- **Auswirkung**:
  - **Mit Eingabe** „Fliesen / Terrazzo": „Treppenhaus: Fliesen / Terrazzo"
  - **Ohne Eingabe**: „Treppenhaus:" (hängender Doppelpunkt).
- **Besonderheiten**: Teilt sich die Datalist mit allen anderen Boden-Feldern.

---

### `boden_keller`

- **Label im Formular**: „Keller:" (im Block „Bodenbeläge")
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_b_alle"`
- **Datalist-Vorschläge** (`dl_b_alle`, **gemeinsam für alle sieben Boden-Felder**, `formular.html:1314-1329`):
  - „Fliesen"
  - „Dielenboden"
  - „Parkett"
  - „Laminat"
  - „Teppichboden"
  - „Teppichboden / Laminat"
  - „Parkett / Laminat"
  - „PVC"
  - „Naturstein"
  - „Kunststein"
  - „Terrazzo"
  - „betoniert"
  - „betoniert / Anstrich bzw. Fliesen"
  - „Beton, Anstrich"
- **Quelle**: `formular.html:1311`
- **Mapping (Context)**: `lib/docx/context.js:245` — Variable `bodenKeller = T.str(fields.boden_keller)`
- **Output-Key**: `boden_keller` (`lib/docx/context.js:425`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{boden_keller}`
- **Word-Kontext** (Zitat aus `_template_extract.md:501`):
  > „Keller:{boden_keller}"
- **Auswirkung**:
  - **Mit Eingabe** „betoniert": „Keller: betoniert"
  - **Ohne Eingabe**: „Keller:" (hängender Doppelpunkt).
- **Besonderheiten**: Teilt sich die Datalist mit allen anderen Boden-Feldern. **Hinweis**: Eine HTML-`<datalist>` ist nur eine **Vorschlags-Liste** — der Sachverständige kann jederzeit frei davon abweichend tippen.

---

### `decken_oberflaeche`

- **Label im Formular**: „Deckenoberfläche:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_decko"`
- **Datalist-Vorschläge** (`dl_decko`):
  - „verputzt mit Raufaser / Tapete"
  - „verputzt mit Raufaser / Tapete, Holzschalung"
  - „Gipskarton verputzt / gestrichen"
  - „tapeziert / gestrichen"
- **Quelle**: `formular.html:1334`
- **Mapping (Context)**: `lib/docx/context.js:246` — Variable `deckenOberflaeche = T.str(fields.decken_oberflaeche)`
- **Output-Key**: `decken_oberflaeche` (`lib/docx/context.js:426`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{decken_oberflaeche}`
- **Word-Kontext** (Zitat aus `_template_extract.md:505-507`):
  > „Deckenoberflächen:
  > 
  > {decken_oberflaeche}"
- **Auswirkung**:
  - **Mit Eingabe** „verputzt mit Raufaser / Tapete": Wert erscheint als eigene Absatzzeile unter der Überschrift.
  - **Ohne Eingabe**: Leerzeile unter „Deckenoberflächen:".
- **Besonderheiten**: keine.

---

### `heizung_zusatz`

- **Label im Formular**: „Heizung — Zusatztext:"
- **HTML-Input-Typ**: `<textarea rows="2">`
- **Datalist-Vorschläge**: _(keine)_ — Placeholder zeigt „z.B. In den Räumen sind Heizkörper vorhanden. Das Warmwasser wird in der zentralen Gastherme erzeugt.".
- **Quelle**: `formular.html:1346`
- **Mapping (Context)**: `lib/docx/context.js:129` — Variable `heizungZusatz = T.str(fields.heizung_zusatz)` (steht im Heizungs-Code-Block, NICHT im Bauteile-Block — siehe Sonderfall).
- **Output-Key**: `heizung_zusatz` (`lib/docx/context.js:383`) → ⚠️ **wird explizit auf leeren String gesetzt!** Der Eingabewert fließt stattdessen INLINE in `heizung_text` ein (`context.js:131`).
- **Template-Platzhalter**: `{heizung_zusatz}` (faktisch immer leer im Word)
- **Word-Kontext** (Zitat aus `_template_extract.md:515`):
  > „Das Gebäude wird über {heizung_artikel} {heizung_text} (Baujahr {heizung_baujahr}) beheizt. {heizung_zusatz}"
- **Auswirkung**: Der Eingabewert wird tatsächlich **innerhalb** von `{heizung_text}` ausgegeben (vor dem Punkt), nicht hinter dem Satzpunkt.
  - **Mit Eingabe** „In den Räumen sind Heizkörper vorhanden." und `heizung_text` = „Gas-Zentralheizung":
    > „Das Gebäude wird über eine Gas-Zentralheizung In den Räumen sind Heizkörper vorhanden. (Baujahr 1998) beheizt. "
  - **Ohne Eingabe**:
    > „Das Gebäude wird über eine Gas-Zentralheizung (Baujahr 1998) beheizt. "
- **Besonderheiten**: Siehe **Sonderfall 1** am Ende.

---

### `schornstein_text`

- **Label im Formular**: „Schornstein:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_schorn"`
- **Datalist-Vorschläge** (`dl_schorn`):
  - „gemauert über Dach"
  - „Abgasrohr (Therme) isoliert über Dach"
  - „nicht vorhanden"
- **Quelle**: `formular.html:1351`
- **Mapping (Context)**: `lib/docx/context.js:247` — Variable `schornsteinText = T.str(fields.schornstein_text)`
- **Output-Key**: `schornstein_text` (`lib/docx/context.js:429`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{schornstein_text}`
- **Word-Kontext** (Zitat aus `_template_extract.md:521-523`):
  > „Schornstein:
  > 
  > {schornstein_text}"
- **Auswirkung**:
  - **Mit Eingabe** „gemauert über Dach": Wert erscheint als eigene Zeile unter der Überschrift.
  - **Ohne Eingabe**: Leerzeile unter „Schornstein:".
- **Besonderheiten**: keine.

---

### `sanitaer_text`

- **Label im Formular**: „Sanitärinstallation:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_sanit"`
- **Datalist-Vorschläge** (`dl_sanit`):
  - „Wasser- und Abwasser unter Putz nach Baujahr."
  - „Wasser- und Abwasser unter Putz nach Baujahr. Teilweise undicht / nicht funktionsfähig."
  - „Wasser- und Abwasserleitungen unter Putz, die Ausführung entspricht dem Standard der Sanierung 1991."
  - „Wasser- und Abwasser unter Putz nach Baujahr, teilweise auf Putz"
- **Quelle**: `formular.html:1360`
- **Mapping (Context)**: `lib/docx/context.js:248` — Variable `sanitaerText = T.str(fields.sanitaer_text)`
- **Output-Key**: `sanitaer_text` (`lib/docx/context.js:430`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{sanitaer_text}`
- **Word-Kontext** (Zitat aus `_template_extract.md:527-529`):
  > „Sanitärinstallation:
  > 
  > {sanitaer_text}"
- **Auswirkung**:
  - **Mit Eingabe** „Wasser- und Abwasser unter Putz nach Baujahr.": Wert erscheint als eigene Zeile.
  - **Ohne Eingabe**: Leerzeile unter „Sanitärinstallation:".
- **Besonderheiten**: keine.

---

### `bad_ausstattung_text`

- **Label im Formular**: „Badausstattung:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_bad"`
- **Datalist-Vorschläge** (`dl_bad`):
  - „Dusche, Wanne, Waschbecken, Stand-WC mit Spülkasten aufputz, baujahresstand"
  - „Dusche, Wanne, Waschbecken, Hänge-WC mit Unterputz-Spülkasten, baujahresstand"
  - „Badewanne, Waschbecken und Stand-WC mit Aufputz-Spülkasten"
  - „Wanne, Waschbecken, bodenstehendes WC, baujahresstand"
- **Quelle**: `formular.html:1372`
- **Mapping (Context)**: `lib/docx/context.js:249` — Variable `badAusstattungText = T.str(fields.bad_ausstattung_text)`
- **Output-Key**: `bad_ausstattung_text` (`lib/docx/context.js:431`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{bad_ausstattung_text}`
- **Word-Kontext** (Zitat aus `_template_extract.md:533-535`):
  > „Badausstattung:
  > 
  > {bad_ausstattung_text}"
- **Auswirkung**:
  - **Mit Eingabe** „Dusche, Wanne, Waschbecken, WC": Wert erscheint als eigene Zeile.
  - **Ohne Eingabe**: Leerzeile unter „Badausstattung:".
- **Besonderheiten**: keine.

---

### `elektro_text`

- **Label im Formular**: „Elektroinstallation:"
- **HTML-Input-Typ**: `<input type="text">` mit `list="dl_elektro"`
- **Datalist-Vorschläge** (`dl_elektro`):
  - „Versorgung über Erdkabel, Elektroverteilung nach Baujahresstand"
  - „Versorgung über Erdkabel, Elektroverteilung nach Baujahresstand teilweise erneuert"
  - „Stromversorgung über Erdkabel. Elektroverteilung und Leitungsführung entsprechen dem Standard der Sanierung 1991."
- **Quelle**: `formular.html:1382`
- **Mapping (Context)**: `lib/docx/context.js:250` — Variable `elektroText = T.str(fields.elektro_text)`
- **Output-Key**: `elektro_text` (`lib/docx/context.js:432`) — **kein `T.fallback`!**
- **Template-Platzhalter**: `{elektro_text}`
- **Word-Kontext** (Zitat aus `_template_extract.md:539-541`):
  > „Elektroinstallation:
  > 
  > {elektro_text}"
- **Auswirkung**:
  - **Mit Eingabe** „Versorgung über Erdkabel, Elektroverteilung nach Baujahresstand": Wert erscheint als eigene Zeile.
  - **Ohne Eingabe**: Leerzeile unter „Elektroinstallation:".
- **Besonderheiten**: keine.

---

## ⚠️ Sonderfälle

### Sonderfall 1: `heizung_zusatz` wird inline in `heizung_text` eingebaut

**Was passiert technisch?**

Obwohl das Feld `heizung_zusatz` im Formular **in dieser Sektion `bauteile`** (`formular.html:1346`) liegt, wird es im Code-Mapping in der **Heizungs-Code-Region** verarbeitet (`lib/docx/context.js:125-131`), zusammen mit `heizung_art` und `heizung` (= Heizungstyp).

Statt einer simplen Ablage als eigenes Context-Feld passiert Folgendes:

```javascript
// context.js:128-131
const heizungBasisText = T.compactJoin([heizungArtText, heizungTypText], '-');
const heizungZusatz = T.str(fields.heizung_zusatz);
// Zusatz inline in heizung_text einbauen, damit er nicht hinter dem Satzpunkt landet.
const heizungText = T.compactJoin([heizungBasisText, heizungZusatz], ' ');
```

Der Eingabewert wird also mit einem Leerzeichen an `heizungBasisText` angehängt und im Output unter `heizung_text` ausgegeben.

**Was passiert mit `{heizung_zusatz}` im Template?**

```javascript
// context.js:380-383
heizung_text: T.fallback(heizungText),
// ...
heizung_zusatz: '',
```

Der Output-Key `heizung_zusatz` wird **explizit auf den leeren String gesetzt** — egal was im Formular steht. Der Platzhalter `{heizung_zusatz}` im Template (`_template_extract.md:515`) wird im fertigen Word-Dokument also **immer durch nichts ersetzt**.

**Warum?**

Der Kommentar im Code (Zeile 130) erklärt:

> „Zusatz inline in heizung_text einbauen, damit er nicht hinter dem Satzpunkt landet."

Im Template-Satz steht der Punkt **vor** `{heizung_zusatz}`:

> „Das Gebäude wird über {heizung_artikel} {heizung_text} (Baujahr {heizung_baujahr}) beheizt. {heizung_zusatz}"

Würde der Zusatz dort eingesetzt, stünde er nach „beheizt." als isolierter Satz/Halbsatz hinter dem Punkt — was bei Mehrsatz-Eingaben (z.B. „In den Räumen sind Heizkörper vorhanden.") zwar funktioniert, bei kurzen Zusätzen (z.B. „mit Heizkörpern") aber grammatisch holpert. Stattdessen wird der Zusatz innerhalb des Heizungs-Strings (also vor „(Baujahr …)") platziert.

**Konsequenz für den Word-Output**:

Mit `heizung_art = gas`, `heizung = zentral`, `heizung_baujahr = 1998` und `heizung_zusatz = "In den Räumen sind Heizkörper vorhanden."`:

> „Das Gebäude wird über eine Gas-Zentralheizung In den Räumen sind Heizkörper vorhanden. (Baujahr 1998) beheizt. "

(Der Zusatz wird zwischen `heizung_text` und der Baujahr-Klammer einsortiert, der hartcodierte `{heizung_zusatz}`-Platzhalter im Template bleibt leer.)

---

### Sonderfall 2: `terrasse_balkon_text` → `{terrasse_balkon}` (Suffix wird entfernt)

**Was passiert technisch?**

`terrasse_balkon_text` ist das **einzige Feld in dieser Sektion**, bei dem der Output-Key im Context **anders heißt** als das Form-Feld. Das `_text`-Suffix wird beim Mapping entfernt:

```javascript
// context.js:230 (Variable)
const terrasseBalkon = T.str(fields.terrasse_balkon_text);

// context.js:408 (Output-Key)
terrasse_balkon: terrasseBalkon,
```

Der Template-Platzhalter heißt entsprechend `{terrasse_balkon}` (`_template_extract.md:417`), NICHT `{terrasse_balkon_text}`.

**Warum?**

Vermutlich historisch — der Platzhalter im Template existierte ohne `_text`-Suffix, das Formular-Feld bekam später konsistent mit den anderen Detailtexten (alle haben das `_text`-Suffix) seinen Namen. Beim Mapping wird das Suffix gestrippt, um Template-Kompatibilität zu erhalten.

**Konsequenz**:

- Beim Hinzufügen neuer Felder muss man dieses Mapping bewusst beachten.
- Wer im Template versehentlich `{terrasse_balkon_text}` schreibt, wird **keinen** Wert sehen — es existiert nur `{terrasse_balkon}`.
- Bei allen anderen Detailtext-Feldern in dieser Sektion sind Form-Name und Output-Key identisch.

---

### Sonderfall 3: `fenster_zusatz` ergänzt `{fenster_text}` aus Sektion `bauart`

**Wo erscheint das Feld im Formular?**

Das Feld `fenster_zusatz` erscheint im Formular **nur einmal** — und zwar in dieser Sektion `bauteile` (`formular.html:1245`, Untergruppe „Fenster — Zusatz"). In der Sektion `bauart` (ab `formular.html:673`) existiert es **nicht**. Eine gezielte Suche bestätigt: `grep "fenster_zusatz" formular.html` liefert nur die eine Vorkommnis-Stelle in Zeile 1245.

Inhaltlich gehört es aber zur Fenster-Beschreibung, die in der Bauart-Sektion via `bauart_fenster` (Fenster-Typ) und `bauart_fenster_verglasung` (2-fach ja/nein) erfasst wird. Der Sachverständige listet hier optional Zusatz-Eigenschaften wie Sprossen, Rollläden oder Jalousien.

**Wie wird es im Code verarbeitet?**

Das Feld wird im Code **direkt im Bauart-Code-Block** (nicht im Bauteile-Block) gelesen:

```javascript
// context.js:183
const fensterZusatz = T.str(fields.fenster_zusatz);
```

… und im Output-Objekt im Bauart-Bereich ausgegeben, anders als die übrigen Bauteile-Detailtexte:

```javascript
// context.js:365-366
fenster_text: T.fallback(fensterText),
fenster_zusatz: fensterZusatz,
```

Wichtig: Auch hier **kein `T.fallback`** — leeres Feld → leerer String.

**Wie wirkt es im Word?**

Der Template-Satz kombiniert `{fenster_text}` (aus Sektion `bauart`) und `{fenster_zusatz}` mit einem hartcodierten Komma:

```
Wohnung:{fenster_text}, {fenster_zusatz}
```

Beispiele:

- `fenster_text` = „Kunststofffenster, 2-fach-Verglasung", `fenster_zusatz` = „Sprossenfenster, mit Rollladen":
  > „Wohnung: Kunststofffenster, 2-fach-Verglasung, Sprossenfenster, mit Rollladen"
- `fenster_text` = „Kunststofffenster, 2-fach-Verglasung", `fenster_zusatz` = `""`:
  > „Wohnung: Kunststofffenster, 2-fach-Verglasung, "
  (Hängendes Komma am Ende — kosmetischer Nebeneffekt, weil das Komma im Template fest verdrahtet ist.)

**Konsequenz**:

- Auch wenn ein Sachverständiger das Feld leer lässt, bleibt das Komma im Word stehen.
- Es ist also empfehlenswert, immer mindestens „ohne Sprossen, ohne Rollladen" oder ähnliches anzugeben, um saubere Ausgabe zu erhalten.
