import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import XLSX from 'xlsx-js-style'
import logoMarkUrl from '../assets/logo-mark.png'

/**
 * Converte uma URL de imagem do bundle para DataURL Base64 para embutir no PDF
 */
async function carregarImagemBase64(url) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function formatarDataHoraBr(iso) {
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

function calcularDuracaoTexto(entradaIso, saidaIso) {
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

function obterTimestampArquivo() {
  const agora = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}_${pad(agora.getHours())}h${pad(agora.getMinutes())}`
}

/**
 * Exporta o Relatório Operacional e Financeiro em PDF Corporativo (A4)
 */
export async function exportarRelatorioPDF({
  resumo = {},
  kpisPeriodo = null,
  movimentacoes = [],
  filtroStatus = '',
  periodoTexto = 'Todo o histórico registrado',
  usuarioNome = 'Administrador',
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const larguraPagina = doc.internal.pageSize.getWidth()
  const alturaPagina = doc.internal.pageSize.getHeight()

  // 1. Cabeçalho Corporativo Azul-Marinho
  doc.setFillColor(11, 25, 44) // #0b192c
  doc.rect(0, 0, larguraPagina, 38, 'F')

  // Faixa de destaque Dourada
  doc.setFillColor(245, 179, 36) // #f5b324
  doc.rect(0, 38, larguraPagina, 1.8, 'F')

  // Logo no cabeçalho
  const logoBase64 = await carregarImagemBase64(logoMarkUrl)
  if (logoBase64) {
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(14, 8, 22, 22, 3, 3, 'F')
    doc.addImage(logoBase64, 'PNG', 15.5, 9.5, 19, 19)
  }

  const offsetTexto = logoBase64 ? 41 : 14
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('MY PARKING', offsetTexto, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(203, 213, 225)
  doc.text('Relatório Executivo de Movimentações e Faturamento', offsetTexto, 21)

  doc.setFontSize(8)
  doc.setTextColor(245, 179, 36)
  doc.text(`Período analisado: ${periodoTexto}`, offsetTexto, 27)

  doc.setTextColor(203, 213, 225)
  doc.text(`Emitido por: ${usuarioNome}  |  Data de emissão: ${formatarDataHoraBr(new Date().toISOString())}`, offsetTexto, 32.5)

  // 2. Quadro de Indicadores Consolidados (KPIs do período)
  const entradasPeriodo = kpisPeriodo
    ? kpisPeriodo.entradas
    : Number(resumo.totalEntradasHoje ?? resumo.entradasHoje ?? movimentacoes.length)
  const saidasPeriodo = kpisPeriodo
    ? kpisPeriodo.saidas
    : Number(resumo.totalSaidasHoje ?? resumo.saidasHoje ?? movimentacoes.filter(m => m.status === 'FINALIZADA').length)
  const noPatio = kpisPeriodo
    ? kpisPeriodo.noPatioAgora
    : Number(resumo.veiculosNoPatio ?? movimentacoes.filter(m => m.status === 'ABERTA').length)
  const faturamentoTotal = kpisPeriodo
    ? kpisPeriodo.faturamento
    : Number(
        resumo.faturamentoHoje ??
        resumo.faturamentoDia ??
        movimentacoes.reduce((acc, m) => acc + (m.status === 'FINALIZADA' ? Number(m.valorCobrado || 0) : 0), 0)
      )

  const cards = [
    { titulo: 'ENTRADAS NO PERÍODO', valor: String(entradasPeriodo), sub: 'Veículos registrados' },
    { titulo: 'SAÍDAS CONCLUÍDAS', valor: String(saidasPeriodo), sub: 'Atendimentos finalizados' },
    { titulo: 'VEÍCULOS NO PÁTIO', valor: String(noPatio), sub: 'Em permanência agora' },
    { titulo: 'RECEITA NO PERÍODO', valor: `R$ ${faturamentoTotal.toFixed(2)}`, sub: 'Total liquidado' },
  ]

  const margemX = 14
  const gap = 4
  const cardWidth = (larguraPagina - margemX * 2 - gap * 3) / 4
  const cardY = 45

  cards.forEach((c, idx) => {
    const x = margemX + idx * (cardWidth + gap)
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(x, cardY, cardWidth, 22, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.setTextColor(100, 116, 139)
    doc.text(c.titulo, x + 3.5, cardY + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text(c.valor, x + 3.5, cardY + 14)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(100, 116, 139)
    doc.text(c.sub, x + 3.5, cardY + 19.5)
  })

  // 3. Título da Tabela e Filtro Aplicado
  const labelFiltro = filtroStatus === 'ABERTA'
    ? 'Apenas Veículos no Pátio'
    : filtroStatus === 'FINALIZADA'
    ? 'Apenas Saídas Concluídas'
    : 'Todas as Movimentações'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Detalhamento de Movimentações', margemX, 75)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)
  doc.setTextColor(100, 116, 139)
  doc.text(`Filtro: ${labelFiltro} (${movimentacoes.length} registro(s))`, larguraPagina - margemX, 75, { align: 'right' })

  // 4. Tabela de Movimentações
  const somaTabela = movimentacoes.reduce(
    (acc, m) => acc + (m.status === 'FINALIZADA' ? Number(m.valorCobrado || 0) : 0),
    0
  )

  const linhas = movimentacoes.map(m => {
    const entrada = m.dataHoraEntrada || m.horaEntrada
    const saida = m.dataHoraSaida || m.horaSaida
    return [
      `#${m.id}`,
      m.placa || '—',
      m.tipo === 'MENSALISTA' ? 'Mensalista' : 'Rotativo',
      formatarDataHoraBr(entrada),
      saida ? formatarDataHoraBr(saida) : 'No pátio',
      calcularDuracaoTexto(entrada, saida),
      m.metodoPagamentoLabel || (m.tipo === 'MENSALISTA' ? 'Plano Mensal' : '—'),
      m.status === 'FINALIZADA' ? 'Concluída' : 'No Pátio',
      m.status === 'FINALIZADA' ? `R$ ${Number(m.valorCobrado || 0).toFixed(2)}` : 'Em aberto',
    ]
  })

  autoTable(doc, {
    startY: 79,
    head: [['Código', 'Placa', 'Categoria', 'Entrada', 'Saída', 'Tempo', 'Pagamento', 'Situação', 'Valor Pago']],
    body: linhas.length > 0
      ? linhas
      : [['—', '—', '—', 'Nenhum registro encontrado', '—', '—', '—', '—', 'R$ 0,00']],
    foot: [[
      { content: 'TOTAL LIQUIDADO NO PERÍODO', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `R$ ${somaTabela.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } },
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [27, 49, 76],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [51, 65, 85],
      cellPadding: 2.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 19 },
      3: { cellWidth: 26 },
      4: { cellWidth: 26 },
      5: { cellWidth: 16 },
      6: { cellWidth: 22 },
      7: { cellWidth: 16 },
      8: { cellWidth: 19, halign: 'right' },
    },
    margin: { left: margemX, right: margemX, bottom: 18 },
    didDrawPage: () => {
      doc.setDrawColor(226, 232, 240)
      doc.line(margemX, alturaPagina - 12, larguraPagina - margemX, alturaPagina - 12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(`MY Parking — Período: ${periodoTexto}`, margemX, alturaPagina - 7.5)
      doc.text(
        `Página ${doc.internal.getCurrentPageInfo().pageNumber}`,
        larguraPagina - margemX,
        alturaPagina - 7.5,
        { align: 'right' }
      )
    },
  })

  doc.save(`MY_Parking_Relatorio_${obterTimestampArquivo()}.pdf`)
}

/**
 * Exporta o Relatório Operacional e Financeiro em Excel Profissional Estilizado (.xlsx)
 */
export function exportarRelatorioExcel({
  resumo = {},
  kpisPeriodo = null,
  movimentacoes = [],
  periodoTexto = 'Todo o histórico registrado',
  usuarioNome = 'Administrador',
}) {
  const entradasPeriodo = kpisPeriodo
    ? kpisPeriodo.entradas
    : Number(resumo.totalEntradasHoje ?? resumo.entradasHoje ?? movimentacoes.length)
  const saidasPeriodo = kpisPeriodo
    ? kpisPeriodo.saidas
    : Number(resumo.totalSaidasHoje ?? resumo.saidasHoje ?? movimentacoes.filter(m => m.status === 'FINALIZADA').length)
  const noPatio = kpisPeriodo
    ? kpisPeriodo.noPatioAgora
    : Number(resumo.veiculosNoPatio ?? movimentacoes.filter(m => m.status === 'ABERTA').length)
  const faturamentoTotal = kpisPeriodo
    ? kpisPeriodo.faturamento
    : Number(
        resumo.faturamentoHoje ??
        resumo.faturamentoDia ??
        movimentacoes.reduce((acc, m) => acc + (m.status === 'FINALIZADA' ? Number(m.valorCobrado || 0) : 0), 0)
      )

  const qtdRotativos = movimentacoes.filter(m => m.tipo !== 'MENSALISTA').length
  const qtdMensalistas = movimentacoes.filter(m => m.tipo === 'MENSALISTA').length
  const saidasPagantes = movimentacoes.filter(m => m.status === 'FINALIZADA' && Number(m.valorCobrado || 0) > 0)
  const ticketMedio = saidasPagantes.length > 0 ? faturamentoTotal / saidasPagantes.length : 0

  // Bordas reutilizáveis
  const bordaFina = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
  }

  const estiloBannerTitulo = {
    fill: { fgColor: { rgb: '0B192C' } },
    font: { name: 'Calibri', sz: 15, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { vertical: 'center', horizontal: 'left' },
  }

  const estiloBannerSub = {
    fill: { fgColor: { rgb: '1B314C' } },
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'F5B324' } },
    alignment: { vertical: 'center', horizontal: 'left' },
  }

  const estiloTh = (align = 'center') => ({
    fill: { fgColor: { rgb: '1B314C' } },
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { vertical: 'center', horizontal: align },
    border: bordaFina,
  })

  // ════════════════════════════════════════════════════════════════
  // ABA 1: MOVIMENTAÇÕES DETALHADAS (Aba principal ao abrir)
  // ════════════════════════════════════════════════════════════════
  const dataEmissaoStr = formatarDataHoraBr(new Date().toISOString())
  const aoaMov = [
    ['MY PARKING — DEMONSTRATIVO DE MOVIMENTAÇÕES E FATURAMENTO', '', '', '', '', '', '', '', ''],
    [`Período Filtrado: ${periodoTexto}   |   Emitido em: ${dataEmissaoStr}   |   Operador: ${usuarioNome}`, '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    [
      'Código',
      'Placa',
      'Categoria',
      'Data/Hora Entrada',
      'Data/Hora Saída',
      'Permanência',
      'Meio de Pagamento',
      'Situação',
      'Valor Pago (R$)',
    ],
  ]

  let somaValores = 0

  movimentacoes.forEach(m => {
    const entrada = m.dataHoraEntrada || m.horaEntrada
    const saida = m.dataHoraSaida || m.horaSaida
    const valorNum = m.status === 'FINALIZADA' ? Number(Number(m.valorCobrado || 0).toFixed(2)) : 0
    somaValores += valorNum

    aoaMov.push([
      `#${m.id}`,
      m.placa || '—',
      m.tipo === 'MENSALISTA' ? 'Mensalista' : 'Rotativo',
      formatarDataHoraBr(entrada),
      saida ? formatarDataHoraBr(saida) : 'No pátio',
      calcularDuracaoTexto(entrada, saida),
      m.metodoPagamentoLabel || (m.tipo === 'MENSALISTA' ? 'Plano Mensal' : 'Aguardando'),
      m.status === 'FINALIZADA' ? 'Concluída' : 'No Pátio',
      valorNum,
    ])
  })

  // Linha de totalização
  aoaMov.push([
    'TOTAL CONSOLIDADO NO PERÍODO',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    Number(somaValores.toFixed(2)),
  ])

  const wsMov = XLSX.utils.aoa_to_sheet(aoaMov)

  // Mesclagens na Aba 1
  const idxTotalRow = aoaMov.length - 1
  wsMov['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: idxTotalRow, c: 0 }, e: { r: idxTotalRow, c: 7 } },
  ]

  // Alturas das linhas na Aba 1
  wsMov['!rows'] = [
    { hpt: 30 },
    { hpt: 22 },
    { hpt: 10 },
    { hpt: 26 },
    ...movimentacoes.map(() => ({ hpt: 21 })),
    { hpt: 26 },
  ]

  // Larguras das colunas na Aba 1
  wsMov['!cols'] = [
    { wch: 18 },
    { wch: 15 },
    { wch: 16 },
    { wch: 21 },
    { wch: 21 },
    { wch: 16 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
  ]

  // AutoFiltro no cabeçalho da tabela (Linha 4 -> r: 3)
  wsMov['!autofilter'] = { ref: `A4:I${ Math.max(4, aoaMov.length - 1) }` }

  // Aplicação de estilos célula a célula na Aba 1
  for (let c = 0; c <= 8; c++) {
    const cellBanner1 = XLSX.utils.encode_cell({ r: 0, c })
    const cellBanner2 = XLSX.utils.encode_cell({ r: 1, c })
    if (wsMov[cellBanner1]) wsMov[cellBanner1].s = estiloBannerTitulo
    if (wsMov[cellBanner2]) wsMov[cellBanner2].s = estiloBannerSub

    const cellHeader = XLSX.utils.encode_cell({ r: 3, c })
    if (wsMov[cellHeader]) {
      wsMov[cellHeader].s = estiloTh(c === 8 ? 'right' : 'center')
    }
  }

  // Estiliza linhas de dados da Aba 1
  for (let i = 0; i < movimentacoes.length; i++) {
    const r = 4 + i
    const mov = movimentacoes[i]
    const bgZebra = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC'

    for (let c = 0; c <= 8; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (!wsMov[addr]) continue

      let fillRgb = bgZebra
      let fontColor = '1E293B'
      let bold = false
      let align = 'center'
      let fontName = 'Calibri'
      let numFmt = undefined

      if (c === 0) {
        fontName = 'Consolas'
        fontColor = '64748B'
      } else if (c === 1) {
        fontName = 'Consolas'
        bold = true
        fillRgb = 'F1F5F9'
        fontColor = '0F172A'
      } else if (c === 2) {
        bold = true
        if (mov.tipo === 'MENSALISTA') {
          fillRgb = 'DCFCE7'
          fontColor = '15803D'
        } else {
          fillRgb = 'E0F2FE'
          fontColor = '0369A1'
        }
      } else if (c === 6) {
        bold = true
        const label = mov.metodoPagamentoLabel || ''
        if (label === 'PIX') {
          fillRgb = 'ECFDF5'
          fontColor = '047857'
        } else if (label.includes('Cartão')) {
          fillRgb = 'EFF6FF'
          fontColor = '1D4ED8'
        } else if (label === 'Dinheiro' || label === 'Caixa Local') {
          fillRgb = 'FEFCE8'
          fontColor = 'A16207'
        }
      } else if (c === 7) {
        bold = true
        if (mov.status === 'FINALIZADA') {
          fillRgb = 'F1F5F9'
          fontColor = '334155'
        } else {
          fillRgb = 'FEF3C7'
          fontColor = '92400E'
        }
      } else if (c === 8) {
        align = 'right'
        bold = true
        numFmt = '"R$ "#,##0.00'
        fontColor = mov.status === 'FINALIZADA' ? '15803D' : '94A3B8'
      }

      wsMov[addr].s = {
        fill: { fgColor: { rgb: fillRgb } },
        font: { name: fontName, sz: 10, bold, color: { rgb: fontColor } },
        alignment: { vertical: 'center', horizontal: align },
        border: bordaFina,
        ...(numFmt ? { numFmt } : {}),
      }
    }
  }

  // Estiliza linha de totalização na Aba 1
  for (let c = 0; c <= 8; c++) {
    const addr = XLSX.utils.encode_cell({ r: idxTotalRow, c })
    if (!wsMov[addr]) continue
    if (c < 8) {
      wsMov[addr].s = {
        fill: { fgColor: { rgb: '0B192C' } },
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { vertical: 'center', horizontal: 'right' },
        border: bordaFina,
      }
    } else {
      wsMov[addr].s = {
        fill: { fgColor: { rgb: '15803D' } },
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { vertical: 'center', horizontal: 'right' },
        border: bordaFina,
        numFmt: '"R$ "#,##0.00',
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // ABA 2: RESUMO EXECUTIVO E FINANCEIRO
  // ════════════════════════════════════════════════════════════════
  const finalizadas = movimentacoes.filter(m => m.status === 'FINALIZADA')
  const movsPix = finalizadas.filter(m => m.metodoCodigo === 'PIX')
  const movsCartao = finalizadas.filter(m => m.metodoCodigo === 'CARTAO')
  const movsDinheiro = finalizadas.filter(m => m.metodoCodigo === 'DINHEIRO')
  const movsIsentos = finalizadas.filter(m => m.metodoCodigo === 'MENSALISTA')

  const recPix = movsPix.reduce((a, m) => a + Number(m.valorCobrado || 0), 0)
  const recCartao = movsCartao.reduce((a, m) => a + Number(m.valorCobrado || 0), 0)
  const recDinheiro = movsDinheiro.reduce((a, m) => a + Number(m.valorCobrado || 0), 0)

  const pct = val => (faturamentoTotal > 0 ? Number(((val / faturamentoTotal) * 100).toFixed(1)) : 0)

  const aoaResumo = [
    ['MY PARKING — RESUMO EXECUTIVO E INDICADORES FINANCEIROS', '', '', ''],
    [`Período Analisado: ${periodoTexto}   |   Emitido por: ${usuarioNome} em ${dataEmissaoStr}`, '', '', ''],
    ['', '', '', ''],
    ['INDICADOR OPERACIONAL E FINANCEIRO', 'RESULTADO APURADO', 'UNIDADE / FORMATO', 'DESCRIÇÃO EXECUTIVA'],
    ['Total de Entradas no Período', entradasPeriodo, 'Veículos', 'Total de acessos registrados na portaria'],
    ['Saídas Concluídas no Período', saidasPeriodo, 'Veículos', 'Atendimentos finalizados com baixa no sistema'],
    ['Veículos no Pátio Agora', noPatio, 'Veículos', 'Veículos estacionados em permanência ativa'],
    ['Atendimentos Rotativos (Avulsos)', qtdRotativos, 'Veículos', 'Clientes avulsos tarifados por tempo'],
    ['Atendimentos Mensalistas', qtdMensalistas, 'Veículos', 'Clientes vinculados a contrato mensal'],
    ['Ticket Médio por Saída Pagante', Number(ticketMedio.toFixed(2)), 'Reais (R$)', 'Valor médio recebido por veículo tarifado'],
    ['FATURAMENTO BRUTO NO PERÍODO', Number(faturamentoTotal.toFixed(2)), 'Reais (R$)', 'Receita total liquidada no período selecionado'],
    ['', '', '', ''],
    ['MEIO DE PAGAMENTO', 'QTD. TRANSAÇÕES', 'RECEITA APURADA (R$)', 'PARTICIPAÇÃO (%)'],
    ['PIX (Instantâneo)', movsPix.length, Number(recPix.toFixed(2)), `${pct(recPix)}%`],
    ['Cartão de Crédito / Débito', movsCartao.length, Number(recCartao.toFixed(2)), `${pct(recCartao)}%`],
    ['Dinheiro em Espécie', movsDinheiro.length, Number(recDinheiro.toFixed(2)), `${pct(recDinheiro)}%`],
    ['Mensalistas / Isentos (Tolerância)', movsIsentos.length, 0, '0%'],
    ['TOTAL POR MEIOS DE PAGAMENTO', finalizadas.length, Number(faturamentoTotal.toFixed(2)), '100%'],
  ]

  const wsResumo = XLSX.utils.aoa_to_sheet(aoaResumo)

  wsResumo['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ]

  wsResumo['!cols'] = [
    { wch: 36 },
    { wch: 22 },
    { wch: 24 },
    { wch: 44 },
  ]

  wsResumo['!rows'] = [
    { hpt: 30 },
    { hpt: 22 },
    { hpt: 12 },
    { hpt: 25 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 26 },
    { hpt: 14 },
    { hpt: 25 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 26 },
  ]

  // Estilos da Aba 2
  for (let c = 0; c <= 3; c++) {
    const b1 = XLSX.utils.encode_cell({ r: 0, c })
    const b2 = XLSX.utils.encode_cell({ r: 1, c })
    if (wsResumo[b1]) wsResumo[b1].s = estiloBannerTitulo
    if (wsResumo[b2]) wsResumo[b2].s = estiloBannerSub

    const h1 = XLSX.utils.encode_cell({ r: 3, c })
    const h2 = XLSX.utils.encode_cell({ r: 12, c })
    if (wsResumo[h1]) wsResumo[h1].s = estiloTh(c === 0 || c === 3 ? 'left' : 'center')
    if (wsResumo[h2]) wsResumo[h2].s = estiloTh(c === 0 ? 'left' : 'center')
  }

  // Linhas do Quadro 1 (r: 4 até 10)
  for (let r = 4; r <= 10; r++) {
    const isDestaqueFaturamento = r === 10
    const isMoeda = r === 9 || r === 10
    const bg = isDestaqueFaturamento ? 'DCFCE7' : r % 2 === 0 ? 'FFFFFF' : 'F8FAFC'
    const fg = isDestaqueFaturamento ? '15803D' : '1E293B'

    for (let c = 0; c <= 3; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (!wsResumo[addr]) continue
      wsResumo[addr].s = {
        fill: { fgColor: { rgb: bg } },
        font: {
          name: 'Calibri',
          sz: isDestaqueFaturamento ? 11 : 10,
          bold: isDestaqueFaturamento || c === 0 || c === 1,
          color: { rgb: fg },
        },
        alignment: {
          vertical: 'center',
          horizontal: c === 1 ? 'right' : c === 2 ? 'center' : 'left',
        },
        border: bordaFina,
        ...(c === 1 && isMoeda ? { numFmt: '"R$ "#,##0.00' } : {}),
      }
    }
  }

  // Linhas do Quadro 2 (r: 13 até 17)
  for (let r = 13; r <= 17; r++) {
    const isTotal = r === 17
    const bg = isTotal ? '0B192C' : r % 2 === 1 ? 'FFFFFF' : 'F8FAFC'
    const fg = isTotal ? 'FFFFFF' : '1E293B'

    for (let c = 0; c <= 3; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (!wsResumo[addr]) continue
      wsResumo[addr].s = {
        fill: { fgColor: { rgb: isTotal && c === 2 ? '15803D' : bg } },
        font: {
          name: 'Calibri',
          sz: isTotal ? 11 : 10,
          bold: isTotal || c === 0 || c === 2,
          color: { rgb: !isTotal && c === 2 ? '15803D' : fg },
        },
        alignment: {
          vertical: 'center',
          horizontal: c === 0 ? 'left' : c === 2 ? 'right' : 'center',
        },
        border: bordaFina,
        ...(c === 2 ? { numFmt: '"R$ "#,##0.00' } : {}),
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsMov, 'Movimentações')
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Executivo')

  XLSX.writeFile(wb, `MY_Parking_Relatorio_${obterTimestampArquivo()}.xlsx`)
}

/**
 * Exporta Comprovante de Saída ou Ticket de Entrada em PDF
 */
export async function exportarComprovantePDF(dados, tipoComprovante = 'SAIDA') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 145] })
  const largura = 80

  doc.setFillColor(11, 25, 44)
  doc.rect(0, 0, largura, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('MY PARKING', largura / 2, 10, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  doc.text(
    tipoComprovante === 'ENTRADA' ? 'COMPROVANTE DE ENTRADA' : 'RECIBO DE PAGAMENTO E SAÍDA',
    largura / 2,
    16,
    { align: 'center' }
  )

  // Placa em destaque
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(8, 27, largura - 16, 14, 2, 2, 'FD')

  doc.setTextColor(15, 23, 42)
  doc.setFont('courier', 'bold')
  doc.setFontSize(16)
  doc.text(String(dados.placa || '—'), largura / 2, 36, { align: 'center' })

  let y = 48
  const addLinha = (label, valor, destaque = false) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(label, 8, y)

    doc.setFont('helvetica', destaque ? 'bold' : 'normal')
    doc.setFontSize(destaque ? 9.5 : 7.8)
    doc.setTextColor(destaque ? 5 : 15, destaque ? 150 : 23, destaque ? 105 : 42)
    doc.text(String(valor || '—'), largura - 8, y, { align: 'right' })
    y += 7
  }

  addLinha('Categoria:', dados.tipo === 'MENSALISTA' ? 'Mensalista' : 'Rotativo')
  addLinha('Entrada:', formatarDataHoraBr(dados.dataHoraEntrada || dados.horaEntrada))

  if (tipoComprovante === 'SAIDA') {
    addLinha('Saída:', formatarDataHoraBr(dados.dataHoraSaida))
    addLinha('Permanência:', calcularDuracaoTexto(dados.dataHoraEntrada, dados.dataHoraSaida))
    addLinha('Meio de Pagamento:', dados.formaPagamento || 'Isento')
    doc.setDrawColor(226, 232, 240)
    doc.line(8, y - 3, largura - 8, y - 3)
    addLinha('Total Pago:', `R$ ${Number(dados.valorCobrado || 0).toFixed(2)}`, true)
    if (Number(dados.troco) > 0) {
      addLinha('Troco Devolvido:', `R$ ${Number(dados.troco).toFixed(2)}`)
    }
  } else {
    addLinha('Código do Ticket:', `#${dados.id || ''}`)
    addLinha('Tolerância:', '10 minutos gratuitos')
  }

  doc.setDrawColor(226, 232, 240)
  doc.line(8, 124, largura - 8, 124)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(100, 116, 139)
  doc.text('Obrigado por utilizar o MY Parking!', largura / 2, 130, { align: 'center' })
  doc.text(formatarDataHoraBr(new Date().toISOString()), largura / 2, 135, { align: 'center' })

  doc.save(`MY_Parking_${tipoComprovante}_${dados.placa || 'Ticket'}.pdf`)
}
