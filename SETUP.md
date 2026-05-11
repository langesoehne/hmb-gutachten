# Setup-Cheat-Sheet

Die ausführliche Doku (Workflow, API, Architektur, Sicherheit) steht im [README](./README.md). Diese Datei sammelt nur die Stellen, die im Betrieb regelmäßig nachgeschlagen werden.

## `PUBLIC_BASE_URL` — Format

`PUBLIC_BASE_URL` **muss gesetzt sein, sobald der Server hinter einem Reverse-Proxy / Tunnel läuft** — sonst zeigen die an Klienten verschickten Links auf interne Hostnamen und funktionieren nicht.

An die URL wird intern `/submit/<token>` angehängt — sie muss daher ein vollständiger URL-Präfix sein:

- **Mit Protokoll** (`https://` für Produktion, `http://` nur für lokale Tests) — **ohne** Protokoll funktioniert es nicht.
- **Hostname** wie er von außen erreichbar ist (Domain oder IP).
- **Port** nur angeben, wenn der Server nicht auf dem Standard-Port (443/80) läuft.
- **Kein Trailing-Slash** nötig (wird sonst entfernt).
- **Kein Pfad** `/submit` — den hängt der Server selbst an.

Beispiele:

| Setup | Korrekter Wert |
|-------|---------------|
| Produktion hinter Reverse-Proxy | `PUBLIC_BASE_URL=https://gutachten.example.com` |
| Mit Subpfad (Reverse-Proxy mappt `/afa`) | `PUBLIC_BASE_URL=https://example.com/afa` |
| Cloudflare-Tunnel o.ä. | `PUBLIC_BASE_URL=https://afa-gutachten.trycloudflare.com` |
| Lokaler Test (selten nötig) | `PUBLIC_BASE_URL=http://localhost:8000` |

Ergebnis: Aus `https://gutachten.example.com` + Token `abc123` wird der Klient-Link `https://gutachten.example.com/submit/abc123`.

## `ADMIN_PASSWORD` generieren

```bash
echo "ADMIN_PASSWORD=$(openssl rand -base64 24)" >> .env
```

## Health-Check

```bash
curl http://localhost:8000/api/health
```

## Backup der Datenbank

Die DB läuft im WAL-Mode — neben `form_storage.db` existieren zur Laufzeit `form_storage.db-wal` und `form_storage.db-shm`. Ein simples `cp` der `.db` allein kann daher inkonsistente Snapshots erzeugen.

**Sicheres Backup während der Server läuft:**

```bash
sqlite3 data/form_storage.db ".backup data/backup-$(date +%Y%m%d-%H%M%S).db"
```

`.backup` ist atomar — auch parallele Schreibvorgänge stören nicht.

**Bei gestopptem Server:**

```bash
sqlite3 data/form_storage.db 'PRAGMA wal_checkpoint(TRUNCATE);'
cp data/form_storage.db data/backup.db
```

Der `wal_checkpoint(TRUNCATE)`-Schritt schreibt offene WAL-Einträge zurück und leert die `.wal`-Datei — danach reicht ein normales `cp`.
