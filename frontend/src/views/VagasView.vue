<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mapa de Vagas</h1>
        <p class="subtitle">Monitoramento de ocupação em tempo real por andar e categoria de vaga.</p>
      </div>
    </div>

    <!-- Indicadores de Resumo -->
    <div class="stats-row" v-if="!loading">
      <div class="stat-pill pill-green">
        <span class="pill-dot bg-green"></span>
        <span class="pill-label">Livres:</span>
        <strong class="pill-count">{{ livres }}</strong>
      </div>
      <div class="stat-pill pill-red">
        <span class="pill-dot bg-red"></span>
        <span class="pill-label">Ocupadas:</span>
        <strong class="pill-count">{{ ocupadas }}</strong>
      </div>
      <div class="stat-pill pill-gray">
        <span class="pill-dot bg-gray"></span>
        <span class="pill-label">Indisponíveis:</span>
        <strong class="pill-count">{{ indisponiveis }}</strong>
      </div>
    </div>

    <!-- Barra de Filtros -->
    <div class="filters-card card">
      <div class="filter-group">
        <label>Filtrar por Andar</label>
        <select v-model="filtroAndar">
          <option value="">Todos os andares</option>
          <option v-for="a in andares" :key="a" :value="a">Andar {{ a }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Categoria de Vaga</label>
        <select v-model="filtroTipo">
          <option value="">Todas as categorias</option>
          <option value="COMUM">Comum</option>
          <option value="PCD">PCD</option>
          <option value="IDOSO">Idoso</option>
          <option value="ELETRICO">Veículo Elétrico</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Seções por Andar -->
    <div v-for="andar in andaresVisiveis" :key="andar" class="andar-block">
      <div class="andar-header">
        <h2>Andar {{ andar }}</h2>
        <span class="andar-count">
          {{ vagasFiltradas.filter(v => v.andar === andar).length }} vagas registradas
        </span>
      </div>

      <div class="vagas-grid">
        <div
          v-for="vaga in vagasFiltradas.filter(v => v.andar === andar)"
          :key="vaga.id"
          :class="['vaga-item', statusClass(vaga.status)]"
          @click="alternarStatusVaga(vaga)"
          title="Clique para alternar o status da vaga"
        >
          <div class="vaga-header">
            <span class="vaga-code">{{ vaga.codigo || vaga.numero || ('V' + vaga.id) }}</span>
            <span class="vaga-badge">{{ vaga.tipo }}</span>
          </div>
          <div class="vaga-footer">
            <span class="vaga-state">{{ formatarStatus(vaga.status) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const loading = ref(false)
const error = ref('')
const vagas = ref([])
const filtroAndar = ref('')
const filtroTipo = ref('')

const andares = computed(() => [...new Set(vagas.value.map(v => v.andar))].sort())

const vagasFiltradas = computed(() => {
  return vagas.value.filter(v => {
    const okAndar = !filtroAndar.value || v.andar === filtroAndar.value
    const okTipo = !filtroTipo.value || v.tipo === filtroTipo.value
    return okAndar && okTipo
  })
})

const andaresVisiveis = computed(() =>
  [...new Set(vagasFiltradas.value.map(v => v.andar))].sort()
)

const livres = computed(() => vagas.value.filter(v => v.status === 'LIVRE').length)
const ocupadas = computed(() => vagas.value.filter(v => v.status === 'OCUPADA').length)
const indisponiveis = computed(() => vagas.value.filter(v => v.status === 'INDISPONIVEL').length)

function statusClass(status) {
  return {
    LIVRE: 'status-livre',
    OCUPADA: 'status-ocupada',
    INDISPONIVEL: 'status-indisponivel',
  }[status] || ''
}

function formatarStatus(status) {
  const map = {
    LIVRE: 'Livre',
    OCUPADA: 'Ocupada',
    INDISPONIVEL: 'Manutenção',
  }
  return map[status] || status
}

async function alternarStatusVaga(vaga) {
  const proximoStatus = vaga.status === 'LIVRE' ? 'OCUPADA' : (vaga.status === 'OCUPADA' ? 'INDISPONIVEL' : 'LIVRE')
  try {
    const res = await api.patch(`/vagas/${vaga.id}/status`, { status: proximoStatus })
    vaga.status = res.data.status || proximoStatus
  } catch (e) {
    console.error('Erro ao atualizar status da vaga:', e)
  }
}

async function carregarVagas() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/vagas')
    vagas.value = res.data || []
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao carregar dados das vagas.'
  } finally {
    loading.value = false
  }
}

onMounted(carregarVagas)
</script>

<style scoped>
.page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.75rem;
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

.stats-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.95rem;
  border-radius: 6px;
  font-size: 0.85rem;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.pill-green { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
.pill-red { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
.pill-gray { border-color: #e2e8f0; background: #f8fafc; color: #475569; }

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bg-green { background: #16a34a; }
.bg-red { background: #dc2626; }
.bg-gray { background: #94a3b8; }

.pill-label { font-size: 0.8rem; }
.pill-count { font-size: 0.95rem; font-weight: 700; }

.filters-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 180px;
}

.filter-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

select {
  padding: 0.55rem 0.75rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.88rem;
  background: #ffffff;
  color: #0f172a;
}

select:focus {
  outline: none;
  border-color: #0284c7;
}

.andar-block {
  margin-bottom: 2.25rem;
}

.andar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.andar-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.andar-count {
  font-size: 0.82rem;
  color: #64748b;
}

.vagas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.85rem;
}

.vaga-item {
  border-radius: 8px;
  padding: 0.85rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 80px;
  user-select: none;
}

.vaga-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.vaga-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.vaga-code {
  font-family: monospace;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.vaga-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 4px;
  border-radius: 3px;
  opacity: 0.85;
}

.vaga-state {
  font-size: 0.78rem;
  font-weight: 600;
}

/* Cores dos status */
.status-livre {
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  color: #166534;
}

.status-livre .vaga-badge {
  background: #dcfce7;
  color: #15803d;
}

.status-ocupada {
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  color: #991b1b;
}

.status-ocupada .vaga-badge {
  background: #fee2e2;
  color: #b91c1c;
}

.status-indisponivel {
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  color: #64748b;
}

.status-indisponivel .vaga-badge {
  background: #e2e8f0;
  color: #475569;
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

@media (max-width: 768px) {
  .page {
    padding: 1.25rem;
  }
}
</style>
