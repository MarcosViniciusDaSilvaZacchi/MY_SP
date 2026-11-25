#!/usr/bin/env node
/**
 * Ponte serial do ESP32 da cancela — MY Service Parking (Fase 2)
 *
 * O ESP32 (firmware com CONEXAO_BLUETOOTH ou CONEXAO_USB) fala com o notebook
 * por uma porta COM: a do Bluetooth (criada pelo Windows depois do pareamento)
 * ou a do cabo USB. Esta ponte lê o estado e os eventos dessa porta, faz as
 * mesmas chamadas HTTP que o firmware Wi-Fi faria no API Gateway e devolve
 * os comandos (ABRIR/FECHAR) para o ESP32. O sistema não percebe diferença.
 *
 * Uso (com o sistema rodando: npm start):
 *   npm run ponte                       detecta a porta Bluetooth do ESP32
 *   npm run ponte -- --porta COM7       usa a porta informada
 *   npm run ponte -- --usb              usa o cabo USB (firmware em CONEXAO_USB)
 *   npm run ponte -- --listar           mostra as portas COM disponíveis
 * Outras opções: --api http://localhost:3000/api  --id esp32-cancela-01
 *                --chave my-parking-esp32-key       --baud 115200
 *
 * Protocolo (uma mensagem JSON por linha):
 *   ESP32 → ponte  {"t":"estado","boot":N,...}  {"t":"evento","boot":N,"seq":K,...}
 *   ponte → ESP32  {"t":"ack","seq":K}  {"t":"cmd",id,acao,sentido}  {"t":"status","servidor":bool}
 */

let SerialPort;
let ReadlineParser;
try {
  ({ SerialPort } = require('serialport'));
  ({ ReadlineParser } = require('@serialport/parser-readline'));
} catch {
  console.error('Dependência "serialport" não instalada. Rode uma vez:\n  npm install --prefix iot/ponte-serial');
  process.exit(1);
}

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : padrao;
}
const temFlag = (nome) => process.argv.includes(`--${nome}`);

const API = argumento('api', process.env.API_BASE || 'http://localhost:3000/api').replace(/\/$/, '');
const ID = argumento('id', process.env.DEVICE_ID || 'esp32-cancela-01');
const CHAVE = argumento('chave', process.env.DEVICE_KEY || 'my-parking-esp32-key');
const BAUD = Number(argumento('baud', 115200));
const PORTA_FIXA = argumento('porta', process.env.PORTA_ESP32 || null);

const INTERVALO_SYNC_MS = 500;
const ESTADO_VALIDO_MS = 2000;     // sem estado do ESP32 há 2 s: não sincroniza (o sistema o verá offline)
const RECONEXAO_MS = 3000;
const SEM_ESTADO_REABRIR_MS = 6000; // porta aberta mas ESP32 calado: reabre
const MOSTRAR_LOGS_ESP32 = !temFlag('silencioso');

const cor = (c, t) => (process.stdout.isTTY ? `\x1b[${c}m${t}\x1b[0m` : t);
const log = (msg) => console.log(`${cor('2', new Date().toLocaleTimeString('pt-BR'))} ${msg}`);

// ── Estado da ponte ─────────────────────────────────────────────────
let porta = null;
let nomePorta = null;
let ultimoEstado = null;      // último {"t":"estado"} recebido do ESP32
let ultimoEstadoEm = 0;
let portaAbertaEm = 0;
let espConectado = false;
let servidorOk = null;
const filaEventos = [];        // eventos já confirmados ao ESP32, aguardando a API
const ultimoSeqPorBoot = new Map();

// ── Portas COM ──────────────────────────────────────────────────────
// No Windows, cada dispositivo Bluetooth SPP pareado gera duas portas COM:
// a de SAÍDA (o notebook conecta no ESP32) traz o MAC do ESP32 no pnpId; a
// de ENTRADA traz 000000000000. A ponte precisa da de saída.
const BT_NOME = argumento('nome', process.env.BT_NOME || 'MY-Parking-Cancela');

function macDaPorta(p) {
  const pnp = String(p.pnpId || '').toUpperCase();
  if (!pnp.includes('BTHENUM')) return null;
  const mac = pnp.match(/&([0-9A-F]{12})_/);
  return mac && mac[1] !== '000000000000' ? mac[1] : null;
}
const ehBluetoothSaida = (p) => !!macDaPorta(p);

