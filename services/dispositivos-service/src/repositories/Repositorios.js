// ──────────────────────────────────────────────────────────────────
// Contratos e implementações dos repositórios (DIP / LSP / ISP)
//
// - Dispositivos e comandos ficam em memória: são estado "ao vivo"
//   (o ESP32 reenvia o estado a cada sync e um comando vale ~30 s).
// - Eventos são o histórico de auditoria: ficam em SQLite e sobrevivem
//   a reinícios (database_dispositivos.sqlite).
// ──────────────────────────────────────────────────────────────────

const { Dispositivo } = require('../domain/entities/Dispositivo');
const { EventoDispositivo } = require('../domain/entities/EventoDispositivo');
const { SqliteDocumentStore } = require('../infra/SqliteDocumentStore');

// ── Dispositivos ────────────────────────────────────────────────────
class IDispositivoRepository {
  async buscarPorId(id) { throw new Error('Método buscarPorId() não implementado'); }
  async salvar(dispositivo) { throw new Error('Método salvar() não implementado'); }
  async listar() { throw new Error('Método listar() não implementado'); }
}

class InMemoryDispositivoRepository extends IDispositivoRepository {
  constructor() {
    super();
    this.itens = new Map();
  }

  async buscarPorId(id) { return this.itens.get(String(id)) || null; }

  async salvar(dispositivo) {
    this.itens.set(dispositivo.id, dispositivo);
    return dispositivo;
  }

  async listar() { return [...this.itens.values()]; }
}

// ── Comandos ────────────────────────────────────────────────────────
class IComandoRepository {
  async salvar(comando) { throw new Error('Método salvar() não implementado'); }
  async buscarPorId(id) { throw new Error('Método buscarPorId() não implementado'); }
  async listarPorDispositivo(dispositivoId) { throw new Error('Método listarPorDispositivo() não implementado'); }
  async listar() { throw new Error('Método listar() não implementado'); }
}

class InMemoryComandoRepository extends IComandoRepository {
  /** @param {number} [limite] quantos comandos guardar (os mais antigos são descartados) */
  constructor(limite = 200) {
    super();
    this.itens = [];
    this.limite = limite;
  }

  async salvar(comando) {
    const idx = this.itens.findIndex((c) => c.id === comando.id);
    if (idx >= 0) this.itens[idx] = comando;
    else this.itens.push(comando);
    if (this.itens.length > this.limite) this.itens.splice(0, this.itens.length - this.limite);
    return comando;
  }

  async buscarPorId(id) { return this.itens.find((c) => c.id === String(id)) || null; }

  async listarPorDispositivo(dispositivoId) {
    return this.itens.filter((c) => c.dispositivoId === String(dispositivoId));
  }

  async listar() { return [...this.itens]; }
}

// ── Eventos ─────────────────────────────────────────────────────────
class IEventoRepository {
  async salvar(evento) { throw new Error('Método salvar() não implementado'); }
  /** @returns {Promise<EventoDispositivo[]>} do mais recente para o mais antigo */
  async listarRecentes(limite, filtros) { throw new Error('Método listarRecentes() não implementado'); }
}

const filtrar = (eventos, { dispositivoId, tipo } = {}) => eventos.filter((e) =>
  (!dispositivoId || e.dispositivoId === String(dispositivoId)) && (!tipo || e.tipo === String(tipo).toUpperCase()));

class InMemoryEventoRepository extends IEventoRepository {
  constructor() {
    super();
    this.itens = [];
  }

  async salvar(evento) {
    this.itens.push(evento);
    return evento;
  }

  async listarRecentes(limite = 50, filtros = {}) {
    return filtrar([...this.itens].reverse(), filtros).slice(0, limite);
  }
}

class SqliteEventoRepository extends IEventoRepository {
  /**
   * @param {import('sequelize').Sequelize} sequelize
   * @param {{ maximo?: number }} [opcoes] máximo de eventos guardados (os mais antigos são apagados)
   */
  constructor(sequelize, { maximo = 5000 } = {}) {
    super();
    this.maximo = maximo;
    this.gravacoes = 0;
    this.store = new SqliteDocumentStore(sequelize, 'eventos_dispositivos', (dados) => new EventoDispositivo(dados));
  }

  async salvar(evento) {
    await this.store.salvar(evento);
    // A cada 100 gravações, apaga o excedente para o arquivo não crescer sem limite
    if (++this.gravacoes % 100 === 0) await this._podar();
    return evento;
  }

  async _podar() {
    const { modelo } = this.store;
    const total = await modelo.count();
    if (total <= this.maximo) return;
    const antigos = await modelo.findAll({ attributes: ['id'], order: [['createdAt', 'ASC']], limit: total - this.maximo });
    await modelo.destroy({ where: { id: antigos.map((l) => l.id) } });
  }

  async listarRecentes(limite = 50, filtros = {}) {
    await this.store.pronto;
    const linhas = await this.store.modelo.findAll({ order: [['createdAt', 'DESC']], limit: Math.max(limite * 5, 200) });
    const eventos = linhas.map((l) => new EventoDispositivo(JSON.parse(l.dados)));
    return filtrar(eventos, filtros).slice(0, limite);
  }

  async fechar() {
    return this.store.fechar();
  }
}

module.exports = {
  IDispositivoRepository,
  InMemoryDispositivoRepository,
  IComandoRepository,
  InMemoryComandoRepository,
  IEventoRepository,
  InMemoryEventoRepository,
  SqliteEventoRepository,
  Dispositivo,
};
