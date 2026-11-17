const { CompatibilidadePadraoStrategy, AlocadorVagasEngine } = require('../src/domain/strategies/CompatibilidadeVagaStrategy');

const s = new CompatibilidadePadraoStrategy();

test('carro pode ocupar qualquer tipo de vaga do mapa', () => {
  for (const tipo of ['COMUM', 'PCD', 'IDOSO', 'GESTANTE', 'ELETRICO']) expect(s.isCompativel('CARRO', tipo)).toBe(true);
});

test('moto não ocupa vaga de recarga elétrica', () => {
  expect(s.isCompativel('MOTO', 'COMUM')).toBe(true);
  expect(s.isCompativel('MOTO', 'ELETRICO')).toBe(false);
});

test('caminhão não é compatível com nenhuma vaga', () => {
  for (const tipo of ['COMUM', 'PCD', 'IDOSO', 'GESTANTE', 'ELETRICO']) expect(s.isCompativel('CAMINHAO', tipo)).toBe(false);
});

test('o alocador filtra as vagas livres compatíveis', () => {
  const vagas = [{ id: 1, tipo: 'COMUM' }, { id: 2, tipo: 'ELETRICO' }];
  expect(new AlocadorVagasEngine().filtrarVagasCompativeis(vagas, 'MOTO').map((v) => v.id)).toEqual([1]);
});
