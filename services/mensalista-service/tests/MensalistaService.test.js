// Testes do cadastro de mensalistas: validação de CPF no back-end
const { Sequelize } = require('sequelize');
const { SqliteMensalistaRepository } = require('../src/repositories/SqliteMensalistaRepository');
const { MensalistaService } = require('../src/services/MensalistaService');

let repo;
let service;
beforeEach(() => {
  repo = new SqliteMensalistaRepository(new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false }), { seed: false });
  service = new MensalistaService(repo);
});
afterEach(() => repo.fechar());

const dados = (cpf, placa = 'ABC1D23') => ({ nome: 'Ana', cpf, placa, vencimento: '2026-12-10' });

test('cadastra mensalista com CPF válido', async () => {
  const m = await service.cadastrar(dados('529.982.247-25'));
  expect(m).toMatchObject({ nome: 'Ana', placa: 'ABC1D23', status: 'EM_DIA' });
});

test.each(['5299822472', '529982247251', '111.111.111-11', '529.982.247-26', 'abc'])(
  'recusa o CPF inválido %p com 400 (antes, 10 ou 12 dígitos passavam)',
  async (cpf) => {
    await expect(service.cadastrar(dados(cpf))).rejects.toMatchObject({ statusCode: 400 });
  }
);

test('recusa a segunda mensalidade para a mesma placa (409)', async () => {
  await service.cadastrar(dados('529.982.247-25'));
  await expect(service.cadastrar(dados('529.982.247-25'))).rejects.toMatchObject({ statusCode: 409 });
});

describe('Validação de placa', () => {
  test('normaliza a placa ("abc-1234" → "ABC1234")', async () => {
    expect((await service.cadastrar(dados('529.982.247-25', 'abc-1234'))).placa).toBe('ABC1234');
  });

  test.each(['', 'AB1234', 'ABCD123', '1234ABC', 'ABC12345'])('recusa a placa inválida %p com 400', async (placa) => {
    await expect(service.cadastrar(dados('529.982.247-25', placa))).rejects.toMatchObject({ statusCode: 400 });
  });

  test('recusa placa inválida também na alteração', async () => {
    const m = await service.cadastrar(dados('529.982.247-25'));
    await expect(service.atualizar(m.id, { placa: 'XYZ' })).rejects.toMatchObject({ statusCode: 400 });
  });
});
