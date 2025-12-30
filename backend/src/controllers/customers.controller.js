const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

class CustomersController {
  static async getAll(req, res) {
    try {
      const result = await db.query(
        `SELECT c.*, u.full_name as created_by_name
         FROM customers c
         LEFT JOIN users u ON c.created_by = u.user_id
         WHERE c.status = 'active'
         ORDER BY c.created_date DESC`
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get customers error:', error);
      errorResponse(res, 'Failed to fetch customers', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        'SELECT * FROM customers WHERE customer_id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Customer not found', 404);
      }

      successResponse(res, result.rows[0]);
    } catch (error) {
      console.error('Get customer error:', error);
      errorResponse(res, 'Failed to fetch customer', 500);
    }
  }

  static async create(req, res) {
    try {
      const {
        company_name, vat_no, account_no, billing_contact,
        accounting_contact, delivery_contact, email, phone,
        address, city, country
      } = req.body;

      const result = await db.query(
        `INSERT INTO customers (
          company_name, vat_no, account_no, billing_contact,
          accounting_contact, delivery_contact, email, phone,
          address, city, country, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          company_name, vat_no, account_no, billing_contact,
          accounting_contact, delivery_contact, email, phone,
          address, city, country, req.user.user_id
        ]
      );

      successResponse(res, result.rows[0], 'Customer created successfully', 201);
    } catch (error) {
      console.error('Create customer error:', error);
      errorResponse(res, 'Failed to create customer', 500);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        company_name, vat_no, account_no, billing_contact,
        accounting_contact, delivery_contact, email, phone,
        address, city, country
      } = req.body;

      const result = await db.query(
        `UPDATE customers SET
          company_name = $1, vat_no = $2, account_no = $3,
          billing_contact = $4, accounting_contact = $5,
          delivery_contact = $6, email = $7, phone = $8,
          address = $9, city = $10, country = $11
        WHERE customer_id = $12
        RETURNING *`,
        [
          company_name, vat_no, account_no, billing_contact,
          accounting_contact, delivery_contact, email, phone,
          address, city, country, id
        ]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Customer not found', 404);
      }

      successResponse(res, result.rows[0], 'Customer updated successfully');
    } catch (error) {
      console.error('Update customer error:', error);
      errorResponse(res, 'Failed to update customer', 500);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        'UPDATE customers SET status = $1 WHERE customer_id = $2 RETURNING *',
        ['inactive', id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Customer not found', 404);
      }

      successResponse(res, null, 'Customer deleted successfully');
    } catch (error) {
      console.error('Delete customer error:', error);
      errorResponse(res, 'Failed to delete customer', 500);
    }
  }

  static async getStatistics(req, res) {
    try {
      const { id } = req.params;

      const stats = await db.query(
        `SELECT 
          COUNT(DISTINCT o.order_id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COUNT(DISTINCT CASE WHEN o.payment_status = 'paid' THEN o.order_id END) as paid_orders,
          COUNT(DISTINCT CASE WHEN o.payment_status = 'pending' THEN o.order_id END) as pending_orders
         FROM orders o
         WHERE o.customer_id = $1`,
        [id]
      );

      successResponse(res, stats.rows[0]);
    } catch (error) {
      console.error('Get customer statistics error:', error);
      errorResponse(res, 'Failed to fetch statistics', 500);
    }
  }
}

module.exports = CustomersController;