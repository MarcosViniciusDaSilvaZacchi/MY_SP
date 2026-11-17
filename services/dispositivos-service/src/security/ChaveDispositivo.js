// ──────────────────────────────────────────────────────────────────
// Autenticação de dispositivos (SRP)
// O ESP32 não faz login com usuário e senha: ele envia uma chave
// compartilhada no cabeçalho X-Device-Key. A comparação é feita em
// tempo constante para não vazar a chave por diferença de tempo.
// ──────────────────────────────────────────────────────────────────

const crypto = require('crypto');

const CHAVE_PADRAO = 'my-parking-esp32-key';

class ValidadorChaveDispositivo {
  constructor(chaveEsperada = process.env.DEVICE_API_KEY || CHAVE_PADRAO) {
    this.hashEsperado = crypto.createHash('sha256').update(String(chaveEsperada)).digest();
  }

  validar(chaveRecebida) {
    if (!chaveRecebida) return false;
    const hash = crypto.createHash('sha256').update(String(chaveRecebida)).digest();
    return crypto.timingSafeEqual(hash, this.hashEsperado);
  }

  /** Middleware Express para as rotas usadas pelo ESP32 */
  middleware() {
    return (req, res, next) => {
      if (this.validar(req.get('x-device-key'))) return next();
      return res.status(401).json({ error: 'Chave do dispositivo ausente ou inválida (cabeçalho X-Device-Key)' });
    };
  }
}

module.exports = { ValidadorChaveDispositivo, CHAVE_PADRAO };
