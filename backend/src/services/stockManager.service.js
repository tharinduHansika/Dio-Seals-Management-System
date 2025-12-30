const db = require('../config/database');

class StockManagerService {
  static async reserveStock(productId, quantity) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      const stockCheck = await client.query(
        'SELECT available_qty FROM stock WHERE product_id = $1 FOR UPDATE',
        [productId]
      );

      if (stockCheck.rows.length === 0) {
        throw new Error('Product stock not found');
      }

      const availableQty = stockCheck.rows[0].available_qty;

      if (availableQty < quantity) {
        throw new Error(`Insufficient stock. Available: ${availableQty}, Required: ${quantity}`);
      }

      await client.query(
        `UPDATE stock 
         SET available_qty = available_qty - $1,
             reserved_qty = reserved_qty + $1,
             last_updated = NOW()
         WHERE product_id = $2`,
        [quantity, productId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async sellStock(productId, quantity) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE stock 
         SET reserved_qty = reserved_qty - $1,
             sold_qty = sold_qty + $1,
             last_updated = NOW()
         WHERE product_id = $2`,
        [quantity, productId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async releaseStock(productId, quantity) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE stock 
         SET reserved_qty = reserved_qty - $1,
             available_qty = available_qty + $1,
             last_updated = NOW()
         WHERE product_id = $2`,
        [quantity, productId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async damageStock(productId, quantity) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE stock 
         SET reserved_qty = reserved_qty - $1,
             damaged_qty = damaged_qty + $1,
             last_updated = NOW()
         WHERE product_id = $2`,
        [quantity, productId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getStockAlerts() {
    try {
      const result = await db.query(
        `SELECT p.product_id, p.product_name, p.minimum_threshold,
                s.available_qty, s.reserved_qty
         FROM products p
         JOIN stock s ON p.product_id = s.product_id
         WHERE s.available_qty < p.minimum_threshold
         AND p.status = 'active'
         ORDER BY s.available_qty ASC`
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockManagerService;