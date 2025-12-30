const db = require('../config/database');
const { successResponse, errorResponse, generateUniqueNumber } = require('../utils/helpers');
const SerialGeneratorService = require('../services/serialGenerator.service');

class InvoicesController {
  static async getAll(req, res) {
    try {
      const { status } = req.query;

      let query = `
        SELECT i.*, c.company_name, o.order_number, u.full_name as created_by_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.customer_id
        LEFT JOIN orders o ON i.order_id = o.order_id
        LEFT JOIN users u ON i.created_by = u.user_id
      `;

      const params = [];
      if (status) {
        query += ` WHERE i.invoice_status = $1`;
        params.push(status);
      }

      query += ` ORDER BY i.created_at DESC`;

      const result = await db.query(query, params);
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get invoices error:', error);
      errorResponse(res, 'Failed to fetch invoices', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const invoice = await db.query(
        `SELECT i.*, c.*, o.order_number, u.full_name as created_by_name
         FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         LEFT JOIN orders o ON i.order_id = o.order_id
         LEFT JOIN users u ON i.created_by = u.user_id
         WHERE i.invoice_id = $1`,
        [id]
      );

      if (invoice.rows.length === 0) {
        return errorResponse(res, 'Invoice not found', 404);
      }

      const items = await db.query(
        `SELECT oi.*, p.product_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_id = $1`,
        [invoice.rows[0].order_id]
      );

      successResponse(res, {
        ...invoice.rows[0],
        items: items.rows
      });
    } catch (error) {
      console.error('Get invoice error:', error);
      errorResponse(res, 'Failed to fetch invoice', 500);
    }
  }

  static async create(req, res) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { order_id, customer_id, invoice_type, due_date, tax_amount } = req.body;
      const invoice_number = generateUniqueNumber('INV');

      // Get order total
      const order = await client.query(
        'SELECT total_amount FROM orders WHERE order_id = $1',
        [order_id]
      );

      if (order.rows.length === 0) {
        throw new Error('Order not found');
      }

      const subtotal = parseFloat(order.rows[0].total_amount);
      const tax = parseFloat(tax_amount) || 0;
      const total_amount = subtotal + tax;

      const invoiceResult = await client.query(
        `INSERT INTO invoices (invoice_number, order_id, customer_id, invoice_type, due_date, 
                               subtotal, tax_amount, total_amount, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [invoice_number, order_id, customer_id, invoice_type, due_date, subtotal, tax, total_amount, req.user.user_id]
      );

      // Update order status to invoiced
      await client.query(
        `UPDATE orders SET order_status = $1 WHERE order_id = $2`,
        ['invoiced', order_id]
      );

      // Move stock from reserved to sold
      const items = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order_id]
      );

      for (const item of items.rows) {
        await client.query(
          `UPDATE stock 
           SET reserved_qty = reserved_qty - $1, sold_qty = sold_qty + $1, last_updated = NOW()
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );

        // Mark serial numbers as sold
        await client.query(
          `UPDATE serial_numbers SET status = 'sold' WHERE order_item_id = $1`,
          [item.order_item_id]
        );
      }

      await client.query('COMMIT');
      successResponse(res, invoiceResult.rows[0], 'Invoice created successfully', 201);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create invoice error:', error);
      errorResponse(res, error.message || 'Failed to create invoice', 500);
    } finally {
      client.release();
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { invoice_status } = req.body;

      const result = await db.query(
        `UPDATE invoices SET invoice_status = $1 WHERE invoice_id = $2 RETURNING *`,
        [invoice_status, id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Invoice not found', 404);
      }

      successResponse(res, result.rows[0], 'Invoice status updated');
    } catch (error) {
      console.error('Update invoice status error:', error);
      errorResponse(res, 'Failed to update invoice status', 500);
    }
  }

  static async getOverdue(req, res) {
    try {
      const result = await db.query(
        `SELECT i.*, c.company_name, o.order_number
         FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         LEFT JOIN orders o ON i.order_id = o.order_id
         WHERE i.invoice_status = 'pending' 
         AND i.due_date < CURRENT_DATE
         ORDER BY i.due_date ASC`
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get overdue invoices error:', error);
      errorResponse(res, 'Failed to fetch overdue invoices', 500);
    }
  }
}

module.exports = InvoicesController;