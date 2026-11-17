// Testes de integração do PagamentoService com o repositório SQLite (em memória)
// e um estacionamento-service simulado. Cobre CT-07, CT-08, CT-10 e CT-12 da N3.
const { Sequelize } = require('sequelize');
const { SqlitePagamentoRepository } = require('../src/repositories/SqlitePagamentoRepository');
const { TarifaEngine, TarifaPorPorteStrategy } = require('../src/domain/strategies/TarifaStrategy');
const { PagamentoService } = require('../src/services/PagamentoService');

// Movimentações "guardadas" no estacionamento-service simulado
const movimentacoes = {
  carro47: { id: 'carro47', tipo: 'ROTATIVO', tipoVeiculo: 'CARRO', status: 'ABERTA', permanenciaMinutos: 47 },
  carro61: { id: 'carro61', tipo: 'ROTATIVO', tipoVeiculo: 'CARRO', status: 'ABERTA', permanenciaMinutos: 61 },
  moto61: { id: 'moto61', tipo: 'ROTATIVO', tipoVeiculo: 'MOTO', status: 'ABERTA', permanenciaMinutos: 61 },
  encerrada: { id: 'encerrada', tipo: 'ROTATIVO', tipoVeiculo: 'CARRO', status: 'FINALIZADA', permanenciaMinutos: 90 },
  mensal: { id: 'mensal', tipo: 'MENSALISTA', tipoVeiculo: 'CARRO', status: 'ABERTA', permanenciaMinutos: 200 },
};
const estacionamentoClient = { buscarMovimentacao: async (id) => movimentacoes[id] || null };

let repo;
let service;
beforeEach(() => {
  repo = new SqlitePagamentoRepository(new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false }), { seed: false });
  service = new PagamentoService(repo, new TarifaEngine(new TarifaPorPorteStrategy()), estacionamentoClient);
});
afterEach(() => repo.fechar());

