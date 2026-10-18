<template>
  <div class="app-layout">
    <!-- Barra superior mobile/tablet -->
    <header class="mobile-topbar">
      <div class="brand-mobile">
        <img :src="logoMark" alt="MY Parking" class="logo-img-mobile" />
        <div class="brand-mobile-text">
          <span class="brand-title">MY Parking</span>
          <span class="brand-sub-mobile">Gestão de Estacionamento</span>
        </div>
      </div>
      <div class="mobile-topbar-actions">
        <span class="badge" :class="auth.isAdmin ? 'badge-admin' : 'badge-op'">
          {{ auth.usuario?.perfil || 'OPERADOR' }}
        </span>
        <button class="hamburger-btn" @click="menuAberto = !menuAberto" aria-label="Alternar menu de navegação">
          <svg v-if="!menuAberto" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </header>

    <!-- Overlay mobile -->
    <div v-if="menuAberto" class="backdrop" @click="menuAberto = false"></div>

    <!-- Barra lateral (Sidebar) -->
    <aside class="sidebar" :class="{ 'sidebar-open': menuAberto }">
      <div class="sidebar-header">
        <div class="brand-desktop">
          <div class="logo-box">
            <img :src="logoMark" alt="Logo MY Parking" class="logo-img" />
          </div>
          <div class="brand-meta">
            <h2>MY <span>Parking</span></h2>
            <span class="brand-tagline">Sistema de Estacionamento</span>
          </div>
        </div>
      </div>

      <div class="nav-section-label">OPERAÇÃO DIÁRIA</div>
      <ul class="nav-links">
        <li>
          <RouterLink to="/dashboard" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9" rx="1.5"/>
              <rect x="14" y="3" width="7" height="5" rx="1.5"/>
              <rect x="14" y="12" width="7" height="9" rx="1.5"/>
              <rect x="3" y="16" width="7" height="5" rx="1.5"/>
            </svg>
            <span>Visão Geral</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/entrada" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <span>Entrada de Veículos</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/saida" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <span>Saída e Pagamento</span>
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
        <li>
          <RouterLink to="/mensalistas" @click="fecharMenu">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Clientes Mensalistas</span>
          </RouterLink>
        </li>

        <template v-if="auth.isAdmin">
          <li class="nav-divider">
            <span>GERENCIAMENTO</span>
          </li>
          <li>
            <RouterLink to="/relatorios" @click="fecharMenu">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span>Relatórios e Caixa</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/usuarios" @click="fecharMenu">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Equipe e Acessos</span>
            </RouterLink>
          </li>
        </template>
      </ul>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">
            {{ iniciaisUsuario }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ auth.usuario?.nome || 'Operador' }}</span>
            <span class="user-email">{{ auth.usuario?.email }}</span>
          </div>
        </div>

        <button class="btn-logout" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>

    <!-- Área Principal -->
    <div class="workspace-wrapper">
      <header class="desktop-topbar">
        <div class="topbar-left">
          <span class="topbar-section">MY Parking</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron-sep">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <strong class="topbar-current">{{ nomePaginaAtual }}</strong>
        </div>

        <div class="topbar-right">
          <span class="badge" :class="auth.isAdmin ? 'badge-admin' : 'badge-op'">
            {{ auth.usuario?.perfil || 'OPERADOR' }}
          </span>
        </div>
      </header>

      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import logoMark from '../assets/logo-mark.png'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const menuAberto = ref(false)

const mapaTitulos = {
  '/dashboard': 'Visão Geral do Pátio',
  '/entrada': 'Entrada de Veículos',
  '/saida': 'Saída e Pagamento',
  '/vagas': 'Mapa de Vagas',
  '/mensalistas': 'Clientes Mensalistas',
  '/relatorios': 'Relatórios e Faturamento',
  '/usuarios': 'Equipe e Acessos',
}

const nomePaginaAtual = computed(() => mapaTitulos[route.path] || 'Painel')

const iniciaisUsuario = computed(() => {
  const nome = auth.usuario?.nome || 'OP'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('')
})

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
  min-height: 100dvh;
  width: 100%;
  background: var(--bg-app);
  color: var(--text-primary);
}

.mobile-topbar {
  display: none;
  background: #0b192c;
  color: #f8fafc;
  padding: 0.7rem 1.15rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 40;
  border-bottom: 1px solid #1b314c;
  height: 60px;
}

.brand-mobile {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.logo-img-mobile {
  width: 34px;
  height: 34px;
  object-fit: contain;
  background: #ffffff;
  padding: 3px;
  border-radius: 7px;
}

.brand-mobile-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 0.98rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
  line-height: 1.1;
}

.brand-sub-mobile {
  font-size: 0.66rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mobile-topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.hamburger-btn {
  background: #1b314c;
  border: 1px solid #254263;
  color: #f8fafc;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.hamburger-btn:hover {
  background: #2b7ab5;
}

.backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(11, 25, 44, 0.65);
  backdrop-filter: blur(2px);
  z-index: 45;
}

.sidebar {
  width: 260px;
  background: #0b192c;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 0.9rem;
  flex-shrink: 0;
  height: 100dvh;
  position: sticky;
  top: 0;
  border-right: 1px solid #1b314c;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

.sidebar-header {
  padding: 0.25rem 0.35rem 1.15rem;
  border-bottom: 1px solid #1b314c;
  margin-bottom: 1rem;
}

.brand-desktop {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-box {
  width: 44px;
  height: 44px;
  background: #ffffff;
  border-radius: 10px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  border: 1.5px solid rgba(245, 179, 36, 0.5);
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-meta h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
}

.brand-meta h2 span {
  color: #388bc7;
}

.brand-tagline {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

.nav-section-label {
  font-size: 0.66rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.08em;
  padding: 0 0.75rem;
  margin-bottom: 0.45rem;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.nav-divider {
  padding: 0.85rem 0.75rem 0.3rem;
  font-size: 0.66rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.08em;
}

.nav-links li a {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  border-left: 3px solid transparent;
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
  background: #162a45;
  color: #ffffff;
}

.nav-links li a:hover .nav-icon {
  color: #f5b324;
}

.nav-links li a.router-link-active {
  background: #1b314c;
  color: #ffffff;
  font-weight: 600;
  border-left-color: #f5b324;
}

.nav-links li a.router-link-active .nav-icon {
  color: #f5b324;
}

.sidebar-footer {
  padding-top: 0.9rem;
  border-top: 1px solid #1b314c;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.user-card {
  background: #112239;
  border: 1px solid #1b314c;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #2b7ab5;
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.7rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout {
  background: transparent;
  color: #cbd5e1;
  border: 1px solid #254263;
  padding: 0.58rem 0.85rem;
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.82rem;
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

.workspace-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-app);
}

.desktop-topbar {
  height: 58px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 30;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.topbar-section {
  color: #64748b;
  font-weight: 500;
}

.chevron-sep {
  color: #94a3b8;
}

.topbar-current {
  color: #0f172a;
  font-weight: 700;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.badge {
  font-size: 0.68rem;
  padding: 3px 8px;
  border-radius: 5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
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

.main-content {
  flex: 1;
  min-width: 0;
  width: 100%;
}

@media (max-width: 1024px) {
  .mobile-topbar {
    display: flex;
  }

  .desktop-topbar {
    display: none;
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
    box-shadow: 8px 0 30px rgba(0, 0, 0, 0.45);
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .workspace-wrapper {
    padding-top: 60px;
  }
}
</style>
