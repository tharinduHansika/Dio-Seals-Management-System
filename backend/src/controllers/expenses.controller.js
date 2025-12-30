const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

class ExpensesController {
  static async getAll(req, res) {
    try {
      const { category, start_date, end_date } = req.query;

      let query = `
        SELECT e.*, u.full_name as recorded_by_name
        FROM expenses e
        LEFT JOIN users u ON e.recorded_by = u.user_id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      if (category) {
        query += ` AND e.category = ${paramCount}`;
        params.push(category);
        paramCount++;
      }

      if (start_date) {
        query += ` AND e.expense_date >= ${paramCount}`;
        params.push(start_date);
        paramCount++;
      }

      if (end_date) {
        query += ` AND e.expense_date <= ${paramCount}`;
        params.push(end_date);
        paramCount++;
      }

      query += ` ORDER BY e.expense_date DESC`;

      const result = await db.query(query, params);
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get expenses error:', error);
      errorResponse(res, 'Failed to fetch expenses', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT e.*, u.full_name as recorded_by_name
         FROM expenses e
         LEFT JOIN users u ON e.recorded_by = u.user_id
         WHERE e.expense_id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Expense not found', 404);
      }

      successResponse(res, result.rows[0]);
    } catch (error) {
      console.error('Get expense error:', error);
      errorResponse(res, 'Failed to fetch expense', 500);
    }
  }

  static async create(req, res) {
    try {
      const { category, description, amount, expense_date, payment_method, notes } = req.body;

      const result = await db.query(
        `INSERT INTO expenses (category, description, amount, expense_date, payment_method, recorded_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [category, description, amount, expense_date || new Date(), payment_method, req.user.user_id, notes]
      );

      successResponse(res, result.rows[0], 'Expense recorded successfully', 201);
    } catch (error) {
      console.error('Create expense error:', error);
      errorResponse(res, 'Failed to record expense', 500);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { category, description, amount, expense_date, payment_method, notes } = req.body;

      const result = await db.query(
        `UPDATE expenses 
         SET category = $1, description = $2, amount = $3, expense_date = $4, 
             payment_method = $5, notes = $6
         WHERE expense_id = $7 RETURNING *`,
        [category, description, amount, expense_date, payment_method, notes, id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Expense not found', 404);
      }

      successResponse(res, result.rows[0], 'Expense updated successfully');
    } catch (error) {
      console.error('Update expense error:', error);
      errorResponse(res, 'Failed to update expense', 500);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM expenses WHERE expense_id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Expense not found', 404);
      }

      successResponse(res, null, 'Expense deleted successfully');
    } catch (error) {
      console.error('Delete expense error:', error);
      errorResponse(res, 'Failed to delete expense', 500);
    }
  }

  static async getSummary(req, res) {
    try {
      const { start_date, end_date } = req.query;

      let query = `
        SELECT 
          category,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM expenses
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      if (start_date) {
        query += ` AND expense_date >= ${paramCount}`;
        params.push(start_date);
        paramCount++;
      }

      if (end_date) {
        query += ` AND expense_date <= ${paramCount}`;
        params.push(end_date);
        paramCount++;
      }

      query += ` GROUP BY category ORDER BY total_amount DESC`;

      const result = await db.query(query, params);
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get expense summary error:', error);
      errorResponse(res, 'Failed to fetch expense summary', 500);
    }
  }
}

module.exports = ExpensesController;