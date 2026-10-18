// ──────────────────────────────────────────────────────────────────
// Implementação em Memória do Repositório de Vagas (LSP / DIP)
// 2 andares x 10 vagas = 20 vagas no total
// ──────────────────────────────────────────────────────────────────

const { IVagaRepository } = require('./IVagaRepository');
const { Vaga } = require('../domain/entities/Vaga');
const { TipoVaga, StatusVaga } = require('../domain/enums/VagaEnums');

const TIPOS_POR_ANDAR = [
  TipoVaga.COMUM, TipoVaga.COMUM, TipoVaga.COMUM, TipoVaga.COMUM, TipoVaga.COMUM,
  TipoVaga.COMUM, TipoVaga.PCD, TipoVaga.IDOSO, TipoVaga.GESTANTE, TipoVaga.ELETRICO,
];

const STATUS_SEED = [
  StatusVaga.OCUPADA, StatusVaga.OCUPADA, StatusVaga.LIVRE, StatusVaga.OCUPADA, StatusVaga.LIVRE,
  StatusVaga.LIVRE, StatusVaga.OCUPADA, StatusVaga.LIVRE, StatusVaga.LIVRE, StatusVaga.INDISPONIVEL,
  StatusVaga.LIVRE, StatusVaga.OCUPADA, StatusVaga.LIVRE, StatusVaga.LIVRE, StatusVaga.OCUPADA,
  StatusVaga.LIVRE, StatusVaga.LIVRE, StatusVaga.LIVRE, StatusVaga.LIVRE, StatusVaga.LIVRE,
];

class InMemoryVagaRepository extends IVagaRepository {
  constructor() {
    super();
    this.vagas = [];
    this._inicializarSeed();
  }

  _inicializarSeed() {
    for (let andar = 1; andar <= 2; andar++) {
      TIPOS_POR_ANDAR.forEach((tipo, i) => {
        const idxGlobal = (andar - 1) * 10 + i;
        this.vagas.push(
          new Vaga({
            id: `${andar}${String(i + 1).padStart(2, '0')}`,
            codigo: `${String.fromCharCode(64 + andar)}${String(i + 1).padStart(2, '0')}`,
            andar,
            tipo,
            status: STATUS_SEED[idxGlobal] || StatusVaga.LIVRE,
          })
        );
      });
    }
  }

  async listar(filtros = {}) {
    let resultado = [...this.vagas];
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
    return this.vagas.find((v) => v.id === String(id)) || null;
  }

  async atualizarStatus(id, novoStatus) {
    const vaga = await this.buscarPorId(id);
    if (!vaga) return null;
    vaga.atualizarStatus(novoStatus);
    return vaga;
  }
}

module.exports = { InMemoryVagaRepository };
