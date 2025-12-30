const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

class DashboardController {
  static async getStats(req, res) {
    try {
      // Total customers
      const customersResult = await db.query(
        'SELECT COUNT(*) as total FROM customers WHERE status = $1',
        ['active']
      );

      // Total products
      const productsResult = await db.query(
        'SELECT COUNT(*) as total FROM products WHERE status = $1',
        ['active']
      );

      // Total orders by status
      const ordersResult = await db.query(
        `SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN order_status = 'created' THEN 1 END) as new_orders,
          COUNT(CASE WHEN order_status = 'waiting_print' THEN 1 END) as waiting_print,
          COUNT(CASE WHEN order_status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled
         FROM orders`
      );

      // Total revenue
      const revenueResult = await db.query(
        `SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN order_status = 'completed' THEN total_amount ELSE 0 END), 0) as completed_revenue
         FROM orders`
      );

      // Pending payments
      const paymentsResult = await db.query(
        `SELECT 
          COUNT(*) as pending_invoices,
          COALESCE(SUM(total_amount), 0) as pending_amount
         FROM invoices 
         WHERE invoice_status = 'pending'`
      );

      // Overdue payments
      const overdueResult = await db.query(
        `SELECT 
          COUNT(*) as overdue_count,
          COALESCE(SUM(total_amount), 0) as overdue_amount
         FROM invoices 
         WHERE invoice_status = 'pending' AND due_date < CURRENT_DATE`
      );

      // Stock alerts
      const stockAlertsResult = await db.query(
        `SELECT COUNT(*) as low_stock_count
         FROM stock s
         JOIN products p ON s.product_id = p.product_id
         WHERE s.available_qty < p.minimum_threshold AND p.status = 'active'`
      );

      // Recent orders
      const recentOrdersResult = await db.query(
        `SELECT o.order_id, o.order_number, o.order_date, o.total_amount, 
                o.order_status, c.company_name
         FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.customer_id
         ORDER BY o.created_at DESC
         LIMIT 5`
      );

      // Active printing jobs
      const printingJobsResult = await db.query(
        `SELECT COUNT(*) as active_jobs
         FROM printing_jobs
         WHERE job_status IN ('new', 'in_progress')`
      );

      const stats = {
        customers: {
          total: parseInt(customersResult.rows[0].total)
        },
        products: {
          total: parseInt(productsResult.rows[0].total)
        },
        orders: {
          total: parseInt(ordersResult.rows[0].total_orders),
          new: parseInt(ordersResult.rows[0].new_orders),
          waiting_print: parseInt(ordersResult.rows[0].waiting_print),
          in_progress: parseInt(ordersResult.rows[0].in_progress),
          completed: parseInt(ordersResult.rows[0].completed),
          cancelled: parseInt(ordersResult.rows[0].cancelled)
        },
        revenue: {
          total: parseFloat(revenueResult.rows[0].total_revenue),
          completed: parseFloat(revenueResult.rows[0].completed_revenue)
        },
        payments: {
          pending_invoices: parseInt(paymentsResult.rows[0].pending_invoices),
          pending_amount: parseFloat(paymentsResult.rows[0].pending_amount),
          overdue_count: parseInt(overdueResult.rows[0].overdue_count),
          overdue_amount: parseFloat(overdueResult.rows[0].overdue_amount)
        },
        stock: {
          low_stock_count: parseInt(stockAlertsResult.rows[0].low_stock_count)
        },
        printing: {
          active_jobs: parseInt(printingJobsResult.rows[0].active_jobs)
        },
        recent_orders: recentOrdersResult.rows
      };

      successResponse(res, stats);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      errorResponse(res, 'Failed to fetch dashboard statistics', 500);
    }
  }

  static async getSalesChart(req, res) {
    try {
      const { period = 'month' } = req.query;

      let dateFormat;
      let groupBy;

      switch (period) {
        case 'week':
          dateFormat = 'YYYY-MM-DD';
          groupBy = 'day';
          break;
        case 'year':
          dateFormat = 'YYYY-MM';
          groupBy = 'month';
          break;
        default: // month
          dateFormat = 'YYYY-MM-DD';
          groupBy = 'day';
      }

      const result = await db.query(
        `SELECT 
          TO_CHAR(order_date, $1) as date,
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as total_sales
         FROM orders
         WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY TO_CHAR(order_date, $1)
         ORDER BY date ASC`,
        [dateFormat]
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get sales chart error:', error);
      errorResponse(res, 'Failed to fetch sales chart data', 500);
    }
  }

  static async getTopCustomers(req, res) {
    try {
      const { limit = 10 } = req.query;

      const result = await db.query(
        `SELECT 
          c.customer_id,
          c.company_name,
          COUNT(o.order_id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_spent
         FROM customers c
         LEFT JOIN orders o ON c.customer_id = o.customer_id
         WHERE c.status = 'active'
         GROUP BY c.customer_id, c.company_name
         ORDER BY total_spent DESC
         LIMIT $1`,
        [limit]
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get top customers error:', error);
      errorResponse(res, 'Failed to fetch top customers', 500);
    }
  }

  static async getTopProducts(req, res) {
    try {
      const { limit = 10 } = req.query;

      const result = await db.query(
        `SELECT 
          p.product_id,
          p.product_name,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          COALESCE(SUM(oi.total_price), 0) as total_revenue
         FROM products p
         LEFT JOIN order_items oi ON p.product_id = oi.product_id
         WHERE p.status = 'active'
         GROUP BY p.product_id, p.product_name
         ORDER BY total_sold DESC
         LIMIT $1`,
        [limit]
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get top products error:', error);
      errorResponse(res, 'Failed to fetch top products', 500);
    }
  }

  static async getRecentActivities(req, res) {
    try {
      const { limit = 20 } = req.query;

      // Get recent orders
      const orders = await db.query(
        `SELECT 'order' as type, o.order_id as id, o.order_number as reference,
                'Order created' as activity, o.created_at as timestamp,
                c.company_name as related_entity, u.full_name as user_name
         FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.customer_id
         LEFT JOIN users u ON o.created_by = u.user_id
         ORDER BY o.created_at DESC
         LIMIT $1`,
        [limit]
      );

      // Get recent payments
      const payments = await db.query(
        `SELECT 'payment' as type, p.payment_id as id, p.payment_number as reference,
                'Payment received' as activity, p.created_at as timestamp,
                i.invoice_number as related_entity, u.full_name as user_name
         FROM payments p
         LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
         LEFT JOIN users u ON p.received_by = u.user_id
         ORDER BY p.created_at DESC
         LIMIT $1`,
        [limit]
      );

      // Combine and sort
      const activities = [...orders.rows, ...payments.rows]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      successResponse(res, activities);
    } catch (error) {
      console.error('Get recent activities error:', error);
      errorResponse(res, 'Failed to fetch recent activities', 500);
    }
  }
}

module.exports = DashboardController;