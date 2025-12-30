const express = require('express');
const router = express.Router();
const CustomersController = require('../controllers/customers.controller');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get all customers
router.get('/', CustomersController.getAll);

// Get customer by ID
router.get('/:id', CustomersController.getById);

// Get customer statistics
router.get('/:id/statistics', CustomersController.getStatistics);

// Create customer (Marketing Manager, Director, Admin)
router.post('/', 
  checkRole('Admin', 'Director', 'Marketing Manager'),
  CustomersController.create
);

// Update customer
router.put('/:id',
  checkRole('Admin', 'Director', 'Marketing Manager'),
  CustomersController.update
);

// Delete customer (Admin, Director only)
router.delete('/:id',
  checkRole('Admin', 'Director'),
  CustomersController.delete
);

module.exports = router;