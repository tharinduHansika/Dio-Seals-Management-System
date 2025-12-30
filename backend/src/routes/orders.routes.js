const express = require('express');
const router = express.Router();
const OrdersController = require('../controllers/orders.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', OrdersController.getAll);
router.get('/:id', OrdersController.getById);
router.post('/', 
  checkRole('Admin', 'Director', 'Marketing Manager'), 
  OrdersController.create
);
router.post('/:id/cancel', 
  checkRole('Admin', 'Director', 'Marketing Manager'), 
  OrdersController.cancel
);
router.patch('/:id/status', 
  checkRole('Admin', 'Director'), 
  OrdersController.updateStatus
);

module.exports = router;