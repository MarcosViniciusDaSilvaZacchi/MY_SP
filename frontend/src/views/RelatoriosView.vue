<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Relatórios Operacionais e Financeiros</h1>
        <p class="subtitle">Consolidação de movimentações, permanência e faturamento do pátio.</p>
      </div>
      <button class="btn-primary" @click="carregar" :disabled="loading">
        <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        <span>{{ loading ? 'Atualizando...' : 'Atualizar Indicadores' }}</span>
      </button>
    </div>

    <div v-if="loading && !error" class="loading-state">
      Carregando registros e totalizações...
    </div>
    <div v-if="error" class="error-banner">{{ error }}</div>

    <div class="cards-grid" v-if="!loading">
      <div class="card">
        <div class="card-label">Entradas no Dia</div>
        <div class="card-value text-blue">{{ resumo.totalEntradasHoje ?? resumo.entradasHoje ?? 0 }}</div>
        <small class="card-sub">veículos registrados</small>
      </div>
      <div class="card">
        <div class="card-label">Saídas Finalizadas</div>
        <div class="card-value text-indigo">{{ resumo.totalSaidasHoje ?? resumo.saidasHoje ?? 0 }}</div>
        <small class="card-sub">atendimentos concluídos</small>
      </div>
      <div class="card">
        <div class="card-label">Faturamento Consolidado</div>
        <div class="card-value text-emerald">
          R$ {{ Number(resumo.faturamentoHoje ?? resumo.faturamentoDia ?? 0).toFixed(2) }}
        </div>
        <small class="card-sub">receita apurada hoje</small>
      </div>
      <div class="card">
        <div class="card-label">Veículos no Pátio</div>
        <div class="card-value text-purple">{{ resumo.veiculosNoPatio ?? 0 }}</div>
        <small class="card-sub">movimentações abertas</small>
      </div>
    </div>

    <div class="card table-card" v-if="!loading">
      <h2 class="card-title">Histórico Recente de Movimentações</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Horário de Entrada</th>
              <th>Horário de Saída</th>
              <th>Classificação</th>
              <th>Status Operacional</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movimentacoes" :key="m.id">
              <td>
                <span class="plate-box">{{ m.placa }}</span>
              </td>
              <td>{{ formatDate(m.dataHoraEntrada || m.horaEntrada) }}</td>
              <td>{{ (m.dataHoraSaida || m.horaSaida) ? formatDate(m.dataHoraSaida || m.horaSaida) : '—' }}</td>
              <td>
                <span :class="['badge-pill', m.tipo === 'MENSALISTA' ? 'badge-mensalista' : 'badge-rotativo']">
                  {{ m.tipo }}
                </span>
              </td>
              <td>
                <span :class="['badge-status', m.status === 'FINALIZADA' ? 'status-closed' : 'status-open']">
                  {{ m.status === 'FINALIZADA' ? 'Finalizada' : 'Aberta' }}
                </span>
              </td>
            </tr>
            <tr v-if="movimentacoes.length === 0">
              <td colspan="5" class="empty-state">Nenhuma movimentação registrada no período.</td>
            </tr>
          </tbody>
        </table>
      </div>
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
    resumo.value = resumoRes.data || {}
    movimentacoes.value = movRes.data || []
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Erro ao carregar relatórios.'
  } finally {
    loading.value = false
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(carregar)
</script>

<style scoped>
.page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
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

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1.25rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.35rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
}

.card-label {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.35rem;
}

.card-value {
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.card-sub {
  display: block;
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 0.35rem;
}

.text-blue { color: #0284c7; }
.text-indigo { color: #4f46e5; }
.text-emerald { color: #059669; }
.text-purple { color: #7c3aed; }

.table-card {
  margin-top: 1rem;
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

.badge-status {
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 700;
}

.status-closed {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.status-open {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.badge-pill {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
}
.badge-mensalista { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.badge-rotativo { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #0284c7;
  color: white;
  border: 1px solid #0369a1;
  border-radius: 6px;
  padding: 0.6rem 1.1rem;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #0369a1;
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

.loading-state {
  color: #64748b;
  font-size: 0.9rem;
  padding: 1.5rem 0;
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
