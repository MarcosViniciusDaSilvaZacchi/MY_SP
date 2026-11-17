// ──────────────────────────────────────────────────────────────────
// Interface e Adapter HTTP para o dispositivos-service (DIP & ISP & Adapter)
// C4: "estacionamento-service → integração-dispositivos: comando de cancela (Fase 2)"
//
// O comando é "melhor esforço": se o serviço de dispositivos ou o ESP32
// estiverem fora do ar, a entrada/saída continua valendo no sistema e o
// operador abre a cancela manualmente. Por isso este client nunca lança erro.
// ──────────────────────────────────────────────────────────────────

class IDispositivosClient {
  /**
   * @param {{ sentido: 'ENTRADA'|'SAIDA', movimentacaoId?: string, placa?: string, origem?: string }} dados
   * @returns {Promise<{ id: string, status: string, dispositivoOnline: boolean } | null>}
   */
  async abrirCancela(dados) {
    throw new Error('Método abrirCancela() não implementado');
  }
}

class DispositivosHttpClient extends IDispositivosClient {
  constructor(baseUrl = process.env.DISPOSITIVOS_SERVICE_URL || 'http://localhost:3006', timeoutMs = 1500) {
    super();
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async abrirCancela({ sentido, movimentacaoId = null, placa = null, origem = 'SISTEMA' }) {
    try {
      const response = await fetch(`${this.baseUrl}/dispositivos/comandos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'ABRIR', sentido, movimentacaoId, placa, origem }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) return null;
      const c = await response.json();
      return { id: c.id, status: c.status, dispositivoOnline: !!c.dispositivoOnline };
    } catch {
      return null;
    }
  }
}

module.exports = { IDispositivosClient, DispositivosHttpClient };
