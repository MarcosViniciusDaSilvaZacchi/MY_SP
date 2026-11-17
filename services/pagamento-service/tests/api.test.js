// Testes de API do pagamento-service (HTTP com Supertest)
const request = require('supertest');
const app = require('../src/app');
const router = require('../src/routes');

afterAll(() => router.repositorio.fechar());

describe('POST /pagamentos/calcular', () => {
  test('simulação: moto com 61 min → R$ 7,50', async () => {
    const res = await request(app).post('/pagamentos/calcular').send({ permanenciaMinutos: 61, tipoVeiculo: 'MOTO' });
    expect(res.status).toBe(200);
    expect(res.body.valorCalculado).toBe(7.5);
  });

  test.each([-30, 'abc'])('CT-06: permanência %p → 400', async (min) => {
    const res = await request(app).post('/pagamentos/calcular').send({ permanenciaMinutos: min });
    expect(res.status).toBe(400);
  });

  test('com movimentacaoId e o estacionamento-service fora do ar → 503 (não calcula com dados do cliente)', async () => {
    const res = await request(app).post('/pagamentos/calcular').send({ movimentacaoId: '1002', permanenciaMinutos: 5 });
    expect(res.status).toBe(503);
  });
});

describe('POST /pagamentos', () => {
  test('sem movimentacaoId ou forma → 400', async () => {
    const res = await request(app).post('/pagamentos').send({ forma: 'DINHEIRO', valor: 0.01 });
    expect(res.status).toBe(400);
  });
});

test('GET /pagamentos lista o pagamento de exemplo gravado no SQLite', async () => {
  const res = await request(app).get('/pagamentos');
  expect(res.status).toBe(200);
  expect(res.body.some((p) => p.id === '9001')).toBe(true);
});
