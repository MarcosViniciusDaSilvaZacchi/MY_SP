// ──────────────────────────────────────────────────────────────────
// Repositório SQLite de Movimentações (LSP / DIP)
// Mesma interface do InMemoryMovimentacaoRepository, com os dados
// gravados em disco: sobrevivem a reinícios do serviço.
// ──────────────────────────────────────────────────────────────────

const { IMovimentacaoRepository } = require('./IMovimentacaoRepository');
const { InMemoryMovimentacaoRepository } = require('./InMemoryMovimentacaoRepository');
const { Movimentacao } = require('../domain/entities/Movimentacao');
const { StatusMovimentacao } = require('../domain/enums/EstacionamentoEnums');
const { SqliteDocumentStore } = require('../infra/SqliteDocumentStore');

class SqliteMovimentacaoRepository extends IMovimentacaoRepository {
  /**
   * @param {import('sequelize').Sequelize} sequelize
   * @param {{ seed?: boolean }} [opcoes] seed=true grava os dados de exemplo na primeira execução
   */
  constructor(sequelize, { seed = true } = {}) {
    super();
    this.store = new SqliteDocumentStore(
      sequelize,
      'movimentacoes',
      (dados) => new Movimentacao(dados),
      () => (seed ? new InMemoryMovimentacaoRepository().movimentacoes : [])
    );
  }

  async listar() {
    return this.store.todos();
  }

  async buscarPorId(id) {
    if (!id) return null;
    return this.store.buscar(id);
  }

  async buscarAbertaPorPlaca(placa) {
    if (!placa) return null;
    const placaUpper = placa.toUpperCase().trim();
    const todas = await this.store.todos();
    return todas.find((m) => m.placa === placaUpper && m.status === StatusMovimentacao.ABERTA) || null;
  }

  async buscarAbertaPorId(id) {
    const mov = await this.buscarPorId(id);
    return mov && mov.status === StatusMovimentacao.ABERTA ? mov : null;
  }

  async salvar(movimentacao) {
    return this.store.salvar(movimentacao);
  }

  async atualizar(movimentacao) {
    const existe = await this.store.buscar(movimentacao.id);
    if (!existe) return null;
    return this.store.salvar(movimentacao);
  }

  async fechar() {
    return this.store.fechar();
  }
}

module.exports = { SqliteMovimentacaoRepository };
