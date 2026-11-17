// ──────────────────────────────────────────────────────────────────
// Interface e Adapter HTTP para Estacionamento Client (DIP & ISP & Adapter)
// O pagamento-service busca a movimentação no estacionamento-service para
// calcular a tarifa com o horário de entrada guardado no servidor, e não com
// valores enviados pelo cliente.
// ──────────────────────────────────────────────────────────────────

class IEstacionamentoClient {
  /**
   * @param {string} movimentacaoId
   * @returns {Promise<{ id: string, placa: string, tipo: string, tipoVeiculo: string, status: string, permanenciaMinutos: number } | null>}
   *          null quando a movimentação não existe
   */
  async buscarMovimentacao(movimentacaoId) {
    throw new Error('Método buscarMovimentacao() não implementado');
  }
}

class EstacionamentoHttpClient extends IEstacionamentoClient {
  constructor(baseUrl = process.env.ESTACIONAMENTO_SERVICE_URL || 'http://localhost:3002', timeoutMs = 2000) {
    super();
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async buscarMovimentacao(movimentacaoId) {
    let response;
    try {
      response = await fetch(`${this.baseUrl}/movimentacoes/${encodeURIComponent(String(movimentacaoId))}`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      const err = new Error('Serviço de estacionamento indisponível. Tente novamente em instantes.');
      err.statusCode = 503;
      throw err;
    }
    if (response.status === 404) return null;
    if (!response.ok) {
      const err = new Error('Não foi possível consultar a movimentação no serviço de estacionamento.');
      err.statusCode = 502;
      throw err;
    }
    return response.json();
  }
}

module.exports = {
  IEstacionamentoClient,
  EstacionamentoHttpClient,
};
