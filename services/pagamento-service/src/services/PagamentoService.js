// ──────────────────────────────────────────────────────────────────
// PagamentoService (Application Service / Use Case - SRP & DIP)
// Responsabilidade: orquestrar o cálculo, processamento, confirmação e persistência de pagamentos
// ──────────────────────────────────────────────────────────────────

const { Pagamento } = require('../domain/entities/PagamentoEntities');
const { PagamentoProcessorFactory } = require('../domain/strategies/PaymentProcessors');

class PagamentoService {
  /**
   * @param {import('../repositories/PagamentoRepository').IPagamentoRepository} pagamentoRepository
   * @param {import('../domain/strategies/TarifaStrategy').TarifaEngine} tarifaEngine
   */
  constructor(pagamentoRepository, tarifaEngine) {
    this.pagamentoRepository = pagamentoRepository;
    this.tarifaEngine = tarifaEngine;
  }

  async calcularTarifa({ movimentacaoId, permanenciaMinutos, minutos }) {
    const min = permanenciaMinutos !== undefined ? permanenciaMinutos : minutos;
    if (min === undefined || min === null) {
      const err = new Error('permanenciaMinutos obrigatorio');
      err.statusCode = 400;
      throw err;
    }

    const minutosNum = Number(min);
    const { valorCalculado, dentroCarencia, tabelaAplicada } = this.tarifaEngine.calcular(minutosNum);

    return {
      movimentacaoId,
      permanenciaMinutos: minutosNum,
      minutos: minutosNum,
      dentroCarencia,
      valorCalculado,
      valor: valorCalculado,
      tabelaAplicada,
    };
  }

  async registrarPagamento({
    movimentacaoId,
    forma,
    valorPago,
    valor,
    permanenciaMinutos,
    minutos,
    cartao,
    iniciarPix,
  }) {
    if (!movimentacaoId || !forma) {
      const err = new Error('movimentacaoId e forma sao obrigatorios');
      err.statusCode = 400;
      throw err;
    }

    // Verifica se já existe pagamento CONFIRMADO para esta movimentação (Idempotência)
    const existente = await this.pagamentoRepository.buscarPorMovimentacaoId(movimentacaoId);
    if (existente && existente.status === 'CONFIRMADO') {
      return existente.toJSON();
    }

    const min = permanenciaMinutos !== undefined ? permanenciaMinutos : (minutos || 0);
    const { valorCalculado: valorMotor } = this.tarifaEngine.calcular(Number(min));
    const valorDevido = valorMotor > 0 ? valorMotor : (valor !== undefined ? Number(valor) : 0);
    const vPago = valorPago !== undefined ? Number(valorPago) : (valor !== undefined ? Number(valor) : valorDevido);

    // Usa Strategy para processar a forma de pagamento selecionada
    const processor = PagamentoProcessorFactory.obterProcessador(forma);
    const resultadoProc = await processor.processar(valorDevido, vPago, {
      movimentacaoId,
      cartao,
      iniciarPix: Boolean(iniciarPix),
    });

    const pagamento = new Pagamento({
      id: String(Date.now()),
      movimentacaoId,
      forma: String(forma).toUpperCase().trim(),
      valorCalculado: valorDevido,
      valorPago: vPago,
      troco: resultadoProc.troco,
      status: resultadoProc.status,
      detalhes: resultadoProc.detalhes || {},
      dataHora: new Date().toISOString(),
    });

    pagamento.validar();
    await this.pagamentoRepository.salvar(pagamento);

    return pagamento.toJSON();
  }

  async confirmarPagamento(id) {
    const pagamento = await this.pagamentoRepository.buscarPorId(id);
    if (!pagamento) {
      const err = new Error('Pagamento não encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (pagamento.status === 'CONFIRMADO') {
      return pagamento.toJSON();
    }

    pagamento.confirmar({
      endToEndId: `E18236120${Date.now()}PIX`,
      confirmadoVia: 'WEBHOOK_SPI_BACEN',
    });

    await this.pagamentoRepository.atualizar(pagamento);
    return pagamento.toJSON();
  }

  async buscarPorId(id) {
    const pagamento = await this.pagamentoRepository.buscarPorId(id);
    if (!pagamento) {
      const err = new Error('Pagamento não encontrado');
      err.statusCode = 404;
      throw err;
    }
    return pagamento.toJSON();
  }

  async buscarPorMovimentacaoId(movimentacaoId) {
    const pagamento = await this.pagamentoRepository.buscarPorMovimentacaoId(movimentacaoId);
    if (!pagamento) {
      const err = new Error('Nenhum pagamento encontrado para esta movimentação');
      err.statusCode = 404;
      throw err;
    }
    return pagamento.toJSON();
  }

  async listarPagamentos() {
    const lista = await this.pagamentoRepository.listar();
    return lista.map((p) => (typeof p.toJSON === 'function' ? p.toJSON() : p));
  }
}

module.exports = { PagamentoService };
