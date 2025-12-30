const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', verifyToken, AuthController.getProfile);
router.put('/profile', verifyToken, AuthController.updateProfile);
router.post('/change-password', verifyToken, AuthController.changePassword);

module.exports = router;