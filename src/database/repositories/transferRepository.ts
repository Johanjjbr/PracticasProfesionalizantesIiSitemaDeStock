import { Transfer } from '../../app/types';
import { runQuery, runStatement, persistDatabase } from '../db';

export const transferRepository = {
  getAll(): Transfer[] {
    return runQuery('SELECT * FROM transfers ORDER BY createdAt DESC') as Transfer[];
  },

  getById(id: string): Transfer | undefined {
    const results = runQuery('SELECT * FROM transfers WHERE id = ?', [id]) as Transfer[];
    return results[0];
  },

  create(transfer: Omit<Transfer, 'id' | 'createdAt' | 'status'>): Transfer {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    runStatement(
      `INSERT INTO transfers (id, product, productId, quantity, sourceWarehouse, destinationWarehouse, status, operator, createdAt, estimatedDelivery)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [id, transfer.product, transfer.productId || null, transfer.quantity,
       transfer.sourceWarehouse, transfer.destinationWarehouse,
       transfer.operator, createdAt, transfer.estimatedDelivery || null]
    );
    persistDatabase();
    return { ...transfer, id, status: 'pending', createdAt };
  },

  updateStatus(id: string, status: Transfer['status']): void {
    const now = new Date().toISOString();
    const extraFields: string[] = [];
    const values: any[] = [];

    if (status === 'completed') {
      extraFields.push('completedAt = ?');
      values.push(now);
    }
    if (status === 'pending_reception') {
      extraFields.push('receivedAt = ?');
      values.push(now);
    }

    values.push(status);
    values.push(id);
    const extraSQL = extraFields.length > 0 ? ', ' + extraFields.join(', ') : '';
    runStatement(`UPDATE transfers SET status = ?${extraSQL} WHERE id = ?`, values);
    persistDatabase();
  },

  validateTransfer(id: string, quantityReceived: number, notes: string, receptionist: string): Transfer | undefined {
    const now = new Date().toISOString();
    runStatement(
      `UPDATE transfers SET status = 'completed', quantityReceived = ?, receptionNotes = ?, receptionist = ?, completedAt = ? WHERE id = ?`,
      [quantityReceived, notes, receptionist, now, id]
    );
    persistDatabase();
    return this.getById(id);
  },

  rejectTransfer(id: string, notes: string, receptionist: string): void {
    runStatement(
      `UPDATE transfers SET status = 'rejected', receptionNotes = ?, receptionist = ? WHERE id = ?`,
      [notes, receptionist, id]
    );
    persistDatabase();
  },

  getPendingReception(warehouse: string): Transfer[] {
    return runQuery(
      "SELECT * FROM transfers WHERE destinationWarehouse = ? AND status = 'pending_reception' ORDER BY createdAt DESC",
      [warehouse]
    ) as Transfer[];
  },

  getByStatus(status: string): Transfer[] {
    return runQuery('SELECT * FROM transfers WHERE status = ? ORDER BY createdAt DESC', [status]) as Transfer[];
  },
};
