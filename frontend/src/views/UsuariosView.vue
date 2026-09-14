<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Usuários e Perfis de Acesso</h1>
        <p class="subtitle">Controle de credenciais e permissões operacionais do sistema.</p>
      </div>
    </div>

    <div class="info-banner">
      <svg class="banner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <span>Módulo restrito a administradores. Gerenciamento de credenciais e auditoria de perfis.</span>
    </div>

    <div class="card table-card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Nome do Usuário</th>
              <th>E-mail Corporativo</th>
              <th>Nível de Acesso</th>
              <th>Status</th>
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const usuarios = ref([
  { id: 1, nome: 'Administrador', email: 'admin@myparking.com', perfil: 'ADMIN' },
  { id: 2, nome: 'Operador Principal', email: 'operador@myparking.com', perfil: 'OPERADOR' },
])
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

.info-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #0284c7;
  border-radius: 6px;
  padding: 0.85rem 1rem;
  margin-bottom: 1.75rem;
  color: #334155;
  font-size: 0.88rem;
}

.banner-icon {
  color: #0284c7;
  flex-shrink: 0;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
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

.badge-pill {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.badge-admin {
  background: #f3e8ff;
  color: #7e22ce;
  border: 1px solid #d8b4fe;
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
  font-size: 0.72rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .page {
    padding: 1.25rem;
  }
}
</style>
