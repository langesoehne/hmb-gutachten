const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { DB_PATH } = require('./config');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// node:sqlite hat create-if-missing als Default und aktiviert Foreign-Keys automatisch.
const db = new DatabaseSync(DB_PATH);

// WAL-Mode: entkoppelt Reads und Writes, wichtig bei BLOB-Inserts (Bilder bis 10 MB).
// Backup: nicht einfach `cp` — Server stoppen oder `sqlite3 ".backup"` nutzen (siehe SETUP.md).
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA synchronous = NORMAL');
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA cache_size = -64000');

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    formularName TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    finalized INTEGER NOT NULL DEFAULT 0,
    finalized_at TEXT
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('hausansicht','grundriss','liegenschaftskarte','anlage','other')),
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    data BLOB NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (submission_id) REFERENCES submissions(formularName) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_files_submission_id ON files(submission_id);
  CREATE INDEX IF NOT EXISTS idx_files_submission_kind ON files(submission_id, kind);

  -- Single-Slot-Garantie: pro Submission max. ein hausansicht/grundriss/liegenschaftskarte.
  CREATE UNIQUE INDEX IF NOT EXISTS idx_files_single_slot
    ON files(submission_id, kind)
    WHERE kind IN ('hausansicht','grundriss','liegenschaftskarte');

  CREATE TABLE IF NOT EXISTS submission_tokens (
    token TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    last_used_at TEXT,
    revoked_at TEXT,
    FOREIGN KEY (submission_id) REFERENCES submissions(formularName) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tokens_submission ON submission_tokens(submission_id);
`);

// Bild-Typen werden über die `kind`-Spalte in der files-Tabelle unterschieden.
// Single-Slot: hausansicht, grundriss, liegenschaftskarte (DB-Unique-Index erzwingt max. 1 pro Submission).
const SINGLE_SLOT_KINDS = ['hausansicht', 'grundriss', 'liegenschaftskarte'];

// Wickelt einen Block in BEGIN IMMEDIATE / COMMIT — bei Throw wird ROLLBACK versucht und der Fehler weitergereicht.
function withTransaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch (_) { /* ignore */ }
    throw error;
  }
}

module.exports = { db, withTransaction, SINGLE_SLOT_KINDS };
