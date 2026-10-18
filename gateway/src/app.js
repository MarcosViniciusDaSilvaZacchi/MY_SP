require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
// IMPORTANTE: NAO usar express.json() antes das rotas de proxy.
// O body deve chegar como stream para o microservico destino.
// express.json() apenas para rotas proprias do gateway (health, etc.)
app.use(morgan('dev'));

// Todas as rotas da API
app.use('/api', routes);

// Health check do gateway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gateway', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada' });
});

app.listen(PORT, () => {
  console.log(`[Gateway] Rodando na porta ${PORT}`);
});

module.exports = app;
