const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

class ReportsController {
  // Sales Report
  static async salesReport(req, res) {
    try {
      const { start_date, end_date, customer_id } = req.query;

      let query = `
        SELECT 
          o.order_id,
          o.order_number,
          o.order_date,
          c.company_name,
          o.total_amount,
          o.order_status,
          o.payment_status,
          u.full_name as created_by
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN users u ON o.created_by = u.user_id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      if (start_date) {
        query += ` AND o.order_date >= ${paramCount}`;
        params.push(start_date);
        paramCount++;
      }

      if (end_date) {
        query += ` AND o.order_date <= ${paramCount}`;
        params.push(end_date);
        paramCount++;
      }

      if (customer_id) {
        query += ` AND o.customer_id = ${paramCount}`;
        params.push(customer_id);
        paramCount++;
      }

      query += ' ORDER BY o.order_date DESC';

      const result = await db.query(query, params);

      // Calculate summary
      const summary = await db.query(
        `SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_sales,
          COALESCE(AVG(total_amount), 0) as average_order_value
         FROM orders o
         WHERE 1=1
         ${start_date ? `AND o.order_date >= $1` : ''}
         ${end_date ? `AND o.order_date <= ${start_date ? 2 : 1}` : ''}`,
        params.filter((_, i) => i < 2)
      );

      successResponse(res, {
        orders: result.rows,
        summary: summary.rows[0]
      });
    } catch (error) {
      console.error('Sales report error:', error);
      errorResponse(res, 'Failed to generate sales report', 500);
    }
  }

  // Stock Report
  static async stockReport(req, res) {
    try {
      const { category, low_stock_only } = req.query;

      let query = `
        SELECT 
          p.product_id,
          p.product_name,
          p.category,
          p.unit_price,
          p.minimum_threshold,
          s.available_qty,
          s.reserved_qty,
          s.sold_qty,
          s.damaged_qty,
          s.sample_qty,
          s.grn_qty,
          (s.available_qty + s.reserved_qty) as total_stock,
          (s.available_qty * p.unit_price) as stock_value
        FROM products p
        LEFT JOIN stock s ON p.product_id = s.product_id
        WHERE p.status = 'active'
      `;

      const params = [];
      let paramCount = 1;

      if (category) {
        query += ` AND p.category = ${paramCount}`;
        params.push(category);
        paramCount++;
      }

      if (low_stock_only === 'true') {
        query += ` AND s.available_qty < p.minimum_threshold`;
      }

      query += ' ORDER BY p.product_name';

      const result = await db.query(query, params);

      // Calculate summary
      const summary = await db.query(
        `SELECT 
          COUNT(*) as total_products,
          COALESCE(SUM(s.available_qty), 0) as total_available,
          COALESCE(SUM(s.reserved_qty), 0) as total_reserved,
          COALESCE(SUM(s.sold_qty), 0) as total_sold,
          COALESCE(SUM(s.available_qty * p.unit_price), 0) as total_stock_value
         FROM products p
         LEFT JOIN stock s ON p.product_id = s.product_id
         WHERE p.status = 'active'`
      );

      successResponse(res, {
        products: result.rows,
        summary: summary.rows[0]
      });
    } catch (error) {
      console.error('Stock report error:', error);
      errorResponse(res, 'Failed to generate stock report', 500);
    }
  }

  // Payment Report
  static async paymentReport(req, res) {
    try {
      const { start_date, end_date, status } = req.query;

      let query = `
        SELECT 
          p.payment_id,
          p.payment_number,
          p.payment_date,
          p.amount,
          p.payment_method,
          i.invoice_number,
          c.company_name,
          o.order_number,
          u.full_name as received_by
        FROM payments p
        LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
        LEFT JOIN orders o ON p.order_id = o.order_id
        LEFT JOIN customers c ON i.customer_id = c.customer_id
        LEFT JOIN users u ON p.received_by = u.user_id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      if (start_date) {
        query += ` AND p.payment_date >= ${paramCount}`;
        params.push(start_date);
        paramCount++;
      }

      if (end_date) {
        query += ` AND p.payment_date <= ${paramCount}`;
        params.push(end_date);
        paramCount++;
      }

      query += ' ORDER BY p.payment_date DESC';

      const result = await db.query(query, params);

      // Calculate summary
      const summary = await db.query(
        `SELECT 
          COUNT(*) as total_payments,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_payments,
          COUNT(CASE WHEN payment_method = 'bank_transfer' THEN 1 END) as bank_payments,
          COUNT(CASE WHEN payment_method = 'cheque' THEN 1 END) as cheque_payments
         FROM payments p
         WHERE 1=1
         ${start_date ? `AND p.payment_date >= $1` : ''}
         ${end_date ? `AND p.payment_date <= ${start_date ? 2 : 1}` : ''}`,
        params.filter((_, i) => i < 2)
      );

      successResponse(res, {
        payments: result.rows,
        summary: summary.rows[0]
      });
    } catch (error) {
      console.error('Payment report error:', error);
      errorResponse(res, 'Failed to generate payment report', 500);
    }
  }

