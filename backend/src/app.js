const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/stock', require('./routes/stock.routes'));
app.use('/api/quotations', require('./routes/quotations.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/serials', require('./routes/serials.routes'));
app.use('/api/printing', require('./routes/printing.routes'));
app.use('/api/invoices', require('./routes/invoices.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));
app.use('/api/assets', require('./routes/assets.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Dio Seals API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      customers: '/api/customers',
      products: '/api/products',
      stock: '/api/stock',
      quotations: '/api/quotations',
      orders: '/api/orders',
      serials: '/api/serials',
      printing: '/api/printing',
      invoices: '/api/invoices',
      payments: '/api/payments',
      expenses: '/api/expenses',
      assets: '/api/assets',
      dashboard: '/api/dashboard',
      reports: '/api/reports'
    }
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;