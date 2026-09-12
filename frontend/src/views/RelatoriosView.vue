<template>
  <div class="page">
    <h1>Relatórios</h1>

    <p v-if="loading" class="loading">Carregando...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="cards-grid" v-if="!loading">
      <div class="card">
        <div class="card-label">Entradas Hoje</div>
        <div class="card-value blue">{{ resumo.entradasHoje ?? '—' }}</div>
      </div>
      <div class="card">
        <div class="card-label">Saídas Hoje</div>
        <div class="card-value blue">{{ resumo.saidasHoje ?? '—' }}</div>
      </div>
      <div class="card">
        <div class="card-label">Faturamento do Dia</div>
        <div class="card-value green">
          {{ resumo.faturamentoDia != null ? 'R$ ' + Number(resumo.faturamentoDia).toFixed(2) : '—' }}
        </div>
      </div>
      <div class="card">
        <div class="card-label">Veículos no Pátio</div>
        <div class="card-value blue">{{ resumo.veiculosNoPatio ?? '—' }}</div>
      </div>
    </div>

    <div class="card table-card" v-if="!loading">
      <h2>Movimentações Recentes</h2>
      <table>
        <thead>
          <tr>
            <th>Placa</th>
            <th>Entrada</th>
            <th>Saída</th>
            <th>Tipo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in movimentacoes" :key="m.id">
            <td>{{ m.placa }}</td>
            <td>{{ formatDate(m.horaEntrada) }}</td>
            <td>{{ m.horaSaida ? formatDate(m.horaSaida) : '—' }}</td>
            <td>{{ m.tipo }}</td>
            <td>
              <span :class="m.horaSaida ? 'badge gray' : 'badge blue'">
                {{ m.horaSaida ? 'CONCLUÍDA' : 'EM ABERTO' }}
              </span>
            </td>
          </tr>
          <tr v-if="movimentacoes.length === 0">
            <td colspan="5" style="text-align:center;color:#64748b;">Nenhuma movimentação.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const loading = ref(false)
const error = ref('')
const resumo = ref({})
const movimentacoes = ref([])

async function carregar() {
  loading.value = true
  error.value = ''
  try {
    const [resumoRes, movRes] = await Promise.all([
      api.get('/relatorios/resumo'),
      api.get('/entradas'),
    ])
    resumo.value = resumoRes.data
    movimentacoes.value = movRes.data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao carregar relatórios.'
  } finally {
    loading.value = false
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

onMounted(carregar)
</script>

<style scoped>
.page { background: #f1f5f9; min-height: 100vh; padding: 2rem; }
h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }
h2 { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-bottom: 1rem; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.card { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.card-label { font-size: .85rem; color: #64748b; margin-bottom: .4rem; }
.card-value { font-size: 1.8rem; font-weight: 700; }
.blue { color: #0284c7; }
.green { color: #16a34a; }
.table-card { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
th { text-align: left; padding: .6rem .75rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: .8rem; text-transform: uppercase; }
td { padding: .6rem .75rem; border-bottom: 1px solid #f1f5f9; }
.badge { padding: .2rem .65rem; border-radius: 999px; font-size: .75rem; font-weight: 600; color: white; }
.badge.blue { background: #0284c7; }
.badge.gray { background: #94a3b8; }
.error { color: #dc2626; margin-bottom: 1rem; }
.loading { color: #64748b; margin-bottom: 1rem; }
</style>
