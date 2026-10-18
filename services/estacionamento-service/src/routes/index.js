const express = require('express');
const { InMemoryMovimentacaoRepository } = require('../repositories/InMemoryMovimentacaoRepository');
const { MensalistaHttpClient } = require('../clients/MensalistaClient');
const { PagamentoHttpClient } = require('../clients/PagamentoClient');
const { EstacionamentoService } = require('../services/EstacionamentoService');
const { EstacionamentoController } = require('../controllers/estacionamentoController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
const movimentacaoRepository = new InMemoryMovimentacaoRepository();
const mensalistaClient = new MensalistaHttpClient();
const pagamentoClient = new PagamentoHttpClient();
const estacionamentoService = new EstacionamentoService(movimentacaoRepository, mensalistaClient, pagamentoClient);
const estacionamentoController = new EstacionamentoController(estacionamentoService);

router.get('/entradas',              estacionamentoController.listarEntradas);
router.post('/entradas',             estacionamentoController.registrarEntrada);
router.get('/movimentacoes/aberta',  estacionamentoController.buscarAberta);
router.post('/saidas',               estacionamentoController.registrarSaida);
router.get('/relatorios/resumo',     estacionamentoController.resumo);

module.exports = router;
