// ──────────────────────────────────────────────────────────────────
// EstacionamentoController (Adapter HTTP - SRP)
// Responsabilidade: receber requisições HTTP e delegar para EstacionamentoService
// ──────────────────────────────────────────────────────────────────

class EstacionamentoController {
  /**
   * @param {import('../services/EstacionamentoService').EstacionamentoService} estacionamentoService
   */
  constructor(estacionamentoService) {
    this.estacionamentoService = estacionamentoService;
  }

  listarEntradas = async (req, res) => {
    try {
      const resultado = await this.estacionamentoService.listarEntradas();
      return res.status(200).json(resultado);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao listar entradas' });
    }
  };

  registrarEntrada = async (req, res) => {
    try {
      const resultado = await this.estacionamentoService.registrarEntrada(req.body);
      return res.status(201).json(resultado);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        error: err.message || 'Erro ao registrar entrada',
        status: err.detalhes?.status,
      });
    }
  };

  buscarAberta = async (req, res) => {
    try {
      const { placa } = req.query;
      const resultado = await this.estacionamentoService.buscarAberta(placa);
      return res.status(200).json(resultado);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao buscar movimentação aberta' });
    }
  };

  registrarSaida = async (req, res) => {
    try {
      const resultado = await this.estacionamentoService.registrarSaida(req.body);
      return res.status(200).json(resultado);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao registrar saída' });
    }
  };

  resumo = async (req, res) => {
    try {
      const resultado = await this.estacionamentoService.obterResumo();
      return res.status(200).json(resultado);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao obter resumo de movimentações' });
    }
  };
}

module.exports = { EstacionamentoController };
