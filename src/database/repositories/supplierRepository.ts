import { Supplier } from '../../app/types';
import { runQuery, runStatement, persistDatabase } from '../db';

export const supplierRepository = {
  getAll(): Supplier[] {
    return runQuery('SELECT * FROM suppliers ORDER BY name') as Supplier[];
  },

  getById(id: string): Supplier | undefined {
    const results = runQuery('SELECT * FROM suppliers WHERE id = ?', [id]) as Supplier[];
    return results[0];
  },

  create(supplier: Omit<Supplier, 'id'>): Supplier {
    const id = Date.now().toString();
    runStatement(
      `INSERT INTO suppliers (id, name, fantasyName, cuit, contact, email, phone, address, city, country, postalCode, website, vatCondition, category, paymentTerm, bankAlias, observations, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, supplier.name, supplier.fantasyName || null, supplier.cuit || null,
       supplier.contact, supplier.email, supplier.phone, supplier.address,
       supplier.city || null, supplier.country || null, supplier.postalCode || null,
       supplier.website || null, supplier.vatCondition || null, supplier.category || null,
       supplier.paymentTerm || null, supplier.bankAlias || null, supplier.observations || null,
       supplier.status]
    );
    persistDatabase();
    return { ...supplier, id };
  },

  update(id: string, updates: Partial<Supplier>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.fantasyName !== undefined) { fields.push('fantasyName = ?'); values.push(updates.fantasyName); }
    if (updates.cuit !== undefined) { fields.push('cuit = ?'); values.push(updates.cuit); }
    if (updates.contact !== undefined) { fields.push('contact = ?'); values.push(updates.contact); }
    if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
    if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
    if (updates.address !== undefined) { fields.push('address = ?'); values.push(updates.address); }
    if (updates.city !== undefined) { fields.push('city = ?'); values.push(updates.city); }
    if (updates.country !== undefined) { fields.push('country = ?'); values.push(updates.country); }
    if (updates.postalCode !== undefined) { fields.push('postalCode = ?'); values.push(updates.postalCode); }
    if (updates.website !== undefined) { fields.push('website = ?'); values.push(updates.website); }
    if (updates.vatCondition !== undefined) { fields.push('vatCondition = ?'); values.push(updates.vatCondition); }
    if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
    if (updates.paymentTerm !== undefined) { fields.push('paymentTerm = ?'); values.push(updates.paymentTerm); }
    if (updates.bankAlias !== undefined) { fields.push('bankAlias = ?'); values.push(updates.bankAlias); }
    if (updates.observations !== undefined) { fields.push('observations = ?'); values.push(updates.observations); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

    if (fields.length === 0) return;
    values.push(id);
    runStatement(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);
    persistDatabase();
  },

  delete(id: string): void {
    runStatement('DELETE FROM suppliers WHERE id = ?', [id]);
    persistDatabase();
  },

  getActive(): Supplier[] {
    return runQuery("SELECT * FROM suppliers WHERE status = 'active' ORDER BY name") as Supplier[];
  },
};
