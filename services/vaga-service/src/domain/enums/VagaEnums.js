// ──────────────────────────────────────────────────────────────────
// Enums do Domínio de Vagas
// ──────────────────────────────────────────────────────────────────

const TipoVaga = Object.freeze({
  COMUM: 'COMUM',
  PCD: 'PCD',
  IDOSO: 'IDOSO',
  GESTANTE: 'GESTANTE',
  ELETRICO: 'ELETRICO',
});

const StatusVaga = Object.freeze({
  LIVRE: 'LIVRE',
  OCUPADA: 'OCUPADA',
  INDISPONIVEL: 'INDISPONIVEL',
});

module.exports = {
  TipoVaga,
  StatusVaga,
};
