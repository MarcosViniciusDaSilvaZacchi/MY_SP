// ──────────────────────────────────────────────────────────────────
// SqliteDocumentStore (Infraestrutura de Persistência - SRP & DIP)
// Grava cada entidade como um registro (id + JSON) num banco SQLite
// local, via Sequelize. Os repositórios SQLite usam esta classe e
// continuam expondo a mesma interface dos repositórios em memória.
// ──────────────────────────────────────────────────────────────────

const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

/**
 * Cria a conexão SQLite do serviço.
 * DB_STORAGE permite trocar o arquivo (ex.: ':memory:' nos testes).
 * @param {string} nomeArquivo ex.: 'database_estacionamento.sqlite'
 */
function criarConexao(nomeArquivo) {
  const storage = process.env.DB_STORAGE || path.resolve(__dirname, '..', '..', nomeArquivo);
  return new Sequelize({ dialect: 'sqlite', storage, logging: false });
}

class SqliteDocumentStore {
  /**
   * @param {import('sequelize').Sequelize} sequelize
   * @param {string} tabela nome da tabela
   * @param {(dados: object) => object} fabrica recria a entidade a partir dos dados salvos
   * @param {() => object[]} [seed] registros iniciais, gravados só quando a tabela está vazia
   */
  constructor(sequelize, tabela, fabrica, seed = () => []) {
    this.sequelize = sequelize;
    this.fabrica = fabrica;
    this.modelo = sequelize.define(tabela, {
      id: { type: DataTypes.STRING, primaryKey: true },
      dados: { type: DataTypes.TEXT, allowNull: false },
    }, { tableName: tabela, timestamps: true });
    this.pronto = this._iniciar(seed);
  }

  async _iniciar(seed) {
    await this.modelo.sync();
    if ((await this.modelo.count()) === 0) {
      for (const entidade of seed()) await this._gravar(entidade);
    }
  }

  // Grava todos os campos da entidade (não usa toJSON, que pode omitir campos como senhaHash)
  async _gravar(entidade) {
    const dados = { ...entidade };
    await this.modelo.upsert({ id: String(dados.id), dados: JSON.stringify(dados) });
    return entidade;
  }

  async todos() {
    await this.pronto;
    const linhas = await this.modelo.findAll({ order: [['createdAt', 'ASC']] });
    return linhas.map((l) => this.fabrica(JSON.parse(l.dados)));
  }

  async buscar(id) {
    await this.pronto;
    const linha = await this.modelo.findByPk(String(id));
    return linha ? this.fabrica(JSON.parse(linha.dados)) : null;
  }

  async salvar(entidade) {
    await this.pronto;
    return this._gravar(entidade);
  }

  async remover(id) {
    await this.pronto;
    return (await this.modelo.destroy({ where: { id: String(id) } })) > 0;
  }

  async fechar() {
    await this.pronto;
    await this.sequelize.close();
  }
}

module.exports = { SqliteDocumentStore, criarConexao };
