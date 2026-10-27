// ──────────────────────────────────────────────────────────────────
// ResumoEstacionamentoCalculator (Domain Service - SRP)
// C4 Nível 3: Resumo Calculator
// Responsabilidade Única: computar e consolidar métricas diárias e financeiras de pátio
// ──────────────────────────────────────────────────────────────────

const { StatusMovimentacao } = require('../enums/EstacionamentoEnums');

class ResumoEstacionamentoCalculator {
  /**
   * @param {number} [capacidadeTotal=20] Capacidade máxima de vagas para cálculo de taxa de ocupação
   */
  constructor(capacidadeTotal = 20) {
    this.capacidadeTotal = capacidadeTotal;
  }

  /**
   * Calcula as métricas consolidadas a partir das movimentações e pagamentos
   * @param {Array<import('../entities/Movimentacao').Movimentacao>} movimentacoes
   * @param {Array<object>} [pagamentos=[]]
   * @param {Date} [dataReferencia=new Date()]
   */
  calcular(movimentacoes = [], pagamentos = [], dataReferencia = new Date()) {
    const dataRefStr = dataReferencia.toDateString();

    const entradasHoje = movimentacoes.filter((m) => {
      const dataIso = m.dataHoraEntrada || m.horaEntrada;
      return dataIso && new Date(dataIso).toDateString() === dataRefStr;
    });

    const abertas = movimentacoes.filter((m) => m.status === StatusMovimentacao.ABERTA);

    const finalizadasHoje = movimentacoes.filter((m) => {
      const saidaIso = m.dataHoraSaida || 0;
      return m.status === StatusMovimentacao.FINALIZADA && new Date(saidaIso).toDateString() === dataRefStr;
    });

    let faturamentoHoje = finalizadasHoje.reduce((acc, m) => acc + (Number(m.valorCobrado) || 0), 0);

    // Se houver pagamentos confirmados do gateway, valida se há valor liquidado complementar
    if (Array.isArray(pagamentos) && pagamentos.length > 0) {
      const pagamentosHoje = pagamentos.filter((p) => {
        const isConfirmado = p.status === 'CONFIRMADO';
        const isHoje = !p.dataHora || new Date(p.dataHora).toDateString() === dataRefStr;
        return isConfirmado && isHoje;
      });

      if (pagamentosHoje.length > 0) {
        const somaPagamentos = pagamentosHoje.reduce(
          (acc, p) => acc + (Number(p.valorCalculado ?? p.valor ?? 0) || 0),
          0
        );
        faturamentoHoje = Math.max(faturamentoHoje, somaPagamentos);
      }
    }

    faturamentoHoje = parseFloat(faturamentoHoje.toFixed(2));
    const ocupacaoCalculada = this.capacidadeTotal > 0
      ? Number((abertas.length / this.capacidadeTotal).toFixed(2))
      : 0;

    return {
      totalEntradas: entradasHoje.length,
      totalEntradasHoje: entradasHoje.length,
      entradasHoje: entradasHoje.length,
      veiculosNoPatio: abertas.length,
      totalSaidas: finalizadasHoje.length,
      totalSaidasHoje: finalizadasHoje.length,
      saidasHoje: finalizadasHoje.length,
      faturamento: faturamentoHoje,
      faturamentoHoje,
      faturamentoDia: faturamentoHoje,
      ocupacaoMedia: ocupacaoCalculada,
      capacidadeTotal: this.capacidadeTotal,
    };
  }
}

module.exports = { ResumoEstacionamentoCalculator };

