const path = require('path');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, withTransaction } = require('../db');
const { basicAuth } = require('../auth');
const { upload, uploadAnlage } = require('../lib/uploads');
const RequiredFields = require('../required-fields');
const { buildDocxContext } = require('../lib/docx/context');
const { renderGutachtenDocx } = require('../lib/docx/render');
const { str, formatDateDe } = require('../lib/transformers');
const {
  isValidFormName,
  generateSubmissionToken,
  buildPublicUrl,
  sendSubmissionImage,
  sendAnlagePreview,
  deleteAnlageFileAndSyncJson,
  readFileMetaForSubmission,
  persistSubmission,
  ensureSubmissionExists,
  serveFormularHtml
} = require('../lib/submissions');

const router = express.Router();

// Admin index page
router.get('/', basicAuth, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Admin form view (loads form HTML in admin mode)
router.get('/formular.html', basicAuth, (req, res) => {
  serveFormularHtml(res, 'admin', {});
});

// Shared module for the browser (Übersicht und Formular nutzen die gleiche Quelle)
router.get('/required-fields.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'required-fields.js'));
});

// Gemeinsame Frontend-Helper (escapeHtml, showToast, confirmAction).
router.get('/frontend-utils.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'frontend-utils.js'));
});

// Aus formular.html ausgelagerter Stylesheet + Hauptscript — werden auch im Public-Mode (ohne Auth) geladen.
router.get('/formular.css', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'formular.css'));
});

router.get('/formular.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'formular.js'));
});

// List all submissions
router.get('/api/admin/list', basicAuth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT s.formularName, s.data, s.created_at, s.updated_at,
             s.finalized, s.finalized_at,
             t.token, t.last_used_at AS token_last_used_at, t.revoked_at AS token_revoked_at
      FROM submissions s
      LEFT JOIN submission_tokens t ON t.submission_id = s.formularName
      ORDER BY s.created_at DESC
    `).all();

    const submissions = rows.map((s) => {
      let progress = null;
      let progressExpert = null;
      try {
        const data = s.data ? JSON.parse(s.data) : {};
        const meta = readFileMetaForSubmission(s.formularName);
        const images = {
          hausansicht: meta.hausansicht,
          grundriss: meta.grundriss
        };
        progress = RequiredFields.computeProgress(data, images);
        progressExpert = RequiredFields.computeExpertProgress(data, images);
      } catch (e) {
        console.error('Progress calc failed for', s.formularName, e);
      }

      return {
        id: s.formularName,
        formularName: s.formularName,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        token: s.token && !s.token_revoked_at ? s.token : null,
        publicUrl: s.token && !s.token_revoked_at ? buildPublicUrl(req, s.token) : null,
        tokenLastUsedAt: s.token_last_used_at || null,
        finalized: !!s.finalized,
        finalizedAt: s.finalized_at || null,
        progress: progress,
        progressExpert: progressExpert
      };
    });

    res.json({ count: submissions.length, submissions });
  } catch (error) {
    console.error('Error listing submissions:', error);
    res.status(500).json({ error: 'Failed to list submissions' });
  }
});

// Create a new submission slot with a public token
router.post('/api/admin/forms', basicAuth, (req, res) => {
  try {
    const formularName = (req.body && req.body.formularName) || '';
    if (!isValidFormName(formularName)) {
      return res.status(400).json({ error: 'Formularname ist ungültig (1-200 Zeichen, keine Slashes)' });
    }
    const trimmed = formularName.trim();
    const existing = db.prepare('SELECT formularName FROM submissions WHERE formularName = ?').get(trimmed);
    if (existing) {
      return res.status(409).json({ error: 'Formularname existiert bereits' });
    }

    const now = new Date().toISOString();
    const token = generateSubmissionToken();

    withTransaction(() => {
      db.prepare(`
        INSERT INTO submissions (formularName, data, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(trimmed, JSON.stringify({ formularName: trimmed }), now, now);

      db.prepare(`
        INSERT INTO submission_tokens (token, submission_id, created_at)
        VALUES (?, ?, ?)
      `).run(token, trimmed, now);
    });

    res.status(201).json({
      formularName: trimmed,
      token,
      publicUrl: buildPublicUrl(req, token),
      createdAt: now
    });
  } catch (error) {
    console.error('Error creating form slot:', error);
    res.status(500).json({ error: 'Formular konnte nicht erstellt werden' });
  }
});

