// ──────────────────────────────────────────────────────────────────
// EstacionamentoService (Application Service / Use Case - SRP & DIP)
// Orquestra as regras de negócio de entrada, permanência, saída e totalizações
// ──────────────────────────────────────────────────────────────────

const { Movimentacao } = require('../domain/entities/Movimentacao');
const { TipoMovimentacao, StatusMovimentacao } = require('../domain/enums/EstacionamentoEnums');

class EstacionamentoService {
  /**
   * @param {import('../repositories/IMovimentacaoRepository').IMovimentacaoRepository} movimentacaoRepository
   * @param {import('../clients/MensalistaClient').IMensalistaClient} mensalistaClient
   * @param {import('../clients/PagamentoClient').IPagamentoClient} [pagamentoClient]
   */
  constructor(movimentacaoRepository, mensalistaClient, pagamentoClient = null) {
    this.movimentacaoRepository = movimentacaoRepository;
    this.mensalistaClient = mensalistaClient;
    this.pagamentoClient = pagamentoClient;
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

    // Consulta mensalista via adapter/client desacoplado
    const mensalista = await this.mensalistaClient.verificarMensalistaPorPlaca(placaUpper);
    const tipo = mensalista ? TipoMovimentacao.MENSALISTA : TipoMovimentacao.ROTATIVO;
    const autorizado = tipo === TipoMovimentacao.ROTATIVO || mensalista?.status === 'EM_DIA';

    if (!autorizado) {
      const err = new Error('Acesso negado: mensalista inadimplente ou bloqueado');
      err.statusCode = 403;
      err.detalhes = { status: mensalista?.status };
      throw err;
    }

    const agoraIso = new Date().toISOString();
    const movimentacao = new Movimentacao({
      id: String(Date.now()),
      placa: placaUpper,
      tipo,
      dataHoraEntrada: agoraIso,
      horaEntrada: agoraIso,
      status: StatusMovimentacao.ABERTA,
      origem,
      autorizado,
      mensalistaNome: mensalista?.nome || null,
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
    const hoje = new Date().toDateString();
    const lista = await this.movimentacaoRepository.listar();

    const entradasHoje = lista.filter(
      (m) => new Date(m.dataHoraEntrada || m.horaEntrada).toDateString() === hoje
    );
    const abertas = lista.filter((m) => m.status === StatusMovimentacao.ABERTA);
    const finalizadas = lista.filter(
      (m) => m.status === StatusMovimentacao.FINALIZADA && new Date(m.dataHoraSaida || 0).toDateString() === hoje
    );

    let faturamentoHoje = finalizadas.reduce((acc, m) => acc + (Number(m.valorCobrado) || 0), 0);

    if (this.pagamentoClient) {
      const pagamentos = await this.pagamentoClient.listarPagamentos();
      const pagamentosHoje = pagamentos.filter(
        (p) => p.status === 'CONFIRMADO' && (!p.dataHora || new Date(p.dataHora).toDateString() === hoje)
      );
      if (pagamentosHoje.length > 0) {
        const somaPagamentos = pagamentosHoje.reduce(
          (acc, p) => acc + (Number(p.valorCalculado ?? p.valor ?? 0) || 0),
          0
        );
        faturamentoHoje = Math.max(faturamentoHoje, somaPagamentos);
      }
    }

    faturamentoHoje = parseFloat(faturamentoHoje.toFixed(2));

    return {
      totalEntradas: entradasHoje.length,
      totalEntradasHoje: entradasHoje.length,
      entradasHoje: entradasHoje.length,
      veiculosNoPatio: abertas.length,
      totalSaidas: finalizadas.length,
      totalSaidasHoje: finalizadas.length,
      saidasHoje: finalizadas.length,
      faturamento: faturamentoHoje,
      faturamentoHoje,
      faturamentoDia: faturamentoHoje,
      ocupacaoMedia: Number((abertas.length / 20).toFixed(2)),
    };
  }
}

module.exports = { EstacionamentoService };
