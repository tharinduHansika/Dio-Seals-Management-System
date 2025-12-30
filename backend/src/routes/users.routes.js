const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/users.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

// Only Admin can manage users
router.get('/', checkRole('Admin'), UsersController.getAll);
router.get('/roles', checkRole('Admin'), UsersController.getRoles);
router.get('/:id', checkRole('Admin'), UsersController.getById);
router.post('/', checkRole('Admin'), UsersController.create);
router.put('/:id', checkRole('Admin'), UsersController.update);
router.delete('/:id', checkRole('Admin'), UsersController.delete);

module.exports = router;