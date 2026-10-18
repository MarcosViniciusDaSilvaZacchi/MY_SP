<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Dashboard Operacional</h1>
        <p class="subtitle">Monitoramento executivo de capacidade, fluxo de veículos e receita em tempo real.</p>
      </div>
      <div class="header-actions">
        <RouterLink to="/entrada" class="btn-outline-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nova Entrada</span>
        </RouterLink>
        <button class="btn-primary" @click="loadData" :disabled="loading">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>{{ loading ? 'Sincronizando...' : 'Atualizar Indicadores' }}</span>
        </button>
      </div>
    </div>

    <div v-if="error" class="error-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Indicadores Principais (KPIs) -->
    <div class="cards-grid">
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Vagas Disponíveis</span>
          <div class="metric-icon icon-green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
            </svg>
          </div>
        </div>
        <div class="metric-value text-green">{{ disponibilidade.livres ?? 0 }}</div>
        <div class="metric-footer">
          Capacidade total instalada: <strong>{{ disponibilidade.total ?? 0 }} vagas</strong>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Veículos no Pátio</span>
          <div class="metric-icon icon-blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12 1 13v3c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
        </div>
        <div class="metric-value text-blue">{{ veiculosAtivos.length || disponibilidade.ocupadas || resumo.veiculosNoPatio || 0 }}</div>
        <div class="metric-footer">
          Taxa de ocupação física: <strong>{{ disponibilidade.percentualOcupacao ?? 0 }}%</strong>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Entradas no Dia</span>
          <div class="metric-icon icon-navy">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </div>
        </div>
        <div class="metric-value text-navy">{{ resumo.totalEntradasHoje ?? resumo.entradasHoje ?? 0 }}</div>
        <div class="metric-footer">
          Saídas concluídas hoje: <strong>{{ resumo.totalSaidasHoje ?? resumo.saidasHoje ?? 0 }}</strong>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Faturamento do Dia</span>
          <div class="metric-icon icon-emerald">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>
        <div class="metric-value text-emerald">
          R$ {{ Number(resumo.faturamentoHoje ?? resumo.faturamentoDia ?? 0).toFixed(2) }}
        </div>
        <div class="metric-footer">
          Receita bruta liquidada no caixa
        </div>
      </div>
    </div>

    <!-- Painel Intermediário: Ocupação e Ações Rápidas -->
    <div class="middle-grid">
      <div class="card capacity-card">
        <div class="card-header-row">
          <div>
            <h2 class="card-title">Distribuição de Capacidade do Pátio</h2>
            <p class="card-sub">Relação entre vagas disponíveis, ocupadas e bloqueadas para manutenção</p>
          </div>
          <span class="occupancy-badge">{{ disponibilidade.percentualOcupacao ?? 0 }}% Ocupado</span>
        </div>

        <div class="progress-track">
          <div
            class="progress-segment seg-occupied"
            :style="{ width: percentualOcupadas + '%' }"
            title="Vagas Ocupadas"
          ></div>
          <div
            class="progress-segment seg-maintenance"
            :style="{ width: percentualIndisponiveis + '%' }"
            title="Em Manutenção"
          ></div>
        </div>

        <div class="legend-grid">
          <div class="legend-item">
            <span class="legend-dot dot-green"></span>
            <div>
              <span class="legend-label">Livres para Uso</span>
              <strong class="legend-val">{{ disponibilidade.livres ?? 0 }} vagas</strong>
            </div>
          </div>
          <div class="legend-item">
            <span class="legend-dot dot-blue"></span>
            <div>
              <span class="legend-label">Ocupadas no Momento</span>
              <strong class="legend-val">{{ disponibilidade.ocupadas ?? 0 }} vagas</strong>
            </div>
          </div>
          <div class="legend-item">
            <span class="legend-dot dot-slate"></span>
            <div>
              <span class="legend-label">Bloqueadas / Manutenção</span>
              <strong class="legend-val">{{ disponibilidade.indisponiveis ?? 0 }} vagas</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="card shortcuts-card">
        <h2 class="card-title">Acesso Rápido Operacional</h2>
        <p class="card-sub">Atalhos diretos para as rotinas de portaria e caixa</p>

        <div class="shortcuts-grid">
          <RouterLink to="/entrada" class="shortcut-item">
            <div class="shortcut-icon bg-navy-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <div class="shortcut-text">
              <strong>Registrar Entrada</strong>
              <span>Abertura de ticket por placa</span>
            </div>
          </RouterLink>

          <RouterLink to="/saida" class="shortcut-item">
            <div class="shortcut-icon bg-blue-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div class="shortcut-text">
              <strong>Saída e Caixa (PDV)</strong>
              <span>PIX, TEF Cartão e Liberação</span>
            </div>
          </RouterLink>

          <RouterLink to="/vagas" class="shortcut-item">
            <div class="shortcut-icon bg-green-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
              </svg>
            </div>
            <div class="shortcut-text">
              <strong>Mapa de Vagas</strong>
              <span>Status por andar e categoria</span>
            </div>
          </RouterLink>

          <RouterLink to="/mensalistas" class="shortcut-item">
            <div class="shortcut-icon bg-amber-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div class="shortcut-text">
              <strong>Base de Mensalistas</strong>
              <span>Contratos e adimplência</span>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Tabela de Veículos Estacionados Agora -->
    <div class="card table-card">
      <div class="card-header-row">
        <div>
          <h2 class="card-title">Veículos Estacionados no Pátio</h2>
          <p class="card-sub">Permanências ativas aguardando encerramento e saída</p>
        </div>
        <span class="count-pill">{{ veiculosAtivos.length }} veículo(s) no pátio</span>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Modalidade</th>
              <th>Horário de Entrada</th>
              <th>Permanência</th>
              <th>Status</th>
              <th class="text-right">Ação Rápida</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in veiculosAtivos" :key="v.id">
              <td>
                <span class="plate-badge">{{ v.placa }}</span>
              </td>
              <td>
                <span :class="['badge-pill', v.tipo === 'MENSALISTA' ? 'badge-mensalista' : 'badge-rotativo']">
                  {{ v.tipo }}
                </span>
              </td>
              <td>{{ formatarDataHora(v.dataHoraEntrada || v.horaEntrada) }}</td>
              <td class="font-medium">{{ calcularPermanencia(v.dataHoraEntrada || v.horaEntrada) }}</td>
              <td>
                <span class="status-open-tag">
                  <span class="status-dot-amber"></span>
                  No Pátio
                </span>
              </td>
              <td class="text-right">
                <RouterLink :to="{ path: '/saida', query: { placa: v.placa } }" class="btn-table-action">
                  <span>Processar Saída</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </RouterLink>
              </td>
            </tr>
            <tr v-if="veiculosAtivos.length === 0 && !loading">
              <td colspan="6" class="empty-state">
                Nenhum veículo estacionado no pátio neste momento.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const loading = ref(false)
