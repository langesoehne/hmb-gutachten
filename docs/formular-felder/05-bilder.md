# Bilder

Diese Sektion (`data-section-key="bilder"`) sammelt die **bildlichen Belege** für das Gutachten — sowohl die Pflicht-Standardbilder (Hausansicht/Frontansicht, Grundriss) als auch die admin-only Liegenschaftskarte und beliebig viele zusätzliche Bilder der Ortsbegehung (Anlage 1). Die zugehörigen **Bildunterschrift-Felder** (`bild1_caption`, `bild4_caption`) sind Text-Inputs mit Datalist-Vorschlägen; die Bilder selbst werden **nicht** über den normalen Form-Submit transportiert, sondern über separate Upload-Endpunkte und in der Datenbank als BLOBs in der `files`-Tabelle (`kind`-Spalte mit Werten `hausansicht`, `grundriss`, `liegenschaftskarte`, `anlage`) gespeichert.

Beim DOCX-Export werden die Bilder dann zur Laufzeit ins Template eingewoben: für Hausansicht/Grundriss/Liegenschaftskarte werden die im Template vorhandenen Platzhalter-Bilder (`word/media/image1..5`) durch die hochgeladenen Buffer ersetzt (Bild-Swap), wobei das Seitenverhältnis erhalten bleibt. Die Anlage-1-Bilder hingegen werden **nach** dem Rendering als zusätzlicher Word-Body-Inhalt angefügt — mit Seitenumbruch je Bild und kursiver, zentrierter Bildunterschrift.

Eine wichtige Besonderheit: die **Hausansicht erscheint im Template zweimal** — als „Bild 1" in Sektion 2 (Auftrag) und als „Bild 3" in Sektion 5 (Feststellungen). Daher wird auch die Bildunterschrift `bild1_caption` an zwei Stellen ausgegeben (über die Output-Keys `bild1_caption` **und** `bild3_caption` — beide referenzieren intern denselben Wert). Es gibt im Formular **kein** eigenes Eingabefeld `bild3_caption`.

## Übersicht

