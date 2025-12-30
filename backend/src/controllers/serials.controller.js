const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');
const SerialGeneratorService = require('../services/serialGenerator.service');

class SerialsController {
  static async search(req, res) {
    try {
      const { serial_number } = req.query;

      if (!serial_number) {
        return errorResponse(res, 'Serial number is required', 400);
      }

      const result = await SerialGeneratorService.searchSerial(serial_number);

      if (!result) {
        return errorResponse(res, 'Serial number not found', 404);
      }

      successResponse(res, result);
    } catch (error) {
      console.error('Search serial error:', error);
      errorResponse(res, 'Failed to search serial', 500);
    }
  }

  static async getByOrder(req, res) {
    try {
      const { order_id } = req.params;

      const result = await db.query(
        `SELECT sn.*, p.product_name
         FROM serial_numbers sn
         JOIN order_items oi ON sn.order_item_id = oi.order_item_id
         JOIN products p ON sn.product_id = p.product_id
         WHERE oi.order_id = $1
         ORDER BY sn.serial_number`,
        [order_id]
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get serials by order error:', error);
      errorResponse(res, 'Failed to fetch serials', 500);
    }
  }

  static async getByCustomer(req, res) {
    try {
      const { customer_id } = req.params;

      const result = await db.query(
        `SELECT sn.*, p.product_name, o.order_number, o.order_date
         FROM serial_numbers sn
         JOIN products p ON sn.product_id = p.product_id
         JOIN order_items oi ON sn.order_item_id = oi.order_item_id
         JOIN orders o ON oi.order_id = o.order_id
         WHERE sn.customer_id = $1
         ORDER BY sn.assigned_date DESC`,
        [customer_id]
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get serials by customer error:', error);
      errorResponse(res, 'Failed to fetch serials', 500);
    }
  }

  static async getDamagedSerials(req, res) {
    try {
      const result = await db.query(
        `SELECT sn.*, p.product_name, c.company_name, o.order_number
         FROM serial_numbers sn
         JOIN products p ON sn.product_id = p.product_id
         JOIN customers c ON sn.customer_id = c.customer_id
         JOIN order_items oi ON sn.order_item_id = oi.order_item_id
         JOIN orders o ON oi.order_id = o.order_id
         WHERE sn.is_damaged = true
         ORDER BY sn.assigned_date DESC`
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get damaged serials error:', error);
      errorResponse(res, 'Failed to fetch damaged serials', 500);
    }
  }

  static async getReusableSerials(req, res) {
    try {
      const result = await db.query(
        `SELECT sn.*, p.product_name
         FROM serial_numbers sn
         JOIN products p ON sn.product_id = p.product_id
         WHERE sn.is_damaged = true AND sn.is_reusable = true
         ORDER BY sn.assigned_date DESC`
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get reusable serials error:', error);
      errorResponse(res, 'Failed to fetch reusable serials', 500);
    }
  }
}

module.exports = SerialsController;