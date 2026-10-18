import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token   = ref(localStorage.getItem('token') || null)
  const usuario = ref(JSON.parse(localStorage.getItem('usuario') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin         = computed(() => usuario.value?.perfil === 'ADMIN')

  async function login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha })
    token.value   = data.token
    usuario.value = data.usuario
    localStorage.setItem('token',   data.token)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    return data
  }

  function logout() {
    token.value   = null
    usuario.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  return { token, usuario, isAuthenticated, isAdmin, login, logout }
})
