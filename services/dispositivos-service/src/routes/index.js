const express = require('express');
const { criarConexao } = require('../infra/SqliteDocumentStore');
const {
  InMemoryDispositivoRepository,
  InMemoryComandoRepository,
  SqliteEventoRepository,
} = require('../repositories/Repositorios');
const { ValidadorChaveDispositivo } = require('../security/ChaveDispositivo');
const { DispositivoService } = require('../services/DispositivoService');
const { DispositivoController } = require('../controllers/dispositivoController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
const eventoRepository = new SqliteEventoRepository(criarConexao('database_dispositivos.sqlite'));
const service = new DispositivoService({
  dispositivoRepository: new InMemoryDispositivoRepository(),
  comandoRepository: new InMemoryComandoRepository(),
  eventoRepository,
});
const controller = new DispositivoController(service);
const exigeChave = new ValidadorChaveDispositivo().middleware();

// Rotas fixas antes das rotas com :id
router.get('/dispositivos',                 controller.listarDispositivos);
router.get('/dispositivos/eventos',         controller.listarEventos);
router.get('/dispositivos/comandos',        controller.listarComandos);
router.post('/dispositivos/comandos',       controller.enviarComando);
router.get('/dispositivos/:id',             controller.buscarDispositivo);

// ESP32
router.post('/dispositivos/:id/sync',       exigeChave, controller.sincronizar);
router.post('/dispositivos/:id/eventos',    exigeChave, controller.registrarEvento);

router.repositorio = eventoRepository; // usado nos testes para fechar a conexão
router.service = service;

module.exports = router;
