// ──────────────────────────────────────────────────────────────────
// Repositório SQLite de Usuários (LSP / DIP)
// Mesma interface do InMemoryUsuarioRepository, com os dados em disco.
// O hash da senha é gravado; a senha em texto nunca é armazenada.
// ──────────────────────────────────────────────────────────────────

const { IUsuarioRepository } = require('./IUsuarioRepository');
const { InMemoryUsuarioRepository } = require('./InMemoryUsuarioRepository');
const { Usuario } = require('../domain/entities/Usuario');
const { SqliteDocumentStore } = require('../infra/SqliteDocumentStore');

class SqliteUsuarioRepository extends IUsuarioRepository {
  /**
   * @param {import('sequelize').Sequelize} sequelize
   * @param {{ seed?: boolean }} [opcoes]
   */
  constructor(sequelize, { seed = true } = {}) {
    super();
    this.store = new SqliteDocumentStore(
      sequelize,
      'usuarios',
      (dados) => new Usuario(dados),
      () => (seed ? new InMemoryUsuarioRepository().usuarios : [])
    );
  }

  async buscarPorEmail(email) {
    if (!email) return null;
    const norm = email.toLowerCase().trim();
    const todos = await this.store.todos();
    return todos.find((u) => u.email.toLowerCase() === norm) || null;
  }

  async buscarPorId(id) {
    if (id === undefined || id === null) return null;
    return this.store.buscar(Number(id));
  }

  async listar() {
    return this.store.todos();
  }

  async salvar(usuario) {
    return this.store.salvar(usuario);
  }

  async remover(id) {
    return this.store.remover(Number(id));
  }

  async fechar() {
    return this.store.fechar();
  }
}

module.exports = { SqliteUsuarioRepository };
