// ──────────────────────────────────────────────────────────────────
// Interface do Repositório de Pagamentos (DIP & LSP & ISP)
// C4 Nível 3: Pagamento Repository
// ──────────────────────────────────────────────────────────────────

const { Pagamento } = require('../domain/entities/PagamentoEntities');

class IPagamentoRepository {
  async salvar(pagamento) {
    throw new Error('Método salvar() não implementado');
  }

  async atualizar(pagamento) {
    throw new Error('Método atualizar() não implementado');
  }

  async listar() {
    throw new Error('Método listar() não implementado');
  }

  async buscarPorId(id) {
    throw new Error('Método buscarPorId() não implementado');
  }

  async buscarPorMovimentacaoId(movimentacaoId) {
    throw new Error('Método buscarPorMovimentacaoId() não implementado');
  }
}

class InMemoryPagamentoRepository extends IPagamentoRepository {
  constructor() {
    super();
    this.pagamentos = [
      new Pagamento({
        id: '9001',
        movimentacaoId: '1000',
        forma: 'PIX',
        valorCalculado: 16.00,
        valorPago: 16.00,
        troco: 0,
        status: 'CONFIRMADO',
        detalhes: {
          tipo: 'PIX',
          endToEndId: 'E182361202026101809001PIX',
          beneficiario: 'MY SERVICE PARKING LTDA',
        },
        dataHora: new Date(Date.now() - 60 * 60000).toISOString(),
      }),
    ];
  }

  async salvar(pagamento) {
    this.pagamentos.push(pagamento);
    return pagamento;
  }

  async atualizar(pagamento) {
    const idx = this.pagamentos.findIndex((p) => String(p.id) === String(pagamento.id));
    if (idx >= 0) {
      this.pagamentos[idx] = pagamento;
      return this.pagamentos[idx];
    }
    return null;
  }

  async listar() {
    return [...this.pagamentos];
  }

  async buscarPorId(id) {
    return this.pagamentos.find((p) => String(p.id) === String(id)) || null;
  }

  async buscarPorMovimentacaoId(movimentacaoId) {
    const matches = this.pagamentos.filter((p) => String(p.movimentacaoId) === String(movimentacaoId));
    if (matches.length === 0) return null;
    // Prioriza pagamento CONFIRMADO se existir, senão retorna o mais recente
    const confirmado = matches.find((p) => p.status === 'CONFIRMADO');
    return confirmado || matches[matches.length - 1];
  }
}

module.exports = {
  IPagamentoRepository,
  InMemoryPagamentoRepository,
};
