const express = require('express');
const { SqliteVagaRepository } = require('../repositories/SqliteVagaRepository');
const { criarConexao } = require('../infra/SqliteDocumentStore');
const { DisponibilidadeCalculator } = require('../domain/services/DisponibilidadeCalculator');
const { AlocadorVagasEngine } = require('../domain/strategies/CompatibilidadeVagaStrategy');
const { VagaService } = require('../services/VagaService');
const { VagaController } = require('../controllers/vagaController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
// Persistência em SQLite (database_vaga.sqlite): os dados sobrevivem a reinícios
const vagaRepository = new SqliteVagaRepository(criarConexao('database_vaga.sqlite'));
const disponibilidadeCalculator = new DisponibilidadeCalculator();
const alocadorEngine = new AlocadorVagasEngine();

const vagaService = new VagaService(vagaRepository, disponibilidadeCalculator, alocadorEngine);
const vagaController = new VagaController(vagaService);

router.get('/vagas',                  vagaController.listar);
router.get('/vagas/disponibilidade',  vagaController.disponibilidade);
router.patch('/vagas/:id/status',     vagaController.atualizarStatus);

router.repositorio = vagaRepository; // usado nos testes para fechar a conexão

module.exports = router;
