// ──────────────────────────────────────────────────────────────────
// Entidade Comando (Domínio - SRP)
// Ordem para a cancela (ABRIR/FECHAR) aguardando ser buscada pelo ESP32.
// O ESP32 não recebe conexões: ele busca comandos a cada sync (polling),
// o que funciona atrás de qualquer roteador/NAT sem configuração extra.
// ──────────────────────────────────────────────────────────────────

const { AcaoComando, Sentido, StatusComando } = require('../enums/DispositivoEnums');

let sequencia = 0;
const novoId = (agoraMs) => `${agoraMs}${String(++sequencia % 1000).padStart(3, '0')}`;

class Comando {
  constructor({
    id,
    dispositivoId,
    acao,
    sentido,
    origem = 'OPERADOR',
    movimentacaoId = null,
    placa = null,
    status = StatusComando.PENDENTE,
    criadoEm,
    enviadoEm = null,
    concluidoEm = null,
    tentativas = 0,
    motivo = null,
  }, agoraMs = Date.now()) {
    this.id = String(id || novoId(agoraMs));
    this.dispositivoId = String(dispositivoId || '');
    this.acao = String(acao || '').toUpperCase().trim();
    this.sentido = String(sentido || '').toUpperCase().trim();
    this.origem = origem;
    this.movimentacaoId = movimentacaoId ? String(movimentacaoId) : null;
    this.placa = placa || null;
    this.status = status;
    this.criadoEm = criadoEm || new Date(agoraMs).toISOString();
    this.enviadoEm = enviadoEm;
    this.concluidoEm = concluidoEm;
    this.tentativas = tentativas;
    this.motivo = motivo;
  }

  validar() {
    if (!this.dispositivoId) throw new Error('dispositivoId é obrigatório');
    if (!Object.values(AcaoComando).includes(this.acao)) {
      throw new Error(`Ação inválida: ${this.acao || '(vazia)'}. Use ABRIR ou FECHAR.`);
    }
    if (!Object.values(Sentido).includes(this.sentido)) {
      throw new Error(`Sentido inválido: ${this.sentido || '(vazio)'}. Use ENTRADA ou SAIDA.`);
    }
  }

  get finalizado() {
    return [StatusComando.EXECUTADO, StatusComando.FALHOU, StatusComando.EXPIRADO].includes(this.status);
  }

  idadeMs(agoraMs = Date.now()) {
    return agoraMs - new Date(this.criadoEm).getTime();
  }

  /** Pode ser entregue no sync atual? (pendente, ou enviado há muito tempo sem confirmação) */
  podeEntregar(agoraMs, reenvioMs) {
    if (this.status === StatusComando.PENDENTE) return true;
    return this.status === StatusComando.ENVIADO
      && agoraMs - new Date(this.enviadoEm).getTime() >= reenvioMs;
  }

  marcarEnviado(agoraMs = Date.now()) {
    this.status = StatusComando.ENVIADO;
    this.enviadoEm = new Date(agoraMs).toISOString();
    this.tentativas += 1;
  }

  concluir(status, agoraMs = Date.now(), motivo = null) {
    this.status = status;
    this.concluidoEm = new Date(agoraMs).toISOString();
    if (motivo) this.motivo = motivo;
  }

  /** Formato enxuto que o ESP32 recebe (economiza memória no parse do JSON) */
  paraDispositivo() {
    return { id: this.id, acao: this.acao, sentido: this.sentido };
  }

  toJSON() {
    return {
      id: this.id,
      dispositivoId: this.dispositivoId,
      acao: this.acao,
      sentido: this.sentido,
      origem: this.origem,
      movimentacaoId: this.movimentacaoId,
      placa: this.placa,
      status: this.status,
      criadoEm: this.criadoEm,
      enviadoEm: this.enviadoEm,
      concluidoEm: this.concluidoEm,
      tentativas: this.tentativas,
      motivo: this.motivo,
    };
  }
}

module.exports = { Comando };
