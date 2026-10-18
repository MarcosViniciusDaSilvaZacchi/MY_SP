// ──────────────────────────────────────────────────────────────────
// VagaService (Application Service / Use Case - SRP & DIP)
// Orquestra a listagem, disponibilidade e atualização de status de vagas
// ──────────────────────────────────────────────────────────────────

class VagaService {
  /**
   * @param {import('../repositories/IVagaRepository').IVagaRepository} vagaRepository
   * @param {import('../domain/services/DisponibilidadeCalculator').DisponibilidadeCalculator} disponibilidadeCalculator
   */
  constructor(vagaRepository, disponibilidadeCalculator) {
    this.vagaRepository = vagaRepository;
    this.disponibilidadeCalculator = disponibilidadeCalculator;
  }

  async listarVagas(filtros = {}) {
    const vagas = await this.vagaRepository.listar(filtros);
    return vagas.map((v) => (typeof v.toJSON === 'function' ? v.toJSON() : v));
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
