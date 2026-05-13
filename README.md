# AFA-Gutachten Backend

> ⚠️ **In Entwicklung** — Dieses Projekt befindet sich noch in der Entwicklungsphase.

Node.js/Express-Backend mit eingebautem SQLite (`node:sqlite`), getrennt nach Admin- und Klient-Bereich:

- **Admin** (passwortgeschützt): Übersicht aller Gutachten, Formulare bearbeiten, Bilder (Hausansicht, Grundriss, Liegenschaftskarte, Anlage-Bilder der Ortsbegehung) hochladen, Word-Export, Klient-Links erzeugen / widerrufen.
- **Klient** (nur mit gültigem Link-Token): füllt seinen Teil des Formulars aus (Kunden-Pflichtangaben + Hausansicht/Grundriss), sieht weder andere Formulare, noch Gutachter-Felder, Anlage-Bilder oder das fertige Word-Dokument.

Für die Trennung zwischen Kunden- und Gutachter-Feldern siehe `required-fields.js` (`REQUIRED_FIELDS` vs. `EXPERT_FIELDS`).

## Voraussetzungen

- **Node.js ≥ 22.5** (für `node:sqlite`). Siehe `.nvmrc`.
- Der Start nutzt `node --experimental-sqlite` — das eingebaute SQLite-Modul ist noch hinter einem Flag versteckt.

## Installation

```bash
npm install
cp .env.example .env
# ADMIN_PASSWORD setzen, danach:
npm start
```

## Konfiguration

Pflichtvariable in `.env`:

| Variable | Bedeutung |
|----------|-----------|
| `ADMIN_PASSWORD` | Passwort für die Admin-Übersicht (Basic Auth). Server startet nicht ohne. |

Optional:

| Variable | Default | Bedeutung |
|----------|---------|-----------|
| `ADMIN_USER` | `admin` | Benutzername für Basic Auth |
| `PUBLIC_BASE_URL` | _(leer)_ | Wenn gesetzt, werden Klient-Links mit dieser Basis erzeugt (z.B. `https://gutachten.example.com`). Sonst wird die Request-URL des Admins benutzt. Details in [`SETUP.md`](./SETUP.md). |
| `PORT` | `8000` | |
| `HOST` | `0.0.0.0` | |
| `DB_PATH` | `./data/form_storage.db` | |
| `DOCX_TEMPLATE_PATH` | `./templates/gutachten_template.docx` | |
| `MAX_FILE_SIZE` | `10485760` (10 MB) | |
| `CORS_ORIGIN` | _(leer)_ | Same-origin only. Nur setzen, wenn die App von einer anderen Origin angesprochen werden soll (z.B. `https://app.example.com`). |

## npm-Scripts

```bash
npm start         # Produktiv-Start
npm run dev       # Start mit --watch (Auto-Reload)
npm test          # Smoke-Tests (node:test)
npm run lint      # ESLint
npm run lint:fix  # ESLint mit automatischen Fixes
```

## Projektstruktur

```
server.js                    Bootstrap (Express, Routes mounten, Listen, Shutdown)
config.js                    Env-Vars laden, ADMIN_AUTH_HASH ableiten
db.js                        SQLite-Setup, Schema, withTransaction()-Helper
auth.js                      basicAuth-Middleware, checkAdminCredentials()
required-fields.js           Gemeinsame Felder-Definitionen (UMD: Node + Browser)
frontend-utils.js            Gemeinsame Browser-Helfer (showToast, confirmAction, escapeHtml)
formular.html / .css / .js   Klient/Admin-Formular (Markup, Styles, Logik getrennt)
index.html                   Admin-Übersicht
lib/
  uploads.js                 multer-Setup, Upload-Middlewares
  submissions.js             Token-/Submission-Helfer, persistSubmission, serveFormularHtml
  transformers.js            str/fallback/formatDateDe + alle toDisplay*-Funktionen
  docx/
    image-utils.js           Magic-Byte-Erkennung, readImageDimensions, fitToBox
    render.js                Template laden+cachen, renderGutachtenDocx
    anlage.js                Anlage-1-Sektion (XML-Bausteine, appendAnlageBilder)
    context.js               buildDocxContext (Formulardaten → Template-Variablen)
routes/
  public.js                  /submit/:token, /api/submit/:token/* (token-basiert)
  admin.js                   /, /formular.html, /api/admin/* (Basic Auth)
  tools.js                   /api/tools/* (Token oder Admin)
test/
  auth.test.js               Unit-Tests für checkAdminCredentials
  api.test.js                Integration-Smoke-Tests (HTTP)
```

