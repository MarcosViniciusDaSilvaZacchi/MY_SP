#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────
// Teste ponta a ponta: executa os casos de teste da N3 contra o sistema
// rodando (npm start), pelo API Gateway, como o front-end faz.
//
// Uso:
//   node tests/e2e/fluxo-completo.js                 → casos CT-01 a CT-12
//   (pare e inicie o sistema de novo)
//   node tests/e2e/fluxo-completo.js --apos-reinicio → CT-13 (persistência)
//
// Para o CT-09/CT-10/CT-07 o script usa o veículo de exemplo ABC1D23, que
// o sistema cria com entrada antiga no primeiro start (bancos novos).
// ──────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const BASE = process.env.GATEWAY_URL || 'http://localhost:3000/api';
const ARQUIVO_ESTADO = path.join(__dirname, '.ultima-execucao.json');
let token = '';
const resultados = [];

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

function verificar(id, descricao, condicao, obtido) {
  resultados.push({ id, descricao, passou: !!condicao, obtido });
  console.log(`${condicao ? 'PASSOU' : 'FALHOU'}  ${id.padEnd(6)} ${descricao}${condicao ? '' : `\n         obtido: ${JSON.stringify(obtido)}`}`);
}

// Placa Mercosul aleatória, para o script poder ser executado mais de uma vez
function placaAleatoria() {
  const L = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const D = () => Math.floor(Math.random() * 10);
  return `${L()}${L()}${L()}${D()}${L()}${D()}${D()}`;
}

async function login() {
  const r = await chamar('POST', '/auth/login', { email: 'operador@myparking.com', senha: 'op123' });
  if (r.status !== 200) throw new Error(`Login falhou (HTTP ${r.status}). O sistema está rodando? (npm start)`);
  token = r.body.token;
}

