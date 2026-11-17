const express = require('express');
const { SqliteMovimentacaoRepository } = require('../repositories/SqliteMovimentacaoRepository');
const { criarConexao } = require('../infra/SqliteDocumentStore');
const { MensalistaHttpClient } = require('../clients/MensalistaClient');
const { PagamentoHttpClient } = require('../clients/PagamentoClient');
const { DispositivosHttpClient } = require('../clients/DispositivosClient');
const { ValidadorPlaca } = require('../domain/services/ValidadorPlaca');
const { ResumoEstacionamentoCalculator } = require('../domain/services/ResumoEstacionamentoCalculator');
const { AvaliadorAcessoContext } = require('../domain/strategies/RegrasAcesso');
const { EstacionamentoService } = require('../services/EstacionamentoService');
const { EstacionamentoController } = require('../controllers/estacionamentoController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
// Persistência em SQLite (database_estacionamento.sqlite): os dados sobrevivem a reinícios
const movimentacaoRepository = new SqliteMovimentacaoRepository(criarConexao('database_estacionamento.sqlite'));
const mensalistaClient = new MensalistaHttpClient();
const pagamentoClient = new PagamentoHttpClient();
const resumoCalculator = new ResumoEstacionamentoCalculator(20);
const avaliadorAcesso = new AvaliadorAcessoContext();

const estacionamentoService = new EstacionamentoService(
  movimentacaoRepository,
  mensalistaClient,
  pagamentoClient,
  resumoCalculator,
  avaliadorAcesso,
  new ValidadorPlaca(),
  new DispositivosHttpClient() // Fase 2: abre a cancela do ESP32 após entrada/saída
);
const estacionamentoController = new EstacionamentoController(estacionamentoService);

router.get('/entradas',              estacionamentoController.listarEntradas);
router.post('/entradas',             estacionamentoController.registrarEntrada);
router.get('/movimentacoes/aberta',  estacionamentoController.buscarAberta);
router.get('/movimentacoes/:id',     estacionamentoController.buscarPorId);
router.post('/saidas',               estacionamentoController.registrarSaida);
router.get('/relatorios/resumo',     estacionamentoController.resumo);

router.repositorio = movimentacaoRepository; // usado nos testes para fechar a conexão

module.exports = router;
