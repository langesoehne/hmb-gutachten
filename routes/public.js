const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { upload, uploadAnlage } = require('../lib/uploads');
const {
  loadSubmissionForToken,
  readFileMetaForSubmission,
  persistSubmission,
  sendSubmissionImage,
  sendAnlagePreview,
  deleteAnlageFileAndSyncJson,
  serveFormularHtml,
  publicErrorPage
} = require('../lib/submissions');

const router = express.Router();

// Public form page
router.get('/submit/:token', (req, res) => {
  const tokenRow = loadSubmissionForToken(req.params.token);
  if (!tokenRow) {
    res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(publicErrorPage('Bitte wenden Sie sich an Ihren Sachverständigen, um einen aktualisierten Link zu erhalten.'));
  }
  serveFormularHtml(res, 'public', {
    token: req.params.token,
    formularName: tokenRow.submission_id
  });
});

// Public load: returns existing draft data + image meta for a token
router.get('/api/submit/:token', (req, res) => {
  try {
    const tokenRow = loadSubmissionForToken(req.params.token);
    if (!tokenRow) {
      return res.status(404).json({ error: 'Ungültiger oder abgelaufener Link' });
    }
    let parsedData = {};
    try { parsedData = JSON.parse(tokenRow.data) || {}; } catch (_) { /* ignore */ }
    const meta = readFileMetaForSubmission(tokenRow.formularName);
    res.json({
      formularName: tokenRow.formularName,
      data: parsedData,
      hausansicht: meta.hausansicht,
      grundriss: meta.grundriss,
      anlage: meta.anlage,
      finalized: !!tokenRow.finalized,
      finalized_at: tokenRow.finalized_at || null
    });
  } catch (error) {
    console.error('Public load error:', error);
    res.status(500).json({ error: 'Daten konnten nicht geladen werden' });
  }
});

// Public submit: saves form data; formularName is forced to the token's submission
router.post('/api/submit/:token', upload, (req, res) => {
  const tokenRow = loadSubmissionForToken(req.params.token);
  if (!tokenRow) {
    return res.status(404).json({ error: 'Ungültiger oder abgelaufener Link' });
  }
  if (tokenRow.finalized) {
    return res.status(403).json({ error: 'Das Formular wurde bereits final abgeschickt und kann nicht mehr geändert werden.', finalized: true });
  }
  let formData;
  try {
    formData = JSON.parse((req.body && req.body.fields) || '{}');
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON in fields parameter' });
  }
  if (typeof formData !== 'object' || Array.isArray(formData) || formData === null) {
    return res.status(400).json({ error: 'fields must be a JSON object' });
  }
  formData.formularName = tokenRow.submission_id;

  // Anlage-Bilder: Reihenfolge + Captions aus dem Body übernehmen, aber auf IDs filtern,
  // die der Submission tatsächlich gehören (Schutz vor Cross-Submission-Manipulation).
  const submittedAnlage = Array.isArray(formData.anlage_bilder) ? formData.anlage_bilder : [];
  const ownAnlageIds = new Set(
    readFileMetaForSubmission(tokenRow.formularName).anlage.map((m) => m.id)
  );
  formData.anlage_bilder = submittedAnlage
    .filter((entry) => entry && typeof entry.id === 'string' && ownAnlageIds.has(entry.id))
    .map((entry) => ({ id: entry.id, caption: typeof entry.caption === 'string' ? entry.caption : '' }));

  try {
    // Liegenschaftskarte ist admin-only — nicht aus Public-Submit übernehmen
    const result = persistSubmission({
      formularName: tokenRow.submission_id,
      formData,
      files: req.uploadedFiles,
      hausansicht: req.uploadedHausansicht,
      grundriss: req.uploadedGrundriss,
      token: tokenRow.token
    });
    const meta = readFileMetaForSubmission(tokenRow.submission_id);
    res.status(201).json({
      formularName: tokenRow.submission_id,
      message: 'Daten erfolgreich gespeichert',
      filesCount: result.filesCount,
      hausansicht: meta.hausansicht,
      grundriss: meta.grundriss
    });
  } catch (error) {
    console.error('Public submit error:', error);
    res.status(500).json({ error: 'Speichern fehlgeschlagen' });
  }
});

