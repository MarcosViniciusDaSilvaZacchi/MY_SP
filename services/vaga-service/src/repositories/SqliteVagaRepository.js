// ──────────────────────────────────────────────────────────────────
// Repositório SQLite de Vagas (LSP / DIP)
// Mesma interface do InMemoryVagaRepository, com os dados em disco.
// ──────────────────────────────────────────────────────────────────

const { IVagaRepository } = require('./IVagaRepository');
const { InMemoryVagaRepository } = require('./InMemoryVagaRepository');
const { Vaga } = require('../domain/entities/Vaga');
const { SqliteDocumentStore } = require('../infra/SqliteDocumentStore');

class SqliteVagaRepository extends IVagaRepository {
  /**
   * @param {import('sequelize').Sequelize} sequelize
   * @param {{ seed?: boolean }} [opcoes]
   */
  constructor(sequelize, { seed = true } = {}) {
    super();
    this.store = new SqliteDocumentStore(
      sequelize,
      'vagas',
      (dados) => new Vaga(dados),
      () => (seed ? new InMemoryVagaRepository().vagas : [])
    );
  }

  async listar(filtros = {}) {
    let resultado = await this.store.todos();
    const { andar, tipo, status } = filtros;

    if (andar !== undefined && andar !== null && andar !== '') {
      resultado = resultado.filter((v) => v.andar === Number(andar));
    }
    if (tipo) {
      resultado = resultado.filter((v) => v.tipo === String(tipo).toUpperCase());
    }
    if (status) {
      resultado = resultado.filter((v) => v.status === String(status).toUpperCase());
    }
    return resultado;
  }

  async buscarPorId(id) {
    if (!id) return null;
    return this.store.buscar(id);
  }

  async atualizarStatus(id, novoStatus) {
    const vaga = await this.buscarPorId(id);
    if (!vaga) return null;
    vaga.atualizarStatus(novoStatus);
    return this.store.salvar(vaga);
  }

  async fechar() {
    return this.store.fechar();
  }
}

module.exports = { SqliteVagaRepository };
