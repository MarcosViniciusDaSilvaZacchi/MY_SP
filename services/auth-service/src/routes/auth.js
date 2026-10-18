const express = require('express');
const { InMemoryUsuarioRepository } = require('../repositories/InMemoryUsuarioRepository');
const { JwtService, BcryptPasswordHasher } = require('../security/SecurityServices');
const { AuthService } = require('../services/AuthService');
const { AuthController } = require('../controllers/authController');

const router = express.Router();

// Composition Root / Injeção de Dependências (DIP)
const usuarioRepository = new InMemoryUsuarioRepository();
const jwtService = new JwtService();
const passwordHasher = new BcryptPasswordHasher();
const authService = new AuthService(usuarioRepository, jwtService, passwordHasher);
const authController = new AuthController(authService);

// POST /auth/login   -> autenticar e receber JWT
router.post('/login', authController.login);

// GET  /auth/me      -> retornar dados do usuario autenticado
router.get('/me', authController.me);

// Gestão de usuários (Admin)
router.get('/usuarios',        authController.listarUsuarios);
router.post('/usuarios',       authController.criarUsuario);
router.delete('/usuarios/:id', authController.removerUsuario);

module.exports = router;
