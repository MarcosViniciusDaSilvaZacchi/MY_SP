// ──────────────────────────────────────────────────────────────────
// Entidade Vaga (Domínio - SRP)
// Encapsula o estado da vaga e transições válidas de status
// ──────────────────────────────────────────────────────────────────

const { TipoVaga, StatusVaga } = require('../enums/VagaEnums');

class Vaga {
  constructor({ id, codigo, andar, tipo = TipoVaga.COMUM, status = StatusVaga.LIVRE }) {
    this.id = String(id);
    this.codigo = String(codigo);
    this.andar = Number(andar);
    this.tipo = tipo;
    this.status = status;
  }

  validar() {
    if (!this.id) throw new Error('ID da vaga é obrigatório');
    if (!this.codigo) throw new Error('Código da vaga é obrigatório');
    if (!Object.values(TipoVaga).includes(this.tipo)) {
      throw new Error(`Tipo de vaga inválido: ${this.tipo}`);
    }
    if (!Object.values(StatusVaga).includes(this.status)) {
      throw new Error(`Status de vaga inválido: ${this.status}`);
    }
  }

  ocupar() {
    this.status = StatusVaga.OCUPADA;
  }

  liberar() {
    this.status = StatusVaga.LIVRE;
  }

  bloquear() {
    this.status = StatusVaga.INDISPONIVEL;
  }

  atualizarStatus(novoStatus) {
    const statusUpper = String(novoStatus || '').toUpperCase().trim();
    if (!Object.values(StatusVaga).includes(statusUpper)) {
      throw new Error(`Status inválido. Use: ${Object.values(StatusVaga).join(', ')}`);
    }
    this.status = statusUpper;
  }

  toJSON() {
    return {
      id: this.id,
      codigo: this.codigo,
      andar: this.andar,
      tipo: this.tipo,
      status: this.status,
    };
  }
}

module.exports = { Vaga };
