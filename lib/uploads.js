const multer = require('multer');
const { MAX_FILE_SIZE } = require('../config');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unzulässiger Dateityp: ${file.mimetype}. Erlaubt: ${ALLOWED_TYPES.join(', ')}`));
  }
}

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10
  }
});

function multerErrorMessage(err) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return 'Datei zu groß. Maximale Größe ist 10 MB.';
    if (err.code === 'LIMIT_FILE_COUNT') return 'Zu viele Dateien. Maximal 10.';
    if (err.code === 'LIMIT_UNEXPECTED_FILE') return 'Unerwartetes Feld im Upload';
  }
  return err && err.message ? err.message : 'Upload-Fehler';
}

const upload = (req, res, next) => {
  uploadMiddleware.fields([
    { name: 'files', maxCount: 10 },
    { name: 'file', maxCount: 10 },
    { name: 'hausansicht', maxCount: 1 },
    { name: 'grundriss', maxCount: 1 },
    { name: 'liegenschaftskarte', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ error: multerErrorMessage(err) });
    const files = [];
    if (req.files && req.files.files) files.push(...req.files.files);
    if (req.files && req.files.file) files.push(...req.files.file);
    req.uploadedFiles = files;
    req.uploadedHausansicht = (req.files && req.files.hausansicht && req.files.hausansicht[0]) || null;
    req.uploadedGrundriss = (req.files && req.files.grundriss && req.files.grundriss[0]) || null;
    req.uploadedLiegenschaftskarte = (req.files && req.files.liegenschaftskarte && req.files.liegenschaftskarte[0]) || null;
    next();
  });
};

// Eigener Single-File-Upload für Anlage-Bilder (separater Endpunkt, kein "fields"-Body).
const uploadAnlage = (req, res, next) => {
  uploadMiddleware.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Datei muss im Feld "file" hochgeladen werden.' });
      }
      return res.status(400).json({ error: multerErrorMessage(err) });
    }
    next();
  });
};

module.exports = { upload, uploadAnlage };
