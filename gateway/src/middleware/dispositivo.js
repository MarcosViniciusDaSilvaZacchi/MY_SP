const crypto = require('crypto');
const authMiddleware = require('./auth');

// Rotas que o ESP32 usa: POST /dispositivos/:id/sync e POST /dispositivos/:id/eventos
const ROTA_DO_DISPOSITIVO = /^\/[A-Za-z0-9_-]{1,40}\/(sync|eventos)\/?$/;

const hash = (v) => crypto.createHash('sha256').update(String(v)).digest();

/**
 * O ESP32 não faz login: ele se identifica com a chave do cabeçalho X-Device-Key.
 * A chave só vale para as rotas do próprio dispositivo; todo o resto exige JWT
 * (operador logado). Quem manda X-Device-Key em outra rota recebe 403.
 */
function dispositivoOuUsuario(req, res, next) {
  const chave = req.get('x-device-key');
  if (!chave) return authMiddleware(req, res, next);

  const esperada = process.env.DEVICE_API_KEY || 'my-parking-esp32-key';
  if (!crypto.timingSafeEqual(hash(chave), hash(esperada))) {
    return res.status(401).json({ error: 'Chave do dispositivo inválida' });
  }
  if (req.method !== 'POST' || !ROTA_DO_DISPOSITIVO.test(req.path)) {
    return res.status(403).json({ error: 'A chave do dispositivo só dá acesso às rotas de sync e eventos' });
  }
  return next();
}

module.exports = dispositivoOuUsuario;
