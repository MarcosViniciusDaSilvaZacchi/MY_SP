// ──────────────────────────────────────────────────────────────────
// MensalistaController (Adapter HTTP - SRP)
// Responsabilidade: receber requests HTTP, delegar ao MensalistaService e responder HTTP
// ──────────────────────────────────────────────────────────────────

class MensalistaController {
  /**
   * @param {import('../services/MensalistaService').MensalistaService} mensalistaService
   */
  constructor(mensalistaService) {
    this.mensalistaService = mensalistaService;
  }

  listar = async (req, res) => {
    try {
      const { placa } = req.query;
      const resultado = await this.mensalistaService.listar(placa);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao listar mensalistas' });
    }
  };

  buscarPorPlaca = async (req, res) => {
    try {
      const { placa } = req.params;
      const resultado = await this.mensalistaService.buscarPorPlaca(placa);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao buscar mensalista' });
    }
  };

  cadastrar = async (req, res) => {
    try {
      const resultado = await this.mensalistaService.cadastrar(req.body);
      return res.status(201).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao cadastrar mensalista' });
    }
  };

  atualizar = async (req, res) => {
    try {
      const { id } = req.params;
      const resultado = await this.mensalistaService.atualizar(id, req.body);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao atualizar mensalista' });
    }
  };
}

module.exports = { MensalistaController };
