const db = require('../config/database');
const { successResponse, errorResponse, generateUniqueNumber } = require('../utils/helpers');

class ReceiptsController {
  static async getAll(req, res) {
    try {
      const result = await db.query(
        `SELECT r.*, p.payment_number, p.amount, i.invoice_number, 
                c.company_name, u.full_name as issued_by_name
         FROM receipts r
         LEFT JOIN payments p ON r.payment_id = p.payment_id
         LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         LEFT JOIN users u ON r.issued_by = u.user_id
         ORDER BY r.created_at DESC`
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get receipts error:', error);
      errorResponse(res, 'Failed to fetch receipts', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT r.*, p.payment_number, p.amount, p.payment_method, p.payment_date,
                i.invoice_number, i.total_amount as invoice_total,
                c.company_name, c.address, c.phone, c.email,
                o.order_number,
                u.full_name as issued_by_name
         FROM receipts r
         LEFT JOIN payments p ON r.payment_id = p.payment_id
         LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         LEFT JOIN orders o ON i.order_id = o.order_id
         LEFT JOIN users u ON r.issued_by = u.user_id
         WHERE r.receipt_id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Receipt not found', 404);
      }

      successResponse(res, result.rows[0]);
    } catch (error) {
      console.error('Get receipt error:', error);
      errorResponse(res, 'Failed to fetch receipt', 500);
    }
  }

  static async create(req, res) {
    try {
      const { payment_id } = req.body;

      // Get payment details
      const payment = await db.query(
        `SELECT p.*, i.invoice_number, c.company_name
         FROM payments p
         LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         WHERE p.payment_id = $1`,
        [payment_id]
      );

      if (payment.rows.length === 0) {
        return errorResponse(res, 'Payment not found', 404);
      }

      // Generate receipt number
      const receipt_number = generateUniqueNumber('REC');

      const result = await db.query(
        `INSERT INTO receipts (receipt_number, payment_id, amount, issued_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [receipt_number, payment_id, payment.rows[0].amount, req.user.user_id]
      );

      successResponse(res, result.rows[0], 'Receipt generated successfully', 201);
    } catch (error) {
      console.error('Create receipt error:', error);
      errorResponse(res, 'Failed to generate receipt', 500);
    }
  }

  static async getByPayment(req, res) {
    try {
      const { payment_id } = req.params;

      const result = await db.query(
        `SELECT r.*, u.full_name as issued_by_name
         FROM receipts r
         LEFT JOIN users u ON r.issued_by = u.user_id
         WHERE r.payment_id = $1`,
        [payment_id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Receipt not found', 404);
      }

      successResponse(res, result.rows[0]);
    } catch (error) {
      console.error('Get receipt by payment error:', error);
      errorResponse(res, 'Failed to fetch receipt', 500);
    }
  }

  static async downloadPDF(req, res) {
    try {
      const { id } = req.params;
      const PDFGenerator = require('../services/pdfGenerator.service');

      const receipt = await db.query(
        `SELECT r.*, p.payment_number, p.amount, p.payment_method, p.payment_date,
                i.invoice_number, c.company_name, c.address, c.phone,
                o.order_number, u.full_name as issued_by_name
         FROM receipts r
         LEFT JOIN payments p ON r.payment_id = p.payment_id
         LEFT JOIN invoices i ON p.invoice_id = i.invoice_id
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         LEFT JOIN orders o ON i.order_id = o.order_id
         LEFT JOIN users u ON r.issued_by = u.user_id
         WHERE r.receipt_id = $1`,
        [id]
      );

      if (receipt.rows.length === 0) {
        return errorResponse(res, 'Receipt not found', 404);
      }

      const pdfBuffer = await PDFGenerator.generateReceipt(receipt.rows[0]);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${receipt.rows[0].receipt_number}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Download receipt PDF error:', error);
      errorResponse(res, 'Failed to generate PDF', 500);
    }
  }
}

module.exports = ReceiptsController;