// ──────────────────────────────────────────────────────────────────
// PagamentoService (Application Service / Use Case - SRP & DIP)
// Responsabilidade: orquestrar o cálculo, processamento, confirmação e persistência de pagamentos
//
// Regra de segurança: o valor devido é SEMPRE calculado aqui, a partir da
// movimentação guardada no estacionamento-service (horário de entrada e tipo
// de veículo). Valor e permanência enviados pelo cliente são ignorados.
// ──────────────────────────────────────────────────────────────────

const { Pagamento } = require('../domain/entities/PagamentoEntities');
const { FormaPagamento } = require('../domain/enums/PagamentoEnums');
const { PagamentoProcessorFactory } = require('../domain/strategies/PaymentProcessors');

function erro(mensagem, statusCode) {
  const err = new Error(mensagem);
  err.statusCode = statusCode;
  return err;
}

class PagamentoService {
  /**
   * @param {import('../repositories/PagamentoRepository').IPagamentoRepository} pagamentoRepository
   * @param {import('../domain/strategies/TarifaStrategy').TarifaEngine} tarifaEngine
   * @param {import('../clients/EstacionamentoClient').IEstacionamentoClient} estacionamentoClient
   */
  constructor(pagamentoRepository, tarifaEngine, estacionamentoClient) {
    this.pagamentoRepository = pagamentoRepository;
    this.tarifaEngine = tarifaEngine;
    this.estacionamentoClient = estacionamentoClient;
  }

  async _obterMovimentacao(movimentacaoId) {
    const mov = await this.estacionamentoClient.buscarMovimentacao(movimentacaoId);
    if (!mov) throw erro('Movimentação não encontrada', 404);
    return mov;
  }

  _calcular(mov) {
    if (mov.tipo === 'MENSALISTA') {
      return { valorCalculado: 0, dentroCarencia: false, isentoMensalista: true, tabelaAplicada: { descricao: 'Mensalista (isento)' } };
    }
    return { ...this.tarifaEngine.calcular(mov.permanenciaMinutos, mov.tipoVeiculo), isentoMensalista: false };
  }

  /**
   * Com movimentacaoId: calcula com os dados reais da movimentação.
   * Sem movimentacaoId: simulação a partir de permanenciaMinutos (validada) e tipoVeiculo.
   */
  async calcularTarifa({ movimentacaoId, permanenciaMinutos, minutos, tipoVeiculo }) {
    if (movimentacaoId) {
      const mov = await this._obterMovimentacao(movimentacaoId);
      const calculo = this._calcular(mov);
      return {
        movimentacaoId: String(movimentacaoId),
        permanenciaMinutos: mov.permanenciaMinutos,
        minutos: mov.permanenciaMinutos,
        tipoVeiculo: mov.tipoVeiculo,
        ...calculo,
        valor: calculo.valorCalculado,
      };
    }

    const min = permanenciaMinutos !== undefined ? permanenciaMinutos : minutos;
    if (min === undefined) {
      throw erro('Informe movimentacaoId ou permanenciaMinutos', 400);
    }
    const calculo = this.tarifaEngine.calcular(min, tipoVeiculo || 'CARRO'); // valida a permanência (400 se inválida)
    return {
      movimentacaoId: null,
      permanenciaMinutos: Number(min),
      minutos: Number(min),
      tipoVeiculo: String(tipoVeiculo || 'CARRO').toUpperCase(),
      ...calculo,
      valor: calculo.valorCalculado,
    };
  }

  async registrarPagamento({ movimentacaoId, forma, valorPago, cartao }) {
    if (!movimentacaoId || !forma) {
      throw erro('movimentacaoId e forma sao obrigatorios', 400);
    }

    // Verifica se já existe pagamento CONFIRMADO para esta movimentação (Idempotência)
    const existente = await this.pagamentoRepository.buscarPorMovimentacaoId(movimentacaoId);
    if (existente && existente.status === 'CONFIRMADO') {
      return existente.toJSON();
    }

    const mov = await this._obterMovimentacao(movimentacaoId);
    if (mov.status !== 'ABERTA') {
      throw erro('Esta movimentação já foi encerrada.', 409);
    }
    if (mov.tipo === 'MENSALISTA') {
      throw erro('Mensalista com contrato ativo não paga estadia avulsa.', 400);
    }

    const { valorCalculado: valorDevido } = this.tarifaEngine.calcular(mov.permanenciaMinutos, mov.tipoVeiculo);
    const formaNorm = String(forma).toUpperCase().trim();

    // Só no dinheiro o valor recebido vem do caixa; no cartão e no PIX é o próprio valor devido
    const vPago = formaNorm === FormaPagamento.DINHEIRO ? Number(valorPago) : valorDevido;

    // Usa Strategy para processar a forma de pagamento selecionada
    const processor = PagamentoProcessorFactory.obterProcessador(formaNorm);
    const resultadoProc = await processor.processar(valorDevido, vPago, { movimentacaoId, cartao });

    const pagamento = new Pagamento({
      id: String(Date.now()),
      movimentacaoId,
      forma: formaNorm,
      valorCalculado: valorDevido,
      valorPago: vPago,
      troco: resultadoProc.troco,
      status: resultadoProc.status,
      detalhes: {
        ...(resultadoProc.detalhes || {}),
        permanenciaMinutos: mov.permanenciaMinutos,
        tipoVeiculo: mov.tipoVeiculo,
      },
      dataHora: new Date().toISOString(),
    });

    pagamento.validar();
    await this.pagamentoRepository.salvar(pagamento);

    return pagamento.toJSON();
  }

  async confirmarPagamento(id) {
    const pagamento = await this.pagamentoRepository.buscarPorId(id);
    if (!pagamento) {
      throw erro('Pagamento não encontrado', 404);
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
      throw erro('Pagamento não encontrado', 404);
    }
    return pagamento.toJSON();
  }

  async buscarPorMovimentacaoId(movimentacaoId) {
    const pagamento = await this.pagamentoRepository.buscarPorMovimentacaoId(movimentacaoId);
    if (!pagamento) {
      throw erro('Nenhum pagamento encontrado para esta movimentação', 404);
    }
    return pagamento.toJSON();
  }

  async listarPagamentos() {
    const lista = await this.pagamentoRepository.listar();
    return lista.map((p) => (typeof p.toJSON === 'function' ? p.toJSON() : p));
  }
}

module.exports = { PagamentoService };
