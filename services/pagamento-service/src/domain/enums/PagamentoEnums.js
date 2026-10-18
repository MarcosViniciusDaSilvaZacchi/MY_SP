// ──────────────────────────────────────────────────────────────────
// Enums do Domínio de Pagamento
// ──────────────────────────────────────────────────────────────────

const FormaPagamento = Object.freeze({
  DINHEIRO: 'DINHEIRO',
  CARTAO: 'CARTAO',
  PIX: 'PIX',
});

const StatusPagamento = Object.freeze({
  PENDENTE: 'PENDENTE',
  CONFIRMADO: 'CONFIRMADO',
  CANCELADO: 'CANCELADO',
});

module.exports = {
  FormaPagamento,
  StatusPagamento,
};
