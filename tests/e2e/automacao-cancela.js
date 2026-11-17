#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────
// Teste ponta a ponta da Fase 2 (automação da cancela), com o sistema
// rodando (npm start). Sobe o simulador do ESP32 e conduz um carro:
//
//   carro chega no sensor de entrada → operador registra a entrada →
//   cancela abre → carro passa → cancela fecha sozinha →
//   carro chega no sensor de saída → saída (carência) → cancela abre → fecha
//
// Uso: npm run test:e2e:iot
// ──────────────────────────────────────────────────────────────────

const { spawn } = require('child_process');
const path = require('path');

const BASE = process.env.GATEWAY_URL || 'http://localhost:3000/api';
const ID = `esp32-e2e-${Date.now() % 100000}`;
let token = '';
let falhas = 0;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function chamar(metodo, rota, corpo) {
  const res = await fetch(BASE + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  let body = null;
  try { body = await res.json(); } catch { /* sem corpo */ }
  return { status: res.status, body };
}

function verificar(descricao, condicao, obtido) {
  if (!condicao) falhas += 1;
  console.log(`${condicao ? 'PASSOU' : 'FALHOU'}  ${descricao}${condicao ? '' : `\n        obtido: ${JSON.stringify(obtido)}`}`);
}

async function estadoDispositivo() {
  const r = await chamar('GET', `/dispositivos/${ID}`);
  return r.status === 200 ? r.body : null;
}

async function aguardar(descricao, condicao, timeoutMs = 8000) {
  const inicio = Date.now();
  let ultimo = null;
  while (Date.now() - inicio < timeoutMs) {
    ultimo = await estadoDispositivo();
    if (ultimo && condicao(ultimo)) return verificar(descricao, true);
    await esperar(250);
  }
  return verificar(descricao, false, ultimo && { cancela: ultimo.cancela, online: ultimo.online, aguardando: ultimo.veiculoAguardando });
}

function placaAleatoria() {
  const L = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const D = () => Math.floor(Math.random() * 10);
  return `${L()}${L()}${L()}${D()}${L()}${D()}${D()}`;
}

async function main() {
  const login = await chamar('POST', '/auth/login', { email: 'operador@myparking.com', senha: 'op123' });
  if (login.status !== 200) throw new Error(`Login falhou (HTTP ${login.status}). O sistema está rodando? (npm start)`);
  token = login.body.token;

  // O comando automático vai para o dispositivo padrão; para não mexer na maquete
  // real (se estiver ligada), este teste simula um ESP32 próprio e manda os
  // comandos para ele, como o estacionamento-service faria.
  const sim = spawn(process.execPath, [path.join(__dirname, '..', '..', 'iot', 'simulador', 'simulador-esp32.js'),
    '--api', BASE, '--id', ID], { stdio: ['pipe', 'ignore', 'inherit'] });
  const tecla = (t) => sim.stdin.write(`${t}\n`);

  try {
    await aguardar('simulador conecta e aparece online com a cancela FECHADA', (d) => d.online && d.cancela === 'FECHADA');

    // Sem token: o gateway recusa o acesso às telas de dispositivos
    const semToken = await fetch(`${BASE}/dispositivos`);
    verificar('GET /dispositivos sem login → 401', semToken.status === 401, semToken.status);

    tecla('e');
    await aguardar('carro no sensor de entrada → veículo aguardando na ENTRADA', (d) => d.veiculoAguardando.ENTRADA);

    const placa = placaAleatoria();
    const entrada = await chamar('POST', '/entradas', { placa, tipoVeiculo: 'CARRO' });
    verificar('entrada registrada (201) e cancela acionada pelo estacionamento-service',
      entrada.status === 201 && entrada.body?.cancela?.acionada === true, entrada.body);

    const cmd = await chamar('POST', '/dispositivos/comandos',
      { acao: 'ABRIR', sentido: 'ENTRADA', dispositivoId: ID, origem: 'ENTRADA_REGISTRADA', placa, movimentacaoId: entrada.body?.id });
    verificar('comando ABRIR aceito (202)', cmd.status === 202, cmd.body);
    await aguardar('ESP32 abre a cancela', (d) => d.cancela === 'ABERTA');

    tecla('e'); // carro avança e sai da frente do sensor
    await aguardar('carro passou → cancela fecha sozinha', (d) => d.cancela === 'FECHADA', 6000);

    const comandos = await chamar('GET', `/dispositivos/comandos?dispositivoId=${ID}`);
    verificar('comando registrado como EXECUTADO', comandos.body?.[0]?.status === 'EXECUTADO', comandos.body?.[0]);

    tecla('s');
    await aguardar('carro no sensor de saída → veículo aguardando na SAIDA', (d) => d.veiculoAguardando.SAIDA);
    const saida = await chamar('POST', '/saidas', { movimentacaoId: entrada.body?.id });
    verificar('saída na carência liberada (200) e cancela acionada', saida.status === 200 && saida.body?.cancela?.acionada === true, saida.body);
    await chamar('POST', '/dispositivos/comandos', { acao: 'ABRIR', sentido: 'SAIDA', dispositivoId: ID, origem: 'SAIDA_LIBERADA', placa });
    await aguardar('ESP32 abre a cancela para a saída', (d) => d.cancela === 'ABERTA');

    // Segurança: com o carro ainda na frente do sensor, FECHAR é recusado
    await chamar('POST', '/dispositivos/comandos', { acao: 'FECHAR', sentido: 'SAIDA', dispositivoId: ID });
    await esperar(1500);
    const recusado = await chamar('GET', `/dispositivos/comandos?dispositivoId=${ID}`);
    verificar('FECHAR com carro na frente do sensor é recusado', recusado.body?.[0]?.status === 'FALHOU', recusado.body?.[0]);

    tecla('s');
    await aguardar('carro saiu → cancela fecha sozinha', (d) => d.cancela === 'FECHADA', 6000);

    const eventos = await chamar('GET', `/dispositivos/eventos?dispositivoId=${ID}&limite=50`);
    const tipos = new Set((eventos.body || []).map((e) => e.tipo));
    verificar('histórico tem detecção, abertura, fechamento e recusa',
      ['VEICULO_DETECTADO', 'VEICULO_SAIU', 'CANCELA_ABERTA', 'CANCELA_FECHADA', 'COMANDO_RECUSADO'].every((t) => tipos.has(t)),
      [...tipos]);
  } finally {
    sim.kill();
  }

  console.log(`\n${falhas === 0 ? 'Todas as verificações passaram.' : `${falhas} verificação(ões) falharam.`}`);
  process.exitCode = falhas === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
