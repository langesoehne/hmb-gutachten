# Erschließung

Diese Sektion (`data-section-key="erschliessung"`) ist im Formular **admin-only**, d.h. nur der Sachverständige sieht und füllt sie aus. Sie sammelt die Erschließungs-Eckdaten des Objekts: welche **Versorgungsanschlüsse** vorhanden sind (Strom, Gas, Wasser, Kanalisation), in welcher **Himmelsrichtung** die Anliegerstraße verläuft und welcher **Fahrbahn-Typ** vor dem Objekt liegt.

Alle sechs Felder dieser Sektion werden durch den Builder `buildErschliessungText` ([`lib/transformers.js:491-519`](../../lib/transformers.js)) zu **einem zusammenhängenden Satz-Paar** verschmolzen und unter dem Output-Key `erschliessung_text` als Platzhalter `{erschliessung_text}` in Sektion 4 „Ortsbesichtigung > Tatsächliche Eigenschaften > Erschließung" eingefügt. Es gibt also **kein 1:1-Mapping** zwischen einzelnen Eingabefeldern und Template-Platzhaltern — alle sechs Inputs zusammen ergeben genau einen Platzhalter im Word-Dokument.

Zwei der Eingaben für `buildErschliessungText` stammen nicht aus dieser Sektion, sondern aus den Objekt-Stammdaten (`objekt_strasse`, `objekt_hausnummer`, `objekt_hausnummer_zusatz`) — sie werden zum Anschriftsreferenz-Teil („Das Objekt …") und zum Straßennamen im zweiten Halbsatz wiederverwendet. Ist eines dieser Pflichtteile leer, fällt der entsprechende Halbsatz still weg.

## Übersicht

| Formular-Feld (`name=`) | Template-Platzhalter | Word-Kontext (Kurzform) |
|---|---|---|
| `erschliessung_strom` | indirekt via `{erschliessung_text}` | Listet „Strom" im Satzteil „… an das öffentliche Versorgungsnetz mit …" |
| `erschliessung_gas` | indirekt via `{erschliessung_text}` | Listet „Gas" im selben Versorgungsnetz-Satzteil |
| `erschliessung_wasser` | indirekt via `{erschliessung_text}` | Listet „Wasser" im selben Versorgungsnetz-Satzteil |
| `erschliessung_kanalisation` | indirekt via `{erschliessung_text}` | Fügt „sowie an die öffentliche Kanalisation" hinzu |
| `erschliessung_himmelsrichtung` | indirekt via `{erschliessung_text}` | „… wird … von der {himmel} verlaufenden „{Straße}"…" |
| `erschliessung_fahrbahn_typ` | indirekt via `{erschliessung_text}` | Erscheint in Klammern hinter dem Straßennamen, z.B. „(Asphaltierte Fahrbahn mit Gehweg)" |

Der zusammengesetzte Ausgabeschlüssel ist:

- `erschliessung_text` → `{erschliessung_text}` (`lib/docx/context.js:390`)

## Felder im Detail

### `erschliessung_strom`

- **Label im Formular**: „Versorgungsanschlüsse:" (Checkbox-Label „Strom")
- **HTML-Input-Typ**: `type="checkbox"`, `value="ja"`
- **Quelle**: `formular.html:523`
- **Mapping (Context)**: in `lib/transformers.js:493` ausgewertet (`buildErschliessungText`):
  ```js
  if (str(fields.erschliessung_strom).toLowerCase() === 'ja') versorgung.push('Strom');
  ```
