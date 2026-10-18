<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Usuários e Perfis de Acesso</h1>
        <p class="subtitle">Gerenciamento de credenciais corporativas e níveis de permissão operacional.</p>
      </div>
      <button class="btn-primary" @click="showForm = !showForm">
        <svg v-if="!showForm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>{{ showForm ? 'Fechar Formulário' : 'Cadastrar Novo Usuário' }}</span>
      </button>
    </div>

    <div class="info-banner">
      <svg class="banner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>Área exclusiva da administração para cadastro e gerenciamento da equipe de operação.</span>
    </div>

    <!-- Formulário de Novo Usuário -->
    <div v-if="showForm" class="card form-card">
      <h2 class="card-title">Cadastrar Credencial Corporativa</h2>
      <form @submit.prevent="criarUsuario">
        <div class="form-grid">
          <div class="form-group">
            <label>Nome Completo do Colaborador</label>
            <input v-model="form.nome" placeholder="Ex: Maria Operadora" required />
          </div>
          <div class="form-group">
            <label>E-mail Corporativo</label>
            <input v-model="form.email" type="email" placeholder="maria@myparking.com" required />
          </div>
          <div class="form-group">
            <label>Senha Inicial</label>
            <input v-model="form.senha" type="password" placeholder="Mínimo 4 caracteres" minlength="4" required />
          </div>
          <div class="form-group">
            <label>Perfil de Permissão</label>
            <select v-model="form.perfil">
              <option value="OPERADOR">OPERADOR (Portaria e PDV)</option>
              <option value="ADMIN">ADMIN (Acesso Total)</option>
            </select>
          </div>
        </div>

        <div v-if="formError" class="error-banner">{{ formError }}</div>

        <div class="form-actions">
          <button class="btn-primary" type="submit" :disabled="formLoading">
            {{ formLoading ? 'Salvando...' : 'Confirmar Cadastro' }}
          </button>
          <button class="btn-outline" type="button" @click="showForm = false">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div class="card table-card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Colaborador</th>
              <th>E-mail Corporativo</th>
              <th>Perfil de Acesso</th>
              <th>Situação</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u.id">
              <td class="font-mono text-sm text-slate-500">#{{ u.id }}</td>
              <td class="font-medium text-slate-900">{{ u.nome }}</td>
              <td class="text-slate-600 text-sm">{{ u.email }}</td>
              <td>
                <span :class="['badge-pill', u.perfil === 'ADMIN' ? 'badge-admin' : 'badge-op']">
                  {{ u.perfil }}
                </span>
              </td>
              <td>
                <span class="badge-active">Ativo</span>
              </td>
              <td class="text-right">
                <button
                  v-if="u.id !== 1"
                  class="btn-danger"
                  @click="removerUsuario(u)"
                >
                  Revogar Acesso
                </button>
                <span v-else class="text-xs text-slate-400">Conta Principal</span>
              </td>
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

const usuarios = ref([
  { id: 1, nome: 'Administrador', email: 'admin@myparking.com', perfil: 'ADMIN' },
  { id: 2, nome: 'Operador Principal', email: 'operador@myparking.com', perfil: 'OPERADOR' },
])

const showForm = ref(false)
const formLoading = ref(false)
const formError = ref('')
const error = ref('')
const form = ref({ nome: '', email: '', senha: '', perfil: 'OPERADOR' })

async function carregarUsuarios() {
  error.value = ''
  try {
    const res = await api.get('/auth/usuarios')
    if (Array.isArray(res.data) && res.data.length > 0) {
      usuarios.value = res.data
    }
  } catch (e) {
    console.error('Erro ao carregar usuários:', e)
  }
}

async function criarUsuario() {
  formLoading.value = true
  formError.value = ''
  try {
    await api.post('/auth/usuarios', form.value)
    form.value = { nome: '', email: '', senha: '', perfil: 'OPERADOR' }
    showForm.value = false
    await carregarUsuarios()
  } catch (e) {
    formError.value = e?.response?.data?.error || 'Erro ao cadastrar usuário.'
  } finally {
    formLoading.value = false
  }
}

async function removerUsuario(u) {
  error.value = ''
  try {
    await api.delete(`/auth/usuarios/${u.id}`)
    await carregarUsuarios()
  } catch (e) {
    error.value = e?.response?.data?.error || 'Erro ao remover usuário.'
  }
}

onMounted(carregarUsuarios)
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

.info-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #1b314c;
  border-radius: 8px;
  padding: 0.85rem 1.1rem;
  margin-bottom: 1.5rem;
  color: #334155;
  font-size: 0.85rem;
}

.banner-icon {
  color: #2b7ab5;
  flex-shrink: 0;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.4rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
}

.form-card {
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1.15rem;
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.62rem 0.8rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.88rem;
  color: #0f172a;
  background: #f8fafc;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #2b7ab5;
  background: #ffffff;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
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

.btn-danger {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.32rem 0.7rem;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover {
  background: #fee2e2;
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
.text-xs { font-size: 0.75rem; }
.text-slate-400 { color: #94a3b8; }
.text-slate-500 { color: #64748b; }
.text-slate-600 { color: #475569; }
.text-slate-900 { color: #0f172a; }
.text-right { text-align: right; }

.badge-pill {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
}

.badge-admin {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.badge-op {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.badge-active {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .page {
    padding: 1.15rem;
  }
}
</style>
