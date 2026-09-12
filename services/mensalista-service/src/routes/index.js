const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mensalistaController');

router.get('/mensalistas',              ctrl.listar);
router.post('/mensalistas',             ctrl.cadastrar);
router.get('/mensalistas/placa/:placa', ctrl.buscarPorPlaca);
router.patch('/mensalistas/:id',        ctrl.atualizar);

module.exports = router;