- **Transformer / Builder**: `buildErschliessungText(fields, objektStrasse, anschriftKurz)` ([`lib/transformers.js:491-519`](../../lib/transformers.js)) sammelt aktive Versorgungen in einem Array.
- **Output-Key**: `erschliessung_text` (kein eigener Output für Strom allein)
- **Template-Platzhalter**: `{erschliessung_text}` (Sammelplatzhalter)
- **Word-Kontext** (Sektion 4 „Ortsbesichtigung > Erschließung"):
  > Erschließung
  >
  > {erschliessung_text}

  (`_template_extract.md:235-239`)
- **Auswirkung**: Bei aktiver Checkbox erscheint „Strom" als Teil der Aufzählung im Versorgungsnetz-Satz. Beispiel mit drei aktiven Checkboxen (Strom + Gas + Wasser): „… an das öffentliche Versorgungsnetz mit Strom, Gas und Wasser angeschlossen." Wenn nur Strom aktiv ist: „… an das öffentliche Versorgungsnetz mit Strom angeschlossen."
- **Besonderheiten**: Die Verkettung der drei Versorgungs-Checkboxen geschieht durch `versorgung.join(', ').replace(/, ([^,]+)$/, ' und $1')`, also klassisches deutsches Listenformat („A, B und C"). Wenn keine der drei Strom/Gas/Wasser-Checkboxen aktiv ist, fällt der gesamte „an das öffentliche Versorgungsnetz mit …"-Halbsatz weg.

### `erschliessung_gas`

- **Label im Formular**: „Versorgungsanschlüsse:" (Checkbox-Label „Gas")
- **HTML-Input-Typ**: `type="checkbox"`, `value="ja"`
- **Quelle**: `formular.html:524`
- **Mapping (Context)**: `lib/transformers.js:494`:
  ```js
  if (str(fields.erschliessung_gas).toLowerCase() === 'ja') versorgung.push('Gas');
  ```
- **Transformer / Builder**: identisch zu `erschliessung_strom`, siehe `buildErschliessungText` ([`lib/transformers.js:491-519`](../../lib/transformers.js)).
- **Output-Key**: `erschliessung_text`
- **Template-Platzhalter**: `{erschliessung_text}`
- **Word-Kontext** (Sektion 4): siehe `erschliessung_strom`.
- **Auswirkung**: Bei aktiver Checkbox erscheint „Gas" in der Versorgungs-Aufzählung. Beispiel: bei Strom + Gas → „… mit Strom und Gas angeschlossen."
- **Besonderheiten**: Es gibt keine Plausibilitäts-Validierung (Gas-Anschluss ist nicht abhängig von der Heizungs-Sektion); der Sachverständige verantwortet die Stimmigkeit selbst.

### `erschliessung_wasser`

- **Label im Formular**: „Versorgungsanschlüsse:" (Checkbox-Label „Wasser")
- **HTML-Input-Typ**: `type="checkbox"`, `value="ja"`
- **Quelle**: `formular.html:525`
- **Mapping (Context)**: `lib/transformers.js:495`:
  ```js
  if (str(fields.erschliessung_wasser).toLowerCase() === 'ja') versorgung.push('Wasser');
  ```
- **Transformer / Builder**: `buildErschliessungText` ([`lib/transformers.js:491-519`](../../lib/transformers.js)).
- **Output-Key**: `erschliessung_text`
- **Template-Platzhalter**: `{erschliessung_text}`
- **Word-Kontext** (Sektion 4): siehe `erschliessung_strom`.
- **Auswirkung**: Bei aktiver Checkbox erscheint „Wasser" in der Versorgungs-Aufzählung. Mit allen drei aktiv: „… an das öffentliche Versorgungsnetz mit Strom, Gas und Wasser angeschlossen."
- **Besonderheiten**: Die Reihenfolge im Output ist fest (Strom → Gas → Wasser), unabhängig davon, in welcher Reihenfolge der Sachverständige die Checkboxen aktiviert.

### `erschliessung_kanalisation`

- **Label im Formular**: „Versorgungsanschlüsse:" (Checkbox-Label „Kanalisation")
- **HTML-Input-Typ**: `type="checkbox"`, `value="ja"`
- **Quelle**: `formular.html:526`
- **Mapping (Context)**: `lib/transformers.js:505-508`:
  ```js
  const kanal = str(fields.erschliessung_kanalisation).toLowerCase() === 'ja';
  const anschluesse = [];
  if (versorgungText) anschluesse.push(`an das öffentliche Versorgungsnetz mit ${versorgungText}`);
  if (kanal) anschluesse.push('an die öffentliche Kanalisation');
  ```
- **Transformer / Builder**: `buildErschliessungText` ([`lib/transformers.js:491-519`](../../lib/transformers.js)).
- **Output-Key**: `erschliessung_text`
- **Template-Platzhalter**: `{erschliessung_text}`
- **Word-Kontext** (Sektion 4): siehe `erschliessung_strom`.
- **Auswirkung**: Die Kanalisation steht **nicht** in der Versorgungsnetz-Aufzählung, sondern wird als eigener Anschlusspunkt mit „sowie" angehängt. Beispiele:
  - Strom + Gas + Wasser + Kanal: „Das Objekt … ist an das öffentliche Versorgungsnetz mit Strom, Gas und Wasser sowie an die öffentliche Kanalisation angeschlossen."
  - Nur Kanal: „Das Objekt … ist an die öffentliche Kanalisation angeschlossen."
  - Strom + Wasser ohne Kanal: „Das Objekt … ist an das öffentliche Versorgungsnetz mit Strom und Wasser angeschlossen."
