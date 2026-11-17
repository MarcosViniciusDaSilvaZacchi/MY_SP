const express = require('express');
const { SqlitePagamentoRepository } = require('../repositories/SqlitePagamentoRepository');
const { criarConexao } = require('../infra/SqliteDocumentStore');
const { EstacionamentoHttpClient } = require('../clients/EstacionamentoClient');
const { TarifaEngine, TarifaPorPorteStrategy } = require('../domain/strategies/TarifaStrategy');
const { PagamentoService } = require('../services/PagamentoService');
const { PagamentoController } = require('../controllers/pagamentoController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
// Persistência em SQLite (database_pagamento.sqlite): o histórico financeiro sobrevive a reinícios
const pagamentoRepository = new SqlitePagamentoRepository(criarConexao('database_pagamento.sqlite'));
// Tarifa oficial: R$ 10,00 na 1ª hora + R$ 5,00 por hora ou fração, moto paga metade
const tarifaEngine = new TarifaEngine(new TarifaPorPorteStrategy());
// O valor devido é calculado com a movimentação guardada no estacionamento-service
const estacionamentoClient = new EstacionamentoHttpClient();
const pagamentoService = new PagamentoService(pagamentoRepository, tarifaEngine, estacionamentoClient);
const pagamentoController = new PagamentoController(pagamentoService);

router.post('/pagamentos/calcular',                     pagamentoController.calcular);
router.post('/pagamentos',                              pagamentoController.registrar);
router.get('/pagamentos',                               pagamentoController.listar);
router.get('/pagamentos/movimentacao/:movimentacaoId',  pagamentoController.buscarPorMovimentacao);
router.get('/pagamentos/:id',                           pagamentoController.buscarPorId);
router.post('/pagamentos/:id/confirmar',                pagamentoController.confirmar);

router.repositorio = pagamentoRepository; // usado nos testes para fechar a conexão

module.exports = router;
