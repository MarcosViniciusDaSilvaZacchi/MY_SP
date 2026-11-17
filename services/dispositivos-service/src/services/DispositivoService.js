// ──────────────────────────────────────────────────────────────────
// DispositivoService (Application Service / Use Case - SRP & DIP)
// C4 Nível 2: integração-dispositivos (Fase 2)
//
// Protocolo com o ESP32 (sempre iniciado pelo ESP32, via HTTP):
//   1. POST /dispositivos/:id/sync    a cada ~500 ms: envia o estado
//      (cancela + distância de cada sensor) e recebe o próximo comando.
//   2. POST /dispositivos/:id/eventos quando algo muda: carro chegou ou
//      saiu da frente do sensor, cancela abriu/fechou, comando recusado.
//
// Do lado do sistema, o estacionamento-service (ou o operador, pela tela
// Automação) cria comandos com POST /dispositivos/comandos.
// ──────────────────────────────────────────────────────────────────

const { Dispositivo } = require('../domain/entities/Dispositivo');
const { Comando } = require('../domain/entities/Comando');
const { EventoDispositivo } = require('../domain/entities/EventoDispositivo');
const {
  AcaoComando, EstadoCancela, StatusComando, TipoEvento, EVENTOS_DO_DISPOSITIVO,
} = require('../domain/enums/DispositivoEnums');

const ID_VALIDO = /^[A-Za-z0-9_-]{1,40}$/;

function erro(mensagem, statusCode) {
  const err = new Error(mensagem);
  err.statusCode = statusCode;
  return err;
}

class DispositivoService {
  /**
   * @param {{
   *   dispositivoRepository: import('../repositories/Repositorios').IDispositivoRepository,
   *   comandoRepository: import('../repositories/Repositorios').IComandoRepository,
   *   eventoRepository: import('../repositories/Repositorios').IEventoRepository,
   *   relogio?: () => number,
   *   config?: { dispositivoPadrao?: string, ttlComandoMs?: number, reenvioMs?: number, onlineMs?: number }
   * }} deps
   */
  constructor({ dispositivoRepository, comandoRepository, eventoRepository, relogio = () => Date.now(), config = {} }) {
    this.dispositivos = dispositivoRepository;
    this.comandos = comandoRepository;
    this.eventos = eventoRepository;
    this.relogio = relogio;
    this.config = {
      dispositivoPadrao: config.dispositivoPadrao || process.env.DISPOSITIVO_PADRAO || 'esp32-cancela-01',
      ttlComandoMs: config.ttlComandoMs ?? 30000, // comando não executado em 30 s é descartado
      reenvioMs: config.reenvioMs ?? 3000, // entregue e sem confirmação em 3 s: entrega de novo
      onlineMs: config.onlineMs ?? 5000, // sem sync há mais de 5 s: dispositivo offline
    };
  }

  _validarId(id) {
    if (!ID_VALIDO.test(String(id || ''))) {
      throw erro('Id de dispositivo inválido (use letras, números, "-" ou "_", até 40 caracteres).', 400);
    }
    return String(id);
  }

  async _obterOuCriar(id) {
    return (await this.dispositivos.buscarPorId(id)) || new Dispositivo({ id });
  }

  async _registrar(dados) {
    const evento = new EventoDispositivo(dados, this.relogio());
    evento.validar();
    await this.eventos.salvar(evento);
    return evento;
  }

  async _expirarComandos(dispositivoId) {
    const agora = this.relogio();
    for (const c of await this.comandos.listarPorDispositivo(dispositivoId)) {
      if (!c.finalizado && c.idadeMs(agora) > this.config.ttlComandoMs) {
        c.concluir(StatusComando.EXPIRADO, agora, 'Não executado a tempo (dispositivo offline?)');
        await this.comandos.salvar(c);
        await this._registrar({ dispositivoId, tipo: TipoEvento.COMANDO_EXPIRADO, sentido: c.sentido, comandoId: c.id });
      }
    }
  }

