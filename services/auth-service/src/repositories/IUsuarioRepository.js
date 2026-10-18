// ──────────────────────────────────────────────────────────────────
// Interface / Contrato de Repositório de Usuários (DIP & LSP & ISP)
// ──────────────────────────────────────────────────────────────────

class IUsuarioRepository {
  async buscarPorEmail(email) {
    throw new Error('Método buscarPorEmail() não implementado');
  }

  async buscarPorId(id) {
    throw new Error('Método buscarPorId() não implementado');
  }

  async listar() {
    throw new Error('Método listar() não implementado');
  }

  async salvar(usuario) {
    throw new Error('Método salvar() não implementado');
  }

  async remover(id) {
    throw new Error('Método remover() não implementado');
  }
}

module.exports = { IUsuarioRepository };
