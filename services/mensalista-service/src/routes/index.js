const express = require('express');
const { InMemoryMensalistaRepository } = require('../repositories/InMemoryMensalistaRepository');
const { MensalistaService } = require('../services/MensalistaService');
const { MensalistaController } = require('../controllers/mensalistaController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
const mensalistaRepository = new InMemoryMensalistaRepository();
const mensalistaService = new MensalistaService(mensalistaRepository);
const mensalistaController = new MensalistaController(mensalistaService);

router.get('/mensalistas',              mensalistaController.listar);
router.post('/mensalistas',             mensalistaController.cadastrar);
router.get('/mensalistas/placa/:placa', mensalistaController.buscarPorPlaca);
router.patch('/mensalistas/:id',        mensalistaController.atualizar);

module.exports = router;
