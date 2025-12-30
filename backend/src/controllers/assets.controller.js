const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

class AssetsController {
  static async getAll(req, res) {
    try {
      const { status, category } = req.query;

      let query = 'SELECT * FROM assets WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (status) {
        query += ` AND status = ${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (category) {
        query += ` AND category = ${paramCount}`;
        params.push(category);
        paramCount++;
      }

      query += ' ORDER BY created_at DESC';

      const result = await db.query(query, params);
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get assets error:', error);
      errorResponse(res, 'Failed to fetch assets', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        'SELECT * FROM assets WHERE asset_id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Asset not found', 404);
      }

      successResponse(res, result.rows[0]);
    } catch (error) {
      console.error('Get asset error:', error);
      errorResponse(res, 'Failed to fetch asset', 500);
    }
  }

  static async create(req, res) {
    try {
      const {
        asset_name, category, purchase_date, purchase_amount,
        supplier, warranty_date, depreciation_rate, current_value
      } = req.body;

      const result = await db.query(
        `INSERT INTO assets (asset_name, category, purchase_date, purchase_amount, 
                            supplier, warranty_date, depreciation_rate, current_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [asset_name, category, purchase_date, purchase_amount, supplier, 
         warranty_date, depreciation_rate, current_value || purchase_amount]
      );

      successResponse(res, result.rows[0], 'Asset created successfully', 201);
    } catch (error) {
      console.error('Create asset error:', error);
      errorResponse(res, 'Failed to create asset', 500);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        asset_name, category, purchase_date, purchase_amount,
        supplier, warranty_date, depreciation_rate, current_value, status
      } = req.body;

      const result = await db.query(
        `UPDATE assets 
         SET asset_name = $1, category = $2, purchase_date = $3, purchase_amount = $4,
             supplier = $5, warranty_date = $6, depreciation_rate = $7, 
             current_value = $8, status = $9
         WHERE asset_id = $10 RETURNING *`,
        [asset_name, category, purchase_date, purchase_amount, supplier,
         warranty_date, depreciation_rate, current_value, status, id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Asset not found', 404);
      }

      successResponse(res, result.rows[0], 'Asset updated successfully');
    } catch (error) {
      console.error('Update asset error:', error);
      errorResponse(res, 'Failed to update asset', 500);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        'UPDATE assets SET status = $1 WHERE asset_id = $2 RETURNING *',
        ['disposed', id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Asset not found', 404);
      }

      successResponse(res, null, 'Asset deleted successfully');
    } catch (error) {
      console.error('Delete asset error:', error);
      errorResponse(res, 'Failed to delete asset', 500);
    }
  }

  static async getSummary(req, res) {
    try {
      const result = await db.query(
        `SELECT 
          COUNT(*) as total_assets,
          SUM(purchase_amount) as total_purchase_value,
          SUM(current_value) as total_current_value,
          SUM(purchase_amount - current_value) as total_depreciation
         FROM assets
         WHERE status = 'active'`
      );

      successResponse(res, result.rows[0]);
    } catch (error) {
      console.error('Get asset summary error:', error);
      errorResponse(res, 'Failed to fetch asset summary', 500);
    }
  }
}

module.exports = AssetsController;