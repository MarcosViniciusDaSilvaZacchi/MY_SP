import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard',    name: 'Dashboard',   component: () => import('../views/DashboardView.vue') },
      { path: 'entrada',      name: 'Entrada',      component: () => import('../views/EntradaView.vue') },
      { path: 'saida',        name: 'Saida',        component: () => import('../views/SaidaView.vue') },
      { path: 'mensalistas',  name: 'Mensalistas',  component: () => import('../views/MensalistasView.vue') },
      { path: 'vagas',        name: 'Vagas',        component: () => import('../views/VagasView.vue') },
      { path: 'relatorios',   name: 'Relatorios',   component: () => import('../views/RelatoriosView.vue'), meta: { requiresAdmin: true } },
      { path: 'usuarios',     name: 'Usuarios',     component: () => import('../views/UsuariosView.vue'),   meta: { requiresAdmin: true } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    return next({ name: 'Login' })
  }
  if (to.name === 'Login' && auth.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }
  if (to.meta.requiresAdmin && auth.usuario?.perfil !== 'ADMIN') {
    return next({ name: 'Dashboard' })
  }
  next()
})

export default router
