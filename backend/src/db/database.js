const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../licenses.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initializeDatabase = () => {
  const createLicensesTable = `
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
  
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `;
  
  const createAuditLogTable = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ipAddress TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `;
  
  db.exec(createLicensesTable);
  db.exec(createUsersTable);
  db.exec(createAuditLogTable);
  
  // Insert default admin if not exists
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
  if (adminExists.count === 0) {
    const bcrypt = require('bcryptjs');
    const adminPass = process.env.ADMIN_PASS || 'admin';
    const hashedPass = bcrypt.hashSync(adminPass, 10);
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users (username, password, role, createdAt) VALUES (?, ?, ?, ?)')
      .run('admin', hashedPass, 'admin', now);
  }
};

initializeDatabase();

module.exports = db;
