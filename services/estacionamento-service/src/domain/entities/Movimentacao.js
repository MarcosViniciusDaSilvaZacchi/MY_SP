// ──────────────────────────────────────────────────────────────────
// Entidade Movimentacao (Domínio - SRP)
// Encapsula o ciclo de vida do veículo dentro do estacionamento
// ──────────────────────────────────────────────────────────────────

const { TipoMovimentacao, StatusMovimentacao } = require('../enums/EstacionamentoEnums');

class Movimentacao {
  constructor({
    id = String(Date.now()),
    placa,
    tipo = TipoMovimentacao.ROTATIVO,
    dataHoraEntrada = new Date().toISOString(),
    horaEntrada,
    dataHoraSaida = null,
    horaSaida = null,
    status = StatusMovimentacao.ABERTA,
    origem = 'OPERADOR',
    autorizado = true,
    mensalistaNome = null,
    permanenciaMinutos = null,
    valorCobrado = 0,
  }) {
    const entrada = dataHoraEntrada || horaEntrada || new Date().toISOString();
    this.id = String(id);
    this.placa = placa ? placa.toUpperCase().trim() : '';
    this.tipo = tipo;
    this.dataHoraEntrada = entrada;
    this.horaEntrada = entrada;
    this.dataHoraSaida = dataHoraSaida || horaSaida || null;
    this.horaSaida = dataHoraSaida || horaSaida || null;
    this.status = status;
    this.origem = origem;
    this.autorizado = autorizado;
    this.mensalistaNome = mensalistaNome;
    this.permanenciaMinutos = permanenciaMinutos;
    this.valorCobrado = Number(valorCobrado) || 0;
  }

  validar() {
    if (!this.placa) throw new Error('Placa é obrigatória');
    if (!Object.values(TipoMovimentacao).includes(this.tipo)) {
      throw new Error(`Tipo de movimentação inválido: ${this.tipo}`);
    }
  }

  calcularPermanenciaMinutos(dataReferencia = new Date()) {
    const entrada = new Date(this.dataHoraEntrada);
    const ref = new Date(dataReferencia);
    const diferencaMs = ref.getTime() - entrada.getTime();
    return Math.max(1, Math.floor(diferencaMs / 60000));
  }

  finalizar(dataSaida = new Date().toISOString(), valorCobrado = undefined) {
    this.status = StatusMovimentacao.FINALIZADA;
    this.dataHoraSaida = dataSaida;
    this.horaSaida = dataSaida;
    this.permanenciaMinutos = this.calcularPermanenciaMinutos(dataSaida);
    if (valorCobrado !== undefined) {
      this.valorCobrado = Number(valorCobrado) || 0;
    }
  }

  toJSON() {
    return {
      id: this.id,
      movimentacaoId: this.id,
      placa: this.placa,
      tipo: this.tipo,
      dataHoraEntrada: this.dataHoraEntrada,
      horaEntrada: this.horaEntrada,
      dataHoraSaida: this.dataHoraSaida,
      horaSaida: this.horaSaida,
      status: this.status,
      origem: this.origem,
      autorizado: this.autorizado,
      mensalistaNome: this.mensalistaNome,
      permanenciaMinutos: this.permanenciaMinutos,
      minutos: this.permanenciaMinutos,
      valorCobrado: this.valorCobrado,
    };
  }
}

module.exports = { Movimentacao };
