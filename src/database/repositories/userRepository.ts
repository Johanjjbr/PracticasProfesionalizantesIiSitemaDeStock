import { User } from '../../app/types';
import { runQuery } from '../db';

export const userRepository = {
  findByEmail(email: string): User | undefined {
    const results = runQuery('SELECT * FROM users WHERE email = ?', [email]) as any[];
    if (results.length === 0) return undefined;
    const u = results[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      warehouse: u.warehouse || undefined,
    };
  },

  validate(email: string, password: string): User | undefined {
    const results = runQuery(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    ) as any[];
    if (results.length === 0) return undefined;
    const u = results[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      warehouse: u.warehouse || undefined,
    };
  },
};
