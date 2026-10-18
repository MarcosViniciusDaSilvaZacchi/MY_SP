// ──────────────────────────────────────────────────────────────────
// Strategy Pattern para Métodos de Pagamento (OCP & SRP)
// Inclui:
// - Gerador real de BR Code PIX (EMVCo Banco Central + CRC16-CCITT) + SVG QR Code
// - Validador de Cartão (Algoritmo de Luhn, Bandeira, Validade MM/AA, CVV, TEF)
// - Processador de Dinheiro com cálculo e validação de troco
// ──────────────────────────────────────────────────────────────────

const QRCode = require('qrcode');
const { FormaPagamento, StatusPagamento } = require('../enums/PagamentoEnums');

/**
 * Utilitário de geração de Payload PIX (Padrão EMV / BR Code do Banco Central)
 */
class PixPayloadGenerator {
  static formatField(id, value) {
    const str = String(value);
    const len = String(str.length).padStart(2, '0');
    return `${id}${len}${str}`;
  }

  static crc16CCITT(payload) {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  static gerarBrCode({
    chavePix = process.env.PIX_CHAVE || '4654f72d-b238-462d-b863-35d0c67640b6',
    nomeBeneficiario = process.env.PIX_BENEFICIARIO || 'Yan Carlos Farias',
    cidade = process.env.PIX_CIDADE || 'SAO PAULO',
    valor = 0,
    txId = 'MYPARK01',
  }) {
    const gui = this.formatField('00', 'br.gov.bcb.pix');
    const key = this.formatField('01', String(chavePix).trim());
    const merchantAccount = this.formatField('26', `${gui}${key}`);

    const txIdClean = String(txId || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';
    const additionalData = this.formatField('62', this.formatField('05', txIdClean));

    // Normaliza nome e cidade para ASCII conforme norma oficial EMVCo / Banco Central
    const nomeLimpo = String(nomeBeneficiario || 'Yan Carlos Farias')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .slice(0, 25);
    const cidadeLimpa = String(cidade || 'SAO PAULO')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .slice(0, 15);

    const payloadSemCrc = [
      this.formatField('00', '01'), // Payload Format Indicator
      merchantAccount,
      this.formatField('52', '0000'), // Merchant Category Code
      this.formatField('53', '986'), // Moeda BRL (986)
      valor > 0 ? this.formatField('54', Number(valor).toFixed(2)) : '',
      this.formatField('58', 'BR'),
      this.formatField('59', nomeLimpo),
      this.formatField('60', cidadeLimpa),
      additionalData,
      '6304', // CRC16 ID + Length
    ].join('');

    const crc = this.crc16CCITT(payloadSemCrc);
    return `${payloadSemCrc}${crc}`;
  }

  /**
   * Gera um DataURL SVG de QR Code de alta precisão via padrão qrcode
   * Escaneável por qualquer app de banco (Nubank, Itaú, Bradesco, Inter, Santander, BB, PicPay, etc.)
   */
  static async gerarQrCodeSvg(payload) {
    try {
      const svg = await QRCode.toString(payload, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    } catch {
      return null;
    }
  }
}

/**
 * Validador de Cartão de Crédito/Débito (Algoritmo de Luhn + Bandeira + Validade)
 */
class CartaoValidator {
  static validarLuhn(numeroLimpo) {
    if (!/^\d{13,19}$/.test(numeroLimpo)) return false;
    let soma = 0;
    let dobrar = false;
    for (let i = numeroLimpo.length - 1; i >= 0; i--) {
      let digito = parseInt(numeroLimpo.charAt(i), 10);
      if (dobrar) {
        digito *= 2;
        if (digito > 9) digito -= 9;
      }
      soma += digito;
      dobrar = !dobrar;
    }
    return soma % 10 === 0;
  }

  static detectarBandeira(numeroLimpo) {
    if (/^4/.test(numeroLimpo)) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(numeroLimpo)) return 'MASTERCARD';
    if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650|6516|6550)/.test(numeroLimpo)) return 'ELO';
    if (/^3[47]/.test(numeroLimpo)) return 'AMEX';
    if (/^(606282|3841)/.test(numeroLimpo)) return 'HIPERCARD';
    return 'CARTAO';
  }

  static validarValidade(validade) {
    const match = String(validade || '').trim().match(/^(0[1-9]|1[0-2])\/?(\d{2}|\d{4})$/);
    if (!match) return false;
    const mes = parseInt(match[1], 10);
    let ano = parseInt(match[2], 10);
    if (ano < 100) ano += 2000;
    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtual = agora.getMonth() + 1;
    if (ano < anoAtual) return false;
    if (ano === anoAtual && mes < mesAtual) return false;
    return true;
  }
}

class IPagamentoProcessor {
  /**
   * @param {number} valorDevido
   * @param {number} valorPago
   * @param {object} [opcoes]
   * @returns {{ status: string, troco: number, detalhes: object }}
   */
  processar(valorDevido, valorPago, opcoes = {}) {
    throw new Error('Método processar() não implementado');
  }
}

class DinheiroProcessor extends IPagamentoProcessor {
  processar(valorDevido, valorPago) {
    const vPago = Number(valorPago);
    if (isNaN(vPago) || vPago < valorDevido) {
      const err = new Error(
        `Valor em dinheiro insuficiente. Saldo devido: R$ ${valorDevido.toFixed(2)}, recebido: R$ ${(vPago || 0).toFixed(2)}`
      );
      err.statusCode = 400;
      throw err;
    }
    const troco = parseFloat((vPago - valorDevido).toFixed(2));
    return {
      status: StatusPagamento.CONFIRMADO,
      troco: troco > 0 ? troco : 0,
      detalhes: {
        tipo: FormaPagamento.DINHEIRO,
        valorRecebido: vPago,
        trocoDevolvido: troco,
      },
    };
  }
}

