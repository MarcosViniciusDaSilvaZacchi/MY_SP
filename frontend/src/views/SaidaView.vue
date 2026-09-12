<template>
  <div class="page">
    <h1>Registrar Saída</h1>

    <!-- Passo 1 -->
    <div v-if="passo === 1" class="card">
      <h2>Passo 1 — Buscar Veículo</h2>
      <label>Placa</label>
      <input
        v-model="placa"
        @input="placa = placa.toUpperCase()"
        maxlength="8"
        placeholder="ABC1D23"
        :disabled="loading"
      />
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn-primary" @click="buscar" :disabled="loading || !placa">
        {{ loading ? 'Carregando...' : 'Buscar' }}
      </button>
    </div>

    <!-- Passo 2 -->
    <div v-if="passo === 2" class="card">
      <h2>Passo 2 — Detalhes da Saída</h2>
      <div class="info-row"><span>Placa:</span><strong>{{ movimentacao.placa }}</strong></div>
      <div class="info-row"><span>Entrada:</span><strong>{{ formatDate(movimentacao.horaEntrada) }}</strong></div>
      <div class="info-row"><span>Permanência:</span><strong>{{ permanencia }} min</strong></div>
      <div class="info-row"><span>Valor:</span><strong class="green">R$ {{ valorCalculado }}</strong></div>

      <label style="margin-top:1rem;">Forma de Pagamento</label>
      <select v-model="formaPagamento">
        <option value="DINHEIRO">Dinheiro</option>
        <option value="CARTAO">Cartão</option>
        <option value="PIX">PIX</option>
      </select>

      <p v-if="error" class="error">{{ error }}</p>
      <div class="btn-row">
        <button class="btn-secondary" @click="passo = 1">Voltar</button>
        <button class="btn-primary" @click="confirmar" :disabled="loading">
          {{ loading ? 'Carregando...' : 'Confirmar Saída' }}
        </button>
      </div>
    </div>

    <!-- Passo 3 -->
    <div v-if="passo === 3" class="card recibo">
      <h2>✅ Saída Registrada</h2>
      <p>Recibo gerado com sucesso.</p>
      <div class="info-row"><span>Placa:</span><strong>{{ movimentacao.placa }}</strong></div>
      <div class="info-row"><span>Entrada:</span><strong>{{ formatDate(movimentacao.horaEntrada) }}</strong></div>
      <div class="info-row"><span>Permanência:</span><strong>{{ permanencia }} min</strong></div>
      <div class="info-row"><span>Valor Pago:</span><strong class="green">R$ {{ valorCalculado }}</strong></div>
      <div class="info-row"><span>Pagamento:</span><strong>{{ formaPagamento }}</strong></div>
      <button class="btn-primary" style="margin-top:1rem;" @click="reiniciar">Novo</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'

const passo = ref(1)
const placa = ref('')
const loading = ref(false)
const error = ref('')
const movimentacao = ref({})
const permanencia = ref(0)
const valorCalculado = ref('0.00')
const formaPagamento = ref('DINHEIRO')

async function buscar() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/movimentacoes/aberta', { params: { placa: placa.value } })
    movimentacao.value = res.data

    const entrada = new Date(res.data.horaEntrada)
    const agora = new Date()
    permanencia.value = Math.ceil((agora - entrada) / 60000)

    const calcRes = await api.post('/pagamentos/calcular', {
      movimentacaoId: res.data.id,
      minutos: permanencia.value,
    })
    valorCalculado.value = Number(calcRes.data.valor).toFixed(2)
    passo.value = 2
  } catch (e) {
    error.value = e?.response?.data?.message || 'Veículo não encontrado ou sem movimentação aberta.'
  } finally {
    loading.value = false
  }
}

async function confirmar() {
  loading.value = true
  error.value = ''
  try {
    await api.post('/saidas', { movimentacaoId: movimentacao.value.id })
    await api.post('/pagamentos', {
      movimentacaoId: movimentacao.value.id,
      valor: valorCalculado.value,
      forma: formaPagamento.value,
    })
    passo.value = 3
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao confirmar saída.'
  } finally {
    loading.value = false
  }
}

function reiniciar() {
  passo.value = 1
  placa.value = ''
  movimentacao.value = {}
  valorCalculado.value = '0.00'
  permanencia.value = 0
  error.value = ''
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}
</script>

<style scoped>
.page { background: #f1f5f9; min-height: 100vh; padding: 2rem; }
h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }
h2 { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-bottom: 1rem; }
.card { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); max-width: 480px; }
label { display: block; font-size: .85rem; color: #374151; margin-bottom: .4rem; }
input, select { width: 100%; padding: .55rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; margin-bottom: .75rem; box-sizing: border-box; }
input:focus, select:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 2px #bae6fd; }
.info-row { display: flex; gap: .75rem; margin-bottom: .5rem; }
.info-row span:first-child { color: #64748b; min-width: 90px; }
.green { color: #16a34a; }
.btn-row { display: flex; gap: .75rem; margin-top: .75rem; }
.btn-primary { background: #0284c7; color: white; border: none; border-radius: 6px; padding: .5rem 1.2rem; cursor: pointer; font-size: .9rem; flex: 1; }
.btn-primary:hover:not(:disabled) { background: #0369a1; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-secondary { background: #f1f5f9; color: #0284c7; border: 1px solid #0284c7; border-radius: 6px; padding: .45rem 1.1rem; cursor: pointer; font-size: .9rem; }
.btn-secondary:hover { background: #e0f2fe; }
.error { color: #dc2626; font-size: .85rem; margin-bottom: .5rem; }
.recibo { border-top: 4px solid #16a34a; }
</style>
