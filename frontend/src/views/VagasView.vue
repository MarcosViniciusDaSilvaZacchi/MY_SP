<template>
  <div class="page">
    <h1>Vagas</h1>

    <!-- Resumo -->
    <div class="resumo" v-if="!loading">
      <span class="chip green">{{ livres }} livres</span>
      <span class="chip red">{{ ocupadas }} ocupadas</span>
      <span class="chip gray">{{ indisponiveis }} indisponíveis</span>
    </div>

    <!-- Filtros -->
    <div class="filtros">
      <select v-model="filtroAndar">
        <option value="">Todos os andares</option>
        <option v-for="a in andares" :key="a" :value="a">Andar {{ a }}</option>
      </select>
      <select v-model="filtroTipo">
        <option value="">Todos os tipos</option>
        <option value="COMUM">Comum</option>
        <option value="PCD">PCD</option>
        <option value="IDOSO">Idoso</option>
        <option value="ELETRICO">Elétrico</option>
      </select>
    </div>

    <p v-if="loading" class="loading">Carregando...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-for="andar in andaresVisiveis" :key="andar" class="andar-section">
      <h2>Andar {{ andar }}</h2>
      <div class="vagas-grid">
        <div
          v-for="vaga in vagasFiltradas.filter(v => v.andar === andar)"
          :key="vaga.id"
          :class="['vaga-card', statusClass(vaga.status)]"
        >
          <div class="vaga-num">{{ vaga.numero }}</div>
          <div class="vaga-tipo">{{ vaga.tipo }}</div>
          <div class="vaga-status">{{ vaga.status }}</div>
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
  return { LIVRE: 'vaga-livre', OCUPADA: 'vaga-ocupada', INDISPONIVEL: 'vaga-indisp' }[status] || ''
}

async function carregarVagas() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/vagas')
    vagas.value = res.data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao carregar vagas.'
  } finally {
    loading.value = false
  }
}

onMounted(carregarVagas)
</script>

<style scoped>
.page { background: #f1f5f9; min-height: 100vh; padding: 2rem; }
h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; }
h2 { font-size: 1rem; font-weight: 600; color: #475569; margin-bottom: .75rem; }
.resumo { display: flex; gap: .75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.chip { padding: .3rem .8rem; border-radius: 999px; font-size: .85rem; font-weight: 600; color: white; }
.chip.green { background: #16a34a; }
.chip.red { background: #dc2626; }
.chip.gray { background: #94a3b8; }
.filtros { display: flex; gap: .75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
select { padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .9rem; }
select:focus { outline: none; border-color: #38bdf8; }
.andar-section { margin-bottom: 2rem; }
.vagas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: .75rem; }
.vaga-card { border-radius: 10px; padding: .75rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.vaga-livre { background: #dcfce7; border: 2px solid #16a34a; }
.vaga-ocupada { background: #fee2e2; border: 2px solid #dc2626; }
.vaga-indisp { background: #f1f5f9; border: 2px solid #94a3b8; }
.vaga-num { font-size: 1.1rem; font-weight: 700; margin-bottom: .2rem; }
.vaga-tipo { font-size: .7rem; color: #475569; text-transform: uppercase; }
.vaga-status { font-size: .7rem; font-weight: 600; margin-top: .2rem; }
.vaga-livre .vaga-status { color: #16a34a; }
.vaga-ocupada .vaga-status { color: #dc2626; }
.vaga-indisp .vaga-status { color: #94a3b8; }
.error { color: #dc2626; }
.loading { color: #64748b; }
</style>
