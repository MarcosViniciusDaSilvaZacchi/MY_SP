// ──────────────────────────────────────────────────────────────────
// Strategy Pattern para Compatibilidade de Vagas (OCP / LSP / SRP)
// C4 Nível 3: Vaga Strategy
// Responsabilidade: Determinar se um tipo de veículo pode ocupar um tipo de vaga.
//
// O estacionamento recebe apenas CARRO e MOTO (caminhão não entra).
// Os tipos de vaga são os do mapa: COMUM, PCD, IDOSO, GESTANTE e ELETRICO.
// O direito às vagas especiais (credencial PCD/idoso etc.) é conferido pelo operador.
// ──────────────────────────────────────────────────────────────────

const { TipoVaga } = require('../enums/VagaEnums');

const VEICULOS_ACEITOS = Object.freeze(['CARRO', 'MOTO']);

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
    const sTipo = String(tipoVaga || TipoVaga.COMUM).toUpperCase().trim();

    if (!VEICULOS_ACEITOS.includes(vTipo)) return false;
    if (!Object.values(TipoVaga).includes(sTipo)) return false;

    // Vaga de recarga é para carro elétrico; moto usa as demais
    if (sTipo === TipoVaga.ELETRICO) return vTipo === 'CARRO';
    return true;
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
  VEICULOS_ACEITOS,
  ICompatibilidadeVagaStrategy,
  CompatibilidadePadraoStrategy,
  AlocadorVagasEngine,
};
