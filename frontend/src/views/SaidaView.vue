<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Registrar Saída de Veículo</h1>
        <p class="subtitle">Localize a permanência do veículo e processe a cobrança e liberação.</p>
      </div>
    </div>

    <!-- PASSO 1: Busca do Veículo -->
    <div v-if="passo === 1" class="card form-card">
      <h2 class="card-title">Passo 1 — Identificação do Veículo</h2>
      <form @submit.prevent="buscar">
        <div class="form-group">
          <label for="placa-busca">Placa do Veículo</label>
          <div class="input-wrapper">
            <input
              id="placa-busca"
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
        </div>

        <div v-if="error" class="error-banner">
          {{ error }}
        </div>

        <button class="btn-primary" type="submit" :disabled="loading || !placa">
          {{ loading ? 'Localizando registro...' : 'Localizar e Calcular Cobrança' }}
        </button>
      </form>

      <!-- Veículos com entrada aberta -->
      <div v-if="veiculosNoPatio.length > 0" class="quick-pick">
        <span class="quick-title">Veículos no pátio com saída pendente:</span>
        <div class="quick-chips">
          <button
            v-for="v in veiculosNoPatio"
            :key="v.id"
            class="chip-plate"
            type="button"
            @click="selecionarPlaca(v.placa)"
          >
            <span class="chip-code">{{ v.placa }}</span>
            <span class="chip-type">{{ v.tipo }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- PASSO 2: Detalhes, Saldo Devedor e Pagamento -->
    <div v-if="passo === 2" class="card payment-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Passo 2 — Apuração de Saldo e Cobrança</h2>
          <span class="card-subtitle">Confira o período de permanência e selecione a forma de liquidação.</span>
        </div>
        <span :class="['badge-pill', movimentacao.tipo === 'MENSALISTA' ? 'badge-mensalista' : 'badge-rotativo']">
          {{ movimentacao.tipo }}
        </span>
      </div>

      <!-- Resumo Operacional -->
      <div class="summary-box">
        <div class="plate-line">
          <span class="ticket-plate">{{ movimentacao.placa }}</span>
          <span v-if="movimentacao.mensalistaNome" class="mensalista-text">
            Titular: {{ movimentacao.mensalistaNome }}
          </span>
        </div>

        <div class="summary-grid">
          <div class="summary-item">
            <span class="s-label">Horário de Entrada:</span>
            <strong class="s-value">{{ formatarDataHora(movimentacao.dataHoraEntrada || movimentacao.horaEntrada) }}</strong>
          </div>

          <div class="summary-item">
            <span class="s-label">Horário de Saída:</span>
            <strong class="s-value">{{ formatarDataHora(horarioSaidaPrevisto) }}</strong>
          </div>

          <div class="summary-item">
            <span class="s-label">Tempo de Permanência:</span>
            <strong class="s-value">{{ formatarTempo(permanenciaMinutos) }} ({{ permanenciaMinutos }} minutos)</strong>
          </div>

          <div class="summary-item">
            <span class="s-label">Regra de Tarifação:</span>
            <span v-if="dentroCarencia" class="text-green font-semibold">Isento (tolerância de 10 minutos)</span>
            <span v-else-if="movimentacao.tipo === 'MENSALISTA'" class="text-green font-semibold">Mensalidade Ativa</span>
            <span v-else class="text-slate font-semibold">R$ 8,00 por hora cheia</span>
          </div>
        </div>
      </div>

      <!-- Card de Destaque do Saldo Devedor -->
      <div class="saldo-card" :class="{ 'saldo-zero': Number(valorDevido) === 0 }">
        <span class="saldo-label">SALDO DEVEDOR PARA COBRANÇA</span>
        <div class="saldo-amount">
          R$ {{ Number(valorDevido).toFixed(2) }}
        </div>
        <div class="saldo-description">
          <span v-if="movimentacao.tipo === 'MENSALISTA'">
            Mensalista adimplente. Não há cobrança adicional.
          </span>
          <span v-else-if="dentroCarencia">
            Saída dentro da carência de 10 minutos. Isenção total aplicada.
          </span>
          <span v-else>
            Valor apurado para {{ Math.ceil((permanenciaMinutos - 10) / 60) || 1 }} hora(s) faturada(s).
          </span>
        </div>
      </div>

      <!-- Opções de Pagamento -->
      <div v-if="Number(valorDevido) > 0" class="payment-section">
        <label class="section-label">Forma de Pagamento</label>
        <div class="payment-options">
          <label class="payment-option" :class="{ selected: formaPagamento === 'DINHEIRO' }">
            <input type="radio" value="DINHEIRO" v-model="formaPagamento" />
            <svg class="opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <circle cx="12" cy="12" r="2"/>
              <path d="M6 12h.01M18 12h.01"/>
            </svg>
            <span>Dinheiro</span>
          </label>

          <label class="payment-option" :class="{ selected: formaPagamento === 'CARTAO' }">
            <input type="radio" value="CARTAO" v-model="formaPagamento" />
            <svg class="opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span>Cartão</span>
          </label>

          <label class="payment-option" :class="{ selected: formaPagamento === 'PIX' }">
            <input type="radio" value="PIX" v-model="formaPagamento" />
            <svg class="opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <path d="M9 9h6v6H9z"/>
            </svg>
            <span>PIX</span>
          </label>
        </div>

        <!-- Troco Dinheiro -->
        <div v-if="formaPagamento === 'DINHEIRO'" class="troco-card">
          <div class="form-group-troco">
            <label for="valor-entregue">Valor Recebido do Cliente (R$)</label>
            <input
              id="valor-entregue"
              type="number"
              step="0.50"
              min="0"
              v-model="valorPago"
              :placeholder="Number(valorDevido).toFixed(2)"
            />
          </div>
          <div v-if="trocoCalculado > 0" class="troco-line">
            <span class="t-label">Troco a devolver:</span>
            <strong class="t-amount">R$ {{ trocoCalculado.toFixed(2) }}</strong>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <div class="actions-row">
        <button class="btn-outline" type="button" @click="passo = 1" :disabled="loading">
          Voltar
        </button>
        <button class="btn-primary" type="button" @click="confirmarSaida" :disabled="loading">
          {{ loading ? 'Processando saída...' : (Number(valorDevido) === 0 ? 'Liberar Saída Isenta' : 'Confirmar Pagamento e Concluir') }}
        </button>
      </div>
    </div>

    <!-- PASSO 3: Recibo Final -->
    <div v-if="passo === 3" class="card receipt-card">
      <div class="receipt-header">
        <div class="receipt-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 class="receipt-title">Saída Concluída com Sucesso</h2>
        <p class="receipt-subtitle">Movimentação encerrada e cancela física autorizada.</p>
      </div>

      <div class="receipt-box">
        <div class="receipt-plate">{{ recibo.placa }}</div>

        <div class="receipt-rows">
          <div class="r-row">
            <span class="r-label">Entrada:</span>
            <span class="r-val">{{ formatarDataHora(recibo.dataHoraEntrada) }}</span>
          </div>
          <div class="r-row">
            <span class="r-label">Saída:</span>
            <span class="r-val">{{ formatarDataHora(recibo.dataHoraSaida) }}</span>
          </div>
          <div class="r-row">
            <span class="r-label">Permanência Total:</span>
            <span class="r-val">{{ formatarTempo(recibo.permanenciaMinutos) }}</span>
          </div>
          <div class="r-row">
            <span class="r-label">Categoria:</span>
            <span class="r-val">{{ recibo.tipo }}</span>
          </div>
          <div class="r-row r-highlight">
            <span class="r-label">Valor Cobrado:</span>
            <strong class="r-amount">R$ {{ Number(recibo.valorCobrado).toFixed(2) }}</strong>
          </div>
          <div v-if="Number(recibo.valorCobrado) > 0" class="r-row">
            <span class="r-label">Modalidade de Pagamento:</span>
            <span class="r-val">{{ recibo.formaPagamento }}</span>
          </div>
          <div v-if="recibo.troco > 0" class="r-row">
            <span class="r-label">Troco Devolvido:</span>
            <span class="r-val font-semibold">R$ {{ Number(recibo.troco).toFixed(2) }}</span>
          </div>
          <div class="r-row">
            <span class="r-label">Status no Pátio:</span>
            <span class="badge-status-closed">FINALIZADA</span>
          </div>
        </div>
      </div>

      <div class="receipt-footer">
        <button class="btn-primary" @click="reiniciar">
          Realizar Nova Saída
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const passo = ref(1)
const placa = ref('')
const loading = ref(false)
const error = ref('')

const movimentacao = ref({})
const permanenciaMinutos = ref(0)
const valorDevido = ref('0.00')
const dentroCarencia = ref(false)
const horarioSaidaPrevisto = ref(new Date().toISOString())

const formaPagamento = ref('DINHEIRO')
const valorPago = ref('')

const veiculosNoPatio = ref([])
const recibo = ref({})

const trocoCalculado = computed(() => {
  const entregue = parseFloat(valorPago.value)
  const devido = parseFloat(valorDevido.value)
  if (isNaN(entregue) || entregue <= devido) return 0
  return entregue - devido
})

function selecionarPlaca(p) {
  placa.value = p
  buscar()
}

async function carregarVeiculosNoPatio() {
  try {
    const res = await api.get('/entradas')
    veiculosNoPatio.value = (res.data || []).filter(m => m.status === 'ABERTA')
  } catch (e) {
    console.error('Erro ao carregar veículos do pátio:', e)
  }
}

async function buscar() {
  if (!placa.value) return
  loading.value = true
  error.value = ''

  try {
    const res = await api.get('/movimentacoes/aberta', {
      params: { placa: placa.value.toUpperCase().trim() }
    })
    movimentacao.value = res.data
    horarioSaidaPrevisto.value = new Date().toISOString()

    const entradaIso = res.data.dataHoraEntrada || res.data.horaEntrada
    const entrada = new Date(entradaIso)
    const agora = new Date()
    permanenciaMinutos.value = Math.max(1, Math.floor((agora - entrada) / 60000))

    if (movimentacao.value.tipo === 'MENSALISTA') {
      valorDevido.value = '0.00'
      dentroCarencia.value = false
    } else {
      const calcRes = await api.post('/pagamentos/calcular', {
        movimentacaoId: res.data.id,
        permanenciaMinutos: permanenciaMinutos.value,
        minutos: permanenciaMinutos.value,
      })
      valorDevido.value = Number(calcRes.data.valorCalculado ?? calcRes.data.valor ?? 0).toFixed(2)
      dentroCarencia.value = !!calcRes.data.dentroCarencia
    }

    valorPago.value = valorDevido.value
    passo.value = 2
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Nenhuma entrada em aberto encontrada para essa placa.'
  } finally {
    loading.value = false
  }
}

async function confirmarSaida() {
  loading.value = true
  error.value = ''

  try {
    const devidoNum = parseFloat(valorDevido.value)

    let pagamentoEfetuado = null
    if (devidoNum > 0) {
      const pagRes = await api.post('/pagamentos', {
        movimentacaoId: movimentacao.value.id,
        forma: formaPagamento.value,
        valorPago: valorPago.value ? parseFloat(valorPago.value) : devidoNum,
        valor: devidoNum,
        permanenciaMinutos: permanenciaMinutos.value,
      })
      pagamentoEfetuado = pagRes.data
    }

    const saidaRes = await api.post('/saidas', {
      placa: movimentacao.value.placa,
      movimentacaoId: movimentacao.value.id,
    })

    recibo.value = {
      placa: movimentacao.value.placa,
      dataHoraEntrada: movimentacao.value.dataHoraEntrada || movimentacao.value.horaEntrada,
      dataHoraSaida: saidaRes.data.dataHoraSaida || new Date().toISOString(),
      permanenciaMinutos: permanenciaMinutos.value,
      tipo: movimentacao.value.tipo,
      valorCobrado: devidoNum,
      formaPagamento: devidoNum > 0 ? formaPagamento.value : 'ISENTO',
      troco: pagamentoEfetuado?.troco || trocoCalculado.value || 0,
    }

    passo.value = 3
    await carregarVeiculosNoPatio()
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Erro ao registrar saída e pagamento.'
  } finally {
    loading.value = false
  }
}

function reiniciar() {
  passo.value = 1
  placa.value = ''
  movimentacao.value = {}
  permanenciaMinutos.value = 0
  valorDevido.value = '0.00'
  dentroCarencia.value = false
  error.value = ''
  carregarVeiculosNoPatio()
}

function formatarDataHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatarTempo(minutos) {
  if (!minutos || minutos < 0) return '0 min'
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${h}h ${m}min`
}

onMounted(() => {
  carregarVeiculosNoPatio()
})
</script>

<style scoped>
.page {
  padding: 2rem;
  max-width: 860px;
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

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.2px;
}

.card-subtitle {
  font-size: 0.82rem;
  color: #64748b;
  display: block;
  margin-top: 0.2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  gap: 1rem;
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

.quick-pick {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.quick-title {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip-plate {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.15s;
}

.chip-plate:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.chip-plate:hover .chip-code,
.chip-plate:hover .chip-type {
  color: #ffffff;
}

.chip-code {
  font-family: monospace;
  font-weight: 700;
  font-size: 0.85rem;
  color: #0f172a;
}

.chip-type {
  font-size: 0.72rem;
  color: #64748b;
}

/* Resumo */
.summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.plate-line {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.ticket-plate {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 1.4rem;
  font-weight: 800;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.25rem 0.75rem;
  letter-spacing: 1.5px;
  color: #0f172a;
}

.mensalista-text {
  font-size: 0.85rem;
  color: #047857;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.s-label {
  font-size: 0.78rem;
  color: #64748b;
}

.s-value {
  font-size: 0.88rem;
  color: #0f172a;
}

/* Saldo Card */
.saldo-card {
  background: #0f172a;
  color: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  border: 1px solid #1e293b;
}

.saldo-card.saldo-zero {
  background: #064e3b;
  border-color: #047857;
}

.saldo-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #94a3b8;
  margin-bottom: 0.35rem;
}

.saldo-amount {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -1px;
  color: #ffffff;
}

.saldo-description {
  font-size: 0.85rem;
  color: #cbd5e1;
  margin-top: 0.5rem;
}

/* Pagamento */
.payment-section {
  margin-bottom: 1.5rem;
}

.section-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.payment-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #475569;
  background: #ffffff;
  transition: all 0.15s;
}

.payment-option input {
  display: none;
}

.payment-option:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.payment-option.selected {
  border-color: #0284c7;
  background: #f0f9ff;
  color: #0284c7;
}

.opt-icon {
  flex-shrink: 0;
}

.troco-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.1rem;
  margin-bottom: 1.25rem;
}

.form-group-troco label {
  font-size: 0.82rem;
  color: #334155;
}

.form-group-troco input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  box-sizing: border-box;
}

.troco-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.t-label {
  font-size: 0.85rem;
  color: #475569;
}

.t-amount {
  font-size: 1.15rem;
  color: #059669;
}

/* Botões */
.actions-row {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  flex: 2;
  background: #0284c7;
  color: #ffffff;
  border: 1px solid #0369a1;
  border-radius: 6px;
  padding: 0.85rem 1.25rem;
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
  flex: 1;
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.85rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-outline:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
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

/* Recibo */
.receipt-card {
  border-color: #cbd5e1;
}

.receipt-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.receipt-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.receipt-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.receipt-subtitle {
  color: #64748b;
  font-size: 0.82rem;
  margin: 0;
}

.receipt-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.receipt-plate {
  font-family: monospace;
  font-size: 1.6rem;
  font-weight: 800;
  text-align: center;
  color: #0f172a;
  margin-bottom: 1.25rem;
  letter-spacing: 2px;
}

.receipt-rows {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.r-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
}

.r-row.r-highlight {
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.65rem 0;
  margin: 0.35rem 0;
}

.r-label {
  color: #64748b;
}

.r-val {
  color: #0f172a;
  font-weight: 500;
}

.r-amount {
  font-size: 1.25rem;
  color: #059669;
}

.badge-pill {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.badge-rotativo { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
.badge-mensalista { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

.badge-status-closed {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 700;
}

.text-green { color: #059669; }
.text-slate { color: #475569; }
.font-semibold { font-weight: 600; }

@media (max-width: 640px) {
  .page {
    padding: 1.25rem;
  }

  .actions-row {
    flex-direction: column;
  }

  .saldo-amount {
    font-size: 2.2rem;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
