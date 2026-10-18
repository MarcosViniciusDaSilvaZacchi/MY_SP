// ──────────────────────────────────────────────────────────────────
// Implementação em Memória do Repositório de Movimentações (LSP / DIP)
// ──────────────────────────────────────────────────────────────────

const { IMovimentacaoRepository } = require('./IMovimentacaoRepository');
const { Movimentacao } = require('../domain/entities/Movimentacao');
const { TipoMovimentacao, StatusMovimentacao } = require('../domain/enums/EstacionamentoEnums');

class InMemoryMovimentacaoRepository extends IMovimentacaoRepository {
  constructor() {
    super();
    this.movimentacoes = [
      new Movimentacao({
        id: '1000',
        placa: 'QWE4R56',
        tipo: TipoMovimentacao.ROTATIVO,
        dataHoraEntrada: new Date(Date.now() - 180 * 60000).toISOString(),
        dataHoraSaida: new Date(Date.now() - 60 * 60000).toISOString(),
        status: StatusMovimentacao.FINALIZADA,
        origem: 'OPERADOR',
        autorizado: true,
        mensalistaNome: null,
        permanenciaMinutos: 120,
        valorCobrado: 16.00,
      }),
      new Movimentacao({
        id: '1001',
        placa: 'XYZ9K88',
        tipo: TipoMovimentacao.MENSALISTA,
        dataHoraEntrada: new Date(Date.now() - 90 * 60000).toISOString(),
        status: StatusMovimentacao.ABERTA,
        origem: 'OPERADOR',
        autorizado: true,
        mensalistaNome: 'Joao Silva',
      }),
      new Movimentacao({
        id: '1002',
        placa: 'ABC1D23',
        tipo: TipoMovimentacao.ROTATIVO,
        dataHoraEntrada: new Date(Date.now() - 45 * 60000).toISOString(),
        status: StatusMovimentacao.ABERTA,
        origem: 'OPERADOR',
        autorizado: true,
        mensalistaNome: null,
      }),
    ];
  }

  async listar() {
    return [...this.movimentacoes];
  }

  async buscarAbertaPorPlaca(placa) {
    if (!placa) return null;
    const placaUpper = placa.toUpperCase().trim();
    return this.movimentacoes.find(
      (m) => m.placa === placaUpper && m.status === StatusMovimentacao.ABERTA
    ) || null;
  }

  async buscarAbertaPorId(id) {
    if (!id) return null;
    return this.movimentacoes.find(
      (m) => m.id === String(id) && m.status === StatusMovimentacao.ABERTA
    ) || null;
  }

  async salvar(movimentacao) {
    this.movimentacoes.push(movimentacao);
    return movimentacao;
  }

  async atualizar(movimentacao) {
    const idx = this.movimentacoes.findIndex((m) => m.id === String(movimentacao.id));
    if (idx >= 0) {
      this.movimentacoes[idx] = movimentacao;
      return this.movimentacoes[idx];
    }
    return null;
  }
}

module.exports = { InMemoryMovimentacaoRepository };
