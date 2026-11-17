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
 * Tarifa Noturna / Pernoite (Extensão OCP):
 * Valor fixo fechado de R$ 35,00 para permanências longas (> 6 horas)
 */
class TarifaNoturnaStrategy extends ITarifaStrategy {
  constructor(valorFixoPernoite = 35.0, carenciaMinutos = 10) {
    super();
    this.valorFixoPernoite = valorFixoPernoite;
    this.carenciaMinutos = carenciaMinutos;
  }

  calcular(permanenciaMinutos) {
    const min = Number(permanenciaMinutos) || 0;
    if (min <= this.carenciaMinutos) {
      return {
        valorCalculado: 0.0,
        dentroCarencia: true,
        tabelaAplicada: {
          descricao: 'Tarifa Pernoite Noturna',
          valorFixo: this.valorFixoPernoite,
          carenciaMinutos: this.carenciaMinutos,
        },
      };
    }

    return {
      valorCalculado: parseFloat(this.valorFixoPernoite.toFixed(2)),
      dentroCarencia: false,
      tabelaAplicada: {
        descricao: 'Tarifa Pernoite Noturna',
        valorFixo: this.valorFixoPernoite,
        carenciaMinutos: this.carenciaMinutos,
      },
    };
  }
}

/**
 * Tarifa por Porte (regra oficial, README §4.3):
 * R$ 10,00 pela 1ª hora + R$ 5,00 por hora ou fração excedente,
 * multiplicado pelo porte do veículo (carro 1,0×, moto 0,5×).
 * Permanência de até 10 minutos é carência (RN-06): não há cobrança.
 * O estacionamento não recebe caminhões.
 */
class TarifaPorPorteStrategy extends ITarifaStrategy {
  constructor({
    carenciaMinutos = 10,
    valorPrimeiraHora = 10.0,
    valorHoraAdicional = 5.0,
    multiplicadores = { CARRO: 1.0, MOTO: 0.5 },
  } = {}) {
    super();
    this.carenciaMinutos = carenciaMinutos;
    this.valorPrimeiraHora = valorPrimeiraHora;
    this.valorHoraAdicional = valorHoraAdicional;
    this.multiplicadores = multiplicadores;
  }

  calcular(permanenciaMinutos, tipoVeiculo = 'CARRO') {
    const min = Number(permanenciaMinutos);
    if (typeof permanenciaMinutos === 'boolean' || permanenciaMinutos === '' || permanenciaMinutos === null
      || !Number.isFinite(min) || min < 0) {
      const err = new Error('Permanência inválida: informe um número de minutos maior ou igual a zero.');
      err.statusCode = 400;
      throw err;
    }

    const tipo = String(tipoVeiculo || 'CARRO').toUpperCase().trim();
    const multiplicador = this.multiplicadores[tipo];
    if (multiplicador === undefined) {
      const err = new Error(tipo === 'CAMINHAO'
        ? 'Caminhões não são aceitos neste estacionamento.'
        : 'Tipo de veículo inválido. Use CARRO ou MOTO.');
      err.statusCode = 400;
      throw err;
    }

    const tabelaAplicada = {
      id: 'PORTE_V2',
      descricao: 'Tarifa por porte',
      valorPrimeiraHora: this.valorPrimeiraHora,
      valorHoraAdicional: this.valorHoraAdicional,
      carenciaMinutos: this.carenciaMinutos,
      tipoVeiculo: tipo,
      multiplicador,
    };

    if (min <= this.carenciaMinutos) {
      return { valorCalculado: 0.0, dentroCarencia: true, tabelaAplicada };
    }

    const horas = Math.max(1, Math.ceil(min / 60));
    const valorBase = this.valorPrimeiraHora + (horas - 1) * this.valorHoraAdicional;
    return {
      valorCalculado: parseFloat((valorBase * multiplicador).toFixed(2)),
      dentroCarencia: false,
      tabelaAplicada,
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
  constructor(defaultStrategy = new TarifaPorPorteStrategy()) {
    this.strategy = defaultStrategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  calcular(permanenciaMinutos, tipoVeiculo) {
    return this.strategy.calcular(permanenciaMinutos, tipoVeiculo);
  }
}

module.exports = {
  ITarifaStrategy,
  TarifaPadraoStrategy,
  TarifaDiferenciadaStrategy,
  TarifaNoturnaStrategy,
  TarifaPorPorteStrategy,
  TarifaEngine,
};
