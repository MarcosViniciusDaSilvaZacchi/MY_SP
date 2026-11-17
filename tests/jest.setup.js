// Configuração comum dos testes automatizados (npm test)
// Banco SQLite em memória: os testes nunca tocam nos arquivos database_*.sqlite
process.env.DB_STORAGE = ':memory:';
// Endereços inexistentes: os testes de API não conversam com um sistema que esteja rodando
process.env.MENSALISTA_SERVICE_URL = 'http://127.0.0.1:9';
process.env.PAGAMENTO_SERVICE_URL = 'http://127.0.0.1:9';
process.env.ESTACIONAMENTO_SERVICE_URL = 'http://127.0.0.1:9';
