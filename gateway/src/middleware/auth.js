const jwt = require('jsonwebtoken');

/**
 * Middleware JWT — verifica o header Authorization: Bearer <token>
 * Injeta req.user com os dados do payload decodificado.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my-parking-secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido ou expirado' });
  }
}

module.exports = authMiddleware;
