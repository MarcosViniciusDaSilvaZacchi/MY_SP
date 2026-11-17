// ──────────────────────────────────────────────────────────────────
// PagamentoService (Application Service / Use Case - SRP & DIP)
// Responsabilidade: orquestrar o cálculo, processamento, confirmação e persistência de pagamentos
//
// Regra de segurança: o valor devido é SEMPRE calculado aqui, a partir da
// movimentação guardada no estacionamento-service (horário de entrada e tipo
// de veículo). Valor e permanência enviados pelo cliente são ignorados.
//
// Tolerância pós-pagamento: depois de pagar, o cliente tem
// TOLERANCIA_POS_PAGAMENTO_MINUTOS para sair. Passado esse prazo, a saída
// exige um pagamento complementar com a diferença entre a tarifa atual e o
// total já pago.
// ──────────────────────────────────────────────────────────────────

const { Pagamento } = require('../domain/entities/PagamentoEntities');
const { FormaPagamento } = require('../domain/enums/PagamentoEnums');
const { PagamentoProcessorFactory } = require('../domain/strategies/PaymentProcessors');

const TOLERANCIA_POS_PAGAMENTO_MINUTOS = Number(process.env.TOLERANCIA_POS_PAGAMENTO_MINUTOS || 15);

function erro(mensagem, statusCode) {
  const err = new Error(mensagem);
  err.statusCode = statusCode;
  return err;
}

const somaValores = (lista) => parseFloat(lista.reduce((s, p) => s + Number(p.valorCalculado || 0), 0).toFixed(2));
const momentoConfirmacao = (p) => new Date(p.dataConfirmacao || p.dataHora).getTime();

class PagamentoService {
  /**
   * @param {import('../repositories/PagamentoRepository').IPagamentoRepository} pagamentoRepository
   * @param {import('../domain/strategies/TarifaStrategy').TarifaEngine} tarifaEngine
   * @param {import('../clients/EstacionamentoClient').IEstacionamentoClient} estacionamentoClient
   * @param {number} [toleranciaMinutos] prazo para sair depois de pagar
   */
  constructor(pagamentoRepository, tarifaEngine, estacionamentoClient, toleranciaMinutos = TOLERANCIA_POS_PAGAMENTO_MINUTOS) {
    this.pagamentoRepository = pagamentoRepository;
    this.tarifaEngine = tarifaEngine;
    this.estacionamentoClient = estacionamentoClient;
    this.toleranciaMinutos = toleranciaMinutos;
  }

  async _obterMovimentacao(movimentacaoId) {
    const mov = await this.estacionamentoClient.buscarMovimentacao(movimentacaoId);
    if (!mov) throw erro('Movimentação não encontrada', 404);
    return mov;
  }

  async _pagamentosDaMovimentacao(movimentacaoId) {
    const todos = await this.pagamentoRepository.listar();
    return todos.filter((p) => String(p.movimentacaoId) === String(movimentacaoId));
  }

  _calcular(mov) {
    if (mov.tipo === 'MENSALISTA') {
      return { valorCalculado: 0, dentroCarencia: false, isentoMensalista: true, tabelaAplicada: { descricao: 'Mensalista (isento)' } };
    }
    return { ...this.tarifaEngine.calcular(mov.permanenciaMinutos, mov.tipoVeiculo), isentoMensalista: false };
  }

  /**
   * Situação financeira de uma movimentação avulsa:
   * - quitado: o total pago cobre a tarifa atual, ou o último pagamento ainda está dentro da tolerância;
   * - saldoDevido: quanto falta pagar agora (tarifa atual − total já pago).
   */
  async _situacao(mov, agora = Date.now()) {
    const pagamentos = await this._pagamentosDaMovimentacao(mov.id);
    const confirmados = pagamentos
      .filter((p) => p.status === 'CONFIRMADO')
      .sort((a, b) => momentoConfirmacao(a) - momentoConfirmacao(b));
    const pendente = pagamentos.filter((p) => p.status === 'PENDENTE').pop() || null;
    const valorJaPago = somaValores(confirmados);
    const ultimoConfirmado = confirmados[confirmados.length - 1] || null;

    const valorTotal = mov.tipo === 'MENSALISTA'
      ? 0
      : this.tarifaEngine.calcular(mov.permanenciaMinutos, mov.tipoVeiculo).valorCalculado;

    let quitado = valorTotal <= valorJaPago;
    let toleranciaExpirada = false;
    if (!quitado && ultimoConfirmado) {
      const minutosDesdePagamento = (agora - momentoConfirmacao(ultimoConfirmado)) / 60000;
      if (minutosDesdePagamento <= this.toleranciaMinutos) quitado = true;
      else toleranciaExpirada = true;
    }

    const saldoDevido = quitado ? 0 : parseFloat(Math.max(0, valorTotal - valorJaPago).toFixed(2));
    return { quitado, saldoDevido, valorTotal, valorJaPago, toleranciaExpirada, ultimoConfirmado, pendente, confirmados };
  }

