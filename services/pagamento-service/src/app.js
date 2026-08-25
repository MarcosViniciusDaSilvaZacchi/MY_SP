require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3004;
const SERVICE_NAME = 'pagamento-service';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// TODO: importar e usar rotas do servico
// const routes = require('./routes');
// app.use('/', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME, timestamp: new Date() });
});

app.use((req, res) => res.status(404).json({ error: 'Rota nao encontrada' }));

app.listen(PORT, () => console.log(`[${SERVICE_NAME}] Rodando na porta ${PORT}`));

module.exports = app;
