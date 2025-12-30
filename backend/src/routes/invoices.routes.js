const express = require('express');
const router = express.Router();
const InvoicesController = require('../controllers/invoices.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', InvoicesController.getAll);
router.get('/overdue', InvoicesController.getOverdue);
router.get('/:id', InvoicesController.getById);
router.post('/', 
  checkRole('Admin', 'Director', 'Marketing Manager'), 
  InvoicesController.create
);
router.patch('/:id/status', 
  checkRole('Admin', 'Director', 'Cashier'), 
  InvoicesController.updateStatus
);

module.exports = router;