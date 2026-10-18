const express = require('express');
const { InMemoryVagaRepository } = require('../repositories/InMemoryVagaRepository');
const { DisponibilidadeCalculator } = require('../domain/services/DisponibilidadeCalculator');
const { VagaService } = require('../services/VagaService');
const { VagaController } = require('../controllers/vagaController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
const vagaRepository = new InMemoryVagaRepository();
const disponibilidadeCalculator = new DisponibilidadeCalculator();
const vagaService = new VagaService(vagaRepository, disponibilidadeCalculator);
const vagaController = new VagaController(vagaService);

router.get('/vagas',                  vagaController.listar);
router.get('/vagas/disponibilidade',  vagaController.disponibilidade);
router.patch('/vagas/:id/status',     vagaController.atualizarStatus);

module.exports = router;
