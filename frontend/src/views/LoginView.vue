<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>&#127359; MY Service Parking</h1>
        <p>Faca login para continuar</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" type="email" placeholder="seu@email.com" required />
        </div>
        <div class="form-group">
          <label for="senha">Senha</label>
          <input id="senha" v-model="form.senha" type="password" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" required />
        </div>

        <p v-if="erro" class="erro">{{ erro }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="hint">
        <p><strong>Admin:</strong> admin@myparking.com / admin123</p>
        <p><strong>Operador:</strong> operador@myparking.com / op123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth   = useAuthStore()
const router = useRouter()

const form    = reactive({ email: '', senha: '' })
const loading = ref(false)
const erro    = ref('')

async function handleLogin() {
  loading.value = true
  erro.value    = ''
  try {
    await auth.login(form.email, form.senha)
    router.push('/dashboard')
  } catch (e) {
    erro.value = e.response?.data?.error || 'Erro ao fazer login. Verifique as credenciais.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 1rem;
}

.login-card {
  background: #fff;
  border-radius: 14px;
  padding: 2.25rem;
  width: 100%;
  max-width: 390px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.4);
}

.login-header { text-align: center; margin-bottom: 1.75rem; }
.login-header h1 { font-size: 1.5rem; color: #1e293b; margin: 0 0 0.3rem; }
.login-header p  { color: #64748b; margin: 0; font-size: 0.9rem; }

.form-group { margin-bottom: 1.1rem; }
.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.3rem;
}
.form-group input {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-group input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56,189,248,0.18);
}

.erro { color: #dc2626; font-size: 0.85rem; margin: 0.4rem 0; }

button[type='submit'] {
  width: 100%;
  padding: 0.75rem;
  background: #0284c7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.5rem;
}
button[type='submit']:hover:not(:disabled) { background: #0369a1; }
button[type='submit']:disabled { opacity: 0.55; cursor: not-allowed; }

.hint {
  margin-top: 1.5rem;
  padding: 0.8rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
  font-size: 0.78rem;
  color: #0369a1;
  line-height: 1.6;
}
.hint p { margin: 0; }
</style>
