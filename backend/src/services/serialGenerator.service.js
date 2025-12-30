const db = require('../config/database');

class SerialGeneratorService {
  static async generateSerials(orderItemId, productId, customerId, serialStart, serialEnd, quantity, client = null) {
    try {
      const serials = [];
      
      const startMatch = serialStart.match(/^([A-Z]+)(\d+)$/);
      const endMatch = serialEnd.match(/^([A-Z]+)(\d+)$/);
      
      if (!startMatch || !endMatch) {
        throw new Error('Invalid serial format. Use format like A000001');
      }

      const prefix = startMatch[1];
      const startNum = parseInt(startMatch[2]);
      const endNum = parseInt(endMatch[2]);
      
      if (endNum - startNum + 1 !== quantity) {
        throw new Error(`Serial range does not match quantity. Range: ${endNum - startNum + 1}, Quantity: ${quantity}`);
      }

      // Generate all serial numbers
      for (let i = startNum; i <= endNum; i++) {
        const paddedNum = String(i).padStart(startMatch[2].length, '0');
        const serialNumber = `${prefix}${paddedNum}`;
        
        serials.push({
          order_item_id: orderItemId,
          product_id: productId,
          customer_id: customerId,
          serial_number: serialNumber,
          status: 'assigned'
        });
      }

      // Insert in batches of 100 to avoid parameter limits
      const BATCH_SIZE = 100;
      const insertedSerials = [];

      // Use provided client (for transactions) or default db.query
      const queryExecutor = client || db;

      for (let i = 0; i < serials.length; i += BATCH_SIZE) {
        const batch = serials.slice(i, i + BATCH_SIZE);
        
        const values = batch.map((s, idx) => 
          `($${idx * 5 + 1}, $${idx * 5 + 2}, $${idx * 5 + 3}, $${idx * 5 + 4}, $${idx * 5 + 5})`
        ).join(',');

        const params = batch.flatMap(s => [
          s.order_item_id,
          s.product_id,
          s.customer_id,
          s.serial_number,
          s.status
        ]);

        const query = `
          INSERT INTO serial_numbers 
          (order_item_id, product_id, customer_id, serial_number, status)
          VALUES ${values}
          RETURNING *
        `;

        const result = await queryExecutor.query(query, params);
        insertedSerials.push(...result.rows);
      }

      return insertedSerials;
    } catch (error) {
      throw error;
    }
  }

  static async checkSerialAvailability(serialStart, serialEnd) {
    try {
      const result = await db.query(
        `SELECT COUNT(*) as count 
         FROM serial_numbers 
         WHERE serial_number BETWEEN $1 AND $2`,
        [serialStart, serialEnd]
      );

      return result.rows[0].count === '0';
    } catch (error) {
      throw error;
    }
  }

  static async markAsPrinted(orderItemId) {
    try {
      const result = await db.query(
        `UPDATE serial_numbers 
         SET status = 'printed', printed_date = NOW()
         WHERE order_item_id = $1
         RETURNING *`,
        [orderItemId]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async markAsSold(orderItemId) {
    try {
      const result = await db.query(
        `UPDATE serial_numbers 
         SET status = 'sold'
         WHERE order_item_id = $1
         RETURNING *`,
        [orderItemId]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async markAsDamaged(orderItemId, isReusable = true) {
    try {
      const result = await db.query(
        `UPDATE serial_numbers 
         SET status = 'damaged', is_damaged = true, is_reusable = $2
         WHERE order_item_id = $1
         RETURNING *`,
        [orderItemId, isReusable]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async searchSerial(serialNumber) {
    try {
      const result = await db.query(
        `SELECT sn.*, 
                c.company_name as customer_name,
                p.product_name,
                o.order_number,
                o.order_date
         FROM serial_numbers sn
         LEFT JOIN customers c ON sn.customer_id = c.customer_id
         LEFT JOIN products p ON sn.product_id = p.product_id
         LEFT JOIN order_items oi ON sn.order_item_id = oi.order_item_id
         LEFT JOIN orders o ON oi.order_id = o.order_id
         WHERE sn.serial_number = $1`,
        [serialNumber]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SerialGeneratorService;