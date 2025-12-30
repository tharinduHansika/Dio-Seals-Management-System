const db = require('../config/database');
const { successResponse, errorResponse, generateUniqueNumber } = require('../utils/helpers');
const SerialGeneratorService = require('../services/serialGenerator.service');

class PrintingController {
  static async getAll(req, res) {
    try {
      const { status } = req.query;

      let query = `
        SELECT pj.*, o.order_number, c.company_name, u.full_name as assigned_to_name
        FROM printing_jobs pj
        JOIN orders o ON pj.order_id = o.order_id
        JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN users u ON pj.assigned_to = u.user_id
      `;

      const params = [];
      if (status) {
        query += ` WHERE pj.job_status = $1`;
        params.push(status);
      }

      query += ` ORDER BY pj.created_at DESC`;

      const result = await db.query(query, params);
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get printing jobs error:', error);
      errorResponse(res, 'Failed to fetch printing jobs', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const job = await db.query(
        `SELECT pj.*, o.order_number, c.company_name, u.full_name as assigned_to_name
         FROM printing_jobs pj
         JOIN orders o ON pj.order_id = o.order_id
         JOIN customers c ON o.customer_id = c.customer_id
         LEFT JOIN users u ON pj.assigned_to = u.user_id
         WHERE pj.job_id = $1`,
        [id]
      );

      if (job.rows.length === 0) {
        return errorResponse(res, 'Printing job not found', 404);
      }

      const items = await db.query(
        `SELECT oi.*, p.product_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_id = $1`,
        [job.rows[0].order_id]
      );

      successResponse(res, {
        ...job.rows[0],
        items: items.rows
      });
    } catch (error) {
      console.error('Get printing job error:', error);
      errorResponse(res, 'Failed to fetch printing job', 500);
    }
  }

  static async create(req, res) {
    try {
      const { order_id, assigned_to, notes } = req.body;
      const job_number = generateUniqueNumber('JOB');

      const result = await db.query(
        `INSERT INTO printing_jobs (job_number, order_id, assigned_to, notes)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [job_number, order_id, assigned_to, notes]
      );

      // Update order status
      await db.query(
        `UPDATE orders SET order_status = $1 WHERE order_id = $2`,
        ['in_progress', order_id]
      );

      successResponse(res, result.rows[0], 'Printing job created successfully', 201);
    } catch (error) {
      console.error('Create printing job error:', error);
      errorResponse(res, 'Failed to create printing job', 500);
    }
  }

  static async updateStatus(req, res) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { job_status } = req.body;

      const job = await client.query(
        'SELECT * FROM printing_jobs WHERE job_id = $1',
        [id]
      );

      if (job.rows.length === 0) {
        throw new Error('Printing job not found');
      }

      const updateData = { job_status };

      if (job_status === 'in_progress' && !job.rows[0].started_date) {
        updateData.started_date = new Date();
      }

      if (job_status === 'completed') {
        updateData.completed_date = new Date();

        // Mark serial numbers as printed
        const items = await client.query(
          'SELECT order_item_id FROM order_items WHERE order_id = $1',
          [job.rows[0].order_id]
        );

        for (const item of items.rows) {
          await SerialGeneratorService.markAsPrinted(item.order_item_id);
        }

        // Update order status
        await client.query(
          `UPDATE orders SET order_status = $1 WHERE order_id = $2`,
          ['job_done', job.rows[0].order_id]
        );
      }

      const result = await client.query(
        `UPDATE printing_jobs 
         SET job_status = $1, started_date = COALESCE($2, started_date), completed_date = COALESCE($3, completed_date)
         WHERE job_id = $4 RETURNING *`,
        [job_status, updateData.started_date, updateData.completed_date, id]
      );

      await client.query('COMMIT');
      successResponse(res, result.rows[0], 'Printing job status updated');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Update printing job status error:', error);
      errorResponse(res, error.message || 'Failed to update printing job', 500);
    } finally {
      client.release();
    }
  }

  static async getMyJobs(req, res) {
    try {
      const result = await db.query(
        `SELECT pj.*, o.order_number, c.company_name
         FROM printing_jobs pj
         JOIN orders o ON pj.order_id = o.order_id
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE pj.assigned_to = $1
         ORDER BY pj.created_at DESC`,
        [req.user.user_id]
      );

      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get my jobs error:', error);
      errorResponse(res, 'Failed to fetch jobs', 500);
    }
  }
}

module.exports = PrintingController;