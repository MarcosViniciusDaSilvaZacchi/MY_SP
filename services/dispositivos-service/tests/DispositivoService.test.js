// Testes do DispositivoService (Fase 2 — ESP32 + servo + 2 HC-SR04) com relógio controlado
const { DispositivoService } = require('../src/services/DispositivoService');
const {
  InMemoryDispositivoRepository, InMemoryComandoRepository, InMemoryEventoRepository,
} = require('../src/repositories/Repositorios');

let agora;
let service;
const ID = 'esp32-cancela-01';
const avancar = (ms) => { agora += ms; };

beforeEach(() => {
  agora = Date.parse('2026-11-17T12:00:00Z');
  service = new DispositivoService({
    dispositivoRepository: new InMemoryDispositivoRepository(),
    comandoRepository: new InMemoryComandoRepository(),
    eventoRepository: new InMemoryEventoRepository(),
    relogio: () => agora,
    config: { dispositivoPadrao: ID },
  });
});

const tipos = async () => (await service.listarEventos({ limite: 100 })).map((e) => e.tipo).reverse();

describe('Sync do ESP32', () => {
  test('primeiro sync registra o dispositivo como online e sem comando', async () => {
    const r = await service.sincronizar(ID, {
      ip: '192.168.0.50', rssi: -60, firmware: '1.0.0', cancela: 'FECHADA',
      sensores: { ENTRADA: { distanciaCm: 42 }, SAIDA: { distanciaCm: 80 } },
    });
    expect(r.comando).toBeNull();
    const [d] = await service.listarDispositivos();
    expect(d).toMatchObject({ id: ID, online: true, ip: '192.168.0.50', cancela: 'FECHADA' });
    expect(d.sensores.ENTRADA.distanciaCm).toBe(42);
    expect(await tipos()).toEqual(['DISPOSITIVO_ONLINE']);
  });

  test('fica offline depois de 5 s sem sync, e volta a registrar DISPOSITIVO_ONLINE', async () => {
    await service.sincronizar(ID, {});
    avancar(6000);
    expect((await service.listarDispositivos())[0].online).toBe(false);
    await service.sincronizar(ID, {});
    expect((await tipos()).filter((t) => t === 'DISPOSITIVO_ONLINE')).toHaveLength(2);
  });

  test('id de dispositivo inválido → 400', async () => {
    await expect(service.sincronizar('../etc', {})).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('Comandos da cancela', () => {
  test('fluxo completo: comando criado → entregue no sync → executado com CANCELA_ABERTA', async () => {
    await service.sincronizar(ID, {});
    const cmd = await service.enviarComando({ acao: 'ABRIR', sentido: 'ENTRADA', origem: 'ENTRADA_REGISTRADA', placa: 'BRA2E19' });
    expect(cmd).toMatchObject({ status: 'PENDENTE', dispositivoId: ID, dispositivoOnline: true });

    const r = await service.sincronizar(ID, {});
    expect(r.comando).toEqual({ id: cmd.id, acao: 'ABRIR', sentido: 'ENTRADA' });
    // sync seguinte, antes do prazo de reenvio: não entrega de novo
    expect((await service.sincronizar(ID, {})).comando).toBeNull();

    await service.registrarEvento(ID, { tipo: 'CANCELA_ABERTA', sentido: 'ENTRADA', comandoId: cmd.id });
    const [c] = await service.listarComandos();
    expect(c.status).toBe('EXECUTADO');
    expect((await service.listarDispositivos())[0].cancela).toBe('ABERTA');
  });

  test('reentrega o comando se o ESP32 não confirmar em 3 s', async () => {
    const cmd = await service.enviarComando({ acao: 'ABRIR', sentido: 'SAIDA' });
    expect((await service.sincronizar(ID, {})).comando.id).toBe(cmd.id);
    avancar(3500);
    expect((await service.sincronizar(ID, {})).comando.id).toBe(cmd.id);
    expect((await service.listarComandos())[0].tentativas).toBe(2);
  });

  test('comando não executado em 30 s expira', async () => {
    await service.enviarComando({ acao: 'ABRIR', sentido: 'ENTRADA' });
    avancar(31000);
    expect((await service.sincronizar(ID, {})).comando).toBeNull();
    expect((await service.listarComandos())[0].status).toBe('EXPIRADO');
    expect(await tipos()).toContain('COMANDO_EXPIRADO');
  });

  test('clique duplo não enfileira dois comandos iguais', async () => {
    const a = await service.enviarComando({ acao: 'ABRIR', sentido: 'ENTRADA' });
    const b = await service.enviarComando({ acao: 'ABRIR', sentido: 'ENTRADA' });
    expect(b).toMatchObject({ id: a.id, repetido: true });
    expect(await service.listarComandos()).toHaveLength(1);
  });

  test('FECHAR substitui um ABRIR ainda na fila', async () => {
    await service.enviarComando({ acao: 'ABRIR', sentido: 'ENTRADA' });
    const f = await service.enviarComando({ acao: 'FECHAR', sentido: 'ENTRADA' });
    expect((await service.sincronizar(ID, {})).comando).toMatchObject({ id: f.id, acao: 'FECHAR' });
    const abrir = (await service.listarComandos()).find((c) => c.acao === 'ABRIR');
    expect(abrir).toMatchObject({ status: 'FALHOU', motivo: 'Substituído por FECHAR' });
  });

  test('COMANDO_RECUSADO marca o comando como FALHOU com o motivo', async () => {
    const cmd = await service.enviarComando({ acao: 'FECHAR', sentido: 'SAIDA' });
    await service.sincronizar(ID, {});
    await service.registrarEvento(ID, { tipo: 'COMANDO_RECUSADO', comandoId: cmd.id, detalhe: 'Veículo sob a cancela' });
    expect((await service.listarComandos())[0]).toMatchObject({ status: 'FALHOU', motivo: 'Veículo sob a cancela' });
  });

  test.each([
    [{ acao: 'GIRAR', sentido: 'ENTRADA' }],
    [{ acao: 'ABRIR', sentido: 'LATERAL' }],
    [{ acao: 'ABRIR' }],
  ])('comando inválido %p → 400', async (dados) => {
    await expect(service.enviarComando(dados)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('Eventos dos sensores HC-SR04', () => {
  test('VEICULO_DETECTADO / VEICULO_SAIU atualizam o veículo aguardando da faixa', async () => {
    await service.registrarEvento(ID, { tipo: 'VEICULO_DETECTADO', sentido: 'ENTRADA', distanciaCm: 8 });
    let [d] = await service.listarDispositivos();
    expect(d.veiculoAguardando).toEqual({ ENTRADA: true, SAIDA: false });
    expect(d.sensores.ENTRADA.distanciaCm).toBe(8);

    await service.registrarEvento(ID, { tipo: 'VEICULO_SAIU', sentido: 'ENTRADA', distanciaCm: 50 });
    [d] = await service.listarDispositivos();
    expect(d.veiculoAguardando.ENTRADA).toBe(false);
  });

  test('evento de sensor sem sentido → 400', async () => {
    await expect(service.registrarEvento(ID, { tipo: 'VEICULO_DETECTADO' })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('o ESP32 não pode forjar eventos do servidor (ex.: COMANDO_CRIADO) → 400', async () => {
    await expect(service.registrarEvento(ID, { tipo: 'COMANDO_CRIADO' })).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.registrarEvento(ID, { tipo: 'QUALQUER' })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('lista eventos do mais recente para o mais antigo, com limite e filtro por tipo', async () => {
    await service.registrarEvento(ID, { tipo: 'VEICULO_DETECTADO', sentido: 'ENTRADA' });
    avancar(1000);
    await service.registrarEvento(ID, { tipo: 'VEICULO_SAIU', sentido: 'ENTRADA' });
    const lista = await service.listarEventos({ limite: 1 });
    expect(lista).toHaveLength(1);
    expect(lista[0].tipo).toBe('VEICULO_SAIU');
    expect(await service.listarEventos({ tipo: 'VEICULO_DETECTADO' })).toHaveLength(1);
  });
});
