// ──────────────────────────────────────────────────────────────────
// VagaController (Adapter HTTP - SRP)
// Responsabilidade: tratar requisições HTTP e delegar para VagaService
// ──────────────────────────────────────────────────────────────────

class VagaController {
  /**
   * @param {import('../services/VagaService').VagaService} vagaService
   */
  constructor(vagaService) {
    this.vagaService = vagaService;
  }

  listar = async (req, res) => {
    try {
      const { andar, tipo, status } = req.query;
      const resultado = await this.vagaService.listarVagas({ andar, tipo, status });
      return res.status(200).json(resultado);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao listar vagas' });
    }
  };

  disponibilidade = async (req, res) => {
    try {
      const resultado = await this.vagaService.obterDisponibilidade();
      return res.status(200).json(resultado);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao calcular disponibilidade' });
    }
  };

  atualizarStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const resultado = await this.vagaService.atualizarStatus(id, status);
      return res.status(200).json(resultado);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao atualizar status da vaga' });
    }
  };
}

module.exports = { VagaController };
