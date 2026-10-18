// ──────────────────────────────────────────────────────────────────
// PagamentoController (Adapter HTTP - SRP)
// Responsabilidade: receber requests HTTP, delegar ao PagamentoService e responder status HTTP
// ──────────────────────────────────────────────────────────────────

class PagamentoController {
  /**
   * @param {import('../services/PagamentoService').PagamentoService} pagamentoService
   */
  constructor(pagamentoService) {
    this.pagamentoService = pagamentoService;
  }

  calcular = async (req, res) => {
    try {
      const resultado = await this.pagamentoService.calcularTarifa(req.body);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao calcular tarifa' });
    }
  };

  registrar = async (req, res) => {
    try {
      const resultado = await this.pagamentoService.registrarPagamento(req.body);
      return res.status(201).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao registrar pagamento' });
    }
  };

  confirmar = async (req, res) => {
    try {
      const { id } = req.params;
      const resultado = await this.pagamentoService.confirmarPagamento(id);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao confirmar pagamento' });
    }
  };

  buscarPorId = async (req, res) => {
    try {
      const { id } = req.params;
      const resultado = await this.pagamentoService.buscarPorId(id);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao consultar pagamento' });
    }
  };

  buscarPorMovimentacao = async (req, res) => {
    try {
      const { movimentacaoId } = req.params;
      const resultado = await this.pagamentoService.buscarPorMovimentacaoId(movimentacaoId);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao consultar pagamento da movimentação' });
    }
  };

  listar = async (_req, res) => {
    try {
      const pagamentos = await this.pagamentoService.listarPagamentos();
      return res.status(200).json(pagamentos);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao listar pagamentos' });
    }
  };
}

module.exports = { PagamentoController };
