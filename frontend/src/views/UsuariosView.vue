<template>
  <div class="page">
    <h1>Usuários do Sistema</h1>

    <div class="alert">
      ⚠️ Área exclusiva de <strong>ADMIN</strong>. Somente administradores podem gerenciar usuários.
    </div>

    <div class="card table-card">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td>{{ u.nome }}</td>
            <td>{{ u.email }}</td>
            <td>
              <span :class="u.perfil === 'ADMIN' ? 'badge blue' : 'badge green'">
                {{ u.perfil }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const usuarios = ref([
  { id: 1, nome: 'Administrador', email: 'admin@estacionamento.com', perfil: 'ADMIN' },
  { id: 2, nome: 'Operador 1', email: 'operador1@estacionamento.com', perfil: 'OPERADOR' },
  { id: 3, nome: 'Operador 2', email: 'operador2@estacionamento.com', perfil: 'OPERADOR' },
])
</script>

<style scoped>
.page { background: #f1f5f9; min-height: 100vh; padding: 2rem; }
h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 1.25rem; }
.alert { background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: .85rem 1.1rem; margin-bottom: 1.5rem; color: #854d0e; font-size: .9rem; }
.card { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.table-card { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
th { text-align: left; padding: .6rem .75rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: .8rem; text-transform: uppercase; }
td { padding: .6rem .75rem; border-bottom: 1px solid #f1f5f9; }
.badge { padding: .2rem .65rem; border-radius: 999px; font-size: .75rem; font-weight: 600; color: white; }
.badge.blue { background: #0284c7; }
.badge.green { background: #16a34a; }
</style>
