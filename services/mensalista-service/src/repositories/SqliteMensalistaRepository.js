// ──────────────────────────────────────────────────────────────────
// Repositório SQLite de Mensalistas (LSP / DIP)
// Mesma interface do InMemoryMensalistaRepository, com os dados em disco.
// ──────────────────────────────────────────────────────────────────

const { IMensalistaRepository } = require('./IMensalistaRepository');
const { InMemoryMensalistaRepository } = require('./InMemoryMensalistaRepository');
const { Mensalista } = require('../domain/entities/Mensalista');
const { SqliteDocumentStore } = require('../infra/SqliteDocumentStore');

class SqliteMensalistaRepository extends IMensalistaRepository {
  /**
   * @param {import('sequelize').Sequelize} sequelize
   * @param {{ seed?: boolean }} [opcoes]
   */
  constructor(sequelize, { seed = true } = {}) {
    super();
    this.store = new SqliteDocumentStore(
      sequelize,
      'mensalistas',
      (dados) => new Mensalista(dados),
      () => (seed ? new InMemoryMensalistaRepository().mensalistas : [])
    );
  }

  async listar(filtroPlaca) {
    const todos = await this.store.todos();
    if (!filtroPlaca) return todos;
    const termo = filtroPlaca.toUpperCase().trim();
    return todos.filter((m) => m.placa.includes(termo));
  }

  async buscarPorId(id) {
    if (!id) return null;
    return this.store.buscar(id);
  }

  async buscarPorPlaca(placa) {
    if (!placa) return null;
    const placaUpper = placa.toUpperCase().trim();
    const todos = await this.store.todos();
    return todos.find((m) => m.placa === placaUpper) || null;
  }

  async salvar(mensalista) {
    return this.store.salvar(mensalista);
  }

  async atualizar(id, dados) {
    const mensalista = await this.buscarPorId(id);
    if (!mensalista) return null;
    mensalista.atualizar(dados);
    return this.store.salvar(mensalista);
  }

  async fechar() {
    return this.store.fechar();
  }
}

module.exports = { SqliteMensalistaRepository };
