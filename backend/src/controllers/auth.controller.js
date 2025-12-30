const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { username, password, full_name, email, phone, role_id } = req.body;

      // Check if user exists
      const userCheck = await db.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (userCheck.rows.length > 0) {
        return errorResponse(res, 'Username or email already exists', 400);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Insert user
      const result = await db.query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id, username, full_name, email, phone, role_id, created_date`,
        [username, password_hash, full_name, email, phone, role_id, req.user?.user_id || null]
      );

      successResponse(res, result.rows[0], 'User registered successfully', 201);
    } catch (error) {
      console.error('Register error:', error);
      errorResponse(res, 'Registration failed', 500);
    }
  }

  // Login
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return errorResponse(res, 'Username and password are required', 400);
      }

      // Get user with role
      const result = await db.query(
        `SELECT u.*, r.role_name, r.permissions
         FROM users u 
         JOIN roles r ON u.role_id = r.role_id 
         WHERE u.username = $1`,
        [username]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      const user = result.rows[0];

      // Check if user is active
      if (user.status !== 'active') {
        return errorResponse(res, 'Account is inactive', 401);
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE user_id = $1',
        [user.user_id]
      );

      // Generate token
      const token = jwt.sign(
        { 
          userId: user.user_id, 
          username: user.username,
          role: user.role_name 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      // Remove sensitive data
      delete user.password_hash;

      successResponse(res, {
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role_id: user.role_id,
          role_name: user.role_name,
          permissions: user.permissions
        }
      }, 'Login successful');
    } catch (error) {
      console.error('Login error:', error);
      errorResponse(res, 'Login failed', 500);
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const result = await db.query(
        `SELECT u.user_id, u.username, u.full_name, u.email, u.phone, 
                u.created_date, u.last_login, r.role_name, r.permissions
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.user_id = $1`,
        [req.user.user_id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'User not found', 404);
      }

      successResponse(res, result.rows[0], 'Profile retrieved successfully');
    } catch (error) {
      console.error('Get profile error:', error);
      errorResponse(res, 'Failed to get profile', 500);
    }
  }

  // Update profile
  static async updateProfile(req, res) {
    try {
      const { full_name, email, phone } = req.body;

      const result = await db.query(
        `UPDATE users 
         SET full_name = $1, email = $2, phone = $3
         WHERE user_id = $4
         RETURNING user_id, username, full_name, email, phone`,
        [full_name, email, phone, req.user.user_id]
      );

      successResponse(res, result.rows[0], 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      errorResponse(res, 'Failed to update profile', 500);
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;

      // Get current password hash
      const result = await db.query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [req.user.user_id]
      );

      const user = result.rows[0];

      // Verify current password
      const isMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isMatch) {
        return errorResponse(res, 'Current password is incorrect', 400);
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(new_password, salt);

      // Update password
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE user_id = $2',
        [password_hash, req.user.user_id]
      );

      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);
      errorResponse(res, 'Failed to change password', 500);
    }
  }
}

module.exports = AuthController;