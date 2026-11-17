<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Automação da Cancela</h1>
        <p class="subtitle">
          Fase 2 — ESP32 com micro servo (cancela) e dois sensores ultrassônicos HC-SR04 (faixa de entrada e faixa de saída).
          A cancela abre sozinha quando a entrada é registrada ou a saída é liberada.
        </p>
      </div>
      <span class="live-pill" :class="{ off: erroConexao }">
        <span class="live-dot"></span>
        {{ erroConexao ? 'Sem conexão com o servidor' : 'Ao vivo (1 s)' }}
      </span>
    </div>

    <div v-if="mensagem" class="flash" :class="mensagem.tipo">{{ mensagem.texto }}</div>

    <!-- Nenhum dispositivo ainda -->
    <div v-if="carregado && !dispositivo" class="card empty">
      <h2>Nenhum ESP32 conectado ainda</h2>
      <p>Assim que o controlador da cancela fizer o primeiro contato, ele aparece aqui.</p>
      <ul>
        <li><strong>Com a maquete:</strong> grave o firmware de <code>iot/esp32-cancela/</code> no ESP32, com o Wi-Fi e o
          <code>API_BASE</code> (<code>http://&lt;IP deste PC&gt;:3000/api</code>) preenchidos em <code>config.h</code>.</li>
        <li><strong>Sem hardware:</strong> rode <code>npm run simulador</code> na raiz do projeto. Ele imita o ESP32 pelo teclado.</li>
      </ul>
    </div>

    <template v-if="dispositivo">
      <!-- Status do controlador -->
      <div class="card device-card">
        <div class="device-main">
          <span class="status-badge" :class="dispositivo.online ? 'online' : 'offline'">
            <span class="dot"></span>{{ dispositivo.online ? 'ONLINE' : 'OFFLINE' }}
          </span>
          <div>
            <strong class="device-name">{{ dispositivo.nome }}</strong>
            <span class="device-sub">Último contato: {{ formatarHora(dispositivo.ultimoContato) }}</span>
          </div>
        </div>
        <div class="device-meta">
          <div><span>IP</span><strong>{{ dispositivo.ip || '—' }}</strong></div>
          <div><span>Sinal Wi-Fi</span><strong>{{ dispositivo.rssi != null ? `${dispositivo.rssi} dBm` : '—' }}</strong></div>
          <div><span>Firmware</span><strong>{{ dispositivo.firmware || '—' }}</strong></div>
        </div>
        <select v-if="dispositivos.length > 1" v-model="selecionadoId" class="device-select">
          <option v-for="d in dispositivos" :key="d.id" :value="d.id">{{ d.nome }}</option>
        </select>
      </div>

      <div class="grid">
        <!-- Faixa de entrada -->
        <div class="card lane" :class="{ ativa: dispositivo.veiculoAguardando.ENTRADA }">
          <div class="lane-head">
            <h3>Faixa de Entrada</h3>
            <span class="presence" :class="{ on: dispositivo.veiculoAguardando.ENTRADA }">
              {{ dispositivo.veiculoAguardando.ENTRADA ? 'Veículo detectado' : 'Livre' }}
            </span>
          </div>
          <div class="distance">
            <strong>{{ formatarDistancia(dispositivo.sensores.ENTRADA.distanciaCm) }}</strong>
            <span>sensor HC-SR04 de entrada</span>
          </div>
          <div class="bar"><div class="bar-fill" :style="{ width: larguraBarra(dispositivo.sensores.ENTRADA.distanciaCm) }"></div></div>
          <p v-if="dispositivo.veiculoAguardando.ENTRADA" class="hint">
            Há um carro esperando. <RouterLink to="/entrada">Registrar a entrada</RouterLink> abre a cancela.
          </p>
          <button class="btn-primary" :disabled="enviando || !dispositivo.online" @click="comando('ABRIR', 'ENTRADA')">
            Abrir cancela (entrada)
          </button>
        </div>

        <!-- Cancela -->
        <div class="card barrier-card">
          <h3>Cancela (micro servo)</h3>
          <svg viewBox="0 0 220 140" class="barrier" role="img" :aria-label="`Cancela ${dispositivo.cancela}`">
            <rect x="20" y="60" width="26" height="70" rx="4" class="post" />
            <g :style="{ transform: `rotate(${anguloCancela}deg)`, transformOrigin: '33px 70px' }" class="arm">
              <rect x="33" y="64" width="170" height="12" rx="6" class="arm-bar" />
              <rect v-for="i in 5" :key="i" :x="33 + i * 30" y="64" width="14" height="12" class="arm-stripe" />
            </g>
            <circle cx="33" cy="70" r="7" class="hinge" />
            <line x1="0" y1="131" x2="220" y2="131" class="ground" />
          </svg>
          <span class="barrier-state" :class="dispositivo.cancela.toLowerCase()">{{ rotuloCancela }}</span>
          <button class="btn-outline" :disabled="enviando || !dispositivo.online" @click="comando('FECHAR', 'ENTRADA')">
            Fechar cancela
          </button>
          <p class="hint small">Por segurança, o ESP32 recusa fechar com um veículo na frente do sensor.</p>
        </div>

        <!-- Faixa de saída -->
        <div class="card lane" :class="{ ativa: dispositivo.veiculoAguardando.SAIDA }">
          <div class="lane-head">
            <h3>Faixa de Saída</h3>
            <span class="presence" :class="{ on: dispositivo.veiculoAguardando.SAIDA }">
              {{ dispositivo.veiculoAguardando.SAIDA ? 'Veículo detectado' : 'Livre' }}
            </span>
          </div>
          <div class="distance">
            <strong>{{ formatarDistancia(dispositivo.sensores.SAIDA.distanciaCm) }}</strong>
            <span>sensor HC-SR04 de saída</span>
          </div>
          <div class="bar"><div class="bar-fill" :style="{ width: larguraBarra(dispositivo.sensores.SAIDA.distanciaCm) }"></div></div>
          <p v-if="dispositivo.veiculoAguardando.SAIDA" class="hint">
            Há um carro saindo. <RouterLink to="/saida">Concluir a saída</RouterLink> (com pagamento) abre a cancela.
          </p>
          <button class="btn-primary" :disabled="enviando || !dispositivo.online" @click="comando('ABRIR', 'SAIDA')">
            Abrir cancela (saída)
          </button>
        </div>
      </div>

      <div v-if="dispositivo.comandosPendentes.length" class="card">
        <h3>Comandos aguardando o ESP32</h3>
        <ul class="pending">
          <li v-for="c in dispositivo.comandosPendentes" :key="c.id">
            <strong>{{ c.acao }} · {{ c.sentido }}</strong>
            <span>{{ c.status }} · {{ rotuloOrigem(c.origem) }}{{ c.placa ? ` · ${c.placa}` : '' }} · {{ formatarHora(c.criadoEm) }}</span>
          </li>
        </ul>
      </div>
    </template>

    <!-- Histórico -->
    <div class="card">
      <div class="lane-head">
        <h3>Histórico de eventos</h3>
        <span class="muted">{{ eventos.length }} mais recentes</span>
      </div>
      <div class="table-responsive">
        <table class="events">
          <thead>
            <tr><th>Horário</th><th>Evento</th><th>Faixa</th><th>Detalhe</th></tr>
          </thead>
          <tbody>
            <tr v-if="!eventos.length"><td colspan="4" class="muted">Nenhum evento registrado.</td></tr>
            <tr v-for="e in eventos" :key="e.id">
              <td class="mono">{{ formatarHora(e.dataHora) }}</td>
              <td><span class="ev" :class="classeEvento(e.tipo)">{{ rotuloEvento(e.tipo) }}</span></td>
              <td>{{ e.sentido ? (e.sentido === 'ENTRADA' ? 'Entrada' : 'Saída') : '—' }}</td>
              <td class="muted">{{ e.detalhe || (e.distanciaCm != null ? `${e.distanciaCm} cm` : '—') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '../services/api'

const dispositivos = ref([])
const selecionadoId = ref(null)
const eventos = ref([])
const carregado = ref(false)
const erroConexao = ref(false)
const enviando = ref(false)
const mensagem = ref(null)
let timer = null
let timerMensagem = null

const dispositivo = computed(() =>
  dispositivos.value.find((d) => d.id === selecionadoId.value) || dispositivos.value[0] || null)

const anguloCancela = computed(() => {
  const estado = dispositivo.value?.cancela
  if (estado === 'ABERTA') return -80
  if (estado === 'ABRINDO' || estado === 'FECHANDO') return -40
  return 0
})

const rotuloCancela = computed(() => ({
  ABERTA: 'Aberta', FECHADA: 'Fechada', ABRINDO: 'Abrindo…', FECHANDO: 'Fechando…', DESCONHECIDO: 'Desconhecida',
}[dispositivo.value?.cancela] || '—'))

const ROTULOS_EVENTO = {
  VEICULO_DETECTADO: 'Veículo detectado',
  VEICULO_SAIU: 'Veículo saiu do sensor',
  CANCELA_ABERTA: 'Cancela aberta',
  CANCELA_FECHADA: 'Cancela fechada',
  COMANDO_RECUSADO: 'Comando recusado',
  DISPOSITIVO_ONLINE: 'ESP32 conectado',
  COMANDO_CRIADO: 'Comando enviado',
  COMANDO_EXPIRADO: 'Comando expirou',
}
const rotuloEvento = (t) => ROTULOS_EVENTO[t] || t
const classeEvento = (t) => ({
  VEICULO_DETECTADO: 'ev-warn', CANCELA_ABERTA: 'ev-ok', CANCELA_FECHADA: 'ev-info',
  COMANDO_RECUSADO: 'ev-err', COMANDO_EXPIRADO: 'ev-err', DISPOSITIVO_ONLINE: 'ev-ok',
}[t] || 'ev-neutral')

const rotuloOrigem = (o) => ({
  ENTRADA_REGISTRADA: 'entrada registrada', SAIDA_LIBERADA: 'saída liberada', OPERADOR: 'manual',
}[o] || String(o || '').toLowerCase())

function formatarHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d) ? '—' : d.toLocaleTimeString('pt-BR')
}
const formatarDistancia = (cm) => (cm == null ? '— cm' : `${Number(cm).toFixed(0)} cm`)
// Barra cheia = objeto encostado no sensor; vazia = 100 cm ou mais (nada na frente)
const larguraBarra = (cm) => (cm == null ? '0%' : `${Math.max(0, Math.min(100, 100 - Number(cm)))}%`)

function avisar(texto, tipo = 'ok') {
  mensagem.value = { texto, tipo }
  clearTimeout(timerMensagem)
  timerMensagem = setTimeout(() => { mensagem.value = null }, 4000)
}

async function atualizar() {
  try {
    const [d, e] = await Promise.all([
      api.get('/dispositivos'),
      api.get('/dispositivos/eventos', { params: { limite: 30 } }),
    ])
    dispositivos.value = Array.isArray(d.data) ? d.data : []
    eventos.value = Array.isArray(e.data) ? e.data : []
    if (!selecionadoId.value && dispositivos.value[0]) selecionadoId.value = dispositivos.value[0].id
    erroConexao.value = false
  } catch {
    erroConexao.value = true
  } finally {
    carregado.value = true
  }
}

async function comando(acao, sentido) {
  if (!dispositivo.value) return
  enviando.value = true
  try {
    const res = await api.post('/dispositivos/comandos', {
      acao, sentido, dispositivoId: dispositivo.value.id, origem: 'OPERADOR',
    })
    avisar(res.data.repetido ? 'Esse comando já estava na fila.' : `Comando ${acao} enviado ao ESP32.`)
    await atualizar()
  } catch (err) {
    avisar(err?.response?.data?.error || 'Não foi possível enviar o comando.', 'erro')
  } finally {
    enviando.value = false
  }
}

onMounted(() => {
  atualizar()
  timer = setInterval(atualizar, 1000)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(timerMensagem)
})
</script>

<style scoped>
.page { padding: 1.75rem 2rem; max-width: 1320px; width: 100%; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
h1 { font-size: 1.45rem; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; margin: 0 0 0.2rem; }
h2 { font-size: 1.1rem; margin: 0 0 0.4rem; color: #0f172a; }
h3 { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; }
.subtitle { color: #64748b; font-size: 0.88rem; max-width: 760px; }
.muted { color: #64748b; font-size: 0.82rem; }
.mono { font-family: var(--font-mono); font-size: 0.8rem; }
code { font-family: var(--font-mono); font-size: 0.8rem; background: #f1f5f9; padding: 0.05rem 0.3rem; border-radius: 4px; }

.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.15rem 1.25rem; margin-bottom: 1.1rem; }
.empty ul { margin: 0.75rem 0 0; padding-left: 1.1rem; color: #334155; font-size: 0.88rem; line-height: 1.7; }
.empty p { color: #64748b; font-size: 0.88rem; }

.live-pill { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.78rem; font-weight: 600; color: #166534; background: #dcfce7; border: 1px solid #bbf7d0; padding: 0.35rem 0.7rem; border-radius: 999px; }
.live-pill.off { color: #991b1b; background: #fee2e2; border-color: #fecaca; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: pulse 1.4s infinite; }
@keyframes pulse { 50% { opacity: 0.35; } }

.flash { padding: 0.7rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.86rem; font-weight: 600; }
.flash.ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.flash.erro { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

.device-card { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.device-main { display: flex; align-items: center; gap: 0.9rem; }
.device-name { display: block; font-size: 1rem; color: #0f172a; }
.device-sub { font-size: 0.8rem; color: #64748b; }
.device-meta { display: flex; gap: 1.6rem; flex-wrap: wrap; }
.device-meta div { display: flex; flex-direction: column; }
.device-meta span { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.4px; color: #64748b; }
.device-meta strong { font-size: 0.9rem; color: #0f172a; font-family: var(--font-mono); }
.device-select { padding: 0.4rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; }

.status-badge { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.74rem; font-weight: 800; padding: 0.3rem 0.65rem; border-radius: 6px; letter-spacing: 0.5px; }
.status-badge .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.status-badge.online { color: #15803d; background: #dcfce7; }
.status-badge.offline { color: #b91c1c; background: #fee2e2; }

.grid { display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 1.1rem; }
.grid .card { margin-bottom: 1.1rem; display: flex; flex-direction: column; gap: 0.75rem; }

.lane { transition: border-color 0.2s, box-shadow 0.2s; }
.lane.ativa { border-color: #f5b324; box-shadow: 0 0 0 3px rgba(245, 179, 36, 0.18); }
.lane-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
.presence { font-size: 0.74rem; font-weight: 700; padding: 0.22rem 0.55rem; border-radius: 6px; background: #f1f5f9; color: #475569; }
.presence.on { background: #fef3c7; color: #92400e; }
.distance strong { display: block; font-size: 2rem; font-weight: 800; color: #0f172a; font-family: var(--font-mono); line-height: 1.1; }
.distance span { font-size: 0.78rem; color: #64748b; }
.bar { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, #388bc7, #f5b324); transition: width 0.3s; }
.hint { font-size: 0.82rem; color: #334155; margin: 0; }
.hint.small { font-size: 0.76rem; color: #64748b; text-align: center; }

.barrier-card { align-items: center; }
.barrier { width: 100%; max-width: 260px; }
.post { fill: #1b314c; }
.hinge { fill: #f5b324; }
.arm { transition: transform 0.6s ease; }
.arm-bar { fill: #ffffff; stroke: #1b314c; stroke-width: 2; }
.arm-stripe { fill: #dc2626; }
.ground { stroke: #cbd5e1; stroke-width: 2; }
.barrier-state { font-size: 0.85rem; font-weight: 800; padding: 0.3rem 0.8rem; border-radius: 6px; background: #f1f5f9; color: #334155; }
.barrier-state.aberta { background: #dcfce7; color: #166534; }
.barrier-state.fechada { background: #fee2e2; color: #991b1b; }

.btn-primary, .btn-outline { display: inline-flex; justify-content: center; align-items: center; gap: 0.45rem; border-radius: 7px; padding: 0.58rem 1.05rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.15s; margin-top: auto; }
.btn-primary { background: #1b314c; color: #fff; border: 1px solid #112239; }
.btn-primary:hover:not(:disabled) { background: #2b7ab5; border-color: #1d6396; }
.btn-outline { background: #fff; color: #1b314c; border: 1px solid #cbd5e1; width: 100%; }
.btn-outline:hover:not(:disabled) { background: #f8fafc; }
button:disabled { opacity: 0.5; cursor: not-allowed; }

.pending { list-style: none; margin: 0.6rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.pending li { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.84rem; padding: 0.5rem 0.7rem; background: #f8fafc; border-radius: 6px; flex-wrap: wrap; }
.pending span { color: #64748b; }

.table-responsive { overflow-x: auto; margin-top: 0.6rem; }
.events { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.events th { text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.4px; color: #64748b; padding: 0.5rem 0.6rem; border-bottom: 1px solid #e2e8f0; }
.events td { padding: 0.5rem 0.6rem; border-bottom: 1px solid #f1f5f9; }
.ev { font-size: 0.76rem; font-weight: 700; padding: 0.18rem 0.5rem; border-radius: 5px; white-space: nowrap; }
.ev-ok { background: #dcfce7; color: #166534; }
.ev-info { background: #e0f2fe; color: #075985; }
.ev-warn { background: #fef3c7; color: #92400e; }
.ev-err { background: #fee2e2; color: #991b1b; }
.ev-neutral { background: #f1f5f9; color: #334155; }

@media (max-width: 1000px) {
  .grid { grid-template-columns: 1fr; }
  .page { padding: 1.25rem 1rem; }
}
</style>
