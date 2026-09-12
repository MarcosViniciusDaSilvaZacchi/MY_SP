// ──────────────────────────────────────────────────────────────────
// Pagamento Controller — dados em memoria (sem banco ainda)
// Regra de tarifa: R$ 8,00/hora | carencia de 10 minutos
// ──────────────────────────────────────────────────────────────────

const VALOR_HORA = 8.00;
const CARENCIA_MINUTOS = 10;

const pagamentos = [];

function calcularValor(permanenciaMinutos) {
  if (permanenciaMinutos <= CARENCIA_MINUTOS) return 0;
  const minutosCobraveis = permanenciaMinutos - CARENCIA_MINUTOS;
  const horas = Math.ceil(minutosCobraveis / 60);
  return parseFloat((horas * VALOR_HORA).toFixed(2));
}

// POST /pagamentos/calcular  { movimentacaoId, permanenciaMinutos }
exports.calcular = (req, res) => {
  const { movimentacaoId, permanenciaMinutos } = req.body;

  if (permanenciaMinutos === undefined) {
    return res.status(400).json({ error: 'permanenciaMinutos obrigatorio' });
  }

  const dentroCarencia = permanenciaMinutos <= CARENCIA_MINUTOS;
  const valorCalculado = calcularValor(Number(permanenciaMinutos));

  res.json({
    movimentacaoId,
    permanenciaMinutos: Number(permanenciaMinutos),
    dentroCarencia,
    valorCalculado,
    tabelaAplicada: {
      valorHora: VALOR_HORA,
      carenciaMinutos: CARENCIA_MINUTOS,
    },
  });
};

// POST /pagamentos  { movimentacaoId, forma, valorPago, permanenciaMinutos }
exports.registrar = (req, res) => {
  const { movimentacaoId, forma, valorPago, permanenciaMinutos } = req.body;

  if (!movimentacaoId || !forma) {
    return res.status(400).json({ error: 'movimentacaoId e forma sao obrigatorios' });
  }

  const valorDevido = calcularValor(Number(permanenciaMinutos || 0));
  const troco = parseFloat((Number(valorPago || 0) - valorDevido).toFixed(2));

  const pagamento = {
    id: String(Date.now()),
    movimentacaoId,
    forma,
    valorCalculado: valorDevido,
    valorPago: Number(valorPago || valorDevido),
    troco: troco > 0 ? troco : 0,
    status: 'CONFIRMADO',
    dataHora: new Date().toISOString(),
  };

  pagamentos.push(pagamento);
  res.status(201).json(pagamento);
};

// GET /pagamentos
exports.listar = (req, res) => {
  res.json(pagamentos);
};
