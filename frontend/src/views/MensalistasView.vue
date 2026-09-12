<template>
  <div class="page">
    <div class="page-header">
      <h1>Mensalistas</h1>
      <button class="btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Cancelar' : 'Novo Mensalista' }}
      </button>
    </div>

    <!-- Formulário inline -->
    <div v-if="showForm" class="card form-card">
      <h2>Novo Mensalista</h2>
      <form @submit.prevent="criarMensalista">
        <div class="form-grid">
          <div>
            <label>Nome</label>
            <input v-model="form.nome" required />
          </div>
          <div>
            <label>CPF</label>
            <input v-model="form.cpf" required maxlength="14" placeholder="000.000.000-00" />
          </div>
          <div>
            <label>Email</label>
            <input v-model="form.email" type="email" required />
          </div>
          <div>
            <label>Placa</label>
            <input v-model="form.placa" @input="form.placa = form.placa.toUpperCase()" maxlength="8" required />
          </div>
          <div>
            <label>Vencimento (dia)</label>
            <input v-model="form.vencimento" type="number" min="1" max="31" required />
          </div>
        </div>
        <p v-if="formError" class="error">{{ formError }}</p>
        <button class="btn-primary" type="submit" :disabled="formLoading">
          {{ formLoading ? 'Carregando...' : 'Salvar' }}
        </button>
      </form>
    </div>

    <!-- Busca -->
    <div class="search-row">
      <input v-model="busca" placeholder="Buscar por placa..." @input="buscarMensalistas" />
    </div>

    <p v-if="loading" class="loading">Carregando...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="card table-card" v-if="!loading">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Email</th>
            <th>Placa</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in mensalistas" :key="m.id">
            <td>{{ m.nome }}</td>
            <td>{{ m.cpf }}</td>
            <td>{{ m.email }}</td>
            <td>{{ m.placa }}</td>
            <td>Dia {{ m.vencimento }}</td>
            <td>
              <span :class="statusBadge(m.status)">{{ m.status }}</span>
            </td>
            <td>
              <button class="btn-sm" @click="toggleStatus(m)">Toggle Status</button>
            </td>
          </tr>
          <tr v-if="mensalistas.length === 0">
            <td colspan="7" style="text-align:center;color:#64748b;">Nenhum mensalista encontrado.</td>
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
const mensalistas = ref([])
const busca = ref('')
const showForm = ref(false)
const formLoading = ref(false)
const formError = ref('')

const form = ref({ nome: '', cpf: '', email: '', placa: '', vencimento: '' })

async function carregarMensalistas(placa = '') {
  loading.value = true
  error.value = ''
  try {
    const params = placa ? { placa } : {}
    const res = await api.get('/mensalistas', { params })
    mensalistas.value = res.data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao carregar mensalistas.'
  } finally {
    loading.value = false
  }
}

function buscarMensalistas() {
  carregarMensalistas(busca.value)
}

async function criarMensalista() {
  formLoading.value = true
  formError.value = ''
  try {
    await api.post('/mensalistas', form.value)
    form.value = { nome: '', cpf: '', email: '', placa: '', vencimento: '' }
    showForm.value = false
    await carregarMensalistas()
  } catch (e) {
    formError.value = e?.response?.data?.message || 'Erro ao criar mensalista.'
  } finally {
    formLoading.value = false
  }
}

async function toggleStatus(m) {
  try {
    await api.patch(`/mensalistas/${m.id}`)
    await carregarMensalistas(busca.value)
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao alterar status.'
  }
}

function statusBadge(status) {
  const map = { EM_DIA: 'badge green', INADIMPLENTE: 'badge red', BLOQUEADO: 'badge orange' }
  return map[status] || 'badge gray'
}

onMounted(() => carregarMensalistas())
</script>

<style scoped>
.page { background: #f1f5f9; min-height: 100vh; padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }
.card { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.form-card { margin-bottom: 1.25rem; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .75rem; margin-bottom: .75rem; }
label { display: block; font-size: .85rem; color: #374151; margin-bottom: .3rem; }
input { width: 100%; padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: .9rem; box-sizing: border-box; }
input:focus { outline: none; border-color: #38bdf8; }
.search-row { margin-bottom: 1rem; }
.search-row input { max-width: 300px; }
.table-card { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
th { text-align: left; padding: .6rem .75rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: .8rem; text-transform: uppercase; }
td { padding: .6rem .75rem; border-bottom: 1px solid #f1f5f9; }
.badge { padding: .2rem .65rem; border-radius: 999px; font-size: .75rem; font-weight: 600; color: white; }
.badge.green { background: #16a34a; }
.badge.red { background: #dc2626; }
.badge.orange { background: #ea580c; }
.badge.gray { background: #94a3b8; }
.btn-primary { background: #0284c7; color: white; border: none; border-radius: 6px; padding: .5rem 1.2rem; cursor: pointer; font-size: .9rem; }
.btn-primary:hover:not(:disabled) { background: #0369a1; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-sm { background: #f1f5f9; color: #0284c7; border: 1px solid #0284c7; border-radius: 5px; padding: .3rem .7rem; cursor: pointer; font-size: .8rem; }
.btn-sm:hover { background: #e0f2fe; }
.error { color: #dc2626; font-size: .85rem; margin-bottom: .75rem; }
.loading { color: #64748b; margin-bottom: .75rem; }
</style>