// Issue or regenerate the public token for an existing submission
router.post('/api/admin/forms/:formularName/token', basicAuth, (req, res) => {
  try {
    const { formularName } = req.params;
    if (!ensureSubmissionExists(formularName, res)) return;
    const now = new Date().toISOString();
    const token = generateSubmissionToken();

    withTransaction(() => {
      db.prepare('DELETE FROM submission_tokens WHERE submission_id = ?').run(formularName);
      db.prepare(`
        INSERT INTO submission_tokens (token, submission_id, created_at)
        VALUES (?, ?, ?)
      `).run(token, formularName, now);
    });

    res.json({
      formularName,
      token,
      publicUrl: buildPublicUrl(req, token),
      createdAt: now
    });
  } catch (error) {
    console.error('Error regenerating token:', error);
    res.status(500).json({ error: 'Token konnte nicht erstellt werden' });
  }
});

// Revoke (delete) the public token for a submission
router.delete('/api/admin/forms/:formularName/token', basicAuth, (req, res) => {
  try {
    const { formularName } = req.params;
    const result = db.prepare('DELETE FROM submission_tokens WHERE submission_id = ?').run(formularName);
    res.json({ ok: true, removed: result.changes });
  } catch (error) {
    console.error('Error revoking token:', error);
    res.status(500).json({ error: 'Token konnte nicht widerrufen werden' });
  }
});

// Admin: finalized-Flag für eine Submission setzen oder zurücksetzen.
router.put('/api/admin/forms/:formularName/finalized', basicAuth, (req, res) => {
  try {
    const { formularName } = req.params;
    if (!ensureSubmissionExists(formularName, res)) return;
    const finalized = !!(req.body && req.body.finalized);
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE submissions SET finalized = ?, finalized_at = ? WHERE formularName = ?'
    ).run(finalized ? 1 : 0, finalized ? now : null, formularName);
    res.json({ formularName, finalized, finalized_at: finalized ? now : null });
  } catch (error) {
    console.error('Error toggling finalized:', error);
    res.status(500).json({ error: 'Finalisierungs-Status konnte nicht gesetzt werden' });
  }
});