// MAC → nome do dispositivo pareado (ex.: "MY-Parking-Cancela", "Fone XYZ").
// Só no Windows; nos outros sistemas devolve um mapa vazio.
let nomesBluetooth = null;
function nomesDosDispositivosBluetooth() {
  if (nomesBluetooth) return nomesBluetooth;
  nomesBluetooth = new Map();
  if (process.platform !== 'win32') return nomesBluetooth;
  try {
    const saida = require('child_process').execFileSync('powershell.exe', [
      '-NoProfile', '-Command',
      "Get-PnpDevice | Where-Object { $_.InstanceId -like 'BTHENUM\\DEV_*' } | ForEach-Object { $_.InstanceId + '|' + $_.FriendlyName }",
    ], { encoding: 'utf8', timeout: 10000 });
    for (const linha of saida.split(/\r?\n/)) {
      const m = linha.match(/^BTHENUM\\DEV_([0-9A-F]{12})\\.*\|(.*)$/i);
      if (m) nomesBluetooth.set(m[1].toUpperCase(), m[2].trim());
    }
  } catch { /* sem PowerShell: segue sem nomes */ }
  return nomesBluetooth;
}
const nomeBluetooth = (p) => nomesDosDispositivosBluetooth().get(macDaPorta(p)) || null;
const ehEsp32 = (p) => {
  const nome = nomeBluetooth(p);
  return !!nome && (nome.toLowerCase() === BT_NOME.toLowerCase() || /esp32|my-parking/i.test(nome));
};
function ehUsbSerial(p) {
  const texto = `${p.manufacturer || ''} ${p.pnpId || ''} ${p.friendlyName || ''}`.toUpperCase();
  return /CP210|CH340|CH910|FTDI|SILICON LABS|WCH|USB/.test(texto) && !texto.includes('BTHENUM');
}

async function listarPortas() {
  const portas = await SerialPort.list();
  if (!portas.length) {
    console.log('Nenhuma porta COM encontrada.');
    return;
  }
  console.log('Portas COM:');
  for (const p of portas) {
    let tipo = '';
    if (ehBluetoothSaida(p)) tipo = `Bluetooth → ${nomeBluetooth(p) || 'dispositivo desconhecido'}${ehEsp32(p) ? cor('32', '  ← ESP32') : ''}`;
    else if (String(p.pnpId || '').toUpperCase().includes('BTHENUM')) tipo = 'Bluetooth (entrada, não usar)';
    else if (ehUsbSerial(p)) tipo = `USB-serial (${p.manufacturer || p.friendlyName || ''})`;
    console.log(`  ${p.path.padEnd(7)} ${tipo}`);
  }
}

// Padrão: só o Bluetooth do ESP32 (pelo nome); espera até ele ser pareado.
// Com --usb: usa o cabo USB (firmware em CONEXAO_USB). No modo Bluetooth o
// cabo é só alimentação/logs, e abrir a porta USB reiniciaria o ESP32.
const USAR_USB = temFlag('usb');
async function escolherPorta() {
  if (PORTA_FIXA) return PORTA_FIXA;
  const portas = await SerialPort.list();
  if (USAR_USB) {
    const usb = portas.filter(ehUsbSerial);
    return usb.length ? usb[0].path : null;
  }
  const bt = portas.filter((p) => ehBluetoothSaida(p) && ehEsp32(p));
  if (bt.length) return bt[0].path;
  nomesBluetooth = null; // pode ser pareado a qualquer momento: consulta de novo na próxima tentativa
  return null;
}

// ── Envio para o ESP32 ──────────────────────────────────────────────
function enviarAoEsp(msg) {
  if (!porta || !porta.isOpen) return;
  porta.write(`${JSON.stringify(msg)}\n`);
}

// ── HTTP (igual ao firmware Wi-Fi e ao simulador) ───────────────────
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

async function enviarEventosPendentes() {
  while (filaEventos.length) {
    try {
      const { status, json } = await post('eventos', filaEventos[0]);
      if (status >= 500) return;
      if (status >= 400) log(cor('31', `[evento] recusado pela API (${status}): ${json?.error || ''}`));
      filaEventos.shift();
    } catch {
      return; // sistema fora: tenta no próximo ciclo
    }
  }
}

