// ──────────────────────────────────────────────────────────────────
// AuthService (Application Service / Use Case - SRP & DIP)
// Orquestra a autenticação e validação de tokens sem se acoplar a frameworks web
// ──────────────────────────────────────────────────────────────────

class AuthService {
  /**
   * @param {import('../repositories/IUsuarioRepository').IUsuarioRepository} usuarioRepository
   * @param {import('../security/SecurityServices').IJwtService} jwtService
   * @param {import('../security/SecurityServices').IPasswordHasher} passwordHasher
   */
  constructor(usuarioRepository, jwtService, passwordHasher) {
    this.usuarioRepository = usuarioRepository;
    this.jwtService = jwtService;
    this.passwordHasher = passwordHasher;
  }

  async login(email, senha) {
    if (!email || !senha) {
      const error = new Error('Email e senha são obrigatórios');
      error.statusCode = 400;
      throw error;
    }

    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      const error = new Error('Credenciais inválidas');
      error.statusCode = 401;
      throw error;
    }

    const senhaValida = this.passwordHasher.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      const error = new Error('Credenciais inválidas');
      error.statusCode = 401;
      throw error;
    }

    const payload = usuario.toJSON();
    const token = this.jwtService.gerarToken(payload);

    return {
      token,
      usuario: payload,
    };
  }

  async obterUsuarioPorToken(token) {
    if (!token) {
      const error = new Error('Token não fornecido');
      error.statusCode = 401;
      throw error;
    }

    try {
      const decoded = this.jwtService.verificarToken(token);
      const { iat, exp, ...usuario } = decoded;
      return { usuario };
    } catch {
      const error = new Error('Token inválido ou expirado');
      error.statusCode = 401;
      throw error;
    }
  }

  async listarUsuarios() {
    const lista = await this.usuarioRepository.listar();
    return lista.map((u) => (typeof u.toJSON === 'function' ? u.toJSON() : u));
  }

  async criarUsuario({ nome, email, senha, perfil = 'OPERADOR' }) {
    if (!nome || !email || !senha) {
      const error = new Error('Nome, e-mail e senha são obrigatórios');
      error.statusCode = 400;
      throw error;
    }

    const existente = await this.usuarioRepository.buscarPorEmail(email);
    if (existente) {
      const error = new Error('Já existe um usuário cadastrado com este e-mail');
      error.statusCode = 409;
      throw error;
    }

    const { Usuario } = require('../domain/entities/Usuario');
    const lista = await this.usuarioRepository.listar();
    const novoId = lista.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;

    const novoUsuario = new Usuario({
      id: novoId,
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      senhaHash: this.passwordHasher.hash(senha),
      perfil: String(perfil || 'OPERADOR').toUpperCase(),
    });

    novoUsuario.validar();
    await this.usuarioRepository.salvar(novoUsuario);
    return novoUsuario.toJSON();
  }

  async removerUsuario(id) {
    if (Number(id) === 1) {
      const error = new Error('Não é permitido remover o administrador principal');
      error.statusCode = 403;
      throw error;
    }
    const removido = await this.usuarioRepository.remover(id);
    if (!removido) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Usuário removido com sucesso' };
  }
}

module.exports = { AuthService };
