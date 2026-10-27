// ──────────────────────────────────────────────────────────────────
// Strategy Pattern para Regras de Acesso à Portaria (OCP / LSP / SRP)
// C4 Nível 3: Regras de Acesso ao Pátio
// Permite adicionar novas regras de entrada (ex: VIP, Bloqueio, Isenção)
// sem alterar o EstacionamentoService existente.
// ──────────────────────────────────────────────────────────────────

const { TipoMovimentacao } = require('../enums/EstacionamentoEnums');

/**
 * Interface / Classe Base para Estratégias de Acesso (LSP & ISP)
 */
class IRegraAcessoStrategy {
  /**
   * Avalia a liberação de entrada no pátio
   * @param {object} params
   * @param {string} params.placa
   * @param {object|null} params.mensalista
   * @param {string} params.origem
   * @returns {{ autorizado: boolean, tipo: string, motivoNegacao: string|null, mensalistaNome: string|null }}
   */
  avaliarAcesso(params) {
    throw new Error('Método avaliarAcesso() não implementado');
  }
}

/**
 * Regra para Clientes Mensalistas:
 * Autorizado apenas se o contrato estiver 'EM_DIA'
 */
class RegraAcessoMensalista extends IRegraAcessoStrategy {
  avaliarAcesso({ mensalista }) {
    if (!mensalista) {
      return {
        aplica: false,
        autorizado: false,
        tipo: null,
        motivoNegacao: null,
        mensalistaNome: null,
      };
    }

    const estaEmDia = mensalista.status === 'EM_DIA';
    return {
      aplica: true,
      autorizado: estaEmDia,
      tipo: TipoMovimentacao.MENSALISTA,
      motivoNegacao: estaEmDia ? null : `Mensalista com situação cadastral: ${mensalista.status || 'BLOQUEADO'}`,
      mensalistaNome: mensalista.nome || null,
    };
  }
}

/**
 * Regra Padrão para Veículos Rotativos (Avulsos)
 */
class RegraAcessoRotativo extends IRegraAcessoStrategy {
  avaliarAcesso() {
    return {
      aplica: true,
      autorizado: true,
      tipo: TipoMovimentacao.ROTATIVO,
      motivoNegacao: null,
      mensalistaNome: null,
    };
  }
}

/**
 * Contexto de Avaliação de Acesso (Composition Root / Dispatcher)
 */
class AvaliadorAcessoContext {
  /**
   * @param {Array<IRegraAcessoStrategy>} [strategies]
   */
  constructor(strategies = [new RegraAcessoMensalista(), new RegraAcessoRotativo()]) {
    this.strategies = strategies;
  }

  avaliar({ placa, mensalista, origem = 'OPERADOR' }) {
    for (const strategy of this.strategies) {
      const resultado = strategy.avaliarAcesso({ placa, mensalista, origem });
      if (resultado.aplica) {
        return resultado;
      }
    }

    return {
      autorizado: false,
      tipo: TipoMovimentacao.ROTATIVO,
      motivoNegacao: 'Nenhuma regra de acesso satisfeita para o veículo',
      mensalistaNome: null,
    };
  }
}

module.exports = {
  IRegraAcessoStrategy,
  RegraAcessoMensalista,
  RegraAcessoRotativo,
  AvaliadorAcessoContext,
};

