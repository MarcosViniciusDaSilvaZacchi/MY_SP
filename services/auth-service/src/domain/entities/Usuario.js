// ──────────────────────────────────────────────────────────────────
// Entidade Usuario (Domínio) - SRP: Representa os dados e regras de Usuário
// ──────────────────────────────────────────────────────────────────

class Usuario {
  constructor({ id, nome, email, senhaHash, perfil }) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senhaHash = senhaHash;
    this.perfil = perfil;
  }

  validar() {
    if (!this.email || !this.email.includes('@')) {
      throw new Error('E-mail inválido');
    }
    if (!this.nome || this.nome.trim() === '') {
      throw new Error('Nome é obrigatório');
    }
    if (!this.perfil) {
      throw new Error('Perfil é obrigatório');
    }
  }

  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      perfil: this.perfil,
    };
  }
}

module.exports = { Usuario };
