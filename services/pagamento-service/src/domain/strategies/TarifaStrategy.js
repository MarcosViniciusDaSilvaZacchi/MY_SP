// ──────────────────────────────────────────────────────────────────
// Strategy Pattern para Tarifação (OCP / LSP / SRP)
// C4 Nível 3: Tarifa Engine
// Permite adicionar novas regras de cobrança sem alterar código existente
// ──────────────────────────────────────────────────────────────────

const { TabelaPreco } = require('../entities/PagamentoEntities');

class ITarifaStrategy {
  /**
   * @param {number} permanenciaMinutos
   * @returns {{ valorCalculado: number, dentroCarencia: boolean, tabelaAplicada: object }}
   */
  calcular(permanenciaMinutos) {
    throw new Error('Método calcular() não implementado');
  }
}

/**
 * Tarifa Padrão: R$ 8,00 / hora com 10 min de carência
 */
class TarifaPadraoStrategy extends ITarifaStrategy {
  constructor(tabela = new TabelaPreco({ valorPorHora: 8.00, carenciaMinutos: 10 })) {
    super();
    this.tabela = tabela;
  }

  calcular(permanenciaMinutos) {
    const min = Number(permanenciaMinutos) || 0;
    const dentroCarencia = min <= this.tabela.carenciaMinutos;

    if (dentroCarencia) {
      return {
        valorCalculado: 0.0,
        dentroCarencia: true,
        tabelaAplicada: this.tabela.toJSON(),
      };
    }

    const minutosCobraveis = min - this.tabela.carenciaMinutos;
    const horas = Math.max(1, Math.ceil(minutosCobraveis / 60));
    const valorCalculado = parseFloat((horas * this.tabela.valorPorHora).toFixed(2));

    return {
      valorCalculado,
      dentroCarencia: false,
      tabelaAplicada: this.tabela.toJSON(),
    };
  }
}

/**
 * Tarifa Diferenciada (RN-10): R$ 10,00 na 1ª hora + R$ 5,00 horas seguintes
 */
class TarifaDiferenciadaStrategy extends ITarifaStrategy {
  constructor(carenciaMinutos = 10, valorPrimeiraHora = 10.0, valorHoraAdicional = 5.0) {
    super();
    this.carenciaMinutos = carenciaMinutos;
    this.valorPrimeiraHora = valorPrimeiraHora;
    this.valorHoraAdicional = valorHoraAdicional;
  }

  calcular(permanenciaMinutos) {
    const min = Number(permanenciaMinutos) || 0;
    if (min <= this.carenciaMinutos) {
      return {
        valorCalculado: 0.0,
        dentroCarencia: true,
        tabelaAplicada: {
          descricao: 'Tarifa Escalonada',
          valorPrimeiraHora: this.valorPrimeiraHora,
          valorHoraAdicional: this.valorHoraAdicional,
          carenciaMinutos: this.carenciaMinutos,
        },
      };
    }

    const minutosCobraveis = min - this.carenciaMinutos;
    const totalHoras = Math.max(1, Math.ceil(minutosCobraveis / 60));
    const valorCalculado = totalHoras === 1
      ? this.valorPrimeiraHora
      : this.valorPrimeiraHora + (totalHoras - 1) * this.valorHoraAdicional;

    return {
      valorCalculado: parseFloat(valorCalculado.toFixed(2)),
      dentroCarencia: false,
      tabelaAplicada: {
        descricao: 'Tarifa Escalonada',
        valorPrimeiraHora: this.valorPrimeiraHora,
        valorHoraAdicional: this.valorHoraAdicional,
        carenciaMinutos: this.carenciaMinutos,
      },
    };
  }
}

/**
 * TarifaEngine (Contexto do Strategy Pattern)
 */
class TarifaEngine {
  /**
   * @param {ITarifaStrategy} defaultStrategy
   */
  constructor(defaultStrategy = new TarifaPadraoStrategy()) {
    this.strategy = defaultStrategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  calcular(permanenciaMinutos) {
    return this.strategy.calcular(permanenciaMinutos);
  }
}

module.exports = {
  ITarifaStrategy,
  TarifaPadraoStrategy,
  TarifaDiferenciadaStrategy,
  TarifaEngine,
};
