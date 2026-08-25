const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /auth/login   -> autenticar e receber JWT
router.post('/login', authController.login);

// GET  /auth/me      -> retornar dados do usuario autenticado
router.get('/me', authController.me);

module.exports = router;
