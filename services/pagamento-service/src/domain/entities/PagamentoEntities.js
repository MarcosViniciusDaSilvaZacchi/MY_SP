// ──────────────────────────────────────────────────────────────────
// Entidades e Value Objects do Domínio de Pagamento (SRP)
// ──────────────────────────────────────────────────────────────────

const { StatusPagamento } = require('../enums/PagamentoEnums');

class TabelaPreco {
  constructor({ id = 'PADRAO_V1', descricao = 'Tabela Padrão Rotativo', valorPorHora = 8.00, carenciaMinutos = 10 } = {}) {
    this.id = id;
    this.descricao = descricao;
    this.valorPorHora = Number(valorPorHora);
    this.carenciaMinutos = Number(carenciaMinutos);
  }

  toJSON() {
    return {
      id: this.id,
      descricao: this.descricao,
      valorHora: this.valorPorHora,
      carenciaMinutos: this.carenciaMinutos,
    };
  }
}

class Pagamento {
  constructor({
    id = String(Date.now()),
    movimentacaoId,
    forma,
    valorCalculado,
    valorPago,
    troco = 0,
    status = StatusPagamento.CONFIRMADO,
    detalhes = {},
    dataHora = new Date().toISOString(),
    dataConfirmacao = null,
  }) {
    this.id = String(id);
    this.movimentacaoId = String(movimentacaoId);
    this.forma = forma;
    this.valorCalculado = Number(valorCalculado);
    this.valorPago = Number(valorPago !== undefined ? valorPago : valorCalculado);
    this.troco = Number(troco);
    this.status = status;
    this.detalhes = detalhes || {};
    this.dataHora = dataHora;
    this.dataConfirmacao = dataConfirmacao || (status === StatusPagamento.CONFIRMADO ? dataHora : null);
  }

  validar() {
    if (!this.movimentacaoId) throw new Error('movimentacaoId é obrigatório');
    if (!this.forma) throw new Error('forma de pagamento é obrigatória');
    if (isNaN(this.valorCalculado) || this.valorCalculado < 0) {
      throw new Error('valorCalculado inválido');
    }
  }

  confirmar(detalhesAdicionais = {}) {
    this.status = StatusPagamento.CONFIRMADO;
    this.dataConfirmacao = new Date().toISOString();
    this.detalhes = { ...this.detalhes, ...detalhesAdicionais };
  }

  cancelar() {
    this.status = StatusPagamento.CANCELADO;
  }

  toJSON() {
    return {
      id: this.id,
      movimentacaoId: this.movimentacaoId,
      forma: this.forma,
      valorCalculado: this.valorCalculado,
      valor: this.valorCalculado,
      valorPago: this.valorPago,
      troco: this.troco,
      status: this.status,
      detalhes: this.detalhes,
      dataHora: this.dataHora,
      dataConfirmacao: this.dataConfirmacao,
    };
  }
}

module.exports = {
  TabelaPreco,
  Pagamento,
};
