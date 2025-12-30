const express = require('express');
const router = express.Router();
const PaymentsController = require('../controllers/payments.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', PaymentsController.getAll);
router.get('/overdue', PaymentsController.getOverdue);
router.get('/invoice/:invoice_id', PaymentsController.getByInvoice);
router.get('/:id', PaymentsController.getById);
router.post('/', 
  checkRole('Admin', 'Director', 'Cashier'), 
  PaymentsController.create
);

module.exports = router;