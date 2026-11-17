// Testes de unidade da tarifa oficial (BUG-02 e BUG-03 da N3)
// R$ 10,00 na 1ª hora + R$ 5,00 por hora ou fração; moto paga metade; carência de 10 min
const { TarifaPorPorteStrategy, TarifaEngine } = require('../src/domain/strategies/TarifaStrategy');

const engine = new TarifaEngine(new TarifaPorPorteStrategy());
const valor = (min, tipo) => engine.calcular(min, tipo).valorCalculado;

describe('Tarifa de carro (F2-C1)', () => {
  test.each([
    [0, 0], [5, 0], [10, 0],          // carência
    [11, 10], [60, 10],               // 1ª hora
    [61, 15],                         // CT-05: 1ª hora + 1 fração
    [120, 15], [121, 20], [130, 20],  // 1ª hora + 2 frações
    [600, 55],                        // 10 h
  ])('%p min → R$ %p', (min, esperado) => expect(valor(min, 'CARRO')).toBe(esperado));

  test('carro é o padrão quando o tipo não é informado', () => expect(valor(61)).toBe(15));
});

describe('Tarifa de moto (F2-C2 / CT-11)', () => {
  test.each([
    [10, 0], [60, 5], [61, 7.5], [130, 10],
  ])('%p min → R$ %p', (min, esperado) => expect(valor(min, 'MOTO')).toBe(esperado));
});

describe('Entradas inválidas (BUG-03 / CT-06)', () => {
  test.each([-30, 'abc', '', null, NaN, Infinity, true])('recusa a permanência %p com 400', (min) => {
    expect(() => engine.calcular(min, 'CARRO')).toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  test('recusa caminhão com 400', () => {
    expect(() => engine.calcular(61, 'CAMINHAO')).toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  test('aceita permanência numérica enviada como texto ("61")', () => expect(valor('61', 'CARRO')).toBe(15));
});

test('informa a tabela aplicada e se está na carência', () => {
  expect(engine.calcular(5, 'CARRO')).toMatchObject({ dentroCarencia: true, valorCalculado: 0 });
  expect(engine.calcular(61, 'MOTO').tabelaAplicada).toMatchObject({ id: 'PORTE_V2', tipoVeiculo: 'MOTO', multiplicador: 0.5 });
});
