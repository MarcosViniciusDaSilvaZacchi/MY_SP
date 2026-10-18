// ──────────────────────────────────────────────────────────────────
// AuthController (Adapter HTTP - SRP)
// Responsabilidade única: receber requisição HTTP, acionar o serviço e responder HTTP
// ──────────────────────────────────────────────────────────────────

class AuthController {
  /**
   * @param {import('../services/AuthService').AuthService} authService
   */
  constructor(authService) {
    this.authService = authService;
  }

  login = async (req, res) => {
    try {
      const { email, senha } = req.body;
      const resultado = await this.authService.login(email, senha);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro interno de autenticação' });
    }
  };

  me = async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token nao fornecido' });
      }

      const token = authHeader.split(' ')[1];
      const resultado = await this.authService.obterUsuarioPorToken(token);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao validar sessão' });
    }
  };

  listarUsuarios = async (_req, res) => {
    try {
      const usuarios = await this.authService.listarUsuarios();
      return res.status(200).json(usuarios);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao listar usuários' });
    }
  };

  criarUsuario = async (req, res) => {
    try {
      const novo = await this.authService.criarUsuario(req.body);
      return res.status(201).json(novo);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao cadastrar usuário' });
    }
  };

  removerUsuario = async (req, res) => {
    try {
      const { id } = req.params;
      const resultado = await this.authService.removerUsuario(id);
      return res.status(200).json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ error: err.message || 'Erro ao remover usuário' });
    }
  };
}

module.exports = { AuthController };
