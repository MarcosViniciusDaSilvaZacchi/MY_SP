// ──────────────────────────────────────────────────────────────────
// Interface do Repositório de Movimentações (DIP & LSP & ISP)
// C4 Nível 3: Movimentação Repository
// ──────────────────────────────────────────────────────────────────

class IMovimentacaoRepository {
  async listar() {
    throw new Error('Método listar() não implementado');
  }

  async buscarAbertaPorPlaca(placa) {
    throw new Error('Método buscarAbertaPorPlaca() não implementado');
  }

  async buscarAbertaPorId(id) {
    throw new Error('Método buscarAbertaPorId() não implementado');
  }

  async salvar(movimentacao) {
    throw new Error('Método salvar() não implementado');
  }

  async atualizar(movimentacao) {
    throw new Error('Método atualizar() não implementado');
  }
}

module.exports = { IMovimentacaoRepository };
