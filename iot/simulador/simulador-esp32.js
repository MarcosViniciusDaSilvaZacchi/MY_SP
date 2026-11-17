#!/usr/bin/env node
/**
 * Simulador do ESP32 da cancela — MY Service Parking (Fase 2)
 *
 * Faz exatamente o que o firmware faz (mesmo protocolo HTTP e mesma máquina de
 * estados da cancela), mas no terminal. Serve para demonstrar e testar a
 * automação sem a maquete.
 *
 * Uso (com o sistema rodando: npm start):
 *   npm run simulador
 *   node iot/simulador/simulador-esp32.js --api http://localhost:3000/api --id esp32-cancela-01 --chave my-parking-esp32-key
 *
 * Teclas:
 *   e  carro chega / sai da frente do sensor de ENTRADA
 *   s  carro chega / sai da frente do sensor de SAÍDA
 *   f  pede para fechar a cancela (teste local, como o "f" do Serial do ESP32)
 *   q  sair
 * Sem terminal interativo (ex.: entrada por pipe), lê uma tecla por linha.
 */

const readline = require('readline');

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const API = argumento('api', process.env.API_BASE || 'http://localhost:3000/api').replace(/\/$/, '');
const ID = argumento('id', process.env.DEVICE_ID || 'esp32-cancela-01');
const CHAVE = argumento('chave', process.env.DEVICE_KEY || 'my-parking-esp32-key');

// Mesmos tempos do firmware (iot/esp32-cancela/esp32-cancela.ino)
const INTERVALO_SYNC_MS = 500;
const TEMPO_MOVIMENTO_MS = 450; // 90° em passos de 3° a cada 15 ms
const TEMPO_APOS_PASSAGEM_MS = 2000;
const TEMPO_MAX_ABERTA_MS = 20000;
const DISTANCIA_LIVRE_CM = 60;
const DISTANCIA_CARRO_CM = 6;

const estado = {
  cancela: 'FECHADA',
  faixaAberta: 'ENTRADA',
  abertaDesde: 0,
  carroPassando: false,
  movimentoFim: 0,
  comandoPendente: null,
  ultimoComandoId: null,
  ultimoComandoEvento: null,
  servidorOk: null,
  sensores: {
    ENTRADA: { presenca: false, distanciaCm: DISTANCIA_LIVRE_CM, ultimaPresenca: 0 },
    SAIDA: { presenca: false, distanciaCm: DISTANCIA_LIVRE_CM, ultimaPresenca: 0 },
  },
};
const filaEventos = [];

const cor = (c, t) => (process.stdout.isTTY ? `\x1b[${c}m${t}\x1b[0m` : t);
const log = (msg) => console.log(`${cor('2', new Date().toLocaleTimeString('pt-BR'))} ${msg}`);

