import { GoodsReceipt } from '../../app/types';
import { runQuery, runStatement, persistDatabase } from '../db';

export const goodsReceiptRepository = {
  getAll(): GoodsReceipt[] {
    return runQuery('SELECT * FROM goods_receipts ORDER BY createdAt DESC') as GoodsReceipt[];
  },

  getById(id: string): GoodsReceipt | undefined {
    const results = runQuery('SELECT * FROM goods_receipts WHERE id = ?', [id]) as GoodsReceipt[];
    return results[0];
  },

  create(receipt: Omit<GoodsReceipt, 'id' | 'createdAt'>): GoodsReceipt {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    runStatement(
      `INSERT INTO goods_receipts (id, supplierId, supplierName, productId, productName, sku, quantity, unitPrice, totalAmount, warehouse, invoiceNumber, notes, operator, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, receipt.supplierId, receipt.supplierName, receipt.productId, receipt.productName,
       receipt.sku, receipt.quantity, receipt.unitPrice, receipt.totalAmount, receipt.warehouse,
       receipt.invoiceNumber || null, receipt.notes || null, receipt.operator, createdAt]
    );
    persistDatabase();
    return { ...receipt, id, createdAt };
  },

  getBySupplier(supplierId: string): GoodsReceipt[] {
    return runQuery(
      'SELECT * FROM goods_receipts WHERE supplierId = ? ORDER BY createdAt DESC',
      [supplierId]
    ) as GoodsReceipt[];
  },
};
