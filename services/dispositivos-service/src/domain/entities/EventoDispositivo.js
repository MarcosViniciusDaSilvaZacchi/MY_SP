// ──────────────────────────────────────────────────────────────────
// Entidade EventoDispositivo (Domínio - SRP)
// Registro de auditoria: o que os sensores viram e o que a cancela fez.
// ──────────────────────────────────────────────────────────────────

const { TipoEvento, Sentido } = require('../enums/DispositivoEnums');

let sequencia = 0;

class EventoDispositivo {
  constructor({
    id,
    dispositivoId,
    tipo,
    sentido = null,
    distanciaCm = null,
    comandoId = null,
    detalhe = null,
    dataHora,
  }, agoraMs = Date.now()) {
    this.id = String(id || `${agoraMs}${String(++sequencia % 1000).padStart(3, '0')}`);
    this.dispositivoId = String(dispositivoId || '');
    this.tipo = String(tipo || '').toUpperCase().trim();
    this.sentido = sentido ? String(sentido).toUpperCase().trim() : null;
    const d = Number(distanciaCm);
    this.distanciaCm = distanciaCm === null || distanciaCm === undefined || !Number.isFinite(d) ? null : d;
    this.comandoId = comandoId ? String(comandoId) : null;
    this.detalhe = detalhe ? String(detalhe).slice(0, 200) : null;
    this.dataHora = dataHora || new Date(agoraMs).toISOString();
  }

  validar() {
    if (!this.dispositivoId) throw new Error('dispositivoId é obrigatório');
    if (!Object.values(TipoEvento).includes(this.tipo)) {
      throw new Error(`Tipo de evento inválido: ${this.tipo || '(vazio)'}`);
    }
    if (this.sentido && !Object.values(Sentido).includes(this.sentido)) {
      throw new Error(`Sentido inválido: ${this.sentido}. Use ENTRADA ou SAIDA.`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      dispositivoId: this.dispositivoId,
      tipo: this.tipo,
      sentido: this.sentido,
      distanciaCm: this.distanciaCm,
      comandoId: this.comandoId,
      detalhe: this.detalhe,
      dataHora: this.dataHora,
    };
  }
}

module.exports = { EventoDispositivo };
