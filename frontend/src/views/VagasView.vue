<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Mapa de Ocupação de Vagas</h1>
        <p class="subtitle">Monitoramento físico por pavimento e categoria operacional. Clique em uma vaga para alternar seu status.</p>
      </div>
      <button class="btn-primary" @click="carregarVagas" :disabled="loading">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        <span>{{ loading ? 'Sincronizando...' : 'Atualizar Mapa' }}</span>
      </button>
    </div>

    <!-- Barra Unificada de Indicadores e Filtros -->
    <div class="toolbar-card">
      <div class="stats-row">
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
          <span class="pill-label">Manutenção:</span>
          <strong class="pill-count">{{ indisponiveis }}</strong>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label>Pavimento / Andar</label>
          <select v-model="filtroAndar">
            <option value="">Todos os pavimentos</option>
            <option v-for="a in andares" :key="a" :value="a">Pavimento {{ a }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Categoria de Vaga</label>
          <select v-model="filtroTipo">
            <option value="">Todas as categorias</option>
            <option value="COMUM">Comum</option>
            <option value="PCD">PCD (Acessibilidade)</option>
            <option value="IDOSO">Idoso</option>
            <option value="GESTANTE">Gestante</option>
            <option value="ELETRICO">Recarga Elétrica</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Seções por Andar -->
    <div v-for="andar in andaresVisiveis" :key="andar" class="andar-block">
      <div class="andar-header">
        <div class="andar-title-group">
          <span class="andar-tag">PAVIMENTO {{ andar }}</span>
          <h2>Setor {{ andar }}</h2>
        </div>
        <span class="andar-count">
          {{ vagasFiltradas.filter(v => v.andar === andar).length }} vaga(s) exibida(s)
        </span>
      </div>

      <div class="vagas-grid">
        <button
          v-for="vaga in vagasFiltradas.filter(v => v.andar === andar)"
          :key="vaga.id"
          type="button"
          :class="['vaga-item', statusClass(vaga.status)]"
          @click="alternarStatusVaga(vaga)"
          title="Clique para alternar entre Livre, Ocupada e Manutenção"
        >
          <div class="vaga-header">
            <span class="vaga-code">{{ vaga.codigo || vaga.numero || ('V' + vaga.id) }}</span>
            <span class="vaga-badge">{{ vaga.tipo }}</span>
          </div>
          <div class="vaga-footer">
            <span class="vaga-dot"></span>
            <span class="vaga-state">{{ formatarStatus(vaga.status) }}</span>
          </div>
        </button>
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
  padding: 1.75rem 2rem;
  max-width: 1320px;
  width: 100%;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
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

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #1b314c;
  color: #ffffff;
  border: 1px solid #112239;
  border-radius: 7px;
  padding: 0.58rem 1.05rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #2b7ab5;
  border-color: #1d6396;
}

.toolbar-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.15rem 1.35rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.stats-row {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.9rem;
  border-radius: 7px;
  font-size: 0.82rem;
  border: 1px solid #e2e8f0;
}

.pill-green { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
.pill-red { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
.pill-gray { border-color: #cbd5e1; background: #f8fafc; color: #475569; }

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bg-green { background: #16a34a; }
.bg-red { background: #dc2626; }
.bg-gray { background: #64748b; }

.pill-label { font-weight: 500; }
.pill-count { font-size: 0.92rem; font-weight: 800; }

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 190px;
}

.filter-group label {
  font-size: 0.76rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

select {
  padding: 0.52rem 0.75rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  background: #f8fafc;
  color: #0f172a;
}

select:focus {
  outline: none;
  border-color: #2b7ab5;
  background: #ffffff;
}

.andar-block {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.35rem;
  margin-bottom: 1.35rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.andar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.andar-title-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.andar-tag {
  background: #1b314c;
  color: #f5b324;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.22rem 0.55rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.andar-header h2 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.andar-count {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.vagas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.vaga-item {
  border-radius: 8px;
  padding: 0.85rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 82px;
  text-align: left;
}

.vaga-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.vaga-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.65rem;
}

.vaga-code {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 800;
}

.vaga-badge {
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 4px;
}

.vaga-footer {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.vaga-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.vaga-state {
  font-size: 0.76rem;
  font-weight: 600;
}

/* Status */
.status-livre {
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  color: #166534;
}
.status-livre .vaga-badge { background: #dcfce7; color: #15803d; }
.status-livre .vaga-dot { background: #16a34a; }

.status-ocupada {
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  color: #991b1b;
}
.status-ocupada .vaga-badge { background: #fee2e2; color: #b91c1c; }
.status-ocupada .vaga-dot { background: #dc2626; }

.status-indisponivel {
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  color: #475569;
}
.status-indisponivel .vaga-badge { background: #e2e8f0; color: #334155; }
.status-indisponivel .vaga-dot { background: #64748b; }

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 7px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 640px) {
  .page {
    padding: 1.15rem;
  }

  .filter-group {
    width: 100%;
  }
}
</style>
