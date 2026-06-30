import { Movement } from '../../app/types';
import { runQuery, runStatement, persistDatabase } from '../db';

export const movementRepository = {
  getAll(): Movement[] {
    return runQuery('SELECT * FROM movements ORDER BY timestamp DESC') as Movement[];
  },

  getById(id: string): Movement | undefined {
    const results = runQuery('SELECT * FROM movements WHERE id = ?', [id]) as Movement[];
    return results[0];
  },

  create(movement: Omit<Movement, 'id' | 'timestamp'>): Movement {
    const id = Date.now().toString();
    const timestamp = new Date().toISOString();
    runStatement(
      `INSERT INTO movements (id, type, productId, productName, quantity, warehouse, operator, timestamp, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, movement.type, movement.productId, movement.productName, movement.quantity,
       movement.warehouse, movement.operator, timestamp, movement.notes || null]
    );
    persistDatabase();
    return { ...movement, id, timestamp };
  },

  getRecent(limit: number = 10): Movement[] {
    return runQuery(
      'SELECT * FROM movements ORDER BY timestamp DESC LIMIT ?',
      [limit]
    ) as Movement[];
  },

  getByProduct(productId: string): Movement[] {
    return runQuery(
      'SELECT * FROM movements WHERE productId = ? ORDER BY timestamp DESC',
      [productId]
    ) as Movement[];
  },

  getByWarehouse(warehouse: string): Movement[] {
    return runQuery(
      'SELECT * FROM movements WHERE warehouse = ? ORDER BY timestamp DESC',
      [warehouse]
    ) as Movement[];
  },

  getByDateRange(from: string, to: string): Movement[] {
    return runQuery(
      'SELECT * FROM movements WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
      [from, to]
    ) as Movement[];
  },

  getSummaryByType(): { type: string; count: number; totalQuantity: number }[] {
    return runQuery(
      `SELECT type, COUNT(*) as count, SUM(quantity) as totalQuantity
       FROM movements GROUP BY type ORDER BY type`
    ) as any[];
  },
};
