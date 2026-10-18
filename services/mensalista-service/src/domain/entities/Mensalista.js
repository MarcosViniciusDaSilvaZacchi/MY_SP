// ──────────────────────────────────────────────────────────────────
// Entidade Mensalista (SRP - Domínio de Negócio)
// Encapsula validações de dados e estado de adimplência
// ──────────────────────────────────────────────────────────────────

const { StatusMensalista } = require('../enums/StatusMensalista');

class Mensalista {
  constructor({
    id = String(Date.now()),
    nome,
    cpf,
    email = '',
    placa,
    vencimento,
    status = StatusMensalista.EM_DIA,
    planoMensal = 150.00,
  }) {
    this.id = String(id);
    this.nome = nome ? nome.trim() : '';
    this.cpf = cpf ? cpf.trim() : '';
    this.email = email ? email.trim() : '';
    this.placa = placa ? placa.toUpperCase().trim() : '';
    this.vencimento = vencimento;
    this.status = status;
    this.planoMensal = Number(planoMensal) || 150.00;
  }

  validar() {
    if (!this.nome) throw new Error('Nome é obrigatório');
    if (!this.cpf) throw new Error('CPF é obrigatório');
    if (!this.placa) throw new Error('Placa é obrigatória');
    if (!this.vencimento) throw new Error('Vencimento é obrigatório');
  }

  estaAdimplente() {
    return this.status === StatusMensalista.EM_DIA;
  }

  atualizar(dados = {}) {
    const camposPermitidos = ['nome', 'email', 'placa', 'vencimento', 'status', 'planoMensal'];
    camposPermitidos.forEach((campo) => {
      if (dados[campo] !== undefined) {
        if (campo === 'placa') {
          this.placa = dados[campo].toUpperCase().trim();
        } else if (campo === 'planoMensal') {
          this.planoMensal = Number(dados[campo]);
        } else {
          this[campo] = dados[campo];
        }
      }
    });
  }

  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      cpf: this.cpf,
      email: this.email,
      placa: this.placa,
      vencimento: this.vencimento,
      status: this.status,
      planoMensal: this.planoMensal,
    };
  }
}

module.exports = { Mensalista };
