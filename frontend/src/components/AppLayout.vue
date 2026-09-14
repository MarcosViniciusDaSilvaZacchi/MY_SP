<template>
  <div class="app-layout">
    <!-- Barra superior mobile -->
    <header class="mobile-topbar">
      <div class="brand">
        <div class="logo-mark">P</div>
        <span class="brand-title">MY Parking</span>
      </div>
      <div class="mobile-topbar-actions">
        <span class="badge" :class="auth.isAdmin ? 'badge-admin' : 'badge-op'">
          {{ auth.usuario?.perfil }}
        </span>
        <button class="hamburger-btn" @click="menuAberto = !menuAberto" aria-label="Menu principal">
          <svg v-if="!menuAberto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </header>

    <!-- Overlay mobile -->
    <div v-if="menuAberto" class="backdrop" @click="menuAberto = false"></div>

    <!-- Barra lateral (Sidebar) -->
    <nav class="sidebar" :class="{ 'sidebar-open': menuAberto }">
      <div class="sidebar-header">
        <div class="brand-desktop">
          <div class="logo-mark">P</div>
          <div>
            <h2>MY Parking</h2>
            <span class="brand-tagline">Controle de Estacionamento</span>
          </div>
        </div>

        <div class="user-card">
          <div class="user-info">
            <span class="user-name">{{ auth.usuario?.nome || 'Operador' }}</span>
            <span class="user-email">{{ auth.usuario?.email }}</span>
          </div>
          <span class="badge" :class="auth.isAdmin ? 'badge-admin' : 'badge-op'">
            {{ auth.usuario?.perfil }}
          </span>
        </div>
      </div>

      <ul class="nav-links">
        <li>
          <RouterLink to="/dashboard" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9" rx="1"/>
              <rect x="14" y="3" width="7" height="5" rx="1"/>
              <rect x="14" y="12" width="7" height="9" rx="1"/>
              <rect x="3" y="16" width="7" height="5" rx="1"/>
            </svg>
            <span>Dashboard</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/entrada" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <span>Entrada</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/saida" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Saída</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/mensalistas" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Mensalistas</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/vagas" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
            </svg>
            <span>Mapa de Vagas</span>
          </RouterLink>
        </li>
        <li v-if="auth.isAdmin">
          <RouterLink to="/relatorios" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Relatórios</span>
          </RouterLink>
        </li>
        <li v-if="auth.isAdmin">
          <RouterLink to="/usuarios" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="4"/>
              <path d="M20 21a8 8 0 0 0-16 0"/>
            </svg>
            <span>Usuários</span>
          </RouterLink>
        </li>
      </ul>

      <div class="sidebar-footer">
        <button class="btn-logout" @click="handleLogout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </nav>

    <!-- Conteúdo principal -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const menuAberto = ref(false)

function fecharMenu() {
  menuAberto.value = false
}

watch(() => route.path, () => {
  menuAberto.value = false
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #0f172a;
  background: #f8fafc;
}

/* Barra superior mobile */
.mobile-topbar {
  display: none;
  background: #0f172a;
  color: #f8fafc;
  padding: 0.85rem 1.25rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 40;
  box-sizing: border-box;
  border-bottom: 1px solid #1e293b;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.logo-mark {
  width: 28px;
  height: 28px;
  background: #0284c7;
  color: #ffffff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: -0.5px;
}

.brand-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.3px;
}

.mobile-topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hamburger-btn {
  background: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.hamburger-btn:hover {
  background: #1e293b;
  color: #ffffff;
}

/* Backdrop */
.backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(2px);
  z-index: 45;
}

/* Sidebar desktop */
.sidebar {
  width: 240px;
  background: #0f172a;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  gap: 1.25rem;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  box-sizing: border-box;
  border-right: 1px solid #1e293b;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #1e293b;
}

.brand-desktop {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-desktop h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.brand-tagline {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 1px;
}

.user-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.72rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  font-size: 0.68rem;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-admin {
  background: #3b0764;
  color: #d8b4fe;
  border: 1px solid #6b21a8;
}

.badge-op {
  background: #082f49;
  color: #7dd3fc;
  border: 1px solid #0369a1;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.nav-links li a {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s;
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #64748b;
  transition: color 0.15s;
}

.nav-links li a:hover {
  background: #1e293b;
  color: #ffffff;
}

.nav-links li a:hover .nav-icon {
  color: #38bdf8;
}

.nav-links li a.router-link-active {
  background: #0284c7;
  color: #ffffff;
  font-weight: 600;
}

.nav-links li a.router-link-active .nav-icon {
  color: #ffffff;
}

.sidebar-footer {
  padding-top: 1rem;
  border-top: 1px solid #1e293b;
}

.btn-logout {
  background: transparent;
  color: #cbd5e1;
  border: 1px solid #334155;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.15s;
}

.btn-logout:hover {
  background: #7f1d1d;
  color: #fecaca;
  border-color: #991b1b;
}

.main-content {
  flex: 1;
  min-width: 0;
  background: #f8fafc;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .mobile-topbar {
    display: flex;
  }

  .backdrop {
    display: block;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .main-content {
    margin-top: 56px;
  }
}
</style>
