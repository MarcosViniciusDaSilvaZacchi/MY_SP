<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="brand-logo">P</div>
        <h1>MY Service Parking</h1>
        <p>Acesse o painel de controle operacional</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">E-mail corporativo</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="usuario@myparking.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="senha">Senha de acesso</label>
          <input
            id="senha"
            v-model="form.senha"
            type="password"
            placeholder="Digite sua senha"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="erro" class="error-banner">
          {{ erro }}
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Autenticando...' : 'Entrar no Sistema' }}
        </button>
      </form>

      <div class="credentials-box">
        <span class="box-title">Credenciais de Teste</span>
        <div class="cred-row">
          <span>Administrador:</span>
          <code>admin@myparking.com / admin123</code>
        </div>
        <div class="cred-row">
          <span>Operador:</span>
          <code>operador@myparking.com / op123</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ email: '', senha: '' })
const loading = ref(false)
const erro = ref('')

async function handleLogin() {
  loading.value = true
  erro.value = ''
  try {
    await auth.login(form.email, form.senha)
    router.push('/dashboard')
  } catch (e) {
    erro.value = e.response?.data?.error || 'Erro ao realizar login. Verifique as credenciais.'
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
  background: #0f172a;
  padding: 1.5rem;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid #e2e8f0;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-logo {
  width: 44px;
  height: 44px;
  background: #0284c7;
  color: #ffffff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 auto 1rem;
}

.login-header h1 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem;
  letter-spacing: -0.4px;
}

.login-header p {
  color: #64748b;
  margin: 0;
  font-size: 0.88rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  box-sizing: border-box;
  color: #0f172a;
  background: #f8fafc;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-group input:focus {
  outline: none;
  border-color: #0284c7;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
}

.btn-submit {
  width: 100%;
  padding: 0.85rem;
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-submit:hover:not(:disabled) {
  background: #0369a1;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.credentials-box {
  margin-top: 1.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 0.8rem;
}

.box-title {
  display: block;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  margin-bottom: 0.6rem;
}

.cred-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  color: #64748b;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.cred-row code {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #1e293b;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.25rem;
  }
}
</style>
