const db = require('../config/database');
const { successResponse, errorResponse, generateUniqueNumber } = require('../utils/helpers');

class PaymentsController {
  static async getAll(req, res) {
    try {
      const result = await db.query(
        `SELECT p.*, i.invoice_number, c.company_name, u.full_name as received_by_name
         FROM payments p
         LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         LEFT JOIN users u ON p.received_by = u.user_id
         ORDER BY p.created_at DESC`
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get payments error:', error);
      errorResponse(res, 'Failed to fetch payments', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT p.*, i.invoice_number, i.total_amount as invoice_total, 
                c.company_name, u.full_name as received_by_name
         FROM payments p
         LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         LEFT JOIN users u ON p.received_by = u.user_id
         WHERE p.payment_id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Payment not found', 404);
      }

      successResponse(res, result.rows[0]);
    } catch (error) {
      console.error('Get payment error:', error);
      errorResponse(res, 'Failed to fetch payment', 500);
    }
  }

  static async create(req, res) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { invoice_id, order_id, amount, payment_method, reference_no, notes } = req.body;
      const payment_number = generateUniqueNumber('PAY');

      // Create payment
      const paymentResult = await client.query(
        `INSERT INTO payments (payment_number, invoice_id, order_id, amount, payment_method, 
                               reference_no, received_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [payment_number, invoice_id, order_id, amount, payment_method, reference_no, req.user.user_id, notes]
      );

      // Get invoice details
      const invoice = await client.query(
        'SELECT total_amount FROM invoices WHERE invoice_id = $1',
        [invoice_id]
      );

      // Calculate total paid
      const totalPaid = await client.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = $1',
        [invoice_id]
      );

      const invoiceTotal = parseFloat(invoice.rows[0].total_amount);
      const paidAmount = parseFloat(totalPaid.rows[0].total);

      // Update invoice status
      let invoiceStatus = 'pending';
      let orderPaymentStatus = 'pending';

      if (paidAmount >= invoiceTotal) {
        invoiceStatus = 'paid';
        orderPaymentStatus = 'paid';
      } else if (paidAmount > 0) {
        orderPaymentStatus = 'partial';
      }

      await client.query(
        `UPDATE invoices SET invoice_status = $1 WHERE invoice_id = $2`,
        [invoiceStatus, invoice_id]
      );

      await client.query(
        `UPDATE orders SET payment_status = $1 WHERE order_id = $2`,
        [orderPaymentStatus, order_id]
      );

      // If fully paid, mark order as completed
      if (orderPaymentStatus === 'paid') {
        await client.query(
          `UPDATE orders SET order_status = $1 WHERE order_id = $2`,
          ['completed', order_id]
        );
      }

      await client.query('COMMIT');
      successResponse(res, paymentResult.rows[0], 'Payment recorded successfully', 201);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create payment error:', error);
      errorResponse(res, 'Failed to record payment', 500);
    } finally {
      client.release();
    }
  }

  static async getByInvoice(req, res) {
    try {
      const { invoice_id } = req.params;

      const result = await db.query(
        `SELECT p.*, u.full_name as received_by_name
         FROM payments p
         LEFT JOIN users u ON p.received_by = u.user_id
         WHERE p.invoice_id = $1
         ORDER BY p.payment_date DESC`,
        [invoice_id]
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get payments by invoice error:', error);
      errorResponse(res, 'Failed to fetch payments', 500);
    }
  }

  static async getOverdue(req, res) {
    try {
      const result = await db.query(
        `SELECT DISTINCT i.invoice_id, i.invoice_number, i.total_amount, i.due_date,
                c.company_name, o.order_number,
                COALESCE(SUM(p.amount), 0) as paid_amount,
                i.total_amount - COALESCE(SUM(p.amount), 0) as outstanding
         FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         LEFT JOIN orders o ON i.order_id = o.order_id
         LEFT JOIN payments p ON i.invoice_id = p.invoice_id
         WHERE i.invoice_status != 'paid' AND i.due_date < CURRENT_DATE
         GROUP BY i.invoice_id, i.invoice_number, i.total_amount, i.due_date, 
                  c.company_name, o.order_number
         ORDER BY i.due_date ASC`
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get overdue payments error:', error);
      errorResponse(res, 'Failed to fetch overdue payments', 500);
    }
  }
}

module.exports = PaymentsController;