// ──────────────────────────────────────────────────────────────────
// DispositivoController (Adapter HTTP - SRP)
// Traduz requisições HTTP para o DispositivoService
// ──────────────────────────────────────────────────────────────────

const responder = (fn, statusSucesso = 200) => async (req, res) => {
  try {
    return res.status(statusSucesso).json(await fn(req));
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Erro no serviço de dispositivos' });
  }
};

class DispositivoController {
  /** @param {import('../services/DispositivoService').DispositivoService} service */
  constructor(service) {
    this.service = service;
  }

  // ── Usadas pelo ESP32 (exigem X-Device-Key) ──
  sincronizar = responder((req) => this.service.sincronizar(req.params.id, req.body || {}));
  registrarEvento = responder((req) => this.service.registrarEvento(req.params.id, req.body || {}), 201);

  // ── Usadas pelo sistema / tela Automação ──
  listarDispositivos = responder(() => this.service.listarDispositivos());
  buscarDispositivo = responder((req) => this.service.buscarDispositivo(req.params.id));
  listarEventos = responder((req) => this.service.listarEventos(req.query));
  listarComandos = responder((req) => this.service.listarComandos(req.query));
  enviarComando = responder((req) => this.service.enviarComando(req.body || {}), 202);
}

module.exports = { DispositivoController };
