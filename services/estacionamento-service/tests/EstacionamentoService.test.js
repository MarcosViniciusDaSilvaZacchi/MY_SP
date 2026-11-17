// Testes de integração do EstacionamentoService com o repositório SQLite (em memória)
// Cobre F1 (entrada) e a trava da cancela de F3 — casos CT-01 a CT-04, CT-09 e CT-12 da N3
const { Sequelize } = require('sequelize');
const { SqliteMovimentacaoRepository } = require('../src/repositories/SqliteMovimentacaoRepository');
const { EstacionamentoService } = require('../src/services/EstacionamentoService');
const { Movimentacao } = require('../src/domain/entities/Movimentacao');

const minutosAtras = (min) => new Date(Date.now() - min * 60000).toISOString();

function montar({ mensalista = null, pagamento = null } = {}) {
  const repo = new SqliteMovimentacaoRepository(
    new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false }),
    { seed: false }
  );
  const mensalistaClient = { verificarMensalistaPorPlaca: async () => mensalista };
  const pagamentoClient = { buscarPagamentoPorMovimentacao: async () => pagamento, listarPagamentos: async () => [] };
  return { repo, service: new EstacionamentoService(repo, mensalistaClient, pagamentoClient) };
}

describe('Entrada de veículo (F1)', () => {
  let ctx;
  beforeEach(() => { ctx = montar(); });
  afterEach(() => ctx.repo.fechar());

  test('CT-01: registra a entrada de um carro avulso como ABERTA e ROTATIVO', async () => {
    const mov = await ctx.service.registrarEntrada({ placa: 'BRA2E19' });
    expect(mov).toMatchObject({ placa: 'BRA2E19', status: 'ABERTA', tipo: 'ROTATIVO', tipoVeiculo: 'CARRO' });
    expect(mov.dataHoraEntrada).toBeTruthy();
  });

  test('CT-02: recusa a segunda entrada da mesma placa (409) sem criar outra movimentação', async () => {
    await ctx.service.registrarEntrada({ placa: 'BRA2E19' });
    await expect(ctx.service.registrarEntrada({ placa: 'bra-2e19' })).rejects.toMatchObject({ statusCode: 409 });
    expect(await ctx.repo.listar()).toHaveLength(1);
  });

  test('CT-03: recusa placa vazia (400)', async () => {
    await expect(ctx.service.registrarEntrada({ placa: '' })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('CT-04: recusa placa fora dos padrões antigo e Mercosul (400)', async () => {
    await expect(ctx.service.registrarEntrada({ placa: '12@' })).rejects.toMatchObject({ statusCode: 400 });
    await expect(ctx.service.registrarEntrada({ placa: '1234567' })).rejects.toMatchObject({ statusCode: 400 });
    expect(await ctx.repo.listar()).toHaveLength(0);
  });

  test('registra moto com tipoVeiculo MOTO', async () => {
    const mov = await ctx.service.registrarEntrada({ placa: 'MOT0A12', tipoVeiculo: 'moto' });
    expect(mov.tipoVeiculo).toBe('MOTO');
  });

  test('recusa caminhão, que o estacionamento não recebe (400)', async () => {
    await expect(ctx.service.registrarEntrada({ placa: 'CAM1234', tipoVeiculo: 'CAMINHAO' }))
      .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('Caminhões') });
  });

  test('aceita placa no padrão antigo com hífen e grava sem o hífen', async () => {
    const mov = await ctx.service.registrarEntrada({ placa: 'abc-1234' });
    expect(mov.placa).toBe('ABC1234');
  });
});

describe('Mensalista na entrada', () => {
  test('mensalista EM_DIA entra como MENSALISTA', async () => {
    const ctx = montar({ mensalista: { nome: 'Joao', status: 'EM_DIA' } });
    const mov = await ctx.service.registrarEntrada({ placa: 'XYZ9K88' });
    expect(mov).toMatchObject({ tipo: 'MENSALISTA', mensalistaNome: 'Joao' });
    await ctx.repo.fechar();
  });

  test('mensalista INADIMPLENTE tem a entrada negada (403)', async () => {
    const ctx = montar({ mensalista: { nome: 'Maria', status: 'INADIMPLENTE' } });
    await expect(ctx.service.registrarEntrada({ placa: 'DEF5G67' })).rejects.toMatchObject({ statusCode: 403 });
    await ctx.repo.fechar();
  });
});

describe('Busca por id (usada pelo pagamento-service)', () => {
  test('devolve a movimentação aberta com a permanência calculada no servidor', async () => {
    const ctx = montar();
    await ctx.repo.salvar(new Movimentacao({ id: 'm1', placa: 'ABC1D23', dataHoraEntrada: minutosAtras(47) }));
    const mov = await ctx.service.buscarPorId('m1');
    expect(mov).toMatchObject({ id: 'm1', status: 'ABERTA', tipoVeiculo: 'CARRO' });
    expect(mov.permanenciaMinutos).toBeGreaterThanOrEqual(47);
    await expect(ctx.service.buscarPorId('nao-existe')).rejects.toMatchObject({ statusCode: 404 });
    await ctx.repo.fechar();
  });
});

describe('Saída e trava da cancela (F3-C2)', () => {
  const avulso47min = () => new Movimentacao({ id: '1002', placa: 'ABC1D23', dataHoraEntrada: minutosAtras(47) });

  test('CT-09: bloqueia a saída sem pagamento (402) e a movimentação continua ABERTA', async () => {
    const ctx = montar({ pagamento: null });
    await ctx.repo.salvar(avulso47min());
    await expect(ctx.service.registrarSaida({ movimentacaoId: '1002' })).rejects.toMatchObject({ statusCode: 402 });
    expect((await ctx.repo.buscarPorId('1002')).status).toBe('ABERTA');
    await ctx.repo.fechar();
  });

  test('CT-12: bloqueia a saída com PIX PENDENTE (402) pedindo a confirmação', async () => {
    const ctx = montar({ pagamento: { status: 'PENDENTE', valorCalculado: 10 } });
    await ctx.repo.salvar(avulso47min());
    await expect(ctx.service.registrarSaida({ movimentacaoId: '1002' }))
      .rejects.toMatchObject({ statusCode: 402, message: expect.stringContaining('PIX') });
    await ctx.repo.fechar();
  });

  test('libera a saída com pagamento CONFIRMADO e grava o valor calculado pelo servidor', async () => {
    const ctx = montar({ pagamento: { status: 'CONFIRMADO', valorCalculado: 10 } });
    await ctx.repo.salvar(avulso47min());
    // o valorCobrado enviado pelo cliente é ignorado
    const saida = await ctx.service.registrarSaida({ movimentacaoId: '1002', valorCobrado: 0.01 });
    expect(saida).toMatchObject({ status: 'FINALIZADA', valorCobrado: 10 });
    await ctx.repo.fechar();
  });

  test('avulso dentro da carência (até 10 min) sai sem pagamento', async () => {
    const ctx = montar({ pagamento: null });
    await ctx.repo.salvar(new Movimentacao({ id: 'c1', placa: 'BRA2E19', dataHoraEntrada: minutosAtras(5) }));
    const saida = await ctx.service.registrarSaida({ movimentacaoId: 'c1' });
    expect(saida).toMatchObject({ status: 'FINALIZADA', valorCobrado: 0 });
    await ctx.repo.fechar();
  });
});

describe('Tolerância depois do pagamento (saída)', () => {
  const avulso = () => new Movimentacao({ id: 't1', placa: 'ABC1D23', dataHoraEntrada: minutosAtras(80) });

  test('bloqueia a saída (402) quando a tolerância expirou e há diferença a pagar', async () => {
    const ctx = montar({ pagamento: {
      status: 'CONFIRMADO', valorCalculado: 10, valorTotalPago: 10,
      situacaoSaida: { quitado: false, saldoDevido: 5, toleranciaMinutos: 15 },
    } });
    await ctx.repo.salvar(avulso());
    await expect(ctx.service.registrarSaida({ movimentacaoId: 't1' }))
      .rejects.toMatchObject({ statusCode: 402, message: expect.stringContaining('5.00') });
    expect((await ctx.repo.buscarPorId('t1')).status).toBe('ABERTA');
    await ctx.repo.fechar();
  });

  test('com o complementar pago, registra o total pago (R$ 15,00)', async () => {
    const ctx = montar({ pagamento: {
      status: 'CONFIRMADO', valorCalculado: 5, valorTotalPago: 15,
      situacaoSaida: { quitado: true, saldoDevido: 0, toleranciaMinutos: 15 },
    } });
    await ctx.repo.salvar(avulso());
    expect(await ctx.service.registrarSaida({ movimentacaoId: 't1' })).toMatchObject({ status: 'FINALIZADA', valorCobrado: 15 });
    await ctx.repo.fechar();
  });
});

describe('Cancela física (Fase 2 — ESP32)', () => {
  const montarComCancela = (respostaCancela) => {
    const chamadas = [];
    const repo = new SqliteMovimentacaoRepository(
      new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false }),
      { seed: false }
    );
    const dispositivosClient = { abrirCancela: async (dados) => { chamadas.push(dados); return respostaCancela; } };
    const service = new EstacionamentoService(
      repo,
      { verificarMensalistaPorPlaca: async () => null },
      { buscarPagamentoPorMovimentacao: async () => null, listarPagamentos: async () => [] },
      undefined, undefined, undefined,
      dispositivosClient
    );
    return { repo, service, chamadas };
  };

  test('entrada registrada manda abrir a cancela no sentido ENTRADA', async () => {
    const ctx = montarComCancela({ id: 'c1', status: 'PENDENTE', dispositivoOnline: true });
    const mov = await ctx.service.registrarEntrada({ placa: 'BRA2E19' });
    expect(ctx.chamadas).toEqual([expect.objectContaining({ sentido: 'ENTRADA', placa: 'BRA2E19', movimentacaoId: mov.id })]);
    expect(mov.cancela).toEqual({ acionada: true, comandoId: 'c1', dispositivoOnline: true });
    await ctx.repo.fechar();
  });

  test('saída liberada manda abrir no sentido SAIDA', async () => {
    const ctx = montarComCancela({ id: 'c2', status: 'PENDENTE', dispositivoOnline: true });
    await ctx.repo.salvar(new Movimentacao({ id: 'c9', placa: 'BRA2E19', dataHoraEntrada: minutosAtras(5) }));
    const saida = await ctx.service.registrarSaida({ movimentacaoId: 'c9' });
    expect(ctx.chamadas[0]).toMatchObject({ sentido: 'SAIDA', movimentacaoId: 'c9' });
    expect(saida.cancela.acionada).toBe(true);
    await ctx.repo.fechar();
  });

  test('sem dispositivo, a entrada vale do mesmo jeito e informa que a cancela não foi acionada', async () => {
    const ctx = montarComCancela(null);
    const mov = await ctx.service.registrarEntrada({ placa: 'BRA2E19' });
    expect(mov).toMatchObject({ status: 'ABERTA', cancela: { acionada: false } });
    await ctx.repo.fechar();
  });

  test('saída bloqueada (402) não abre a cancela', async () => {
    const ctx = montarComCancela({ id: 'c3', status: 'PENDENTE', dispositivoOnline: true });
    await ctx.repo.salvar(new Movimentacao({ id: 'b1', placa: 'BRA2E19', dataHoraEntrada: minutosAtras(47) }));
    await expect(ctx.service.registrarSaida({ movimentacaoId: 'b1' })).rejects.toMatchObject({ statusCode: 402 });
    expect(ctx.chamadas).toHaveLength(0);
    await ctx.repo.fechar();
  });
});
