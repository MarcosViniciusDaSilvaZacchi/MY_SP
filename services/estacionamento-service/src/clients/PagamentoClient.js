// ──────────────────────────────────────────────────────────────────
// Interface e Adapter HTTP para Pagamento Client (DIP & ISP & Adapter)
// Isola a comunicação HTTP entre estacionamento-service e pagamento-service
// ──────────────────────────────────────────────────────────────────

class IPagamentoClient {
  /**
   * @returns {Promise<Array<{ id: string, movimentacaoId: string, valorCalculado: number, valorPago: number, status: string, dataHora: string }>>}
   */
  async listarPagamentos() {
    throw new Error('Método listarPagamentos() não implementado');
  }

  /**
   * @param {string} movimentacaoId
   * @returns {Promise<{ id: string, movimentacaoId: string, valorCalculado: number, valorPago: number, status: string } | null>}
   */
  async buscarPagamentoPorMovimentacao(movimentacaoId) {
    throw new Error('Método buscarPagamentoPorMovimentacao() não implementado');
  }
}

class PagamentoHttpClient extends IPagamentoClient {
  constructor(baseUrl = process.env.PAGAMENTO_SERVICE_URL || 'http://localhost:3004', timeoutMs = 2000) {
    super();
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async listarPagamentos() {
    try {
      const response = await fetch(`${this.baseUrl}/pagamentos`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async buscarPagamentoPorMovimentacao(movimentacaoId) {
    if (!movimentacaoId) return null;
    try {
      const response = await fetch(
        `${this.baseUrl}/pagamentos/movimentacao/${encodeURIComponent(String(movimentacaoId))}`,
        { signal: AbortSignal.timeout(this.timeoutMs) }
      );
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
}

module.exports = {
  IPagamentoClient,
  PagamentoHttpClient,
};
