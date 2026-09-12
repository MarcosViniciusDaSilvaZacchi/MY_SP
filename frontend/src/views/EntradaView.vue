<template>
  <div class="page">
    <h1>Registrar Entrada</h1>

    <div class="card form-card">
      <form @submit.prevent="registrar">
        <label>Placa do Veículo</label>
        <input
          v-model="placa"
          @input="placa = placa.toUpperCase()"
          maxlength="8"
          placeholder="ABC1D23"
          :disabled="loading"
        />
        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn-primary" type="submit" :disabled="loading || !placa">
          {{ loading ? 'Carregando...' : 'Registrar Entrada' }}
        </button>
      </form>
    </div>

    <div v-if="resultado" class="card result-card">
      <h2>Entrada Registrada</h2>
      <div class="result-row"><span>Placa:</span><strong>{{ resultado.placa }}</strong></div>
      <div class="result-row">
        <span>Tipo:</span>
        <span :class="resultado.tipo === 'MENSALISTA' ? 'badge green' : 'badge blue'">
          {{ resultado.tipo }}
        </span>
      </div>
      <div class="result-row"><span>Horário:</span><strong>{{ formatDate(resultado.horaEntrada) }}</strong></div>
      <button class="btn-secondary" @click="limpar">Limpar</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'

const placa = ref('')
const loading = ref(false)
const error = ref('')
const resultado = ref(null)

async function registrar() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.post('/entradas', { placa: placa.value })
    resultado.value = res.data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao registrar entrada.'
  } finally {
    loading.value = false
  }
}

function limpar() {
  placa.value = ''
  resultado.value = null
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
.form-card { margin-bottom: 1.25rem; }
label { display: block; font-size: .85rem; color: #374151; margin-bottom: .4rem; }
input { width: 100%; padding: .55rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; margin-bottom: .75rem; box-sizing: border-box; }
input:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 2px #bae6fd; }
.result-row { display: flex; gap: .75rem; align-items: center; margin-bottom: .6rem; }
.result-row span:first-child { color: #64748b; min-width: 70px; }
.badge { padding: .2rem .7rem; border-radius: 999px; font-size: .8rem; font-weight: 600; color: white; }
.badge.blue { background: #0284c7; }
.badge.green { background: #16a34a; }
.btn-primary { background: #0284c7; color: white; border: none; border-radius: 6px; padding: .5rem 1.2rem; cursor: pointer; font-size: .9rem; width: 100%; }
.btn-primary:hover:not(:disabled) { background: #0369a1; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-secondary { margin-top: .75rem; background: #f1f5f9; color: #0284c7; border: 1px solid #0284c7; border-radius: 6px; padding: .45rem 1.1rem; cursor: pointer; font-size: .9rem; }
.btn-secondary:hover { background: #e0f2fe; }
.error { color: #dc2626; font-size: .85rem; margin-bottom: .5rem; }
</style>
