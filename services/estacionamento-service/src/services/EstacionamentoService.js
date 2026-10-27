// ──────────────────────────────────────────────────────────────────
// EstacionamentoService (Application Service / Use Case - SRP & DIP)
// Orquestra as regras de negócio de entrada, permanência, saída e totalizações
// ──────────────────────────────────────────────────────────────────

const { Movimentacao } = require('../domain/entities/Movimentacao');
const { TipoMovimentacao, StatusMovimentacao } = require('../domain/enums/EstacionamentoEnums');
const { ResumoEstacionamentoCalculator } = require('../domain/services/ResumoEstacionamentoCalculator');
const { AvaliadorAcessoContext } = require('../domain/strategies/RegrasAcesso');

class EstacionamentoService {
  /**
   * @param {import('../repositories/IMovimentacaoRepository').IMovimentacaoRepository} movimentacaoRepository
   * @param {import('../clients/MensalistaClient').IMensalistaClient} mensalistaClient
   * @param {import('../clients/PagamentoClient').IPagamentoClient} [pagamentoClient]
   * @param {ResumoEstacionamentoCalculator} [resumoCalculator]
   * @param {AvaliadorAcessoContext} [avaliadorAcesso]
   */
  constructor(
    movimentacaoRepository,
    mensalistaClient,
    pagamentoClient = null,
    resumoCalculator = new ResumoEstacionamentoCalculator(),
    avaliadorAcesso = new AvaliadorAcessoContext()
  ) {
    this.movimentacaoRepository = movimentacaoRepository;
    this.mensalistaClient = mensalistaClient;
    this.pagamentoClient = pagamentoClient;
    this.resumoCalculator = resumoCalculator;
    this.avaliadorAcesso = avaliadorAcesso;
  }

  async listarEntradas() {
    const lista = await this.movimentacaoRepository.listar();
    return lista.map((m) => (typeof m.toJSON === 'function' ? m.toJSON() : m));
  }

  async registrarEntrada({ placa, origem = 'OPERADOR' }) {
    if (!placa) {
      const err = new Error('Placa obrigatoria');
      err.statusCode = 400;
      throw err;
    }

    const placaUpper = placa.toUpperCase().trim();

    const aberta = await this.movimentacaoRepository.buscarAbertaPorPlaca(placaUpper);
    if (aberta) {
      const err = new Error('Veiculo ja possui entrada aberta');
      err.statusCode = 409;
      throw err;
    }

    // Consulta mensalista via adapter/client desacoplado (DIP & ISP)
    const mensalista = await this.mensalistaClient.verificarMensalistaPorPlaca(placaUpper);

    // Avaliação de permissão de acesso delegada ao Strategy Pattern (OCP & SRP)
    const avaliacao = this.avaliadorAcesso.avaliar({
      placa: placaUpper,
      mensalista,
      origem,
    });

    if (!avaliacao.autorizado) {
      const err = new Error(`Acesso negado: ${avaliacao.motivoNegacao || 'veículo não autorizado'}`);
      err.statusCode = 403;
      err.detalhes = { status: mensalista?.status, motivo: avaliacao.motivoNegacao };
      throw err;
    }

    const agoraIso = new Date().toISOString();
    const movimentacao = new Movimentacao({
      id: String(Date.now()),
      placa: placaUpper,
      tipo: avaliacao.tipo,
      dataHoraEntrada: agoraIso,
      horaEntrada: agoraIso,
      status: StatusMovimentacao.ABERTA,
      origem,
      autorizado: true,
      mensalistaNome: avaliacao.mensalistaNome || null,
    });

    movimentacao.validar();
    await this.movimentacaoRepository.salvar(movimentacao);

    return movimentacao.toJSON();
  }

  async buscarAberta(placa) {
    if (!placa) {
      const err = new Error('Placa obrigatoria');
      err.statusCode = 400;
      throw err;
    }

    const placaUpper = placa.toUpperCase().trim();
    const mov = await this.movimentacaoRepository.buscarAbertaPorPlaca(placaUpper);
    if (!mov) {
      const err = new Error('Nenhuma entrada aberta para essa placa');
      err.statusCode = 404;
      throw err;
    }

    const permanenciaMinutos = mov.calcularPermanenciaMinutos(new Date());

    return {
      ...mov.toJSON(),
      permanenciaMinutos,
      minutos: permanenciaMinutos,
    };
  }

  async registrarSaida({ placa, movimentacaoId, valorCobrado }) {
    if (!placa && !movimentacaoId) {
      const err = new Error('Placa ou movimentacaoId obrigatorio');
      err.statusCode = 400;
      throw err;
    }

    let mov = null;
    if (movimentacaoId) {
      mov = await this.movimentacaoRepository.buscarAbertaPorId(movimentacaoId);
    }
    if (!mov && placa) {
      mov = await this.movimentacaoRepository.buscarAbertaPorPlaca(placa);
    }

    if (!mov) {
      const err = new Error('Entrada aberta nao encontrada para essa placa');
      err.statusCode = 404;
      throw err;
    }

    const agoraIso = new Date().toISOString();
    const permanenciaMinutos = mov.calcularPermanenciaMinutos(agoraIso);
    const exigePagamento = mov.tipo === TipoMovimentacao.ROTATIVO && permanenciaMinutos > 10;

    let valorFinal = valorCobrado;

    if (exigePagamento && this.pagamentoClient) {
      const pagMov = await this.pagamentoClient.buscarPagamentoPorMovimentacao(mov.id);
      if (!pagMov || pagMov.status !== 'CONFIRMADO') {
        const err = new Error(
          pagMov?.status === 'PENDENTE'
            ? 'Para liberar a saída, confirme primeiro o recebimento do pagamento PIX.'
            : 'Para liberar a cancela, conclua primeiro o pagamento do estacionamento.'
        );
        err.statusCode = 402;
        throw err;
      }
      valorFinal = Number(pagMov.valorCalculado ?? pagMov.valor ?? valorFinal ?? 0);
    }

    mov.finalizar(agoraIso, valorFinal !== undefined ? valorFinal : 0);
    await this.movimentacaoRepository.atualizar(mov);

    return {
      ...mov.toJSON(),
      mensagem: 'Saida registrada com sucesso',
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

module.exports = { EstacionamentoService };
