const express = require('express');
const router = express.Router();
const ExpensesController = require('../controllers/expenses.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', ExpensesController.getAll);
router.get('/summary', ExpensesController.getSummary);
router.get('/:id', ExpensesController.getById);
router.post('/', 
  checkRole('Admin', 'Director', 'Accountant'), 
  ExpensesController.create
);
router.put('/:id', 
  checkRole('Admin', 'Director', 'Accountant'), 
  ExpensesController.update
);
router.delete('/:id', 
  checkRole('Admin', 'Director'), 
  ExpensesController.delete
);

module.exports = router;