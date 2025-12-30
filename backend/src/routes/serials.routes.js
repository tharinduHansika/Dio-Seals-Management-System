const express = require('express');
const router = express.Router();
const SerialsController = require('../controllers/serials.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/search', SerialsController.search);
router.get('/order/:order_id', SerialsController.getByOrder);
router.get('/customer/:customer_id', SerialsController.getByCustomer);
router.get('/damaged', checkRole('Admin', 'Director', 'Store Keeper'), SerialsController.getDamagedSerials);
router.get('/reusable', checkRole('Admin', 'Director', 'Store Keeper'), SerialsController.getReusableSerials);

module.exports = router;