// ──────────────────────────────────────────────────────────────────
// Estacionamento Controller — dados em memoria (sem banco ainda)
// Proximo passo: substituir por ORM + PostgreSQL
// ──────────────────────────────────────────────────────────────────

const MENSALISTA_URL = process.env.MENSALISTA_SERVICE_URL || 'http://localhost:3003';

// Seed inicial para demonstracao
const movimentacoes = [
  {
    id: '1001',
    placa: 'XYZ9K88',
    tipo: 'MENSALISTA',
    dataHoraEntrada: new Date(Date.now() - 90 * 60000).toISOString(),
    status: 'ABERTA',
    origem: 'OPERADOR',
    autorizado: true,
  },
  {
    id: '1002',
    placa: 'ABC1D23',
    tipo: 'ROTATIVO',
    dataHoraEntrada: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'ABERTA',
    origem: 'OPERADOR',
    autorizado: true,
  },
];

// Consulta o mensalista-service via fetch nativo (Node 20+)
async function verificarMensalista(placa) {
  try {
    const resp = await fetch(`${MENSALISTA_URL}/mensalistas/placa/${placa}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    // mensalista-service indisponivel -> trata como ROTATIVO
    return null;
  }
}

// GET /entradas
exports.listarEntradas = (req, res) => {
  res.json(movimentacoes);
};

// POST /entradas  { placa, origem }
exports.registrarEntrada = async (req, res) => {
  const { placa, origem = 'OPERADOR' } = req.body;

  if (!placa) return res.status(400).json({ error: 'Placa obrigatoria' });

  const placaUpper = placa.toUpperCase().trim();

  const aberta = movimentacoes.find(
    (m) => m.placa === placaUpper && m.status === 'ABERTA'
  );
  if (aberta) return res.status(409).json({ error: 'Veiculo ja possui entrada aberta' });

  // Verifica adimplencia no mensalista-service (comunicacao entre microservicos)
  const mensalista = await verificarMensalista(placaUpper);
  const tipo = mensalista ? 'MENSALISTA' : 'ROTATIVO';
  const autorizado =
    tipo === 'ROTATIVO' || mensalista?.status === 'EM_DIA';

  if (!autorizado) {
    return res.status(403).json({
      error: 'Acesso negado: mensalista inadimplente ou bloqueado',
      status: mensalista?.status,
    });
  }

  const movimentacao = {
    id: String(Date.now()),
    placa: placaUpper,
    tipo,
    dataHoraEntrada: new Date().toISOString(),
    status: 'ABERTA',
    origem,
    autorizado,
    mensalistaNome: mensalista?.nome || null,
  };

  movimentacoes.push(movimentacao);
  res.status(201).json(movimentacao);
};

// GET /movimentacoes/aberta?placa=
exports.buscarAberta = (req, res) => {
  const { placa } = req.query;
  if (!placa) return res.status(400).json({ error: 'Placa obrigatoria' });

  const mov = movimentacoes.find(
    (m) => m.placa === placa.toUpperCase().trim() && m.status === 'ABERTA'
  );
  if (!mov) return res.status(404).json({ error: 'Nenhuma entrada aberta para essa placa' });

  const agora = new Date();
  const entrada = new Date(mov.dataHoraEntrada);
  const permanenciaMinutos = Math.floor((agora - entrada) / 60000);

  res.json({ ...mov, permanenciaMinutos });
};

// POST /saidas  { placa }
exports.registrarSaida = (req, res) => {
  const { placa } = req.body;
  if (!placa) return res.status(400).json({ error: 'Placa obrigatoria' });

  const mov = movimentacoes.find(
    (m) => m.placa === placa.toUpperCase().trim() && m.status === 'ABERTA'
  );
  if (!mov) return res.status(404).json({ error: 'Entrada nao encontrada para essa placa' });

  const dataHoraSaida = new Date().toISOString();
  const permanenciaMinutos = Math.floor(
    (new Date(dataHoraSaida) - new Date(mov.dataHoraEntrada)) / 60000
  );

  mov.status = 'FINALIZADA';
  mov.dataHoraSaida = dataHoraSaida;
  mov.permanenciaMinutos = permanenciaMinutos;

  res.json({ ...mov, mensagem: 'Saida registrada com sucesso' });
};

// GET /relatorios/resumo
exports.resumo = (req, res) => {
  const hoje = new Date().toDateString();
  const entradasHoje = movimentacoes.filter(
    (m) => new Date(m.dataHoraEntrada).toDateString() === hoje
  );
  const abertas = movimentacoes.filter((m) => m.status === 'ABERTA');
  const finalizadas = movimentacoes.filter(
    (m) => m.status === 'FINALIZADA' && new Date(m.dataHoraSaida || 0).toDateString() === hoje
  );

  res.json({
    totalEntradasHoje: entradasHoje.length,
    veiculosNoPatio: abertas.length,
    totalSaidasHoje: finalizadas.length,
    faturamentoHoje: 0, // calculado pelo pagamento-service
  });
};
