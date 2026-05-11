const express = require('express');
const { REALM, checkAdminCredentials } = require('../auth');
const { loadSubmissionForToken } = require('../lib/submissions');

const router = express.Router();

const NOMINATIM_USER_AGENT = 'afa-gutachten-tool/1.0 (intern, kontakt: a.langeu.soehne@gmail.com)';

// Auth: Submission-Token (per Query/Header) ODER Admin-Basic-Auth.
// Genutzt für Tools, die sowohl der Klient (mit Token) als auch der Admin nutzen darf.
function checkToolAuth(req, res) {
  const token = (req.query && req.query.token) || (req.headers['x-submission-token'] || '');
  if (token) {
    const row = loadSubmissionForToken(token);
    if (row) return true;
  }
  if (checkAdminCredentials(req.headers.authorization || '')) {
    return true;
  }
  res.set('WWW-Authenticate', REALM);
  res.status(401).json({ error: 'Authentifizierung erforderlich' });
  return false;
}

// Geocoding via OpenStreetMap Nominatim
router.get('/api/tools/geocode', async (req, res) => {
  if (!checkToolAuth(req, res)) return;
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'Parameter "q" (Adresse) fehlt' });
  if (q.length > 250) return res.status(400).json({ error: 'Adresse zu lang' });
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '5');
    url.searchParams.set('countrycodes', 'de');
    url.searchParams.set('accept-language', 'de');
    const upstream = await fetch(url.toString(), {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT, 'Accept': 'application/json' }
    });
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Geocoding-Dienst nicht erreichbar', status: upstream.status });
    }
    const data = await upstream.json();
    const results = (Array.isArray(data) ? data : []).slice(0, 5).map((r) => ({
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      display_name: r.display_name,
      address: r.address || {},
      type: r.type,
      class: r.class,
      importance: r.importance
    }));
    res.json({ query: q, results });
  } catch (err) {
    console.error('Geocode error:', err);
    res.status(500).json({ error: 'Geocoding fehlgeschlagen' });
  }
});

module.exports = router;
