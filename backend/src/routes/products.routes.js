const express = require('express');
const router = express.Router();
const ProductsController = require('../controllers/products.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', ProductsController.getAll);
router.get('/:id', ProductsController.getById);
router.post('/', checkRole('Admin', 'Store Keeper'), ProductsController.create);
router.put('/:id', checkRole('Admin', 'Store Keeper'), ProductsController.update);
router.delete('/:id', checkRole('Admin'), ProductsController.delete);

module.exports = router;