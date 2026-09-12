<template>
  <div class="page">
    <div class="page-header">
      <h1>Dashboard</h1>
      <button class="btn-primary" @click="loadData" :disabled="loading">
        {{ loading ? 'Carregando...' : 'Atualizar' }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading && !error" class="loading">Carregando...</p>

    <div v-if="!loading" class="cards-grid">
      <div class="card">
        <div class="card-label">Vagas Livres</div>
        <div class="card-value green">{{ disponibilidade.livres ?? '—' }}</div>
      </div>
      <div class="card">
        <div class="card-label">Veículos no Pátio</div>
        <div class="card-value blue">{{ disponibilidade.ocupadas ?? '—' }}</div>
      </div>
      <div class="card">
        <div class="card-label">Entradas Hoje</div>
        <div class="card-value blue">{{ resumo.entradasHoje ?? '—' }}</div>
      </div>
      <div class="card">
        <div class="card-label">Faturamento do Dia</div>
        <div class="card-value green">
          {{ resumo.faturamentoDia != null ? 'R$ ' + Number(resumo.faturamentoDia).toFixed(2) : '—' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const loading = ref(false)
const error = ref('')
const disponibilidade = ref({})
const resumo = ref({})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [dispRes, resumoRes] = await Promise.all([
      api.get('/vagas/disponibilidade'),
      api.get('/relatorios/resumo'),
    ])
    disponibilidade.value = dispRes.data
    resumo.value = resumoRes.data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao carregar dados.'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page { background: #f1f5f9; min-height: 100vh; padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }
.card { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.card-label { font-size: .85rem; color: #64748b; margin-bottom: .5rem; }
.card-value { font-size: 2rem; font-weight: 700; }
.green { color: #16a34a; }
.blue { color: #0284c7; }
.btn-primary { background: #0284c7; color: white; border: none; border-radius: 6px; padding: .5rem 1.2rem; cursor: pointer; font-size: .9rem; }
.btn-primary:hover:not(:disabled) { background: #0369a1; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.error { color: #dc2626; margin-bottom: 1rem; }
.loading { color: #64748b; margin-bottom: 1rem; }
</style>
