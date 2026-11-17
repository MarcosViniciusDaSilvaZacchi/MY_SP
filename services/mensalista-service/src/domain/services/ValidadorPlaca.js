// ──────────────────────────────────────────────────────────────────
// ValidadorPlaca (Domain Service - SRP)
// Valida placas brasileiras no padrão antigo (ABC1234 ou ABC-1234)
// e no padrão Mercosul (ABC1D23). A validação fica no back-end para
// que chamadas diretas à API não registrem placas inválidas.
// ──────────────────────────────────────────────────────────────────

const PADRAO_ANTIGO = /^[A-Z]{3}[0-9]{4}$/;
const PADRAO_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

class ValidadorPlaca {
  /**
   * Remove espaços e hífen e passa para maiúsculas: "abc-1234" → "ABC1234"
   * @param {string} placa
   * @returns {string}
   */
  normalizar(placa) {
    return String(placa || '').toUpperCase().replace(/[\s-]/g, '');
  }

  /**
   * @param {string} placa
   * @returns {boolean}
   */
  validar(placa) {
    const p = this.normalizar(placa);
    return PADRAO_ANTIGO.test(p) || PADRAO_MERCOSUL.test(p);
  }
}

module.exports = { ValidadorPlaca };
