// ──────────────────────────────────────────────────────────────────
// Implementação em Memória do Repositório de Usuários (LSP / DIP)
// ──────────────────────────────────────────────────────────────────

const { IUsuarioRepository } = require('./IUsuarioRepository');
const { Usuario } = require('../domain/entities/Usuario');
const bcrypt = require('bcryptjs');

class InMemoryUsuarioRepository extends IUsuarioRepository {
  constructor() {
    super();
    this.usuarios = [
      new Usuario({
        id: 1,
        nome: 'Administrador',
        email: 'admin@myparking.com',
        senhaHash: bcrypt.hashSync('admin123', 10),
        perfil: 'ADMIN',
      }),
      new Usuario({
        id: 2,
        nome: 'Operador',
        email: 'operador@myparking.com',
        senhaHash: bcrypt.hashSync('op123', 10),
        perfil: 'OPERADOR',
      }),
    ];
  }

  async buscarPorEmail(email) {
    if (!email) return null;
    const norm = email.toLowerCase().trim();
    return this.usuarios.find((u) => u.email.toLowerCase() === norm) || null;
  }

  async buscarPorId(id) {
    return this.usuarios.find((u) => u.id === Number(id)) || null;
  }

  async listar() {
    return [...this.usuarios];
  }

  async salvar(usuario) {
    this.usuarios.push(usuario);
    return usuario;
  }

  async remover(id) {
    const idx = this.usuarios.findIndex((u) => u.id === Number(id));
    if (idx === -1) return false;
    this.usuarios.splice(idx, 1);
    return true;
  }
}

module.exports = { InMemoryUsuarioRepository };
