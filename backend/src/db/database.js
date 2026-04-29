const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../licenses.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initializeDatabase = () => {
  const createTable = `
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'active',
      owner TEXT,
      description TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      expiresAt TEXT,
      updatedAt TEXT
    )
  `;
  db.exec(createTable);
};

initializeDatabase();

module.exports = db;
