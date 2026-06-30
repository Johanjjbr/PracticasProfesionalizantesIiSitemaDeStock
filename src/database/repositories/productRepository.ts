import { Product } from '../../app/types';
import { runQuery, runStatement, persistDatabase } from '../db';

function mapProduct(row: any): Product {
  return {
    ...row,
    isActive: row.isActive === 1 || row.isActive === true,
  };
}

export const productRepository = {
  getAll(): Product[] {
    return (runQuery('SELECT * FROM products ORDER BY name') as any[]).map(mapProduct);
  },

  getById(id: string): Product | undefined {
    const results = runQuery('SELECT * FROM products WHERE id = ?', [id]) as any[];
    return results.length > 0 ? mapProduct(results[0]) : undefined;
  },

  create(product: Omit<Product, 'id' | 'lastUpdated'>): Product {
    const id = Date.now().toString();
    const lastUpdated = new Date().toISOString().split('T')[0];
    runStatement(
      `INSERT INTO products (id, sku, name, description, detailedDescription, category, unitOfMeasure, warehouse, location, currentStock, minStock, unitPrice, lastPurchasePrice, currency, isActive, lastUpdated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, product.sku, product.name, product.description || null, product.detailedDescription || null,
       product.category, product.unitOfMeasure || 'Unidad', product.warehouse, product.location || null,
       product.currentStock, product.minStock, product.unitPrice, product.lastPurchasePrice || null,
       product.currency || 'ARS', product.isActive !== false ? 1 : 0, lastUpdated]
    );
    persistDatabase();
    return { ...product, id, lastUpdated, isActive: product.isActive !== false };
  },

  update(id: string, updates: Partial<Product>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.sku !== undefined) { fields.push('sku = ?'); values.push(updates.sku); }
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.detailedDescription !== undefined) { fields.push('detailedDescription = ?'); values.push(updates.detailedDescription); }
    if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
    if (updates.unitOfMeasure !== undefined) { fields.push('unitOfMeasure = ?'); values.push(updates.unitOfMeasure); }
    if (updates.warehouse !== undefined) { fields.push('warehouse = ?'); values.push(updates.warehouse); }
    if (updates.location !== undefined) { fields.push('location = ?'); values.push(updates.location); }
    if (updates.currentStock !== undefined) { fields.push('currentStock = ?'); values.push(updates.currentStock); }
    if (updates.minStock !== undefined) { fields.push('minStock = ?'); values.push(updates.minStock); }
    if (updates.unitPrice !== undefined) { fields.push('unitPrice = ?'); values.push(updates.unitPrice); }
    if (updates.lastPurchasePrice !== undefined) { fields.push('lastPurchasePrice = ?'); values.push(updates.lastPurchasePrice); }
    if (updates.currency !== undefined) { fields.push('currency = ?'); values.push(updates.currency); }
    if (updates.isActive !== undefined) { fields.push('isActive = ?'); values.push(updates.isActive ? 1 : 0); }

    fields.push('lastUpdated = ?');
    values.push(new Date().toISOString().split('T')[0]);

    values.push(id);
    runStatement(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    persistDatabase();
  },

  delete(id: string): void {
    runStatement('DELETE FROM products WHERE id = ?', [id]);
    persistDatabase();
  },

  getCriticalStock(): Product[] {
    return (runQuery('SELECT * FROM products WHERE currentStock < minStock ORDER BY (minStock - currentStock) DESC') as any[]).map(mapProduct);
  },

  getByWarehouse(warehouse: string): Product[] {
    return (runQuery('SELECT * FROM products WHERE warehouse = ? ORDER BY name', [warehouse]) as any[]).map(mapProduct);
  },
};
