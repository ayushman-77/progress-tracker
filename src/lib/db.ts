import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:progress.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url,
  authToken,
});

// Initialize tables asynchronously
async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      leetcode_username TEXT NOT NULL,
      tuf_username TEXT NOT NULL,
      initial_lc_total INTEGER DEFAULT 0,
      initial_tuf_total INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS progress_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD format
      leetcode_easy INTEGER DEFAULT 0,
      leetcode_medium INTEGER DEFAULT 0,
      leetcode_hard INTEGER DEFAULT 0,
      tuf_total INTEGER DEFAULT 0,
      tuf_easy INTEGER DEFAULT 0,
      tuf_medium INTEGER DEFAULT 0,
      tuf_hard INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, date)
    );
  `);
}

// Call init, but don't await (top level)
initDb().catch(console.error);

export default db;
