const db = require('../db/database');

const AuditLog = {
  log: (userId, action, details, ipAddress) => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_logs (userId, action, details, ipAddress, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, action, details, ipAddress, now);
  },

  getAll: (limit = 100) => {
    return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
  },

  getByUser: (userId) => {
    return db.prepare('SELECT * FROM audit_logs WHERE userId = ? ORDER BY timestamp DESC').all(userId);
  }
};

module.exports = AuditLog;