async function sincronizar() {
  const estadoFresco = ultimoEstado && Date.now() - ultimoEstadoEm < ESTADO_VALIDO_MS;
  if (espConectado !== !!estadoFresco) {
    espConectado = !!estadoFresco;
    log(espConectado ? cor('32', `ESP32 conectado em ${nomePorta}`) : cor('31', 'ESP32 sem resposta (desligado, fora de alcance ou porta errada)'));
  }
  // No Windows, quando o ESP32 desliga ou sai de alcance, a porta Bluetooth
  // continua "aberta" mas morta e nunca dispara "close". Sem estado há um
  // tempo: fecha a porta para forçar uma nova conexão (o "close" reconecta).
  const silencioMs = Date.now() - Math.max(ultimoEstadoEm, portaAbertaEm);
  if (porta && porta.isOpen && silencioMs > SEM_ESTADO_REABRIR_MS) {
    log(cor('33', `Nada do ESP32 há ${Math.round(silencioMs / 1000)} s; reabrindo ${nomePorta}...`));
    portaAbertaEm = Date.now();
    porta.close(() => {});
  }
  if (!estadoFresco) return;

  const { t, boot, ...relatorio } = ultimoEstado;
  let ok = false;
  try {
    const { status, json } = await post('sync', { ...relatorio, ip: `bluetooth/usb ${nomePorta}` });
    ok = status === 200;
    if (status === 401) log(cor('31', 'Chave do dispositivo recusada: confira --chave e DEVICE_API_KEY.'));
    const comando = ok ? json?.comando : null;
    if (comando) {
      enviarAoEsp({ t: 'cmd', id: comando.id, acao: comando.acao, sentido: comando.sentido });
    }
  } catch {
    ok = false;
  }
  if (ok !== servidorOk) {
    log(ok ? cor('32', `Sistema conectado em ${API}`) : cor('31', `Sistema indisponível em ${API} (rode npm start)`));
    servidorOk = ok;
  }
  enviarAoEsp({ t: 'status', servidor: ok });
}

// ── Mensagens do ESP32 ──────────────────────────────────────────────
function tratarLinha(linha) {
  linha = linha.trim();
  if (!linha) return;
  if (!linha.startsWith('{')) {
    if (MOSTRAR_LOGS_ESP32) log(cor('2', `[esp32] ${linha}`));
    return;
  }
  let msg;
  try { msg = JSON.parse(linha); } catch { return; } // linha corrompida: o ESP32 reenvia

  if (msg.t === 'estado') {
    ultimoEstado = msg;
    ultimoEstadoEm = Date.now();
  } else if (msg.t === 'evento') {
    enviarAoEsp({ t: 'ack', seq: msg.seq });
    const chave = String(msg.boot);
    if (ultimoSeqPorBoot.get(chave) === msg.seq) return; // reenvio (o ack anterior se perdeu)
    ultimoSeqPorBoot.set(chave, msg.seq);
    const { t, boot, seq, ...evento } = msg;
    filaEventos.push(evento);
    log(`${cor('36', '[evento]')} ${evento.tipo}${evento.sentido ? ` ${evento.sentido}` : ''}${evento.comandoId ? ` #${evento.comandoId}` : ''}`);
  }
}

// ── Conexão com a porta (reconecta sozinha) ─────────────────────────
let avisouSemPorta = false;
async function conectar() {
  const caminho = await escolherPorta().catch(() => null);
  if (!caminho) {
    if (!avisouSemPorta) {
      log(cor('33', USAR_USB
        ? 'Cabo USB do ESP32 não encontrado. Aguardando...'
        : `"${BT_NOME}" não está pareado. Pareie em Configurações → Bluetooth → Adicionar dispositivo. Aguardando...`));
      avisouSemPorta = true;
    }
    setTimeout(conectar, RECONEXAO_MS);
    return;
  }
  avisouSemPorta = false;
  nomePorta = caminho;
  log(`Abrindo ${caminho}...`);
  const p = new SerialPort({ path: caminho, baudRate: BAUD, autoOpen: false });
  p.open((erro) => {
    if (erro) {
      log(cor('31', `Não abriu ${caminho}: ${erro.message}`));
      setTimeout(conectar, RECONEXAO_MS);
      return;
    }
    porta = p;
    portaAbertaEm = Date.now();
    log(`Porta ${caminho} aberta, aguardando o ESP32...`);
    p.pipe(new ReadlineParser({ delimiter: '\n' })).on('data', tratarLinha);
  });
  p.on('close', () => {
    if (porta === p) porta = null;
    log(cor('33', `Porta ${caminho} fechada; reconectando...`));
    setTimeout(conectar, RECONEXAO_MS);
  });
  p.on('error', (erro) => log(cor('31', `Erro na porta ${caminho}: ${erro.message}`)));
}

// ── Início ──────────────────────────────────────────────────────────
async function main() {
  if (temFlag('listar')) {
    await listarPortas();
    return;
  }
  console.log(cor('1', '\n🅿️  MY Parking — ponte Bluetooth/USB do ESP32 da cancela'));
  console.log(`   API: ${API}   dispositivo: ${ID}   porta: ${PORTA_FIXA || 'automática'}\n`);

  await conectar();

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

  process.on('SIGINT', () => {
    log('Ponte encerrada.');
    process.exit(0);
  });
}

main();
