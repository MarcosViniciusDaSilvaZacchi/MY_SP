// ──────────────────────────────────────────────────────────────────
// Pagamento Controller — dados em memoria
// Regra de tarifa: R$ 8,00/hora | carencia de 10 minutos
// ──────────────────────────────────────────────────────────────────

const VALOR_HORA = 8.00;
const CARENCIA_MINUTOS = 10;

const pagamentos = [];

function calcularValor(permanenciaMinutos) {
  if (permanenciaMinutos <= CARENCIA_MINUTOS) return 0;
  const minutosCobraveis = permanenciaMinutos - CARENCIA_MINUTOS;
  const horas = Math.max(1, Math.ceil(minutosCobraveis / 60));
  return parseFloat((horas * VALOR_HORA).toFixed(2));
}

// POST /pagamentos/calcular  { movimentacaoId, permanenciaMinutos / minutos }
exports.calcular = (req, res) => {
  const { movimentacaoId, permanenciaMinutos, minutos } = req.body;
  const min = permanenciaMinutos !== undefined ? permanenciaMinutos : minutos;

  if (min === undefined) {
    return res.status(400).json({ error: 'permanenciaMinutos obrigatorio' });
  }

  const minutosNum = Number(min);
  const dentroCarencia = minutosNum <= CARENCIA_MINUTOS;
  const valorCalculado = calcularValor(minutosNum);

  res.json({
    movimentacaoId,
    permanenciaMinutos: minutosNum,
    minutos: minutosNum,
    dentroCarencia,
    valorCalculado,
    valor: valorCalculado,
    tabelaAplicada: {
      valorHora: VALOR_HORA,
      carenciaMinutos: CARENCIA_MINUTOS,
    },
  });
};

// POST /pagamentos  { movimentacaoId, forma, valorPago / valor, permanenciaMinutos / minutos }
exports.registrar = (req, res) => {
  const { movimentacaoId, forma, valorPago, valor, permanenciaMinutos, minutos } = req.body;

  if (!movimentacaoId || !forma) {
    return res.status(400).json({ error: 'movimentacaoId e forma sao obrigatorios' });
  }

  const min = permanenciaMinutos !== undefined ? permanenciaMinutos : (minutos || 0);
  const valorDevido = calcularValor(Number(min));
  const vPago = valorPago !== undefined ? Number(valorPago) : (valor !== undefined ? Number(valor) : valorDevido);
  const troco = parseFloat((vPago - valorDevido).toFixed(2));

  const pagamento = {
    id: String(Date.now()),
    movimentacaoId,
    forma,
    valorCalculado: valorDevido,
    valor: valorDevido,
    valorPago: vPago,
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