// Admin save
router.post('/api/admin/save', basicAuth, upload, (req, res) => {
  try {
    const submissionId = (req.body && req.body.id) || '';
    if (!isValidFormName(submissionId)) {
      return res.status(400).json({ error: 'Formularname ist ungültig' });
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
    const trimmedId = submissionId.trim();
    formData.formularName = trimmedId;

    const result = persistSubmission({
      formularName: trimmedId,
      formData,
      files: req.uploadedFiles,
      hausansicht: req.uploadedHausansicht,
      grundriss: req.uploadedGrundriss,
      liegenschaftskarte: req.uploadedLiegenschaftskarte
    });
    const meta = readFileMetaForSubmission(trimmedId);
    res.status(201).json({
      formularName: trimmedId,
      message: `Formular "${trimmedId}" erfolgreich gespeichert`,
      filesCount: result.filesCount,
      hausansicht: meta.hausansicht,
      grundriss: meta.grundriss,
      liegenschaftskarte: meta.liegenschaftskarte,
      anlage: meta.anlage
    });
  } catch (error) {
    console.error('Admin save error:', error);
    res.status(500).json({ error: 'Speichern fehlgeschlagen' });
  }
});

// Admin load
router.get('/api/admin/load/:formularName', basicAuth, (req, res) => {
  try {
    const { formularName } = req.params;
    const submission = db.prepare('SELECT * FROM submissions WHERE formularName = ?').get(formularName);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    let parsedData;
    try {
      parsedData = JSON.parse(submission.data);
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      return res.status(500).json({ error: 'Invalid data format in database' });
    }
    const meta = readFileMetaForSubmission(formularName);
    res.json({
      formularName: submission.formularName,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
      data: parsedData,
      files: meta.files,
      hausansicht: meta.hausansicht,
      grundriss: meta.grundriss,
      liegenschaftskarte: meta.liegenschaftskarte,
      anlage: meta.anlage,
      finalized: !!submission.finalized,
      finalized_at: submission.finalized_at || null
    });
  } catch (error) {
    console.error('Error loading submission:', error);
    res.status(500).json({ error: 'Failed to load submission data' });
  }
});

// Admin image preview
router.get('/api/admin/image/:formularName/:type', basicAuth, (req, res) => {
  try {
    const { formularName, type } = req.params;
    if (type !== 'hausansicht' && type !== 'grundriss' && type !== 'liegenschaftskarte') {
      return res.status(400).json({ error: 'Invalid image type' });
    }
    return sendSubmissionImage(req, res, formularName, type);
  } catch (error) {
    console.error('Admin image error:', error);
    return res.status(500).json({ error: 'Bild konnte nicht geladen werden' });
  }
});

// Admin file download
router.get('/api/admin/files/:formularName/:filename', basicAuth, (req, res) => {
  try {
    const { formularName, filename } = req.params;
    const fileRecord = db.prepare(`
      SELECT * FROM files WHERE submission_id = ? AND original_name = ?
    `).get(formularName, filename);
    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.set('Content-Type', fileRecord.mime_type);
    res.set('Content-Disposition', `attachment; filename="${fileRecord.original_name}"`);
    res.send(Buffer.isBuffer(fileRecord.data) ? fileRecord.data : Buffer.from(fileRecord.data));
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Admin status check
router.get('/api/admin/status/:formularName', basicAuth, (req, res) => {
  try {
    const { formularName } = req.params;
    const submission = db.prepare('SELECT formularName, created_at, updated_at FROM submissions WHERE formularName = ?').get(formularName);
    if (!submission) {
      return res.status(404).json({ exists: false, message: 'Submission not found' });
    }
    res.json({
      exists: true,
      formularName: submission.formularName,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Failed to check submission status' });
  }
});

// Load an image BLOB for inclusion in DOCX (returns null wenn nicht vorhanden / Fehler).
function loadImageBufferForDocx(formularName, kind) {
  try {
    const row = db.prepare(
      "SELECT data FROM files WHERE submission_id = ? AND kind = ? LIMIT 1"
    ).get(formularName, kind);
    if (row && row.data) {
      return Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
    }
  } catch (err) {
    console.warn('Could not load image override', kind, 'for', formularName, err.message);
  }
  return null;
}

// Liest die Anlage-Bild-Buffer in der vom Frontend bestimmten Reihenfolge (formData.anlage_bilder).
// Einträge ohne Backing-File und Files ohne Eintrag werden übersprungen.
function loadAnlageListForDocx(formularName, formData) {
  const anlageOrder = Array.isArray(formData.anlage_bilder) ? formData.anlage_bilder : [];
  const anlageRowsById = new Map();
  try {
    const rows = db.prepare(`
      SELECT id, original_name, mime_type, data
      FROM files
      WHERE submission_id = ? AND kind = 'anlage'
    `).all(formularName);
    for (const row of rows) anlageRowsById.set(row.id, row);
  } catch (err) {
    console.warn('Could not load anlage images for', formularName, err.message);
  }
  return anlageOrder
    .map((entry) => {
      if (!entry || typeof entry.id !== 'string') return null;
      const row = anlageRowsById.get(entry.id);
      if (!row) return null;
      const buffer = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
      return { buffer, caption: entry.caption || '' };
    })
    .filter(Boolean);
}

// Admin DOCX export
router.get('/api/admin/export-docx/:formularName', basicAuth, (req, res) => {
  try {
    const { formularName } = req.params;
    const submission = db.prepare('SELECT * FROM submissions WHERE formularName = ?').get(formularName);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    let formData;
    try {
      formData = JSON.parse(submission.data);
    } catch (_) {
      return res.status(500).json({ error: 'Invalid data format in database' });
    }
    const context = buildDocxContext(formData);

    const hausansichtBuffer = loadImageBufferForDocx(formularName, 'hausansicht');
    const grundrissBuffer = loadImageBufferForDocx(formularName, 'grundriss');
    const liegenschaftskarteBuffer = loadImageBufferForDocx(formularName, 'liegenschaftskarte');
    const anlageList = loadAnlageListForDocx(formularName, formData);

    // Datum nur einsetzen, wenn der Klient/Admin es tatsächlich gefüllt hat
    // (sonst stünde der PLACEHOLDER "___" als Fake-Datum unter der Anlage 1).
    const anlageDateRaw = str(formData.ortsbesichtigungsdatum);
    const anlageDateText = anlageDateRaw ? formatDateDe(anlageDateRaw) : '';
    const docxBuffer = renderGutachtenDocx(
      context,
      hausansichtBuffer,
      grundrissBuffer,
      liegenschaftskarteBuffer,
      anlageList,
      anlageDateText
    );

    const safeName = String(formularName).replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${safeName}_ausgefuelltes_gutachten.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(docxBuffer);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return res.status(500).json({ error: 'Failed to generate DOCX document' });
  }
});

// Admin: Anlage-Bilder (zusätzliche Bilder der Ortsbegehung).
// Public/Klient-Sicht hat diese Endpunkte bewusst NICHT — Anlage-Bilder sind
// Sachverständigen-Inhalte (siehe formular.html: Sektion ist .admin-only).
router.get('/api/admin/anlage/:formularName', basicAuth, (req, res) => {
  try {
    const { formularName } = req.params;
    if (!ensureSubmissionExists(formularName, res)) return;
    const meta = readFileMetaForSubmission(formularName);
    res.json({ formularName, anlage: meta.anlage });
  } catch (error) {
    console.error('Anlage list error:', error);
    res.status(500).json({ error: 'Anlage-Bilder konnten nicht geladen werden' });
  }
});

router.post('/api/admin/anlage/:formularName', basicAuth, uploadAnlage, (req, res) => {
  try {
    const { formularName } = req.params;
    if (!ensureSubmissionExists(formularName, res)) return;
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
    `).run(id, formularName, originalName, req.file.mimetype, req.file.size, req.file.buffer, now);
    res.status(201).json({
      id,
      original_name: originalName,
      mime_type: req.file.mimetype,
      size: req.file.size,
      created_at: now
    });
  } catch (error) {
    console.error('Anlage upload error:', error);
    res.status(500).json({ error: 'Anlage-Bild konnte nicht gespeichert werden' });
  }
});

router.delete('/api/admin/anlage/:formularName/:id', basicAuth, (req, res) => {
  try {
    const { formularName, id } = req.params;
    const removed = deleteAnlageFileAndSyncJson(formularName, id);
    if (!removed) {
      return res.status(404).json({ error: 'Anlage-Bild nicht gefunden' });
    }
    res.json({ ok: true, removed: 1 });
  } catch (error) {
    console.error('Anlage delete error:', error);
    res.status(500).json({ error: 'Anlage-Bild konnte nicht gelöscht werden' });
  }
});

router.get('/api/admin/anlage/:formularName/:id/preview', basicAuth, (req, res) => {
  try {
    const { formularName, id } = req.params;
    sendAnlagePreview(req, res, formularName, id);
  } catch (error) {
    console.error('Anlage preview error:', error);
    res.status(500).json({ error: 'Anlage-Bild konnte nicht geladen werden' });
  }
});

// Admin delete. FK ON DELETE CASCADE in files + submission_tokens räumt mit auf.
router.delete('/api/admin/delete/:formularName', basicAuth, (req, res) => {
  try {
    const { formularName } = req.params;
    const result = db.prepare('DELETE FROM submissions WHERE formularName = ?').run(formularName);
    if (!result.changes) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

module.exports = router;
