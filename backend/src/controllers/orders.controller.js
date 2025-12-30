const db = require('../config/database');
const { successResponse, errorResponse, generateUniqueNumber } = require('../utils/helpers');
const SerialGeneratorService = require('../services/serialGenerator.service');
const StockManagerService = require('../services/stockManager.service');

class OrdersController {
  static async getAll(req, res) {
    try {
      const { status } = req.query;
      
      let query = `
        SELECT o.*, c.company_name, u.full_name as created_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN users u ON o.created_by = u.user_id
      `;
      
      const params = [];
      if (status) {
        query += ` WHERE o.order_status = $1`;
        params.push(status);
      }
      
      query += ` ORDER BY o.created_at DESC`;
      
      const result = await db.query(query, params);
      successResponse(res, result.rows);
    } catch (error) {
      console.error('Get orders error:', error);
      errorResponse(res, 'Failed to fetch orders', 500);
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const order = await db.query(
        `SELECT o.*, c.company_name, c.email, c.phone, c.address,
                u.full_name as created_by_name
         FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.customer_id
         LEFT JOIN users u ON o.created_by = u.user_id
         WHERE o.order_id = $1`,
        [id]
      );

      if (order.rows.length === 0) {
        return errorResponse(res, 'Order not found', 404);
      }

      const items = await db.query(
        `SELECT oi.*, p.product_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_id = $1`,
        [id]
      );

      successResponse(res, {
        ...order.rows[0],
        items: items.rows
      });
    } catch (error) {
      console.error('Get order error:', error);
      errorResponse(res, 'Failed to fetch order', 500);
    }
  }

  static async create(req, res) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_id, quotation_id, completion_date, items } = req.body;
    const order_number = generateUniqueNumber('ORD');

    let total_amount = 0;
    items.forEach(item => {
      total_amount += parseFloat(item.total_price);
    });

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_id, quotation_id, created_by, completion_date, total_amount, order_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [order_number, customer_id, quotation_id, req.user.user_id, completion_date, total_amount, 'created']
    );

    const order_id = orderResult.rows[0].order_id;

    // Create order items and assign serial numbers
    for (const item of items) {
      // Check stock availability
      const stockCheck = await client.query(
        'SELECT available_qty FROM stock WHERE product_id = $1',
        [item.product_id]
      );

      if (stockCheck.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found in stock`);
      }

      if (stockCheck.rows[0].available_qty < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${stockCheck.rows[0].available_qty}, Required: ${item.quantity}`);
      }

      // Create order item
      const orderItemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, serial_start, serial_end, printing_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [order_id, item.product_id, item.quantity, item.unit_price, item.total_price, 
         item.serial_start, item.serial_end, item.printing_type]
      );

      // Generate serial numbers - PASS THE CLIENT!
      await SerialGeneratorService.generateSerials(
        orderItemResult.rows[0].order_item_id,
        item.product_id,
        customer_id,
        item.serial_start,
        item.serial_end,
        item.quantity,
        client  // ✅ Pass the transaction client
      );

      // Reserve stock
      await client.query(
        `UPDATE stock 
         SET available_qty = available_qty - $1, reserved_qty = reserved_qty + $1, last_updated = NOW()
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    await client.query(
      `UPDATE orders SET order_status = $1 WHERE order_id = $2`,
      ['waiting_print', order_id]
    );

    await client.query('COMMIT');
    successResponse(res, orderResult.rows[0], 'Order created successfully', 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    errorResponse(res, error.message || 'Failed to create order', 500);
  } finally {
    client.release();
  }
}

  static async cancel(req, res) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { cancellation_reason, after_printing } = req.body;

      // Get order details
      const order = await client.query(
        'SELECT * FROM orders WHERE order_id = $1',
        [id]
      );

      if (order.rows.length === 0) {
        throw new Error('Order not found');
      }

      const orderData = order.rows[0];

      // Get order items
      const items = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [id]
      );

      // Process cancellation based on printing status
      if (after_printing) {
        // Only Director or Marketing Manager can cancel after printing
        if (!['Director', 'Marketing Manager', 'Admin'].includes(req.user.role_name)) {
          throw new Error('Only Director or Marketing Manager can cancel after printing');
        }

        // Move stock from reserved to damaged
        for (const item of items.rows) {
          await client.query(
            `UPDATE stock 
             SET reserved_qty = reserved_qty - $1, damaged_qty = damaged_qty + $1, last_updated = NOW()
             WHERE product_id = $2`,
            [item.quantity, item.product_id]
          );

          // Mark serial numbers as damaged but reusable
          await client.query(
            `UPDATE serial_numbers 
             SET status = 'damaged', is_damaged = true, is_reusable = true
             WHERE order_item_id = $1`,
            [item.order_item_id]
          );
        }
      } else {
        // Before printing - release stock
        for (const item of items.rows) {
          await client.query(
            `UPDATE stock 
             SET reserved_qty = reserved_qty - $1, available_qty = available_qty + $1, last_updated = NOW()
             WHERE product_id = $2`,
            [item.quantity, item.product_id]
          );

          // Delete serial numbers
          await client.query(
            'DELETE FROM serial_numbers WHERE order_item_id = $1',
            [item.order_item_id]
          );
        }
      }

      // Update order status
      await client.query(
        `UPDATE orders 
         SET order_status = $1, cancellation_reason = $2, cancelled_date = NOW(), cancelled_by = $3
         WHERE order_id = $4`,
        ['cancelled', cancellation_reason, req.user.user_id, id]
      );

      await client.query('COMMIT');
      successResponse(res, null, 'Order cancelled successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Cancel order error:', error);
      errorResponse(res, error.message || 'Failed to cancel order', 500);
    } finally {
      client.release();
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { order_status } = req.body;

      const result = await db.query(
        `UPDATE orders SET order_status = $1 WHERE order_id = $2 RETURNING *`,
        [order_status, id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Order not found', 404);
      }

      successResponse(res, result.rows[0], 'Order status updated');
    } catch (error) {
      console.error('Update order status error:', error);
      errorResponse(res, 'Failed to update order status', 500);
    }
  }
}

module.exports = OrdersController;