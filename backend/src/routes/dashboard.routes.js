const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/stats', DashboardController.getStats);
router.get('/sales-chart', DashboardController.getSalesChart);
router.get('/top-customers', DashboardController.getTopCustomers);
router.get('/top-products', DashboardController.getTopProducts);
router.get('/recent-activities', DashboardController.getRecentActivities);

module.exports = router;