const error = ref('')
const disponibilidade = ref({})
const resumo = ref({})
const movimentacoes = ref([])

const veiculosAtivos = computed(() =>
  movimentacoes.value.filter(m => m.status === 'ABERTA')
)

const percentualOcupadas = computed(() => {
  const total = Number(disponibilidade.value.total) || 0
  if (!total) return 0
  return Math.min(100, Math.round(((Number(disponibilidade.value.ocupadas) || 0) / total) * 100))
})

const percentualIndisponiveis = computed(() => {
  const total = Number(disponibilidade.value.total) || 0
  if (!total) return 0
  return Math.min(100, Math.round(((Number(disponibilidade.value.indisponiveis) || 0) / total) * 100))
})

function formatarDataHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function calcularPermanencia(iso) {
  if (!iso) return '—'
  const entrada = new Date(iso)
  if (isNaN(entrada.getTime())) return '—'
  const min = Math.max(0, Math.floor((new Date() - entrada) / 60000))
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const r = min % 60
  return `${h}h ${r}min`
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [dispRes, resumoRes, entradasRes] = await Promise.all([
      api.get('/vagas/disponibilidade'),
      api.get('/relatorios/resumo'),
      api.get('/entradas'),
    ])
    disponibilidade.value = dispRes.data || {}
    resumo.value = resumoRes.data || {}
    movimentacoes.value = entradasRes.data || []
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Erro ao carregar dados operacionais.'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page {
  padding: 1.75rem 2rem;
  max-width: 1320px;
  width: 100%;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: 1rem;
}

