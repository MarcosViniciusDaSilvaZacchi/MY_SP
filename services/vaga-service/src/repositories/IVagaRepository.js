// ──────────────────────────────────────────────────────────────────
// Interface do Repositório de Vagas (DIP & LSP & ISP)
// C4 Nível 3: Vaga Repository
// ──────────────────────────────────────────────────────────────────

class IVagaRepository {
  async listar(filtros = {}) {
    throw new Error('Método listar() não implementado');
  }

  async buscarPorId(id) {
    throw new Error('Método buscarPorId() não implementado');
  }

  async atualizarStatus(id, status) {
    throw new Error('Método atualizarStatus() não implementado');
  }
}

module.exports = { IVagaRepository };
