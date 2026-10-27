// ──────────────────────────────────────────────────────────────────
// VagaService (Application Service / Use Case - SRP & DIP)
// Orquestra a listagem, disponibilidade, compatibilidade e atualização de status de vagas
// ──────────────────────────────────────────────────────────────────

const { AlocadorVagasEngine } = require('../domain/strategies/CompatibilidadeVagaStrategy');

class VagaService {
  /**
   * @param {import('../repositories/IVagaRepository').IVagaRepository} vagaRepository
   * @param {import('../domain/services/DisponibilidadeCalculator').DisponibilidadeCalculator} disponibilidadeCalculator
   * @param {AlocadorVagasEngine} [alocadorEngine]
   */
  constructor(
    vagaRepository,
    disponibilidadeCalculator,
    alocadorEngine = new AlocadorVagasEngine()
  ) {
    this.vagaRepository = vagaRepository;
    this.disponibilidadeCalculator = disponibilidadeCalculator;
    this.alocadorEngine = alocadorEngine;
  }

  async listarVagas(filtros = {}) {
    const vagas = await this.vagaRepository.listar(filtros);
    return vagas.map((v) => (typeof v.toJSON === 'function' ? v.toJSON() : v));
  }

  async listarCompativeis(tipoVeiculo = 'CARRO') {
    const vagasLivres = await this.vagaRepository.listar({ status: 'LIVRE' });
    const compativeis = this.alocadorEngine.filtrarVagasCompativeis(vagasLivres, tipoVeiculo);
    return compativeis.map((v) => (typeof v.toJSON === 'function' ? v.toJSON() : v));
  }

  async obterDisponibilidade() {
    const todasVagas = await this.vagaRepository.listar();
    return this.disponibilidadeCalculator.calcularMetricas(todasVagas);
  }

  async atualizarStatus(id, novoStatus) {
    if (!novoStatus) {
      const err = new Error('Status é obrigatório');
      err.statusCode = 400;
      throw err;
    }

    const vagaAtualizada = await this.vagaRepository.atualizarStatus(id, novoStatus);
    if (!vagaAtualizada) {
      const err = new Error('Vaga nao encontrada');
      err.statusCode = 404;
      throw err;
    }

    return vagaAtualizada.toJSON();
  }
}

module.exports = { VagaService };
