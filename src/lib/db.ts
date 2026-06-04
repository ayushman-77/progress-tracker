import Database from 'better-sqlite3';
import path from 'path';

// Using a file-based SQLite database in the root folder
// In production (Render), we will mount a disk to /data to persist the SQLite file
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/progress.db' 
  : path.resolve(process.cwd(), 'progress.db');

// Instantiate the database
const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    leetcode_username TEXT NOT NULL,
    tuf_username TEXT NOT NULL,
    initial_lc_total INTEGER DEFAULT 0,
    initial_tuf_total INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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

export default db;
