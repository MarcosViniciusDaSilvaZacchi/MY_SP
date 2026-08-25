<template>
  <div class="app-layout">
    <nav class="sidebar">
      <div class="sidebar-header">
        <h2>&#127359; MY Parking</h2>
        <p class="user-name">{{ auth.usuario?.nome }}</p>
        <span class="badge" :class="auth.isAdmin ? 'badge-admin' : 'badge-op'">
          {{ auth.usuario?.perfil }}
        </span>
      </div>

      <ul class="nav-links">
        <li><RouterLink to="/dashboard">&#128202; Dashboard</RouterLink></li>
        <li><RouterLink to="/entrada">&#128663; Entrada</RouterLink></li>
        <li><RouterLink to="/saida">&#128682; Saida</RouterLink></li>
        <li><RouterLink to="/mensalistas">&#128100; Mensalistas</RouterLink></li>
        <li><RouterLink to="/vagas">&#127359; Vagas</RouterLink></li>
        <li v-if="auth.isAdmin"><RouterLink to="/relatorios">&#128200; Relatorios</RouterLink></li>
        <li v-if="auth.isAdmin"><RouterLink to="/usuarios">&#128101; Usuarios</RouterLink></li>
      </ul>

      <button class="btn-logout" @click="handleLogout">Sair</button>
    </nav>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
}

.sidebar {
  width: 220px;
  background: #1e293b;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem;
  gap: 1rem;
  flex-shrink: 0;
}

.sidebar-header { margin-bottom: 0.5rem; }
.sidebar-header h2 { margin: 0 0 0.4rem; font-size: 1.1rem; color: #38bdf8; }
.user-name { margin: 0 0 0.4rem; font-size: 0.82rem; color: #94a3b8; }

.badge {
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.badge-admin { background: #7c3aed; color: #fff; }
.badge-op    { background: #0284c7; color: #fff; }

.nav-links { list-style: none; padding: 0; margin: 0; flex: 1; }
.nav-links li a {
  display: block;
  padding: 0.55rem 0.6rem;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.88rem;
  transition: background 0.15s, color 0.15s;
  margin-bottom: 2px;
}
.nav-links li a:hover,
.nav-links li a.router-link-active {
  background: #334155;
  color: #38bdf8;
}

.btn-logout {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 0.55rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  width: 100%;
  transition: background 0.15s;
}
.btn-logout:hover { background: #b91c1c; }

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f1f5f9;
  padding: 2rem;
}
</style>
