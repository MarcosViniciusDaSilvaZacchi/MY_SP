<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Registrar Entrada de Veículo</h1>
        <p class="subtitle">Cadastre a placa para iniciar o controle de permanência.</p>
      </div>
    </div>

    <div class="layout-grid">
      <!-- Formulário de Entrada -->
      <div class="card form-card">
        <h2 class="card-title">Identificação do Veículo</h2>
        <form @submit.prevent="registrar">
          <div class="form-group">
            <label for="placa-input">Placa do Veículo</label>
            <div class="input-wrapper">
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
              <span class="plate-flag">BRASIL</span>
            </div>
            <span class="field-hint">Aceita formato Mercosul (ABC1D23) ou tradicional (ABC1234).</span>
          </div>

          <div v-if="error" class="error-banner">
            {{ error }}
          </div>

          <button class="btn-primary" type="submit" :disabled="loading || !placa || placa.length < 7">
            {{ loading ? 'Processando entrada...' : 'Confirmar Entrada' }}
          </button>
        </form>
      </div>

      <!-- Confirmação da Entrada -->
      <div v-if="resultado" class="card result-card">
        <div class="result-header">
          <div class="check-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <h3 class="result-title">Entrada Confirmada</h3>
            <span class="result-subtitle">Registro efetuado com sucesso</span>
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
              <span class="v-label">Classificação:</span>
              <span :class="['badge-pill', resultado.tipo === 'MENSALISTA' ? 'badge-mensalista' : 'badge-rotativo']">
                {{ resultado.tipo }}
              </span>
            </div>

            <div v-if="resultado.mensalistaNome" class="voucher-row">
              <span class="v-label">Titular Mensalista:</span>
              <strong class="v-value">{{ resultado.mensalistaNome }}</strong>
            </div>

            <div class="voucher-row">
              <span class="v-label">Status da Movimentação:</span>
              <span class="badge-status-open">ABERTA</span>
            </div>

            <div class="voucher-row">
              <span class="v-label">Identificador (ID):</span>
              <span class="v-code">#{{ resultado.id }}</span>
            </div>
          </div>
        </div>

        <button class="btn-outline" @click="limpar">
          Registrar Novo Veículo
        </button>
      </div>
    </div>

    <!-- Tabela de Veículos no Pátio -->
    <div class="card table-card">
      <div class="table-header">
        <div>
          <h2 class="card-title">Veículos no Pátio (Entradas Abertas)</h2>
          <span class="table-counter">{{ movimentacoesAbertas.length }} veículo(s) estacionado(s)</span>
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

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Classificação</th>
              <th>Horário de Entrada</th>
              <th>Tempo de Permanência</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movimentacoesAbertas" :key="m.id">
              <td>
                <span class="plate-box">{{ m.placa }}</span>
              </td>
              <td>
                <span :class="['badge-pill', m.tipo === 'MENSALISTA' ? 'badge-mensalista' : 'badge-rotativo']">
                  {{ m.tipo }}
                </span>
              </td>
              <td>{{ formatarDataHora(m.dataHoraEntrada || m.horaEntrada) }}</td>
              <td>{{ calcularPermanencia(m.dataHoraEntrada || m.horaEntrada) }}</td>
              <td>
                <span class="status-indicator">
                  <span class="dot"></span> Aberta
                </span>
              </td>
            </tr>
            <tr v-if="movimentacoesAbertas.length === 0">
              <td colspan="5" class="empty-state">Nenhum veículo com entrada aberta no momento.</td>
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

const placa = ref('')
const loading = ref(false)
const error = ref('')
const resultado = ref(null)

const listaEntradas = ref([])
const carregandoLista = ref(false)

const movimentacoesAbertas = computed(() => {
  return listaEntradas.value.filter(m => m.status === 'ABERTA')
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
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;
  margin: 0 0 0.25rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1.25rem;
  letter-spacing: -0.2px;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-align: center;
  padding: 0.75rem 4rem 0.75rem 0.75rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  box-sizing: border-box;
  text-transform: uppercase;
  color: #0f172a;
  background: #f8fafc;
  transition: all 0.15s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #0284c7;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.plate-flag {
  position: absolute;
  right: 12px;
  background: #0284c7;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 3px 6px;
  border-radius: 4px;
}

.field-hint {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  margin-top: 0.4rem;
}

.btn-primary {
  width: 100%;
  background: #0284c7;
  color: #ffffff;
  border: 1px solid #0369a1;
  border-radius: 6px;
  padding: 0.8rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #0369a1;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  width: 100%;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.7rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.45rem 0.85rem;
  color: #475569;
  font-size: 0.82rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary:hover:not(:disabled) {
  background: #f1f5f9;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

/* Result Card */
.result-card {
  border-color: #bbf7d0;
  background: #ffffff;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.check-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-title {
  margin: 0;
  font-size: 1.05rem;
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
  padding: 1.2rem;
  margin-bottom: 1.25rem;
}

.voucher-plate {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 1.6rem;
  font-weight: 800;
  text-align: center;
  color: #0f172a;
  background: #ffffff;
  border-radius: 6px;
  padding: 0.4rem 0;
  margin-bottom: 1rem;
  letter-spacing: 2px;
  border: 1px solid #cbd5e1;
}

.voucher-details {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.voucher-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
}

.v-label {
  color: #64748b;
}

.v-value {
  color: #0f172a;
  font-weight: 600;
}

.text-primary {
  color: #0284c7;
}

.v-code {
  font-family: monospace;
  font-size: 0.8rem;
  color: #64748b;
}

.badge-status-open {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 700;
}

.badge-pill {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-rotativo {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.badge-mensalista {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

/* Tabela */
.table-card {
  margin-top: 1rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.table-counter {
  font-size: 0.82rem;
  color: #64748b;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

th {
  text-align: left;
  padding: 0.75rem 0.85rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}

.plate-box {
  font-family: monospace;
  font-weight: 700;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  color: #0f172a;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #b45309;
  font-weight: 600;
}

.status-indicator .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
}

.empty-state {
  text-align: center;
  padding: 2.5rem;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .page {
    padding: 1.25rem;
  }
}
</style>
