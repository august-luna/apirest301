const assert = require('node:assert/strict');
const http = require('node:http');
const { after, before, test } = require('node:test');
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('health endpoint reports API status', async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('unknown routes return JSON 404', async () => {
  const response = await fetch(`${baseUrl}/not-found`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Ruta no encontrada.' });
});

test('product creation rejects invalid input', async () => {
  const response = await fetch(`${baseUrl}/api/productos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nombre: '', precio: -1 }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'El nombre es obligatorio y debe ser texto.',
  });
});

test('product lookup rejects an invalid id', async () => {
  const response = await fetch(`${baseUrl}/api/productos/0`);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'El id debe ser un entero positivo.',
  });
});

test('malformed JSON returns a JSON 400 response', async () => {
  const response = await fetch(`${baseUrl}/api/productos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'El JSON enviado no es válido.',
  });
});
