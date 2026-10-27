// ──────────────────────────────────────────────────────────────────
// ValidadorCpf (Domain Service - SRP)
// C4 Nível 3: Validador de Documentos
// Responsabilidade Única: validar formato e dígitos verificadores de CPF
// ──────────────────────────────────────────────────────────────────

class ValidadorCpf {
  /**
   * Valida se uma string é um CPF formalmente válido
   * @param {string} cpf
   * @returns {boolean}
   */
  validar(cpf) {
    if (!cpf) return false;

    const limpo = String(cpf).replace(/\D/g, '');
    if (limpo.length !== 11) return false;

    // Rejeita sequências repetidas como 111.111.111-11
    if (/^(\d)\1{10}$/.test(limpo)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(limpo.charAt(i), 10) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.charAt(9), 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(limpo.charAt(i), 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(limpo.charAt(10), 10);
  }
}

module.exports = { ValidadorCpf };