// ── HTTP ────────────────────────────────────────────────────────────
async function post(caminho, corpo) {
  const res = await fetch(`${API}/dispositivos/${ID}/${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Key': CHAVE },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(1500),
  });
  const texto = await res.text();
  let json = null;
  try { json = JSON.parse(texto); } catch { /* resposta sem JSON */ }
  return { status: res.status, json };
}

function enviarEvento(tipo, sentido = null, comandoId = null, detalhe = null) {
  const evento = { tipo };
  if (sentido) {
    evento.sentido = sentido;
    evento.distanciaCm = estado.sensores[sentido].distanciaCm;
  }
  if (comandoId) evento.comandoId = comandoId;
  if (detalhe) evento.detalhe = detalhe;
  filaEventos.push(evento);
  log(`${cor('36', '[evento]')} ${tipo}${sentido ? ` ${sentido}` : ''}${comandoId ? ` #${comandoId}` : ''}`);
}

async function enviarEventosPendentes() {
  while (filaEventos.length) {
    try {
      const { status, json } = await post('eventos', filaEventos[0]);
      if (status >= 500) return;
      if (status >= 400) log(cor('31', `[evento] recusado (${status}): ${json?.error || ''}`));
      filaEventos.shift();
    } catch {
      return; // servidor fora: tenta no próximo ciclo
    }
  }
}

async function sincronizar() {
  const sensores = {};
  for (const [faixa, s] of Object.entries(estado.sensores)) {
    sensores[faixa] = { distanciaCm: s.distanciaCm, presenca: s.presenca };
  }
  let ok = false;
  let comando = null;
  try {
    const { status, json } = await post('sync', {
      firmware: '1.0.0-simulador', ip: '127.0.0.1', rssi: -50, cancela: estado.cancela, sensores,
    });
    ok = status === 200;
    if (status === 401) log(cor('31', 'Chave do dispositivo recusada: confira --chave e DEVICE_API_KEY.'));
    comando = ok ? json?.comando : null;
  } catch {
    ok = false;
  }
  if (ok !== estado.servidorOk) {
    log(ok ? cor('32', `Conectado ao sistema em ${API}`) : cor('31', `Sistema indisponível em ${API} (rode npm start)`));
    estado.servidorOk = ok;
  }
  if (comando) executarComando(comando);
}

// ── Cancela (mesma lógica do firmware) ──────────────────────────────
function confirmarComando(tipo) {
  enviarEvento(tipo, estado.faixaAberta, estado.comandoPendente);
  if (estado.comandoPendente) estado.ultimoComandoEvento = tipo;
  estado.comandoPendente = null;
}

function moverPara(novoEstado) {
  estado.cancela = novoEstado;
  estado.movimentoFim = Date.now() + TEMPO_MOVIMENTO_MS;
  log(`${cor('33', '[cancela]')} ${novoEstado === 'ABRINDO' ? 'abrindo...' : 'fechando...'}`);
}

function executarComando(c) {
  if (c.id === estado.ultimoComandoId) {
    if (!estado.comandoPendente && estado.ultimoComandoEvento) enviarEvento(estado.ultimoComandoEvento, estado.faixaAberta, c.id);
    return;
  }
  estado.ultimoComandoId = c.id;
  estado.ultimoComandoEvento = null;
  const faixa = c.sentido === 'SAIDA' ? 'SAIDA' : 'ENTRADA';
  log(`${cor('35', '[comando]')} ${c.acao} ${c.sentido} #${c.id}`);

  if (c.acao === 'ABRIR') {
    estado.faixaAberta = faixa;
    estado.abertaDesde = Date.now();
    estado.carroPassando = estado.sensores[faixa].presenca;
    estado.comandoPendente = c.id;
    if (estado.cancela === 'ABERTA') confirmarComando('CANCELA_ABERTA');
    else moverPara('ABRINDO');
  } else if (c.acao === 'FECHAR') {
    if (estado.sensores.ENTRADA.presenca || estado.sensores.SAIDA.presenca) {
      enviarEvento('COMANDO_RECUSADO', faixa, c.id, 'Veiculo na frente do sensor');
      estado.ultimoComandoEvento = 'COMANDO_RECUSADO';
    } else {
      estado.comandoPendente = c.id;
      if (estado.cancela === 'FECHADA') confirmarComando('CANCELA_FECHADA');
      else moverPara('FECHANDO');
    }
  } else {
    enviarEvento('COMANDO_RECUSADO', faixa, c.id, 'Acao desconhecida');
  }
}

function atualizarCancela() {
  const agora = Date.now();
  const sensor = estado.sensores[estado.faixaAberta];
  if (sensor.presenca) sensor.ultimaPresenca = agora;

  if (estado.cancela === 'ABERTA') {
    if (sensor.presenca) estado.carroPassando = true;
    const passou = estado.carroPassando && !sensor.presenca && agora - sensor.ultimaPresenca > TEMPO_APOS_PASSAGEM_MS;
    const ninguem = !estado.carroPassando && !sensor.presenca && agora - estado.abertaDesde > TEMPO_MAX_ABERTA_MS;
    if (passou || ninguem) moverPara('FECHANDO');
  } else if (estado.cancela === 'FECHANDO' && sensor.presenca) {
    log(cor('33', '[cancela] carro detectado durante o fechamento: reabrindo'));
    estado.carroPassando = true;
    estado.abertaDesde = agora;
    moverPara('ABRINDO');
  }

  if (agora < estado.movimentoFim) return;
  if (estado.cancela === 'ABRINDO') {
    estado.cancela = 'ABERTA';
    estado.abertaDesde = agora;
    log(cor('32', '[cancela] ABERTA'));
    confirmarComando('CANCELA_ABERTA');
  } else if (estado.cancela === 'FECHANDO') {
    estado.cancela = 'FECHADA';
    estado.carroPassando = false;
    log(cor('31', '[cancela] FECHADA'));
    confirmarComando('CANCELA_FECHADA');
  }
}

// ── Sensores (teclado) ──────────────────────────────────────────────
function alternarCarro(faixa) {
  const s = estado.sensores[faixa];
  s.presenca = !s.presenca;
  s.distanciaCm = s.presenca ? DISTANCIA_CARRO_CM : DISTANCIA_LIVRE_CM;
  if (s.presenca) s.ultimaPresenca = Date.now();
  enviarEvento(s.presenca ? 'VEICULO_DETECTADO' : 'VEICULO_SAIU', faixa);
}

let seqLocal = 0;
function tratarTecla(tecla) {
  switch (String(tecla).trim().toLowerCase()) {
    case 'e': alternarCarro('ENTRADA'); break;
    case 's': alternarCarro('SAIDA'); break;
    case 'f': executarComando({ id: `local-${++seqLocal}`, acao: 'FECHAR', sentido: estado.faixaAberta }); break;
    case 'q': encerrar(); break;
    case '': break;
    default: log('Teclas: e (sensor entrada) | s (sensor saída) | f (fechar) | q (sair)');
  }
}

function encerrar() {
  log('Simulador encerrado.');
  process.exit(0);
}

// ── Início ──────────────────────────────────────────────────────────
console.log(cor('1', '\n🅿️  MY Parking — simulador do ESP32 da cancela'));
console.log(`   API: ${API}   dispositivo: ${ID}`);
console.log('   Teclas: e = carro no sensor de ENTRADA | s = carro no sensor de SAÍDA | f = fechar | q = sair\n');

if (process.stdin.isTTY) {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (str, key) => {
    if (key && key.ctrl && key.name === 'c') encerrar();
    tratarTecla(str);
  });
} else {
  readline.createInterface({ input: process.stdin }).on('line', tratarTecla);
}

setInterval(atualizarCancela, 15);

let ocupado = false;
setInterval(async () => {
  if (ocupado) return;
  ocupado = true;
  try {
    await enviarEventosPendentes();
    await sincronizar();
  } finally {
    ocupado = false;
  }
}, INTERVALO_SYNC_MS);
