const crypto = require('crypto');
const { ADMIN_AUTH_HASH } = require('./config');

const REALM = 'Basic realm="AFA Gutachten Admin", charset="UTF-8"';

function checkAdminCredentials(headerValue) {
  if (!headerValue) return false;
  const sepIdx = headerValue.indexOf(' ');
  const scheme = sepIdx >= 0 ? headerValue.slice(0, sepIdx) : headerValue;
  const encoded = sepIdx >= 0 ? headerValue.slice(sepIdx + 1) : '';
  if (scheme !== 'Basic' || !encoded) return false;
  let decoded;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch (_) {
    return false;
  }
  const providedHash = crypto.createHash('sha256').update(decoded).digest();
  if (providedHash.length !== ADMIN_AUTH_HASH.length) return false;
  return crypto.timingSafeEqual(providedHash, ADMIN_AUTH_HASH);
}

function basicAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', REALM);
    return res.status(401).json({ error: 'Authentifizierung erforderlich' });
  }
  if (!checkAdminCredentials(auth)) {
    res.set('WWW-Authenticate', REALM);
    return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
  }
  next();
}

module.exports = { basicAuth, checkAdminCredentials, REALM };
