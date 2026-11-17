require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3006;
const SERVICE_NAME = 'dispositivos-service';

app.use(cors());
app.use(express.json({ limit: '16kb' }));
// O sync do ESP32 chega a cada ~500 ms: não polui o log com ele
app.use(morgan('dev', {
  skip: (req) => process.env.NODE_ENV === 'test' || (req.method === 'POST' && req.path.endsWith('/sync')),
}));

app.use('/', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, timestamp: new Date() });
});

app.use((req, res) => res.status(404).json({ error: 'Rota nao encontrada' }));

// Só sobe o servidor quando executado direto (node src/app.js); nos testes o app é importado
if (require.main === module) {
  // 0.0.0.0: aceita conexões da rede local (o ESP32 não está no localhost)
  app.listen(PORT, '0.0.0.0', () => console.log(`[${SERVICE_NAME}] Rodando na porta ${PORT}`));
}
module.exports = app;
