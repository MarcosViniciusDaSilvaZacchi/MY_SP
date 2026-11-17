// ──────────────────────────────────────────────────────────────────
// Enums do Domínio de Estacionamento
// ──────────────────────────────────────────────────────────────────

const TipoMovimentacao = Object.freeze({
  ROTATIVO: 'ROTATIVO',
  MENSALISTA: 'MENSALISTA',
});

const StatusMovimentacao = Object.freeze({
  ABERTA: 'ABERTA',
  AGUARDANDO_PAGAMENTO: 'AGUARDANDO_PAGAMENTO',
  FINALIZADA: 'FINALIZADA',
  CANCELADA: 'CANCELADA',
});

// O estacionamento recebe apenas carros e motos (caminhão não entra)
const TipoVeiculo = Object.freeze({
  CARRO: 'CARRO',
  MOTO: 'MOTO',
});

module.exports = {
  TipoMovimentacao,
  StatusMovimentacao,
  TipoVeiculo,
};
