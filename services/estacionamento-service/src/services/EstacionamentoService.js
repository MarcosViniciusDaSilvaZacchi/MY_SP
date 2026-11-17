// ──────────────────────────────────────────────────────────────────
// EstacionamentoService (Application Service / Use Case - SRP & DIP)
// Orquestra as regras de negócio de entrada, permanência, saída e totalizações
// ──────────────────────────────────────────────────────────────────

const { Movimentacao } = require('../domain/entities/Movimentacao');
const { TipoMovimentacao, StatusMovimentacao, TipoVeiculo } = require('../domain/enums/EstacionamentoEnums');
const { ResumoEstacionamentoCalculator } = require('../domain/services/ResumoEstacionamentoCalculator');
const { ValidadorPlaca } = require('../domain/services/ValidadorPlaca');
const { AvaliadorAcessoContext } = require('../domain/strategies/RegrasAcesso');

// Permanência até este limite é carência: o avulso sai sem pagar
const CARENCIA_MINUTOS = 10;

function erro(mensagem, statusCode) {
  const err = new Error(mensagem);
  err.statusCode = statusCode;
  return err;
}

class EstacionamentoService {
  /**
   * @param {import('../repositories/IMovimentacaoRepository').IMovimentacaoRepository} movimentacaoRepository
   * @param {import('../clients/MensalistaClient').IMensalistaClient} mensalistaClient
   * @param {import('../clients/PagamentoClient').IPagamentoClient} [pagamentoClient]
   * @param {ResumoEstacionamentoCalculator} [resumoCalculator]
   * @param {AvaliadorAcessoContext} [avaliadorAcesso]
   * @param {ValidadorPlaca} [validadorPlaca]
   * @param {import('../clients/DispositivosClient').IDispositivosClient} [dispositivosClient] cancela física (Fase 2)
   */
  constructor(
    movimentacaoRepository,
    mensalistaClient,
    pagamentoClient = null,
    resumoCalculator = new ResumoEstacionamentoCalculator(),
    avaliadorAcesso = new AvaliadorAcessoContext(),
    validadorPlaca = new ValidadorPlaca(),
    dispositivosClient = null
  ) {
    this.movimentacaoRepository = movimentacaoRepository;
    this.mensalistaClient = mensalistaClient;
    this.pagamentoClient = pagamentoClient;
    this.resumoCalculator = resumoCalculator;
    this.avaliadorAcesso = avaliadorAcesso;
    this.validadorPlaca = validadorPlaca;
    this.dispositivosClient = dispositivosClient;
  }

  /**
   * Manda o ESP32 abrir a cancela. Melhor esforço: sem dispositivo, a operação
   * continua válida e a resposta informa que a cancela não foi acionada.
   */
  async _abrirCancela(sentido, mov) {
    if (!this.dispositivosClient) return null;
    const comando = await this.dispositivosClient.abrirCancela({
      sentido,
      movimentacaoId: mov.id,
      placa: mov.placa,
      origem: sentido === 'ENTRADA' ? 'ENTRADA_REGISTRADA' : 'SAIDA_LIBERADA',
    });
    return comando
      ? { acionada: true, comandoId: comando.id, dispositivoOnline: comando.dispositivoOnline }
      : { acionada: false, dispositivoOnline: false };
  }

  async listarEntradas() {
    const lista = await this.movimentacaoRepository.listar();
    return lista.map((m) => (typeof m.toJSON === 'function' ? m.toJSON() : m));
  }

  async registrarEntrada({ placa, tipoVeiculo = TipoVeiculo.CARRO, origem = 'OPERADOR' }) {
    if (!placa || !String(placa).trim()) {
      throw erro('Placa obrigatoria', 400);
    }

    // Validação no back-end: chamadas diretas à API não podem registrar placas inválidas
    if (!this.validadorPlaca.validar(placa)) {
      throw erro('Placa inválida. Use o padrão antigo (ABC1234) ou o Mercosul (ABC1D23).', 400);
    }
    const placaNorm = this.validadorPlaca.normalizar(placa);

    const veiculo = String(tipoVeiculo || TipoVeiculo.CARRO).toUpperCase().trim();
    if (veiculo === 'CAMINHAO') {
      throw erro('Caminhões não são aceitos neste estacionamento.', 400);
    }
    if (!Object.values(TipoVeiculo).includes(veiculo)) {
      throw erro('Tipo de veículo inválido. Use CARRO ou MOTO.', 400);
    }

    const aberta = await this.movimentacaoRepository.buscarAbertaPorPlaca(placaNorm);
    if (aberta) {
      throw erro('Veiculo ja possui entrada aberta', 409);
    }

    // Consulta mensalista via adapter/client desacoplado (DIP & ISP)
    const mensalista = await this.mensalistaClient.verificarMensalistaPorPlaca(placaNorm);

    // Avaliação de permissão de acesso delegada ao Strategy Pattern (OCP & SRP)
    const avaliacao = this.avaliadorAcesso.avaliar({
      placa: placaNorm,
      mensalista,
      origem,
    });

    if (!avaliacao.autorizado) {
      const err = erro(`Acesso negado: ${avaliacao.motivoNegacao || 'veículo não autorizado'}`, 403);
      err.detalhes = { status: mensalista?.status, motivo: avaliacao.motivoNegacao };
      throw err;
    }

    const agoraIso = new Date().toISOString();
    const movimentacao = new Movimentacao({
      id: String(Date.now()),
      placa: placaNorm,
      tipo: avaliacao.tipo,
      tipoVeiculo: veiculo,
      dataHoraEntrada: agoraIso,
      horaEntrada: agoraIso,
      status: StatusMovimentacao.ABERTA,
      origem,
      autorizado: true,
      mensalistaNome: avaliacao.mensalistaNome || null,
    });

    movimentacao.validar();
    await this.movimentacaoRepository.salvar(movimentacao);

    const cancela = await this._abrirCancela('ENTRADA', movimentacao);
    return { ...movimentacao.toJSON(), ...(cancela ? { cancela } : {}) };
  }

