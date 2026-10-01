import Database from 'better-sqlite3';
import path from 'path';

let cachedDb = null;

export function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const dbPath = process.env.DATABASE_PATH || './data/db.sqlite';
  const resolvedPath = path.resolve(process.cwd(), dbPath);

  try {
    const db = new Database(resolvedPath, { verbose: console.log });
    // Enable WAL mode for concurrency handling
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('Failed to connect to SQLite database:', error);
    throw error;
  }
}
