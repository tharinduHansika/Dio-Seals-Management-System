const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

class ProductsController {
  static async getAll(req, res) {
    try {
      const result = await db.query(
        `SELECT p.*, s.available_qty, s.reserved_qty, s.sold_qty, s.damaged_qty, s.sample_qty,
                u.full_name as created_by_name
         FROM products p
         LEFT JOIN stock s ON p.product_id = s.product_id
         LEFT JOIN users u ON p.created_by = u.user_id
         WHERE p.status = 'active'
         ORDER BY p.created_date DESC`
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get products error:', error);
      errorResponse(res, 'Failed to fetch products', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT p.*, s.*, u.full_name as created_by_name
         FROM products p
         LEFT JOIN stock s ON p.product_id = s.product_id
         LEFT JOIN users u ON p.created_by = u.user_id
         WHERE p.product_id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Product not found', 404);
      }

      successResponse(res, result.rows[0]);
    } catch (error) {
      console.error('Get product error:', error);
      errorResponse(res, 'Failed to fetch product', 500);
    }
  }

  static async create(req, res) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      const {
        product_name, description, category, unit_price,
        carton_number, batch_number, minimum_threshold
      } = req.body;

      // Insert product
      const productResult = await client.query(
        `INSERT INTO products (
          product_name, description, category, unit_price,
          carton_number, batch_number, minimum_threshold, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          product_name, description, category, unit_price,
          carton_number, batch_number, minimum_threshold || 0, req.user.user_id
        ]
      );

      const product = productResult.rows[0];

      // Create stock entry
      await client.query(
        'INSERT INTO stock (product_id) VALUES ($1)',
        [product.product_id]
      );

      await client.query('COMMIT');

      successResponse(res, product, 'Product created successfully', 201);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create product error:', error);
      errorResponse(res, 'Failed to create product', 500);
    } finally {
      client.release();
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        product_name, description, category, unit_price,
        carton_number, batch_number, minimum_threshold
      } = req.body;

      const result = await db.query(
        `UPDATE products SET
          product_name = $1, description = $2, category = $3,
          unit_price = $4, carton_number = $5, batch_number = $6,
          minimum_threshold = $7
        WHERE product_id = $8
        RETURNING *`,
        [
          product_name, description, category, unit_price,
          carton_number, batch_number, minimum_threshold, id
        ]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Product not found', 404);
      }

      successResponse(res, result.rows[0], 'Product updated successfully');
    } catch (error) {
      console.error('Update product error:', error);
      errorResponse(res, 'Failed to update product', 500);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        'UPDATE products SET status = $1 WHERE product_id = $2 RETURNING *',
        ['inactive', id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Product not found', 404);
      }

      successResponse(res, null, 'Product deleted successfully');
    } catch (error) {
      console.error('Delete product error:', error);
      errorResponse(res, 'Failed to delete product', 500);
    }
  }

  static async getCategories(req, res) {
    try {
      const result = await db.query(
        `SELECT DISTINCT category 
         FROM products 
         WHERE category IS NOT NULL AND status = 'active'
         ORDER BY category`
      );

      successResponse(res, result.rows.map(r => r.category));
    } catch (error) {
      console.error('Get categories error:', error);
      errorResponse(res, 'Failed to fetch categories', 500);
    }
  }
}

module.exports = ProductsController;