// Middleware do gateway para as rotas /api/dispositivos:
// ESP32 com X-Device-Key só nas rotas de sync/eventos; o resto exige JWT
const jwt = require('jsonwebtoken');
const dispositivoOuUsuario = require('../gateway/src/middleware/dispositivo');

function chamar({ method = 'POST', path = '/esp32-cancela-01/sync', headers = {} }) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const req = { method, path, headers: lower, get: (n) => lower[n.toLowerCase()] };
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  let passou = false;
  dispositivoOuUsuario(req, res, () => { passou = true; });
  return { passou, status: res.statusCode };
}

const CHAVE = 'my-parking-esp32-key';

test('ESP32 com a chave certa acessa sync e eventos', () => {
  expect(chamar({ headers: { 'X-Device-Key': CHAVE } }).passou).toBe(true);
  expect(chamar({ path: '/esp32-cancela-01/eventos', headers: { 'X-Device-Key': CHAVE } }).passou).toBe(true);
});

test('chave errada → 401', () => {
  expect(chamar({ headers: { 'X-Device-Key': 'errada' } })).toEqual({ passou: false, status: 401 });
});

test('a chave do dispositivo não abre as rotas das telas (ex.: mandar comando) → 403', () => {
  expect(chamar({ path: '/comandos', headers: { 'X-Device-Key': CHAVE } })).toEqual({ passou: false, status: 403 });
  expect(chamar({ method: 'GET', path: '/', headers: { 'X-Device-Key': CHAVE } })).toEqual({ passou: false, status: 403 });
});

test('sem chave, exige JWT: sem token → 401; com token válido → passa', () => {
  expect(chamar({ path: '/comandos' })).toEqual({ passou: false, status: 401 });
  const token = jwt.sign({ id: 1, perfil: 'OPERADOR' }, process.env.JWT_SECRET || 'my-parking-secret');
  expect(chamar({ path: '/comandos', headers: { Authorization: `Bearer ${token}` } }).passou).toBe(true);
});