// Public finalize: Klient schließt seine Angaben endgültig ab. Danach sind alle
// Public-Schreib-Endpunkte gesperrt (vgl. finalized-Check oben). Der Admin kann den
// Status über PUT /api/admin/forms/:formularName/finalized jederzeit zurückdrehen.
router.post('/api/submit/:token/finalize', (req, res) => {
  try {
    const tokenRow = loadSubmissionForToken(req.params.token);
    if (!tokenRow) {
      return res.status(404).json({ error: 'Ungültiger oder abgelaufener Link' });
    }
    if (tokenRow.finalized) {
      return res.status(200).json({
        formularName: tokenRow.formularName,
        finalized: true,
        finalized_at: tokenRow.finalized_at,
        alreadyFinalized: true
      });
    }
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE submissions SET finalized = 1, finalized_at = ?, updated_at = ? WHERE formularName = ?'
    ).run(now, now, tokenRow.formularName);
    db.prepare('UPDATE submission_tokens SET last_used_at = ? WHERE token = ?').run(now, tokenRow.token);
    res.json({
      formularName: tokenRow.formularName,
      finalized: true,
      finalized_at: now
    });
  } catch (error) {
    console.error('Public finalize error:', error);
    res.status(500).json({ error: 'Finalisierung fehlgeschlagen' });
  }
});

// Public image preview via token (Liegenschaftskarte bewusst ausgeschlossen — admin-only)
router.get('/api/submit/:token/image/:type', (req, res) => {
  try {
    const { type } = req.params;
    if (type !== 'hausansicht' && type !== 'grundriss') {
      return res.status(400).json({ error: 'Invalid image type' });
    }
    const tokenRow = loadSubmissionForToken(req.params.token);
    if (!tokenRow) {
      return res.status(404).json({ error: 'Ungültiger oder abgelaufener Link' });
    }
    return sendSubmissionImage(req, res, tokenRow.formularName, type);
  } catch (error) {
    console.error('Public image error:', error);
    return res.status(500).json({ error: 'Bild konnte nicht geladen werden' });
  }
});

// Health check (public)
router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Token-basierte Anlage-Endpunkte: Klient kann eigene Bilder zur Ortsbegehung beisteuern.
router.get('/api/submit/:token/anlage', (req, res) => {
  try {
    const tokenRow = loadSubmissionForToken(req.params.token);
    if (!tokenRow) {
      return res.status(404).json({ error: 'Ungültiger oder abgelaufener Link' });
    }
    const meta = readFileMetaForSubmission(tokenRow.formularName);
    res.json({ formularName: tokenRow.formularName, anlage: meta.anlage });
  } catch (error) {
    console.error('Public anlage list error:', error);
    res.status(500).json({ error: 'Anlage-Bilder konnten nicht geladen werden' });
  }
});

router.post('/api/submit/:token/anlage', uploadAnlage, (req, res) => {
  try {
    const tokenRow = loadSubmissionForToken(req.params.token);
    if (!tokenRow) {
      return res.status(404).json({ error: 'Ungültiger oder abgelaufener Link' });
    }
    if (tokenRow.finalized) {
      return res.status(403).json({ error: 'Das Formular wurde bereits final abgeschickt und kann nicht mehr geändert werden.', finalized: true });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei im Upload (Feldname "file")' });
    }
    if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Nur Bilddateien sind erlaubt' });
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const originalName = req.file.originalname || 'bild';
    db.prepare(`
      INSERT INTO files (id, submission_id, kind, original_name, mime_type, size, data, created_at)
      VALUES (?, ?, 'anlage', ?, ?, ?, ?, ?)
    `).run(id, tokenRow.formularName, originalName, req.file.mimetype, req.file.size, req.file.buffer, now);
    res.status(201).json({
      id,
      original_name: originalName,
      mime_type: req.file.mimetype,
      size: req.file.size,
      created_at: now
    });
  } catch (error) {
    console.error('Public anlage upload error:', error);
    res.status(500).json({ error: 'Anlage-Bild konnte nicht gespeichert werden' });
  }
});

router.delete('/api/submit/:token/anlage/:id', (req, res) => {
  try {
    const tokenRow = loadSubmissionForToken(req.params.token);
    if (!tokenRow) {
      return res.status(404).json({ error: 'Ungültiger oder abgelaufener Link' });
    }
    if (tokenRow.finalized) {
      return res.status(403).json({ error: 'Das Formular wurde bereits final abgeschickt und kann nicht mehr geändert werden.', finalized: true });
    }
    const removed = deleteAnlageFileAndSyncJson(tokenRow.formularName, req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'Anlage-Bild nicht gefunden' });
    }
    res.json({ ok: true, removed: 1 });
  } catch (error) {
    console.error('Public anlage delete error:', error);
    res.status(500).json({ error: 'Anlage-Bild konnte nicht gelöscht werden' });
  }
});

router.get('/api/submit/:token/anlage/:id/preview', (req, res) => {
  try {
    const tokenRow = loadSubmissionForToken(req.params.token);
    if (!tokenRow) {
      return res.status(404).json({ error: 'Ungültiger oder abgelaufener Link' });
    }
    sendAnlagePreview(req, res, tokenRow.formularName, req.params.id);
  } catch (error) {
    console.error('Public anlage preview error:', error);
    res.status(500).json({ error: 'Anlage-Bild konnte nicht geladen werden' });
  }
});

module.exports = router;
