<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Dashboard Operacional</h1>
        <p class="subtitle">Indicadores consolidados e taxa de ocupação em tempo real.</p>
      </div>
      <button class="btn-primary" @click="loadData" :disabled="loading">
        <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        <span>{{ loading ? 'Atualizando...' : 'Atualizar Dados' }}</span>
      </button>
    </div>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div v-if="loading && !error" class="loading-state">
      Carregando indicadores do sistema...
    </div>

    <div v-if="!loading" class="cards-grid">
      <!-- Vagas Livres -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Vagas Disponíveis</span>
          <div class="metric-icon icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
            </svg>
          </div>
        </div>
        <div class="metric-value text-green">{{ disponibilidade.livres ?? '—' }}</div>
        <div class="metric-footer">
          Capacidade total: {{ disponibilidade.total ?? '—' }} vagas
        </div>
      </div>

      <!-- Veículos no Pátio -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Veículos no Pátio</span>
          <div class="metric-icon icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12 1 13v3c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
        </div>
        <div class="metric-value text-blue">{{ disponibilidade.ocupadas ?? resumo.veiculosNoPatio ?? '—' }}</div>
        <div class="metric-footer">
          Ocupação: {{ disponibilidade.percentualOcupacao ?? 0 }}%
        </div>
      </div>

      <!-- Entradas Hoje -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Entradas Registradas</span>
          <div class="metric-icon icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </div>
        </div>
        <div class="metric-value text-purple">{{ resumo.totalEntradasHoje ?? resumo.entradasHoje ?? '—' }}</div>
        <div class="metric-footer">
          Total de movimentações no dia
        </div>
      </div>

      <!-- Faturamento do Dia -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Faturamento Consolidado</span>
          <div class="metric-icon icon-emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>
        <div class="metric-value text-emerald">
          R$ {{ Number(resumo.faturamentoHoje ?? resumo.faturamentoDia ?? 0).toFixed(2) }}
        </div>
        <div class="metric-footer">
          Receita bruta acumulada hoje
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
    disponibilidade.value = dispRes.data || {}
    resumo.value = resumoRes.data || {}
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Erro ao carregar dados operacionais.'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
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

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #0284c7;
  color: #ffffff;
  border: 1px solid #0369a1;
  border-radius: 6px;
  padding: 0.6rem 1.1rem;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  transition: all 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #0369a1;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.metric-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.4rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: box-shadow 0.15s;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.07);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
}

.metric-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.icon-blue { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
.icon-purple { background: #faf5ff; color: #9333ea; border: 1px solid #e9d5ff; }
.icon-emerald { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }

.metric-value {
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.1;
  margin-bottom: 0.75rem;
}

.text-green { color: #16a34a; }
.text-blue { color: #0284c7; }
.text-purple { color: #9333ea; }
.text-emerald { color: #059669; }

.metric-footer {
  font-size: 0.8rem;
  color: #94a3b8;
  padding-top: 0.65rem;
  border-top: 1px solid #f1f5f9;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.88rem;
  margin-bottom: 1.5rem;
}

.loading-state {
  color: #64748b;
  font-size: 0.9rem;
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .page {
    padding: 1.25rem;
  }
}
</style>
