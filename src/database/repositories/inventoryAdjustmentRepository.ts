import { InventoryAdjustment } from '../../app/types';
import { runQuery, runStatement, persistDatabase } from '../db';

export const inventoryAdjustmentRepository = {
  getAll(): InventoryAdjustment[] {
    return runQuery('SELECT * FROM inventory_adjustments ORDER BY createdAt DESC') as InventoryAdjustment[];
  },

  getById(id: string): InventoryAdjustment | undefined {
    const results = runQuery('SELECT * FROM inventory_adjustments WHERE id = ?', [id]) as InventoryAdjustment[];
    return results[0];
  },

  create(adjustment: Omit<InventoryAdjustment, 'id' | 'createdAt'>): InventoryAdjustment {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    runStatement(
      `INSERT INTO inventory_adjustments (id, productId, productName, sku, warehouse, previousStock, adjustmentQuantity, newStock, reason, type, operator, createdAt, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, adjustment.productId, adjustment.productName, adjustment.sku, adjustment.warehouse,
       adjustment.previousStock, adjustment.adjustmentQuantity, adjustment.newStock,
       adjustment.reason, adjustment.type, adjustment.operator, createdAt, adjustment.notes || null]
    );
    persistDatabase();
    return { ...adjustment, id, createdAt };
  },
};
