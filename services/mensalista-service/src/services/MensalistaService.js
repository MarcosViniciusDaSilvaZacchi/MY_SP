// ──────────────────────────────────────────────────────────────────
// MensalistaService (Application Service / Use Case - SRP & DIP)
// Orquestra as regras de negócio de mensalistas
// ──────────────────────────────────────────────────────────────────

const { Mensalista } = require('../domain/entities/Mensalista');
const { StatusMensalista } = require('../domain/enums/StatusMensalista');

class MensalistaService {
  /**
   * @param {import('../repositories/IMensalistaRepository').IMensalistaRepository} mensalistaRepository
   */
  constructor(mensalistaRepository) {
    this.mensalistaRepository = mensalistaRepository;
  }

  async listar(filtroPlaca) {
    const lista = await this.mensalistaRepository.listar(filtroPlaca);
    return lista.map((m) => (typeof m.toJSON === 'function' ? m.toJSON() : m));
  }

  async buscarPorPlaca(placa) {
    if (!placa) {
      const err = new Error('Placa é obrigatória');
      err.statusCode = 400;
      throw err;
    }

    const mensalista = await this.mensalistaRepository.buscarPorPlaca(placa);
    if (!mensalista) {
      const err = new Error('Mensalista nao encontrado para essa placa');
      err.statusCode = 404;
      throw err;
    }

    return mensalista.toJSON();
  }

  async cadastrar({ nome, cpf, email, placa, vencimento, planoMensal }) {
    if (!nome || !cpf || !placa || !vencimento) {
      const err = new Error('nome, cpf, placa e vencimento sao obrigatorios');
      err.statusCode = 400;
      throw err;
    }

    const existe = await this.mensalistaRepository.buscarPorPlaca(placa);
    if (existe) {
      const err = new Error('Ja existe mensalista com essa placa');
      err.statusCode = 409;
      throw err;
    }

    const novoMensalista = new Mensalista({
      id: String(Date.now()),
      nome,
      cpf,
      email: email || '',
      placa,
      vencimento,
      status: StatusMensalista.EM_DIA,
      planoMensal: planoMensal || 150.00,
    });

    novoMensalista.validar();
    await this.mensalistaRepository.salvar(novoMensalista);

    return novoMensalista.toJSON();
  }

  async atualizar(id, dados) {
    const mensalista = await this.mensalistaRepository.buscarPorId(id);
    if (!mensalista) {
      const err = new Error('Mensalista nao encontrado');
      err.statusCode = 404;
      throw err;
    }

    // Se estiver alterando a placa, verificar se outra pessoa já possui a nova placa
    if (dados.placa && dados.placa.toUpperCase().trim() !== mensalista.placa) {
      const conflito = await this.mensalistaRepository.buscarPorPlaca(dados.placa);
      if (conflito && conflito.id !== String(id)) {
        const err = new Error('Ja existe outro mensalista cadastrado com essa nova placa');
        err.statusCode = 409;
        throw err;
      }
    }

    const atualizado = await this.mensalistaRepository.atualizar(id, dados);
    return atualizado.toJSON();
  }
}

module.exports = { MensalistaService };
