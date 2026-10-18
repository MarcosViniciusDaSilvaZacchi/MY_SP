<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Entrada de Veículos</h1>
        <p class="subtitle">Informe a placa do veículo para emitir o comprovante de entrada e abrir a cancela.</p>
      </div>
    </div>

    <div class="layout-grid">
      <!-- Coluna 1: Formulário de Entrada -->
      <div class="card form-card">
        <div class="card-head">
          <h2 class="card-title">Identificação do Veículo</h2>
          <span class="tag-online">Portaria Principal</span>
        </div>

        <form @submit.prevent="registrar">
          <div class="form-group">
            <label for="placa-input">Placa do Veículo</label>
            <div class="plate-input-container">
              <div class="mercosul-strip">
                <span>BRASIL</span>
              </div>
              <input
                id="placa-input"
                v-model="placa"
                @input="placa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '')"
                maxlength="7"
                placeholder="ABC1D23"
                :disabled="loading"
                autocomplete="off"
                required
              />
            </div>
            <span class="field-hint">
              Digite os 7 caracteres da placa (padrão Mercosul ou tradicional).
            </span>
          </div>

          <div v-if="error" class="error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ error }}</span>
          </div>

          <button class="btn-primary" type="submit" :disabled="loading || !placa || placa.length < 7">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <span>{{ loading ? 'Registrando entrada...' : 'Confirmar Entrada e Abrir Cancela' }}</span>
          </button>
        </form>
      </div>

      <!-- Coluna 2: Comprovante Emitido OU Tabela de Tarifas -->
      <div v-if="resultado" class="card result-card">
        <div class="result-header">
          <div class="check-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <h3 class="result-title">Entrada Registrada com Sucesso</h3>
            <span class="result-subtitle">Cancela liberada para o veículo</span>
          </div>
        </div>

        <div class="voucher">
          <div class="voucher-plate">{{ resultado.placa }}</div>

          <div class="voucher-details">
            <div class="voucher-row">
              <span class="v-label">Horário de Entrada:</span>
              <strong class="v-value text-primary">{{ formatarDataHora(resultado.dataHoraEntrada || resultado.horaEntrada) }}</strong>
            </div>

            <div class="voucher-row">
              <span class="v-label">Categoria:</span>
              <span :class="['badge-pill', resultado.tipo === 'MENSALISTA' ? 'badge-mensalista' : 'badge-rotativo']">
                {{ resultado.tipo === 'MENSALISTA' ? 'Mensalista' : 'Rotativo' }}
              </span>
            </div>

            <div v-if="resultado.mensalistaNome" class="voucher-row">
              <span class="v-label">Cliente Mensalista:</span>
              <strong class="v-value">{{ resultado.mensalistaNome }}</strong>
            </div>

            <div class="voucher-row">
              <span class="v-label">Situação:</span>
              <span class="badge-status-open">NO PÁTIO</span>
            </div>

            <div class="voucher-row">
              <span class="v-label">Código do Ticket:</span>
              <code class="v-code">#{{ resultado.id }}</code>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <button type="button" class="btn-pdf-ticket" @click="baixarTicket">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 18 15 15"/>
            </svg>
            <span>Baixar Ticket (PDF)</span>
          </button>
          <button type="button" class="btn-outline" @click="limpar">
            Nova Entrada
          </button>
        </div>
      </div>

      <div v-else class="card rules-card">
        <h2 class="card-title">Tabela de Preços e Informações</h2>
        <p class="rules-intro">
          O sistema identifica automaticamente clientes mensalistas pela placa e calcula o tempo de permanência para veículos avulsos.
        </p>

        <ul class="rules-list">
          <li>
            <div class="info-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="rule-body">
              <strong>Tolerância Gratuita — 10 Minutos</strong>
              <span>Saídas realizadas em até 10 minutos após a entrada são isentas de cobrança.</span>
            </div>
          </li>
          <li>
            <div class="info-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="rule-body">
              <strong>Tarifa Rotativa — R$ 8,00 / hora</strong>
              <span>Valor cobrado por hora ou fração adicional após o período de tolerância.</span>
            </div>
          </li>
          <li>
            <div class="info-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div class="rule-body">
              <strong>Clientes Mensalistas</strong>
              <span>Reconhecimento automático pela placa com entrada e saída sem cobrança avulsa.</span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Tabela de Veículos no Pátio -->
    <div class="card table-card">
      <div class="table-header">
        <div>
          <h2 class="card-title">Veículos Estacionados no Pátio</h2>
          <span class="table-counter">{{ movimentacoesFiltradas.length }} veículo(s) no momento</span>
        </div>

        <div class="table-controls">
          <div class="search-mini">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input v-model="filtroPlaca" placeholder="Buscar placa..." />
          </div>

          <button class="btn-secondary" @click="carregarEntradas" :disabled="carregandoLista">
            <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Categoria</th>
              <th>Horário de Entrada</th>
              <th>Tempo Decorrido</th>
              <th>Situação</th>
              <th class="text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movimentacoesFiltradas" :key="m.id">
              <td>
                <span class="plate-box">{{ m.placa }}</span>
              </td>
              <td>
                <span :class="['badge-pill', m.tipo === 'MENSALISTA' ? 'badge-mensalista' : 'badge-rotativo']">
                  {{ m.tipo === 'MENSALISTA' ? 'Mensalista' : 'Rotativo' }}
                </span>
              </td>
              <td>{{ formatarDataHora(m.dataHoraEntrada || m.horaEntrada) }}</td>
              <td class="font-semibold">{{ calcularPermanencia(m.dataHoraEntrada || m.horaEntrada) }}</td>
              <td>
                <span class="status-indicator">
                  <span class="dot"></span> Estacionado
                </span>
              </td>
              <td class="text-right">
                <RouterLink :to="{ path: '/saida', query: { placa: m.placa } }" class="btn-go-exit">
                  <span>Registrar Saída</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </RouterLink>
              </td>
            </tr>
            <tr v-if="movimentacoesFiltradas.length === 0">
              <td colspan="6" class="empty-state">Nenhum veículo estacionado no momento.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { exportarComprovantePDF } from '../utils/exportadores'