class CartaoProcessor extends IPagamentoProcessor {
  processar(valorDevido, _valorPago, opcoes = {}) {
    const { cartao } = opcoes;

    // Se os dados do cartão foram enviados no checkout, valida Luhn, validade e CVV
    if (cartao) {
      const numeroLimpo = String(cartao.numero || '').replace(/\D/g, '');
      const nomeTitular = String(cartao.nome || '').trim();
      const validade = String(cartao.validade || '').trim();
      const cvv = String(cartao.cvv || '').replace(/\D/g, '');
      const modalidade = String(cartao.modalidade || 'CREDITO').toUpperCase();

      if (!CartaoValidator.validarLuhn(numeroLimpo)) {
        const err = new Error('Não foi possível autorizar: número do cartão inválido. Verifique os dígitos informados.');
        err.statusCode = 400;
        throw err;
      }

      if (nomeTitular.length < 3) {
        const err = new Error('Transação negada: informe o nome impresso no cartão.');
        err.statusCode = 400;
        throw err;
      }

      if (!CartaoValidator.validarValidade(validade)) {
        const err = new Error('Transação negada: cartão vencido ou data de validade inválida (use MM/AA).');
        err.statusCode = 400;
        throw err;
      }

      if (cvv.length < 3 || cvv.length > 4) {
        const err = new Error('Transação negada: código de segurança (CVV) inválido.');
        err.statusCode = 400;
        throw err;
      }

      const bandeira = CartaoValidator.detectarBandeira(numeroLimpo);
      const ultimosDigitos = numeroLimpo.slice(-4);
      const nsu = String(Math.floor(100000 + Math.random() * 900000));
      const autorizacao = `AUT-${Date.now().toString().slice(-6)}`;

      return {
        status: StatusPagamento.CONFIRMADO,
        troco: 0,
        detalhes: {
          tipo: FormaPagamento.CARTAO,
          modalidade,
          bandeira,
          ultimosDigitos,
          titular: nomeTitular.toUpperCase(),
          nsu,
          autorizacao,
        },
      };
    }

    // Fallback para chamadas de API simplificadas
    return {
      status: StatusPagamento.CONFIRMADO,
      troco: 0,
      detalhes: {
        tipo: FormaPagamento.CARTAO,
        modalidade: 'CREDITO',
        bandeira: 'VISA',
        ultimosDigitos: '4242',
        nsu: String(Math.floor(100000 + Math.random() * 900000)),
        autorizacao: `AUT-${Date.now().toString().slice(-6)}`,
      },
    };
  }
}

class PixProcessor extends IPagamentoProcessor {
  async processar(valorDevido, _valorPago, opcoes = {}) {
    const txId = `MP${String(opcoes.movimentacaoId || Date.now()).slice(-10)}${Date.now().toString().slice(-4)}`;
    const chavePix = process.env.PIX_CHAVE || '4654f72d-b238-462d-b863-35d0c67640b6';
    const beneficiario = process.env.PIX_BENEFICIARIO || 'Yan Carlos Farias';
    const cidade = process.env.PIX_CIDADE || 'SAO PAULO';

    const pixCopiaECola = PixPayloadGenerator.gerarBrCode({
      chavePix,
      nomeBeneficiario: beneficiario,
      cidade,
      valor: valorDevido,
      txId,
    });
    const qrCodeSvg = await PixPayloadGenerator.gerarQrCodeSvg(pixCopiaECola);

    // Se iniciarPix = true, cria a cobrança PIX como PENDENTE aguardando confirmação (Webhook / Banco)
    if (opcoes.iniciarPix) {
      return {
        status: StatusPagamento.PENDENTE,
        troco: 0,
        detalhes: {
          tipo: FormaPagamento.PIX,
          txId,
          chavePix,
          beneficiario,
          instituicao: 'PIX BANCO CENTRAL (SPI)',
          pixCopiaECola,
          qrCodeSvg,
          expiraEm: new Date(Date.now() + 15 * 60000).toISOString(),
        },
      };
    }

    return {
      status: StatusPagamento.CONFIRMADO,
      troco: 0,
      detalhes: {
        tipo: FormaPagamento.PIX,
        txId,
        chavePix,
        beneficiario,
        pixCopiaECola,
        qrCodeSvg,
        endToEndId: `E18236120${Date.now()}PIX`,
      },
    };
  }
}

class PagamentoProcessorFactory {
  static obterProcessador(forma) {
    const formaNorm = String(forma || '').toUpperCase().trim();
    switch (formaNorm) {
      case FormaPagamento.DINHEIRO:
        return new DinheiroProcessor();
      case FormaPagamento.CARTAO:
      case 'DEBITO':
      case 'CREDITO':
        return new CartaoProcessor();
      case FormaPagamento.PIX:
        return new PixProcessor();
      default: {
        const err = new Error(`Forma de pagamento inválida: ${forma}`);
        err.statusCode = 400;
        throw err;
      }
    }
  }
}

module.exports = {
  PixPayloadGenerator,
  CartaoValidator,
  IPagamentoProcessor,
  DinheiroProcessor,
  CartaoProcessor,
  PixProcessor,
  PagamentoProcessorFactory,
};