  _resumoSituacao(sit) {
    return {
      quitado: sit.quitado,
      saldoDevido: sit.saldoDevido,
      valorTotal: sit.valorTotal,
      valorJaPago: sit.valorJaPago,
      toleranciaExpirada: sit.toleranciaExpirada,
      toleranciaMinutos: this.toleranciaMinutos,
      pagamentoPendenteId: sit.pendente ? sit.pendente.id : null,
    };
  }

  /**
   * Com movimentacaoId: calcula com os dados reais da movimentação. Se já houve
   * pagamento, o valor a pagar agora é só o saldo (cobrança complementar).
   * Sem movimentacaoId: simulação a partir de permanenciaMinutos (validada) e tipoVeiculo.
   */
  async calcularTarifa({ movimentacaoId, permanenciaMinutos, minutos, tipoVeiculo }) {
    if (movimentacaoId) {
      const mov = await this._obterMovimentacao(movimentacaoId);
      const calculo = this._calcular(mov);
      const resposta = {
        movimentacaoId: String(movimentacaoId),
        permanenciaMinutos: mov.permanenciaMinutos,
        minutos: mov.permanenciaMinutos,
        tipoVeiculo: mov.tipoVeiculo,
        ...calculo,
        valor: calculo.valorCalculado,
      };
      if (mov.tipo === 'MENSALISTA' || mov.status !== 'ABERTA') return resposta;

      const sit = await this._situacao(mov);
      if (sit.confirmados.length === 0) return { ...resposta, ...this._resumoSituacao(sit) };
      return {
        ...resposta,
        valorCalculado: sit.saldoDevido,
        valor: sit.saldoDevido,
        complementar: sit.toleranciaExpirada && sit.saldoDevido > 0,
        ...this._resumoSituacao(sit),
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

    const mov = await this._obterMovimentacao(movimentacaoId);
    if (mov.status !== 'ABERTA') {
      // Idempotência: movimentação encerrada com pagamento confirmado devolve esse pagamento
      const existente = await this.pagamentoRepository.buscarPorMovimentacaoId(movimentacaoId);
      if (existente && existente.status === 'CONFIRMADO') return existente.toJSON();
      throw erro('Esta movimentação já foi encerrada.', 409);
    }
    if (mov.tipo === 'MENSALISTA') {
      throw erro('Mensalista com contrato ativo não paga estadia avulsa.', 400);
    }

    // Idempotência: já quitado (pago e dentro da tolerância) devolve o último pagamento
    const sit = await this._situacao(mov);
    if (sit.quitado && sit.ultimoConfirmado) {
      return { ...sit.ultimoConfirmado.toJSON(), situacaoSaida: this._resumoSituacao(sit) };
    }

    // Sem pagamento anterior: valor cheio. Tolerância expirada: só a diferença.
    const valorDevido = sit.saldoDevido;
    const complementar = sit.confirmados.length > 0;
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
        ...(complementar ? { complementar: true, valorJaPago: sit.valorJaPago, valorTotal: sit.valorTotal } : {}),
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

  /**
   * Retorna o pagamento mais relevante da movimentação (PIX pendente > último confirmado),
   * o total já pago e, se a movimentação ainda estiver aberta, a situação para a saída.
   */
  async buscarPorMovimentacaoId(movimentacaoId) {
    const pagamentos = await this._pagamentosDaMovimentacao(movimentacaoId);
    if (pagamentos.length === 0) {
      throw erro('Nenhum pagamento encontrado para esta movimentação', 404);
    }

    const confirmados = pagamentos
      .filter((p) => p.status === 'CONFIRMADO')
      .sort((a, b) => momentoConfirmacao(a) - momentoConfirmacao(b));
    const pendente = pagamentos.filter((p) => p.status === 'PENDENTE').pop();
    const principal = pendente || confirmados[confirmados.length - 1] || pagamentos[pagamentos.length - 1];

    const json = { ...principal.toJSON(), valorTotalPago: somaValores(confirmados) };

    let mov = null;
    try {
      mov = await this.estacionamentoClient.buscarMovimentacao(movimentacaoId);
    } catch {
      mov = null; // estacionamento-service fora do ar: devolve só o pagamento
    }
    if (mov && mov.status === 'ABERTA') {
      json.situacaoSaida = this._resumoSituacao(await this._situacao(mov));
    }
    return json;
  }

  async listarPagamentos() {
    const lista = await this.pagamentoRepository.listar();
    return lista.map((p) => (typeof p.toJSON === 'function' ? p.toJSON() : p));
  }
}

module.exports = { PagamentoService, TOLERANCIA_POS_PAGAMENTO_MINUTOS };
