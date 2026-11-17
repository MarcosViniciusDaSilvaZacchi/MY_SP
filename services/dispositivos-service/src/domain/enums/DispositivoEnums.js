// ──────────────────────────────────────────────────────────────────
// Enums do Domínio de Integração com Dispositivos (Fase 2 — IoT)
// Maquete: 1 ESP32, 1 micro servo (cancela) e 2 sensores HC-SR04
// (um na faixa de entrada e outro na faixa de saída).
// ──────────────────────────────────────────────────────────────────

// Faixa em que o sensor está / sentido em que a cancela vai abrir
const Sentido = Object.freeze({
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
});

const EstadoCancela = Object.freeze({
  FECHADA: 'FECHADA',
  ABRINDO: 'ABRINDO',
  ABERTA: 'ABERTA',
  FECHANDO: 'FECHANDO',
  DESCONHECIDO: 'DESCONHECIDO',
});

const AcaoComando = Object.freeze({
  ABRIR: 'ABRIR',
  FECHAR: 'FECHAR',
});

// PENDENTE → ENVIADO (entregue ao ESP32) → EXECUTADO | FALHOU; ou EXPIRADO se ninguém executar a tempo
const StatusComando = Object.freeze({
  PENDENTE: 'PENDENTE',
  ENVIADO: 'ENVIADO',
  EXECUTADO: 'EXECUTADO',
  FALHOU: 'FALHOU',
  EXPIRADO: 'EXPIRADO',
});

// Eventos enviados pelo ESP32 (os três últimos são registrados pelo próprio serviço)
const TipoEvento = Object.freeze({
  VEICULO_DETECTADO: 'VEICULO_DETECTADO',
  VEICULO_SAIU: 'VEICULO_SAIU',
  CANCELA_ABERTA: 'CANCELA_ABERTA',
  CANCELA_FECHADA: 'CANCELA_FECHADA',
  COMANDO_RECUSADO: 'COMANDO_RECUSADO',
  DISPOSITIVO_ONLINE: 'DISPOSITIVO_ONLINE',
  COMANDO_CRIADO: 'COMANDO_CRIADO',
  COMANDO_EXPIRADO: 'COMANDO_EXPIRADO',
});

const EVENTOS_DO_DISPOSITIVO = Object.freeze([
  TipoEvento.VEICULO_DETECTADO,
  TipoEvento.VEICULO_SAIU,
  TipoEvento.CANCELA_ABERTA,
  TipoEvento.CANCELA_FECHADA,
  TipoEvento.COMANDO_RECUSADO,
]);

module.exports = {
  Sentido,
  EstadoCancela,
  AcaoComando,
  StatusComando,
  TipoEvento,
  EVENTOS_DO_DISPOSITIVO,
};
