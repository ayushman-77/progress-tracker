import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'progress.db');
const db = new Database(dbPath, { verbose: console.log });

try {
  db.exec(`
    ALTER TABLE users ADD COLUMN initial_lc_total INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN initial_tuf_total INTEGER DEFAULT 0;
  `);
  console.log('Migration successful');
} catch (e) {
  console.log('Migration error or already applied:', e.message);
}
