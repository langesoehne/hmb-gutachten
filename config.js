const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';
const DB_PATH = process.env.DB_PATH || './data/form_storage.db';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
// Default false = same-origin only (kein Access-Control-Allow-Origin-Header).
// Server und Klient-Links laufen unter derselben Origin; cross-origin nur via
// expliziter Konfiguration, um CSRF auf den token-basierten /api/submit/*-Pfaden
// zu vermeiden.
const CORS_ORIGIN = process.env.CORS_ORIGIN || false;
const TEMPLATE_PATH = process.env.DOCX_TEMPLATE_PATH || path.join(__dirname, 'templates', 'gutachten_template.docx');
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';

if (!ADMIN_PASSWORD) {
  console.error('FEHLER: ADMIN_PASSWORD ist nicht gesetzt.');
  console.error('Bitte ADMIN_PASSWORD in .env oder als Umgebungsvariable setzen, bevor der Server startet.');
  console.error('Beispiel:  echo "ADMIN_PASSWORD=$(openssl rand -base64 24)" >> .env');
  process.exit(1);
}

const ADMIN_AUTH_HASH = crypto
  .createHash('sha256')
  .update(`${ADMIN_USER}:${ADMIN_PASSWORD}`)
  .digest();

module.exports = {
  PORT,
  HOST,
  DB_PATH,
  MAX_FILE_SIZE,
  CORS_ORIGIN,
  TEMPLATE_PATH,
  ADMIN_AUTH_HASH,
  PUBLIC_BASE_URL
};