const placa = ref('')
const filtroPlaca = ref('')
const loading = ref(false)
const error = ref('')
const resultado = ref(null)

const listaEntradas = ref([])
const carregandoLista = ref(false)

const movimentacoesAbertas = computed(() => {
  return listaEntradas.value.filter(m => m.status === 'ABERTA')
})

const movimentacoesFiltradas = computed(() => {
  const termo = filtroPlaca.value.trim().toUpperCase()
  if (!termo) return movimentacoesAbertas.value
  return movimentacoesAbertas.value.filter(m => m.placa?.toUpperCase().includes(termo))
})

async function registrar() {
  if (!placa.value || placa.value.length < 7) return
  loading.value = true
  error.value = ''

  try {
    const res = await api.post('/entradas', { placa: placa.value })
    resultado.value = res.data
    placa.value = ''
    await carregarEntradas()
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Erro ao registrar entrada.'
  } finally {
    loading.value = false
  }
}

async function carregarEntradas() {
  carregandoLista.value = true
  try {
    const res = await api.get('/entradas')
    listaEntradas.value = res.data || []
  } catch (e) {
    console.error('Erro ao listar entradas:', e)
  } finally {
    carregandoLista.value = false
  }
}

function baixarTicket() {
  if (!resultado.value) return
  exportarComprovantePDF(resultado.value, 'ENTRADA')
}

function limpar() {
  resultado.value = null
  error.value = ''
  placa.value = ''
}

function formatarDataHora(iso) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (isNaN(data.getTime())) return '—'
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function calcularPermanencia(iso) {
  if (!iso) return '—'
  const entrada = new Date(iso)
  if (isNaN(entrada.getTime())) return '—'
  const minutos = Math.max(0, Math.floor((new Date() - entrada) / 60000))
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return `${horas}h ${resto}min`
}

onMounted(() => {
  carregarEntradas()
})
</script>

<style scoped>
.page {
  padding: 1.75rem 2rem;
  max-width: 1320px;
  width: 100%;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.75rem;
}

