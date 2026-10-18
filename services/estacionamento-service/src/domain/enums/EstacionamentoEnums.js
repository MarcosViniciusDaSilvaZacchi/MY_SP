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

module.exports = {
  TipoMovimentacao,
  StatusMovimentacao,
};
