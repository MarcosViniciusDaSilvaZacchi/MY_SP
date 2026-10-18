<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Saída e Pagamento</h1>
        <p class="subtitle">Consulte a placa do veículo, realize o recebimento e libere a cancela de saída.</p>
      </div>

      <!-- Indicador de Etapas -->
      <div class="stepper">
        <div class="step-item" :class="{ active: passo === 1, done: passo > 1 }">
          <span class="step-num">1</span>
          <span class="step-label">Veículo</span>
        </div>
        <div class="step-line"></div>
        <div class="step-item" :class="{ active: passo === 2, done: passo > 2 }">
          <span class="step-num">2</span>
          <span class="step-label">Pagamento</span>
        </div>
        <div class="step-line"></div>
        <div class="step-item" :class="{ active: passo === 3 }">
          <span class="step-num">3</span>
          <span class="step-label">Comprovante</span>
        </div>
      </div>
    </div>

    <!-- PASSO 1: Busca do Veículo -->
    <div v-if="passo === 1" class="step1-grid">
      <div class="card form-card">
        <div class="card-head">
          <h2 class="card-title">Consultar Veículo para Saída</h2>
          <span class="tag-terminal">Caixa Principal</span>
        </div>

        <form @submit.prevent="buscar">
          <div class="form-group">
            <label for="placa-busca">Placa do Veículo</label>
            <div class="plate-input-container">
              <div class="mercosul-strip">
                <span>BRASIL</span>
              </div>
              <input
                id="placa-busca"
                v-model="placa"
                @input="placa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '')"
                maxlength="7"
                placeholder="ABC1D23"
                :disabled="loading"
                autocomplete="off"
                required
              />
            </div>
          </div>

          <div v-if="error" class="error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ error }}</span>
          </div>

          <button class="btn-primary" type="submit" :disabled="loading || !placa">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>{{ loading ? 'Consultando...' : 'Consultar Permanência e Valor' }}</span>
          </button>
        </form>
      </div>

      <!-- Seleção Rápida de Veículos no Pátio -->
      <div class="card patio-pick-card">
        <div class="card-head">
          <div>
            <h2 class="card-title">Veículos Estacionados no Pátio</h2>
            <p class="card-subtitle">Clique em um veículo abaixo para iniciar o atendimento de saída</p>
          </div>
          <span class="count-badge">{{ veiculosNoPatio.length }} no pátio</span>
        </div>

        <div v-if="veiculosNoPatio.length > 0" class="quick-chips">
          <button
            v-for="v in veiculosNoPatio"
            :key="v.id"
            class="chip-plate"
            type="button"
            @click="selecionarPlaca(v.placa)"
          >
            <div class="chip-top">
              <span class="chip-code">{{ v.placa }}</span>
              <span :class="['chip-badge', v.tipo === 'MENSALISTA' ? 'cb-mensalista' : 'cb-rotativo']">
                {{ v.tipo === 'MENSALISTA' ? 'Mensalista' : 'Rotativo' }}
              </span>
            </div>
            <span class="chip-time">Entrada às {{ formatarHoraCurta(v.dataHoraEntrada || v.horaEntrada) }}</span>
          </button>
        </div>
        <div v-else class="empty-patio">
          Nenhum veículo estacionado no momento.
        </div>
      </div>
    </div>

    <!-- PASSO 2: Resumo e Pagamento -->
    <div v-if="passo === 2" class="pdv-grid">
      <!-- Coluna Esquerda: Resumo da Permanência + Liberação -->
      <div class="card summary-panel">
        <div class="card-head">
          <div>
            <h2 class="card-title">Resumo de Permanência</h2>
            <span class="card-subtitle">Ticket #{{ movimentacao.id }}</span>
          </div>
          <span :class="['badge-pill', movimentacao.tipo === 'MENSALISTA' ? 'badge-mensalista' : 'badge-rotativo']">
            {{ movimentacao.tipo === 'MENSALISTA' ? 'Mensalista' : 'Rotativo' }}
          </span>
        </div>

        <div class="summary-box">
          <div class="plate-line">
            <span class="ticket-plate">{{ movimentacao.placa }}</span>
            <span v-if="movimentacao.mensalistaNome" class="mensalista-text">
              Cliente: {{ movimentacao.mensalistaNome }}
            </span>
          </div>

          <div class="summary-grid">
            <div class="summary-item">
              <span class="s-label">Horário de Entrada</span>
              <strong class="s-value">{{ formatarDataHora(movimentacao.dataHoraEntrada || movimentacao.horaEntrada) }}</strong>
            </div>

            <div class="summary-item">
              <span class="s-label">Horário de Saída</span>
              <strong class="s-value">{{ formatarDataHora(horarioSaidaPrevisto) }}</strong>
            </div>

            <div class="summary-item">
              <span class="s-label">Tempo Total</span>
              <strong class="s-value">{{ formatarTempo(permanenciaMinutos) }} ({{ permanenciaMinutos }} min)</strong>
            </div>

            <div class="summary-item">
              <span class="s-label">Tarifa Aplicada</span>
              <span v-if="dentroCarencia" class="text-green font-semibold">Isento (Tolerância de 10 min)</span>
              <span v-else-if="movimentacao.tipo === 'MENSALISTA'" class="text-green font-semibold">Plano Mensalista Ativo</span>
              <span v-else class="text-slate font-semibold">R$ 8,00 por hora</span>
            </div>
          </div>
        </div>

        <!-- Visor do Valor -->
        <div class="saldo-card" :class="{ 'saldo-zero': Number(valorDevido) === 0 || pagamentoConfirmado }">
          <span class="saldo-label">
            {{ pagamentoConfirmado ? 'PAGAMENTO CONFIRMADO' : 'VALOR TOTAL A PAGAR' }}
          </span>
          <div class="saldo-amount">
            R$ {{ Number(valorDevido).toFixed(2) }}
          </div>
          <div class="saldo-description">
            <span v-if="pagamentoConfirmado" class="inline-status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Pagamento recebido via {{ pagamentoAtual.forma }} — Saída liberada.
            </span>
            <span v-else-if="movimentacao.tipo === 'MENSALISTA'">
              Cliente mensalista em dia. Sem cobrança adicional.
            </span>
            <span v-else-if="dentroCarencia">
              Saída dentro da tolerância gratuita de 10 minutos.
            </span>
            <span v-else>
              Valor calculado para {{ Math.ceil((permanenciaMinutos - 10) / 60) || 1 }} hora(s) de permanência.
            </span>
          </div>
        </div>

        <div v-if="error" class="error-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ error }}</span>
        </div>

        <div class="actions-row">
          <button class="btn-outline" type="button" @click="voltarPasso1" :disabled="loading">
            Voltar
          </button>
          <button
            class="btn-primary"
            :class="{ 'btn-ready': podeLiberarCancela }"
            type="button"
            @click="confirmarSaida"
            :disabled="loading"
          >
            <svg v-if="podeLiberarCancela" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>
              {{
                loading
                  ? 'Liberando saída...'
                  : Number(valorDevido) === 0
                  ? 'Liberar Cancela e Concluir Saída'
                  : pagamentoConfirmado
                  ? 'Liberar Cancela e Concluir Saída'
                  : 'Conclua o Pagamento para Liberar'
              }}
            </span>
          </button>
        </div>
      </div>

      <!-- Coluna Direita: Opções de Pagamento -->
      <div class="card checkout-column">
        <!-- Caso 1: Pagamento já confirmado -->
        <div v-if="pagamentoConfirmado" class="confirmed-panel">
          <div class="confirmed-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3>Pagamento Recebido com Sucesso</h3>
          <p>O pagamento foi registrado. Clique em <strong>Liberar Cancela e Concluir Saída</strong> ao lado para encerrar.</p>

          <div class="confirmed-table">
            <div class="c-row">
              <span>Comprovante</span>
              <strong>#{{ pagamentoAtual.id }}</strong>
            </div>
            <div class="c-row">
              <span>Forma de Pagamento</span>
              <strong>{{ pagamentoAtual.forma }}</strong>
            </div>
            <div class="c-row">
              <span>Situação</span>
              <span class="tag-confirmed">PAGO</span>
            </div>
            <div v-if="pagamentoAtual.detalhes?.bandeira" class="c-row">
              <span>Cartão Utilizado</span>
              <strong>{{ pagamentoAtual.detalhes.bandeira }} (final {{ pagamentoAtual.detalhes.ultimosDigitos }})</strong>
            </div>
            <div v-if="pagamentoAtual.detalhes?.autorizacao" class="c-row">
              <span>Código de Autorização</span>
              <code>{{ pagamentoAtual.detalhes.autorizacao }}</code>
            </div>
            <div v-if="pagamentoAtual.troco > 0" class="c-row">
              <span>Troco Devolvido</span>
              <strong class="text-green">R$ {{ Number(pagamentoAtual.troco).toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <!-- Caso 2: Isento (Mensalista ou Tolerância) -->
        <div v-else-if="Number(valorDevido) === 0" class="exempt-panel">
          <div class="exempt-icon-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <h3>Saída sem Cobrança</h3>
          <p v-if="movimentacao.tipo === 'MENSALISTA'">
            Veículo vinculado a plano mensalista em dia. Clique no botão ao lado para abrir a cancela.
          </p>
          <p v-else>
            Permanência dentro do período de tolerância gratuita de 10 minutos. Clique no botão ao lado para abrir a cancela.
          </p>
        </div>

        <!-- Caso 3: Recebimento no Caixa -->
        <div v-else class="payment-section">
          <div class="card-head">
            <div>
              <h2 class="card-title">Forma de Pagamento</h2>
              <span class="card-subtitle">Escolha como o cliente deseja pagar</span>
            </div>
          </div>

          <div class="payment-options">
            <button
              type="button"
              class="payment-option"
              :class="{ selected: formaPagamento === 'PIX' }"
              @click="selecionarModalidade('PIX')"
            >
              <svg class="opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span>PIX</span>
            </button>

            <button
              type="button"
              class="payment-option"
              :class="{ selected: formaPagamento === 'CARTAO' }"
              @click="selecionarModalidade('CARTAO')"
            >
              <svg class="opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span>Cartão</span>
            </button>

            <button
              type="button"
              class="payment-option"
              :class="{ selected: formaPagamento === 'DINHEIRO' }"
              @click="selecionarModalidade('DINHEIRO')"
            >
              <svg class="opt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <circle cx="12" cy="12" r="2"/>
                <path d="M6 12h.01M18 12h.01"/>
              </svg>
              <span>Dinheiro</span>
            </button>
          </div>

          <!-- MÓDULO 1: PIX -->
          <div v-if="formaPagamento === 'PIX'" class="checkout-panel">
            <div v-if="!pagamentoAtual" class="pix-init">
              <p class="checkout-info">
                Gere o QR Code PIX ou código Copia e Cola no valor de <strong>R$ {{ Number(valorDevido).toFixed(2) }}</strong> para pagamento imediato pelo aplicativo do banco.
              </p>
              <button type="button" class="btn-pay-action" @click="gerarCobrancaPix" :disabled="processandoPagamento">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>{{ processandoPagamento ? 'Gerando QR Code...' : `Gerar QR Code PIX — R$ ${Number(valorDevido).toFixed(2)}` }}</span>
              </button>
            </div>

            <div v-else class="pix-active">
              <div class="pix-status-bar">
                <span class="pulse-dot"></span>
                <span>Aguardando pagamento pelo aplicativo do banco...</span>
              </div>

              <div class="pix-grid">
                <div class="qr-container">
                  <img
                    v-if="pagamentoAtual.detalhes?.qrCodeSvg"
                    :src="pagamentoAtual.detalhes.qrCodeSvg"
                    alt="QR Code PIX"
                    class="qr-image"
                  />
                  <span class="qr-caption">Aponte a câmera do celular</span>
                </div>

                <div class="pix-meta">
                  <div class="meta-row">
                    <span class="m-label">Recebedor</span>
                    <strong>{{ pagamentoAtual.detalhes?.beneficiario || 'Yan Carlos Farias' }}</strong>
                  </div>
                  <div class="meta-row">
                    <span class="m-label">Chave PIX</span>
                    <strong style="word-break: break-all; font-size: 0.76rem;">{{ pagamentoAtual.detalhes?.chavePix || '4654f72d-b238-462d-b863-35d0c67640b6' }}</strong>
                  </div>

                  <label class="copia-cola-label">PIX Copia e Cola</label>
                  <div class="copia-cola-box">
                    <input readonly :value="pagamentoAtual.detalhes?.pixCopiaECola" />
                    <button type="button" class="btn-copy" @click="copiarPix">
                      {{ copiado ? 'Copiado' : 'Copiar' }}
                    </button>
                  </div>

                  <button
                    type="button"
                    class="btn-confirm-webhook"
                    @click="simularWebhookPix"
                    :disabled="processandoPagamento"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{{ processandoPagamento ? 'Confirmando...' : 'Confirmar Recebimento do PIX' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- MÓDULO 2: CARTÃO -->
          <div v-if="formaPagamento === 'CARTAO'" class="checkout-panel">
            <div class="card-panel-header">
              <div>
                <strong class="panel-heading">Pagamento com Cartão</strong>
                <span class="panel-sub">Informe os dados do cartão de crédito ou débito</span>
              </div>
              <div class="test-cards-btns">
                <button type="button" class="btn-chip-ok" @click="preencherCartaoTeste()">
                  Preencher Cartão Exemplo
                </button>
              </div>
            </div>

            <div class="card-form-grid">
              <div class="form-group-sm">
                <label>Modalidade</label>
                <select v-model="cartao.modalidade">
                  <option value="CREDITO">Crédito à Vista</option>
                  <option value="DEBITO">Débito</option>
                </select>
              </div>

              <div class="form-group-sm">
                <label>
                  Número do Cartão
                  <span v-if="bandeiraDetectada" class="brand-tag">{{ bandeiraDetectada }}</span>
                </label>
                <input
                  v-model="cartao.numero"
                  @input="formatarNumeroCartao"
                  maxlength="19"
                  placeholder="0000 0000 0000 0000"
                />
              </div>

              <div class="form-group-sm">
                <label>Nome no Cartão</label>
                <input
                  v-model="cartao.nome"
                  @input="cartao.nome = cartao.nome.toUpperCase()"
                  placeholder="NOME DO TITULAR"
                />
              </div>

              <div class="card-row-split">
                <div class="form-group-sm">
                  <label>Validade (MM/AA)</label>
                  <input
                    v-model="cartao.validade"
                    @input="formatarValidade"
                    maxlength="5"
                    placeholder="12/29"
                  />
                </div>
                <div class="form-group-sm">
                  <label>CVV</label>
                  <input
                    v-model="cartao.cvv"
                    @input="cartao.cvv = cartao.cvv.replace(/\D/g, '')"
                    maxlength="4"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>

            <button type="button" class="btn-pay-action" @click="processarPagamentoCartao" :disabled="processandoPagamento">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span>{{ processandoPagamento ? 'Processando pagamento...' : `Confirmar Pagamento no Cartão — R$ ${Number(valorDevido).toFixed(2)}` }}</span>
            </button>
          </div>

          <!-- MÓDULO 3: DINHEIRO -->
          <div v-if="formaPagamento === 'DINHEIRO'" class="checkout-panel">
            <div class="form-group-troco">
              <label for="valor-entregue">Valor Recebido em Dinheiro (R$)</label>
              <input
                id="valor-entregue"
                type="number"
                step="0.50"
                min="0"
                v-model="valorPago"
                :placeholder="Number(valorDevido).toFixed(2)"
              />
            </div>

            <div v-if="trocoCalculado > 0" class="troco-line">
              <span class="t-label">Troco a devolver ao cliente:</span>
              <strong class="t-amount">R$ {{ trocoCalculado.toFixed(2) }}</strong>
            </div>
            <div v-else-if="Number(valorPago) < Number(valorDevido)" class="troco-insufficient">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Valor informado menor que o total a pagar (faltam R$ {{ (Number(valorDevido) - Number(valorPago || 0)).toFixed(2) }}).</span>
            </div>

            <button
              type="button"
              class="btn-pay-action mt-3"
              @click="processarPagamentoDinheiro"
              :disabled="processandoPagamento"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{{ processandoPagamento ? 'Registrando...' : `Confirmar Recebimento em Dinheiro (R$ ${Number(valorPago || 0).toFixed(2)})` }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PASSO 3: Recibo Final -->
    <div v-if="passo === 3" class="card receipt-card">
      <div class="receipt-header">
        <div class="receipt-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 class="receipt-title">Saída Concluída com Sucesso</h2>
        <p class="receipt-subtitle">A cancela foi liberada e o comprovante está disponível abaixo.</p>
      </div>

      <div class="receipt-box">
        <div class="receipt-plate">{{ recibo.placa }}</div>

        <div class="receipt-rows">
          <div class="r-row">
            <span class="r-label">Horário de Entrada</span>
            <span class="r-val">{{ formatarDataHora(recibo.dataHoraEntrada) }}</span>
          </div>
          <div class="r-row">
            <span class="r-label">Horário de Saída</span>
            <span class="r-val">{{ formatarDataHora(recibo.dataHoraSaida) }}</span>
          </div>
          <div class="r-row">
            <span class="r-label">Tempo de Permanência</span>
            <span class="r-val">{{ formatarTempo(recibo.permanenciaMinutos) }}</span>
          </div>
          <div class="r-row">
            <span class="r-label">Categoria</span>
            <span class="r-val">{{ recibo.tipo === 'MENSALISTA' ? 'Mensalista' : 'Rotativo' }}</span>
          </div>
          <div class="r-row r-highlight">
            <span class="r-label">Total Pago</span>
            <strong class="r-amount">R$ {{ Number(recibo.valorCobrado).toFixed(2) }}</strong>
          </div>
          <div v-if="Number(recibo.valorCobrado) > 0" class="r-row">
            <span class="r-label">Forma de Pagamento</span>
            <span class="r-val">{{ recibo.formaPagamento }}</span>
          </div>
          <div v-if="recibo.detalhes?.bandeira" class="r-row">
            <span class="r-label">Cartão / Autorização</span>
            <span class="r-val">
              {{ recibo.detalhes.bandeira }} (final {{ recibo.detalhes.ultimosDigitos }}) · {{ recibo.detalhes.autorizacao }}
            </span>
          </div>
          <div v-if="recibo.troco > 0" class="r-row">
            <span class="r-label">Troco Devolvido</span>
            <span class="r-val font-semibold">R$ {{ Number(recibo.troco).toFixed(2) }}</span>
          </div>
          <div class="r-row">
            <span class="r-label">Situação</span>
            <span class="badge-status-closed">CONCLUÍDA</span>
          </div>
        </div>
      </div>

      <div class="receipt-footer">
        <button type="button" class="btn-outline" @click="baixarRecibo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <polyline points="9 15 12 18 15 15"/>
          </svg>
          <span>Baixar Recibo em PDF</span>
        </button>
        <button type="button" class="btn-primary" @click="reiniciar">
          Nova Saída
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'
import { exportarComprovantePDF } from '../utils/exportadores'

const route = useRoute()
const router = useRouter()

const passo = ref(1)
const placa = ref('')
const loading = ref(false)
const processandoPagamento = ref(false)
const error = ref('')

const movimentacao = ref({})
const permanenciaMinutos = ref(0)
const valorDevido = ref('0.00')
const dentroCarencia = ref(false)
const horarioSaidaPrevisto = ref(new Date().toISOString())

const formaPagamento = ref('PIX')
const valorPago = ref('')
const pagamentoAtual = ref(null)
const copiado = ref(false)
let pollTimer = null

const cartao = ref({
  modalidade: 'CREDITO',
  numero: '',
  nome: '',
  validade: '',
  cvv: '',
})

const veiculosNoPatio = ref([])
const recibo = ref({})

const pagamentoConfirmado = computed(() => pagamentoAtual.value?.status === 'CONFIRMADO')
const podeLiberarCancela = computed(() => Number(valorDevido.value) === 0 || pagamentoConfirmado.value)

const trocoCalculado = computed(() => {
  const entregue = parseFloat(valorPago.value)
  const devido = parseFloat(valorDevido.value)
  if (isNaN(entregue) || entregue <= devido) return 0
  return entregue - devido
})

const bandeiraDetectada = computed(() => {
  const num = cartao.value.numero.replace(/\D/g, '')
  if (!num) return ''
  if (/^4/.test(num)) return 'VISA'
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'MASTERCARD'
  if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650|6516|6550)/.test(num)) return 'ELO'
  if (/^3[47]/.test(num)) return 'AMEX'
  return 'CARTÃO'
})

function selecionarModalidade(novaForma) {
  formaPagamento.value = novaForma
  error.value = ''
  if (novaForma !== 'PIX') {
    pararPollingPix()
    if (pagamentoAtual.value?.status === 'PENDENTE') {
      pagamentoAtual.value = null
    }
  }
}

function formatarNumeroCartao() {
  const digits = cartao.value.numero.replace(/\D/g, '').slice(0, 16)
  cartao.value.numero = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatarValidade() {
  const digits = cartao.value.validade.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) {
    cartao.value.validade = `${digits.slice(0, 2)}/${digits.slice(2)}`
  } else {
    cartao.value.validade = digits
  }
}

function preencherCartaoTeste() {
  error.value = ''
  cartao.value = {
    modalidade: 'CREDITO',
    numero: '4532 0151 1283 0366',
    nome: 'CLIENTE MY PARKING',
    validade: '12/29',
    cvv: '123',
  }
}

function selecionarPlaca(p) {
  placa.value = p
  buscar()
}

async function carregarVeiculosNoPatio() {
  try {
    const res = await api.get('/entradas')
    veiculosNoPatio.value = (res.data || []).filter(m => m.status === 'ABERTA')
  } catch (e) {
    console.error('Erro ao carregar veículos do pátio:', e)
  }
}

async function buscar() {
  if (!placa.value) return
  loading.value = true
  error.value = ''
  pagamentoAtual.value = null
  pararPollingPix()

  try {
    const res = await api.get('/movimentacoes/aberta', {
      params: { placa: placa.value.toUpperCase().trim() }
    })
    movimentacao.value = res.data
    horarioSaidaPrevisto.value = new Date().toISOString()

    const entradaIso = res.data.dataHoraEntrada || res.data.horaEntrada
    const entrada = new Date(entradaIso)
    const agora = new Date()
    permanenciaMinutos.value = Math.max(1, Math.floor((agora - entrada) / 60000))

    if (movimentacao.value.tipo === 'MENSALISTA') {
      valorDevido.value = '0.00'
      dentroCarencia.value = false
    } else {
      const calcRes = await api.post('/pagamentos/calcular', {
        movimentacaoId: res.data.id,
        permanenciaMinutos: permanenciaMinutos.value,
        minutos: permanenciaMinutos.value,
      })
      valorDevido.value = Number(calcRes.data.valorCalculado ?? calcRes.data.valor ?? 0).toFixed(2)
      dentroCarencia.value = !!calcRes.data.dentroCarencia

      try {
        const pagExistente = await api.get(`/pagamentos/movimentacao/${res.data.id}`)
        if (pagExistente.data) {
          pagamentoAtual.value = pagExistente.data
          formaPagamento.value = pagExistente.data.forma || 'PIX'
          if (pagExistente.data.status === 'PENDENTE') {
            iniciarPollingPix(pagExistente.data.id)
          }
        }
      } catch {
        // Sem pagamento anterior
      }
    }

    valorPago.value = valorDevido.value
    passo.value = 2
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Nenhum veículo estacionado foi encontrado com esta placa.'
  } finally {
    loading.value = false
  }
}

async function gerarCobrancaPix() {
  processandoPagamento.value = true
  error.value = ''
  try {
    const devidoNum = parseFloat(valorDevido.value)
    const res = await api.post('/pagamentos', {
      movimentacaoId: movimentacao.value.id,
      forma: 'PIX',
      valorPago: devidoNum,
      valor: devidoNum,
      permanenciaMinutos: permanenciaMinutos.value,
      iniciarPix: true,
    })
    pagamentoAtual.value = res.data
    if (res.data.status === 'PENDENTE') {
      iniciarPollingPix(res.data.id)
    }
  } catch (e) {
    error.value = e?.response?.data?.error || 'Erro ao gerar QR Code PIX.'
  } finally {
    processandoPagamento.value = false
  }
}

function iniciarPollingPix(pagamentoId) {
  pararPollingPix()
  pollTimer = setInterval(async () => {
    try {
      const res = await api.get(`/pagamentos/${pagamentoId}`)
      if (res.data?.status === 'CONFIRMADO') {
        pagamentoAtual.value = res.data
        pararPollingPix()
      }
    } catch {
      // ignora oscilação pontual
    }
  }, 2500)
}

function pararPollingPix() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function copiarPix() {
  const codigo = pagamentoAtual.value?.detalhes?.pixCopiaECola
  if (!codigo) return
  try {
    await navigator.clipboard.writeText(codigo)
    copiado.value = true
    setTimeout(() => { copiado.value = false }, 2000)
  } catch {
    copiado.value = false
  }
}

async function simularWebhookPix() {
  if (!pagamentoAtual.value?.id) return
  processandoPagamento.value = true
  error.value = ''
  try {
    const res = await api.post(`/pagamentos/${pagamentoAtual.value.id}/confirmar`)
    pagamentoAtual.value = res.data
    pararPollingPix()
  } catch (e) {
    error.value = e?.response?.data?.error || 'Erro ao confirmar o pagamento PIX.'
  } finally {
    processandoPagamento.value = false
  }
}

async function processarPagamentoCartao() {
  processandoPagamento.value = true
  error.value = ''
  try {
    const devidoNum = parseFloat(valorDevido.value)
    const res = await api.post('/pagamentos', {
      movimentacaoId: movimentacao.value.id,
      forma: 'CARTAO',
      valorPago: devidoNum,
      valor: devidoNum,
      permanenciaMinutos: permanenciaMinutos.value,
      cartao: cartao.value,
    })
    pagamentoAtual.value = res.data
  } catch (e) {
    error.value = e?.response?.data?.error || 'Não foi possível autorizar o cartão. Verifique os dados informados.'
  } finally {
    processandoPagamento.value = false
  }
}

async function processarPagamentoDinheiro() {
  processandoPagamento.value = true
  error.value = ''
  try {
    const devidoNum = parseFloat(valorDevido.value)
    const entregueNum = parseFloat(valorPago.value)
    const res = await api.post('/pagamentos', {
      movimentacaoId: movimentacao.value.id,
      forma: 'DINHEIRO',
      valorPago: isNaN(entregueNum) ? 0 : entregueNum,
      valor: devidoNum,
      permanenciaMinutos: permanenciaMinutos.value,
    })
    pagamentoAtual.value = res.data
  } catch (e) {
    error.value = e?.response?.data?.error || 'Erro ao registrar pagamento em dinheiro.'
  } finally {
    processandoPagamento.value = false
  }
}

async function confirmarSaida() {
  loading.value = true
  error.value = ''

  try {
    const devidoNum = parseFloat(valorDevido.value)

    const saidaRes = await api.post('/saidas', {
      placa: movimentacao.value.placa,
      movimentacaoId: movimentacao.value.id,
      valorCobrado: devidoNum,
    })

    pararPollingPix()

    recibo.value = {
      placa: movimentacao.value.placa,
      dataHoraEntrada: movimentacao.value.dataHoraEntrada || movimentacao.value.horaEntrada,
      dataHoraSaida: saidaRes.data.dataHoraSaida || new Date().toISOString(),
      permanenciaMinutos: permanenciaMinutos.value,
      tipo: movimentacao.value.tipo,
      valorCobrado: devidoNum,
      formaPagamento: devidoNum > 0 ? (pagamentoAtual.value?.forma || formaPagamento.value) : 'Isento',
      troco: pagamentoAtual.value?.troco || 0,
      detalhes: pagamentoAtual.value?.detalhes || {},
    }

    passo.value = 3
    if (route.query.placa) {
      router.replace({ path: '/saida', query: {} })
    }
    await carregarVeiculosNoPatio()
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Conclua o pagamento antes de liberar a saída.'
  } finally {
    loading.value = false
  }
}

function baixarRecibo() {
  if (!recibo.value?.placa) return
  exportarComprovantePDF(recibo.value, 'SAIDA')
}

function voltarPasso1() {
  pararPollingPix()
  passo.value = 1
  error.value = ''
  if (route.query.placa) {
    router.replace({ path: '/saida', query: {} })
  }
}

function reiniciar() {
  pararPollingPix()
  passo.value = 1
  placa.value = ''
  movimentacao.value = {}
  permanenciaMinutos.value = 0
  valorDevido.value = '0.00'
  dentroCarencia.value = false
  pagamentoAtual.value = null
  error.value = ''
  carregarVeiculosNoPatio()
}

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
    second: '2-digit',
  })
}