## Workflow

1. Admin öffnet `/`, gibt `ADMIN_USER` / `ADMIN_PASSWORD` ein.
2. Admin legt ein neues Formular an → Server erzeugt einen einmaligen, kryptographisch zufälligen Token und zeigt den öffentlichen Link.
3. Admin sendet diesen Link an den Klienten (z.B. per E-Mail).
4. Klient öffnet `/submit/<token>` und füllt seine Pflichtfelder aus (inkl. Hausansicht-Foto und Grundriss-Bild) — jede Änderung wird automatisch gespeichert, ein manueller Speichern-Button gibt es nicht. Der Klient sieht keine Gutachter-Felder, keine Liste, keine Lösch-Funktion, keinen Word-Export.
5. Admin sieht in der Übersicht „Zuletzt vom Klient geändert: …", öffnet das Formular bei Bedarf zur Nachbearbeitung, ergänzt die Gutachter-Felder, lädt Liegenschaftskarte und Anlage-Bilder der Ortsbegehung hoch und exportiert das Word-Dokument.
6. Wenn das Formular fertig ist, kann der Admin den Klient-Link widerrufen — der Token wird ungültig, ohne die Daten zu löschen.

## API Endpoints

### Öffentlich (kein Login)

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/health` | Health-Check |
| GET | `/submit/:token` | Liefert das Formular im Klient-Modus aus |
| GET | `/api/submit/:token` | Lädt den aktuellen Stand inkl. Bild-Metadaten |
| POST | `/api/submit/:token` | Speichert die Formulardaten — `formularName` wird vom Server aus dem Token bestimmt; Anlage-Bilder und Liegenschaftskarte werden ignoriert |
| POST | `/api/submit/:token/finalize` | Klient schließt seine Angaben endgültig ab; danach sind Public-Schreib-Endpunkte gesperrt |
| GET | `/api/submit/:token/image/:type` | Vorschau für `hausansicht` / `grundriss` (Liegenschaftskarte bewusst ausgeschlossen — admin-only) |
| GET | `/required-fields.js`, `/frontend-utils.js`, `/formular.css`, `/formular.js` | Geteilte Frontend-Assets |

Ungültige oder widerrufene Tokens liefern 404.

### Tools (Admin-Auth ODER gültiger Submission-Token)

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/tools/geocode?q=<adresse>` | Geocoding über OpenStreetMap Nominatim. Token via `?token=` oder `X-Submission-Token`-Header, sonst Basic Auth. |

