require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date() });
});

app.use((req, res) => res.status(404).json({ error: 'Rota nao encontrada' }));

app.listen(PORT, () => console.log(`[Auth Service] Rodando na porta ${PORT}`));

module.exports = app;
