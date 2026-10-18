<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Relatórios e Faturamento</h1>
        <p class="subtitle">Filtre por período, acompanhe indicadores financeiros e exporte demonstrativos em PDF e Excel estilizado.</p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn-export btn-pdf"
          @click="baixarPDF"
          :disabled="loading || exportandoPdf"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <polyline points="9 15 12 18 15 15"/>
          </svg>
          <span>{{ exportandoPdf ? 'Gerando PDF...' : 'Exportar PDF' }}</span>
        </button>

        <button
          type="button"
          class="btn-export btn-excel"
          @click="baixarExcel"
          :disabled="loading || exportandoExcel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="9" x2="9" y2="21"/>
          </svg>
          <span>{{ exportandoExcel ? 'Gerando Planilha...' : 'Exportar Excel (.xlsx)' }}</span>
        </button>

        <button class="btn-primary" @click="carregar" :disabled="loading">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>{{ loading ? 'Atualizando...' : 'Atualizar' }}</span>
        </button>
      </div>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Barra de Filtro por Período e Categoria -->
    <div class="card filter-bar-card">
      <div class="period-presets">
        <span class="filter-section-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Período Rápido:
        </span>
        <div class="preset-pills">
          <button
            v-for="p in opcoesPeriodo"
            :key="p.id"
            type="button"
            class="preset-pill"
            :class="{ active: periodoSelecionado === p.id }"
            @click="aplicarPeriodoRapido(p.id)"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="filter-inputs-row">
        <div class="date-field">
          <label>Data Inicial</label>
          <input
            type="date"
            v-model="dataInicio"
            :max="dataFim || undefined"
            @change="aoAlterarDataManual"
          />
        </div>

        <div class="date-field">
          <label>Data Final</label>
          <input
            type="date"
            v-model="dataFim"
            :min="dataInicio || undefined"
            @change="aoAlterarDataManual"
          />
        </div>

        <div class="date-field">
          <label>Categoria</label>
          <select v-model="filtroCategoria">
            <option value="">Todas as Categorias</option>
            <option value="ROTATIVO">Apenas Rotativos (Avulsos)</option>
            <option value="MENSALISTA">Apenas Mensalistas</option>
          </select>
        </div>

        <div class="date-field">
          <label>Meio de Pagamento</label>
          <select v-model="filtroMetodo">
            <option value="">Todos os Meios</option>
            <option value="PIX">PIX</option>
            <option value="CARTAO">Cartão (Crédito/Débito)</option>
            <option value="DINHEIRO">Dinheiro em Espécie</option>
            <option value="MENSALISTA">Isento / Mensalista</option>
          </select>
        </div>

        <div class="filter-summary-box">
          <div class="period-badge">
            <span class="dot"></span>
            <span>{{ descricaoPeriodoAtivo }}</span>
          </div>
          <button
            v-if="temFiltrosAtivos"
            type="button"
            class="btn-clear-filters"
            @click="limparFiltros"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Cards Executivos Dinâmicos do Período -->
    <div class="cards-grid">
      <div class="card metric-card">
        <div class="card-label">Entradas no Período</div>
        <div class="card-value text-navy">{{ kpisPeriodo.entradas }}</div>
        <small class="card-sub">
          {{ kpisPeriodo.rotativos }} rotativo(s) • {{ kpisPeriodo.mensalistas }} mensalista(s)
        </small>
      </div>
      <div class="card metric-card">
        <div class="card-label">Saídas Concluídas</div>
        <div class="card-value text-blue">{{ kpisPeriodo.saidas }}</div>
        <small class="card-sub">
          Ticket médio: <strong>R$ {{ kpisPeriodo.ticketMedio.toFixed(2) }}</strong>
        </small>
      </div>
      <div class="card metric-card highlight-card">
        <div class="card-label">Faturamento no Período</div>
        <div class="card-value text-emerald">
          R$ {{ kpisPeriodo.faturamento.toFixed(2) }}
        </div>
        <small class="card-sub">
          PIX: R$ {{ kpisPeriodo.totalPix.toFixed(2) }} • Cartão: R$ {{ kpisPeriodo.totalCartao.toFixed(2) }} • Dinheiro: R$ {{ kpisPeriodo.totalDinheiro.toFixed(2) }}
        </small>
      </div>
      <div class="card metric-card">
        <div class="card-label">Veículos no Pátio Agora</div>
        <div class="card-value text-amber">{{ kpisPeriodo.noPatioAgora }}</div>
        <small class="card-sub">estacionados neste momento</small>
      </div>
    </div>

    <!-- Tabela de Movimentações -->
    <div class="card table-card">
      <div class="table-toolbar">
        <div>
          <h2 class="card-title">Histórico de Movimentações</h2>
          <span class="card-sub-inline">
            Exibindo <strong>{{ movimentacoesFiltradas.length }}</strong> registro(s) no período selecionado
          </span>
        </div>

        <div class="toolbar-controls">
          <div class="search-mini">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input v-model="buscaPlaca" placeholder="Buscar por placa..." />
          </div>

          <div class="filter-tabs">
            <button
              type="button"
              class="tab-btn"
              :class="{ active: filtroStatus === '' }"
              @click="filtroStatus = ''"
            >
              Todas ({{ movimentacoesPorDataECategoria.length }})
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: filtroStatus === 'ABERTA' }"
              @click="filtroStatus = 'ABERTA'"
            >
              No Pátio ({{ movimentacoesPorDataECategoria.filter(m => m.status === 'ABERTA').length }})
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: filtroStatus === 'FINALIZADA' }"
              @click="filtroStatus = 'FINALIZADA'"
            >
              Concluídas ({{ movimentacoesPorDataECategoria.filter(m => m.status === 'FINALIZADA').length }})
            </button>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Placa</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Permanência</th>
              <th>Categoria</th>
              <th>Meio de Pagamento</th>
              <th>Situação</th>
              <th class="text-right">Valor Pago</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movimentacoesFiltradas" :key="m.id">
              <td class="font-mono text-muted">#{{ m.id }}</td>
              <td>
                <span class="plate-box">{{ m.placa }}</span>
              </td>
              <td>{{ formatDate(m.dataHoraEntrada || m.horaEntrada) }}</td>
              <td>{{ (m.dataHoraSaida || m.horaSaida) ? formatDate(m.dataHoraSaida || m.horaSaida) : '—' }}</td>
              <td class="text-muted">{{ calcularDuracao(m.dataHoraEntrada || m.horaEntrada, m.dataHoraSaida || m.horaSaida) }}</td>
              <td>
                <span :class="['badge-pill', m.tipo === 'MENSALISTA' ? 'badge-mensalista' : 'badge-rotativo']">
                  {{ m.tipo === 'MENSALISTA' ? 'Mensalista' : 'Rotativo' }}
                </span>
              </td>
              <td>
                <span :class="['badge-method', classeMetodo(m.metodoPagamentoLabel)]">
                  {{ m.metodoPagamentoLabel }}
                </span>
              </td>
              <td>
                <span :class="['badge-status', m.status === 'FINALIZADA' ? 'status-closed' : 'status-open']">
                  {{ m.status === 'FINALIZADA' ? 'Concluída' : 'No Pátio' }}
                </span>
              </td>
              <td class="text-right">
                <strong v-if="m.status === 'FINALIZADA'" class="text-emerald">
                  R$ {{ Number(m.valorCobrado || 0).toFixed(2) }}
                </strong>
                <span v-else class="text-muted">Em aberto</span>
              </td>
            </tr>
            <tr v-if="movimentacoesFiltradas.length === 0 && !loading">
              <td colspan="9" class="empty-state">Nenhuma movimentação encontrada para o período e filtros selecionados.</td>
            </tr>
          </tbody>
          <tfoot v-if="movimentacoesFiltradas.length > 0">
            <tr class="table-footer-row">
              <td colspan="8" class="text-right font-bold">TOTAL LIQUIDADO NA LISTAGEM:</td>
              <td class="text-right font-bold text-emerald total-cell">
                R$ {{ somaListagemFiltrada.toFixed(2) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { exportarRelatorioPDF, exportarRelatorioExcel } from '../utils/exportadores'

const auth = useAuthStore()
const loading = ref(false)
const exportandoPdf = ref(false)
const exportandoExcel = ref(false)
const error = ref('')
const resumo = ref({})
const movimentacoes = ref([])
const pagamentosMap = ref({})

// Filtros
const periodoSelecionado = ref('TODOS')
const dataInicio = ref('')
const dataFim = ref('')
const filtroCategoria = ref('')
const filtroMetodo = ref('')
const filtroStatus = ref('')
const buscaPlaca = ref('')

const opcoesPeriodo = [
  { id: 'HOJE', label: 'Hoje' },
  { id: 'ONTEM', label: 'Ontem' },
  { id: '7DIAS', label: 'Últimos 7 dias' },
  { id: 'MES_ATUAL', label: 'Este Mês' },
  { id: 'MES_ANTERIOR', label: 'Mês Anterior' },
  { id: 'TODOS', label: 'Todo o Período' },
]

function paraInputDateLocal(dateObj) {
  const ano = dateObj.getFullYear()
  const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
  const dia = String(dateObj.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function aplicarPeriodoRapido(idPeriodo) {
  periodoSelecionado.value = idPeriodo
  const hoje = new Date()

  if (idPeriodo === 'TODOS') {
    dataInicio.value = ''
    dataFim.value = ''
    return
  }

  if (idPeriodo === 'HOJE') {
    const strHoje = paraInputDateLocal(hoje)
    dataInicio.value = strHoje
    dataFim.value = strHoje
    return
  }

  if (idPeriodo === 'ONTEM') {
    const ontem = new Date(hoje)
    ontem.setDate(hoje.getDate() - 1)
    const strOntem = paraInputDateLocal(ontem)
    dataInicio.value = strOntem
    dataFim.value = strOntem
    return
  }

  if (idPeriodo === '7DIAS') {
    const seteDiasAtras = new Date(hoje)
    seteDiasAtras.setDate(hoje.getDate() - 6)
    dataInicio.value = paraInputDateLocal(seteDiasAtras)
    dataFim.value = paraInputDateLocal(hoje)
    return
  }

  if (idPeriodo === 'MES_ATUAL') {
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    dataInicio.value = paraInputDateLocal(primeiroDia)
    dataFim.value = paraInputDateLocal(hoje)
    return
  }

  if (idPeriodo === 'MES_ANTERIOR') {
    const primeiroDiaMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const ultimoDiaMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    dataInicio.value = paraInputDateLocal(primeiroDiaMesAnt)
    dataFim.value = paraInputDateLocal(ultimoDiaMesAnt)
  }
}

function aoAlterarDataManual() {
  periodoSelecionado.value = 'PERSONALIZADO'
}

function limparFiltros() {
  aplicarPeriodoRapido('TODOS')
  filtroCategoria.value = ''
  filtroMetodo.value = ''
  filtroStatus.value = ''
  buscaPlaca.value = ''
}

const temFiltrosAtivos = computed(() => {
  return Boolean(
    dataInicio.value ||
    dataFim.value ||
    filtroCategoria.value ||
    filtroMetodo.value ||
    filtroStatus.value ||
    buscaPlaca.value.trim()
  )
})

function formatarDataCurtaBr(yyyyMmDd) {
  if (!yyyyMmDd) return ''
  const [a, m, d] = yyyyMmDd.split('-')
  return `${d}/${m}/${a}`
}

const descricaoPeriodoAtivo = computed(() => {
  if (dataInicio.value && dataFim.value) {
    if (dataInicio.value === dataFim.value) {
      return `Dia ${formatarDataCurtaBr(dataInicio.value)}`
    }
    return `${formatarDataCurtaBr(dataInicio.value)} até ${formatarDataCurtaBr(dataFim.value)}`
  }
  if (dataInicio.value) {
    return `A partir de ${formatarDataCurtaBr(dataInicio.value)}`
  }
  if (dataFim.value) {
    return `Até ${formatarDataCurtaBr(dataFim.value)}`
  }
  return 'Todo o histórico registrado'
})

// Enriquecimento das movimentações com dados de pagamento
const movimentacoesEnriquecidas = computed(() => {
  return movimentacoes.value.map(m => {
    const pag = pagamentosMap.value[String(m.id)]
    let metodoCodigo = 'ABERTO'
    let metodoPagamentoLabel = 'Aguardando'

    if (m.tipo === 'MENSALISTA') {
      metodoCodigo = 'MENSALISTA'
      metodoPagamentoLabel = 'Plano Mensal'
    } else if (pag && pag.status === 'CONFIRMADO') {
      const mp = (pag.metodoPagamento || '').toUpperCase()
      if (mp === 'PIX') {
        metodoCodigo = 'PIX'
        metodoPagamentoLabel = 'PIX'
      } else if (mp.includes('CARTAO')) {
        metodoCodigo = 'CARTAO'
        metodoPagamentoLabel = pag.detalhes?.modalidade === 'DEBITO' ? 'Cartão Débito' : 'Cartão Crédito'
      } else if (mp === 'DINHEIRO') {
        metodoCodigo = 'DINHEIRO'
        metodoPagamentoLabel = 'Dinheiro'
      } else {
        metodoCodigo = mp || 'OUTRO'
        metodoPagamentoLabel = mp || 'Confirmado'
      }
    } else if (m.status === 'FINALIZADA') {
      if (Number(m.valorCobrado || 0) === 0) {
        metodoCodigo = 'MENSALISTA'
        metodoPagamentoLabel = 'Isento (Tolerância)'
      } else {
        metodoCodigo = 'DINHEIRO'
        metodoPagamentoLabel = 'Caixa Local'
      }
    }

    return {
      ...m,
      pagamento: pag || null,
      metodoCodigo,
      metodoPagamentoLabel,
    }
  })
})

// Filtra por Período (Data Inicial / Data Final), Categoria e Meio de Pagamento
const movimentacoesPorDataECategoria = computed(() => {
  const inicioMs = dataInicio.value ? new Date(`${dataInicio.value}T00:00:00`).getTime() : null
  const fimMs = dataFim.value ? new Date(`${dataFim.value}T23:59:59.999`).getTime() : null

  return movimentacoesEnriquecidas.value.filter(m => {
    const dataRefIso = m.dataHoraEntrada || m.horaEntrada || m.dataHoraSaida
    if (inicioMs !== null || fimMs !== null) {
      const t = dataRefIso ? new Date(dataRefIso).getTime() : NaN
      if (isNaN(t)) return false
      if (inicioMs !== null && t < inicioMs) return false
      if (fimMs !== null && t > fimMs) return false
    }

    if (filtroCategoria.value && m.tipo !== filtroCategoria.value) {
      return false
    }

    if (filtroMetodo.value && m.metodoCodigo !== filtroMetodo.value) {
      return false
    }

    return true
  })
})

// Filtra adicionalmente por Status (Abas) e Placa
const movimentacoesFiltradas = computed(() => {
  const termo = buscaPlaca.value.trim().toUpperCase()
  return movimentacoesPorDataECategoria.value.filter(m => {
    const okStatus = !filtroStatus.value || m.status === filtroStatus.value
    const okPlaca = !termo || (m.placa && m.placa.toUpperCase().includes(termo))
    return okStatus && okPlaca
  })
})

const somaListagemFiltrada = computed(() => {
  return movimentacoesFiltradas.value.reduce(
    (acc, m) => acc + (m.status === 'FINALIZADA' ? Number(m.valorCobrado || 0) : 0),
    0
  )
})

const kpisPeriodo = computed(() => {
  const base = movimentacoesPorDataECategoria.value
  const finalizadas = base.filter(m => m.status === 'FINALIZADA')
  const faturamento = finalizadas.reduce((acc, m) => acc + Number(m.valorCobrado || 0), 0)
  const saidasPagantes = finalizadas.filter(m => Number(m.valorCobrado || 0) > 0)
  const ticketMedio = saidasPagantes.length > 0 ? faturamento / saidasPagantes.length : 0

  const totalPix = finalizadas
    .filter(m => m.metodoCodigo === 'PIX')
    .reduce((acc, m) => acc + Number(m.valorCobrado || 0), 0)
  const totalCartao = finalizadas
    .filter(m => m.metodoCodigo === 'CARTAO')
    .reduce((acc, m) => acc + Number(m.valorCobrado || 0), 0)
  const totalDinheiro = finalizadas
    .filter(m => m.metodoCodigo === 'DINHEIRO')
    .reduce((acc, m) => acc + Number(m.valorCobrado || 0), 0)

  return {
    entradas: base.length,
    rotativos: base.filter(m => m.tipo !== 'MENSALISTA').length,
    mensalistas: base.filter(m => m.tipo === 'MENSALISTA').length,
    saidas: finalizadas.length,
    faturamento,
    ticketMedio,
    totalPix,
    totalCartao,
    totalDinheiro,
    noPatioAgora: movimentacoes.value.filter(m => m.status === 'ABERTA').length,
  }
})

async function carregar() {
  loading.value = true
  error.value = ''
  try {
    const [resumoRes, movRes, pagRes] = await Promise.all([
      api.get('/relatorios/resumo'),
      api.get('/entradas'),
      api.get('/pagamentos').catch(() => ({ data: [] })),
    ])
    resumo.value = resumoRes.data || {}
    movimentacoes.value = movRes.data || []

    const mapa = {}
    const listaPag = Array.isArray(pagRes.data) ? pagRes.data : []
    for (const p of listaPag) {
      if (p.movimentacaoId) {
        mapa[String(p.movimentacaoId)] = p
      }
    }
    pagamentosMap.value = mapa
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Erro ao carregar relatórios.'
  } finally {
    loading.value = false
  }
}

async function baixarPDF() {
  exportandoPdf.value = true
  try {
    await exportarRelatorioPDF({
      resumo: resumo.value,
      kpisPeriodo: kpisPeriodo.value,
      movimentacoes: movimentacoesFiltradas.value,
      filtroStatus: filtroStatus.value,
      periodoTexto: descricaoPeriodoAtivo.value,
      usuarioNome: auth.usuario?.nome || 'Administrador',
    })
  } catch (e) {
    console.error('Erro ao gerar PDF:', e)
    error.value = 'Não foi possível gerar o arquivo PDF.'
  } finally {
    exportandoPdf.value = false
  }
}

function baixarExcel() {
  exportandoExcel.value = true
  try {
    exportarRelatorioExcel({
      resumo: resumo.value,
      kpisPeriodo: kpisPeriodo.value,
      movimentacoes: movimentacoesFiltradas.value,
      filtroStatus: filtroStatus.value,
      periodoTexto: descricaoPeriodoAtivo.value,
      usuarioNome: auth.usuario?.nome || 'Administrador',
    })
  } catch (e) {
    console.error('Erro ao gerar Excel:', e)
    error.value = 'Não foi possível gerar a planilha Excel.'
  } finally {
    exportandoExcel.value = false
  }
}

function formatDate(iso) {
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

function calcularDuracao(entradaIso, saidaIso) {
  if (!entradaIso) return '—'
  const inicio = new Date(entradaIso)
  const fim = saidaIso ? new Date(saidaIso) : new Date()
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return '—'
  const min = Math.max(1, Math.floor((fim - inicio) / 60000))
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const r = min % 60
  return `${h}h ${r}min`
}

function classeMetodo(label) {
  if (!label) return 'method-neutral'
  if (label === 'PIX') return 'method-pix'
  if (label.includes('Cartão')) return 'method-card'
  if (label === 'Dinheiro' || label === 'Caixa Local') return 'method-cash'
  if (label.includes('Mensal') || label.includes('Isento')) return 'method-exempt'
  return 'method-neutral'
}

onMounted(carregar)
</script>

<style scoped>
.page {
  padding: 1.75rem 2rem;
  max-width: 1360px;
  width: 100%;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
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
  gap: 0.6rem;
  flex-wrap: wrap;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 7px;
  padding: 0.58rem 1rem;
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 700;
  transition: all 0.15s;
}

.btn-pdf {
  background: #ffffff;
  color: #b91c1c;
  border: 1.5px solid #fecaca;
}

.btn-pdf:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #ef4444;
}

.btn-excel {
  background: #ffffff;
  color: #15803d;
  border: 1.5px solid #bbf7d0;
}

.btn-excel:hover:not(:disabled) {
  background: #f0fdf4;
  border-color: #22c55e;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Barra de Filtro de Período */
.filter-bar-card {
  margin-bottom: 1.25rem;
  padding: 1.1rem 1.35rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.period-presets {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-bottom: 0.9rem;
  margin-bottom: 0.9rem;
  border-bottom: 1px solid #e2e8f0;
}

.filter-section-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.preset-pills {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.preset-pill {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-pill:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.preset-pill.active {
  background: #1b314c;
  border-color: #1b314c;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(27, 49, 76, 0.25);
}

.filter-inputs-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr)) auto;
  gap: 0.85rem;
  align-items: end;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.date-field label {
  font-size: 0.73rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.date-field input,
.date-field select {
  padding: 0.48rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.83rem;
  color: #0f172a;
  background: #ffffff;
  font-family: inherit;
}

.date-field input:focus,
.date-field select:focus {
  outline: none;
  border-color: #2b7ab5;
  box-shadow: 0 0 0 3px rgba(43, 122, 181, 0.12);
}

.filter-summary-box {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.period-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  padding: 0.48rem 0.8rem;
  border-radius: 7px;
  font-size: 0.79rem;
  font-weight: 700;
  white-space: nowrap;
}

.period-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0284c7;
}

.btn-clear-filters {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 0.46rem 0.75rem;
  border-radius: 7px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-clear-filters:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.15rem;
  margin-bottom: 1.5rem;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.35rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
}

.highlight-card {
  border-color: #bbf7d0;
  background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
}

.card-label {
  font-size: 0.76rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.45rem;
}

.card-value {
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.6px;
}

.card-sub {
  display: block;
  font-size: 0.76rem;
  color: #64748b;
  margin-top: 0.45rem;
  line-height: 1.35;
}

.text-navy { color: #1b314c; }
.text-blue { color: #2b7ab5; }
.text-emerald { color: #15803d; }
.text-amber { color: #b45309; }
.text-muted { color: #94a3b8; }
.text-right { text-align: right; }
.font-bold { font-weight: 700; }
.font-mono { font-family: var(--font-mono); font-size: 0.8rem; }

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.search-mini {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.65rem;
  color: #94a3b8;
}

.search-mini input {
  padding: 0.42rem 0.75rem 0.42rem 2rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.82rem;
  background: #f8fafc;
  color: #0f172a;
  width: 185px;
}

.search-mini input:focus {
  outline: none;
  border-color: #2b7ab5;
  background: #ffffff;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.card-sub-inline {
  font-size: 0.8rem;
  color: #64748b;
}

.filter-tabs {
  display: flex;
  gap: 0.35rem;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 7px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 0.38rem 0.75rem;
  border-radius: 5px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th {
  text-align: left;
  padding: 0.75rem 0.85rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}

.table-footer-row td {
  background: #f8fafc;
  border-top: 2px solid #cbd5e1;
  padding: 0.85rem;
  font-size: 0.88rem;
}

.total-cell {
  font-size: 0.98rem;
}

.plate-box {
  font-family: var(--font-mono);
  font-weight: 700;
  background: #f8fafc;
  padding: 0.22rem 0.55rem;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  color: #0f172a;
}

.badge-status {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
}

.status-closed {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.status-open {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.badge-pill {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
}
.badge-mensalista { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.badge-rotativo { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }

.badge-method {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
}
.method-pix { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.method-card { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.method-cash { background: #fefce8; color: #a16207; border: 1px solid #fef08a; }
.method-exempt { background: #f3e8ff; color: #6d28d9; border: 1px solid #ddd6fe; }
.method-neutral { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #1b314c;
  color: white;
  border: 1px solid #112239;
  border-radius: 7px;
  padding: 0.58rem 1.05rem;
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #2b7ab5;
  border-color: #1d6396;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 7px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.empty-state {
  text-align: center;
  padding: 2.25rem;
  color: #94a3b8;
}

@media (max-width: 1100px) {
  .filter-inputs-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .filter-summary-box {
    grid-column: 1 / -1;
    justify-content: space-between;
  }
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .page {
    padding: 1.15rem;
  }

  .filter-inputs-row {
    grid-template-columns: 1fr;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    width: 100%;
  }

  .btn-export,
  .btn-primary {
    flex: 1;
    justify-content: center;
  }
}
</style>