async function casosPrincipais() {
  const placa = placaAleatoria();

  // F1 – Entrada
  const ct01 = await chamar('POST', '/entradas', { placa, tipoVeiculo: 'CARRO' });
  verificar('CT-01', `entrada de carro avulso ${placa} → 201 ABERTA ROTATIVO`,
    ct01.status === 201 && ct01.body.status === 'ABERTA' && ct01.body.tipo === 'ROTATIVO', ct01);
  const ct02 = await chamar('POST', '/entradas', { placa });
  verificar('CT-02', 'entrada repetida → 409', ct02.status === 409, ct02);
  const ct03 = await chamar('POST', '/entradas', { placa: '' });
  verificar('CT-03', 'placa vazia → 400', ct03.status === 400, ct03);
  const ct04 = await chamar('POST', '/entradas', { placa: '12@' });
  verificar('CT-04', 'placa "12@" → 400 (antes: 201)', ct04.status === 400, ct04);
  const caminhao = await chamar('POST', '/entradas', { placa: placaAleatoria(), tipoVeiculo: 'CAMINHAO' });
  verificar('EXTRA', 'caminhão → 400 (não é aceito)', caminhao.status === 400, caminhao);

  // F2 – Tarifa
  const ct05 = await chamar('POST', '/pagamentos/calcular', { permanenciaMinutos: 61, tipoVeiculo: 'CARRO' });
  verificar('CT-05', 'carro 61 min → R$ 15,00 (antes: R$ 8,00)', ct05.body?.valorCalculado === 15, ct05);
  const ct06a = await chamar('POST', '/pagamentos/calcular', { permanenciaMinutos: -30 });
  const ct06b = await chamar('POST', '/pagamentos/calcular', { permanenciaMinutos: 'abc' });
  verificar('CT-06', 'permanência -30 e "abc" → 400 (antes: 200 com R$ 0,00)', ct06a.status === 400 && ct06b.status === 400, [ct06a, ct06b]);
  const ct11 = await chamar('POST', '/pagamentos/calcular', { permanenciaMinutos: 61, tipoVeiculo: 'MOTO' });
  verificar('CT-11', 'moto 61 min → R$ 7,50 (antes: R$ 8,00)', ct11.body?.valorCalculado === 7.5, ct11);
  const calcReal = await chamar('POST', '/pagamentos/calcular', { movimentacaoId: ct01.body.id, permanenciaMinutos: 500 });
  verificar('EXTRA', 'cálculo com movimentacaoId ignora a permanência enviada (entrada recente → carência)',
    calcReal.status === 200 && calcReal.body.dentroCarencia === true && calcReal.body.permanenciaMinutos < 10, calcReal);

  // F3 – Pagamento e cancela, com o veículo de exemplo de 45+ min
  const mov = await chamar('GET', '/movimentacoes/aberta?placa=ABC1D23');
  if (mov.status !== 200) {
    console.log('\nAVISO  ABC1D23 não está mais no pátio: CT-07 a CT-10 precisam de bancos novos.');
    console.log('       Pare o sistema, apague services/*/database_*.sqlite e rode npm start de novo.\n');
  } else {
    const id = mov.body.id;
    const ct09 = await chamar('POST', '/saidas', { movimentacaoId: id, placa: 'ABC1D23' });
    verificar('CT-09', 'saída sem pagamento → 402', ct09.status === 402, ct09);

    const ct10 = await chamar('POST', '/pagamentos', { movimentacaoId: id, forma: 'DINHEIRO', valor: 0.01, valorPago: 0.01, permanenciaMinutos: 5 });
    const ct10saida = await chamar('POST', '/saidas', { movimentacaoId: id, valorCobrado: 0.01 });
    verificar('CT-10', 'pagamento adulterado de R$ 0,01 → recusado e saída continua bloqueada (antes: saía)',
      ct10.status === 400 && ct10saida.status === 402, [ct10, ct10saida]);

    const ct08 = await chamar('POST', '/pagamentos', { movimentacaoId: id, forma: 'DINHEIRO', valorPago: 5 });
    verificar('CT-08', 'dinheiro insuficiente (R$ 5,00 para R$ 10,00) → 400', ct08.status === 400, ct08);

    const ct07 = await chamar('POST', '/pagamentos', { movimentacaoId: id, forma: 'DINHEIRO', valorPago: 20 });
    verificar('CT-07', 'dinheiro R$ 20,00 para R$ 10,00 → CONFIRMADO, troco R$ 10,00',
      ct07.body?.status === 'CONFIRMADO' && ct07.body?.valorCalculado === 10 && ct07.body?.troco === 10, ct07);

    const saida = await chamar('POST', '/saidas', { movimentacaoId: id, valorCobrado: 0.01 });
    verificar('EXTRA', 'saída liberada com valorCobrado = R$ 10,00 (o valor enviado é ignorado)',
      saida.status === 200 && saida.body.valorCobrado === 10, saida);
  }

  // PIX: nasce PENDENTE mesmo sem "iniciarPix" e só confirma pela rota de confirmação
  const pix = await chamar('POST', '/pagamentos', { movimentacaoId: ct01.body.id, forma: 'PIX' });
  const confirmado = pix.body?.id ? await chamar('POST', `/pagamentos/${pix.body.id}/confirmar`) : null;
  verificar('CT-12', 'PIX nasce PENDENTE e vira CONFIRMADO só depois da confirmação (antes: confirmava direto)',
    pix.body?.status === 'PENDENTE' && confirmado?.body?.status === 'CONFIRMADO', [pix, confirmado]);

  fs.writeFileSync(ARQUIVO_ESTADO, JSON.stringify({ placa, movimentacaoId: ct01.body.id, pagamentoPix: pix.body?.id }, null, 2));
  console.log(`\nPara o CT-13: pare o sistema, inicie de novo e rode com --apos-reinicio (placa ${placa}).`);
}

async function aposReinicio() {
  if (!fs.existsSync(ARQUIVO_ESTADO)) throw new Error('Rode primeiro sem --apos-reinicio.');
  const estado = JSON.parse(fs.readFileSync(ARQUIVO_ESTADO, 'utf8'));
  const entradas = await chamar('GET', '/entradas');
  const pagamento = await chamar('GET', `/pagamentos/movimentacao/${estado.movimentacaoId}`);
  verificar('CT-13', `entrada ${estado.placa} e pagamento PIX continuam lá depois do reinício (antes: sumiam)`,
    entradas.body?.some((m) => m.placa === estado.placa) && pagamento.body?.id === estado.pagamentoPix,
    { entradas: entradas.body?.map((m) => m.placa), pagamento: pagamento.body });
}

(async () => {
  await login();
  if (process.argv.includes('--apos-reinicio')) await aposReinicio();
  else await casosPrincipais();
  const falhas = resultados.filter((r) => !r.passou).length;
  console.log(`\n${resultados.length - falhas} de ${resultados.length} verificações passaram.`);
  // exitCode em vez de process.exit(): no Windows o Node aborta se as conexões HTTP ainda estiverem fechando
  process.exitCode = falhas ? 1 : 0;
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
