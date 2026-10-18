// ──────────────────────────────────────────────────────────────────
// DisponibilidadeCalculator (Domain Service - SRP)
// C4 Nível 3: Disponibilidade Calculator
// Responsabilidade: computar métricas, taxas de ocupação e sumarizações de vagas
// ──────────────────────────────────────────────────────────────────

const { StatusVaga } = require('../enums/VagaEnums');

class DisponibilidadeCalculator {
  /**
   * @param {Array<import('../entities/Vaga').Vaga>} vagas
   */
  calcularMetricas(vagas) {
    const total = vagas.length;
    if (total === 0) {
      return {
        total: 0,
        livres: 0,
        ocupadas: 0,
        indisponiveis: 0,
        percentualOcupacao: 0,
      };
    }

    const livres = vagas.filter((v) => v.status === StatusVaga.LIVRE).length;
    const ocupadas = vagas.filter((v) => v.status === StatusVaga.OCUPADA).length;
    const indisponiveis = vagas.filter((v) => v.status === StatusVaga.INDISPONIVEL).length;
    const percentualOcupacao = parseFloat(((ocupadas / total) * 100).toFixed(1));

    return {
      total,
      livres,
      ocupadas,
      indisponiveis,
      percentualOcupacao,
    };
  }
}

module.exports = { DisponibilidadeCalculator };
