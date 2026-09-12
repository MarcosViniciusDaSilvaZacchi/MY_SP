// ──────────────────────────────────────────────────────────────────
// Mensalista Controller — dados em memoria (sem banco ainda)
// ──────────────────────────────────────────────────────────────────

let mensalistas = [
  {
    id: '1',
    nome: 'Joao Silva',
    cpf: '111.111.111-11',
    email: 'joao@email.com',
    placa: 'XYZ9K88',
    vencimento: '2026-09-30',
    status: 'EM_DIA',
    planoMensal: 150.00,
  },
  {
    id: '2',
    nome: 'Maria Santos',
    cpf: '222.222.222-22',
    email: 'maria@email.com',
    placa: 'DEF5G67',
    vencimento: '2026-08-31',
    status: 'INADIMPLENTE',
    planoMensal: 150.00,
  },
  {
    id: '3',
    nome: 'Carlos Mendes',
    cpf: '333.333.333-33',
    email: 'carlos@email.com',
    placa: 'GHI2J45',
    vencimento: '2026-10-15',
    status: 'EM_DIA',
    planoMensal: 180.00,
  },
];

// GET /mensalistas  ?placa= (optional)
exports.listar = (req, res) => {
  const { placa } = req.query;
  let resultado = mensalistas;
  if (placa) {
    resultado = mensalistas.filter((m) =>
      m.placa.toUpperCase().includes(placa.toUpperCase())
    );
  }
  res.json(resultado);
};

// GET /mensalistas/placa/:placa
exports.buscarPorPlaca = (req, res) => {
  const placa = req.params.placa.toUpperCase().trim();
  const mensalista = mensalistas.find((m) => m.placa === placa);
  if (!mensalista) return res.status(404).json({ error: 'Mensalista nao encontrado para essa placa' });
  res.json(mensalista);
};

// POST /mensalistas
exports.cadastrar = (req, res) => {
  const { nome, cpf, email, placa, vencimento, planoMensal } = req.body;

  if (!nome || !cpf || !placa || !vencimento) {
    return res.status(400).json({ error: 'nome, cpf, placa e vencimento sao obrigatorios' });
  }

  const existe = mensalistas.find((m) => m.placa.toUpperCase() === placa.toUpperCase());
  if (existe) return res.status(409).json({ error: 'Ja existe mensalista com essa placa' });

  const novo = {
    id: String(Date.now()),
    nome,
    cpf,
    email: email || '',
    placa: placa.toUpperCase(),
    vencimento,
    status: 'EM_DIA',
    planoMensal: planoMensal || 150.00,
  };
  mensalistas.push(novo);
  res.status(201).json(novo);
};

// PATCH /mensalistas/:id
exports.atualizar = (req, res) => {
  const mensalista = mensalistas.find((m) => m.id === req.params.id);
  if (!mensalista) return res.status(404).json({ error: 'Mensalista nao encontrado' });

  const campos = ['nome', 'email', 'placa', 'vencimento', 'status', 'planoMensal'];
  campos.forEach((c) => { if (req.body[c] !== undefined) mensalista[c] = req.body[c]; });

  res.json(mensalista);
};
