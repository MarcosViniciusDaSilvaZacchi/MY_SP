// ──────────────────────────────────────────────────────────────────
// Strategy Pattern para Compatibilidade de Vagas (OCP / LSP / SRP)
// C4 Nível 3: Vaga Strategy
// Responsabilidade: Determinar a compatibilidade física e preferencial
// de alocação entre o tipo de veículo e o tipo de vaga
// ──────────────────────────────────────────────────────────────────

const { TipoVaga } = require('../enums/VagaEnums');

class ICompatibilidadeVagaStrategy {
  /**
   * @param {string} tipoVeiculo
   * @param {string} tipoVaga
   * @returns {boolean}
   */
  isCompativel(tipoVeiculo, tipoVaga) {
    throw new Error('Método isCompativel() não implementado');
  }
}

class CompatibilidadePadraoStrategy extends ICompatibilidadeVagaStrategy {
  isCompativel(tipoVeiculo, tipoVaga) {
    const vTipo = String(tipoVeiculo || 'CARRO').toUpperCase().trim();
    const sTipo = String(tipoVaga || 'CARRO').toUpperCase().trim();

    // Vaga especial (PCD / IDOSO) exige regra específica ou preferencial
    if (sTipo === TipoVaga.PCD || sTipo === TipoVaga.IDOSO) {
      return vTipo === sTipo || vTipo === TipoVaga.CARRO;
    }

    // Moto pode ocupar vaga de Moto ou Carro
    if (vTipo === TipoVaga.MOTO) {
      return sTipo === TipoVaga.MOTO || sTipo === TipoVaga.CARRO;
    }

    // Caminhão só cabe em vaga de Caminhão
    if (vTipo === TipoVaga.CAMINHAO) {
      return sTipo === TipoVaga.CAMINHAO;
    }

    // Carro padrão cabe em vaga de Carro ou Caminhão
    return sTipo === TipoVaga.CARRO || sTipo === TipoVaga.CAMINHAO;
  }
}

class AlocadorVagasEngine {
  /**
   * @param {ICompatibilidadeVagaStrategy} [strategy]
   */
  constructor(strategy = new CompatibilidadePadraoStrategy()) {
    this.strategy = strategy;
  }

  filtrarVagasCompativeis(vagas = [], tipoVeiculo = 'CARRO') {
    return vagas.filter((vaga) => this.strategy.isCompativel(tipoVeiculo, vaga.tipo));
  }
}

module.exports = {
  ICompatibilidadeVagaStrategy,
  CompatibilidadePadraoStrategy,
  AlocadorVagasEngine,
};