  /** Chamado pelo ESP32 a cada ~500 ms: atualiza o estado e devolve o próximo comando (ou null). */
  async sincronizar(id, relatorio = {}) {
    const dispositivoId = this._validarId(id);
    const agora = this.relogio();
    const dispositivo = await this._obterOuCriar(dispositivoId);
    const estavaOnline = dispositivo.estaOnline(agora, this.config.onlineMs);

    dispositivo.registrarContato(relatorio, agora);
    await this.dispositivos.salvar(dispositivo);
    if (!estavaOnline) {
      await this._registrar({ dispositivoId, tipo: TipoEvento.DISPOSITIVO_ONLINE, detalhe: relatorio.ip ? `IP ${relatorio.ip}` : null });
    }

    await this._expirarComandos(dispositivoId);

    // Entrega um comando por vez, do mais antigo para o mais novo
    const proximo = (await this.comandos.listarPorDispositivo(dispositivoId))
      .filter((c) => !c.finalizado && c.podeEntregar(agora, this.config.reenvioMs))
      .sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm))[0];

    if (proximo) {
      proximo.marcarEnviado(agora);
      await this.comandos.salvar(proximo);
    }

    return {
      comando: proximo ? proximo.paraDispositivo() : null,
      servidorEm: new Date(agora).toISOString(),
    };
  }

  /** Eventos que o ESP32 envia quando algo muda (sensor ou cancela). */
  async registrarEvento(id, dados = {}) {
    const dispositivoId = this._validarId(id);
    const tipo = String(dados.tipo || '').toUpperCase().trim();
    if (!EVENTOS_DO_DISPOSITIVO.includes(tipo)) {
      throw erro(`Tipo de evento inválido: "${dados.tipo || ''}". Use ${EVENTOS_DO_DISPOSITIVO.join(', ')}.`, 400);
    }

    const ehSensor = tipo === TipoEvento.VEICULO_DETECTADO || tipo === TipoEvento.VEICULO_SAIU;
    if (ehSensor && !dados.sentido) throw erro('Informe o sentido (ENTRADA ou SAIDA) do sensor.', 400);

    let evento;
    try {
      evento = await this._registrar({ ...dados, dispositivoId, tipo });
    } catch (e) {
      throw erro(e.message, 400);
    }

    const agora = this.relogio();
    const dispositivo = await this._obterOuCriar(dispositivoId);
    dispositivo.registrarContato({}, agora);

    if (ehSensor) {
      dispositivo.marcarPresenca(evento.sentido, tipo === TipoEvento.VEICULO_DETECTADO, agora);
      if (evento.distanciaCm !== null) dispositivo.sensores[evento.sentido].distanciaCm = evento.distanciaCm;
    }
    if (tipo === TipoEvento.CANCELA_ABERTA) dispositivo.cancela = EstadoCancela.ABERTA;
    if (tipo === TipoEvento.CANCELA_FECHADA) dispositivo.cancela = EstadoCancela.FECHADA;
    await this.dispositivos.salvar(dispositivo);

    if (evento.comandoId) await this._concluirComando(evento);
    return evento.toJSON();
  }

  async _concluirComando(evento) {
    const comando = await this.comandos.buscarPorId(evento.comandoId);
    if (!comando || comando.finalizado) return;
    const agora = this.relogio();
    if (evento.tipo === TipoEvento.COMANDO_RECUSADO) {
      comando.concluir(StatusComando.FALHOU, agora, evento.detalhe || 'Recusado pelo dispositivo');
    } else if (
      (evento.tipo === TipoEvento.CANCELA_ABERTA && comando.acao === AcaoComando.ABRIR)
      || (evento.tipo === TipoEvento.CANCELA_FECHADA && comando.acao === AcaoComando.FECHAR)
    ) {
      comando.concluir(StatusComando.EXECUTADO, agora);
    } else {
      return;
    }
    await this.comandos.salvar(comando);
  }

  /**
   * Cria um comando para a cancela. Usado pelo estacionamento-service depois
   * de registrar a entrada / liberar a saída, e pelo botão manual da tela.
   */
  async enviarComando({ acao, sentido, dispositivoId, origem = 'OPERADOR', movimentacaoId = null, placa = null } = {}) {
    const id = this._validarId(dispositivoId || this.config.dispositivoPadrao);
    const agora = this.relogio();
    const comando = new Comando({ dispositivoId: id, acao, sentido, origem, movimentacaoId, placa }, agora);
    try {
      comando.validar();
    } catch (e) {
      throw erro(e.message, 400);
    }

    await this._expirarComandos(id);
    const abertos = (await this.comandos.listarPorDispositivo(id)).filter((c) => !c.finalizado);

    // Mesmo pedido ainda na fila (ex.: clique duplo): reaproveita em vez de enfileirar outro
    const repetido = abertos.find((c) => c.acao === comando.acao && c.sentido === comando.sentido);
    if (repetido) return { ...repetido.toJSON(), repetido: true, dispositivoOnline: await this._online(id) };

    // Ordens opostas se anulam: a mais nova vale
    for (const c of abertos.filter((x) => x.acao !== comando.acao)) {
      c.concluir(StatusComando.FALHOU, agora, `Substituído por ${comando.acao}`);
      await this.comandos.salvar(c);
    }

    await this.comandos.salvar(comando);
    await this._registrar({
      dispositivoId: id,
      tipo: TipoEvento.COMANDO_CRIADO,
      sentido: comando.sentido,
      comandoId: comando.id,
      detalhe: [comando.acao, origem, placa].filter(Boolean).join(' • '),
    });
    return { ...comando.toJSON(), repetido: false, dispositivoOnline: await this._online(id) };
  }

  async _online(id) {
    const d = await this.dispositivos.buscarPorId(id);
    return !!d && d.estaOnline(this.relogio(), this.config.onlineMs);
  }

  async listarDispositivos() {
    const agora = this.relogio();
    const lista = await this.dispositivos.listar();
    const resultado = [];
    for (const d of lista) {
      await this._expirarComandos(d.id);
      const pendentes = (await this.comandos.listarPorDispositivo(d.id)).filter((c) => !c.finalizado);
      resultado.push({ ...d.toJSON(agora, this.config.onlineMs), comandosPendentes: pendentes.map((c) => c.toJSON()) });
    }
    return resultado;
  }

  async buscarDispositivo(id) {
    const dispositivoId = this._validarId(id);
    const lista = await this.listarDispositivos();
    const d = lista.find((x) => x.id === dispositivoId);
    if (!d) throw erro('Dispositivo ainda não se conectou ao sistema', 404);
    return d;
  }

  async listarEventos({ limite = 50, dispositivoId, tipo } = {}) {
    const n = Math.min(Math.max(parseInt(limite, 10) || 50, 1), 500);
    return (await this.eventos.listarRecentes(n, { dispositivoId, tipo })).map((e) => e.toJSON());
  }

  async listarComandos({ dispositivoId } = {}) {
    const lista = dispositivoId
      ? await this.comandos.listarPorDispositivo(dispositivoId)
      : await this.comandos.listar();
    return lista.slice().reverse().map((c) => c.toJSON());
  }
}

module.exports = { DispositivoService };