  async buscarAberta(placa) {
    if (!placa) {
      throw erro('Placa obrigatoria', 400);
    }

    const placaNorm = this.validadorPlaca.normalizar(placa);
    const mov = await this.movimentacaoRepository.buscarAbertaPorPlaca(placaNorm);
    if (!mov) {
      throw erro('Nenhuma entrada aberta para essa placa', 404);
    }

    const permanenciaMinutos = mov.calcularPermanenciaMinutos(new Date());

    return {
      ...mov.toJSON(),
      permanenciaMinutos,
      minutos: permanenciaMinutos,
    };
  }

  /**
   * Busca uma movimentação pelo id. Usado pelo pagamento-service para calcular
   * a tarifa a partir do horário de entrada guardado aqui, e não de valores
   * enviados pelo cliente.
   */
  async buscarPorId(id) {
    if (!id) {
      throw erro('Id da movimentação obrigatório', 400);
    }
    const mov = await this.movimentacaoRepository.buscarPorId(id);
    if (!mov) {
      throw erro('Movimentação não encontrada', 404);
    }
    const aberta = mov.status === StatusMovimentacao.ABERTA;
    const permanenciaMinutos = aberta ? mov.calcularPermanenciaMinutos(new Date()) : mov.permanenciaMinutos;
    return { ...mov.toJSON(), permanenciaMinutos, minutos: permanenciaMinutos };
  }

  async registrarSaida({ placa, movimentacaoId, valorCobrado }) {
    if (!placa && !movimentacaoId) {
      throw erro('Placa ou movimentacaoId obrigatorio', 400);
    }

    let mov = null;
    if (movimentacaoId) {
      mov = await this.movimentacaoRepository.buscarAbertaPorId(movimentacaoId);
    }
    if (!mov && placa) {
      mov = await this.movimentacaoRepository.buscarAbertaPorPlaca(this.validadorPlaca.normalizar(placa));
    }

    if (!mov) {
      throw erro('Entrada aberta nao encontrada para essa placa', 404);
    }

    const agoraIso = new Date().toISOString();
    const permanenciaMinutos = mov.calcularPermanenciaMinutos(agoraIso);
    const exigePagamento = mov.tipo === TipoMovimentacao.ROTATIVO && permanenciaMinutos > CARENCIA_MINUTOS;

    // Mensalista ou avulso dentro da carência: não há cobrança
    let valorFinal = exigePagamento ? valorCobrado : 0;

    if (exigePagamento && this.pagamentoClient) {
      const pagMov = await this.pagamentoClient.buscarPagamentoPorMovimentacao(mov.id);
      if (!pagMov || pagMov.status !== 'CONFIRMADO') {
        throw erro(
          pagMov?.status === 'PENDENTE'
            ? 'Para liberar a saída, confirme primeiro o recebimento do pagamento PIX.'
            : 'Para liberar a cancela, conclua primeiro o pagamento do estacionamento.',
          402
        );
      }
      // Tolerância pós-pagamento expirada: falta pagar a diferença (calculada pelo pagamento-service)
      const situacao = pagMov.situacaoSaida;
      if (situacao && situacao.quitado === false) {
        const err = erro(
          `O tempo de tolerância de ${situacao.toleranciaMinutos} min após o pagamento expirou. `
            + `Pague a diferença de R$ ${Number(situacao.saldoDevido).toFixed(2)} para liberar a saída.`,
          402
        );
        err.detalhes = { saldoDevido: situacao.saldoDevido };
        throw err;
      }
      // O valor registrado é o calculado pelo pagamento-service, nunca o enviado pelo cliente
      valorFinal = Number(pagMov.valorTotalPago ?? pagMov.valorCalculado ?? pagMov.valor ?? 0);
    }

    mov.finalizar(agoraIso, valorFinal !== undefined ? valorFinal : 0);
    await this.movimentacaoRepository.atualizar(mov);

    const cancela = await this._abrirCancela('SAIDA', mov);
    return {
      ...mov.toJSON(),
      mensagem: 'Saida registrada com sucesso',
      ...(cancela ? { cancela } : {}),
    };
  }

  async obterResumo() {
    const lista = await this.movimentacaoRepository.listar();
    let pagamentos = [];

    if (this.pagamentoClient) {
      pagamentos = await this.pagamentoClient.listarPagamentos();
    }

    // Delegação do cálculo de métricas para o domínio especialista (SRP & DIP)
    return this.resumoCalculator.calcular(lista, pagamentos, new Date());
  }
}

module.exports = { EstacionamentoService, CARENCIA_MINUTOS };
