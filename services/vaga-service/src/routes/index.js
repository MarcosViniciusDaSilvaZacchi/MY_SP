const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vagaController');

router.get('/vagas',                  ctrl.listar);
router.get('/vagas/disponibilidade',  ctrl.disponibilidade);
router.patch('/vagas/:id/status',     ctrl.atualizarStatus);

module.exports = router;