### Admin (HTTP Basic Auth)

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/` | Admin-Übersicht |
| GET | `/formular.html` | Admin-Formular (mit `?formularName=<id>`) |
| GET | `/api/admin/list` | Alle Einträge inkl. Token-Status |
| POST | `/api/admin/forms` | Neues Formular anlegen, Token + Public-URL erzeugen (`{ formularName }`) |
| POST | `/api/admin/forms/:formularName/token` | Token (neu) ausstellen — alter Token wird ungültig |
| DELETE | `/api/admin/forms/:formularName/token` | Token widerrufen, Daten bleiben erhalten |
| PUT | `/api/admin/forms/:formularName/finalized` | finalized-Flag setzen oder zurücksetzen (`{ finalized: bool }`) |
| POST | `/api/admin/save` | Daten speichern / aktualisieren (Multipart: `id`, `fields`, optionale Uploads `files`, `hausansicht`, `grundriss`, `liegenschaftskarte`) |
| GET | `/api/admin/load/:formularName` | Eintrag laden inkl. Datei-/Bild-Metadaten |
| GET | `/api/admin/image/:formularName/:type` | Vorschau für `hausansicht` / `grundriss` / `liegenschaftskarte` |
| GET | `/api/admin/files/:formularName/:filename` | Hochgeladene Datei aus DB liefern |
| GET | `/api/admin/status/:formularName` | Existenz-Check |
| GET | `/api/admin/export-docx/:formularName` | Generiertes Word-Dokument ausliefern |
| GET | `/api/admin/anlage/:formularName` | Liste aller Anlage-Bilder der Ortsbegehung |
| POST | `/api/admin/anlage/:formularName` | Anlage-Bild hochladen (Feldname `file`) — gibt `id` zurück, die das Frontend in `formData.anlage_bilder` einträgt |
| DELETE | `/api/admin/anlage/:formularName/:id` | Anlage-Bild löschen |
| GET | `/api/admin/anlage/:formularName/:id/preview` | Anlage-Bild als Vorschau (inline) |
| DELETE | `/api/admin/delete/:formularName` | Eintrag inkl. Dateien und Token entfernen |

## Datenbank-Schema

**submissions**
- `formularName` (PRIMARY KEY)
- `data` (TEXT, JSON-serialisiert)
- `created_at`, `updated_at`
- `finalized` (INTEGER 0/1), `finalized_at`

**files** — eine Tabelle für alle Bilder + Datei-Uploads, unterschieden über die `kind`-Spalte:
- `id` (PRIMARY KEY, UUIDv4)
- `submission_id` (FK → submissions.formularName, ON DELETE CASCADE)
- `kind` — CHECK in (`hausansicht`, `grundriss`, `liegenschaftskarte`, `anlage`, `other`)
- `original_name`, `mime_type`, `size`, `data` (BLOB), `created_at`
- Partial Unique Index erzwingt **max. ein** `hausansicht` / `grundriss` / `liegenschaftskarte` pro Submission.

Reihenfolge und Bildunterschriften der Anlage-Bilder werden in `submissions.data.anlage_bilder` als Liste von `{ id, caption }` gespeichert; die Bytes selbst liegen in `files` mit `kind='anlage'`.

**submission_tokens**
- `token` (PRIMARY KEY) — 24 Bytes Random, base64url-kodiert
- `submission_id` (UNIQUE, FK → submissions.formularName, ON DELETE CASCADE)
- `created_at`, `last_used_at`, `revoked_at`

## Sicherheits-Hinweise

- `ADMIN_PASSWORD` muss gesetzt sein, sonst startet der Server nicht.
- Der Vergleich der Anmeldedaten ist timing-safe (SHA-256 + `crypto.timingSafeEqual`).
- Der Server liefert *keine* statischen Dateien aus seinem Wurzelverzeichnis aus — `data/`, `templates/`, `.env` etc. sind nicht über HTTP erreichbar. Freigegeben sind ausschließlich die geteilten Frontend-Assets (`/required-fields.js`, `/frontend-utils.js`, `/formular.css`, `/formular.js`).
- Klient-Tokens sind 32 Zeichen lang (24 Bytes Entropie). Sie werden bei jedem Aufruf in der DB gegen `revoked_at` geprüft.
- Beim Public-Submit wird der `formularName` aus dem Token-Datensatz gezogen, nicht aus dem Request-Body — der Klient kann also kein anderes Formular treffen.
- Anlage-Bilder und Liegenschaftskarte sind admin-only: der Public-Submit ignoriert sie aus dem Request-Body, und es existieren keine Public-Endpunkte zum Laden oder Hochladen.
- Inline-`<script>`-Injection mit Token-/Form-Konfiguration nutzt vollständiges JS-Unicode-Escaping (`<`, `>`, `&`, U+2028, U+2029) statt der naiven `<`-Ersetzung — kein `</script>`-Breakout.
- Geocoding-Endpoint akzeptiert sowohl Submission-Token als auch Admin-Basic-Auth, damit der Klient eine Adresse während des Ausfüllens auflösen kann, ohne dass anonyme Aufrufer das Nominatim-Backend für eigene Anfragen nutzen können.
- Hinter einem Reverse-Proxy: `PUBLIC_BASE_URL` setzen, damit kopierte Klient-Links nicht auf interne Hostnamen zeigen — siehe [`SETUP.md`](./SETUP.md).
