// Unit-Tests für die Admin-Auth-Helfer.
// Setzt ADMIN_PASSWORD vor dem Laden des Moduls — config.js liest dotenv beim ersten require.

process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-pw-12345';
process.env.ADMIN_USER = process.env.ADMIN_USER || 'admin';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { checkAdminCredentials } = require('../auth');

test('checkAdminCredentials akzeptiert korrekte Anmeldedaten', () => {
  const encoded = Buffer.from('admin:test-pw-12345').toString('base64');
  assert.equal(checkAdminCredentials(`Basic ${encoded}`), true);
});

test('checkAdminCredentials lehnt falsches Passwort ab', () => {
  const encoded = Buffer.from('admin:falsch').toString('base64');
  assert.equal(checkAdminCredentials(`Basic ${encoded}`), false);
});

test('checkAdminCredentials lehnt falschen Benutzer ab', () => {
  const encoded = Buffer.from('hacker:test-pw-12345').toString('base64');
  assert.equal(checkAdminCredentials(`Basic ${encoded}`), false);
});

test('checkAdminCredentials lehnt leeren Header ab', () => {
  assert.equal(checkAdminCredentials(''), false);
  assert.equal(checkAdminCredentials(undefined), false);
});

test('checkAdminCredentials lehnt Header ohne "Basic"-Schema ab', () => {
  const encoded = Buffer.from('admin:test-pw-12345').toString('base64');
  assert.equal(checkAdminCredentials(`Bearer ${encoded}`), false);
  assert.equal(checkAdminCredentials(`Digest ${encoded}`), false);
});

test('checkAdminCredentials lehnt invaliden Base64-Inhalt graceful ab', () => {
  assert.equal(checkAdminCredentials('Basic !!!invalid base64!!!'), false);
});
