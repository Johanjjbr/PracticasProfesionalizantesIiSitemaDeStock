import initSqlJs, { SqlJsStatic, Database } from 'sql.js';
import { INIT_SQL } from './init.sql';

const DB_NAME = 'stock_db';
const DB_STORE = 'database';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let initPromise: Promise<void> | null = null;

async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIDB(): Promise<Uint8Array | null> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get('buffer');
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function saveToIDB(buffer: Uint8Array): Promise<void> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put(buffer, 'buffer');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    SQL = await initSqlJs({
      locateFile: () => '/sql-wasm-browser.wasm',
    });

    const saved = await loadFromIDB();

    if (saved) {
      db = new SQL.Database(saved);
    } else {
      db = new SQL.Database();
      db.run(INIT_SQL);
      await persistDatabase();
    }
  })();

  return initPromise;
}

export async function persistDatabase(): Promise<void> {
  if (!db) return;
  const data = db.export();
  await saveToIDB(data);
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function runQuery(sql: string, params?: any[]): any[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function runStatement(sql: string, params?: any[]): void {
  const db = getDatabase();
  if (params) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
}