h1 {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.4px;
  margin: 0 0 0.2rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.88rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.btn-outline-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #ffffff;
  color: #1b314c;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  padding: 0.58rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
}

.btn-outline-link:hover {
  border-color: #2b7ab5;
  color: #2b7ab5;
  background: #f8fafc;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #1b314c;
  color: #ffffff;
  border: 1px solid #112239;
  border-radius: 7px;
  padding: 0.58rem 1.05rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #2b7ab5;
  border-color: #1d6396;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* KPIs */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.15rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.metric-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-green { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.icon-blue { background: #f0f7fc; color: #2b7ab5; border: 1px solid #bae6fd; }
.icon-navy { background: #f1f5f9; color: #1b314c; border: 1px solid #cbd5e1; }
.icon-emerald { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

.metric-value {
  font-size: 1.95rem;
  font-weight: 800;
  letter-spacing: -0.6px;
  line-height: 1.1;
  margin-bottom: 0.65rem;
}

.text-green { color: #059669; }
.text-blue { color: #2b7ab5; }
.text-navy { color: #1b314c; }
.text-emerald { color: #15803d; }

.metric-footer {
  font-size: 0.78rem;
  color: #64748b;
  padding-top: 0.6rem;
  border-top: 1px solid #f1f5f9;
}

/* Middle Grid */
.middle-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.4rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem;
}

.card-sub {
  font-size: 0.8rem;
  color: #64748b;
}

.occupancy-badge {
  background: #1b314c;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
}

.progress-track {
  width: 100%;
  height: 12px;
  background: #10b981;
  border-radius: 9999px;
  overflow: hidden;
  display: flex;
  margin-bottom: 1.25rem;
}

.progress-segment {
  height: 100%;
  transition: width 0.3s ease;
}

.seg-occupied {
  background: #2b7ab5;
}

.seg-maintenance {
  background: #94a3b8;
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.dot-green { background: #10b981; }
.dot-blue { background: #2b7ab5; }
.dot-slate { background: #94a3b8; }

.legend-label {
  display: block;
  font-size: 0.74rem;
  color: #64748b;
}

.legend-val {
  font-size: 0.9rem;
  color: #0f172a;
}

/* Shortcuts */
.shortcuts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  text-decoration: none;
  transition: all 0.15s;
}

.shortcut-item:hover {
  border-color: #2b7ab5;
  background: #f0f7fc;
  transform: translateY(-1px);
}

.shortcut-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-navy-soft { background: #e2e8f0; color: #1b314c; }
.bg-blue-soft { background: #e0f2fe; color: #0369a1; }
.bg-green-soft { background: #dcfce7; color: #15803d; }
.bg-amber-soft { background: #fef3c7; color: #b45309; }

.shortcut-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.shortcut-text strong {
  font-size: 0.82rem;
  color: #0f172a;
  font-weight: 700;
}

.shortcut-text span {
  font-size: 0.72rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Tabela */
.count-pill {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

th {
  text-align: left;
  padding: 0.75rem 0.9rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

td {
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}

.text-right {
  text-align: right;
}

.font-medium {
  font-weight: 600;
}

.plate-badge {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.84rem;
  background: #f8fafc;
  padding: 0.22rem 0.55rem;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  letter-spacing: 0.5px;
}

.badge-pill {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.badge-rotativo {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.badge-mensalista {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.status-open-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #b45309;
}

.status-dot-amber {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
}

.btn-table-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #f8fafc;
  color: #1b314c;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
}

.btn-table-action:hover {
  background: #1b314c;
  color: #ffffff;
  border-color: #1b314c;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.86rem;
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 2.25rem;
  color: #94a3b8;
}

@media (max-width: 1100px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .middle-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 1.15rem;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .legend-grid,
  .shortcuts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
