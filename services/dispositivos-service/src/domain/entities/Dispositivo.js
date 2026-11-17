// ──────────────────────────────────────────────────────────────────
// Entidade Dispositivo (Domínio - SRP)
// Estado mais recente de um controlador de cancela (ESP32): conexão,
// posição da cancela e leitura dos sensores de cada faixa.
// ──────────────────────────────────────────────────────────────────

const { Sentido, EstadoCancela } = require('../enums/DispositivoEnums');

const sensorVazio = () => ({ distanciaCm: null, presenca: false, desde: null });

class Dispositivo {
  constructor({
    id,
    nome = null,
    ip = null,
    rssi = null,
    firmware = null,
    cancela = EstadoCancela.DESCONHECIDO,
    sensores = {},
    ultimoContato = null,
  }) {
    if (!id) throw new Error('id do dispositivo é obrigatório');
    this.id = String(id);
    this.nome = nome || this.id;
    this.ip = ip;
    this.rssi = rssi;
    this.firmware = firmware;
    this.cancela = cancela;
    this.sensores = {
      [Sentido.ENTRADA]: { ...sensorVazio(), ...(sensores[Sentido.ENTRADA] || {}) },
      [Sentido.SAIDA]: { ...sensorVazio(), ...(sensores[Sentido.SAIDA] || {}) },
    };
    this.ultimoContato = ultimoContato;
  }

  /** Atualiza com o relatório periódico (sync) enviado pelo ESP32. */
  registrarContato({ ip, rssi, firmware, cancela, sensores } = {}, agoraMs = Date.now()) {
    this.ultimoContato = new Date(agoraMs).toISOString();
    if (ip !== undefined) this.ip = ip;
    if (rssi !== undefined) this.rssi = Number(rssi);
    if (firmware !== undefined) this.firmware = firmware;
    if (cancela && Object.values(EstadoCancela).includes(String(cancela).toUpperCase())) {
      this.cancela = String(cancela).toUpperCase();
    }
    for (const sentido of Object.values(Sentido)) {
      const leitura = sensores && sensores[sentido];
      if (!leitura) continue;
      if (leitura.distanciaCm !== undefined) {
        const d = Number(leitura.distanciaCm);
        this.sensores[sentido].distanciaCm = Number.isFinite(d) && d >= 0 ? d : null;
      }
      if (leitura.presenca !== undefined) this.marcarPresenca(sentido, !!leitura.presenca, agoraMs);
    }
  }

  marcarPresenca(sentido, presenca, agoraMs = Date.now()) {
    const sensor = this.sensores[sentido];
    if (!sensor) return;
    if (sensor.presenca !== presenca) sensor.desde = new Date(agoraMs).toISOString();
    sensor.presenca = presenca;
  }

  estaOnline(agoraMs = Date.now(), limiteMs = 5000) {
    return !!this.ultimoContato && agoraMs - new Date(this.ultimoContato).getTime() <= limiteMs;
  }

  toJSON(agoraMs = Date.now(), limiteMs = 5000) {
    return {
      id: this.id,
      nome: this.nome,
      online: this.estaOnline(agoraMs, limiteMs),
      ultimoContato: this.ultimoContato,
      ip: this.ip,
      rssi: this.rssi,
      firmware: this.firmware,
      cancela: this.cancela,
      sensores: this.sensores,
      // Atalho para as telas: há um carro parado esperando em cada faixa?
      veiculoAguardando: {
        [Sentido.ENTRADA]: this.sensores[Sentido.ENTRADA].presenca,
        [Sentido.SAIDA]: this.sensores[Sentido.SAIDA].presenca,
      },
    };
  }
}

module.exports = { Dispositivo };