h1 {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.4px;
  margin: 0 0 0.2rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.88rem;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  align-items: stretch;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.tag-online {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.form-group {
  margin-bottom: 1.35rem;
}

label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.45rem;
}

.plate-input-container {
  border: 2px solid #1b314c;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.plate-input-container:focus-within {
  border-color: #2b7ab5;
  box-shadow: 0 0 0 3px rgba(43, 122, 181, 0.18);
}

.mercosul-strip {
  background: #1d4ed8;
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-align: center;
  padding: 3px 0;
}

.plate-input-container input {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: 4px;
  text-align: center;
  padding: 0.65rem 0.75rem;
  border: none;
  text-transform: uppercase;
  color: #0f172a;
  background: #f8fafc;
}

.plate-input-container input:focus {
  outline: none;
  background: #ffffff;
}

.field-hint {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  margin-top: 0.45rem;
}

.btn-primary {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #1b314c;
  color: #ffffff;
  border: 1px solid #112239;
  border-radius: 8px;
  padding: 0.82rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #2b7ab5;
  border-color: #1d6396;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-actions {
  display: flex;
  gap: 0.65rem;
}

.btn-pdf-ticket {
  flex: 1.2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: #1b314c;
  color: #ffffff;
  border: 1px solid #112239;
  border-radius: 7px;
  padding: 0.7rem;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-pdf-ticket:hover {
  background: #2b7ab5;
}

.btn-outline {
  flex: 1;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  padding: 0.7rem;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.rules-intro {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0.35rem 0 1.1rem;
  line-height: 1.5;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rules-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.info-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 7px;
  background: #1b314c;
  color: #f5b324;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rule-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.rule-body strong {
  font-size: 0.82rem;
  color: #0f172a;
}

.rule-body span {
  font-size: 0.76rem;
  color: #64748b;
  line-height: 1.4;
}

.result-card {
  border-color: #86efac;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.15rem;
}

.check-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-title {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
  font-weight: 700;
}

.result-subtitle {
  font-size: 0.78rem;
  color: #64748b;
}

.voucher {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.1rem;
  margin-bottom: 1.1rem;
}

.voucher-plate {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 800;
  text-align: center;
  color: #0f172a;
  background: #ffffff;
  border-radius: 6px;
  padding: 0.35rem 0;
  margin-bottom: 0.9rem;
  letter-spacing: 3px;
  border: 1px solid #cbd5e1;
}

.voucher-details {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.voucher-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.84rem;
}

.v-label { color: #64748b; }
.v-value { color: #0f172a; font-weight: 600; }
.text-primary { color: #2b7ab5; }

.badge-status-open {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

.badge-pill {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
}

.badge-rotativo { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
.badge-mensalista { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.table-counter {
  font-size: 0.8rem;
  color: #64748b;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.search-mini {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.65rem;
  color: #94a3b8;
}

.search-mini input {
  padding: 0.42rem 0.7rem 0.42rem 2rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.82rem;
  background: #f8fafc;
  color: #0f172a;
  width: 180px;
}

.search-mini input:focus {
  outline: none;
  border-color: #2b7ab5;
  background: #ffffff;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.42rem 0.8rem;
  color: #334155;
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.7rem 0.85rem;
  border-radius: 7px;
  font-size: 0.84rem;
  margin-bottom: 1.15rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

th {
  text-align: left;
  padding: 0.75rem 0.85rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}

.text-right { text-align: right; }
.font-semibold { font-weight: 600; }

.plate-box {
  font-family: var(--font-mono);
  font-weight: 700;
  background: #f8fafc;
  padding: 0.22rem 0.55rem;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  color: #0f172a;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #b45309;
  font-weight: 600;
}

.status-indicator .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
}

.btn-go-exit {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #f8fafc;
  color: #1b314c;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.32rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
}

.btn-go-exit:hover {
  background: #1b314c;
  color: #ffffff;
  border-color: #1b314c;
}

.empty-state {
  text-align: center;
  padding: 2.25rem;
  color: #94a3b8;
}

@media (max-width: 960px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 1.15rem;
  }

  .search-mini input {
    width: 100%;
  }
}
</style>
