const db = require('../config/database');
const { successResponse, errorResponse, generateUniqueNumber } = require('../utils/helpers');

class QuotationsController {
  static async getAll(req, res) {
    try {
      const result = await db.query(
        `SELECT q.*, c.company_name, u.full_name as created_by_name
         FROM quotations q
         LEFT JOIN customers c ON q.customer_id = c.customer_id
         LEFT JOIN users u ON q.created_by = u.user_id
         ORDER BY q.created_at DESC`
      );
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get quotations error:', error);
      errorResponse(res, 'Failed to fetch quotations', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const quotation = await db.query(
        `SELECT q.*, c.company_name, u.full_name as created_by_name
         FROM quotations q
         LEFT JOIN customers c ON q.customer_id = c.customer_id
         LEFT JOIN users u ON q.created_by = u.user_id
         WHERE q.quotation_id = $1`,
        [id]
      );

      if (quotation.rows.length === 0) {
        return errorResponse(res, 'Quotation not found', 404);
      }

      const items = await db.query(
        `SELECT qi.*, p.product_name
         FROM quotation_items qi
         JOIN products p ON qi.product_id = p.product_id
         WHERE qi.quotation_id = $1`,
        [id]
      );

      successResponse(res, {
        ...quotation.rows[0],
        items: items.rows
      });
    } catch (error) {
      console.error('Get quotation error:', error);
      errorResponse(res, 'Failed to fetch quotation', 500);
    }
  }

  static async create(req, res) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { customer_id, valid_until, notes, items } = req.body;
      const quotation_number = generateUniqueNumber('QUO');

      let total_amount = 0;
      items.forEach(item => {
        total_amount += parseFloat(item.total_price);
      });

      const quotationResult = await client.query(
        `INSERT INTO quotations (quotation_number, customer_id, created_by, valid_until, total_amount, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [quotation_number, customer_id, req.user.user_id, valid_until, total_amount, notes]
      );

      const quotation_id = quotationResult.rows[0].quotation_id;

      for (const item of items) {
        await client.query(
          `INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [quotation_id, item.product_id, item.quantity, item.unit_price, item.total_price]
        );
      }

      await client.query('COMMIT');
      successResponse(res, quotationResult.rows[0], 'Quotation created successfully', 201);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create quotation error:', error);
      errorResponse(res, 'Failed to create quotation', 500);
    } finally {
      client.release();
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const result = await db.query(
        `UPDATE quotations SET status = $1, notes = $2 WHERE quotation_id = $3 RETURNING *`,
        [status, notes, id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Quotation not found', 404);
      }

      successResponse(res, result.rows[0], 'Quotation updated successfully');
    } catch (error) {
      console.error('Update quotation error:', error);
      errorResponse(res, 'Failed to update quotation', 500);
    }
  }
}

module.exports = QuotationsController;