describe('Cálculo com os dados do servidor', () => {
  test('usa a permanência e o tipo de veículo da movimentação, ignorando o que o cliente envia', async () => {
    const r = await service.calcularTarifa({ movimentacaoId: 'carro61', permanenciaMinutos: 5 });
    expect(r).toMatchObject({ permanenciaMinutos: 61, tipoVeiculo: 'CARRO', valorCalculado: 15 });
  });

  test('moto com 61 min custa R$ 7,50 (CT-11)', async () => {
    expect((await service.calcularTarifa({ movimentacaoId: 'moto61' })).valorCalculado).toBe(7.5);
  });

  test('mensalista é isento', async () => {
    expect(await service.calcularTarifa({ movimentacaoId: 'mensal' })).toMatchObject({ valorCalculado: 0, isentoMensalista: true });
  });

  test('movimentação inexistente → 404', async () => {
    await expect(service.calcularTarifa({ movimentacaoId: 'x' })).rejects.toMatchObject({ statusCode: 404 });
  });

  test('simulação sem movimentação valida a permanência (CT-06)', async () => {
    await expect(service.calcularTarifa({ permanenciaMinutos: 'abc' })).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.calcularTarifa({ permanenciaMinutos: -30 })).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.calcularTarifa({})).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('Pagamento em dinheiro (F3-C1)', () => {
  test('CT-07: devido R$ 15,00, recebido R$ 20,00 → CONFIRMADO com troco de R$ 5,00', async () => {
    const p = await service.registrarPagamento({ movimentacaoId: 'carro61', forma: 'DINHEIRO', valorPago: 20 });
    expect(p).toMatchObject({ status: 'CONFIRMADO', valorCalculado: 15, valorPago: 20, troco: 5 });
  });

  test('CT-08: valor insuficiente é recusado (400) e nada é gravado', async () => {
    await expect(service.registrarPagamento({ movimentacaoId: 'carro61', forma: 'DINHEIRO', valorPago: 10 }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(await repo.listar()).toHaveLength(0);
  });
});

describe('Valor adulterado (BUG-01 / CT-10)', () => {
  test('CT-10: valor de R$ 0,01 enviado pelo cliente é ignorado; o devido é R$ 10,00 e o pagamento é recusado', async () => {
    await expect(service.registrarPagamento({
      movimentacaoId: 'carro47', forma: 'DINHEIRO', valor: 0.01, valorPago: 0.01, permanenciaMinutos: 5,
    })).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('10.00') });
    expect(await repo.listar()).toHaveLength(0);
  });

  test('no cartão, o valor cobrado é sempre o devido, não o enviado', async () => {
    const p = await service.registrarPagamento({ movimentacaoId: 'carro47', forma: 'CARTAO', valor: 0.01, valorPago: 0.01 });
    expect(p).toMatchObject({ status: 'CONFIRMADO', valorCalculado: 10, valorPago: 10 });
  });

  test('não aceita pagamento de movimentação encerrada (409) nem de mensalista (400)', async () => {
    await expect(service.registrarPagamento({ movimentacaoId: 'encerrada', forma: 'CARTAO' })).rejects.toMatchObject({ statusCode: 409 });
    await expect(service.registrarPagamento({ movimentacaoId: 'mensal', forma: 'CARTAO' })).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('PIX (CT-12)', () => {
  test('a cobrança PIX nasce PENDENTE mesmo sem "iniciarPix" e só confirma pela rota de confirmação', async () => {
    const p = await service.registrarPagamento({ movimentacaoId: 'carro47', forma: 'PIX' });
    expect(p).toMatchObject({ status: 'PENDENTE', valorCalculado: 10 });
    const confirmado = await service.confirmarPagamento(p.id);
    expect(confirmado.status).toBe('CONFIRMADO');
    expect((await service.buscarPorMovimentacaoId('carro47')).status).toBe('CONFIRMADO');
  });

  test('pagamento já confirmado não é cobrado de novo (idempotência)', async () => {
    const p1 = await service.registrarPagamento({ movimentacaoId: 'carro61', forma: 'CARTAO' });
    const p2 = await service.registrarPagamento({ movimentacaoId: 'carro61', forma: 'CARTAO' });
    expect(p2.id).toBe(p1.id);
    expect(await repo.listar()).toHaveLength(1);
  });
});

describe('Tolerância depois do pagamento', () => {
  const { Pagamento } = require('../src/domain/entities/PagamentoEntities');
  const pagoHa = (minutos, valor, movimentacaoId = 'carro61') => new Pagamento({
    id: `p${minutos}`, movimentacaoId, forma: 'CARTAO', valorCalculado: valor, valorPago: valor,
    status: 'CONFIRMADO', dataHora: new Date(Date.now() - minutos * 60000).toISOString(),
  });

  test('pagou há 5 min (dentro da tolerância de 15): quitado, nada a pagar e sem novo pagamento', async () => {
    await repo.salvar(pagoHa(5, 10)); // pagou R$ 10 quando a tarifa era R$ 10; agora é R$ 15
    const calc = await service.calcularTarifa({ movimentacaoId: 'carro61' });
    expect(calc).toMatchObject({ quitado: true, valorCalculado: 0, valorJaPago: 10, complementar: false });
    const p = await service.registrarPagamento({ movimentacaoId: 'carro61', forma: 'CARTAO' });
    expect(p.id).toBe('p5');
    expect(await repo.listar()).toHaveLength(1);
  });

  test('pagou há 20 min (tolerância expirada): cobra só a diferença de R$ 5,00', async () => {
    await repo.salvar(pagoHa(20, 10));
    const calc = await service.calcularTarifa({ movimentacaoId: 'carro61' });
    expect(calc).toMatchObject({ quitado: false, toleranciaExpirada: true, complementar: true, valorCalculado: 5, valorTotal: 15 });

    const sit = await service.buscarPorMovimentacaoId('carro61');
    expect(sit.situacaoSaida).toMatchObject({ quitado: false, saldoDevido: 5 });

    const comp = await service.registrarPagamento({ movimentacaoId: 'carro61', forma: 'DINHEIRO', valorPago: 5 });
    expect(comp).toMatchObject({ status: 'CONFIRMADO', valorCalculado: 5, detalhes: expect.objectContaining({ complementar: true }) });

    const depois = await service.buscarPorMovimentacaoId('carro61');
    expect(depois).toMatchObject({ valorTotalPago: 15, situacaoSaida: expect.objectContaining({ quitado: true }) });
  });

  test('tolerância expirada mas o valor pago ainda cobre a tarifa atual: quitado', async () => {
    await repo.salvar(pagoHa(30, 15)); // R$ 15 cobre até 2 h; carro61 está com 61 min
    expect(await service.calcularTarifa({ movimentacaoId: 'carro61' })).toMatchObject({ quitado: true, valorCalculado: 0 });
  });
});