- **Besonderheiten**: Wenn weder Versorgungs-Checkboxen noch Kanal aktiv sind, fällt der gesamte erste Satz („Das Objekt … ist … angeschlossen.") weg. Der zweite Satz zur Straßenerschließung (siehe `erschliessung_himmelsrichtung`) bleibt aber davon unberührt.

### `erschliessung_himmelsrichtung`

- **Label im Formular**: „Straße verläuft (Himmelsrichtung):"
- **HTML-Input-Typ**: `type="radio"`
- **Optionen** (Radio-Werte, in Form-Reihenfolge):
  | Wert (`value=`) | Anzeigetext im Formular | Ergebnis nach `toDisplayHimmelsrichtung` |
  |---|---|---|
  | `nord`     | nördlich       | `nördlich`     |
  | `nordost`  | nordöstlich    | `nordöstlich`  |
  | `ost`      | östlich        | `östlich`      |
  | `suedost`  | südöstlich     | `südöstlich`   |
  | `sued`     | südlich        | `südlich`      |
  | `suedwest` | südwestlich    | `südwestlich`  |
  | `west`     | westlich       | `westlich`     |
  | `nordwest` | nordwestlich   | `nordwestlich` |
- **Quelle**: `formular.html:534-541`
- **Mapping (Context)**: `lib/transformers.js:500`:
  ```js
  const himmel = toDisplayHimmelsrichtung(fields.erschliessung_himmelsrichtung);
  ```
- **Transformer / Builder**: `toDisplayHimmelsrichtung(rawValue)` ([`lib/transformers.js:214-226`](../../lib/transformers.js)) mappt den Radio-Schlüssel auf eine Adverb-Form (z.B. `suedwest` → `südwestlich`). Anschließend in `buildErschliessungText` ([`lib/transformers.js:514-516`](../../lib/transformers.js)) zum zweiten Satzteil verwoben.
- **Output-Key**: `erschliessung_text`
- **Template-Platzhalter**: `{erschliessung_text}`
- **Word-Kontext** (Sektion 4): zweiter Halbsatz unter „Erschließung":
  > Es wird, soweit ersichtlich, von der {himmel} verlaufenden „{strasseName}" erschlossen({fahrbahn}).

  (Quelle: `lib/transformers.js:514-516` — im Template selbst nur `{erschliessung_text}`)
- **Auswirkung**: Mit `nordost` + Straße „Hauptstraße" + Fahrbahn „Asphaltierte Fahrbahn mit Gehweg" → „Es wird, soweit ersichtlich, von der nordöstlich verlaufenden „Hauptstraße" erschlossen (Asphaltierte Fahrbahn mit Gehweg)." Ohne Himmelsrichtung **oder** ohne Straßennamen entfällt der gesamte zweite Halbsatz.
- **Besonderheiten**: Der Straßenname kommt aus `objekt_strasse` (Sektion „Angaben zum Objekt"), nicht aus dieser Sektion. Wenn `objekt_strasse` leer ist, wird die Himmelsrichtung nicht ausgegeben — beide müssen gefüllt sein, damit der Satzteil entsteht.

### `erschliessung_fahrbahn_typ`

- **Label im Formular**: „Fahrbahn-Typ:"
- **HTML-Input-Typ**: `type="text"` mit `list="dl_fahrbahn"`
- **Datalist-Vorschläge** (`dl_fahrbahn`, Freitext erlaubt):
  - `Asphaltierte Fahrbahn mit Gehweg`
  - `Asphaltierte Fahrbahn`
  - `Pflasterstraße mit Gehweg`
  - `Pflasterstraße`
  - `Schotterweg`
- **Placeholder**: „z.B. Asphaltierte Fahrbahn mit Gehweg"
- **Quelle**: `formular.html:546-556`
- **Mapping (Context)**: `lib/transformers.js:501`:
  ```js
  const fahrbahn = str(fields.erschliessung_fahrbahn_typ);
  ```
- **Transformer / Builder**: kein eigener Mapping-Transformer — `T.str` ([`lib/transformers.js:11`](../../lib/transformers.js)) trimt nur. Eingebettet in `buildErschliessungText` ([`lib/transformers.js:515`](../../lib/transformers.js)):
  ```js
  const teil2 = (himmel && strasseName)
    ? ` Es wird, soweit ersichtlich, von der ${himmel} verlaufenden „${strasseName}" erschlossen${fahrbahn ? ` (${fahrbahn})` : ''}.`
    : '';
  ```
- **Output-Key**: `erschliessung_text`
- **Template-Platzhalter**: `{erschliessung_text}`
- **Word-Kontext** (Sektion 4): in Klammern hinter dem Straßennamen.
- **Auswirkung**: Mit Wert „Pflasterstraße mit Gehweg" → „… von der nördlich verlaufenden „Hauptstraße" erschlossen (Pflasterstraße mit Gehweg)." Ohne Wert: kein Klammerteil — „… erschlossen." Hängt zusätzlich von `erschliessung_himmelsrichtung` und `objekt_strasse` ab: ist eines davon leer, entfällt der gesamte zweite Halbsatz und der Fahrbahn-Typ wird unsichtbar.
- **Besonderheiten**: Freitext-Feld mit `datalist` — der Sachverständige darf jeden beliebigen String eingeben, die Vorschläge dienen nur als Autocomplete. Wird wörtlich, ohne Modifikation, in den Klammertext übernommen.

## Querverweise auf Eingaben außerhalb dieser Sektion

`buildErschliessungText` greift zusätzlich auf zwei Eingaben aus der Sektion „Angaben zum Objekt" zurück. Sie sind hier nicht eigene Felder, aber für das Endergebnis zwingend nötig:

- `objekt_strasse` (`formular.html:179`) — wird im zweiten Halbsatz als „…von der {himmel} verlaufenden „{Straße}"…" verwendet. Ohne Wert: kein zweiter Halbsatz.
- `objekt_hausnummer` + `objekt_hausnummer_zusatz` (`formular.html:183-187`) — werden zusammen mit `objekt_strasse` zur **Anschriftsreferenz** für den ersten Halbsatz („Das Objekt {anschrift} ist …") zusammengesetzt. Logik in `lib/docx/context.js:209-213`:
  ```js
  const erschliessungAnschrift = T.compactJoin([
    objektStrasse,
    T.compactJoin([fields.objekt_hausnummer, objektHausnummerZusatz])
  ]);
  ```
  Ist diese Anschriftsreferenz leer, fällt der erste Halbsatz komplett weg, **auch** wenn Versorgung oder Kanalisation aktiv sind (`lib/transformers.js:510-512`).

## Der zusammengesetzte Satz im Detail

Der Builder erzeugt einen Output, der aus bis zu zwei Sätzen besteht (`lib/transformers.js:510-518`):

```js
const teil1 = (anschriftRef && anschluesse.length)
  ? `Das Objekt ${anschriftRef} ist ${anschluesse.join(' sowie ')} angeschlossen.`
  : '';

const teil2 = (himmel && strasseName)
  ? ` Es wird, soweit ersichtlich, von der ${himmel} verlaufenden „${strasseName}" erschlossen${fahrbahn ? ` (${fahrbahn})` : ''}.`
  : '';

return (teil1 + teil2).trim();
```

### Beispiel-Ausgaben

| Eingaben | Resultat in `{erschliessung_text}` |
|---|---|
| Alle 4 Versorgungs-Checkboxen + Himmelsrichtung `sued` + Fahrbahn „Asphaltierte Fahrbahn mit Gehweg" + objekt_strasse „Hauptstraße" + Hausnummer „12a" | „Das Objekt Hauptstraße 12a ist an das öffentliche Versorgungsnetz mit Strom, Gas und Wasser sowie an die öffentliche Kanalisation angeschlossen. Es wird, soweit ersichtlich, von der südlich verlaufenden „Hauptstraße" erschlossen (Asphaltierte Fahrbahn mit Gehweg)." |
| Nur Strom + Wasser, keine Kanalisation, ohne Himmelsrichtung, objekt_strasse „Hauptstraße 12" | „Das Objekt Hauptstraße 12 ist an das öffentliche Versorgungsnetz mit Strom und Wasser angeschlossen." |
| Nur Kanalisation, Himmelsrichtung `west`, objekt_strasse „Hauptstraße" | „Das Objekt Hauptstraße ist an die öffentliche Kanalisation angeschlossen. Es wird, soweit ersichtlich, von der westlich verlaufenden „Hauptstraße" erschlossen." |
| Nichts ausgefüllt (alle Checkboxen leer, keine Himmelsrichtung, keine Straße) | (leerer String — `T.fallback` macht daraus `___` im Word) |

### Fallback-Verhalten

Im Context wird der Output durch `T.fallback(erschliessungText)` ([`lib/docx/context.js:390`](../../lib/docx/context.js)) verpackt. Wenn beide Teile leer sind, erscheint im fertigen Word an dieser Stelle der Platzhalter `___` — ein deutlicher visueller Hinweis, dass der Sachverständige die Erschließungsdaten nachtragen muss.
