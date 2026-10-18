// ──────────────────────────────────────────────────────────────────
// Implementação em Memória do Repositório de Mensalistas (LSP / DIP)
// ──────────────────────────────────────────────────────────────────

const { IMensalistaRepository } = require('./IMensalistaRepository');
const { Mensalista } = require('../domain/entities/Mensalista');
const { StatusMensalista } = require('../domain/enums/StatusMensalista');

class InMemoryMensalistaRepository extends IMensalistaRepository {
  constructor() {
    super();
    this.mensalistas = [
      new Mensalista({
        id: '1',
        nome: 'Joao Silva',
        cpf: '111.111.111-11',
        email: 'joao@email.com',
        placa: 'XYZ9K88',
        vencimento: '2026-09-30',
        status: StatusMensalista.EM_DIA,
        planoMensal: 150.00,
      }),
      new Mensalista({
        id: '2',
        nome: 'Maria Santos',
        cpf: '222.222.222-22',
        email: 'maria@email.com',
        placa: 'DEF5G67',
        vencimento: '2026-08-31',
        status: StatusMensalista.INADIMPLENTE,
        planoMensal: 150.00,
      }),
      new Mensalista({
        id: '3',
        nome: 'Carlos Mendes',
        cpf: '333.333.333-33',
        email: 'carlos@email.com',
        placa: 'GHI2J45',
        vencimento: '2026-10-15',
        status: StatusMensalista.EM_DIA,
        planoMensal: 180.00,
      }),
    ];
  }

  async listar(filtroPlaca) {
    if (!filtroPlaca) {
      return [...this.mensalistas];
    }
    const termo = filtroPlaca.toUpperCase().trim();
    return this.mensalistas.filter((m) => m.placa.includes(termo));
  }

  async buscarPorId(id) {
    return this.mensalistas.find((m) => m.id === String(id)) || null;
  }

  async buscarPorPlaca(placa) {
    if (!placa) return null;
    const placaUpper = placa.toUpperCase().trim();
    return this.mensalistas.find((m) => m.placa === placaUpper) || null;
  }

  async salvar(mensalista) {
    this.mensalistas.push(mensalista);
    return mensalista;
  }

  async atualizar(id, dados) {
    const mensalista = await this.buscarPorId(id);
    if (!mensalista) return null;
    mensalista.atualizar(dados);
    return mensalista;
  }
}

module.exports = { InMemoryMensalistaRepository };
