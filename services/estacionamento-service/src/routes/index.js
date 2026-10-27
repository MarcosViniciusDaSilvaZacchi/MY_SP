const express = require('express');
const { InMemoryMovimentacaoRepository } = require('../repositories/InMemoryMovimentacaoRepository');
const { MensalistaHttpClient } = require('../clients/MensalistaClient');
const { PagamentoHttpClient } = require('../clients/PagamentoClient');
const { ResumoEstacionamentoCalculator } = require('../domain/services/ResumoEstacionamentoCalculator');
const { AvaliadorAcessoContext } = require('../domain/strategies/RegrasAcesso');
const { EstacionamentoService } = require('../services/EstacionamentoService');
const { EstacionamentoController } = require('../controllers/estacionamentoController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
const movimentacaoRepository = new InMemoryMovimentacaoRepository();
const mensalistaClient = new MensalistaHttpClient();
const pagamentoClient = new PagamentoHttpClient();
const resumoCalculator = new ResumoEstacionamentoCalculator(20);
const avaliadorAcesso = new AvaliadorAcessoContext();

const estacionamentoService = new EstacionamentoService(
  movimentacaoRepository,
  mensalistaClient,
  pagamentoClient,
  resumoCalculator,
  avaliadorAcesso
);
const estacionamentoController = new EstacionamentoController(estacionamentoService);

router.get('/entradas',              estacionamentoController.listarEntradas);
router.post('/entradas',             estacionamentoController.registrarEntrada);
router.get('/movimentacoes/aberta',  estacionamentoController.buscarAberta);
router.post('/saidas',               estacionamentoController.registrarSaida);
router.get('/relatorios/resumo',     estacionamentoController.resumo);

module.exports = router;
