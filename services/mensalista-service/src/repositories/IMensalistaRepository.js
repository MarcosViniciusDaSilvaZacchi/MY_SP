// ──────────────────────────────────────────────────────────────────
// Interface do Repositório de Mensalistas (DIP & LSP & ISP)
// C4 Nível 3: Mensalista Repository
// ──────────────────────────────────────────────────────────────────

class IMensalistaRepository {
  async listar(filtroPlaca) {
    throw new Error('Método listar() não implementado');
  }

  async buscarPorId(id) {
    throw new Error('Método buscarPorId() não implementado');
  }

  async buscarPorPlaca(placa) {
    throw new Error('Método buscarPorPlaca() não implementado');
  }

  async salvar(mensalista) {
    throw new Error('Método salvar() não implementado');
  }

  async atualizar(id, dados) {
    throw new Error('Método atualizar() não implementado');
  }
}

module.exports = { IMensalistaRepository };
