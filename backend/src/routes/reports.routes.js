const express = require('express');
const router = express.Router();
const ReportsController = require('../controllers/reports.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

// Sales reports - accessible by Director, Marketing Manager, Admin
router.get('/sales', 
  checkRole('Admin', 'Director', 'Marketing Manager'), 
  ReportsController.salesReport
);

// Stock reports - accessible by Director, Store Keeper, Admin
router.get('/stock', 
  checkRole('Admin', 'Director', 'Store Keeper'), 
  ReportsController.stockReport
);

// Payment reports - accessible by Director, Cashier, Accountant, Admin
router.get('/payments', 
  checkRole('Admin', 'Director', 'Cashier', 'Accountant'), 
  ReportsController.paymentReport
);

// Financial reports - accessible by Director, Accountant, Admin
router.get('/financial', 
  checkRole('Admin', 'Director', 'Accountant'), 
  ReportsController.financialReport
);

// Customer reports
router.get('/customers', 
  checkRole('Admin', 'Director', 'Marketing Manager'), 
  ReportsController.customerReport
);

// Production reports
router.get('/production', 
  checkRole('Admin', 'Director', 'Printing Operator'), 
  ReportsController.productionReport
);

module.exports = router;