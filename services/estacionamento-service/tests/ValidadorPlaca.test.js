// Testes de unidade: validação de placa no back-end (BUG-04 / CT-04 da N3)
const { ValidadorPlaca } = require('../src/domain/services/ValidadorPlaca');

const validador = new ValidadorPlaca();

describe('ValidadorPlaca', () => {
  test.each(['ABC1234', 'ABC-1234', 'abc1234', 'ABC1D23', 'bra2e19', ' ABC 1D23 '])(
    'aceita a placa válida %p',
    (placa) => expect(validador.validar(placa)).toBe(true)
  );

  test.each(['12@', '1234567', 'ABCD123', 'AB12345', 'ABC12D3', 'ABC123', 'ABC12345', '', null, undefined])(
    'recusa a placa inválida %p (CT-04)',
    (placa) => expect(validador.validar(placa)).toBe(false)
  );

  test('normaliza retirando hífen e espaços e passando para maiúsculas', () => {
    expect(validador.normalizar('abc-1234')).toBe('ABC1234');
    expect(validador.normalizar(' bra 2e19 ')).toBe('BRA2E19');
  });
});
