const express = require('express');
const router = express.Router();
const ReceiptsController = require('../controllers/receipts.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', ReceiptsController.getAll);
router.get('/:id', ReceiptsController.getById);
router.get('/:id/download', ReceiptsController.downloadPDF);
router.get('/payment/:payment_id', ReceiptsController.getByPayment);
router.post('/', 
  checkRole('Admin', 'Director', 'Cashier'), 
  ReceiptsController.create
);

module.exports = router;