// Teste de persistência (BUG-05 / CT-13 da N3)
// Grava em um arquivo SQLite, fecha a conexão (como num reinício do serviço),
// abre de novo e confere que os dados continuam lá — nos 5 microsserviços.
const fs = require('fs');
const os = require('os');
const path = require('path');

const svc = (nome, arquivo) => require(path.join(__dirname, '..', 'services', nome, 'src', arquivo));

let pasta;
beforeAll(() => { pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'myparking-persistencia-')); });
afterAll(() => fs.rmSync(pasta, { recursive: true, force: true }));

// Abre o repositório num arquivo; cada chamada é uma "nova execução" do serviço
function abrir(nomeServico, classeRepo, arquivoRepo, arquivoDb) {
  const { Sequelize } = require(path.join(__dirname, '..', 'services', nomeServico, 'node_modules', 'sequelize'));
  const Classe = svc(nomeServico, `repositories/${arquivoRepo}`)[classeRepo];
  return new Classe(new Sequelize({ dialect: 'sqlite', storage: path.join(pasta, arquivoDb), logging: false }));
}

test('estacionamento: entrada registrada continua lá depois do reinício', async () => {
  const { Movimentacao } = svc('estacionamento-service', 'domain/entities/Movimentacao');
  let repo = abrir('estacionamento-service', 'SqliteMovimentacaoRepository', 'SqliteMovimentacaoRepository', 'est.sqlite');
  await repo.salvar(new Movimentacao({ id: 'bra', placa: 'BRA2E19', tipoVeiculo: 'MOTO' }));
  await repo.fechar();

  repo = abrir('estacionamento-service', 'SqliteMovimentacaoRepository', 'SqliteMovimentacaoRepository', 'est.sqlite');
  const mov = await repo.buscarAbertaPorPlaca('BRA2E19');
  expect(mov).toMatchObject({ id: 'bra', status: 'ABERTA', tipoVeiculo: 'MOTO' });
  expect(typeof mov.calcularPermanenciaMinutos).toBe('function'); // volta como entidade, não como objeto solto
  // os dados de exemplo são gravados só na primeira execução (não duplicam)
  expect((await repo.listar()).filter((m) => m.id === '1002')).toHaveLength(1);
  await repo.fechar();
});

test('pagamento: pagamento confirmado continua lá depois do reinício', async () => {
  const { Pagamento } = svc('pagamento-service', 'domain/entities/PagamentoEntities');
  let repo = abrir('pagamento-service', 'SqlitePagamentoRepository', 'SqlitePagamentoRepository', 'pag.sqlite');
  await repo.salvar(new Pagamento({ id: 'p1', movimentacaoId: 'bra', forma: 'DINHEIRO', valorCalculado: 15, valorPago: 20, troco: 5 }));
  await repo.fechar();

  repo = abrir('pagamento-service', 'SqlitePagamentoRepository', 'SqlitePagamentoRepository', 'pag.sqlite');
  expect(await repo.buscarPorMovimentacaoId('bra')).toMatchObject({ id: 'p1', valorCalculado: 15, troco: 5, status: 'CONFIRMADO' });
  await repo.fechar();
});

test('mensalista: alteração de status continua lá depois do reinício', async () => {
  let repo = abrir('mensalista-service', 'SqliteMensalistaRepository', 'SqliteMensalistaRepository', 'men.sqlite');
  await repo.atualizar('1', { status: 'INADIMPLENTE' });
  await repo.fechar();

  repo = abrir('mensalista-service', 'SqliteMensalistaRepository', 'SqliteMensalistaRepository', 'men.sqlite');
  expect((await repo.buscarPorPlaca('XYZ9K88')).status).toBe('INADIMPLENTE');
  await repo.fechar();
});

test('vaga: mudança de status continua lá depois do reinício', async () => {
  let repo = abrir('vaga-service', 'SqliteVagaRepository', 'SqliteVagaRepository', 'vaga.sqlite');
  await repo.atualizarStatus('103', 'OCUPADA');
  await repo.fechar();

  repo = abrir('vaga-service', 'SqliteVagaRepository', 'SqliteVagaRepository', 'vaga.sqlite');
  expect((await repo.buscarPorId('103')).status).toBe('OCUPADA');
  await repo.fechar();
});

test('auth: operador criado continua lá depois do reinício, com a senha guardada só como hash', async () => {
  const { Usuario } = svc('auth-service', 'domain/entities/Usuario');
  let repo = abrir('auth-service', 'SqliteUsuarioRepository', 'SqliteUsuarioRepository', 'auth.sqlite');
  await repo.salvar(new Usuario({ id: 3, nome: 'Novo Operador', email: 'novo@myparking.com', senhaHash: '$2a$10$hash', perfil: 'OPERADOR' }));
  await repo.fechar();

  repo = abrir('auth-service', 'SqliteUsuarioRepository', 'SqliteUsuarioRepository', 'auth.sqlite');
  const u = await repo.buscarPorEmail('novo@myparking.com');
  expect(u).toMatchObject({ id: 3, perfil: 'OPERADOR', senhaHash: '$2a$10$hash' });
  expect(await repo.buscarPorId(1)).toMatchObject({ email: 'admin@myparking.com' });
  await repo.fechar();
});
