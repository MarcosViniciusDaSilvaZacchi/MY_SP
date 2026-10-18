<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Painel Esquerdo: Apresentação da Marca -->
      <div class="brand-showcase">
        <div class="showcase-card">
          <img :src="logoFull" alt="MY Parking — Sistema de Estacionamento" class="showcase-logo" />
        </div>
        <div class="showcase-info">
          <h2>Gestão Completa para o seu Estacionamento</h2>
          <p>
            Controle o fluxo de entrada e saída de veículos, acompanhe a ocupação das vagas em tempo real,
            gerencie clientes mensalistas e receba pagamentos com rapidez e segurança.
          </p>
          <div class="feature-pills">
            <span class="f-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Entrada e Saída Ágil
            </span>
            <span class="f-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Pagamentos via PIX, Cartão e Dinheiro
            </span>
            <span class="f-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Relatórios em PDF e Excel
            </span>
          </div>
        </div>
      </div>

      <!-- Painel Direito: Formulário de Acesso -->
      <div class="login-card">
        <div class="login-header">
          <img :src="logoTransparent" alt="MY Parking" class="login-logo" />
          <h1>Bem-vindo ao MY Parking</h1>
          <p>Informe seu e-mail e senha para acessar o painel</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">E-mail de acesso</label>
            <div class="input-icon-wrap">
              <svg class="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="usuario@myparking.com"
                autocomplete="email"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="senha">Senha</label>
            <div class="input-icon-wrap">
              <svg class="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="senha"
                v-model="form.senha"
                type="password"
                placeholder="Digite sua senha"
                autocomplete="current-password"
                required
              />
            </div>
          </div>

          <div v-if="erro" class="error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ erro }}</span>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span>{{ loading ? 'Entrando...' : 'Acessar Sistema' }}</span>
            <svg v-if="!loading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>

        <div class="credentials-box">
          <div class="box-header">
            <span class="box-title">Contas de Acesso Rápido</span>
            <span class="box-hint">Clique para preencher</span>
          </div>
          <div class="cred-list">
            <button
              type="button"
              class="cred-btn"
              @click="preencherCredencial('admin@myparking.com', 'admin123')"
            >
              <div class="cred-role">
                <span class="role-dot dot-admin"></span>
                <strong>Administrador</strong>
              </div>
              <code>admin@myparking.com</code>
            </button>
            <button
              type="button"
              class="cred-btn"
              @click="preencherCredencial('operador@myparking.com', 'op123')"
            >
              <div class="cred-role">
                <span class="role-dot dot-op"></span>
                <strong>Operador de Caixa</strong>
              </div>
              <code>operador@myparking.com</code>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import logoFull from '../assets/logo.jpg'
import logoTransparent from '../assets/logo.png'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ email: '', senha: '' })
const loading = ref(false)
const erro = ref('')

function preencherCredencial(email, senha) {
  form.email = email
  form.senha = senha
  erro.value = ''
}

async function handleLogin() {
  loading.value = true
  erro.value = ''
  try {
    await auth.login(form.email, form.senha)
    router.push('/dashboard')
  } catch (e) {
    erro.value = e.response?.data?.error || 'Não foi possível entrar. Verifique seu e-mail e senha.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 15% 20%, #1b314c 0%, #0b192c 65%, #07111e 100%);
  padding: 1.5rem;
}

.login-container {
  width: 100%;
  max-width: 1000px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.brand-showcase {
  background: linear-gradient(160deg, #112239 0%, #1b314c 55%, #1d4e78 100%);
  color: #f8fafc;
  padding: 2.75rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.showcase-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
  border: 2px solid rgba(245, 179, 36, 0.35);
}

.showcase-logo {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.showcase-info h2 {
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin-bottom: 0.75rem;
}

.showcase-info p {
  color: #cbd5e1;
  font-size: 0.88rem;
  line-height: 1.6;
  margin-bottom: 1.35rem;
}

.feature-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.f-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
}

.f-pill svg {
  color: #f5b324;
}

.login-card {
  background: #ffffff;
  padding: 2.75rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.login-logo {
  height: 76px;
  width: auto;
  object-fit: contain;
  margin: 0 auto 0.85rem;
  display: block;
}

.login-header h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.3rem;
  letter-spacing: -0.3px;
}

.login-header p {
  color: #64748b;
  font-size: 0.85rem;
}

.form-group {
  margin-bottom: 1.15rem;
}

.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.input-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
  pointer-events: none;
}

.input-icon-wrap input {
  width: 100%;
  padding: 0.72rem 0.9rem 0.72rem 2.6rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.92rem;
  color: #0f172a;
  background: #f8fafc;
  transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;
}

.input-icon-wrap input:focus {
  outline: none;
  border-color: #2b7ab5;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(43, 122, 181, 0.15);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.84rem;
  font-weight: 500;
  padding: 0.7rem 0.85rem;
  border-radius: 8px;
  margin-bottom: 1.15rem;
}

.btn-submit {
  width: 100%;
  padding: 0.82rem 1rem;
  background: #1b314c;
  color: #ffffff;
  border: 1px solid #112239;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.15s;
}

.btn-submit:hover:not(:disabled) {
  background: #2b7ab5;
  border-color: #1d6396;
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.credentials-box {
  margin-top: 1.65rem;
  padding: 0.95rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.box-title {
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.box-hint {
  font-size: 0.72rem;
  color: #2b7ab5;
  font-weight: 600;
}

.cred-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.cred-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: #334155;
  transition: border-color 0.15s, background-color 0.15s;
}

.cred-btn:hover {
  border-color: #2b7ab5;
  background: #f0f7fc;
}

.cred-role {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.role-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-admin { background: #f5b324; }
.dot-op { background: #2b7ab5; }

.cred-btn code {
  font-size: 0.74rem;
  background: #f1f5f9;
  color: #0f172a;
  padding: 2px 6px;
  border-radius: 4px;
}

@media (max-width: 860px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 440px;
  }

  .brand-showcase {
    display: none;
  }

  .login-card {
    padding: 2.25rem 1.75rem;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 1rem;
  }

  .login-card {
    padding: 1.75rem 1.25rem;
  }

  .cred-btn {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
