// ──────────────────────────────────────────────────────────────────
// Interface e Adapter HTTP para Mensalista Client (DIP & ISP & Adapter)
// C4 Nível 3: Mensalista Client
// Isola a camada de domínio dos detalhes de infraestrutura HTTP/REST
// ──────────────────────────────────────────────────────────────────

class IMensalistaClient {
  /**
   * @param {string} placa
   * @returns {Promise<{ id: string, nome: string, status: string, placa: string } | null>}
   */
  async verificarMensalistaPorPlaca(placa) {
    throw new Error('Método verificarMensalistaPorPlaca() não implementado');
  }
}

class MensalistaHttpClient extends IMensalistaClient {
  constructor(baseUrl = process.env.MENSALISTA_SERVICE_URL || 'http://localhost:3003', timeoutMs = 2000) {
    super();
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async verificarMensalistaPorPlaca(placa) {
    if (!placa) return null;
    try {
      const placaNorm = encodeURIComponent(placa.toUpperCase().trim());
      const response = await fetch(`${this.baseUrl}/mensalistas/placa/${placaNorm}`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      // Falha de rede ou timeout: tratar com resiliência (como não-mensalista)
      return null;
    }
  }
}

module.exports = {
  IMensalistaClient,
  MensalistaHttpClient,
};