  // Financial Report
  static async financialReport(req, res) {
    try {
      const { start_date, end_date } = req.query;

      // Revenue from completed orders
      const revenueResult = await db.query(
        `SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue
         FROM orders
         WHERE order_status = 'completed'
         ${start_date ? `AND order_date >= $1` : ''}
         ${end_date ? `AND order_date <= ${start_date ? 2 : 1}` : ''}`,
        [start_date, end_date].filter(Boolean)
      );

      // Expenses
      const expensesResult = await db.query(
        `SELECT 
          category,
          COALESCE(SUM(amount), 0) as total_amount
         FROM expenses
         WHERE 1=1
         ${start_date ? `AND expense_date >= $1` : ''}
         ${end_date ? `AND expense_date <= ${start_date ? 2 : 1}` : ''}
         GROUP BY category`,
        [start_date, end_date].filter(Boolean)
      );

      const totalExpenses = expensesResult.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

      // Pending invoices
      const pendingResult = await db.query(
        `SELECT 
          COUNT(*) as pending_count,
          COALESCE(SUM(total_amount), 0) as pending_amount
         FROM invoices
         WHERE invoice_status = 'pending'`
      );

      // Overdue invoices
      const overdueResult = await db.query(
        `SELECT 
          COUNT(*) as overdue_count,
          COALESCE(SUM(total_amount), 0) as overdue_amount
         FROM invoices
         WHERE invoice_status = 'pending' AND due_date < CURRENT_DATE`
      );

      const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);
      const netProfit = totalRevenue - totalExpenses;

      successResponse(res, {
        revenue: {
          total: totalRevenue
        },
        expenses: {
          total: totalExpenses,
          by_category: expensesResult.rows
        },
        profit: {
          net: netProfit,
          margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
        },
        receivables: {
          pending: {
            count: parseInt(pendingResult.rows[0].pending_count),
            amount: parseFloat(pendingResult.rows[0].pending_amount)
          },
          overdue: {
            count: parseInt(overdueResult.rows[0].overdue_count),
            amount: parseFloat(overdueResult.rows[0].overdue_amount)
          }
        }
      });
    } catch (error) {
      console.error('Financial report error:', error);
      errorResponse(res, 'Failed to generate financial report', 500);
    }
  }

  // Customer Report
  static async customerReport(req, res) {
    try {
      const result = await db.query(
        `SELECT 
          c.customer_id,
          c.company_name,
          c.email,
          c.phone,
          c.city,
          COUNT(DISTINCT o.order_id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_spent,
          COALESCE(AVG(o.total_amount), 0) as avg_order_value,
          MAX(o.order_date) as last_order_date,
          COUNT(CASE WHEN o.payment_status = 'pending' THEN 1 END) as pending_payments
         FROM customers c
         LEFT JOIN orders o ON c.customer_id = o.customer_id
         WHERE c.status = 'active'
         GROUP BY c.customer_id, c.company_name, c.email, c.phone, c.city
         ORDER BY total_spent DESC`
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Customer report error:', error);
      errorResponse(res, 'Failed to generate customer report', 500);
    }
  }

  // Production Report
  static async productionReport(req, res) {
    try {
      const { start_date, end_date } = req.query;

      let query = `
        SELECT 
          pj.job_id,
          pj.job_number,
          pj.job_status,
          o.order_number,
          c.company_name,
          pj.started_date,
          pj.completed_date,
          CASE 
            WHEN pj.completed_date IS NOT NULL AND pj.started_date IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (pj.completed_date - pj.started_date))/3600
            ELSE NULL
          END as processing_hours,
          u.full_name as assigned_to
        FROM printing_jobs pj
        LEFT JOIN orders o ON pj.order_id = o.order_id
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN users u ON pj.assigned_to = u.user_id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      if (start_date) {
        query += ` AND pj.created_at >= ${paramCount}`;
        params.push(start_date);
        paramCount++;
      }

      if (end_date) {
        query += ` AND pj.created_at <= ${paramCount}`;
        params.push(end_date);
        paramCount++;
      }

      query += ' ORDER BY pj.created_at DESC';

      const result = await db.query(query, params);

      // Calculate summary
      const summary = await db.query(
        `SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN job_status = 'completed' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN job_status = 'in_progress' THEN 1 END) as in_progress_jobs,
          COUNT(CASE WHEN job_status = 'new' THEN 1 END) as pending_jobs,
          AVG(CASE 
            WHEN completed_date IS NOT NULL AND started_date IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (completed_date - started_date))/3600
            ELSE NULL
          END) as avg_processing_hours
         FROM printing_jobs pj
         WHERE 1=1
         ${start_date ? `AND pj.created_at >= $1` : ''}
         ${end_date ? `AND pj.created_at <= ${start_date ? 2 : 1}` : ''}`,
        params
      );

      successResponse(res, {
        jobs: result.rows,
        summary: summary.rows[0]
      });
    } catch (error) {
      console.error('Production report error:', error);
      errorResponse(res, 'Failed to generate production report', 500);
    }
  }
}

module.exports = ReportsController;