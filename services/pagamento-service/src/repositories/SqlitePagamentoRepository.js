// ──────────────────────────────────────────────────────────────────
// Repositório SQLite de Pagamentos (LSP / DIP)
// Mesma interface do InMemoryPagamentoRepository, com os dados
// gravados em disco: o histórico financeiro sobrevive a reinícios.
// ──────────────────────────────────────────────────────────────────

const { IPagamentoRepository, InMemoryPagamentoRepository } = require('./PagamentoRepository');
const { Pagamento } = require('../domain/entities/PagamentoEntities');
const { SqliteDocumentStore } = require('../infra/SqliteDocumentStore');

class SqlitePagamentoRepository extends IPagamentoRepository {
  /**
   * @param {import('sequelize').Sequelize} sequelize
   * @param {{ seed?: boolean }} [opcoes]
   */
  constructor(sequelize, { seed = true } = {}) {
    super();
    this.store = new SqliteDocumentStore(
      sequelize,
      'pagamentos',
      (dados) => new Pagamento(dados),
      () => (seed ? new InMemoryPagamentoRepository().pagamentos : [])
    );
  }

  async salvar(pagamento) {
    return this.store.salvar(pagamento);
  }

  async atualizar(pagamento) {
    const existe = await this.store.buscar(pagamento.id);
    if (!existe) return null;
    return this.store.salvar(pagamento);
  }

  async listar() {
    return this.store.todos();
  }

  async buscarPorId(id) {
    if (!id) return null;
    return this.store.buscar(id);
  }

  async buscarPorMovimentacaoId(movimentacaoId) {
    const todos = await this.store.todos();
    const matches = todos.filter((p) => String(p.movimentacaoId) === String(movimentacaoId));
    if (matches.length === 0) return null;
    // Prioriza pagamento CONFIRMADO se existir, senão retorna o mais recente
    const confirmado = matches.find((p) => p.status === 'CONFIRMADO');
    return confirmado || matches[matches.length - 1];
  }

  async fechar() {
    return this.store.fechar();
  }
}

module.exports = { SqlitePagamentoRepository };
