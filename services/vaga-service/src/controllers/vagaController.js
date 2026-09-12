// ──────────────────────────────────────────────────────────────────
// Vaga Controller — dados em memoria (sem banco ainda)
// 2 andares x 10 vagas = 20 vagas no total
// ──────────────────────────────────────────────────────────────────

const TIPOS_POR_ANDAR = [
  'COMUM', 'COMUM', 'COMUM', 'COMUM', 'COMUM',
  'COMUM', 'COMUM', 'PCD', 'IDOSO', 'ELETRICO',
];

// Gera vagas iniciais com alguns status de demonstracao
const STATUS_SEED = [
  'OCUPADA', 'OCUPADA', 'LIVRE', 'OCUPADA', 'LIVRE',
  'LIVRE', 'OCUPADA', 'LIVRE', 'LIVRE', 'INDISPONIVEL',
  'LIVRE', 'OCUPADA', 'LIVRE', 'LIVRE', 'OCUPADA',
  'LIVRE', 'LIVRE', 'LIVRE', 'LIVRE', 'LIVRE',
];

const vagas = [];
for (let andar = 1; andar <= 2; andar++) {
  TIPOS_POR_ANDAR.forEach((tipo, i) => {
    const idxGlobal = (andar - 1) * 10 + i;
    vagas.push({
      id: `${andar}${String(i + 1).padStart(2, '0')}`,
      codigo: `${String.fromCharCode(64 + andar)}${String(i + 1).padStart(2, '0')}`,
      andar,
      tipo,
      status: STATUS_SEED[idxGlobal] || 'LIVRE',
    });
  });
}

// GET /vagas  ?andar= ?tipo= ?status=
exports.listar = (req, res) => {
  let resultado = [...vagas];
  const { andar, tipo, status } = req.query;

  if (andar) resultado = resultado.filter((v) => v.andar === Number(andar));
  if (tipo) resultado = resultado.filter((v) => v.tipo === tipo.toUpperCase());
  if (status) resultado = resultado.filter((v) => v.status === status.toUpperCase());

  res.json(resultado);
};

// GET /vagas/disponibilidade
exports.disponibilidade = (req, res) => {
  const total = vagas.length;
  const livres = vagas.filter((v) => v.status === 'LIVRE').length;
  const ocupadas = vagas.filter((v) => v.status === 'OCUPADA').length;
  const indisponiveis = vagas.filter((v) => v.status === 'INDISPONIVEL').length;

  res.json({
    total,
    livres,
    ocupadas,
    indisponiveis,
    percentualOcupacao: parseFloat(((ocupadas / total) * 100).toFixed(1)),
  });
};

// PATCH /vagas/:id/status  { status }
exports.atualizarStatus = (req, res) => {
  const vaga = vagas.find((v) => v.id === req.params.id);
  if (!vaga) return res.status(404).json({ error: 'Vaga nao encontrada' });

  const { status } = req.body;
  const statusValidos = ['LIVRE', 'OCUPADA', 'INDISPONIVEL'];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ error: `Status invalido. Use: ${statusValidos.join(', ')}` });
  }

  vaga.status = status;
  res.json(vaga);
};
