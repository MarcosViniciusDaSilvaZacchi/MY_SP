const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pagamentoController');

router.post('/pagamentos/calcular', ctrl.calcular);
router.post('/pagamentos',          ctrl.registrar);
router.get('/pagamentos',           ctrl.listar);

module.exports = router;