| Formular-Feld / Upload-Slot | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `hausansicht` (Datei-Upload) | (Bild-Swap: `image1.jpeg`, `image2.jpeg`, `image4.jpeg`) | Titelseite, Bild 1 in Sektion 2, Bild 3 in Sektion 5 |
| `bild1_caption` | `{bild1_caption}`, `{bild3_caption}` | „Bild 1: …" (Sektion 2) und „Bild 3: …" (Sektion 5) |
| `grundriss` (Datei-Upload) | (Bild-Swap: `image5.png`) | Bild 4 in Sektion 5 (Feststellungen / Energetischer Gebäudezustand) |
| `bild4_caption` | `{bild4_caption}` | „Bild 4: …" (Sektion 5, direkt unter dem Grundriss) |
| `liegenschaftskarte` (Datei-Upload, admin-only) | (Bild-Swap: `image3.jpeg`) | Bild 2 in Sektion 4 („Auszug aus der Liegenschaftskarte") |
| Anlage-1-Bilder (Multi-Upload, admin-only) | (XML-Injection nach Rendering) | „Anlage 1: Bilder der Ortsbegehung" — eigenständige Sektion am Ende |

## Bilder-Pipeline (Architektur-Überblick)

Bilder gehen **nicht** über die normale Formular-Submit-Logik, sondern haben drei dedizierte Upload-Wege:

### 1. Hausansicht / Grundriss (Public + Admin)

Im normalen Form-Submit-Body trägt der Klient (oder Admin) die beiden Bilder als `multipart/form-data` mit den Feldnamen `hausansicht` und `grundriss` mit (Klient: `POST /api/submit/:token`, Admin: `POST /api/admin/save/:formularName`). Der Multer-Handler in [`lib/uploads.js:32-50`](../../lib/uploads.js) puffert sie im Memory, die Routen (`routes/admin.js:253-255`, `routes/public.js:92-94`) reichen die Buffer an `persistSubmission` weiter, das sie als BLOBs in `files` (Spalten `submission_id`, `kind = 'hausansicht' | 'grundriss'`) ablegt.

Erlaubte MIME-Types: `image/jpeg`, `image/png`, `image/gif`, `image/webp` ([`lib/uploads.js:4`](../../lib/uploads.js)). Maximalgröße: `MAX_FILE_SIZE` (10 MB Default; [`lib/uploads.js:25`](../../lib/uploads.js)). Pro Submission gibt es **genau eine** Hausansicht und **genau einen** Grundriss; ein erneuter Upload überschreibt den vorhandenen Eintrag.

### 2. Liegenschaftskarte (nur Admin)

Wird **nur** im Admin-Submit angenommen ([`routes/admin.js:255`](../../routes/admin.js)). Der Public-Submit-Endpunkt verwirft das Feld bewusst (siehe Kommentar in `routes/public.js:87`: „Liegenschaftskarte ist admin-only — nicht aus Public-Submit übernehmen"). Speicherung wie oben in der `files`-Tabelle mit `kind = 'liegenschaftskarte'`.

### 3. Anlage-1-Bilder (Multi-File, Public + Admin)

Anlage-1-Bilder gehen über **separate Endpunkte** ([`routes/admin.js:464-492`](../../routes/admin.js), [`routes/public.js:181-214`](../../routes/public.js)):

- `POST /api/admin/anlage/:formularName` (Admin) bzw. `POST /api/submit/:token/anlage` (Klient)
- Multer-Handler `uploadAnlage` ([`lib/uploads.js:53-63`](../../lib/uploads.js)) erwartet **ein** File-Feld namens `file`.
- Speicherung als neuer Zeile in `files` mit `kind = 'anlage'` und eindeutiger UUID.
- Reihenfolge und Bildunterschriften werden im Form-Datenfeld `anlage_bilder` (Array von `{id, caption}`) verwaltet — siehe [`routes/admin.js:380`](../../routes/admin.js) und [`routes/public.js:78-83`](../../routes/public.js).
- Löschen via `DELETE /api/admin/anlage/:formularName/:id` bzw. `DELETE /api/submit/:token/anlage/:id`.
- Preview via `GET /api/admin/anlage/:formularName/:id/preview` bzw. `GET /api/submit/:token/anlage/:id/preview`.

### 4. DOCX-Export: Einweben der Bilder

Beim Export ([`routes/admin.js:419-435`](../../routes/admin.js)) werden die Bild-Buffer aus der DB geladen und an `renderGutachtenDocx` durchgereicht. Dort passieren zwei verschiedene Operationen:

#### A) Bild-Swap (Hausansicht, Grundriss, Liegenschaftskarte)

`renderGutachtenDocx` ([`lib/docx/render.js:94-180`](../../lib/docx/render.js)) ersetzt die im Template eingebetteten Bilder (`word/media/imageN.jpeg/png`) durch die neuen Buffer und passt die `<w:drawing>`-Extents an, damit das neue Bild seitenverhältniserhaltend in die Original-Box passt (`fitToBox` in [`lib/docx/image-utils.js:92-100`](../../lib/docx/image-utils.js)):

```js
const HAUSANSICHT_TARGETS = [
  'word/media/image1.jpeg', // Titelseite
  'word/media/image2.jpeg', // Bild 1: Ansicht
  'word/media/image4.jpeg'  // Bild 3: Ansicht
];
const GRUNDRISS_TARGETS = [
  'word/media/image5.png'   // Bild 4: Grundriss
];
const LIEGENSCHAFTSKARTE_TARGETS = [
  'word/media/image3.jpeg'  // Bild 2: Auszug aus der Liegenschaftskarte
];
```

Die Hausansicht überschreibt also **drei** verschiedene Bild-Slots im Template-Zip — dadurch erscheint sie automatisch an drei Stellen: Titelseite, Bild 1 (Sektion 2) und Bild 3 (Sektion 5). Wird **keine** Hausansicht hochgeladen, bleibt das Template-Originalbild stehen. Magic-Byte-Erkennung in [`lib/docx/image-utils.js:11-21`](../../lib/docx/image-utils.js) macht es egal, ob der Klient JPEG, PNG, GIF oder WebP hochlädt; die Datei wird einfach unter dem alten Pfad abgelegt, denn Word identifiziert das Format selbst.

#### B) Anlage-1-Anhang (XML-Injection)

`appendAnlageBilder` ([`lib/docx/anlage.js:97-170`](../../lib/docx/anlage.js)) hängt nach dem Templater-Rendering eine eigene Sektion an `word/document.xml` an:

- Seitenumbruch + Heading „Anlage 1: Bilder der Ortsbegehung"
- Optionales Datum (`anlageDateText` aus `formData.ortsbesichtigungsdatum`, im Deutschen Langformat; [`routes/admin.js:426-427`](../../routes/admin.js))
- Für jedes Bild: Seitenumbruch (außer beim ersten), zentriertes Bild (max. 16,7 × 22,2 cm; [`lib/docx/anlage.js:7-8`](../../lib/docx/anlage.js)), darunter kursive Bildunterschrift.
- Reihenfolge und Captions werden aus `formData.anlage_bilder` gelesen (vom Frontend gepflegt), nicht aus separaten Caption-Form-Feldern.

## Felder im Detail

### `hausansicht`

- **Label im Formular**: „Hausansicht (Frontansicht) Pflicht — Bild der Frontansicht Pflichtfeld"
- **HTML-Input-Typ**: `type="file"`, `accept="image/*"`
- **Pflichtfeld**: ja (`required-badge` im HTML)
- **Quelle**: `formular.html:565-600` (Hauptfeld bei Zeile 579)
- **Upload-Endpoints**:
  - Klient: `POST /api/submit/:token` (Feldname `hausansicht`) — [`routes/public.js:92`](../../routes/public.js)
  - Admin: `POST /api/admin/save/:formularName` (Feldname `hausansicht`) — [`routes/admin.js:253`](../../routes/admin.js)
  - Preview: `GET /api/submit/:token/image/hausansicht` (Klient, [`routes/public.js:144-159`](../../routes/public.js)) oder `GET /api/admin/image/:formularName/hausansicht` (Admin, [`routes/admin.js:309-320`](../../routes/admin.js))
- **DB-Speicherung**: `files`-Tabelle, `kind = 'hausansicht'`. Pro Submission genau eine Zeile (Überschreiben statt Anhängen).
- **Mapping (Context)**: keine direkte Context-Variable. Die DOCX-Render-Funktion bekommt den Buffer **separat**:
  ```js
  // routes/admin.js:419
  const hausansichtBuffer = loadImageBufferForDocx(formularName, 'hausansicht');
  ```
- **Template-Platzhalter**: keiner (Bild-Swap statt Text-Placeholder). Die Image-Targets sind:
  - `word/media/image1.jpeg` (Titelseite)
  - `word/media/image2.jpeg` (Bild 1, Sektion 2)
  - `word/media/image4.jpeg` (Bild 3, Sektion 5)
- **Word-Kontext** (drei Vorkommen, jeweils als Bild über bzw. unter den Captions):
  - Titelseite (kein Caption-Text im Template):
    > (Bildplatz auf der Titelseite, oberhalb der Stichtags-Zeile)
  - Sektion 2 „Auftrag" — direkt vor der Caption-Zeile:
    > Bild 1: {bild1_caption}

    (`_template_extract.md:153`)
  - Sektion 5 „Feststellungen vor Ort und aus den Planunterlagen" — direkt vor der Caption-Zeile:
    > Bild 3: {bild3_caption}

    (`_template_extract.md:253`)
- **Auswirkung**: Die hochgeladene Hausansicht ersetzt das Platzhalter-Bild im Template an **allen drei** Stellen gleichzeitig. Beim Rendering wird die Größe der Template-Boxen ausgemessen (`buildDrawingBoxMap` in [`lib/docx/render.js:62-75`](../../lib/docx/render.js)) und das neue Bild wird seitenverhältniserhaltend (letterbox-fit) eingepasst — keine Verzerrung, aber ggf. kleinere Anzeige als die Original-Box.
- **Besonderheiten**:
  - Wird im Public-Submit explizit unterstützt (Klient kann/soll die Hausansicht hochladen).
  - Wenn nicht hochgeladen: das Template-Originalbild bleibt im Word stehen (Fallback ist **nicht** ein Platzhalter-Text, sondern das Mock-Bild).
  - Magic-Byte-Erkennung in [`lib/docx/image-utils.js:11-21`](../../lib/docx/image-utils.js) — auch wenn der Buffer eigentlich ein PNG ist, wird er unter dem JPEG-Pfad abgelegt; Word identifiziert das Format anhand der Datei-Signatur korrekt.

### `bild1_caption`

- **Label im Formular**: „Bildunterschrift:" (innerhalb der Hausansicht-Sektion)
- **HTML-Input-Typ**: `type="text"` mit `list="dl_bild1"`
- **Datalist-Vorschläge** (`dl_bild1`, Freitext erlaubt):
  - `Ansicht von Süd-West`
  - `Ansicht von Süd-Ost`
  - `Ansicht von Nord-West`
  - `Ansicht von Nord-Ost`
  - `Ansicht von Süden`
  - `Ansicht von Norden`
  - `Straßenansicht`
- **Placeholder**: „z.B. Ansicht von Süd-West"
- **Quelle**: `formular.html:588-597`
- **Mapping (Context)**: `lib/docx/context.js:121-122`:
  ```js
  const bild1Caption = T.str(fields.bild1_caption);
  const bild3Caption = bild1Caption;
  ```
- **Transformer**: nur `T.str` ([`lib/transformers.js:11`](../../lib/transformers.js)) — trimt, sonst keine Modifikation.
- **Output-Keys** (zwei!): `bild1_caption` und `bild3_caption` ([`lib/docx/context.js:334-335`](../../lib/docx/context.js)). Beide referenzieren denselben Eingabewert.
- **Template-Platzhalter**: `{bild1_caption}` und `{bild3_caption}` (zwei verschiedene Placeholder, die aber denselben Wert tragen).
- **Word-Kontext** (zwei Vorkommen):
  1. Sektion 2 „Auftrag" — direkt unter der Hausansicht (Bild 1):
     > Bild 1: {bild1_caption}

     (`_template_extract.md:153`)
  2. Sektion 5 „Feststellungen vor Ort und aus den Planunterlagen" — direkt unter der nochmals gezeigten Hausansicht (Bild 3):
     > Bild 3: {bild3_caption}

     (`_template_extract.md:253`)
- **Auswirkung**: Mit Wert „Ansicht von Süd-West" → an beiden Stellen erscheint im Word „Bild 1: Ansicht von Süd-West" bzw. „Bild 3: Ansicht von Süd-West". Ohne Wert: leerer String — das Template zeigt nur „Bild 1: " bzw. „Bild 3: " ohne Folgetext (kein `___`-Fallback, da `T.fallback` hier **nicht** verwendet wird — siehe `lib/docx/context.js:334-336`).
- **Besonderheiten**:
  - **bild1 = bild3**: Es gibt im Formular nur **ein** Eingabefeld, das jedoch zwei Template-Platzhalter speist. Das ist eine bewusste Design-Entscheidung, weil dieselbe Hausansicht zweimal im Gutachten auftaucht (Sektion 2 zur Beauftragung, Sektion 5 zur detaillierten Beschreibung) und beide Stellen sinnvollerweise dieselbe Caption tragen sollen. Siehe Kommentar in [`lib/docx/context.js:119-122`](../../lib/docx/context.js).
  - **Kein Fallback**: Anders als bei den meisten anderen Feldern wird hier **nicht** `T.fallback` verwendet — leere Eingabe ergibt einen leeren String, keinen `___`-Marker. Begründung: ein Bildunter­schriftsplatz mit `___` würde optisch befremden; lieber gar nichts.

### `grundriss`

- **Label im Formular**: „Grundriss Pflicht — Bild des Grundrisses Pflichtfeld"
- **HTML-Input-Typ**: `type="file"`, `accept="image/*"`
- **Pflichtfeld**: ja (`required-badge` im HTML)
- **Quelle**: `formular.html:601-633` (Hauptfeld bei Zeile 615)
- **Upload-Endpoints**:
  - Klient: `POST /api/submit/:token` (Feldname `grundriss`) — [`routes/public.js:93`](../../routes/public.js)
  - Admin: `POST /api/admin/save/:formularName` (Feldname `grundriss`) — [`routes/admin.js:254`](../../routes/admin.js)
  - Preview: `GET /api/submit/:token/image/grundriss` (Klient, [`routes/public.js:144-159`](../../routes/public.js)) oder `GET /api/admin/image/:formularName/grundriss` (Admin, [`routes/admin.js:309-320`](../../routes/admin.js))
- **DB-Speicherung**: `files`-Tabelle, `kind = 'grundriss'`. Pro Submission genau eine Zeile.
- **Mapping (Context)**: keine direkte Context-Variable. Render-Funktion bekommt den Buffer separat ([`routes/admin.js:420`](../../routes/admin.js)):
  ```js
  const grundrissBuffer = loadImageBufferForDocx(formularName, 'grundriss');
  ```
- **Template-Platzhalter**: keiner (Bild-Swap). Image-Target: `word/media/image5.png` ([`lib/docx/render.js:22-24`](../../lib/docx/render.js)).
- **Word-Kontext** (Sektion 5, direkt vor der Caption-Zeile):
  > Bild 4: {bild4_caption}

  (`_template_extract.md:305`)
- **Auswirkung**: Der hochgeladene Grundriss überschreibt das Platzhalter-Bild im Template (Sektion 5, Bild 4). Größenanpassung erfolgt automatisch über `fitToBox` ([`lib/docx/image-utils.js:92-100`](../../lib/docx/image-utils.js)), Seitenverhältnis bleibt erhalten.
- **Besonderheiten**:
  - Anders als die Hausansicht erscheint der Grundriss **nur einmal** im Template (Bild 4).
  - Wenn nicht hochgeladen: Template-Original bleibt stehen.

### `bild4_caption`

- **Label im Formular**: „Bildunterschrift:" (innerhalb der Grundriss-Sektion)
- **HTML-Input-Typ**: `type="text"` mit `list="dl_bild4"`
- **Datalist-Vorschläge** (`dl_bild4`, Freitext erlaubt):
  - `Grundriss`
  - `Grundriss EG`
  - `Grundriss OG`
  - `Grundriss DG`
  - `Grundriss UG / Tiefgarage`
- **Placeholder**: „z.B. Grundriss EG"
- **Quelle**: `formular.html:624-631`
- **Mapping (Context)**: `lib/docx/context.js:123`:
  ```js
  const bild4Caption = T.str(fields.bild4_caption);
  ```
- **Transformer**: nur `T.str` ([`lib/transformers.js:11`](../../lib/transformers.js)) — trimt, sonst keine Modifikation.
- **Output-Key**: `bild4_caption` ([`lib/docx/context.js:336`](../../lib/docx/context.js))
- **Template-Platzhalter**: `{bild4_caption}`
- **Word-Kontext** (Sektion 5 „Feststellungen vor Ort und aus den Planunterlagen" — direkt unter der Bauteil-Zustandsliste, vor dem Anmerkungen-Abschnitt):
  > Bild 4: {bild4_caption}

  (`_template_extract.md:305`)
- **Auswirkung**: Mit Wert „Grundriss EG" → „Bild 4: Grundriss EG" im Word. Ohne Wert: „Bild 4: " ohne Folgetext.
- **Besonderheiten**: Genau wie `bild1_caption` **ohne** `T.fallback`-Wrapping — leerer Wert bleibt leer, kein `___`-Marker. Erscheint nur an einer Stelle im Template.

### `liegenschaftskarte` (admin-only)

- **Label im Formular**: „Auszug Liegenschaftskarte — Bild der Liegenschaftskarte"
- **HTML-Input-Typ**: `type="file"`, `accept="image/*"`
- **Pflichtfeld**: nein (kein `required-badge`)
- **Sichtbarkeit**: nur Admin (`.image-section.admin-only` — Zeile 635)
- **Quelle**: `formular.html:635-655`
- **Upload-Endpoints**:
  - Admin: `POST /api/admin/save/:formularName` (Feldname `liegenschaftskarte`) — [`routes/admin.js:255`](../../routes/admin.js)
  - **Kein** Public-Endpoint — wird im `persistSubmission`-Aufruf der Public-Route bewusst **nicht** übergeben ([`routes/public.js:86-95`](../../routes/public.js) mit Kommentar „Liegenschaftskarte ist admin-only — nicht aus Public-Submit übernehmen").
  - Preview: `GET /api/admin/image/:formularName/liegenschaftskarte` (Admin only, [`routes/admin.js:312`](../../routes/admin.js)). Die Public-Image-Preview-Route ([`routes/public.js:147`](../../routes/public.js)) lehnt diesen Typ explizit ab.
- **DB-Speicherung**: `files`-Tabelle, `kind = 'liegenschaftskarte'`.
- **Mapping (Context)**: keine Context-Variable. Buffer wird in [`routes/admin.js:421`](../../routes/admin.js) separat geladen:
  ```js
  const liegenschaftskarteBuffer = loadImageBufferForDocx(formularName, 'liegenschaftskarte');
  ```
- **Template-Platzhalter**: keiner (Bild-Swap). Image-Target: `word/media/image3.jpeg` ([`lib/docx/render.js:25-27`](../../lib/docx/render.js)).
- **Word-Kontext** (Sektion 4 „Ortsbesichtigung > Grundstück"):
  > Bild 2: Auszug aus der Liegenschaftskarte{liegenschaftskarte_quelle}

  (`_template_extract.md:219`)
- **Auswirkung**: Das hochgeladene Bild ersetzt das Template-Originalbild (Bild 2, Auszug aus der Liegenschaftskarte). Der **Caption-Text** ist hartkodiert im Template („Bild 2: Auszug aus der Liegenschaftskarte"); zusätzlich wird über den Platzhalter `{liegenschaftskarte_quelle}` der Geoportal-Link je Bundesland angefügt (z.B. „, geoportal.bayern.de" — siehe [`lib/transformers.js:420-441`](../../lib/transformers.js)).
- **Besonderheiten**:
  - **Keine Bildunterschrift-Variable** für dieses Bild — die Caption ist im Template fest hinterlegt.
  - Im Formular **keine** Bildunterschrift-Eingabe (anders als bei Hausansicht/Grundriss).
  - Der angefügte Geoportal-Suffix `{liegenschaftskarte_quelle}` kommt aus dem `bundesland`-Feld (über `getLiegenschaftskarteQuelle` in [`lib/transformers.js:439-441`](../../lib/transformers.js)) und ist **nicht** Teil dieser Sektion. Beispiel: BY → „, geoportal.bayern.de", NW → „, GEOportal.NRW".

### Anlage-1-Bilder (`anlage_bilder`, admin-only)

- **Label im Formular**: „Bilder der Ortsbegehung (Anlage 1)"
- **HTML-Input-Typ**: separater Datei-Upload-Button (`<input id="anlageAddInput" type="file" accept="image/*">`, [`formular.html:664`](../../formular.html)), kein normales Form-Field.
- **Sichtbarkeit**: nur Admin (Section ist im Formular **nicht** als `.admin-only` markiert auf Container-Ebene, aber die Anlage-Bilder sind in [`routes/admin.js:449-451`](../../routes/admin.js) explizit als Admin-Inhalte deklariert. Public hat trotzdem Endpoints — der Klient kann eigene Bilder beisteuern, siehe [`routes/public.js:166-249`](../../routes/public.js).)
- **Quelle**: `formular.html:657-668`
- **Upload-Endpoints** (NICHT der normale Submit, sondern separate Endpoints):
  - Admin: `POST /api/admin/anlage/:formularName` (Feldname `file`) — [`routes/admin.js:464-492`](../../routes/admin.js)
  - Klient: `POST /api/submit/:token/anlage` (Feldname `file`) — [`routes/public.js:181-214`](../../routes/public.js)
  - Liste: `GET /api/admin/anlage/:formularName` bzw. `GET /api/submit/:token/anlage`
  - Löschen: `DELETE /api/admin/anlage/:formularName/:id` bzw. `DELETE /api/submit/:token/anlage/:id`
  - Preview: `GET /api/admin/anlage/:formularName/:id/preview` bzw. `GET /api/submit/:token/anlage/:id/preview`
- **DB-Speicherung**: `files`-Tabelle, `kind = 'anlage'`. Jede Datei mit eigener UUID. Reihenfolge und Bildunterschriften werden im Formulardaten-Feld `anlage_bilder` als Array `[{id, caption}, ...]` mitgepflegt — siehe [`routes/admin.js:380`](../../routes/admin.js) und [`routes/public.js:78-83`](../../routes/public.js).
- **Mapping (Context)**: kein Context-Eintrag. Anlage-Liste wird in [`routes/admin.js:422`](../../routes/admin.js) separat geladen:
  ```js
  const anlageList = loadAnlageListForDocx(formularName, formData);
  ```
  und an `renderGutachtenDocx` durchgereicht.
- **Template-Platzhalter**: **keine!** Anlage-1 wird **nach** dem Templater-Rendering per XML-Injection an `word/document.xml` angehängt — siehe `appendAnlageBilder` in [`lib/docx/anlage.js:97-170`](../../lib/docx/anlage.js).
- **Word-Kontext**: eigenständige Sektion, die ans Ende des Dokuments angehängt wird:
  - Seitenumbruch
  - Heading „Anlage 1: Bilder der Ortsbegehung" (Schriftgröße 14pt, fett — `lib/docx/anlage.js:23-30`)
  - Optionales Datum aus `ortsbesichtigungsdatum` (im Format „13. Mai 2026", `routes/admin.js:426-427`)
  - Pro Bild: zentriert, max. 16,7 × 22,2 cm (`ANLAGE_BOX_CX = 6_000_000` EMU, `ANLAGE_BOX_CY = 8_000_000` EMU, [`lib/docx/anlage.js:6-8`](../../lib/docx/anlage.js))
  - Unter jedem Bild: kursive, zentrierte Bildunterschrift (10pt, mehrzeilig erlaubt — `lib/docx/anlage.js:65-84`)
  - Zwischen den Bildern: Seitenumbruch ([`lib/docx/anlage.js:127-128`](../../lib/docx/anlage.js))
- **Auswirkung**: Werden Anlage-Bilder hochgeladen, entsteht am Ende des Word-Dokuments eine zusätzliche „Anlage 1"-Seitenfolge mit je einer Seite pro Bild + Bildunterschrift. Wenn keine Bilder vorhanden sind, entfällt die Anlage-Sektion komplett ([`lib/docx/anlage.js:99`](../../lib/docx/anlage.js): `if (list.length === 0) return;`).
- **Besonderheiten**:
  - **Keine Template-Platzhalter** — Anlage-Bilder werden in einem Post-Render-Schritt ins fertige DOCX-Zip injiziert. Image-Pfade, Relationships und Content-Types werden dabei dynamisch erweitert ([`lib/docx/anlage.js:131-148`](../../lib/docx/anlage.js)).
  - Pro Bild wird ein neuer `rId` vergeben (Inkrement der höchsten vorhandenen ID — [`lib/docx/anlage.js:110`](../../lib/docx/anlage.js)) und ein neues `<Relationship>` in `word/_rels/document.xml.rels` eingehängt.
  - `<wp:docPr id="...">` und `<pic:cNvPr id="...">` benötigen pro `<w:drawing>` eindeutige Integer-IDs; Startwert ist `Math.max(maxVorhanden, 99) + 1` ([`lib/docx/anlage.js:113-117`](../../lib/docx/anlage.js)).
  - Erforderliche `Default Extension="..."`-Einträge in `[Content_Types].xml` werden bei Bedarf nachgepflegt (`lib/docx/anlage.js:138-144`).
  - Reihenfolge wird **vom Frontend** bestimmt (sortierte ID-Liste im `formData.anlage_bilder`-Array) — Backend ist „dumm" und folgt nur. Datenbankzeilen ohne korrespondierende ID im Array werden im Export übersprungen (`lib/docx/admin.js:392-400` in `loadAnlageListForDocx`).

## Zusammenfassung der Verarbeitungs-Logik

| Bild | Form-Submit-Field | DB-Kind | Render-Mechanismus | Word-Position |
|---|---|---|---|---|
| Hausansicht | `hausansicht` (multipart) | `hausansicht` | Bild-Swap (3× im Template) | Titelseite, Bild 1, Bild 3 |
| Grundriss | `grundriss` (multipart) | `grundriss` | Bild-Swap (1×) | Bild 4 |
| Liegenschaftskarte | `liegenschaftskarte` (multipart, admin-only) | `liegenschaftskarte` | Bild-Swap (1×) | Bild 2 |
| Anlage-1-Bilder | separate Endpoints (`file` einzeln) | `anlage` | XML-Injection nach Render | Eigene Sektion am Ende |

| Caption-Feld | Speicherung | Output-Keys | Template-Vorkommen |
|---|---|---|---|
| `bild1_caption` | Form-JSON (`formData.bild1_caption`) | `bild1_caption`, **`bild3_caption`** (dieselbe Eingabe) | 2 Stellen |
| `bild4_caption` | Form-JSON (`formData.bild4_caption`) | `bild4_caption` | 1 Stelle |
| Anlage-Captions | Form-JSON (`formData.anlage_bilder[i].caption`) | (kein Output-Key) | pro Bild in Anlage 1 |
| Liegenschaftskarte-Caption | — | — | hardcoded im Template |
