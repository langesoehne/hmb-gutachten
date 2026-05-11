// Integration-Smoke-Tests für die Public- und Admin-Endpoints.
// Startet die App auf einem zufälligen Port und macht echte HTTP-Requests dagegen.

process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-pw-12345';
process.env.ADMIN_USER = process.env.ADMIN_USER || 'admin';
// Isolierte Test-DB, damit Produktionsdaten unangetastet bleiben.
process.env.DB_PATH = process.env.DB_PATH || './data/test_smoke.db';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const app = require('../server');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  // Test-DB samt WAL/SHM aufräumen.
  for (const ext of ['', '-shm', '-wal']) {
    const file = process.env.DB_PATH + ext;
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

const adminAuthHeader = 'Basic ' + Buffer.from('admin:test-pw-12345').toString('base64');

test('GET /api/health antwortet 200', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.ok(body.timestamp);
});

test('GET /api/admin/list ohne Auth → 401', async () => {
  const res = await fetch(`${baseUrl}/api/admin/list`);
  assert.equal(res.status, 401);
});

test('GET /api/admin/list mit Auth → 200', async () => {
  const res = await fetch(`${baseUrl}/api/admin/list`, { headers: { Authorization: adminAuthHeader } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.submissions));
});

test('Nicht-existenter Endpoint → 404', async () => {
  const res = await fetch(`${baseUrl}/api/does-not-exist`);
  assert.equal(res.status, 404);
});

test('GET /submit/<ungueltigerToken> → 404 mit Fehler-HTML', async () => {
  const res = await fetch(`${baseUrl}/submit/INVALID_TOKEN_XYZ`);
  assert.equal(res.status, 404);
  const body = await res.text();
  assert.match(body, /Link ist ungültig oder abgelaufen/);
});

test('GET /api/submit/<ungueltigerToken> → 404 JSON', async () => {
  const res = await fetch(`${baseUrl}/api/submit/INVALID_TOKEN_XYZ`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.match(body.error, /Ungültiger oder abgelaufener Link/);
});

test('Token-Workflow: create → load → submit → finalize → cleanup', async () => {
  const formName = 'test-flow-' + Date.now();

  // 1. Submission anlegen + Token erzeugen
  let res = await fetch(`${baseUrl}/api/admin/forms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: adminAuthHeader },
    body: JSON.stringify({ formularName: formName })
  });
  assert.equal(res.status, 201);
  const { token } = await res.json();
  assert.ok(token);

  // 2. Public-Load via Token
  res = await fetch(`${baseUrl}/api/submit/${token}`);
  assert.equal(res.status, 200);
  let body = await res.json();
  assert.equal(body.formularName, formName);
  assert.equal(body.finalized, false);

  // 3. Public-Submit via Token (Form-Data)
  const form = new FormData();
  form.append('fields', JSON.stringify({ baujahr: '1985', name: 'Test' }));
  res = await fetch(`${baseUrl}/api/submit/${token}`, { method: 'POST', body: form });
  assert.equal(res.status, 201);

  // 4. Finalize
  res = await fetch(`${baseUrl}/api/submit/${token}/finalize`, { method: 'POST' });
  assert.equal(res.status, 200);
  body = await res.json();
  assert.equal(body.finalized, true);

  // 5. Nach Finalize sind weitere Submits gesperrt
  const form2 = new FormData();
  form2.append('fields', JSON.stringify({ baujahr: '1990' }));
  res = await fetch(`${baseUrl}/api/submit/${token}`, { method: 'POST', body: form2 });
  assert.equal(res.status, 403);

  // 6. Cleanup
  res = await fetch(`${baseUrl}/api/admin/delete/${formName}`, {
    method: 'DELETE',
    headers: { Authorization: adminAuthHeader }
  });
  assert.equal(res.status, 200);
});
