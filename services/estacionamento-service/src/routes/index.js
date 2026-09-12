const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/estacionamentoController');

router.get('/entradas',              ctrl.listarEntradas);
router.post('/entradas',             ctrl.registrarEntrada);
router.get('/movimentacoes/aberta',  ctrl.buscarAberta);
router.post('/saidas',               ctrl.registrarSaida);
router.get('/relatorios/resumo',     ctrl.resumo);

module.exports = router;
