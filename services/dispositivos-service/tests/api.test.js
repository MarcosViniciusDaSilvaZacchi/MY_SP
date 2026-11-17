// Testes de API do dispositivos-service (HTTP com Supertest)
const request = require('supertest');
const app = require('../src/app');
const router = require('../src/routes');

const CHAVE = 'my-parking-esp32-key';
afterAll(() => router.repositorio.fechar());

describe('Autenticação do ESP32 (X-Device-Key)', () => {
  test('sync sem chave → 401', async () => {
    expect((await request(app).post('/dispositivos/esp-api/sync').send({})).status).toBe(401);
  });

  test('sync com chave errada → 401', async () => {
    const res = await request(app).post('/dispositivos/esp-api/sync').set('X-Device-Key', 'errada').send({});
    expect(res.status).toBe(401);
  });
});

describe('Fluxo HTTP completo', () => {
  test('comando pelo sistema → ESP32 busca no sync → confirma com evento', async () => {
    const cmd = await request(app).post('/dispositivos/comandos')
      .send({ acao: 'ABRIR', sentido: 'SAIDA', dispositivoId: 'esp-api', origem: 'SAIDA_LIBERADA' });
    expect(cmd.status).toBe(202);

    const sync = await request(app).post('/dispositivos/esp-api/sync').set('X-Device-Key', CHAVE)
      .send({ cancela: 'FECHADA', sensores: { SAIDA: { distanciaCm: 6, presenca: true } } });
    expect(sync.status).toBe(200);
    expect(sync.body.comando).toMatchObject({ id: cmd.body.id, acao: 'ABRIR', sentido: 'SAIDA' });

    const ev = await request(app).post('/dispositivos/esp-api/eventos').set('X-Device-Key', CHAVE)
      .send({ tipo: 'CANCELA_ABERTA', sentido: 'SAIDA', comandoId: cmd.body.id });
    expect(ev.status).toBe(201);

    const d = await request(app).get('/dispositivos/esp-api');
    expect(d.body).toMatchObject({ online: true, cancela: 'ABERTA', veiculoAguardando: { SAIDA: true } });
    expect(d.body.comandosPendentes).toHaveLength(0);

    const eventos = await request(app).get('/dispositivos/eventos?limite=10');
    expect(eventos.body.map((e) => e.tipo)).toEqual(expect.arrayContaining(['COMANDO_CRIADO', 'DISPOSITIVO_ONLINE', 'CANCELA_ABERTA']));
  });

  test('comando inválido → 400; dispositivo desconhecido → 404', async () => {
    expect((await request(app).post('/dispositivos/comandos').send({ acao: 'X', sentido: 'ENTRADA' })).status).toBe(400);
    expect((await request(app).get('/dispositivos/nunca-conectou')).status).toBe(404);
  });
});
