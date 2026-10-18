<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Clientes Mensalistas</h1>
        <p class="subtitle">Cadastre planos mensais, consulte veículos vinculados e acompanhe a situação de pagamento.</p>
      </div>
      <button class="btn-primary" @click="showForm = !showForm">
        <svg v-if="!showForm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>{{ showForm ? 'Fechar Formulário' : 'Novo Contrato Mensalista' }}</span>
      </button>
    </div>

    <!-- Formulário de Cadastro -->
    <div v-if="showForm" class="card form-card">
      <h2 class="card-title">Cadastrar Novo Contrato Mensalista</h2>
      <form @submit.prevent="criarMensalista">
        <div class="form-grid">
          <div class="form-group">
            <label>Nome Completo / Razão Social</label>
            <input v-model="form.nome" placeholder="Ex: João da Silva" required />
          </div>
          <div class="form-group">
            <label>CPF / Documento</label>
            <input v-model="form.cpf" required maxlength="14" placeholder="000.000.000-00" />
          </div>
          <div class="form-group">
            <label>E-mail de Faturamento</label>
            <input v-model="form.email" type="email" placeholder="cliente@empresa.com.br" required />
          </div>
          <div class="form-group">
            <label>Placa Vinculada</label>
            <input
              v-model="form.placa"
              @input="form.placa = form.placa.toUpperCase().replace(/[^A-Z0-9]/g, '')"
              maxlength="7"
              placeholder="ABC1D23"
              required
            />
          </div>
          <div class="form-group">
            <label>Dia de Vencimento</label>
            <input v-model="form.vencimento" type="number" min="1" max="31" placeholder="Ex: 10" required />
          </div>
        </div>

        <div v-if="formError" class="error-banner">
          {{ formError }}
        </div>

        <div class="form-actions">
          <button class="btn-primary" type="submit" :disabled="formLoading">
            {{ formLoading ? 'Processando...' : 'Salvar Contrato' }}
          </button>
          <button class="btn-outline" type="button" @click="showForm = false">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Tabela de Mensalistas -->
    <div class="card table-card">
      <div class="table-toolbar">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="busca" placeholder="Pesquisar por placa vinculada..." @input="buscarMensalistas" />
        </div>
        <span class="count-label">{{ mensalistas.length }} contrato(s) listado(s)</span>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Titular</th>
              <th>CPF</th>
              <th>E-mail</th>
              <th>Placa</th>
              <th>Vencimento</th>
              <th>Situação Cadastral</th>
              <th class="text-right">Controle</th>
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
              <td class="text-sm">{{ formatarVencimento(m.vencimento) }}</td>
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
              <td colspan="7" class="empty-state">Nenhum mensalista encontrado para os critérios informados.</td>
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
    const ordem = ['EM_DIA', 'INADIMPLENTE', 'BLOQUEADO', 'INATIVO']
    const idx = ordem.indexOf(m.status)
    const novoStatus = ordem[(idx + 1) % ordem.length]
    await api.patch(`/mensalistas/${m.id}`, { status: novoStatus })
    await carregarMensalistas(busca.value)
  } catch (e) {
    error.value = e?.response?.data?.message || 'Erro ao atualizar situação do mensalista.'
  }
}

function formatarVencimento(v) {
  if (!v) return '—'
  const str = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [ano, mes, dia] = str.split('-')
    return `${dia}/${mes}/${ano}`
  }
  return `Todo dia ${str}`
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
  margin: 0 0 0.2rem;
  letter-spacing: -0.4px;
}

.subtitle {
  color: #64748b;
  font-size: 0.88rem;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.4rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1.15rem;
}

.form-card {
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

.form-group input {
  width: 100%;
  padding: 0.62rem 0.8rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.88rem;
  color: #0f172a;
  background: #f8fafc;
}

.form-group input:focus {
  outline: none;
  border-color: #2b7ab5;
  background: #ffffff;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 340px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding: 0.55rem 0.8rem 0.55rem 2.2rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  background: #f8fafc;
  color: #0f172a;
}

.search-box input:focus {
  outline: none;
  border-color: #2b7ab5;
  background: #ffffff;
}

.count-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

th {
  text-align: left;
  padding: 0.75rem 0.85rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}

.font-medium { font-weight: 600; }
.font-mono { font-family: var(--font-mono); }
.text-sm { font-size: 0.84rem; }
.text-right { text-align: right; }

.plate-tag {
  font-family: var(--font-mono);
  font-weight: 700;
  background: #f8fafc;
  padding: 0.22rem 0.55rem;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  color: #0f172a;
}

.badge-pill {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
}

.badge-em-dia { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.badge-inadimplente { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.badge-bloqueado { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.badge-inativo { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #1b314c;
  color: #ffffff;
  border: 1px solid #112239;
  border-radius: 7px;
  padding: 0.58rem 1.05rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #2b7ab5;
  border-color: #1d6396;
}

.btn-outline {
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  padding: 0.58rem 1.05rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-action {
  background: #f8fafc;
  color: #1b314c;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-action:hover {
  background: #1b314c;
  color: #ffffff;
  border-color: #1b314c;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 7px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.empty-state {
  text-align: center;
  padding: 2.25rem;
  color: #94a3b8;
}

@media (max-width: 640px) {
  .page {
    padding: 1.15rem;
  }
}
</style>
