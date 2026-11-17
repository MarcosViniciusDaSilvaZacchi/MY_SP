// Testes de API do estacionamento-service (HTTP com Supertest)
const request = require('supertest');
const app = require('../src/app');
const router = require('../src/routes');

afterAll(() => router.repositorio.fechar());

test('POST /entradas com placa válida → 201', async () => {
  const res = await request(app).post('/entradas').send({ placa: 'BRA2E19', tipoVeiculo: 'MOTO' });
  expect(res.status).toBe(201);
  expect(res.body).toMatchObject({ placa: 'BRA2E19', tipoVeiculo: 'MOTO', status: 'ABERTA' });
});

test('POST /entradas com placa "12@" → 400 (CT-04)', async () => {
  const res = await request(app).post('/entradas').send({ placa: '12@' });
  expect(res.status).toBe(400);
});

test('GET /movimentacoes/:id devolve a movimentação de exemplo 1002 com a permanência', async () => {
  const res = await request(app).get('/movimentacoes/1002');
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ id: '1002', placa: 'ABC1D23', status: 'ABERTA', tipoVeiculo: 'CARRO' });
  expect(res.body.permanenciaMinutos).toBeGreaterThanOrEqual(45);
});

test('GET /movimentacoes/:id inexistente → 404', async () => {
  const res = await request(app).get('/movimentacoes/nao-existe');
  expect(res.status).toBe(404);
});

test('POST /saidas sem pagamento → 402 (pagamento-service fora do ar conta como não pago)', async () => {
  const res = await request(app).post('/saidas').send({ movimentacaoId: '1002' });
  expect(res.status).toBe(402);
});
