const express = require('express');
const router = express.Router();
const StockController = require('../controllers/stock.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', StockController.getAll);
router.get('/alerts', StockController.getAlerts);

// GRN routes
router.post('/grn', checkRole('Admin', 'Store Keeper'), StockController.addGRN);
router.get('/grn', StockController.getAllGRNs);

// Damage routes
router.post('/damage', checkRole('Admin', 'Store Keeper'), StockController.recordDamage);
router.get('/damage', StockController.getAllDamages);

module.exports = router;