function formatarHoraCurta(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatarTempo(minutos) {
  if (!minutos || minutos < 0) return '0 min'
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${h}h ${m}min`
}

onMounted(async () => {
  await carregarVeiculosNoPatio()
  if (route.query.placa) {
    placa.value = String(route.query.placa).toUpperCase()
    buscar()
  }
})

onUnmounted(() => {
  pararPollingPix()
})
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

.stepper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.9rem;
  border-radius: 9999px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 800;
}

.step-item.active {
  color: #0f172a;
}

.step-item.active .step-num {
  background: #1b314c;
  color: #f5b324;
}

.step-item.done {
  color: #059669;
}

.step-item.done .step-num {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.step-line {
  width: 20px;
  height: 1px;
  background: #cbd5e1;
}

.step1-grid,
.pdv-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 1.25rem;
  align-items: start;
}

.card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.card-subtitle {
  font-size: 0.8rem;
  color: #64748b;
  display: block;
  margin-top: 0.15rem;
}

.tag-terminal {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #f1f5f9;
  color: #1b314c;
  border: 1px solid #cbd5e1;
  padding: 0.2rem 0.55rem;
  border-radius: 5px;
}

.count-badge {
  background: #f0f7fc;
  color: #2b7ab5;
  border: 1px solid #bae6fd;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.form-group {
  margin-bottom: 1.35rem;
}

label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.45rem;
}

.plate-input-container {
  border: 2px solid #1b314c;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.plate-input-container:focus-within {
  border-color: #2b7ab5;
  box-shadow: 0 0 0 3px rgba(43, 122, 181, 0.18);
}

.mercosul-strip {
  background: #1d4ed8;
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-align: center;
  padding: 3px 0;
}

.plate-input-container input {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: 4px;
  text-align: center;
  padding: 0.65rem 0.75rem;
  border: none;
  text-transform: uppercase;
  color: #0f172a;
  background: #f8fafc;
}

.plate-input-container input:focus {
  outline: none;
  background: #ffffff;
}

.quick-chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 0.65rem;
}

.chip-plate {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  transition: all 0.15s;
}

.chip-plate:hover {
  border-color: #2b7ab5;
  background: #f0f7fc;
  transform: translateY(-1px);
}

.chip-top {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chip-code {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 0.92rem;
  color: #0f172a;
}

.chip-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}

.cb-mensalista { background: #dcfce7; color: #15803d; }
.cb-rotativo { background: #e0f2fe; color: #0369a1; }

.chip-time {
  font-size: 0.74rem;
  color: #64748b;
}

.empty-patio {
  text-align: center;
  padding: 2rem 1rem;
  color: #94a3b8;
  font-size: 0.86rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
}

.summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.15rem;
  margin-bottom: 1.25rem;
}

.plate-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #e2e8f0;
}

.ticket-plate {
  font-family: var(--font-mono);
  font-size: 1.35rem;
  font-weight: 800;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.25rem 0.75rem;
  letter-spacing: 2px;
  color: #0f172a;
}

.mensalista-text {
  font-size: 0.82rem;
  color: #047857;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.s-label {
  font-size: 0.74rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.s-value {
  font-size: 0.85rem;
  color: #0f172a;
}

.saldo-card {
  background: #0b192c;
  color: #ffffff;
  border-radius: 10px;
  padding: 1.35rem;
  text-align: center;
  margin-bottom: 1.25rem;
  border: 1px solid #1b314c;
  transition: all 0.25s;
}

.saldo-card.saldo-zero {
  background: #064e3b;
  border-color: #047857;
}

.saldo-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #94a3b8;
  margin-bottom: 0.3rem;
}

.saldo-card.saldo-zero .saldo-label {
  color: #a7f3d0;
}

.saldo-amount {
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -1px;
  color: #ffffff;
}

.saldo-description {
  font-size: 0.82rem;
  color: #cbd5e1;
  margin-top: 0.45rem;
}

.inline-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #ecfdf5;
  font-weight: 600;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
  margin-bottom: 1.15rem;
}

.payment-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.75rem 0.5rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  color: #475569;
  background: #ffffff;
  transition: all 0.15s;
}

.payment-option:hover {
  border-color: #2b7ab5;
  background: #f8fafc;
}

.payment-option.selected {
  border-color: #1b314c;
  background: #1b314c;
  color: #ffffff;
}

.payment-option.selected .opt-icon {
  color: #f5b324;
}

.checkout-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.2rem;
}

.checkout-info {
  font-size: 0.84rem;
  color: #475569;
  margin: 0 0 1rem;
  line-height: 1.5;
}

.btn-pay-action {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #1b314c;
  color: #ffffff;
  border: 1px solid #112239;
  border-radius: 8px;
  padding: 0.82rem 1rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-pay-action:hover:not(:disabled) {
  background: #2b7ab5;
  border-color: #1d6396;
}

.btn-pay-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mt-3 {
  margin-top: 1rem;
}

.pix-status-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
}

.pix-grid {
  display: grid;
  grid-template-columns: 185px 1fr;
  gap: 1.1rem;
  align-items: center;
}

.qr-container {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-image {
  width: 160px;
  height: 160px;
  display: block;
}

.qr-caption {
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 0.35rem;
  font-weight: 600;
}

.pix-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #334155;
  border-bottom: 1px dashed #cbd5e1;
  padding-bottom: 0.3rem;
}

.m-label {
  color: #64748b;
}

.copia-cola-label {
  font-size: 0.75rem;
  color: #475569;
  margin-top: 0.25rem;
  margin-bottom: 0.1rem;
}

.copia-cola-box {
  display: flex;
  gap: 0.4rem;
}

.copia-cola-box input {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
}

.btn-copy {
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.76rem;
  padding: 0 0.8rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-copy:hover {
  background: #cbd5e1;
}

.btn-confirm-webhook {
  margin-top: 0.45rem;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: #059669;
  color: #ffffff;
  border: 1px solid #047857;
  border-radius: 7px;
  padding: 0.7rem;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-confirm-webhook:hover:not(:disabled) {
  background: #047857;
}

.card-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.panel-heading {
  font-size: 0.88rem;
  color: #0f172a;
}

.panel-sub {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.btn-chip-ok {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.3rem 0.65rem;
  border-radius: 5px;
  cursor: pointer;
  background: #f0f7fc;
  color: #1b314c;
  border: 1px solid #bae6fd;
}

.btn-chip-ok:hover {
  background: #e0f2fe;
}

.card-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.card-row-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.form-group-sm label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.76rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.3rem;
}

.brand-tag {
  background: #1b314c;
  color: #f5b324;
  font-size: 0.62rem;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 800;
}

.form-group-sm input,
.form-group-sm select {
  width: 100%;
  padding: 0.58rem 0.7rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  background: #ffffff;
  color: #0f172a;
}

.form-group-troco input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  background: #ffffff;
}

.troco-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.troco-insufficient {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.65rem;
  font-size: 0.8rem;
  color: #b45309;
  font-weight: 600;
}

.t-label { font-size: 0.84rem; color: #475569; }
.t-amount { font-size: 1.1rem; color: #059669; }

.confirmed-panel,
.exempt-panel {
  text-align: center;
  padding: 1.25rem 0.75rem;
}

.confirmed-icon-box,
.exempt-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.85rem;
}

.confirmed-panel h3,
.exempt-panel h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.confirmed-panel p,
.exempt-panel p {
  font-size: 0.84rem;
  color: #64748b;
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.confirmed-table {
  text-align: left;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.c-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.4rem;
}

.c-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.tag-confirmed {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.actions-row,
.receipt-footer {
  display: flex;
  gap: 0.75rem;
}

.btn-primary {
  flex: 2;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #1b314c;
  color: #ffffff;
  border: 1px solid #112239;
  border-radius: 8px;
  padding: 0.82rem 1.1rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary.btn-ready {
  background: #059669;
  border-color: #047857;
}

.btn-primary:hover:not(:disabled) {
  background: #2b7ab5;
  border-color: #1d6396;
}

.btn-primary.btn-ready:hover:not(:disabled) {
  background: #047857;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.82rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-outline:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.7rem 0.85rem;
  border-radius: 7px;
  font-size: 0.84rem;
  margin-bottom: 1.15rem;
  font-weight: 600;
}

.receipt-card {
  max-width: 680px;
  margin: 0 auto;
}

.receipt-header {
  text-align: center;
  margin-bottom: 1.35rem;
}

.receipt-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.receipt-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem;
}

.receipt-subtitle {
  color: #64748b;
  font-size: 0.82rem;
}

.receipt-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.35rem;
  margin-bottom: 1.35rem;
}

.receipt-plate {
  font-family: var(--font-mono);
  font-size: 1.55rem;
  font-weight: 800;
  text-align: center;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.35rem 0;
  margin-bottom: 1.15rem;
  letter-spacing: 3px;
}

.receipt-rows {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.r-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.r-row.r-highlight {
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.6rem 0;
  margin: 0.3rem 0;
}

.r-label { color: #64748b; }
.r-val { color: #0f172a; font-weight: 600; }
.r-amount { font-size: 1.2rem; color: #059669; }

.badge-pill {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
}

.badge-rotativo { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
.badge-mensalista { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

.badge-status-closed {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

.text-green { color: #059669; }
.text-slate { color: #475569; }
.font-semibold { font-weight: 600; }

@media (max-width: 1080px) {
  .step1-grid,
  .pdv-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 1.15rem;
  }

  .stepper {
    width: 100%;
    justify-content: space-between;
  }

  .step-label {
    display: none;
  }

  .pix-grid,
  .card-form-grid,
  .summary-grid,
  .payment-options {
    grid-template-columns: 1fr;
  }

  .actions-row,
  .receipt-footer {
    flex-direction: column;
  }
}
</style>
