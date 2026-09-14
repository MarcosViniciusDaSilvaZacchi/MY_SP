<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Gestão de Mensalistas</h1>
        <p class="subtitle">Cadastro de clientes com planos mensais e controle de adimplência.</p>
      </div>
      <button class="btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Fechar Formulário' : 'Novo Cadastro de Mensalista' }}
      </button>
    </div>

    <!-- Formulário inline -->
    <div v-if="showForm" class="card form-card">
      <h2 class="card-title">Cadastrar Novo Mensalista</h2>
      <form @submit.prevent="criarMensalista">
        <div class="form-grid">
          <div class="form-group">
            <label>Nome Completo</label>
            <input v-model="form.nome" placeholder="Ex: João da Silva" required />
          </div>
          <div class="form-group">
            <label>CPF</label>
            <input v-model="form.cpf" required maxlength="14" placeholder="000.000.000-00" />
          </div>
          <div class="form-group">
            <label>E-mail de Contato</label>
            <input v-model="form.email" type="email" placeholder="cliente@email.com" required />
          </div>
          <div class="form-group">
            <label>Placa Vinculada</label>
            <input v-model="form.placa" @input="form.placa = form.placa.toUpperCase().replace(/[^A-Z0-9]/g, '')" maxlength="7" placeholder="ABC1D23" required />
          </div>
          <div class="form-group">
            <label>Dia do Vencimento</label>
            <input v-model="form.vencimento" type="number" min="1" max="31" placeholder="Ex: 10" required />
          </div>
        </div>

        <div v-if="formError" class="error-banner">
          {{ formError }}
        </div>

        <div class="form-actions">
          <button class="btn-primary" type="submit" :disabled="formLoading">
            {{ formLoading ? 'Salvando...' : 'Salvar Cadastro' }}
          </button>
          <button class="btn-outline" type="button" @click="showForm = false">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <!-- Busca e Filtros -->
    <div class="filter-bar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="busca" placeholder="Filtrar por placa do veículo..." @input="buscarMensalistas" />
      </div>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div class="card table-card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>E-mail</th>
              <th>Placa</th>
              <th>Vencimento</th>
              <th>Situação</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in mensalistas" :key="m.id">
              <td class="font-medium text-slate-900">{{ m.nome }}</td>
              <td class="font-mono text-sm">{{ m.cpf }}</td>
              <td class="text-sm text-slate-500">{{ m.email }}</td>
              <td>
                <span class="plate-tag">{{ m.placa }}</span>
              </td>
              <td class="text-sm">Dia {{ m.vencimento }}</td>
              <td>
                <span :class="['badge-pill', statusBadge(m.status)]">{{ m.status }}</span>
              </td>
              <td class="text-right">
                <button class="btn-action" @click="toggleStatus(m)">
                  Alternar Situação
                </button>
              </td>
            </tr>
            <tr v-if="mensalistas.length === 0 && !loading">
              <td colspan="7" class="empty-state">Nenhum mensalista cadastrado com os critérios informados.</td>
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
    mensalistas.value = res.data || []
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
    formError.value = e?.response?.data?.error || e?.response?.data?.message || 'Erro ao cadastrar mensalista.'
  } finally {
    formLoading.value = false
  }
}

async function toggleStatus(m) {
  try {
    const novoStatus = m.status === 'EM_DIA' ? 'INADIMPLENTE' : 'EM_DIA'
    await api.patch(`/mensalistas/${m.id}`, { status: novoStatus })
    await carregarMensalistas(busca.value)
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao atualizar situação do mensalista.'
  }
}

function statusBadge(status) {
  const map = {
    EM_DIA: 'badge-em-dia',
    INADIMPLENTE: 'badge-inadimplente',
    BLOQUEADO: 'badge-bloqueado',
  }
  return map[status] || 'badge-inativo'
}

onMounted(() => carregarMensalistas())
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
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: 1rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
  letter-spacing: -0.3px;
}

.subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1.25rem;
}

.form-card {
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

.form-group input {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  box-sizing: border-box;
  color: #0f172a;
}

.form-group input:focus {
  outline: none;
  border-color: #0284c7;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
}

.filter-bar {
  margin-bottom: 1.25rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 360px;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding: 0.6rem 0.8rem 0.6rem 2.2rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.88rem;
  box-sizing: border-box;
}

.search-box input:focus {
  outline: none;
  border-color: #0284c7;
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

.font-medium { font-weight: 600; }
.font-mono { font-family: monospace; }
.text-sm { font-size: 0.85rem; }
.text-right { text-align: right; }

.plate-tag {
  font-family: monospace;
  font-weight: 700;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  color: #0f172a;
}

.badge-pill {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.badge-em-dia {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.badge-inadimplente {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.badge-bloqueado {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.badge-inativo {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.btn-primary {
  background: #0284c7;
  color: #ffffff;
  border: 1px solid #0369a1;
  border-radius: 6px;
  padding: 0.65rem 1.15rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #0369a1;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.65rem 1.15rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-action {
  background: #f8fafc;
  color: #0284c7;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-action:hover {
  background: #e0f2fe;
  border-color: #0284c7;
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
