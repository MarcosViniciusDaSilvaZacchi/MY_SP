const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const AUTH_URL         = process.env.AUTH_SERVICE_URL           || 'http://localhost:3001';
const ESTACION_URL     = process.env.ESTACIONAMENTO_SERVICE_URL || 'http://localhost:3002';
const MENSALISTA_URL   = process.env.MENSALISTA_SERVICE_URL     || 'http://localhost:3003';
const PAGAMENTO_URL    = process.env.PAGAMENTO_SERVICE_URL      || 'http://localhost:3004';
const VAGA_URL         = process.env.VAGA_SERVICE_URL           || 'http://localhost:3005';

const proxy = (target, pathPrefix) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    // Preserva o prefixo removido pelo router.use()
    pathRewrite: pathPrefix
      ? (path) => pathPrefix + path
      : undefined,
    on: {
      error: (err, req, res) => res.status(502).json({ error: 'Servico indisponivel' }),
    },
  });

// ── Rotas publicas (sem autenticacao) ───────────────────────────
router.use('/auth', proxy(AUTH_URL, '/auth'));

// ── Rotas protegidas (token JWT obrigatorio) ─────────────────────
router.use('/entradas',      authMiddleware, proxy(ESTACION_URL,   '/entradas'));
router.use('/saidas',        authMiddleware, proxy(ESTACION_URL,   '/saidas'));
router.use('/movimentacoes', authMiddleware, proxy(ESTACION_URL,   '/movimentacoes'));
router.use('/relatorios',    authMiddleware, proxy(ESTACION_URL,   '/relatorios'));
router.use('/mensalistas',   authMiddleware, proxy(MENSALISTA_URL, '/mensalistas'));
router.use('/pagamentos',    authMiddleware, proxy(PAGAMENTO_URL,  '/pagamentos'));
router.use('/vagas',         authMiddleware, proxy(VAGA_URL,       '/vagas'));

module.exports = router;
