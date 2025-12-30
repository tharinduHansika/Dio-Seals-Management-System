const db = require('../config/database');
const { successResponse, errorResponse, generateUniqueNumber } = require('../utils/helpers');

class StockController {
  static async getAll(req, res) {
    try {
      const result = await db.query(
        `SELECT s.*, p.product_name, p.minimum_threshold
         FROM stock s
         JOIN products p ON s.product_id = p.product_id
         WHERE p.status = 'active'
         ORDER BY p.product_name`
      );
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get stock error:', error);
      errorResponse(res, 'Failed to fetch stock', 500);
    }
  }

  static async getAlerts(req, res) {
    try {
      const result = await db.query(
        `SELECT p.product_id, p.product_name, p.minimum_threshold, s.available_qty
         FROM products p
         JOIN stock s ON p.product_id = s.product_id
         WHERE s.available_qty < p.minimum_threshold AND p.status = 'active'
         ORDER BY s.available_qty ASC`
      );
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get alerts error:', error);
      errorResponse(res, 'Failed to fetch alerts', 500);
    }
  }

  static async addGRN(req, res) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { product_id, quantity, supplier_name, received_date, notes } = req.body;
      const grn_number = generateUniqueNumber('GRN');

      const grnResult = await client.query(
        `INSERT INTO grn (grn_number, product_id, quantity, supplier_name, received_date, received_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [grn_number, product_id, quantity, supplier_name, received_date || new Date(), req.user.user_id, notes]
      );

      await client.query(
        `UPDATE stock SET available_qty = available_qty + $1, grn_qty = grn_qty + $1, last_updated = NOW()
         WHERE product_id = $2`,
        [quantity, product_id]
      );

      await client.query('COMMIT');
      successResponse(res, grnResult.rows[0], 'GRN added successfully', 201);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Add GRN error:', error);
      errorResponse(res, 'Failed to add GRN', 500);
    } finally {
      client.release();
    }
  }

  static async getAllGRNs(req, res) {
    try {
      const result = await db.query(
        `SELECT g.*, p.product_name, u.full_name as received_by_name
         FROM grn g
         JOIN products p ON g.product_id = p.product_id
         LEFT JOIN users u ON g.received_by = u.user_id
         ORDER BY g.received_date DESC`
      );
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get GRNs error:', error);
      errorResponse(res, 'Failed to fetch GRNs', 500);
    }
  }

  static async recordDamage(req, res) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { product_id, order_id, quantity, reason, notes } = req.body;

      const damageResult = await client.query(
        `INSERT INTO damages (product_id, order_id, quantity, reason, recorded_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [product_id, order_id || null, quantity, reason, req.user.user_id, notes]
      );

      await client.query(
        `UPDATE stock SET available_qty = available_qty - $1, damaged_qty = damaged_qty + $1, last_updated = NOW()
         WHERE product_id = $2`,
        [quantity, product_id]
      );

      await client.query('COMMIT');
      successResponse(res, damageResult.rows[0], 'Damage recorded successfully', 201);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Record damage error:', error);
      errorResponse(res, 'Failed to record damage', 500);
    } finally {
      client.release();
    }
  }

  static async getAllDamages(req, res) {
    try {
      const result = await db.query(
        `SELECT d.*, p.product_name, u.full_name as recorded_by_name, o.order_number
         FROM damages d
         JOIN products p ON d.product_id = p.product_id
         LEFT JOIN users u ON d.recorded_by = u.user_id
         LEFT JOIN orders o ON d.order_id = o.order_id
         ORDER BY d.damage_date DESC`
      );
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get damages error:', error);
      errorResponse(res, 'Failed to fetch damages', 500);
    }
  }
}

module.exports = StockController;