const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { successResponse, errorResponse } = require('../utils/helpers');

class UsersController {
  static async getAll(req, res) {
    try {
      const result = await db.query(
        `SELECT u.user_id, u.username, u.full_name, u.email, u.phone, u.status, u.created_date, u.last_login,
                r.role_name
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         ORDER BY u.created_date DESC`
      );
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get users error:', error);
      errorResponse(res, 'Failed to fetch users', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT u.user_id, u.username, u.full_name, u.email, u.phone, u.status, u.created_date, u.last_login,
                r.role_name, r.role_id
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.user_id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'User not found', 404);
      }

      successResponse(res, result.rows[0]);
    } catch (error) {
      console.error('Get user error:', error);
      errorResponse(res, 'Failed to fetch user', 500);
    }
  }

  static async create(req, res) {
    try {
      const { username, password, full_name, email, phone, role_id } = req.body;

      const userCheck = await db.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (userCheck.rows.length > 0) {
        return errorResponse(res, 'Username or email already exists', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const result = await db.query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id, username, full_name, email, phone, role_id`,
        [username, password_hash, full_name, email, phone, role_id, req.user.user_id]
      );

      successResponse(res, result.rows[0], 'User created successfully', 201);
    } catch (error) {
      console.error('Create user error:', error);
      errorResponse(res, 'Failed to create user', 500);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { full_name, email, phone, role_id, status } = req.body;

      const result = await db.query(
        `UPDATE users SET full_name = $1, email = $2, phone = $3, role_id = $4, status = $5
         WHERE user_id = $6
         RETURNING user_id, username, full_name, email, phone, role_id, status`,
        [full_name, email, phone, role_id, status, id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'User not found', 404);
      }

      successResponse(res, result.rows[0], 'User updated successfully');
    } catch (error) {
      console.error('Update user error:', error);
      errorResponse(res, 'Failed to update user', 500);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (parseInt(id) === 1) {
        return errorResponse(res, 'Cannot delete admin user', 400);
      }

      const result = await db.query(
        'UPDATE users SET status = $1 WHERE user_id = $2 RETURNING *',
        ['inactive', id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'User not found', 404);
      }

      successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      errorResponse(res, 'Failed to delete user', 500);
    }
  }

  static async getRoles(req, res) {
    try {
      const result = await db.query('SELECT * FROM roles ORDER BY role_id');
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get roles error:', error);
      errorResponse(res, 'Failed to fetch roles', 500);
    }
  }
}

module.exports = UsersController;