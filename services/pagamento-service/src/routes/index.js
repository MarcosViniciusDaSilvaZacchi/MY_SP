const express = require('express');
const { InMemoryPagamentoRepository } = require('../repositories/PagamentoRepository');
const { TarifaEngine, TarifaPadraoStrategy } = require('../domain/strategies/TarifaStrategy');
const { PagamentoService } = require('../services/PagamentoService');
const { PagamentoController } = require('../controllers/pagamentoController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
const pagamentoRepository = new InMemoryPagamentoRepository();
const tarifaEngine = new TarifaEngine(new TarifaPadraoStrategy());
const pagamentoService = new PagamentoService(pagamentoRepository, tarifaEngine);
const pagamentoController = new PagamentoController(pagamentoService);

router.post('/pagamentos/calcular',                     pagamentoController.calcular);
router.post('/pagamentos',                              pagamentoController.registrar);
router.get('/pagamentos',                               pagamentoController.listar);
router.get('/pagamentos/movimentacao/:movimentacaoId',  pagamentoController.buscarPorMovimentacao);
router.get('/pagamentos/:id',                           pagamentoController.buscarPorId);
router.post('/pagamentos/:id/confirmar',                pagamentoController.confirmar);

module.exports = router;
