const { body, param, query } = require('express-validator');

const validators = {
  // User validation
  createUser: [
    body('username').notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('role_id').isInt().withMessage('Role ID must be an integer'),
  ],

  // Customer validation
  createCustomer: [
    body('company_name').notEmpty().withMessage('Company name is required'),
    body('email').optional().isEmail().withMessage('Invalid email address'),
    body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Invalid phone number'),
  ],

  // Product validation
  createProduct: [
    body('product_name').notEmpty().withMessage('Product name is required'),
    body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
    body('minimum_threshold').optional().isInt({ min: 0 }).withMessage('Minimum threshold must be a positive integer'),
  ],

  // Order validation
  createOrder: [
    body('customer_id').isInt().withMessage('Customer ID must be an integer'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product_id').isInt().withMessage('Product ID must be an integer'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.serial_start').notEmpty().withMessage('Serial start is required'),
    body('items.*.serial_end').notEmpty().withMessage('Serial end is required'),
  ],

  // Payment validation
  createPayment: [
    body('invoice_id').isInt().withMessage('Invoice ID must be an integer'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('payment_method').isIn(['cash', 'bank_transfer', 'cheque', 'card']).withMessage('Invalid payment method'),
  ],

  // Expense validation
  createExpense: [
    body('category').isIn(['fuel', 'electricity', 'salary', 'purchase', 'credit', 'petty_cash', 'other']).withMessage('Invalid category'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('description').notEmpty().withMessage('Description is required'),
  ],

  // ID parameter validation
  validateId: [
    param('id').isInt().withMessage('ID must be an integer'),
  ],
};

module.exports = validators;