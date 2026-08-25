const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// MVP: usuarios em memoria (substituir por banco na proxima iteracao)
const users = [
  {
    id: 1,
    nome: 'Administrador',
    email: 'admin@myparking.com',
    senha: bcrypt.hashSync('admin123', 10),
    perfil: 'ADMIN',
  },
  {
    id: 2,
    nome: 'Operador',
    email: 'operador@myparking.com',
    senha: bcrypt.hashSync('op123', 10),
    perfil: 'OPERADOR',
  },
];

const JWT_SECRET     = process.env.JWT_SECRET     || 'my-parking-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// POST /auth/login
exports.login = (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
  }

  const user = users.find(u => u.email === email);

  if (!user || !bcrypt.compareSync(senha, user.senha)) {
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  const payload = { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({ token, usuario: payload });
};

// GET /auth/me
exports.me = (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { iat, exp, ...usuario } = decoded;
    res.json({ usuario });
  } catch {
    res.status(401).json({ error: 'Token invalido ou expirado' });
  }
};
